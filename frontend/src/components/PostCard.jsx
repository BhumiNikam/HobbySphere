import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CommentSection from './CommentSection';
import { Heart, MessageCircle, Trash2, Bookmark } from 'lucide-react';
import API from '../services/api';

export default function PostCard({ post, currentUser, onDelete }) {
  const navigate = useNavigate();

  // SAFETY CHECK: Don't render posts without authors
  if (!post.author) {
    console.warn('Post missing author:', post._id);
    return null;
  }

  const [likes, setLikes] = useState(post.likes.length);
  const [isLiked, setIsLiked] = useState(post.likes.includes(currentUser?.id));
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Check if bookmarked on mount
  useEffect(() => {
    if (currentUser) {
      checkBookmark();
    }
  }, []);

  const checkBookmark = async () => {
    try {
      const res = await API.get('/bookmarks');
      // FIX: Check if post exists before accessing _id
      const bookmarked = res.data.some(b => b && b._id === post._id);
      setIsBookmarked(bookmarked);
    } catch (error) {
      console.error('Check bookmark failed:', error);
    }
  };

  const handleLike = async () => {
    try {
      const res = await API.post(`/posts/${post._id}/like`);
      setLikes(res.data.likes);
      setIsLiked(res.data.isLiked);
    } catch (error) {
      console.error('Like failed:', error);
    }
  };

  const handleBookmark = async () => {
    try {
      await API.post(`/posts/${post._id}/bookmark`);
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error('Bookmark failed:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    try {
      await API.delete(`/posts/${post._id}`);
      onDelete(post._id);
    } catch (error) {
      alert('Failed to delete post');
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

  const renderContent = (text) => {
    const parts = text.split(/(#\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        const tag = part.substring(1);
        return (
          <span
            key={index}
            onClick={() => navigate(`/hashtag/${tag.replace('#', '')}`)}
            className="text-indigo-600 hover:text-indigo-700 cursor-pointer font-medium"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {post.author.fullName.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{post.author.fullName}</p>
            <p
              onClick={() => navigate(`/profile/${post.author.username}`)}
              className="text-sm text-gray-500 cursor-pointer hover:text-indigo-600"
            >
              @{post.author.username} · {formatDate(post.createdAt)}
            </p>
          </div>
        </div>

        {currentUser?.id === post.author._id && (
          <button onClick={handleDelete} className="text-red-500 hover:text-red-600">
            <Trash2 size={20} />
          </button>
        )}
      </div>

      {/* Content with clickable hashtags */}
      <p className="text-gray-800 mb-4 whitespace-pre-wrap">{renderContent(post.content)}</p>

      {/* Images */}
      {post.images.length > 0 && (
        <div className={`grid gap-2 mb-4 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {post.images.map((img, index) => (
            <img
              key={index}
              src={img.url}
              alt=""
              loading="lazy"
              className="w-full h-64 object-cover rounded-lg"
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 pt-4 border-t">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : 'text-gray-600'} hover:text-red-500 transition`}
        >
          <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
          <span className="font-medium">{likes}</span>
        </button>

        <div className="flex items-center gap-2 text-gray-600">
          <MessageCircle size={20} />
          <span className="font-medium">{post.commentCount}</span>
        </div>

        <button
          onClick={handleBookmark}
          className={`ml-auto ${isBookmarked ? 'text-indigo-600' : 'text-gray-600'} hover:text-indigo-600 transition`}
        >
          <Bookmark size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Comment Section */}
      <CommentSection
        postId={post._id}
        currentUser={currentUser}
        commentCount={post.commentCount}
      />
    </div>
  );
}