const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  className: { type: String, required: true },
  stream: { type: String, default: 'None' }, // Optional, for higher classes
  amount: { type: Number, required: true },
  academicYear: { type: String, required: true }, // e.g., '2023-2024'
}, { timestamps: true });

// Prevent duplicate fee structures for the same class/stream/year in a school
feeStructureSchema.index({ schoolId: 1, className: 1, stream: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('FeeStructure', feeStructureSchema);
