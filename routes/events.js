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

// 📌 POST /api/events - Create a new event (Admin Only)
router.post('/', async (req, res) => {
  try {
    const { title, description, date, location, genre, image, createdBy } =
      req.body;
    if (!title || !description || !date || !location || !genre) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newEvent = new Event({
      title,
      description,
      date,
      location,
      genre,
      image: image || 'https://via.placeholder.com/300',
      createdBy,
    });

    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Server error' });
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
