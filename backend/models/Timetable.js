const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  className: { type: String, required: true },
  section: { type: String, required: true },
  dayOfWeek: { type: String, required: true, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
  // Phase 14 extensions
  isBaseTemplate: { type: Boolean, default: true },
  dateOverride: { type: String, default: null }, // Mapped as "YYYY-MM-DD" e.g. "2026-03-24"
  // Is it a holiday?
  isHoliday: { type: Boolean, default: false },
  
  periodInfo: [{
    periodNumber: { type: Number, required: true },
    startTime: { type: String }, // Optional to allow fluid period times
    endTime: { type: String }, // Optional
    subject: { type: String, required: true }, // e.g. "Math", "Science", "Free Period", "Cancelled"
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    room: { type: String }
  }]
}, { timestamps: true });

// Ensure uniqueness per class+section+day for BASE TEMPLATES
timetableSchema.index({ schoolId: 1, className: 1, section: 1, dayOfWeek: 1, isBaseTemplate: 1, dateOverride: 1 }, { unique: true });

module.exports = mongoose.model('Timetable', timetableSchema);
