const Marks = require('../models/Marks');

// POST /api/marks  (Teacher enters marks)
const enterMarks = async (req, res) => {
  const { student, exam, subject, className, marksObtained, totalMarks, remarks } = req.body;
  try {
    const existing = await Marks.findOne({ student, exam, schoolId: req.user.schoolId });
    if (existing) {
      Object.assign(existing, { marksObtained, totalMarks, remarks });
      await existing.save();
      return res.json(existing);
    }
    const marks = await Marks.create({
      schoolId: req.user.schoolId, student, exam, subject, className, marksObtained, totalMarks,
      remarks: remarks || '', enteredBy: req.user._id,
    });
    res.status(201).json(marks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/marks/student/:studentId  (Student's all results)
const getStudentMarks = async (req, res) => {
  const studentId = req.params.studentId || req.user._id;
  if (req.user.role === 'student' && studentId.toString() !== req.user._id.toString())
    return res.status(403).json({ message: 'Access denied' });

  try {
    const marks = await Marks.find({ student: studentId })
      .populate('exam', 'subject date totalMarks')
      .sort({ createdAt: -1 });
    res.json(marks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/marks/exam/:examId  (Teacher views all marks for an exam)
const getExamMarks = async (req, res) => {
  try {
    const marks = await Marks.find({ exam: req.params.examId })
      .populate('student', 'name rollNumber')
      .sort({ marksObtained: -1 });
    res.json(marks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { enterMarks, getStudentMarks, getExamMarks };
