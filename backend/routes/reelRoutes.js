const express = require('express');
const router = express.Router();
const reelController = require('../controllers/reelController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Create reel (video upload)
router.post('/', auth, upload.single('video'), reelController.createReel);

// Get reels feed (paginated)
router.get('/', reelController.getReels);

// Get single reel
router.get('/:reelId', reelController.getReelById);

// Get user's reels
router.get('/user/:userId', reelController.getUserReels);

// Like/unlike reel
router.post('/:reelId/like', auth, reelController.likeReel);

// Increment view count
router.post('/:reelId/view', reelController.incrementView);

// Delete reel
router.delete('/:reelId', auth, reelController.deleteReel);

module.exports = router;