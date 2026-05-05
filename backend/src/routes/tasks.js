const express = require('express');
const { body } = require('express-validator');
const router = express.Router({ mergeParams: true });
const taskController = require('../controllers/taskController');
const { protect, projectMember } = require('../middleware/auth');
const validate = require('../middleware/validate');

const taskValidation = [
  body('title').trim().notEmpty().withMessage('Task title is required').isLength({ min: 2, max: 200 }),
  body('description').optional().isLength({ max: 5000 }),
  body('status').optional().isIn(['todo', 'in_progress', 'in_review', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('dueDate').optional().isISO8601().withMessage('Invalid date'),
  body('tags').optional().isArray()
];

router.use(protect, projectMember);

router.get('/', taskController.getTasks);
router.post('/', taskValidation, validate, taskController.createTask);
router.get('/:id', taskController.getTask);
router.put('/:id', taskValidation, validate, taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.post('/:id/comments', taskController.addComment);
router.delete('/:id/comments/:commentId', taskController.deleteComment);

module.exports = router;
