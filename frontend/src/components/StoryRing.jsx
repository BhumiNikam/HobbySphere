import React from 'react';

const StoryRing = ({ author, hasUnviewed, isOwn, onClick }) => {
  return (
    <div 
      className="flex flex-col items-center cursor-pointer"
      onClick={onClick}
    >
      {/* Story Ring */}
      <div className={`p-[3px] rounded-full ${
        hasUnviewed 
          ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600' 
          : 'bg-gray-300'
      }`}>
        <div className="p-[3px] bg-white rounded-full">
          <img
            src={author.profileImage || 'https://via.placeholder.com/64'}
            alt={author.username}
            className="w-16 h-16 rounded-full object-cover"
          />
        </div>
      </div>

      {/* Username */}
      <p className="text-xs mt-1 max-w-[70px] truncate">
        {isOwn ? 'Your Story' : author.username}
      </p>
    </div>
  );
};

export default StoryRing;