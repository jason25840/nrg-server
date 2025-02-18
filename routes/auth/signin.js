const express = require('express');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');

const router = express.Router();

// @route   POST api/auth/signin
// @desc    Authenticate user & get token with role
// @access  Public
router.post(
  '/',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        console.log('🚨 No user found with this email:', email);
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      console.log('✅ User found:', user.email);
      console.log('Stored Hashed Password:', user.password);
      console.log('Entered Password:', password);

      const isMatch = await bcrypt.compare(password, user.password);
      console.log('Password Match:', isMatch);

      if (!isMatch) {
        console.log('🚨 Passwords do not match!');
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      const payload = { user: { id: user.id, role: user.role } };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

      console.log('✅ Signin successful. Sending token...');
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      console.error('🚨 Server error:', err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
