const mongoose = require('mongoose');

const schoolconfigSchema = new mongoose.Schema({
  level: [{ type: String }], // 'Preschool', 'Primary', 'Middle', 'Secondary', 'Higher Secondary'
  management: { type: String }, // 'Government', 'Private', 'Government-Aided'
  curriculum: [{ type: String }], // 'CBSE', 'CISCE', 'State Board', 'International'
  specialType: [{ type: String }] // 'General', 'Boarding', 'Alternative', 'Special', 'NIOS'
}, { _id: false });

const schoolSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String },
  address: { type: String },
  logo: { type: String }, // URL to logo image
  config: schoolconfigSchema,
  isActive: { type: Boolean, default: true } // Subscription status
}, { timestamps: true });

module.exports = mongoose.model('School', schoolSchema);
