const FeeStructure = require('../models/FeeStructure');
const FeePayment = require('../models/FeePayment');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

// POST /api/fees/structure - Admin sets the fee for a class/stream/year
exports.setFeeStructure = async (req, res) => {
  try {
    const { className, stream, amount, academicYear } = req.body;
    if (!className || !amount || !academicYear) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const structure = await FeeStructure.findOneAndUpdate(
      { schoolId: req.user.schoolId, className, stream: stream || 'None', academicYear },
      { amount: Number(amount) },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ message: 'Fee structure saved successfully', structure });
  } catch (err) {
    console.error('Error in setFeeStructure:', err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/fees/structure - Fetch all fee structures
exports.getFeeStructures = async (req, res) => {
  try {
    const structures = await FeeStructure.find({ schoolId: req.user.schoolId }).sort({ academicYear: -1, className: 1 });
    res.json(structures);
  } catch (err) {
    console.error('Error in getFeeStructures:', err);
    res.status(500).json({ message: err.message });
  }
};

// POST /api/fees/record - Admin logs a manual payment
exports.recordPayment = async (req, res) => {
  try {
    const { studentId, amountPaid, paymentMethod, remarks } = req.body;
    if (!studentId || !amountPaid) return res.status(400).json({ message: 'Missing student or amount' });

    const student = await User.findOne({ _id: studentId, schoolId: req.user.schoolId, role: 'student' });
    if (!student) return res.status(404).json({ message: 'Student not found in this school' });

    // Generate a simple unique receipt number
    const receiptNumber = 'REC-' + Date.now().toString().slice(-6) + Math.random().toString().slice(2, 5);

    const payment = await FeePayment.create({
      schoolId: req.user.schoolId,
      studentId,
      amountPaid: Number(amountPaid),
      paymentMethod,
      receiptNumber,
      remarks
    });

    res.json({ message: 'Payment recorded successfully', payment });
  } catch (err) {
    console.error('Error in recordPayment:', err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/fees/student/:studentId/:academicYear
exports.getStudentFeeSummary = async (req, res) => {
  try {
    const { studentId, academicYear } = req.params;
    
    // Ensure parent/student can only check their own fees
    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
       return res.status(403).json({ message: 'Unauthorized' });
    }
    if (req.user.role === 'parent' && !req.user.linkedChildren.includes(studentId)) {
       return res.status(403).json({ message: 'Unauthorized details for this child' });
    }

    const student = await User.findOne({ _id: studentId, schoolId: req.user.schoolId });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // 1. Find matching Fee Structure
    const structure = await FeeStructure.findOne({
      schoolId: req.user.schoolId,
      className: student.className,
      stream: student.stream || 'None',
      academicYear
    });

    const totalFee = structure ? structure.amount : 0;

    // 2. Sum up all payments
    const payments = await FeePayment.find({ schoolId: req.user.schoolId, studentId }).sort({ paymentDate: -1 });
    const totalPaid = payments.reduce((acc, curr) => acc + curr.amountPaid, 0);
    const balance = totalFee - totalPaid;

    res.json({
       totalFee,
       totalPaid,
       balance: balance < 0 ? 0 : balance,
       structureFound: !!structure,
      history: payments
    });
  } catch (err) {
    console.error('Error in getStudentFeeSummary:', err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/fees/school/:academicYear - Admin summary
exports.getSchoolFeeSummary = async (req, res) => {
  try {
    const { academicYear } = req.params;
    const students = await User.find({ schoolId: req.user.schoolId, role: 'student', isApproved: true }).select('name className rollNumber stream');
    const structures = await FeeStructure.find({ schoolId: req.user.schoolId, academicYear });
    const allPayments = await FeePayment.find({ schoolId: req.user.schoolId });

    // Build map for structures: class_stream -> amount
    const feeMap = {};
    structures.forEach(s => {
      feeMap[`${s.className}_${s.stream}`] = s.amount;
    });

    // Group payments by studentId
    const paymentMap = {};
    allPayments.forEach(p => {
       paymentMap[p.studentId] = (paymentMap[p.studentId] || 0) + p.amountPaid;
    });

    const summary = students.map(st => {
       const key = `${st.className}_${st.stream || 'None'}`;
       const totalFee = feeMap[key] || 0;
       const paid = paymentMap[st._id.toString()] || 0;
       return {
         ...st.toObject(),
         totalFee,
         paid,
         balance: totalFee - paid
       };
    });

    res.json(summary);
  } catch(err) {
    console.error('Error in getSchoolFeeSummary:', err);
    res.status(500).json({ message: err.message });
  }
};
