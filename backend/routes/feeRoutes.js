const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const feesController = require('../controllers/feesController');

router.use(protect);

// Admin / Principal routes
router.post('/structure', restrictTo('school_admin', 'superadmin', 'principal'), feesController.setFeeStructure);
router.get('/structure', restrictTo('school_admin', 'superadmin', 'principal'), feesController.getFeeStructures);
router.post('/record', restrictTo('school_admin', 'superadmin', 'principal'), feesController.recordPayment);
router.get('/school/:academicYear', restrictTo('school_admin', 'superadmin', 'principal'), feesController.getSchoolFeeSummary);

// Student / Parent / Admin route
router.get('/student/:studentId/:academicYear', feesController.getStudentFeeSummary);

module.exports = router;
