const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
const register = async (req, res) => {
  const { 
    name, email, password, role, schoolId, rollNumber, className, 
    subjects, phone, dob, gender, fatherName, medium, stream, teachingClasses 
  } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    // SuperAdmin is pre-seeded; no registration allowed for superadmin or school_admin via this route
    if (role === 'superadmin' || role === 'school_admin') {
      return res.status(403).json({ message: 'Cannot register as admin here' });
    }

    if (!schoolId) {
      return res.status(400).json({ message: 'School selection is required' });
    }

    const user = await User.create({
      schoolId,
      name, email, password, role,
      rollNumber: rollNumber || '',
      className: className || '',
      subjects: subjects || [],
      teachingClasses: teachingClasses || [],
      phone: phone || '',
      dob: dob || null,
      gender: gender || 'Other',
      fatherName: fatherName || '',
      medium: medium || 'English',
      stream: stream || 'None',
      isApproved: false, // admin approves all
    });

    res.status(201).json({
      message: 'Registration successful. Wait for admin approval.',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });
    if (!user.isApproved) return res.status(403).json({ message: 'Account not approved yet. Contact admin.' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(400).json({ message: 'Invalid email or password' });

    const token = generateToken(user._id);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        className: user.className,
        subjects: user.subjects,
        rollNumber: user.rollNumber,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json(req.user);
};

module.exports = { register, login, getMe };
