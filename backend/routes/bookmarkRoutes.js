const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  toggleBookmark,
  getBookmarks,
  checkBookmark
} = require('../controllers/bookmarkController');

// All routes require authentication
router.use(auth);

// Toggle bookmark
router.post('/:postId', toggleBookmark);

// Get user's bookmarks
router.get('/', getBookmarks);

// Check if post is bookmarked
router.get('/check/:postId', checkBookmark);

module.exports = router;