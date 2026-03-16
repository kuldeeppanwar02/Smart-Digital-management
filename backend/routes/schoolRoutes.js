const express = require('express');
const router = express.Router();
const { registerSchool } = require('../controllers/schoolController');
const { protect } = require('../middleware/auth');
const School = require('../models/School');

// Public route for new schools registering on the platform
router.post('/register', registerSchool);

// Protected route to get the configuration for the currently logged-in school
router.get('/config', protect, async (req, res) => {
  try {
    if (!req.user.schoolId) {
      return res.status(400).json({ message: 'No school associated with this user.' });
    }
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });
    
    res.json(school);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching school config' });
  }
});

module.exports = router;
