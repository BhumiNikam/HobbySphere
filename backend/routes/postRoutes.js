const express = require('express');
const {
  createPost,
  getFeed,
  getFollowingFeed,
  likePost,
  deletePost,
  downloadMedia,
} = require('../controllers/postController');

const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { postLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/* =====================================================
   CREATE POST - MULTI-MEDIA SUPPORT
===================================================== */
router.post(
  '/',
  auth,
  postLimiter,
  upload.array('media', 10), // Changed from 'images' to 'media'
  createPost
);

/* =====================================================
   FEEDS
===================================================== */
router.get('/', auth, getFeed);
router.get('/feed', auth, getFeed);
router.get('/feed/following', auth, getFollowingFeed);

/* =====================================================
   POST ACTIONS
===================================================== */
router.post('/:postId/like', auth, likePost);
router.delete('/:postId', auth, deletePost);

/* =====================================================
   DOWNLOAD MEDIA
===================================================== */
router.get('/:postId/download/:mediaIndex', auth, downloadMedia);

module.exports = router;