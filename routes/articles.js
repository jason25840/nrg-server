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
      .populate('createdBy', 'name')
      .select(
        'title category content image likes likedBy bookmarkedBy author createdBy'
      );

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
      author: article.author,
      createdBy: article.createdBy,
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
    const article = await Article.findById(req.params.id);

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
    const { title, category, content, image, author } = req.body;

    if (!title || !category || !content || !author) {
      return res.status(400).json({
        message: 'Title, category, content, and author are required.',
      });
    }

    const placeholderImage = '/images/placeholder.png';

    console.log('🛠 Incoming Article Data:', {
      title,
      category,
      content,
      author,
      image,
      createdBy: req.user?.id,
    });

    console.log('🧾 Authenticated User:', req.user);

    const newArticle = new Article({
      title,
      category,
      content,
      author,
      image: image || placeholderImage,
      createdBy: req.user._id,
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
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    if (req.body.title) article.title = req.body.title;
    if (req.body.category) article.category = req.body.category;
    if (req.body.content) article.content = req.body.content;
    if (req.body.image) article.image = req.body.image;
    if (req.body.author) article.author = req.body.author;

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
    const article = await Article.findById(req.params.id);
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

// 📌 PUT /api/articles/:id/like - Like an article
router.put('/:id/like', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    const article = await Article.findById(req.params.id);

    if (!article) return res.status(404).json({ message: 'Article not found' });
    if (!userId)
      return res.status(401).json({ message: 'User not authenticated' });

    const alreadyLiked = article.likedBy.includes(userId);

    const update = alreadyLiked
      ? {
          $pull: { likedBy: userId },
          $inc: { likes: -1 },
        }
      : {
          $addToSet: { likedBy: userId },
          $inc: { likes: 1 },
        };

    await Article.updateOne({ _id: req.params.id }, update);

    const updatedArticle = await Article.findById(req.params.id).select(
      'likes likedBy'
    );

    res.json({
      likes: updatedArticle.likes,
      likedBy: updatedArticle.likedBy,
    });
  } catch (error) {
    console.error('Error updating likes:', error);
    res
      .status(500)
      .json({ message: 'Error updating likes', error: error.message });
  }
});

// 📌 PUT /api/articles/:id/bookmark - Bookmark/Unbookmark an article
router.put('/:id/bookmark', authMiddleware, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article not found' });

    const userId = req.user._id.toString();

    const alreadyBookmarked = article.bookmarkedBy.some(
      (id) => id.toString() === userId
    );

    if (alreadyBookmarked) {
      article.bookmarkedBy = article.bookmarkedBy.filter(
        (id) => id.toString() !== userId
      );
    } else {
      article.bookmarkedBy.push(req.user._id);
    }

    await article.save();

    res.json({
      article,
      action: alreadyBookmarked ? 'unbookmarked' : 'bookmarked',
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
