const express = require('express');
const { 
  getProfile, 
  getUserPosts, 
  followUser, 
  updateProfile,
  getFollowers,
  getFollowing,
  getUserSuggestions
} = require('../controllers/userController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/suggestions', auth, getUserSuggestions);
router.get('/:username', auth, getProfile);
router.get('/:username/posts', auth, getUserPosts);
router.get('/:username/followers', auth, getFollowers); // ADD
router.get('/:username/following', auth, getFollowing); // ADD
router.post('/:userId/follow', auth, followUser);

// Image upload and removal routes
router.post('/upload-profile-image', auth, upload.single('image'), require('../controllers/userController').uploadProfileImage);
router.post('/upload-cover-image', auth, upload.single('image'), require('../controllers/userController').uploadCoverImage);
router.delete('/remove-profile-image', auth, require('../controllers/userController').removeProfileImage);
router.delete('/remove-cover-image', auth, require('../controllers/userController').removeCoverImage);

router.put('/profile', auth, updateProfile);

module.exports = router;