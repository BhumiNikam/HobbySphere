import { useState, useEffect, useRef } from 'react';
import ReelPlayer from './ReelPlayer';
import ReelActions from './ReelActions';
import axios from 'axios';

const ReelsFeed = ({ reels, onLoadMore, hasMore }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewedReels, setViewedReels] = useState(new Set());
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const itemHeight = window.innerHeight;
      const newIndex = Math.round(scrollTop / itemHeight);
      
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < reels.length) {
        setActiveIndex(newIndex);
      }

      // Load more when near the end
      if (hasMore && newIndex >= reels.length - 2) {
        onLoadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeIndex, reels.length, hasMore, onLoadMore]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowUp' && activeIndex > 0) {
        scrollToReel(activeIndex - 1);
      } else if (e.key === 'ArrowDown' && activeIndex < reels.length - 1) {
        scrollToReel(activeIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [activeIndex, reels.length]);

  const scrollToReel = (index) => {
    const container = containerRef.current;
    if (!container) return;
    
    container.scrollTo({
      top: index * window.innerHeight,
      behavior: 'smooth'
    });
  };

  const handleView = async (reelId) => {
    if (viewedReels.has(reelId)) return;

    try {
      await axios.post(`http://localhost:5000/api/reels/${reelId}/view`);
      setViewedReels(prev => new Set([...prev, reelId]));
    } catch (error) {
      console.error('View count error:', error);
    }
  };

  if (reels.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-500 text-lg">No reels yet</p>
          <p className="text-gray-400 text-sm mt-2">Be the first to upload!</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-scroll snap-y snap-mandatory bg-black"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style>{`
        .h-screen::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      {reels.map((reel, index) => (
        <div
          key={reel._id}
          className="snap-start h-screen relative"
        >
          <ReelPlayer
            reel={reel}
            isActive={index === activeIndex}
            onView={handleView}
          />
          <ReelActions reel={reel} />
        </div>
      ))}

      {/* Loading indicator */}
      {hasMore && (
        <div className="h-20 flex items-center justify-center bg-black">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
};

export default ReelsFeed;