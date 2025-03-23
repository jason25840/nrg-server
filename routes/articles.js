const { Router } = require('express');
const mongoose = require('mongoose');
const Article = require('../models/Article');
const User = require('../models/User');
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware'); // ✅ Import middlewares

const router = Router();

// 📌 GET /api/articles - Fetch all articles (Public)
router.get('/', async (req, res) => {
  try {
    const articles = await Article.find()
      .populate('likedBy', 'name')
      .select('title category content image likes likedBy bookmarkedBy');

    if (!articles || articles.length === 0) {
      return res.status(404).json({ message: 'No articles found' });
    }

    const updatedArticles = articles.map((article) => ({
      _id: article._id,
      title: article.title,
      category: article.category,
      content: article.content,
      image: article.image,
      likes: article.likes || 0,
      likedBy: article.likedBy || [],
      bookmarkedBy: article.bookmarkedBy || [],
      snippet: article.content
        ? article.content.substring(0, 100) + '...'
        : 'No description available.',
    }));

    res.json(updatedArticles);
  } catch (error) {
    console.error('Server error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 📌 GET /api/articles/:id - Fetch an article by ID (Public)
router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id); // ✅ FIXED

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    res.json(article);
  } catch (error) {
    console.error('Server error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 📌 POST /api/articles - Create a new article (Admin only)
router.post('/', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { title, category, content, image } = req.body;

    // ✅ Validate required fields
    if (!title || !category || !content) {
      return res
        .status(400)
        .json({ message: 'Title, category, and content are required.' });
    }

    // ✅ Set a default image if none is provided
    const placeholderImage =
      'https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8ZXJyb3J8ZW58MHx8MHx8fDA%3D';

    const newArticle = new Article({
      title,
      category,
      content,
      image: image || placeholderImage, // ✅ Use placeholder if no image
    });

    await newArticle.save();
    res.status(201).json(newArticle);
  } catch (error) {
    console.error('Error creating article:', error.message);
    res
      .status(500)
      .json({ message: 'Error creating article', error: error.message });
  }
});

// 📌 PUT /api/articles/:id - Update an article (Admin only)
router.put('/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id); // ✅ FIXED
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // ✅ Only update fields that were sent in the request
    if (req.body.title) article.title = req.body.title;
    if (req.body.category) article.category = req.body.category;
    if (req.body.content) article.content = req.body.content;
    if (req.body.image) article.image = req.body.image;

    await article.save();
    res.json(article);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error updating article', error: error.message });
  }
});

// 📌 DELETE /api/articles/:id - Delete an article (Admin only)
router.delete('/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id); // ✅ FIXED
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    await article.deleteOne();
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error deleting article', error: error.message });
  }
});

router.put('/:id/like', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article not found' });

    if (!userId)
      return res.status(401).json({ message: 'User not authenticated' });

    // Check if user already liked the article
    const likeIndex = article.likedBy.indexOf(userId);

    if (likeIndex === -1) {
      // ✅ If not liked, add the user to likedBy array
      article.likedBy.push(userId);
      article.likes += 1;
    } else {
      // ✅ If already liked, remove the user from likedBy array
      article.likedBy.splice(likeIndex, 1);
      article.likes -= 1;
    }

    await article.save();

    res.json({
      likes: article.likes,
      likedBy: article.likedBy,
    });
  } catch (error) {
    console.error('Error updating likes:', error);
    res
      .status(500)
      .json({ message: 'Error updating likes', error: error.message });
  }
});

router.put('/:id/bookmark', async (req, res) => {
  try {
    const articleId = req.params.id;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      return res.status(400).json({ message: 'Invalid article ID' });
    }

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // ✅ Ensure bookmarkedBy exists
    if (!Array.isArray(article.bookmarkedBy)) {
      article.bookmarkedBy = [];
    }

    const alreadyBookmarked = article.bookmarkedBy.includes(userId);

    if (alreadyBookmarked) {
      article.bookmarkedBy = article.bookmarkedBy.filter(
        (id) => id.toString() !== userId
      );
    } else {
      article.bookmarkedBy.push(userId);
    }

    await article.save();

    res.json({
      bookmarks: article.bookmarkedBy.length,
      bookmarkedBy: article.bookmarkedBy,
    });
  } catch (error) {
    console.error('❌ Error bookmarking article:', error);
    res.status(500).json({
      message: 'Error updating bookmark',
      error: error.message,
    });
  }
});

module.exports = router;
