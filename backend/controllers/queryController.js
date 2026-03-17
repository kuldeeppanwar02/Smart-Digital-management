const HelpQuery = require('../models/HelpQuery');
const User = require('../models/User');

// POST /api/queries
// A student submits a query, and it's automatically routed to their class teacher
exports.createHelpQuery = async (req, res) => {
  const { subject, message } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ message: 'Subject and message are required' });
  }

  try {
    const student = await User.findById(req.user._id);

    // Find a teacher who teaches this student's class and section
    // Preferably the 'Class Teacher' or broadly any teacher sharing the Class-Section assignment
    const targetSectionStr = `${student.className}-${student.section}`;
    
    let teacher = await User.findOne({ 
      schoolId: req.user.schoolId, 
      role: 'teacher',
      teachingClasses: student.className,
      teachingSections: targetSectionStr
    });

    if (!teacher) {
      // Fallback: search for any teacher teaching the class
      teacher = await User.findOne({
         schoolId: req.user.schoolId,
         role: 'teacher',
         teachingClasses: student.className
      });
    }

    if (!teacher) {
      return res.status(404).json({ message: 'No teacher found currently assigned to your class.' });
    }

    const query = new HelpQuery({
      schoolId: req.user.schoolId,
      student: req.user._id,
      teacher: teacher._id,
      subject,
      message
    });

    await query.save();
    res.status(201).json({ message: 'Query sent to your class teacher', query });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/queries/student
exports.getStudentQueries = async (req, res) => {
  try {
    const queries = await HelpQuery.find({ student: req.user._id })
      .populate('teacher', 'name')
      .sort({ createdAt: -1 });
    res.json(queries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/queries/teacher
exports.getTeacherQueries = async (req, res) => {
  try {
    const queries = await HelpQuery.find({ teacher: req.user._id })
      .populate('student', 'name className section rollNumber')
      .sort({ createdAt: -1 });
    res.json(queries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/queries/:id/respond
exports.respondToQuery = async (req, res) => {
  const { status, teacherReply } = req.body;
  try {
    const query = await HelpQuery.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!query) {
      return res.status(404).json({ message: 'Query not found or not assigned to you' });
    }

    query.status = status || query.status;
    if (teacherReply) query.teacherReply = teacherReply;

    await query.save();
    res.json({ message: 'Response saved successfully', query });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
