const Post = require('../models/Post');
const User = require('../models/User');
const Community = require('../models/Community');
const cloudinary = require('../config/cloudinary');
const { createNotification } = require('../utils/notifications');

/* =====================================================
   HELPER: Get media type from mimetype
===================================================== */
const getMediaType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype === 'application/pdf') return 'pdf';
  return 'document';
};

/* =====================================================
   CREATE POST - MULTI-MEDIA SUPPORT
===================================================== */
exports.createPost = async (req, res) => {
  try {
    const { content, communityId } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: 'Post content is required' });
    }

    // ✅ Validate community membership if posting to community
    if (communityId) {
      const community = await Community.findById(communityId);
      if (!community) {
        return res.status(404).json({ message: 'Community not found' });
      }
      
      // Check if user is a member
      if (!community.members.includes(req.user._id)) {
        return res.status(403).json({ message: 'You must join the community to post' });
      }
    }

    /* ===== UPLOAD MEDIA - ALL TYPES ===== */
    const media = [];

    if (req.files?.length) {
      const uploads = req.files.map(
        (file) =>
          new Promise((resolve, reject) => {
            const mediaType = getMediaType(file.mimetype);
            const resourceType = ['image', 'video'].includes(mediaType) ? mediaType : 'raw';
            
            cloudinary.uploader
              .upload_stream({ 
                folder: 'hobbysphere',
                resource_type: resourceType,
                format: mediaType === 'audio' ? 'mp3' : undefined
              }, (err, result) => {
                if (err) reject(err);
                else resolve({
                  url: result.secure_url,
                  publicId: result.public_id,
                  type: mediaType,
                  fileName: file.originalname,
                  fileSize: file.size,
                  mimeType: file.mimetype
                });
              })
              .end(file.buffer);
          })
      );

      const results = await Promise.all(uploads);
      media.push(...results);
    }

    /* ===== HASHTAGS ===== */
    const hashtags = content.match(/#([\w-]+)/g) || [];

    const postData = {
      content,
      author: req.user._id,
      media,
      hashtags: hashtags.map((t) => t.toLowerCase()),
    };

    if (communityId) {
      postData.community = communityId;
    }

    const post = await Post.create(postData);

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'username fullName profileImage')
      .populate('community', 'name slug');

    /* ===== REAL-TIME UPDATE ===== */
    const io = req.app.get('io');
    if (io) {
      io.emit('post_created', populatedPost);
      
      // Emit to specific community room if applicable
      if (communityId) {
        io.to(`community:${communityId}`).emit('community_post_created', populatedPost);
      }
    }

    res.status(201).json(populatedPost);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* =====================================================
   HOME FEED
===================================================== */
exports.getFeed = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find({})
        .populate('author', 'username fullName profileImage')
        .populate('community', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments({}),
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
        .populate('community', 'name slug')
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
      post.likes.pull(userId);
      await post.save();

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
      post.likes.addToSet(userId);
      await post.save();

      io?.emit('post_liked', {
        postId: post._id,
        userId: userId.toString(),
        likesCount: post.likes.length,
      });

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

    // Delete all media from cloudinary (support both old and new schema)
    const mediaToDelete = post.media?.length ? post.media : post.images || [];
    
    await Promise.all(
      mediaToDelete.map((item) =>
        cloudinary.uploader.destroy(item.publicId, {
          resource_type: ['image', 'video'].includes(item.type) ? item.type : 'raw'
        }).catch(() => {})
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

/* =====================================================
   DOWNLOAD POST MEDIA - PROXY DOWNLOAD WITH PROPER HEADERS
===================================================== */
exports.downloadMedia = async (req, res) => {
  try {
    const { postId, mediaIndex } = req.params;
    
    console.log('📥 Download request:', { postId, mediaIndex });
    
    const post = await Post.findById(postId);
    if (!post) {
      console.error('❌ Post not found:', postId);
      return res.status(404).json({ message: 'Post not found' });
    }

    console.log('✅ Post found:', {
      hasMedia: !!post.media,
      mediaLength: post.media?.length,
      hasImages: !!post.images,
      imagesLength: post.images?.length
    });

    // ✅ Support both old 'images' and new 'media' fields
    const mediaArray = post.media?.length ? post.media : post.images || [];
    
    if (!mediaArray.length) {
      console.error('❌ No media found in post:', postId);
      return res.status(404).json({ message: 'No media found in this post' });
    }

    const index = parseInt(mediaIndex);
    const mediaItem = mediaArray[index];
    
    if (!mediaItem) {
      console.error('❌ Media item not found at index:', index);
      return res.status(404).json({ message: 'Media not found at specified index' });
    }

    console.log('✅ Media item found:', {
      type: mediaItem.type,
      fileName: mediaItem.fileName,
      url: mediaItem.url?.substring(0, 50) + '...'
    });

    // ✅ OPTION 1: Return URL with download info (frontend handles download via fetch)
    // This is better for CORS and works with Cloudinary
    res.json({
      url: mediaItem.url,
      fileName: mediaItem.fileName || `hobbysphere-${Date.now()}.${getFileExtension(mediaItem)}`,
      type: mediaItem.type || 'image'
    });
    
  } catch (error) {
    console.error('❌ Download error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper function to get file extension
const getFileExtension = (mediaItem) => {
  if (mediaItem.fileName) {
    const ext = mediaItem.fileName.split('.').pop();
    if (ext && ext.length <= 5) return ext;
  }
  
  const typeMap = {
    'image': 'jpg',
    'video': 'mp4',
    'audio': 'mp3',
    'pdf': 'pdf',
    'document': 'pdf'
  };
  
  return typeMap[mediaItem.type] || 'bin';
};

/* =====================================================
   GET SINGLE POST BY ID - FOR SHARED LINKS
===================================================== */
exports.getPostById = async (req, res) => {
  try {
    const { postId } = req.params;
    
    console.log('📖 Fetching post:', postId);
    
    const post = await Post.findById(postId)
      .populate('author', 'username fullName profileImage')
      .populate('community', 'name slug _id');

    if (!post) {
      console.error('❌ Post not found:', postId);
      return res.status(404).json({ message: 'Post not found' });
    }

    console.log('✅ Post found:', post.content.substring(0, 50) + '...');

    res.json(post);
  } catch (error) {
    console.error('❌ Get post error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};