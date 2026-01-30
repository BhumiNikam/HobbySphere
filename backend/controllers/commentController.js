const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { createNotification } = require('../utils/notifications');

/* =====================================================
   ADD COMMENT
===================================================== */
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const { postId } = req.params;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment cannot be empty' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = await Comment.create({
      text: text.trim(),
      author: req.user._id,
      post: postId,
    });

    // Increment comment count safely
    await Post.findByIdAndUpdate(postId, {
      $inc: { commentCount: 1 },
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'username fullName profileImage')
      .lean();

    /* ===== SOCKET ===== */
    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');

    if (io) {
      io.emit('post_commented', {
        postId,
        comment: populatedComment,
      });
    }

    /* ===== NOTIFICATION ===== */
    if (post.author.toString() !== req.user._id.toString()) {
      await createNotification(io, userSockets, {
        type: 'comment',
        from: req.user._id,
        to: post.author,
        post: postId,
      });
    }

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

/* =====================================================
   GET COMMENTS
===================================================== */
exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({
      post: postId,
      parentComment: null,
    })
      .populate('author', 'username fullName profileImage')
      .sort({ createdAt: -1 })
      .lean();

    res.json(comments);
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

/* =====================================================
   DELETE COMMENT
===================================================== */
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Comment.findByIdAndDelete(commentId);

    await Post.findByIdAndUpdate(comment.post, {
      $inc: { commentCount: -1 },
    });

    /* ===== SOCKET ===== */
    const io = req.app.get('io');
    if (io) {
      io.emit('comment_deleted', {
        postId: comment.post,
        commentId,
      });
    }

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};
