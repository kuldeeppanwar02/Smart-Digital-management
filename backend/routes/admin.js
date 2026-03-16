const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  getAllUsers, createUser, approveUser, updateUser, deleteUser, getTeachers, getStudents,
} = require('../controllers/adminController');

router.get('/users', protect, restrictTo('superadmin', 'school_admin', 'principal'), getAllUsers);
router.post('/users', protect, restrictTo('superadmin', 'school_admin'), createUser);
router.patch('/users/:id', protect, restrictTo('superadmin', 'school_admin'), updateUser);
router.patch('/users/:id/approve', protect, restrictTo('superadmin', 'school_admin'), approveUser);
router.delete('/users/:id', protect, restrictTo('superadmin', 'school_admin'), deleteUser);
router.get('/teachers', protect, getTeachers);
router.get('/students', protect, restrictTo('teacher', 'superadmin', 'school_admin', 'principal', 'parent'), getStudents);

module.exports = router;
