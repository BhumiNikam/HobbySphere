const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { toggleBookmark, getBookmarks } = require('../controllers/bookmarkController');

router.post('/posts/:postId/bookmark', auth, toggleBookmark);
router.get('/bookmarks', auth, getBookmarks);

module.exports = router;