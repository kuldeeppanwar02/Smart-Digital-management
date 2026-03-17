const Timetable = require('../models/Timetable');

// POST /api/timetable (Admin creates or updates a day's timetable)
const saveTimetable = async (req, res) => {
  const { className, section, dayOfWeek, periodInfo } = req.body;
  try {
    const timetable = await Timetable.findOneAndUpdate(
      { schoolId: req.user.schoolId, className, section, dayOfWeek },
      { schoolId: req.user.schoolId, className, section, dayOfWeek, periodInfo },
      { new: true, upsert: true }
    );
    res.json({ message: 'Timetable saved', timetable });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/timetable/class?className=10&section=A
const getClassTimetable = async (req, res) => {
  const { className, section } = req.query;
  try {
    const timetables = await Timetable.find({ schoolId: req.user.schoolId, className, section })
      .populate('periodInfo.teacher', 'name')
      .sort({ dayOfWeek: 1 });
    res.json(timetables);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/timetable/teacher (Teacher views their schedule)
const getTeacherTimetable = async (req, res) => {
  try {
    const timetables = await Timetable.find({ schoolId: req.user.schoolId, 'periodInfo.teacher': req.user._id })
      .populate('periodInfo.teacher', 'name');
    
    // Filter out periods that don't belong to this teacher
    const filtered = timetables.map(t => {
      const periods = t.periodInfo.filter(p => p.teacher && p.teacher._id.toString() === req.user._id.toString());
      return { _id: t._id, className: t.className, section: t.section, dayOfWeek: t.dayOfWeek, periodInfo: periods };
    }).filter(t => t.periodInfo.length > 0);

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { saveTimetable, getClassTimetable, getTeacherTimetable };
