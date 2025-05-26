const express = require('express');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const User = require('../../models/User');
const { authMiddleware } = require('../../middleware/authMiddleware'); // Corrected import

const router = express.Router();

// @route   GET /api/auth/user
// @desc    Get the authenticated user's details
// @access  Private
router.get('/user', authMiddleware, async (req, res) => {
  try {
    // Fetch the user from the database, excluding the password
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/auth/update-password
// @desc    Allow authenticated users to update their password
// @access  Private
router.put(
  '/update-password',
  [
    authMiddleware, // Ensure user is logged in
    check('oldPassword', 'Old password is required').notEmpty(),
    check('newPassword', 'New password must be 6 or more characters').isLength({
      min: 6,
    }),
    check('newPassword2', 'Passwords do not match').custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { oldPassword, newPassword } = req.body;

    try {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      // Compare old password
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Old password is incorrect' });
      }

      // Update password (hashed automatically in User.js)
      user.password = newPassword;
      await user.save();

      res.json({ msg: 'Password updated successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// ✅ Signout Route (Clears Cookie & Requires Auth)
router.post('/signout', authMiddleware, (req, res) => {
  try {
    res.cookie('jwt', '', { httpOnly: true, expires: new Date(0) }); // Clears cookie
    return res.json({ msg: 'Logged out successfully' });
  } catch (error) {
    console.error('❌ Signout Error:', error);
    return res.status(500).json({ msg: 'Internal Server Error' });
  }
});

module.exports = router;
