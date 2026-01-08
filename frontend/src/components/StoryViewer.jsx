import { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const StoryViewer = ({ storyGroup, onClose, onNext, onPrevious, isOwn, onStoryDeleted }) => {
  const { user } = useContext(AuthContext);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [viewersList, setViewersList] = useState([]);
  const [showViewers, setShowViewers] = useState(false);
  const timerRef = useRef(null);
  const touchStartRef = useRef(null);

  // ✅ FIXED: Now accessing storyGroup.stories instead of userStories.stories
  const currentStory = storyGroup?.stories[currentIndex];
  const isOwnStory = isOwn || currentStory?.author._id === user?.id;

  // Progress bar timer
  useEffect(() => {
    if (isPaused || !currentStory) return;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(timerRef.current);
  }, [currentIndex, isPaused, currentStory]);

  // Mark as viewed
  useEffect(() => {
    if (currentStory && !isOwnStory) {
      const markViewed = async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.post(
            `http://localhost:5000/api/stories/${currentStory._id}/view`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (error) {
          console.error('Error marking story as viewed:', error);
        }
      };
      markViewed();
    }
  }, [currentStory?._id, isOwnStory]);

  const handleNext = () => {
    // ✅ FIXED: Now checking storyGroup.stories.length
    if (currentIndex < storyGroup.stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onNext?.();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    } else {
      onPrevious?.();
    }
  };

  const handleClick = (e) => {
    const clickX = e.clientX;
    const screenWidth = window.innerWidth;

    if (clickX < screenWidth / 3) {
      handlePrevious();
    } else if (clickX > (screenWidth * 2) / 3) {
      handleNext();
    }
  };

  // Touch handlers for mobile swipe gestures
  const handleTouchStart = (e) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    };
    setIsPaused(true);
  };

  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return;

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
      time: Date.now()
    };

    const deltaX = touchEnd.x - touchStartRef.current.x;
    const deltaY = touchEnd.y - touchStartRef.current.y;
    const deltaTime = touchEnd.time - touchStartRef.current.time;

    // Swipe down to close (Instagram-style)
    if (deltaY > 100 && Math.abs(deltaX) < 50 && deltaTime < 300) {
      onClose();
      return;
    }

    // Swipe left/right to navigate
    if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 50 && deltaTime < 300) {
      if (deltaX > 0) {
        handlePrevious();
      } else {
        handleNext();
      }
      return;
    }

    // Quick tap in middle to show reactions
    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 200) {
      const screenWidth = window.innerWidth;
      if (touchStartRef.current.x > screenWidth / 3 && touchStartRef.current.x < (screenWidth * 2) / 3) {
        setShowReactions(!showReactions);
      }
    }

    setIsPaused(false);
    touchStartRef.current = null;
  };

  const handleReaction = async (emoji) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/stories/${currentStory._id}/react`,
        { reaction: emoji },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowReactions(false);
      
      // Show reaction animation
      const reactionEl = document.getElementById('reaction-feedback');
      if (reactionEl) {
        reactionEl.textContent = emoji;
        reactionEl.classList.remove('hidden');
        setTimeout(() => reactionEl.classList.add('hidden'), 2000);
      }
    } catch (error) {
      console.error('Reaction error:', error);
      alert('Failed to send reaction');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this story?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/stories/${currentStory._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // ✅ Refresh stories feed before closing
      if (onStoryDeleted) {
        await onStoryDeleted();
      }
      
      // ✅ FIXED: Check storyGroup.stories.length
      if (storyGroup.stories.length === 1) {
        onClose();
      } else {
        handleNext();
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete story');
    }
  };

  const fetchViewers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/stories/${currentStory._id}/viewers`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setViewersList(response.data);
      setShowViewers(true);
    } catch (error) {
      console.error('Fetch viewers error:', error);
    }
  };

  // ✅ FIXED: Added safety check
  if (!storyGroup || !currentStory) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress Bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
        {/* ✅ FIXED: Map over storyGroup.stories */}
        {storyGroup.stories.map((_, idx) => (
          <div key={idx} className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all"
              style={{
                width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4 z-10">
        <div className="flex items-center gap-3">
          <img
            src={currentStory.author.profileImage || 'https://via.placeholder.com/40'}
            alt={currentStory.author.username}
            className="w-10 h-10 rounded-full border-2 border-white"
          />
          <div>
            <p className="text-white font-semibold">{currentStory.author.username}</p>
            <p className="text-gray-300 text-xs">
              {new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOwnStory && (
            <>
              <button
                onClick={fetchViewers}
                className="text-white px-3 py-1 bg-black bg-opacity-50 rounded-full text-sm hover:bg-opacity-70"
              >
                👁️ {currentStory.viewers?.length || 0}
              </button>
              <button
                onClick={handleDelete}
                className="text-white p-2 bg-red-500 bg-opacity-80 rounded-full hover:bg-opacity-100"
              >
                🗑️
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="text-white text-2xl w-8 h-8 flex items-center justify-center hover:opacity-80"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Story Content */}
      <div
        className="w-full h-full flex items-center justify-center cursor-pointer"
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {currentStory.type === 'image' ? (
          <img
            src={currentStory.image.url}
            alt="Story"
            className="max-w-full max-h-full object-contain select-none"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center p-8"
            style={{ backgroundColor: currentStory.text.backgroundColor }}
          >
            <p
              className="text-4xl font-bold text-center select-none"
              style={{ color: currentStory.text.textColor }}
            >
              {currentStory.text.content}
            </p>
          </div>
        )}
      </div>

      {/* Reaction Emoji Feedback Animation */}
      <div
        id="reaction-feedback"
        className="hidden absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-8xl pointer-events-none"
        style={{ animation: 'bounce 0.5s ease-in-out' }}
      />

      {/* Reactions Bar (Instagram-style) */}
      {showReactions && !isOwnStory && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-white rounded-full px-6 py-3 flex gap-4 shadow-lg">
          {['❤️', '🔥', '😂', '😮', '😢', '👏'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="text-3xl hover:scale-125 transition-transform active:scale-110"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Send Reaction Button */}
      {!isOwnStory && (
        <div className="absolute bottom-6 left-0 right-0 px-4">
          <button
            onClick={() => setShowReactions(!showReactions)}
            className="w-full py-3 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-full border-2 border-white hover:bg-opacity-30 transition"
          >
            {showReactions ? 'Cancel' : '💬 Send Reaction'}
          </button>
        </div>
      )}

      {/* Viewers Modal (Bottom Sheet) */}
      {showViewers && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-end z-20" onClick={() => setShowViewers(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-96 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Viewers ({viewersList.length})</h3>
              <button onClick={() => setShowViewers(false)} className="text-2xl hover:opacity-70">✕</button>
            </div>
            {viewersList.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No views yet</p>
            ) : (
              viewersList.map((viewer) => (
                <div key={viewer._id} className="flex items-center gap-3 py-2 hover:bg-gray-50 rounded-lg px-2">
                  <img
                    src={viewer.user.profileImage || 'https://via.placeholder.com/40'}
                    alt={viewer.user.username}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{viewer.user.username}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(viewer.viewedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryViewer;