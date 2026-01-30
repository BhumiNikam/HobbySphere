const Post = require('../models/Post');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const { createNotification } = require('../utils/notifications');

/* =====================================================
   CREATE POST
===================================================== */
exports.createPost = async (req, res) => {
  try {
    const { content, communityId } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: 'Post content is required' });
    }

    if (!communityId) {
      return res.status(400).json({ message: 'Community is required' });
    }

    /* ===== UPLOAD MEDIA ===== */
    const images = [];

    if (req.files?.length) {
      const uploads = req.files.map(
        (file) =>
          new Promise((resolve, reject) => {
            const isVideo = file.mimetype.startsWith('video/');
            cloudinary.uploader
              .upload_stream({ 
                folder: 'hobbysphere',
                resource_type: isVideo ? 'video' : 'image'
              }, (err, result) => {
                if (err) reject(err);
                else resolve(result);
              })
              .end(file.buffer);
          })
      );

      const results = await Promise.all(uploads);

      results.forEach((r) =>
        images.push({ 
          url: r.secure_url, 
          publicId: r.public_id,
          type: r.resource_type // 'image' or 'video'
        })
      );
    }

    /* ===== HASHTAGS ===== */
    const hashtags = content.match(/#([\w-]+)/g) || [];

    const post = await Post.create({
      content,
      author: req.user._id,
      community: communityId,
      images,
      hashtags: hashtags.map((t) => t.toLowerCase()),
    });

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'username fullName profileImage')
      .populate('community', 'name slug');

    /* ===== SOCKET ===== */
    const io = req.app.get('io');
    io?.emit('post_created', populatedPost);

    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* =====================================================
   COMMUNITY FEED
===================================================== */
exports.getFeed = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user._id).select('communities');

    if (!user.communities?.length) {
      return res.json({ posts: [], hasMore: false });
    }

    const [posts, total] = await Promise.all([
      Post.find({ community: { $in: user.communities } })
        .populate('author', 'username fullName profileImage')
        .populate('community', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments({ community: { $in: user.communities } }),
    ]);

    res.json({
      posts,
      hasMore: skip + posts.length < total,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* =====================================================
   FOLLOWING FEED
===================================================== */
exports.getFollowingFeed = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user._id).select('following');

    if (!user.following?.length) {
      return res.json({ posts: [], hasMore: false });
    }

    const [posts, total] = await Promise.all([
      Post.find({ author: { $in: user.following } })
        .populate('author', 'username fullName profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments({ author: { $in: user.following } }),
    ]);

    res.json({
      posts,
      hasMore: skip + posts.length < total,
    });
  } catch {
    res.status(500).json({ message: 'Failed to load feed' });
  }
};

/* =====================================================
   LIKE / UNLIKE POST
===================================================== */
exports.likePost = async (req, res) => {
  try {
    const userId = req.user._id;

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');

    const alreadyLiked = post.likes.some(
      (id) => id.toString() === userId.toString()
    );

    if (alreadyLiked) {
      // UNLIKE
      post.likes.pull(userId);
      await post.save();

      // Emit unlike event
      io?.emit('post_unliked', {
        postId: post._id,
        userId: userId.toString(),
        likesCount: post.likes.length,
      });

      return res.json({
        likes: post.likes,
        isLiked: false,
      });
    } else {
      // LIKE
      post.likes.addToSet(userId);
      await post.save();

      // Emit like event
      io?.emit('post_liked', {
        postId: post._id,
        userId: userId.toString(),
        likesCount: post.likes.length,
      });

      // Create notification (don't notify self)
      if (post.author.toString() !== userId.toString()) {
        await createNotification(io, userSockets, {
          type: 'like',
          from: userId,
          to: post.author,
          post: post._id,
        });
      }

      return res.json({
        likes: post.likes,
        isLiked: true,
      });
    }
  } catch (error) {
    console.error('❌ Like error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

/* =====================================================
   DELETE POST
===================================================== */
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Promise.all(
      post.images.map((img) =>
        cloudinary.uploader.destroy(img.publicId).catch(() => {})
      )
    );

    await Post.findByIdAndDelete(post._id);

    const io = req.app.get('io');
    io?.emit('post_deleted', { postId: post._id });

    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};