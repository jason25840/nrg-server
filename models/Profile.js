const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  pursuits: [
    {
      pursuit: { type: String, required: true }, // e.g., "Climbing"
      level: { type: String, required: true }, // e.g., "Advanced"
    },
  ],
  accomplishments: [
    {
      type: { type: String, required: true }, // e.g., "Climbing"
      details: { type: String, required: true }, // e.g., "Route XYZ, 5.14a, Sport"
    },
  ],
  socialMediaLinks: {
    instagram: { type: String, default: '' },
    tiktok: { type: String, default: '' },
    strava: { type: String, default: '' },
    youtube: { type: String, default: '' },
  },
});

module.exports = mongoose.model('Profile', ProfileSchema);
