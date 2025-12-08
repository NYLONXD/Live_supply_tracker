// D:\Professional_life\personal_projects\Live_supply_tracker\server\routes\taskRoutes.routes.js
const express = require('express');
const router = express.Router();
const {
  getAllTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatus,
} = require('../controllers/task.Controller');
const { protect, admin } = require('../middleware/auth.middleware');
const { createTaskRules, updateTaskRules, validate } = require('../middleware/validation.middleware');

// All routes require authentication and admin privileges
router.use(protect);
router.use(admin);

// Get all tasks
router.get('/', getAllTasks);

// Create a new task
router.post('/', createTaskRules, validate, createTask);

// Get a single task by ID
router.get('/:id', getTaskById);

// Update a task
router.put('/:id', updateTaskRules, validate, updateTask);

// Update task status only
router.patch('/:id/status', updateTaskStatus);

// Delete a task
router.delete('/:id', deleteTask);

module.exports = router;