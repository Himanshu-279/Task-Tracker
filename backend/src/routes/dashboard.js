const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard', dashboardController.getDashboard);
router.get('/users', adminOnly, dashboardController.getUsers);
router.put('/users/:id/role', adminOnly, dashboardController.updateUserRole);

module.exports = router;
