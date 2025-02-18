const express = require('express');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const gravatar = require('gravatar');
const User = require('../../models/User');

const router = express.Router();

// @route   POST api/auth/signup
// @desc    Register user with password confirmation
// @access  Public
router.post(
  '/',
  [
    check('name', 'Name is required').notEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be 6 or more characters').isLength({
      min: 6,
    }),
    check('password2', 'Passwords do not match').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    try {
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      // Generate Gravatar URL
      const avatar = gravatar.url(email, {
        s: '200', // Size: 200px
        r: 'pg', // Rating: PG
        d: 'mm', // Default: Mystery Man (mm)
      });

      // Assign Role (defaults to 'user', can only be 'admin' manually)
      const userRole = role === 'admin' ? 'admin' : 'user';

      user = new User({
        name,
        email,
        password, // Do NOT hash here! User.js already hashes.
        avatar,
        role: userRole,
      });
      await user.save();

      const payload = { user: { id: user.id, role: user.role } };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

      res.status(201).json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
