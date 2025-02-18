const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    snippet: { type: String, default: 'No description available.' }, // ✅ Default value
    content: { type: String, required: true },
    author: { type: String, default: 'Anonymous' },
    likes: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Article', articleSchema);
