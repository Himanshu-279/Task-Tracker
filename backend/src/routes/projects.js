const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { protect, projectAdminOrGlobal, projectMember } = require('../middleware/auth');
const validate = require('../middleware/validate');

const projectValidation = [
  body('name').trim().notEmpty().withMessage('Project name is required').isLength({ min: 2, max: 150 }),
  body('description').optional().isLength({ max: 1000 }),
  body('status').optional().isIn(['active', 'on_hold', 'completed', 'archived']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid hex color'),
  body('dueDate').optional().isISO8601().withMessage('Invalid date')
];

router.use(protect);

router.get('/', projectController.getProjects);
router.post('/', projectValidation, validate, projectController.createProject);
router.get('/:id', projectMember, projectController.getProject);
router.put('/:id', projectAdminOrGlobal, projectValidation, validate, projectController.updateProject);
router.delete('/:id', projectAdminOrGlobal, projectController.deleteProject);
router.post('/:id/members', projectAdminOrGlobal, [
  body('email').isEmail().withMessage('Valid email required'),
  body('role').optional().isIn(['admin', 'member'])
], validate, projectController.addMember);
router.delete('/:id/members/:userId', projectAdminOrGlobal, projectController.removeMember);

module.exports = router;
