const User = require('../models/User');

// GET /api/parent/children
const getChildren = async (req, res) => {
  try {
    // Basic implementation: Find students where the parent's email might be stored, OR
    // using a more robust join if we had a dedicated "childIds" array. 
    // To implement the "Self-Link" we'll assume the User model has a `linkedChildren` array.
    
    // For now, let's fetch students that have been explicitly linked to this parent's account.
    const parentUser = await User.findById(req.user._id).populate('linkedChildren', '-password');
    
    // Fallback: If `linkedChildren` isn't in schema yet, this will safely return []
    res.json(parentUser.linkedChildren || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/parent/link-child
const linkChild = async (req, res) => {
  const { rollNumber } = req.body;
  if (!rollNumber) return res.status(400).json({ message: 'Roll Number is required.' });

  try {
    // 1. Find the student by exact roll number within the same school
    const student = await User.findOne({ 
      schoolId: req.user.schoolId, 
      role: 'student', 
      rollNumber: rollNumber 
    }).select('-password');

    if (!student) {
      return res.status(404).json({ message: 'No student found with this Roll Number in your school.' });
    }

    // 2. Add the student ID to the Parent's `linkedChildren` array
    const parent = await User.findById(req.user._id);
    
    if (!parent.linkedChildren) parent.linkedChildren = [];

    // Prevent duplicate linking
    if (parent.linkedChildren.includes(student._id)) {
      return res.status(400).json({ message: 'Child is already linked to your account.' });
    }

    parent.linkedChildren.push(student._id);
    await parent.save();

    res.json({ message: 'Successfully linked child.', student });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getChildren, linkChild };
