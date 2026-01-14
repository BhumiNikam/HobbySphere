const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { createNotification } = require('../utils/notifications');

// ✅ FIXED: Add comment with real-time socket events
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = await Comment.create({
      text,
      author: req.user._id,
      post: postId
    });

    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

    const populatedComment = await Comment.findById(comment._id).populate('author', 'username fullName profileImage');

    // Get socket.io instance
    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');

    // ✅ Emit comment event to all connected clients
    if (io) {
      io.emit('post_commented', {
        postId: postId,
        comment: populatedComment,
        commentsCount: post.commentCount + 1
      });
      console.log('💬 New comment - emitting to all clients');
    }

    // Send notification (don't notify if commenting on own post)
    if (post.author.toString() !== req.user._id.toString()) {
      await createNotification(io, userSockets, {
        type: 'comment',
        from: req.user._id,
        to: post.author,
        post: postId
      });
    }

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get comments
exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    
    const comments = await Comment.find({ post: postId, parentComment: null })
      .populate('author', 'username fullName profileImage')
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ FIXED: Delete comment with real-time socket events
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const post = await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });
    await Comment.findByIdAndDelete(req.params.commentId);

    // ✅ Emit comment deleted event
    const io = req.app.get('io');
    if (io) {
      io.emit('comment_deleted', {
        postId: comment.post,
        commentId: req.params.commentId,
        commentsCount: post.commentCount - 1
      });
      console.log('🗑️ Comment deleted - emitting to all clients');
    }

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};