const express = require('express');
const router = express.Router();
const { createHelpQuery, getStudentQueries, getTeacherQueries, respondToQuery } = require('../controllers/queryController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('student'), createHelpQuery);
router.get('/student', protect, authorize('student'), getStudentQueries);
router.get('/teacher', protect, authorize('teacher'), getTeacherQueries);
router.put('/:id/respond', protect, authorize('teacher'), respondToQuery);

module.exports = router;
