const Timetable = require('../models/Timetable');

// POST /api/timetable (Admin creates or updates a day's timetable, or Class Teacher updates a specific period)
const saveTimetable = async (req, res) => {
  const { className, section, dayOfWeek, periodInfo, period, subject, room, isBaseTemplate, dateOverride, teacherId } = req.body;
  try {
    // Determine if this is a single period update from Class Teacher Builder
    if (period !== undefined && subject !== undefined) {
      // Find the existing document for this day
      let docQuery = { schoolId: req.user.schoolId, className, section, dayOfWeek, isBaseTemplate: isBaseTemplate !== undefined ? isBaseTemplate : true };
      
      if (dateOverride) {
         docQuery.dateOverride = dateOverride;
      } else {
         docQuery.dateOverride = null;
      }

      let timetable = await Timetable.findOne(docQuery);
      
      if (!timetable) {
         timetable = new Timetable({
            ...docQuery,
            periodInfo: []
         });
      }

      // Handle "Free Period" or "Cancelled" clearing logic
      if (subject === 'Free Period' || subject === 'Cancelled') {
         // remove the period or mark it empty
         timetable.periodInfo = timetable.periodInfo.filter(p => p.periodNumber !== period);
         if (subject === 'Cancelled') {
             timetable.periodInfo.push({ periodNumber: period, subject: 'Cancelled', teacher: null });
         }
      } else {
         // Find if period exists and update it, else push
         const existingIndex = timetable.periodInfo.findIndex(p => p.periodNumber === period);
         const newPeriod = { periodNumber: period, subject, room: room || '', teacher: teacherId || null };
         
         if (existingIndex > -1) {
            timetable.periodInfo[existingIndex] = newPeriod;
         } else {
            timetable.periodInfo.push(newPeriod);
         }
      }

      await timetable.save();
      return res.json({ message: 'Period updated', timetable });
    }

    // Default Admin Batch Save logic
    const timetable = await Timetable.findOneAndUpdate(
      { schoolId: req.user.schoolId, className, section, dayOfWeek, isBaseTemplate: true, dateOverride: null },
      { schoolId: req.user.schoolId, className, section, dayOfWeek, periodInfo, isBaseTemplate: true, dateOverride: null },
      { new: true, upsert: true }
    );
    res.json({ message: 'Timetable saved', timetable });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/timetable/class?className=10&section=A
const getClassTimetable = async (req, res) => {
  const { className, section, dateOverride } = req.query;
  try {
    const query = { schoolId: req.user.schoolId, className, section };
    
    // If a specific date is requested, we can optionally fetch the overrides for that date
    // For now, the endpoint returns all base templates AND overrides, and the frontend merges them
    
    const timetables = await Timetable.find(query)
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
