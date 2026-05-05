const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const { errorResponse } = require('../utils/response');

// Verify JWT and attach user to request
const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return errorResponse(res, 'Not authorized, no token', 401);
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return errorResponse(res, 'Not authorized, user not found', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    return errorResponse(res, 'Not authorized, invalid token', 401);
  }
};

// Restrict to admin only (global role)
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return errorResponse(res, 'Access denied: Admins only', 403);
  }
  next();
};

// Check if user is project admin or global admin
const projectAdminOrGlobal = async (req, res, next) => {
  try {
    const Project = require('../models/Project');
    const projectId = req.params.projectId || req.params.id;
    const project = await Project.findById(projectId);

    if (!project) return errorResponse(res, 'Project not found', 404);

    const isGlobalAdmin = req.user.role === 'admin';
    const isOwner = project.owner.toString() === req.user._id.toString();
    const memberEntry = project.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    const isProjectAdmin = memberEntry?.role === 'admin';

    if (!isGlobalAdmin && !isOwner && !isProjectAdmin) {
      return errorResponse(res, 'Access denied: Project admin required', 403);
    }

    req.project = project;
    next();
  } catch (err) {
    next(err);
  }
};

// Check if user is project member, admin, or owner
const projectMember = async (req, res, next) => {
  try {
    const Project = require('../models/Project');
    const projectId = req.params.projectId || req.params.id;
    const project = await Project.findById(projectId);

    if (!project) return errorResponse(res, 'Project not found', 404);

    const isGlobalAdmin = req.user.role === 'admin';
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isMember = project.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!isGlobalAdmin && !isOwner && !isMember) {
      return errorResponse(res, 'Access denied: Not a project member', 403);
    }

    req.project = project;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { protect, adminOnly, projectAdminOrGlobal, projectMember };
