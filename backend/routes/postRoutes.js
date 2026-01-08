const express = require('express');
const { createPost, getFeed, getFollowingFeed, likePost, deletePost } = require('../controllers/postController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { postLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/', auth, postLimiter, upload.array('images', 4), createPost);
router.get('/feed', auth, getFeed);
router.get('/feed/following', auth, getFollowingFeed); // ADD THIS
router.post('/:postId/like', auth, likePost);
router.delete('/:postId', auth, deletePost);

module.exports = router;