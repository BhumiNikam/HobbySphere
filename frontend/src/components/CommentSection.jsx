import { useState, useEffect, useRef } from 'react';
import { Trash2, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../context/SocketContext';
import API from '../services/api';

export default function CommentSection({
  postId,
  currentUser,
  commentCount: initialCommentCount,
}) {
  const { t } = useTranslation();
  const { socket } = useSocket();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(initialCommentCount || 0);

  const inputRef = useRef(null);

  /* ================= REAL-TIME UPDATES ================= */
  useEffect(() => {
    if (!socket) return;

    const handleCommentAdded = ({ postId: eventPostId, comment, commentsCount }) => {
      if (eventPostId === postId) {
        setComments((prev) => {
          // Avoid duplicates
          if (prev.some(c => c._id === comment._id)) return prev;
          return [comment, ...prev];
        });
        setCommentCount(commentsCount);
      }
    };

    const handleCommentDeleted = ({ postId: eventPostId, commentId, commentsCount }) => {
      if (eventPostId === postId) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        setCommentCount(commentsCount);
      }
    };

    socket.on('post_commented', handleCommentAdded);
    socket.on('comment_deleted', handleCommentDeleted);

    return () => {
      socket.off('post_commented', handleCommentAdded);
      socket.off('comment_deleted', handleCommentDeleted);
    };
  }, [socket, postId]);

  /* ================= FETCH COMMENTS ================= */
  useEffect(() => {
    if (!showComments) return;

    fetchComments();

    setTimeout(() => inputRef.current?.focus(), 120);
  }, [showComments]);

  const fetchComments = async () => {
    try {
      const res = await API.get(`/posts/${postId}/comments`);
      setComments(res.data);
    } catch {
      console.error('Failed to fetch comments');
    }
  };

  /* ================= ADD COMMENT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const res = await API.post(`/posts/${postId}/comments`, { text: newComment });

      // Add comment optimistically
      setComments((prev) => [res.data, ...prev]);
      setNewComment('');
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE COMMENT ================= */
  const handleDelete = async (commentId) => {
    if (!window.confirm(t('post.delete') + '?')) return;

    try {
      await API.delete(`/posts/comments/${commentId}`);
      // Remove comment optimistically
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch {
      console.error('Delete comment failed');
    }
  };

  /* ================= TIME FORMAT ================= */
  const formatDate = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);

    if (diff < 60) return t('post.justNow');
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  /* ================= UI ================= */
  return (
    <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
      {/* TOGGLE */}
      <button
        onClick={() => setShowComments((p) => !p)}
        className="
          text-sm font-medium
          text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400
          transition mb-3
        "
      >
        {showComments
          ? t('common.viewLess')
          : `${t('common.viewMore')} ${commentCount} ${t('post.comment')}${commentCount !== 1 ? 's' : ''}`}
      </button>

      {showComments && (
        <div className="space-y-5 animate-fade-in">
          {/* INPUT */}
          <form
            onSubmit={handleSubmit}
            className="
              flex items-center gap-3
              bg-slate-50 dark:bg-slate-700
              border border-slate-200 dark:border-slate-600
              rounded-full
              px-4 py-2.5
            "
          >
            <input
              ref={inputRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t('post.writeComment')}
              maxLength={500}
              className="
                flex-1 bg-transparent
                text-sm outline-none
                text-slate-900 dark:text-slate-100
                placeholder:text-slate-400 dark:placeholder:text-slate-500
              "
            />

            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="
                text-indigo-600 dark:text-indigo-400
                disabled:text-slate-400 dark:disabled:text-slate-600
                transition
                active:scale-95
              "
            >
              <Send size={18} />
            </button>
          </form>

          {/* EMPTY STATE */}
          {comments.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
              {t('post.comment')} ✨
            </p>
          )}

          {/* COMMENTS */}
          {comments.map((comment) => (
            <div key={comment._id} className="flex gap-3 group">
              {/* AVATAR */}
              <img
                src={
                  comment.author?.profileImage ||
                  `https://ui-avatars.com/api/?name=${comment.author?.fullName}&background=6366f1&color=fff`
                }
                alt={comment.author?.fullName}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />

              {/* BODY */}
              <div className="flex-1">
                <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl px-4 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {comment.author?.fullName}
                    </p>

                    {currentUser?._id === comment.author?._id && (
                      <button
                        onClick={() => handleDelete(comment._id)}
                        className="
                          text-slate-400
                          opacity-0 group-hover:opacity-100
                          hover:text-red-500
                          transition
                        "
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                    {comment.text}
                  </p>
                </div>

                <p className="text-xs text-slate-400 mt-1 ml-2">
                  {formatDate(comment.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}