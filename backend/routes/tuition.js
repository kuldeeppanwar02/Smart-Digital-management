const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  sendRequest, getStudentRequests, getTeacherRequests, respondToRequest,
} = require('../controllers/tuitionController');

router.post('/', protect, restrictTo('student'), sendRequest);
router.get('/student', protect, restrictTo('student'), getStudentRequests);
router.get('/teacher', protect, restrictTo('teacher'), getTeacherRequests);
router.put('/:id/respond', protect, restrictTo('teacher'), respondToRequest);

module.exports = router;
