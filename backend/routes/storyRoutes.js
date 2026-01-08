const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createStory,
  getStoriesFeed,
  getMyStories,
  viewStory,
  getStoryViewers,
  reactToStory, // NEW
  deleteStory
} = require('../controllers/storyController');
// @route   POST /api/stories/:storyId/react
// @desc    React to a story
router.post('/:storyId/react', auth, reactToStory); // NEW ROUTE

// @route   POST /api/stories
// @desc    Create a new story
router.post('/', auth, createStory);

// @route   GET /api/stories/feed
// @desc    Get stories from following users
router.get('/feed', auth, getStoriesFeed);

// @route   GET /api/stories/my-stories
// @desc    Get user's own stories
router.get('/my-stories', auth, getMyStories);

// @route   POST /api/stories/:storyId/view
// @desc    Mark story as viewed
router.post('/:storyId/view', auth, viewStory);

// @route   GET /api/stories/:storyId/viewers
// @desc    Get list of viewers for a story
router.get('/:storyId/viewers', auth, getStoryViewers);

// @route   DELETE /api/stories/:storyId
// @desc    Delete a story
router.delete('/:storyId', auth, deleteStory);

module.exports = router;