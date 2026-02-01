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

// ✅ ADD /me endpoint - MUST come before /:username to avoid conflicts
router.get('/me', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('followers', 'username fullName profileImage')
      .populate('following', 'username fullName profileImage')
      .populate('communities', 'name slug');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Get /me error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/suggestions', auth, getUserSuggestions);
router.get('/:username', auth, getProfile);
router.get('/:username/posts', auth, getUserPosts);
router.get('/:username/followers', auth, getFollowers);
router.get('/:username/following', auth, getFollowing);
router.post('/:userId/follow', auth, followUser);

// Image upload and removal routes
router.post('/upload-profile-image', auth, upload.single('image'), require('../controllers/userController').uploadProfileImage);
router.post('/upload-cover-image', auth, upload.single('image'), require('../controllers/userController').uploadCoverImage);
router.delete('/remove-profile-image', auth, require('../controllers/userController').removeProfileImage);
router.delete('/remove-cover-image', auth, require('../controllers/userController').removeCoverImage);

router.put('/profile', auth, updateProfile);

module.exports = router;