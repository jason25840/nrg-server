const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    genre: { type: String, required: true }, // e.g., "Running", "Climbing", "Festival"
    image: { type: String, default: 'https://via.placeholder.com/300' },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of user IDs who liked
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of user IDs who bookmarked
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
