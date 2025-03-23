const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    snippet: { type: String, default: 'No description available.' },
    content: { type: String, required: true },
    author: { type: String, default: 'Anonymous' },
    image: {
      type: String,
      default:
        'https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=800&auto=format&fit=crop&q=60',
    },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    bookmarkedBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Article', articleSchema);
