const express = require('express');
const router = express.Router();
const Event = require('../models/Events'); // Ensure you have this model

// 📌 GET /api/events - Fetch all events (Sorted by Date)
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 }); // Sorted by upcoming events
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📌 POST /api/events - Create a new event
router.post('/', async (req, res) => {
  try {
    console.log('🔍 Incoming Request Body:', req.body);

    // ✅ Ensure we don't include `_id` manually
    const { title, description, date, location, genre, image, createdBy } =
      req.body;

    if (!createdBy) {
      console.log('❌ Missing `createdBy` field:', req.body);
      return res.status(400).json({ message: 'Missing `createdBy` field' });
    }

    const newEvent = new Event({
      title,
      description,
      date,
      location,
      genre,
      image:
        image ||
        'https://plus.unsplash.com/premium_photo-1681437096333-64bc0ab6133b?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGFkdmVudHVyZSUyMGV2ZW50c3xlbnwwfHwwfHx8MA%3D%3D',
      createdBy, // ✅ This will auto-generate `_id`
    });

    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    console.error('❌ Error creating event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 📌 PUT /api/events/:id/like - Like/Unlike an event
router.put('/:id/like', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const userId = req.body.userId; // Get user ID from request
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const likedIndex = event.likes.indexOf(userId);
    if (likedIndex === -1) {
      event.likes.push(userId);
    } else {
      event.likes.splice(likedIndex, 1); // Unlike
    }

    await event.save();
    res.json(event);
  } catch (error) {
    console.error('Error liking event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📌 PUT /api/events/:id/bookmark - Bookmark/Unbookmark an event
router.put('/:id/bookmark', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const userId = req.body.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const bookmarkedIndex = event.bookmarks.indexOf(userId);
    if (bookmarkedIndex === -1) {
      event.bookmarks.push(userId);
    } else {
      event.bookmarks.splice(bookmarkedIndex, 1); // Unbookmark
    }

    await event.save();
    res.json(event);
  } catch (error) {
    console.error('Error bookmarking event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📌 DELETE /api/events/:id - Delete an event (Admin Only)
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    await event.deleteOne();
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
