const School = require('../models/School');
const User = require('../models/User');

// POST /api/schools/register
const registerSchool = async (req, res) => {
  const { adminName, adminEmail, adminPassword, schoolName, phone, address, config } = req.body;

  try {
    // 1. Check if user already exists
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    // 2. Create the School
    const school = await School.create({
      name: schoolName,
      email: adminEmail, // Can use same email
      phone,
      address,
      config,
      isActive: true
    });

    // 3. Create the School Admin User
    const adminUser = await User.create({
      schoolId: school._id,
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'school_admin',
      isApproved: true // Admins are automatically approved
    });

    res.status(201).json({
      message: 'School registered successfully!',
      school: {
        id: school._id,
        name: school.name,
      },
      admin: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      }
    });

  } catch (err) {
    console.error('School registration error:', err);
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
};

module.exports = { registerSchool };
