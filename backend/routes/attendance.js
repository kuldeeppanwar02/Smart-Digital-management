const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  markAttendance, getClassAttendance, getStudentAttendance,
} = require('../controllers/attendanceController');

// Teacher marks attendance
router.post('/mark', protect, restrictTo('teacher'), markAttendance);
// Teacher views class attendance
router.get('/class', protect, restrictTo('teacher', 'principal', 'admin'), getClassAttendance);
// Student/Teacher/Principal views student attendance
router.get('/student/:studentId', protect, getStudentAttendance);
// Student views own attendance
router.get('/my', protect, restrictTo('student'), (req, res, next) => {
  req.params.studentId = req.user._id;
  next();
}, getStudentAttendance);

module.exports = router;
