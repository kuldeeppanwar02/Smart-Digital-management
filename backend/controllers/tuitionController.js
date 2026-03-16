const TuitionRequest = require('../models/TuitionRequest');
const User = require('../models/User');

// POST /api/tuition  (Student sends request to teacher)
const sendRequest = async (req, res) => {
  const { teacherId, subject, message, preferredTime } = req.body;
  try {
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher', isApproved: true, schoolId: req.user.schoolId });
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

    const existing = await TuitionRequest.findOne({
      student: req.user._id, teacher: teacherId, subject, status: 'pending', schoolId: req.user.schoolId,
    });
    if (existing) return res.status(400).json({ message: 'Request already pending for this subject' });

    const request = await TuitionRequest.create({
      schoolId: req.user.schoolId,
      student: req.user._id,
      teacher: teacherId,
      subject, message,
      preferredTime: preferredTime || '',
    });
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/tuition/student  (Student sees their own requests)
const getStudentRequests = async (req, res) => {
  try {
    const requests = await TuitionRequest.find({ student: req.user._id, schoolId: req.user.schoolId })
      .populate('teacher', 'name subjects')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/tuition/teacher  (Teacher sees requests made to them)
const getTeacherRequests = async (req, res) => {
  try {
    const requests = await TuitionRequest.find({ teacher: req.user._id, schoolId: req.user.schoolId })
      .populate('student', 'name rollNumber className')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/tuition/:id/respond  (Teacher accepts/rejects)
const respondToRequest = async (req, res) => {
  const { status, teacherReply } = req.body;
  try {
    const request = await TuitionRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.teacher.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not your request to respond to' });

    request.status = status;
    request.teacherReply = teacherReply || '';
    await request.save();
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { sendRequest, getStudentRequests, getTeacherRequests, respondToRequest };
