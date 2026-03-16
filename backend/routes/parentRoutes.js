const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const { getChildren, linkChild } = require('../controllers/parentController');

router.use(protect);
router.use(restrictTo('parent'));

router.get('/children', getChildren);
router.post('/link-child', linkChild);

module.exports = router;
