import { useState } from 'react';
import { Heart, MessageCircle, Share2, Eye } from 'lucide-react';
import axios from 'axios';

const ReelActions = ({ reel, onLikeUpdate }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(reel.likes?.length || 0);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    const newIsLiked = !isLiked;
    const newCount = newIsLiked ? likesCount + 1 : likesCount - 1;
    
    // Optimistic update
    setIsLiked(newIsLiked);
    setLikesCount(newCount);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/reels/${reel._id}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setLikesCount(response.data.likes);
      setIsLiked(response.data.isLiked);
      if (onLikeUpdate) onLikeUpdate(reel._id, response.data);
    } catch (error) {
      // Revert on error
      setIsLiked(!newIsLiked);
      setLikesCount(likesCount);
      console.error('Like error:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = () => {
    // TODO: Open comment modal
    console.log('Open comments for reel:', reel._id);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/reels/${reel._id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out this reel by ${reel.author.username}`,
          text: reel.caption,
          url: shareUrl
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  const formatCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count;
  };

  return (
    <div className="absolute right-4 bottom-20 flex flex-col gap-4 z-10">
      {/* Like Button */}
      <div className="flex flex-col items-center">
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70 transition-all ${
            isLiked ? 'text-red-500' : 'text-white'
          }`}
        >
          <Heart size={28} fill={isLiked ? 'currentColor' : 'none'} />
        </button>
        <span className="text-white text-xs mt-1 font-semibold">
          {formatCount(likesCount)}
        </span>
      </div>

      {/* Comment Button */}
      <div className="flex flex-col items-center">
        <button
          onClick={handleComment}
          className="bg-black bg-opacity-50 rounded-full p-3 text-white hover:bg-opacity-70"
        >
          <MessageCircle size={28} />
        </button>
        <span className="text-white text-xs mt-1 font-semibold">
          {formatCount(reel.commentCount || 0)}
        </span>
      </div>

      {/* Share Button */}
      <div className="flex flex-col items-center">
        <button
          onClick={handleShare}
          className="bg-black bg-opacity-50 rounded-full p-3 text-white hover:bg-opacity-70"
        >
          <Share2 size={28} />
        </button>
        <span className="text-white text-xs mt-1 font-semibold">Share</span>
      </div>

      {/* View Count */}
      <div className="flex flex-col items-center">
        <div className="bg-black bg-opacity-50 rounded-full p-3 text-white">
          <Eye size={28} />
        </div>
        <span className="text-white text-xs mt-1 font-semibold">
          {formatCount(reel.viewCount || 0)}
        </span>
      </div>
    </div>
  );
};

export default ReelActions; 