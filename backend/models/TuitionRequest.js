const mongoose = require('mongoose');

const tuitionRequestSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  teacherReply: { type: String, default: '' },
  preferredTime: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('TuitionRequest', tuitionRequestSchema);
