const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  subject: { type: String, required: true },
  className: { type: String, required: true },
  section: { type: String, default: '' },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  duration: { type: String, required: true }, // e.g., "2 hours"
  room: { type: String, default: 'TBD' },
  totalMarks: { type: Number, required: true },
  instructions: { type: String, default: '' },
  examType: { type: String, enum: ['Internal', 'External', 'Board'], default: 'Internal' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
