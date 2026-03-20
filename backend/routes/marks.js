const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const { enterMarks, getStudentMarks, getExamMarks, getStudentReportCard } = require('../controllers/marksController');

router.post('/', protect, restrictTo('teacher', 'admin'), enterMarks);
router.get('/report-card/:studentId', protect, getStudentReportCard);
router.get('/student/:studentId', protect, getStudentMarks);
router.get('/my', protect, restrictTo('student'), (req, res, next) => {
  req.params.studentId = req.user._id;
  next();
}, getStudentMarks);
router.get('/exam/:examId', protect, restrictTo('teacher', 'principal', 'admin'), getExamMarks);

module.exports = router;
