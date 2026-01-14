const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const communityController = require('../controllers/communityController');

// All routes require authentication
router.use(auth);

// Community CRUD
router.post('/', upload.fields([{ name: 'coverImage', maxCount: 1 }]), communityController.createCommunity);
router.get('/', communityController.getCommunities);
router.get('/my-communities', communityController.getUserCommunities);
router.get('/:id', communityController.getCommunity);
router.put('/:id', communityController.updateCommunity);
router.delete('/:id', communityController.deleteCommunity);

// Membership
router.post('/:id/join', communityController.joinCommunity);
router.post('/:id/leave', communityController.leaveCommunity);

// Community content
router.get('/:id/posts', communityController.getCommunityPosts);
router.get('/:id/members', communityController.getCommunityMembers);

module.exports = router;