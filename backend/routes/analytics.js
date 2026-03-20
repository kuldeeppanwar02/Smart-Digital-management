const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Endpoint for Admin Dashboard Recharts
router.get(
  '/admin-overview', 
  authMiddleware, 
  roleMiddleware(['superadmin', 'school_admin', 'principal']), 
  analyticsController.getAdminAnalytics
);

// Endpoint for Student Risk & AI Recommendations
router.get(
  '/student-risk/:id',
  authMiddleware,
  analyticsController.getStudentRiskProfile
);

module.exports = router;
