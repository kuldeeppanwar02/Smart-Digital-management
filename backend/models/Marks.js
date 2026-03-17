const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  subject: { type: String, required: true },
  className: { type: String, required: true },
  section: { type: String, default: '' },
  marksObtained: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  grade: { type: String },
  remarks: { type: String, default: '' },
  enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Calculate grade before saving
marksSchema.pre('save', function (next) {
  const pct = (this.marksObtained / this.totalMarks) * 100;
  if (pct >= 90) this.grade = 'A+';
  else if (pct >= 80) this.grade = 'A';
  else if (pct >= 70) this.grade = 'B+';
  else if (pct >= 60) this.grade = 'B';
  else if (pct >= 50) this.grade = 'C';
  else if (pct >= 40) this.grade = 'D';
  else this.grade = 'F';
  next();
});

module.exports = mongoose.model('Marks', marksSchema);
