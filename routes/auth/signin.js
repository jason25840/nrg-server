const express = require('express');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const router = express.Router();

// ✅ User Signin Route
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

    let { email, password } = req.body;
    email = email.toLowerCase().trim();
    console.log('🔎 Normalized email for lookup:', email);

    try {
      const user = await User.findOne({ email });
      if (!user) {
        console.log('🚨 No user found with this email:', email);
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      console.log('✅ User found:', user.email);

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log('🚨 Passwords do not match!');
        return res.status(400).json({ msg: 'Invalid credentials' });
      }
      const payload = { user: { _id: user._id, role: user.role } };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '1d',
      });

      // ✅ Store JWT in HttpOnly cookie
      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        sameSite: 'Strict',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      console.log('✅ Login successful. JWT stored in cookie.');

      res.json({
        user: {
          _id: user._id,
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
