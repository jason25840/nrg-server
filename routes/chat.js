const multer = require('multer');

const upload = multer({
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const isValid =
      file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');
    cb(null, isValid);
  },
});
const leo = require('leo-profanity');
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { authMiddleware } = require('../middleware/authMiddleware');

// Get all messages for a room
router.get('/:room', async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.room })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Post new message
router.post('/', authMiddleware, upload.single('media'), async (req, res) => {
  try {
    const { text, room } = req.body;

    let mediaUrl = null;
    if (req.file) {
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const fileUrl = `http://localhost:5001/uploads/${fileName}`;
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(
        __dirname,
        '..',
        'public',
        'uploads',
        fileName
      );
      const uploadDir = path.dirname(filePath);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      fs.writeFileSync(filePath, req.file.buffer);
      mediaUrl = fileUrl;
    }

    const fullUser = await require('../models/User')
      .findById(req.user._id)
      .select('name username');
    if (!fullUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (leo.check(text)) {
      console.log('🔍 Checking message:', text);
      console.log('🔍 Profanity check result:', leo.check(text));
      return res
        .status(400)
        .json({ message: 'Inappropriate language is not allowed.' });
    }

    // Extract mentions from the text
    const mentionMatches = text.match(/@(\w+)/g) || [];
    const mentions = mentionMatches.map((m) => m.slice(1).toLowerCase());

    const newMessage = new Message({
      sender: req.user._id,
      senderName: fullUser.name,
      senderUsername: fullUser.username,
      text,
      mentions,
      room: room || 'general',
      media: mediaUrl,
    });

    const saved = await newMessage.save();
    const populated = await saved.populate('sender', 'name avatar');

    res.status(201).json(populated);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Socket.IO emoji reaction handler
const socketHandler = (io) => {
  io.on('connection', (socket) => {
    socket.on('reactToMessage', async ({ messageId, emoji }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        if (!message.reactions.has(emoji)) {
          message.reactions.set(emoji, []);
        }

        // Prevent duplicate reactions from the same user
        const userId = socket.user?._id?.toString();
        if (userId && !message.reactions.get(emoji).includes(userId)) {
          message.reactions.get(emoji).push(userId);
          await message.save();

          io.emit('messageReaction', {
            messageId,
            emoji,
            userId,
          });
        }
      } catch (err) {
        console.error('Error handling reaction:', err);
      }
    });
  });
};

module.exports = { router, socketHandler };

// Get top media messages
router.get('/top', async (req, res) => {
  try {
    const messages = await Message.find({ media: { $ne: null } });

    const scored = messages.map((msg) => {
      const reactions = msg.reactions || new Map();
      // If using Map, convert to JS object for get()
      const getCount = (emoji) => {
        if (typeof reactions.get === 'function') {
          return (reactions.get(emoji) || []).length;
        }
        // If reactions is a plain object
        return (reactions[emoji] || []).length;
      };

      const score =
        getCount('❤️') * 2 +
        getCount('👍') +
        getCount('😂') +
        getCount('🔥') -
        getCount('👎');

      return { ...msg.toObject(), score };
    });

    const top = scored.sort((a, b) => b.score - a.score).slice(0, 4);

    res.json(top);
  } catch (err) {
    console.error('Error fetching top messages:', err);
    res.status(500).json({ message: 'Failed to fetch top content' });
  }
});
