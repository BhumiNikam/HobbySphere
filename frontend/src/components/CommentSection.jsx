import { useState, useEffect } from 'react';
import { Trash2, Send } from 'lucide-react';
import API from '../services/api';

export default function CommentSection({ postId, currentUser, commentCount }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);

  const fetchComments = async () => {
    try {
      const res = await API.get(`/posts/${postId}/comments`);
      setComments(res.data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const res = await API.post(`/posts/${postId}/comments`, { text: newComment });
      setComments([res.data, ...comments]);
      setNewComment('');
    } catch (error) {
      alert('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await API.delete(`/posts/comments/${commentId}`);
      setComments(comments.filter(c => c._id !== commentId));
    } catch (error) {
      alert('Failed to delete comment');
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const posted = new Date(date);
    const diff = Math.floor((now - posted) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="mt-4 border-t pt-4">
      <button
        onClick={() => setShowComments(!showComments)}
        className="text-indigo-600 font-medium text-sm mb-4 hover:text-indigo-700"
      >
        {showComments ? 'Hide' : 'View'} {commentCount} comments
      </button>

      {showComments && (
        <div className="space-y-4">
          {/* Add Comment */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </form>

          {/* Comments List */}
          <div className="space-y-3">
            {comments.map(comment => (
              <div key={comment._id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3 flex-1">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {comment.author.fullName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{comment.author.fullName}</span>
                        <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-gray-800 text-sm">{comment.text}</p>
                    </div>
                  </div>

                  {currentUser?.id === comment.author._id && (
                    <button
                      onClick={() => handleDelete(comment._id)}
                      className="text-red-500 hover:text-red-600 flex-shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {comments.length === 0 && (
              <p className="text-gray-500 text-center py-4 text-sm">No comments yet. Be the first!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}