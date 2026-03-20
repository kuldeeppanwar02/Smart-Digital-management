const Marks = require('../models/Marks');
const User = require('../models/User');
const notificationController = require('./notificationController');

// POST /api/marks  (Teacher enters marks)
const enterMarks = async (req, res) => {
  const { student, exam, subject, className, marksObtained, totalMarks, remarks } = req.body;
  try {
    const existing = await Marks.findOne({ student, exam, schoolId: req.user.schoolId });
    if (existing) {
      Object.assign(existing, { marksObtained, totalMarks, remarks });
      await existing.save();
      
      // Auto-trigger Result Updated Notification
      await notificationController.createNotification(
        student,
        'Result Updated',
        `Your marks for ${subject || 'a subject'} have been updated.`,
        'Result'
      );
      
      return res.json(existing);
    }
    const marks = await Marks.create({
      schoolId: req.user.schoolId, student, exam, subject, className, marksObtained, totalMarks,
      remarks: remarks || '', enteredBy: req.user._id,
    });

    // Auto-trigger Result Published Notification
    await notificationController.createNotification(
      student,
      'Result Published',
      `Your marks for ${subject || 'a subject'} have been uploaded.`,
      'Result'
    );

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

// GET /api/marks/report-card/:studentId
const getStudentReportCard = async (req, res) => {
  const studentId = req.params.studentId || req.user._id;
  if (req.user.role === 'student' && studentId.toString() !== req.user._id.toString())
    return res.status(403).json({ message: 'Access denied' });

  try {
    const student = await User.findById(studentId).select('name rollNumber className section');
    const marks = await Marks.find({ student: studentId }).populate('exam', 'subject date totalMarks examType');
    
    let totalObtained = 0;
    let totalExpected = 0;
    const subjects = marks.map(m => {
       totalObtained += m.marksObtained;
       totalExpected += m.totalMarks;
       return {
         subject: m.subject,
         marksObtained: m.marksObtained,
         totalMarks: m.totalMarks,
         grade: m.grade,
         remarks: m.remarks,
         examType: m.exam?.examType || 'Internal',
         date: m.exam?.date
       };
    });
    
    const percentage = totalExpected > 0 ? ((totalObtained / totalExpected) * 100).toFixed(2) : 0;
    
    // Calculate rank
    const peers = await User.find({ className: student.className, section: student.section, role: 'student', schoolId: req.user.schoolId });
    const peerIds = peers.map(p => p._id);
    const allMarks = await Marks.aggregate([
      { $match: { student: { $in: peerIds } } },
      { $group: { _id: '$student', total: { $sum: '$marksObtained' } } },
      { $sort: { total: -1 } }
    ]);
    
    const rankIndex = allMarks.findIndex(m => m._id.toString() === studentId.toString());
    const rank = rankIndex !== -1 ? rankIndex + 1 : 'N/A';

    res.json({
       student,
       subjects,
       summary: {
         totalObtained,
         totalExpected,
         percentage: Number(percentage),
         rank,
         totalStudentsInClass: peers.length
       }
    });
  } catch(err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { enterMarks, getStudentMarks, getExamMarks, getStudentReportCard };
