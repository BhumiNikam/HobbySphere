import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CommentSection from './CommentSection';
import MediaRenderer from './MediaRenderer';
import {
  Heart,
  MessageCircle,
  Trash2,
  Bookmark,
  MoreVertical,
  Share2,
  Download,
  Lock,
} from 'lucide-react';
import API from '../services/api';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

const PostCard = memo(({ post, currentUser, onDelete, isSeen, isMember = true }) => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { t } = useTranslation();
  const menuRef = useRef(null);

  if (!post?.author || !currentUser) return null;

  const userId = currentUser?.id || currentUser?._id;

  const hasUserLiked = useCallback((likes = []) =>
    likes.some((like) => {
      if (!like) return false;
      if (typeof like === 'string') return like === userId;
      if (like._id) return like._id.toString() === userId;
      return like.toString?.() === userId;
    }), [userId]);

  const [likes, setLikes] = useState(post.likes?.length || 0);
  const [isLiked, setIsLiked] = useState(() => hasUserLiked(post.likes));
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [likeBurst, setLikeBurst] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const onLike = ({ postId, userId: actionUserId, likesCount }) => {
      if (postId === post._id) {
        setLikes(likesCount);
        if (actionUserId === userId) setIsLiked(true);
      }
    };

    const onUnlike = ({ postId, userId: actionUserId, likesCount }) => {
      if (postId === post._id) {
        setLikes(likesCount);
        if (actionUserId === userId) setIsLiked(false);
      }
    };

    const onComment = ({ postId, commentsCount }) => {
      if (postId === post._id) setCommentCount(commentsCount);
    };

    const onBookmark = ({ postId, userId: actionUserId }) => {
      if (postId === post._id && actionUserId === userId) {
        setIsBookmarked(true);
      }
    };

    const onBookmarkRemoved = ({ postId, userId: actionUserId }) => {
      if (postId === post._id && actionUserId === userId) {
        setIsBookmarked(false);
      }
    };

    socket.on('post_liked', onLike);
    socket.on('post_unliked', onUnlike);
    socket.on('post_commented', onComment);
    socket.on('comment_deleted', onComment);
    socket.on('bookmark_added', onBookmark);
    socket.on('bookmark_removed', onBookmarkRemoved);

    return () => {
      socket.off('post_liked', onLike);
      socket.off('post_unliked', onUnlike);
      socket.off('post_commented', onComment);
      socket.off('comment_deleted', onComment);
      socket.off('bookmark_added', onBookmark);
      socket.off('bookmark_removed', onBookmarkRemoved);
    };
  }, [socket, post._id, userId]);

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get(`/bookmarks/check/${post._id}`);
        setIsBookmarked(res.data.isBookmarked);
      } catch {}
    })();
  }, [post._id]);

  useEffect(() => {
    const closeMenu = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, []);

  const handleLike = useCallback(async () => {
    if (!isMember) {
      toast.error('Join the community to interact with posts');
      return;
    }

    try {
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setLikes(prev => newIsLiked ? prev + 1 : prev - 1);
      
      const res = await API.post(`/posts/${post._id}/like`);
      
      setLikes(res.data.likes.length);
      setIsLiked(res.data.isLiked);
    } catch (err) {
      setIsLiked(!isLiked);
      setLikes(prev => isLiked ? prev + 1 : prev - 1);
      console.error('Like failed:', err);
    }
  }, [post._id, isLiked, isMember]);

  const handleMediaDoubleClick = useCallback(async () => {
    if (isLiked || !isMember) return;

    setLikeBurst(true);
    setIsLiked(true);
    setLikes(prev => prev + 1);

    try {
      await API.post(`/posts/${post._id}/like`);
    } catch (err) {
      setIsLiked(false);
      setLikes(prev => prev - 1);
      console.error('Double-click like failed:', err);
    }
    
    setTimeout(() => setLikeBurst(false), 600);
  }, [post._id, isLiked, isMember]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm(t('post.delete') + '?')) return;
    try {
      await API.delete(`/posts/${post._id}`);
      onDelete?.(post._id);
      toast.success('Post deleted');
    } catch {
      toast.error('Failed to delete post');
    }
  }, [post._id, onDelete, t]);

  const handleBookmark = useCallback(async () => {
    try {
      const res = await API.post(`/bookmarks/${post._id}`);
      setIsBookmarked(res.data.isBookmarked);
      toast.success(res.data.message);
    } catch (err) {
      console.error('Bookmark failed:', err);
      toast.error('Failed to bookmark post');
    }
  }, [post._id]);

  const handleShare = useCallback(async () => {
    const shareUrl = `${window.location.origin}/post/${post._id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.author.username}`,
          text: post.content.substring(0, 100),
          url: shareUrl
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyToClipboard(shareUrl);
        }
      }
    } else {
      copyToClipboard(shareUrl);
    }
  }, [post]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copied to clipboard');
  };

  const handleDownload = useCallback(async (mediaIndex) => {
    try {
      const res = await API.get(`/posts/${post._id}/download/${mediaIndex}`);
      
      const link = document.createElement('a');
      link.href = res.data.url;
      link.download = res.data.fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download started');
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('Failed to download file');
    }
  }, [post._id]);

  const renderContent = useCallback((text) =>
    text.split(/(#\w+)/g).map((part, i) => {
      if (part.startsWith('#')) {
        const tag = part.substring(1);
        return (
          <span
            key={i}
            onClick={() => navigate(`/hashtag/${encodeURIComponent(tag)}`)}
            className="text-indigo-600 dark:text-indigo-400 font-medium cursor-pointer hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    }), [navigate]);

  const isPostAuthor = post.author._id?.toString() === userId || post.author._id === userId;

  // Check if post has media
  const hasMedia = (post.media?.length > 0) || (post.images?.length > 0);

  return (
    <article
      className={`
        group
        bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800
        shadow-sm hover:shadow-md dark:hover:shadow-xl dark:hover:shadow-black/20
        transition-all duration-300 ease-out
        hover:-translate-y-0.5
        ${isSeen ? 'opacity-90' : ''}
        ${!isMember ? 'relative' : ''}
      `}
    >
      {/* Non-member overlay */}
      {!isMember && (
        <div className="absolute inset-0 bg-black/5 dark:bg-black/10 backdrop-blur-[2px] z-10 rounded-2xl flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 dark:bg-slate-800/90 px-4 py-2 rounded-lg flex items-center gap-2">
            <Lock size={16} className="text-slate-600 dark:text-slate-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Join community to interact
            </span>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center justify-between p-3 sm:p-4">
        <div
          onClick={() => navigate(`/profile/${post.author.username}`)}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group/author flex-1 min-w-0"
        >
          <div className="relative flex-shrink-0">
            <img
              src={post.author.profileImage}
              alt={post.author.username}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover ring-2 ring-white dark:ring-slate-900 shadow-sm
                         group-hover/author:ring-indigo-100 dark:group-hover/author:ring-indigo-900 transition-all"
            />
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 
                            opacity-0 group-hover/author:opacity-100 transition-opacity" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover/author:text-indigo-600 dark:group-hover/author:text-indigo-400 transition-colors truncate">
              {post.author.username}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {isPostAuthor && (
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button
              onClick={() => setShowMenu((p) => !p)}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              <MoreVertical size={18} />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800
                              overflow-hidden z-20 animate-scale-in">
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2.5 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full 
                             transition-colors"
                >
                  <Trash2 size={16} />
                  {t('post.delete')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MEDIA with Download Button */}
      {post.media?.length > 0 && (
        <MediaRenderer 
          media={post.media} 
          onDoubleClick={handleMediaDoubleClick}
          onDownload={handleDownload}
          showDownload={isMember}
          likeBurst={likeBurst}
        />
      )}

      {/* Legacy support for old 'images' field */}
      {post.images?.length > 0 && !post.media?.length && (
        <div 
          onDoubleClick={handleMediaDoubleClick} 
          className="relative bg-slate-950 flex items-center justify-center"
          style={{ maxHeight: '600px' }}
        >
          {post.images[0].type === 'video' ? (
            <video
              controls
              className="w-full h-full object-contain"
              style={{ maxHeight: '600px' }}
              src={post.images[0].url}
            >
              Your browser doesn't support video.
            </video>
          ) : (
            <img
              src={post.images[0].url}
              alt="post"
              className="w-full h-auto object-contain"
              style={{ maxHeight: '600px' }}
              draggable={false}
            />
          )}

          {/* Download button for legacy images */}
          {isMember && (
            <button
              onClick={() => handleDownload(0)}
              className="absolute top-4 right-4 p-2.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all backdrop-blur-sm"
              title="Download"
            >
              <Download size={20} />
            </button>
          )}

          {likeBurst && (
            <Heart
              size={80}
              className="absolute inset-0 m-auto text-white drop-shadow-2xl animate-like-pop pointer-events-none sm:w-[100px] sm:h-[100px]"
              fill="currentColor"
              strokeWidth={1.5}
            />
          )}
        </div>
      )}

      {/* ACTIONS */}
      <div className="flex items-center gap-1 px-3 sm:px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={handleLike}
          disabled={!isMember}
          className={`
            p-2 sm:p-2.5 rounded-xl transition-all duration-200 tap-target
            ${isLiked 
              ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-red-500 dark:hover:text-red-400'
            }
            ${!isMember ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          title={t('post.like')}
        >
          <Heart size={20} className="sm:w-[22px] sm:h-[22px]" fill={isLiked ? 'currentColor' : 'none'} strokeWidth={2.5} />
        </button>

        <button
          onClick={() => isMember && setShowComments((p) => !p)}
          disabled={!isMember}
          className={`p-2 sm:p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all tap-target ${!isMember ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={t('post.comment')}
        >
          <MessageCircle size={20} className="sm:w-[22px] sm:h-[22px]" strokeWidth={2.5} />
        </button>

        <button 
          onClick={handleShare}
          className="p-2 sm:p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all tap-target"
          title={t('post.share')}
        >
          <Share2 size={20} className="sm:w-[22px] sm:h-[22px]" strokeWidth={2.5} />
        </button>

        {/* Download button in actions bar - only show if post has media */}
        {hasMedia && isMember && (
          <button
            onClick={() => handleDownload(0)}
            className="p-2 sm:p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-green-600 dark:hover:text-green-400 transition-all tap-target"
            title="Download"
          >
            <Download size={20} className="sm:w-[22px] sm:h-[22px]" strokeWidth={2.5} />
          </button>
        )}

        <button
          onClick={handleBookmark}
          className={`
            ml-auto p-2 sm:p-2.5 rounded-xl transition-all duration-200 tap-target
            ${isBookmarked 
              ? 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400'
            }
          `}
          title={t('post.save')}
        >
          <Bookmark size={20} className="sm:w-[22px] sm:h-[22px]" fill={isBookmarked ? 'currentColor' : 'none'} strokeWidth={2.5} />
        </button>
      </div>

      {/* LIKES & INFO */}
      <div className="px-3 sm:px-4 pt-3">
        {likes > 0 && (
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
            {likes.toLocaleString()} {likes === 1 ? t('post.like') : t('post.like') + 's'}
          </p>
        )}
        
        {post.content && (
          <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 break-words">
            <span className="font-semibold text-slate-900 dark:text-slate-100 mr-1.5">{post.author.username}</span>
            {renderContent(post.content)}
          </div>
        )}

        {commentCount > 0 && (
          <button
            onClick={() => isMember && setShowComments((p) => !p)}
            disabled={!isMember}
            className={`text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 mt-2 transition-colors ${!isMember ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {t('common.viewMore')} {commentCount} {commentCount === 1 ? t('post.comment') : t('post.comment') + 's'}
          </button>
        )}
      </div>

      {/* COMMENTS */}
      {showComments && isMember && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2">
          <CommentSection
            postId={post._id}
            currentUser={currentUser}
            commentCount={commentCount}
          />
        </div>
      )}
    </article>
  );
});

PostCard.displayName = 'PostCard';

export default PostCard;