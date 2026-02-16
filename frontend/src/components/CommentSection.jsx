import { useState, useEffect, useRef } from 'react';
import { Trash2, Send, MessageCircle, Heart, MoreVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../context/SocketContext';
import API from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import toast from 'react-hot-toast';

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
  const [expandedMenuId, setExpandedMenuId] = useState(null);
  const [commentToDelete, setCommentToDelete] = useState(null);

  const inputRef = useRef(null);
  const menuRef = useRef(null);

  /* ================= REAL-TIME UPDATES ================= */
  useEffect(() => {
    if (!socket) return;

    const handleCommentAdded = ({ postId: eventPostId, comment, commentsCount }) => {
      if (eventPostId === postId) {
        setComments((prev) => {
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

  useEffect(() => {
    const closeMenu = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setExpandedMenuId(null);
      }
    };
    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, []);

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
      setComments((prev) => [res.data, ...prev]);
      setNewComment('');
      toast.success('Comment added', { duration: 2000 });
    } catch (err) {
      toast.error('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE COMMENT ================= */
  const handleDelete = async () => {
    if (!commentToDelete) return;

    const loadingToast = toast.loading('Deleting comment...');
    
    try {
      await API.delete(`/posts/comments/${commentToDelete}`);
      setComments((prev) => prev.filter((c) => c._id !== commentToDelete));
      setExpandedMenuId(null);
      
      toast.success('Comment deleted', { id: loadingToast });
    } catch (err) {
      toast.error('Failed to delete comment', { id: loadingToast });
      console.error('Delete comment failed:', err);
    } finally {
      setCommentToDelete(null);
    }
  };

  /* ================= TIME FORMAT ================= */
  const formatDate = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  /* ================= UI ================= */
  return (
    <div className="mt-4 border-t border-slate-200 dark:border-slate-700">
      {/* TOGGLE BUTTON */}
      <button
        onClick={() => setShowComments((p) => !p)}
        className="
          w-full flex items-center justify-between
          py-3 px-2
          text-slate-700 dark:text-slate-300
          hover:bg-slate-50 dark:hover:bg-slate-800/50
          rounded-lg transition-all
          group
        "
      >
        <div className="flex items-center gap-2">
          <MessageCircle 
            size={18} 
            className="text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" 
          />
          <span className="text-sm font-medium">
            {commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}
          </span>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {showComments ? 'Hide' : 'View all'}
        </span>
      </button>

      {showComments && (
        <div className="pt-4 space-y-4 animate-fade-in">
          {/* INPUT FORM */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-start gap-3">
              <img
                src={
                  currentUser?.profileImage ||
                  `https://ui-avatars.com/api/?name=${currentUser?.fullName}&background=6366f1&color=fff`
                }
                alt={currentUser?.fullName}
                className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-slate-100 dark:ring-slate-800"
              />

              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  maxLength={500}
                  rows={1}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  className="
                    w-full px-4 py-3
                    bg-slate-50 dark:bg-slate-800
                    border border-slate-200 dark:border-slate-700
                    rounded-2xl
                    text-sm text-slate-900 dark:text-slate-100
                    placeholder:text-slate-400 dark:placeholder:text-slate-500
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                    resize-none
                    transition-all
                  "
                  style={{ maxHeight: '120px' }}
                />
                
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {newComment.length}/500
                  </span>
                  
                  <button
                    type="submit"
                    disabled={loading || !newComment.trim()}
                    className="
                      p-2 rounded-full
                      bg-indigo-600 hover:bg-indigo-700
                      text-white
                      disabled:bg-slate-300 dark:disabled:bg-slate-700
                      disabled:cursor-not-allowed
                      transition-all
                      active:scale-95
                    "
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* COMMENTS LIST */}
          <div className="space-y-3">
            {comments.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <MessageCircle size={24} className="text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No comments yet
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Be the first to comment!
                </p>
              </div>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment._id}
                  className="
                    group/comment
                    flex gap-3
                    p-3
                    rounded-xl
                    hover:bg-slate-50 dark:hover:bg-slate-800/50
                    transition-all
                  "
                >
                  {/* AVATAR */}
                  <img
                    src={
                      comment.author?.profileImage ||
                      `https://ui-avatars.com/api/?name=${comment.author?.fullName}&background=6366f1&color=fff`
                    }
                    alt={comment.author?.fullName}
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-slate-100 dark:ring-slate-800"
                  />

                  {/* CONTENT */}
                  <div className="flex-1 min-w-0">
                    <div className="
                      bg-slate-100 dark:bg-slate-800
                      rounded-2xl rounded-tl-sm
                      px-4 py-3
                    ">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {comment.author?.fullName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            @{comment.author?.username}
                          </p>
                        </div>

                        {currentUser?._id === comment.author?._id && (
                          <div className="relative" ref={menuRef}>
                            <button
                              onClick={() => setExpandedMenuId(
                                expandedMenuId === comment._id ? null : comment._id
                              )}
                              className="
                                p-1.5 rounded-lg
                                text-slate-400
                                opacity-0 group-hover/comment:opacity-100
                                hover:bg-slate-200 dark:hover:bg-slate-700
                                transition-all
                              "
                            >
                              <MoreVertical size={16} />
                            </button>

                            {expandedMenuId === comment._id && (
                              <div className="
                                absolute right-0 mt-1
                                bg-white dark:bg-slate-900
                                border border-slate-200 dark:border-slate-700
                                rounded-xl shadow-lg
                                overflow-hidden
                                z-10
                                min-w-[140px]
                                animate-scale-in
                              ">
                                <button
                                  onClick={() => {
                                    setCommentToDelete(comment._id);
                                    setExpandedMenuId(null);
                                  }}
                                  className="
                                    w-full flex items-center gap-2
                                    px-4 py-2.5
                                    text-sm text-red-600 dark:text-red-400
                                    hover:bg-red-50 dark:hover:bg-red-900/20
                                    transition-colors
                                  "
                                >
                                  <Trash2 size={16} />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
                        {comment.text}
                      </p>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex items-center gap-4 mt-1.5 px-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={!!commentToDelete}
        onClose={() => setCommentToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}