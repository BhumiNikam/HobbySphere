const express = require('express');
const {
  createPost,
  getFeed,
  getFollowingFeed,
  likePost,
  deletePost,
  downloadMedia,
  getPostById,
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
  upload.array('media', 10),
  createPost
);

/* =====================================================
   FEEDS - SPECIFIC ROUTES FIRST
===================================================== */
router.get('/', auth, getFeed);
router.get('/feed', auth, getFeed);
router.get('/feed/following', auth, getFollowingFeed);

/* =====================================================
   DOWNLOAD MEDIA - MUST BE BEFORE /:postId
   This route is more specific, so it must come first
===================================================== */
router.get('/:postId/download/:mediaIndex', auth, downloadMedia);

/* =====================================================
   POST ACTIONS
===================================================== */
router.post('/:postId/like', auth, likePost);
router.delete('/:postId', auth, deletePost);

/* =====================================================
   SINGLE POST - MUST BE LAST AMONG GET ROUTES
   ⚠️ IMPORTANT: This catches any GET /posts/:anything
   Put all specific routes BEFORE this one!
===================================================== */
router.get('/:postId', auth, getPostById);

module.exports = router;