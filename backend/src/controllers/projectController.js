const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

// GET /api/projects
exports.getProjects = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    const query = isAdmin
      ? {}
      : { $or: [{ owner: userId }, { 'members.user': userId }] };

    const projects = await Project.find(query)
      .populate('owner', 'name email avatar role')
      .populate('members.user', 'name email avatar role')
      .sort({ updatedAt: -1 });

    // Attach task counts
    const projectIds = projects.map((p) => p._id);
    const taskCounts = await Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: '$project', total: { $sum: 1 }, done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } } } }
    ]);
    const countMap = {};
    taskCounts.forEach((t) => { countMap[t._id.toString()] = t; });

    const enriched = projects.map((p) => {
      const obj = p.toJSON();
      const counts = countMap[p._id.toString()] || { total: 0, done: 0 };
      obj.taskCount = counts.total;
      obj.completedTaskCount = counts.done;
      return obj;
    });

    return successResponse(res, { projects: enriched });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects
exports.createProject = async (req, res, next) => {
  try {
    const { name, description, status, priority, color, dueDate } = req.body;
    const project = await Project.create({
      name, description, status, priority, color, dueDate,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }]
    });
    await project.populate('owner', 'name email avatar role');
    return successResponse(res, { project }, 'Project created', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:id
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar role')
      .populate('members.user', 'name email avatar role');
    if (!project) return errorResponse(res, 'Project not found', 404);
    return successResponse(res, { project });
  } catch (err) {
    next(err);
  }
};

// PUT /api/projects/:id
exports.updateProject = async (req, res, next) => {
  try {
    const { name, description, status, priority, color, dueDate } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description, status, priority, color, dueDate },
      { new: true, runValidators: true }
    ).populate('owner', 'name email avatar role').populate('members.user', 'name email avatar role');

    if (!project) return errorResponse(res, 'Project not found', 404);
    return successResponse(res, { project }, 'Project updated');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:id
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return errorResponse(res, 'Project not found', 404);

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    return successResponse(res, null, 'Project deleted');
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:id/members
exports.addMember = async (req, res, next) => {
  try {
    const { email, role = 'member' } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return errorResponse(res, 'User not found with this email', 404);

    const project = await Project.findById(req.params.id);
    if (!project) return errorResponse(res, 'Project not found', 404);

    const alreadyMember = project.members.some((m) => m.user.toString() === user._id.toString());
    if (alreadyMember) return errorResponse(res, 'User is already a member', 409);

    project.members.push({ user: user._id, role });
    await project.save();
    await project.populate('members.user', 'name email avatar role');

    return successResponse(res, { project }, 'Member added');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:id/members/:userId
exports.removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return errorResponse(res, 'Project not found', 404);

    if (project.owner.toString() === req.params.userId) {
      return errorResponse(res, 'Cannot remove project owner', 400);
    }

    project.members = project.members.filter((m) => m.user.toString() !== req.params.userId);
    await project.save();
    return successResponse(res, null, 'Member removed');
  } catch (err) {
    next(err);
  }
};
