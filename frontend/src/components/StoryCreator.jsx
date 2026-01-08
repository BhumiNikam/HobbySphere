import React, { useState } from 'react';
import axios from 'axios';

const StoryCreator = ({ isOpen, onClose, onStoryCreated }) => {
  const [storyType, setStoryType] = useState('image');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#667eea');
  const [loading, setLoading] = useState(false);

  // Compress image before preview
  const compressImage = (file, callback) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Max dimensions (Instagram story size)
        const MAX_WIDTH = 1080;
        const MAX_HEIGHT = 1920;
        
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = (height * MAX_WIDTH) / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = (width * MAX_HEIGHT) / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress (0.8 = 80% quality)
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        callback(compressed);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image must be less than 10MB');
        return;
      }

      setImageFile(file);
      
      // Compress before setting preview
      compressImage(file, (compressed) => {
        setImagePreview(compressed);
      });
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      let storyData = {
        type: storyType
      };

      if (storyType === 'image' && imagePreview) {
        storyData.image = imagePreview;
      } else if (storyType === 'text' && textContent.trim()) {
        storyData.text = {
          content: textContent,
          backgroundColor
        };
      } else {
        alert('Please add content to your story');
        setLoading(false);
        return;
      }

      const response = await axios.post(
        'http://localhost:5000/api/stories',
        storyData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      onStoryCreated(response.data);
      handleClose();
    } catch (error) {
      console.error('Create story error:', error);
      alert('Failed to create story');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setImagePreview(null);
    setImageFile(null);
    setTextContent('');
    setBackgroundColor('#667eea');
    setStoryType('image');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Create Story</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Type Selector */}
        <div className="flex gap-2 p-4 border-b">
          <button
            onClick={() => setStoryType('image')}
            className={`flex-1 py-2 rounded-lg font-medium ${
              storyType === 'image'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            📷 Image
          </button>
          <button
            onClick={() => setStoryType('text')}
            className={`flex-1 py-2 rounded-lg font-medium ${
              storyType === 'text'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            📝 Text
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4">
          {storyType === 'image' ? (
            <div>
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-96 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => {
                      setImagePreview(null);
                      setImageFile(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-96 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <div className="flex flex-col items-center">
                    <svg
                      className="w-12 h-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">
                      Click to upload image
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Max 10MB • Optimized automatically
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
          ) : (
            <div>
              {/* Text Story Preview */}
              <div
                className="w-full h-96 rounded-lg flex items-center justify-center p-8"
                style={{ backgroundColor }}
              >
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Type your story..."
                  className="w-full h-full bg-transparent text-white text-2xl font-bold text-center resize-none outline-none placeholder-white placeholder-opacity-50"
                  maxLength={200}
                />
              </div>

              {/* Color Picker */}
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">
                  Background Color
                </label>
                <div className="flex gap-2">
                  {['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a'].map(
                    (color) => (
                      <button
                        key={color}
                        onClick={() => setBackgroundColor(color)}
                        className={`w-10 h-10 rounded-full ${
                          backgroundColor === color
                            ? 'ring-2 ring-offset-2 ring-blue-500'
                            : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    )
                  )}
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-10 h-10 rounded-full cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t">
          <button
            onClick={handleClose}
            className="flex-1 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Post Story'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoryCreator;