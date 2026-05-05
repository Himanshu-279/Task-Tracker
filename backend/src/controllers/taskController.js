const Task = require('../models/Task');
const Project = require('../models/Project');
const { successResponse, errorResponse } = require('../utils/response');

// GET /api/projects/:projectId/tasks
exports.getTasks = async (req, res, next) => {
  try {
    const { status, priority, assignee, search } = req.query;
    const filter = { project: req.params.projectId };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('comments.author', 'name email avatar')
      .sort({ order: 1, createdAt: -1 });

    return successResponse(res, { tasks });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:projectId/tasks
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, assignee, dueDate, tags } = req.body;

    const project = await Project.findById(req.params.projectId);
    if (!project) return errorResponse(res, 'Project not found', 404);

    // Validate assignee is a project member
    if (assignee) {
      const isMember = project.members.some((m) => m.user.toString() === assignee) ||
        project.owner.toString() === assignee;
      if (!isMember) return errorResponse(res, 'Assignee must be a project member', 400);
    }

    const task = await Task.create({
      title, description, status, priority, assignee: assignee || null,
      dueDate: dueDate || null, tags: tags || [],
      project: req.params.projectId,
      createdBy: req.user._id
    });

    await task.populate('assignee', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');

    return successResponse(res, { task }, 'Task created', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:projectId/tasks/:id
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, project: req.params.projectId })
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('comments.author', 'name email avatar');

    if (!task) return errorResponse(res, 'Task not found', 404);
    return successResponse(res, { task });
  } catch (err) {
    next(err);
  }
};

// PUT /api/projects/:projectId/tasks/:id
exports.updateTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, assignee, dueDate, tags } = req.body;

    const task = await Task.findOne({ _id: req.params.id, project: req.params.projectId });
    if (!task) return errorResponse(res, 'Task not found', 404);

    // Only assignee, creator, or project admin can update
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isAssignee = task.assignee?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const project = req.project || await Project.findById(req.params.projectId);
    const isProjectAdmin = project?.members.find(
      (m) => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    ) || project?.owner.toString() === req.user._id.toString();

    if (!isCreator && !isAssignee && !isAdmin && !isProjectAdmin) {
      return errorResponse(res, 'Not authorized to update this task', 403);
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (assignee !== undefined) task.assignee = assignee || null;
    if (dueDate !== undefined) task.dueDate = dueDate || null;
    if (tags !== undefined) task.tags = tags;

    await task.save();
    await task.populate('assignee', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');

    return successResponse(res, { task }, 'Task updated');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:projectId/tasks/:id
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, project: req.params.projectId });
    if (!task) return errorResponse(res, 'Task not found', 404);

    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const project = await Project.findById(req.params.projectId);
    const isProjectAdmin = project?.members.find(
      (m) => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    ) || project?.owner.toString() === req.user._id.toString();

    if (!isCreator && !isAdmin && !isProjectAdmin) {
      return errorResponse(res, 'Not authorized to delete this task', 403);
    }

    await task.deleteOne();
    return successResponse(res, null, 'Task deleted');
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:projectId/tasks/:id/comments
exports.addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return errorResponse(res, 'Comment text is required', 400);

    const task = await Task.findOne({ _id: req.params.id, project: req.params.projectId });
    if (!task) return errorResponse(res, 'Task not found', 404);

    task.comments.push({ author: req.user._id, text: text.trim() });
    await task.save();
    await task.populate('comments.author', 'name email avatar');

    return successResponse(res, { comments: task.comments }, 'Comment added', 201);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:projectId/tasks/:id/comments/:commentId
exports.deleteComment = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, project: req.params.projectId });
    if (!task) return errorResponse(res, 'Task not found', 404);

    const comment = task.comments.id(req.params.commentId);
    if (!comment) return errorResponse(res, 'Comment not found', 404);

    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'Not authorized to delete this comment', 403);
    }

    comment.deleteOne();
    await task.save();
    return successResponse(res, null, 'Comment deleted');
  } catch (err) {
    next(err);
  }
};
