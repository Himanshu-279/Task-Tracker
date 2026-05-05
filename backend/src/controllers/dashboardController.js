const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { successResponse } = require('../utils/response');

// GET /api/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    const projectQuery = isAdmin
      ? {}
      : { $or: [{ owner: userId }, { 'members.user': userId }] };

    const projects = await Project.find(projectQuery).select('_id');
    const projectIds = projects.map((p) => p._id);

    const taskQuery = isAdmin ? {} : { project: { $in: projectIds } };
    const myTaskQuery = { ...taskQuery, assignee: userId };

    const now = new Date();

    const [
      totalProjects,
      totalTasks,
      myTasks,
      tasksByStatus,
      overdueTasks,
      recentTasks,
      upcomingTasks,
      totalUsers
    ] = await Promise.all([
      Project.countDocuments(projectQuery),
      Task.countDocuments(taskQuery),
      Task.countDocuments(myTaskQuery),
      Task.aggregate([
        { $match: taskQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Task.countDocuments({
        ...taskQuery,
        status: { $ne: 'done' },
        dueDate: { $lt: now }
      }),
      Task.find(taskQuery)
        .populate('assignee', 'name avatar')
        .populate('project', 'name color')
        .sort({ createdAt: -1 })
        .limit(5),
      Task.find({
        ...taskQuery,
        status: { $ne: 'done' },
        dueDate: { $gte: now, $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) }
      })
        .populate('assignee', 'name avatar')
        .populate('project', 'name color')
        .sort({ dueDate: 1 })
        .limit(5),
      isAdmin ? User.countDocuments() : null
    ]);

    // Normalize tasksByStatus into object
    const statusMap = { todo: 0, in_progress: 0, in_review: 0, done: 0 };
    tasksByStatus.forEach((s) => { statusMap[s._id] = s.count; });

    const stats = {
      totalProjects,
      totalTasks,
      myTasks,
      overdueTasks,
      tasksByStatus: statusMap,
      completionRate: totalTasks > 0 ? Math.round((statusMap.done / totalTasks) * 100) : 0,
      recentTasks,
      upcomingTasks,
      ...(isAdmin && { totalUsers })
    };

    return successResponse(res, { stats });
  } catch (err) {
    next(err);
  }
};

// GET /api/users (admin only)
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return successResponse(res, { users });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/:id/role (admin only)
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) {
      const { errorResponse } = require('../utils/response');
      return errorResponse(res, 'Invalid role', 400);
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    return successResponse(res, { user }, 'Role updated');
  } catch (err) {
    next(err);
  }
};
