const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');
const User = require('../models/User');

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

// ✅ POST /api/events - Create a new event
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, date, location, genre, image } = req.body;
    const createdBy = req.user._id; // ✅ Securely use the authenticated user

    const newEvent = new Event({
      title,
      description,
      date,
      location,
      genre,
      image:
        image ||
        'https://plus.unsplash.com/premium_photo-1681437096333-64bc0ab6133b?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGFkdmVudHVyZSUyMGV2ZW50c3xlbnwwfHwwfHx8MA%3D%3D',
      createdBy,
    });

    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    console.error('❌ Error creating event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ✅ GET /api/events/:id - Fetch a single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    console.error('Error fetching single event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ PUT /api/events/:id/like - Like/Unlike an event
router.put('/:id/like', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const userId = req.user._id; // ✅ Securely extracted from JWT cookie

    const likedIndex = event.likes.indexOf(userId.toString());
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

// 📌 PUT /api/events/:id - Only creator or admin can update
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const userId = req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (event.createdBy.toString() !== userId && !isAdmin) {
      return res
        .status(403)
        .json({ message: 'Unauthorized to update this event' });
    }

    const updates = req.body;
    Object.assign(event, updates);
    const updated = await event.save();

    res.json(updated);
  } catch (error) {
    console.error('❌ Error updating event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ✅ PUT /api/events/:id/bookmark - Bookmark/Unbookmark an event
router.put('/:id/bookmark', authMiddleware, async (req, res) => {
  console.log('🔁 Bookmark toggle hit');

  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const userId = req.user._id.toString();
    const alreadyBookmarked = event.bookmarks.some(
      (id) => id.toString() === userId
    );

    // Toggle bookmark on event
    if (alreadyBookmarked) {
      event.bookmarks = event.bookmarks.filter(
        (id) => id.toString() !== userId
      );
      console.log('✅ Unbookmarked event');
    } else {
      event.bookmarks.push(req.user._id);
      console.log('✅ Bookmarked event');
    }

    await event.save();

    // Update user's saved events
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (alreadyBookmarked) {
      user.bookmarkedEvents = user.bookmarkedEvents.filter(
        (id) => id.toString() !== event._id.toString()
      );
    } else {
      user.bookmarkedEvents.push(event._id);
    }

    await user.save();

    res.json({
      event,
      action: alreadyBookmarked ? 'unbookmarked' : 'bookmarked',
    });
  } catch (error) {
    console.error('❌ Error bookmarking event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 📌 DELETE /api/events/:id - Only creator or admin can delete
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const userId = req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (event.createdBy.toString() !== userId && !isAdmin) {
      return res
        .status(403)
        .json({ message: 'Unauthorized to delete this event' });
    }

    await event.deleteOne();
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
