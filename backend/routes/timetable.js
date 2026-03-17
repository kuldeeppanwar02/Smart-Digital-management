const express = require('express');
const router = express.Router();
const { saveTimetable, getClassTimetable, getTeacherTimetable } = require('../controllers/timetableController');
const { protect, restrictTo } = require('../middleware/auth');

router.post('/', protect, restrictTo('admin', 'superadmin', 'teacher'), saveTimetable);
router.get('/class', protect, getClassTimetable); // Students/Parents/Teachers/Admins can view
router.get('/teacher', protect, restrictTo('teacher'), getTeacherTimetable);

module.exports = router;
