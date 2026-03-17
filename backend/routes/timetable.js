const express = require('express');
const router = express.Router();
const { saveTimetable, getClassTimetable, getTeacherTimetable } = require('../controllers/timetableController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('admin', 'superadmin'), saveTimetable);
router.get('/class', protect, getClassTimetable); // Students/Parents/Teachers/Admins can view
router.get('/teacher', protect, authorize('teacher'), getTeacherTimetable);

module.exports = router;
