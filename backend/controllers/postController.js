const Post = require('../models/Post');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const { createNotification } = require('../utils/notifications');

// Create post
exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;
    const images = [];

    // Upload images to Cloudinary
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: 'hobbysphere' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(file.buffer);
        });

        images.push({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    }

    // Extract hashtags
    const hashtags = content.match(/#\w+/g) || [];

    const post = await Post.create({
      content,
      author: req.user._id,
      images,
      hashtags: hashtags.map(tag => tag.toLowerCase())
    });

    const populatedPost = await Post.findById(post._id).populate('author', 'username fullName profileImage');

    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get feed (all posts)
exports.getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate('author', 'username fullName profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments();

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get following feed (only posts from users you follow)
exports.getFollowingFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user._id);
    
    // Include own posts + posts from following
    const authorIds = [...user.following, req.user._id];

    // DEBUG - Remove after testing
    console.log('Following IDs:', user.following.length);
    console.log('Total author IDs:', authorIds.length);

    const posts = await Post.find({ author: { $in: authorIds } })
      .populate('author', 'username fullName profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // DEBUG - Remove after testing
    console.log('Following feed posts:', posts.length);

    const total = await Post.countDocuments({ author: { $in: authorIds } });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Like post
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const index = post.likes.indexOf(req.user._id);
    const isLiking = index === -1;

    if (index > -1) {
      post.likes.splice(index, 1);
    } else {
      post.likes.push(req.user._id);

      // Send notification (only when liking, not unliking)
      if (post.author.toString() !== req.user._id.toString()) {
        const io = req.app.get('io');
        const userSockets = req.app.get('userSockets');
        await createNotification(io, userSockets, {
          type: 'like',
          from: req.user._id,
          to: post.author,
          post: post._id
        });
      }
    }

    await post.save();
    res.json({ likes: post.likes.length, isLiked: isLiking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete images from Cloudinary
    for (const image of post.images) {
      await cloudinary.uploader.destroy(image.publicId);
    }

    await Post.findByIdAndDelete(req.params.postId);
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};