import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import StoryRing from './StoryRing';
import StoryViewer from './StoryViewer';
import StoryCreator from './StoryCreator';
import { AuthContext } from '../context/AuthContext';

const StoriesFeed = () => {
  const { user } = useContext(AuthContext);
  const [storyGroups, setStoryGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreator, setShowCreator] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:5000/api/stories/feed',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setStoryGroups(response.data);
    } catch (error) {
      console.error('Fetch stories error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStoryClick = (index) => {
    setCurrentGroupIndex(index);
    setShowViewer(true);
  };

  const handleStoryCreated = (newStory) => {
    // Refresh stories feed
    fetchStories();
  };

  const handleNext = () => {
    if (currentGroupIndex < storyGroups.length - 1) {
      setCurrentGroupIndex(currentGroupIndex + 1);
    } else {
      setShowViewer(false);
    }
  };

  const handlePrevious = () => {
    if (currentGroupIndex > 0) {
      setCurrentGroupIndex(currentGroupIndex - 1);
    }
  };

  const handleClose = () => {
    setShowViewer(false);
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex gap-4 overflow-x-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
              <div className="w-12 h-3 bg-gray-200 rounded mt-2 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Check if user has their own story
  const userStoryGroup = storyGroups.find(
    (group) => group.author._id === user?._id
  );

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide">
          {/* Your Story / Add Story */}
          <div className="flex flex-col items-center cursor-pointer flex-shrink-0">
            {userStoryGroup ? (
              <StoryRing
                author={user}
                hasUnviewed={false}
                isOwn={true}
                onClick={() => {
                  const index = storyGroups.findIndex(
                    (g) => g.author._id === user._id
                  );
                  handleStoryClick(index);
                }}
              />
            ) : (
              <div onClick={() => setShowCreator(true)}>
                <div className="p-[3px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-full">
                  <div className="p-[3px] bg-white rounded-full">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                      <img
                        src={user?.profileImage || 'https://via.placeholder.com/64'}
                        alt="Your profile"
                        className="w-14 h-14 rounded-full object-cover"
                      />
                      <div className="absolute bottom-0 right-0 bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xl font-bold">
                        +
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs mt-1 max-w-[70px] truncate">Your Story</p>
              </div>
            )}
          </div>

          {/* Other Users' Stories */}
          {storyGroups
            .filter((group) => group.author._id !== user?._id)
            .map((group, index) => {
              const actualIndex = storyGroups.findIndex(
                (g) => g.author._id === group.author._id
              );
              return (
                <div key={group.author._id} className="flex-shrink-0">
                  <StoryRing
                    author={group.author}
                    hasUnviewed={group.hasUnviewed}
                    isOwn={false}
                    onClick={() => handleStoryClick(actualIndex)}
                  />
                </div>
              );
            })}

          {/* Empty State */}
          {storyGroups.length === 0 && !userStoryGroup && (
            <div className="flex items-center justify-center w-full py-4">
              <p className="text-gray-500 text-sm">
                No stories yet. Be the first to share!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Story Creator Modal */}
      <StoryCreator
        isOpen={showCreator}
        onClose={() => setShowCreator(false)}
        onStoryCreated={handleStoryCreated}
      />

      {/* Story Viewer */}
      {showViewer && storyGroups[currentGroupIndex] && (
        <StoryViewer
          storyGroup={storyGroups[currentGroupIndex]}
          onClose={handleClose}
          onNext={handleNext}
          onPrevious={handlePrevious}
          isOwn={storyGroups[currentGroupIndex].author._id === user?.id}
          onStoryDeleted={fetchStories}
        />
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};

export default StoriesFeed;