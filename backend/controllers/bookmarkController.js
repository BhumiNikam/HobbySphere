const Bookmark = require('../models/Bookmark');
const Post = require('../models/Post');

// Toggle bookmark
exports.toggleBookmark = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const existing = await Bookmark.findOne({ user: userId, post: postId });

    if (existing) {
      await Bookmark.deleteOne({ _id: existing._id });
      return res.json({ message: 'Bookmark removed', isBookmarked: false });
    }

    await Bookmark.create({ user: userId, post: postId });
    res.json({ message: 'Post bookmarked', isBookmarked: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user's bookmarks
exports.getBookmarks = async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user.id })
      .populate({
        path: 'post',
        populate: { path: 'author', select: 'username fullName profileImage' }
      })
      .sort({ createdAt: -1 });

    const posts = bookmarks.map(b => b.post).filter(p => p);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};