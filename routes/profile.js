const express = require('express');
const { validateProfileUpdate } = require('../middleware/validationMiddleware');
const { authMiddleware } = require('../middleware/authMiddleware');
const Profile = require('../models/Profile');

const router = express.Router();

// Fetch profile
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    // Ensure userId exists
    if (!req.params.userId) {
      return res.status(400).json({ msg: 'User ID is required' });
    }

    // Fetch profile
    const profile = await Profile.findOne({ user: req.params.userId });

    if (!profile) {
      return res.status(200).json({ msg: 'No profile found', profile: null });
    }

    res.json(profile);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Create profile
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { pursuits, accomplishments, socialMediaLinks } = req.body;

    // Ensure a profile doesn't already exist
    let profile = await Profile.findOne({ user: req.user.id });

    if (profile) {
      return res.status(400).json({ msg: 'Profile already exists' });
    }

    // Create a new profile
    profile = new Profile({
      user: req.user.id,
      pursuits: pursuits || [],
      accomplishments: accomplishments || [],
      socialMediaLinks: socialMediaLinks || {
        instagram: '',
        tiktok: '',
        strava: '',
        youtube: '',
      },
    });

    await profile.save();
    res.status(201).json(profile);
  } catch (err) {
    console.error('Error creating profile:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update profile
router.put(
  '/:userId',
  [authMiddleware, validateProfileUpdate],
  async (req, res) => {
    const { pursuits, accomplishments, socialMediaLinks } = req.body;

    try {
      const profile = await Profile.findOneAndUpdate(
        { user: req.params.userId },
        { pursuits, accomplishments, socialMediaLinks },
        { new: true, runValidators: true }
      );

      if (!profile) {
        return res.status(404).json({ msg: 'Profile not found' });
      }

      res.json(profile);
    } catch (err) {
      console.error('Error updating profile:', err);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

// Delete profile
router.delete('/:userId', authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOneAndDelete({ user: req.params.userId });
    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }
    res.json({ msg: 'Profile deleted successfully' });
  } catch (err) {
    console.error('Error deleting profile:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
