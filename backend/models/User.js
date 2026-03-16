const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' }, // Null for superadmin
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['superadmin', 'school_admin', 'principal', 'teacher', 'student', 'parent'],
    required: true,
  },
  // Student-specific
  rollNumber: { type: String },
  className: { type: String }, // e.g. "10-A"
  medium: { type: String, enum: ['English', 'Hindi', 'Other'] },
  stream: { type: String, enum: ['Science', 'Commerce', 'Arts', 'None'] }, // for 11/12th
  // Teacher-specific
  subjects: [{ type: String }],
  teachingClasses: [{ type: String }],
  // Common
  dob: { type: Date },
  gender: { type: String, enum: ['Boy', 'Girl', 'Male', 'Female', 'Other'] }, // Supports different wording
  fatherName: { type: String },
  phone: { type: String },
  isApproved: { type: Boolean, default: false },
  profilePic: { type: String, default: '' },
  linkedChildren: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Only populated for parents
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
