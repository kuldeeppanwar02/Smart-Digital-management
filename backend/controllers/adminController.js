const User = require('../models/User');

// GET /api/admin/users  - All users for THIS school
const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = { schoolId: req.user.schoolId };
    if (role) filter.role = role;
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/admin/users  - Admin creates user for THIS school
const createUser = async (req, res) => {
  try {
    const existing = await User.findOne({ email: req.body.email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });
    const user = await User.create({ ...req.body, schoolId: req.user.schoolId, isApproved: true });
    res.status(201).json({ message: 'User created', user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/admin/users/:id/approve  - Approve a pending user
const approveUser = async (req, res) => {
  try {
    const { rollNumber, className } = req.body;
    const updatePayload = { isApproved: true };
    if (rollNumber) updatePayload.rollNumber = rollNumber;
    if (className) updatePayload.className = className;

    const user = await User.findByIdAndUpdate(req.params.id, updatePayload, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User approved', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/admin/users/:id
const updateUser = async (req, res) => {
  try {
    const allowedUpdates = [
      'name', 'phone', 'rollNumber', 'className', 'medium', 
      'stream', 'subjects', 'teachingClasses', 'dob', 'gender', 'fatherName'
    ];
    
    const updateData = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        // Handle empty strings for Date fields like 'dob' to prevent Mongoose cast errors
        if (req.body[key] === '') {
          updateData[key] = null;
        } else {
          updateData[key] = req.body[key];
        }
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({ message: 'User profile updated successfully', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/teachers  - All approved teachers (for student to search)
const getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ schoolId: req.user.schoolId, role: 'teacher', isApproved: true })
      .select('name subjects classesAssigned email phone');
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/students?className=10-A  - Students in a class
const getStudents = async (req, res) => {
  try {
    const filter = { schoolId: req.user.schoolId, role: 'student', isApproved: true };
    if (req.query.className) filter.className = req.query.className;
    const students = await User.find(filter).select('name rollNumber className email phone');
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllUsers, createUser, approveUser, updateUser, deleteUser, getTeachers, getStudents };
