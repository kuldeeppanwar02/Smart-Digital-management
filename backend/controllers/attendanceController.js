const Attendance = require('../models/Attendance');
const User = require('../models/User');

// POST /api/attendance/mark  (Teacher marks attendance for a class)
const markAttendance = async (req, res) => {
  const { className, section, subject, date, records } = req.body;
  
  if (req.user.role === 'teacher') {
    const hasClass = req.user.teachingClasses?.includes(className);
    const hasSection = req.user.teachingSections?.includes(`${className}-${section}`);
    const hasSubject = req.user.subjects?.includes(subject);

    if (!hasClass || !hasSection || !hasSubject) {
      return res.status(403).json({ message: 'Not authorized to mark attendance for this specific class, section, or subject.' });
    }
  }

  try {
    const ops = records.map(({ studentId, status }) => ({
      updateOne: {
        filter: { schoolId: req.user.schoolId, student: studentId, date: new Date(date), subject },
        update: {
          $set: {
            schoolId: req.user.schoolId,
            student: studentId,
            teacher: req.user._id,
            className,
            section: section || '',
            subject,
            date: new Date(date),
            status,
          },
        },
        upsert: true,
      },
    }));
    await Attendance.bulkWrite(ops);
    res.json({ message: 'Attendance recorded successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/attendance/class?className=10&section=A&subject=Math&date=2026-03-16
const getClassAttendance = async (req, res) => {
  const { className, section, subject, date } = req.query;
  try {
    const filter = { schoolId: req.user.schoolId, className };
    if (section) filter.section = section;
    if (subject) filter.subject = subject;
    if (date) filter.date = new Date(date);

    const records = await Attendance.find(filter)
      .populate('student', 'name rollNumber')
      .sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/attendance/student/:studentId  (Student views own attendance)
const getStudentAttendance = async (req, res) => {
  const studentId = req.params.studentId || req.user._id;

  // Students can only view their own
  if (req.user.role === 'student' && studentId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const records = await Attendance.find({ schoolId: req.user.schoolId, student: studentId })
      .populate('teacher', 'name')
      .sort({ date: -1 });

    // Summary stats
    const total = records.length;
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const late = records.filter((r) => r.status === 'late').length;
    const percentage = total ? ((present / total) * 100).toFixed(1) : 0;

    res.json({ records, summary: { total, present, absent, late, percentage } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { markAttendance, getClassAttendance, getStudentAttendance };
