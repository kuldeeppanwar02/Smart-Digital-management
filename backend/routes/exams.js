const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const { createExam, getExams, updateExam, deleteExam } = require('../controllers/examController');

router.post('/', protect, restrictTo('teacher', 'admin'), createExam);
router.get('/', protect, getExams);
router.put('/:id', protect, restrictTo('teacher', 'admin'), updateExam);
router.delete('/:id', protect, restrictTo('teacher', 'admin', 'principal'), deleteExam);

module.exports = router;
