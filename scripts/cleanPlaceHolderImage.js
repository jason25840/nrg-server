// server/scripts/cleanPlaceholderImages.js

require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
}

async function cleanImages() {
  try {
    const result = await Event.deleteMany({
      image: {
        $in: [
          '/images/NRG_Image_Placeholder.png',
          'https://via.placeholder.com/300',
        ],
      },
    });

    console.log(
      `🧹 Deleted ${result.deletedCount} event(s) using placeholder images`
    );
  } catch (err) {
    console.error('❌ Failed to clean images:', err.message);
  } finally {
    mongoose.connection.close();
  }
}

(async () => {
  await connectDB();
  await cleanImages();
})();
