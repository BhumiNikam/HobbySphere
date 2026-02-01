  const User = require('../models/User');
  const cloudinary = require('../config/cloudinary');
  const Post = require('../models/Post');
  const { createNotification } = require('../utils/notifications');

  // Get user profile
  exports.getProfile = async (req, res) => {
    try {
      const user = await User.findOne({ username: req.params.username })
        .select('-password')
        .populate('followers', 'username fullName profileImage')
        .populate('following', 'username fullName profileImage')
        .populate('communities', 'name slug');

      if (!user) return res.status(404).json({ message: 'User not found' });

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

  // Get user posts
  exports.getUserPosts = async (req, res) => {
    try {
      const user = await User.findOne({ username: req.params.username });
      if (!user) return res.status(404).json({ message: 'User not found' });

      const posts = await Post.find({ author: user._id })
        .populate('author', 'username fullName profileImage')
        .sort({ createdAt: -1 });

      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

  // Follow/Unfollow user
  exports.followUser = async (req, res) => {
    try {
      const userToFollow = await User.findById(req.params.userId);
      if (!userToFollow) return res.status(404).json({ message: 'User not found' });

      if (req.user._id.toString() === req.params.userId) {
        return res.status(400).json({ message: 'Cannot follow yourself' });
      }

      const currentUser = await User.findById(req.user._id);
      const isFollowing = currentUser.following.includes(req.params.userId);

      if (isFollowing) {
        // Unfollow
        currentUser.following = currentUser.following.filter(id => id.toString() !== req.params.userId);
        userToFollow.followers = userToFollow.followers.filter(id => id.toString() !== req.user._id.toString());
      } else {
        // Follow
        currentUser.following.push(req.params.userId);
        userToFollow.followers.push(req.user._id);

        // Send notification
        const io = req.app.get('io');
        const userSockets = req.app.get('userSockets');
        await createNotification(io, userSockets, {
          type: 'follow',
          from: req.user._id,
          to: req.params.userId
        });
      }

      await currentUser.save();
      await userToFollow.save();

      res.json({ isFollowing: !isFollowing });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

  // Update profile
  exports.updateProfile = async (req, res) => {
    try {
      const { fullName, bio, website, location } = req.body;

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { fullName, bio, website, location },
        { new: true }
      ).select('-password');

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

  // Upload profile image
  exports.uploadProfileImage = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image provided' });
      }

      const user = await User.findById(req.user._id);

      // Delete old profile image from Cloudinary if exists
      if (user.profileImage && user.profileImage.includes('cloudinary')) {
        const publicId = user.profileImage.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(`hobbysphere/${publicId}`);
      }

      // Upload new image to Cloudinary
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { 
            folder: 'hobbysphere/profiles',
            transformation: [
              { width: 400, height: 400, crop: 'fill' },
              { quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(req.file.buffer);
      });

      user.profileImage = result.secure_url;
      await user.save();

      res.json({ 
        message: 'Profile image updated',
        profileImage: user.profileImage 
      });
    } catch (error) {
      console.error('Upload profile image error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };

  // Upload cover image
  exports.uploadCoverImage = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image provided' });
      }

      const user = await User.findById(req.user._id);

      // Delete old cover image from Cloudinary if exists
      if (user.coverImage && user.coverImage.includes('cloudinary')) {
        const publicId = user.coverImage.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(`hobbysphere/${publicId}`);
      }

      // Upload new image to Cloudinary
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { 
            folder: 'hobbysphere/covers',
            transformation: [
              { width: 1200, height: 300, crop: 'fill' },
              { quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(req.file.buffer);
      });

      user.coverImage = result.secure_url;
      await user.save();

      res.json({ 
        message: 'Cover image updated',
        coverImage: user.coverImage 
      });
    } catch (error) {
      console.error('Upload cover image error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };

  // Remove profile image
  exports.removeProfileImage = async (req, res) => {
    try {
      const user = await User.findById(req.user._id);

      // Delete from Cloudinary if exists
      if (user.profileImage && user.profileImage.includes('cloudinary')) {
        const publicId = user.profileImage.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(`hobbysphere/${publicId}`);
      }

      user.profileImage = '';
      await user.save();

      res.json({ message: 'Profile image removed' });
    } catch (error) {
      console.error('Remove profile image error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };

  // Remove cover image
  exports.removeCoverImage = async (req, res) => {
    try {
      const user = await User.findById(req.user._id);

      // Delete from Cloudinary if exists
      if (user.coverImage && user.coverImage.includes('cloudinary')) {
        const publicId = user.coverImage.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(`hobbysphere/${publicId}`);
      }

      user.coverImage = '';
      await user.save();

      res.json({ message: 'Cover image removed' });
    } catch (error) {
      console.error('Remove cover image error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };

  // Get followers list
  exports.getFollowers = async (req, res) => {
    try {
      const user = await User.findOne({ username: req.params.username })
        .populate('followers', 'username fullName profileImage bio');
      
      if (!user) return res.status(404).json({ message: 'User not found' });
      
      res.json(user.followers);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

  // Get following list
  exports.getFollowing = async (req, res) => {
    try {
      const user = await User.findOne({ username: req.params.username })
        .populate('following', 'username fullName profileImage bio');
      
      if (!user) return res.status(404).json({ message: 'User not found' });
      
      res.json(user.following);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

  // ✅ UPDATED: Get user suggestions (excludes guest accounts)
  exports.getUserSuggestions = async (req, res) => {
    try {
      // 🔒 SAFETY CHECK
      if (!req.user || !req.user._id) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const currentUserId = req.user._id;

      // Users already followed
      const currentUser = await User.findById(currentUserId).select('following');

      const excludedIds = [
        currentUserId,
        ...(currentUser.following || [])
      ];

      const suggestions = await User.find({
        _id: { $nin: excludedIds },
        // ✅ EXCLUDE GUEST ACCOUNTS - Both by flag and username pattern
        $and: [
          { 
            $or: [
              { isGuest: { $ne: true } },
              { isGuest: { $exists: false } }
            ]
          },
          {
            username: { $not: /^guest_/i }
          }
        ]
      })
        .select('username fullName profileImage bio')
        .limit(5)
        .sort({ createdAt: -1 }); // Show newer users first

      res.json(suggestions);
    } catch (error) {
      console.error('User suggestions error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };