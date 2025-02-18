const express = require('express');
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware');
const User = require('../models/User');

const router = express.Router();

// 📌 GET /api/admin/users - Admins only
router.get('/users', authMiddleware, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ msg: 'Error fetching users' });
  }
});

router.put('/make-admin/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.role = 'admin';
    await user.save();

    res.json({ msg: 'User is now an admin', user });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
