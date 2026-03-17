const express = require('express');
const router = express.Router();
const { createHelpQuery, getStudentQueries, getTeacherQueries, respondToQuery } = require('../controllers/queryController');
const { protect, restrictTo } = require('../middleware/auth');

router.post('/', protect, restrictTo('student'), createHelpQuery);
router.get('/student', protect, restrictTo('student'), getStudentQueries);
router.get('/teacher', protect, restrictTo('teacher'), getTeacherQueries);
router.put('/:id/respond', protect, restrictTo('teacher'), respondToQuery);

module.exports = router;
