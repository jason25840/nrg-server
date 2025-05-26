const mongoose = require('mongoose');
const User = require('../models/User'); // adjust path if needed
require('dotenv').config({ path: __dirname + '/../.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/your-db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.once('open', () => {
  console.log(`🛢️ Connected to DB: ${mongoose.connection.name}`);
});
async function updateMissingUsernames() {
  try {
    const users = await User.find({});
    console.log(`🔍 Found ${users.length} users`);
    for (const user of users) {
      if (!user.username || user.username.length < 3) {
        user.username =
          user.name?.toLowerCase().replace(/\s+/g, '') +
          Math.floor(Math.random() * 1000);
        await user.save();
        console.log(
          `✅ Updated user ${user.email} with username: ${user.username}`
        );
      }
    }
    console.log('🎉 Username update complete');
  } catch (err) {
    console.error('❌ Error updating users:', err);
  } finally {
    mongoose.connection.close();
  }
}

updateMissingUsernames();
