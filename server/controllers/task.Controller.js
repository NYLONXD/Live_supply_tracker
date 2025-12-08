const Task = require('../models/Task.models');
const asyncHandler = require('../utils/asyncHandle.utils');
const logger = require('../utils/logger.utils');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private/Admin
exports.getAllTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find().sort({ createdAt: -1 });
  res.status(200).json(tasks);
});

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private/Admin
exports.createTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, dueDate, assignedTo } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  const task = await Task.create({
    title,
    description,
    status: status || 'pending',
    priority: priority || 'medium',
    dueDate,
    assignedTo,
    createdBy: req.user._id,
  });

  logger.info(`Task created: ${task._id}`);
  res.status(201).json(task);
});

// @desc    Get a single task by ID
// @route   GET /api/tasks/:id
// @access  Private/Admin
exports.getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  res.status(200).json(task);
});

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private/Admin
exports.updateTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, dueDate, assignedTo } = req.body;

  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  // Update fields if provided
  if (title) task.title = title;
  if (description) task.description = description;
  if (status) task.status = status;
  if (priority) task.priority = priority;
  if (dueDate) task.dueDate = dueDate;
  if (assignedTo) task.assignedTo = assignedTo;

  await task.save();

  logger.info(`Task updated: ${task._id}`);
  res.status(200).json(task);
});

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
exports.deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id);

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  logger.info(`Task deleted: ${task._id}`);
  res.status(200).json({ message: 'Task deleted successfully' });
});

// @desc    Update task status
// @route   PATCH /api/tasks/:id/status
// @access  Private/Admin
exports.updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  logger.info(`Task status updated: ${task._id} to ${status}`);
  res.status(200).json(task);
});
