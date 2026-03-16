const mongoose = require('mongoose');

const feePaymentSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amountPaid: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  paymentMethod: { type: String, enum: ['Cash', 'Bank Transfer', 'Check', 'Other'], default: 'Cash' },
  receiptNumber: { type: String, required: true },
  remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('FeePayment', feePaymentSchema);
