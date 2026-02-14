const Bookmark = require('../models/Bookmark');
const Post = require('../models/Post');

/* =====================================================
   TOGGLE BOOKMARK
===================================================== */
exports.toggleBookmark = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if already bookmarked
    const existing = await Bookmark.findOne({ user: userId, post: postId });

    if (existing) {
      // Remove bookmark
      await Bookmark.deleteOne({ _id: existing._id });
      
      // Real-time update
      const io = req.app.get('io');
      io?.emit('bookmark_removed', {
        userId: userId.toString(),
        postId: postId.toString()
      });

      return res.json({ 
        message: 'Bookmark removed',
        isBookmarked: false
      });
    } else {
      // Add bookmark
      const bookmark = await Bookmark.create({
        user: userId,
        post: postId
      });

      // Real-time update
      const io = req.app.get('io');
      io?.emit('bookmark_added', {
        userId: userId.toString(),
        postId: postId.toString()
      });

      return res.json({ 
        message: 'Post bookmarked',
        isBookmarked: true,
        bookmark
      });
    }
  } catch (error) {
    console.error('Bookmark error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* =====================================================
   GET USER'S BOOKMARKS
===================================================== */
exports.getBookmarks = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      Bookmark.find({ user: req.user._id })
        .populate({
          path: 'post',
          populate: [
            { path: 'author', select: 'username fullName profileImage' },
            { path: 'community', select: 'name slug' }
          ]
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Bookmark.countDocuments({ user: req.user._id })
    ]);

    // Filter out bookmarks where post was deleted
    const validBookmarks = bookmarks.filter(b => b.post !== null);

    res.json({
      bookmarks: validBookmarks,
      posts: validBookmarks.map(b => b.post), // Return posts for easy rendering
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* =====================================================
   CHECK IF POST IS BOOKMARKED
===================================================== */
exports.checkBookmark = async (req, res) => {
  try {
    const { postId } = req.params;
    
    const bookmark = await Bookmark.findOne({
      user: req.user._id,
      post: postId
    });

    res.json({ isBookmarked: !!bookmark });
  } catch (error) {
    console.error('Check bookmark error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};