const express = require('express');
const {
  createPost,
  getFeed,
  getFollowingFeed,
  likePost,
  deletePost,
} = require('../controllers/postController');

const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { postLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/* =====================================================
   CREATE POST
===================================================== */
router.post(
  '/',
  auth,
  postLimiter,
  upload.array('images', 4),
  createPost
);

/* =====================================================
   FEEDS
===================================================== */
// ✅ FIX: Add route for /api/posts (For You feed - all posts)
router.get('/', auth, getFeed);

router.get('/feed', auth, getFeed);
router.get('/feed/following', auth, getFollowingFeed);

/* =====================================================
   POST ACTIONS
===================================================== */
router.post('/:postId/like', auth, likePost);
router.delete('/:postId', auth, deletePost);

module.exports = router;