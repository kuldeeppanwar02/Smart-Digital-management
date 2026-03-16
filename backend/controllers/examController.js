const Exam = require('../models/Exam');

// POST /api/exams  (Teacher creates exam)
const createExam = async (req, res) => {
  try {
    const exam = await Exam.create({ ...req.body, schoolId: req.user.schoolId, createdBy: req.user._id });
    res.status(201).json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/exams?className=10-A  (Get exams for a class)
const getExams = async (req, res) => {
  try {
    const filter = { schoolId: req.user.schoolId };
    if (req.query.className) filter.className = req.query.className;
    const exams = await Exam.find(filter)
      .populate('createdBy', 'name')
      .sort({ date: 1 });
    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/exams/:id  (Teacher updates exam details)
const updateExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (exam.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });

    Object.assign(exam, req.body);
    await exam.save();
    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/exams/:id
const deleteExam = async (req, res) => {
  try {
    await Exam.findByIdAndDelete(req.params.id);
    res.json({ message: 'Exam deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createExam, getExams, updateExam, deleteExam };
