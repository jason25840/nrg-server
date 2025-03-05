const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    snippet: { type: String, default: 'No description available.' }, // ✅ Default value
    content: { type: String, required: true },
    author: { type: String, default: 'Anonymous' },
    image: {
      type: String,
      default:
        'https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=800&auto=format&fit=crop&q=60',
    }, // ✅ Added default image
    likes: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Article', articleSchema);
