// scripts/fixArticles.js
const mongoose = require('mongoose');
const Article = require('../models/Article'); // adjust path if needed
const User = require('../models/User'); // to fetch some admin user

require('dotenv').config();

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const admin = await User.findOne({ role: 'admin' });
  if (!admin) throw new Error('No admin user found');

  const articles = await Article.find({ createdBy: { $exists: false } });

  for (const article of articles) {
    article.createdBy = admin._id;
    await article.save();
    console.log(`✅ Fixed article: ${article.title}`);
  }

  console.log('✅ Done.');
  process.exit();
})();
