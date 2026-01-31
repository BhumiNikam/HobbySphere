import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Globe, Users, Image as ImageIcon, X, Video } from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PostForm({ onPostCreated, communityId: propCommunityId }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [postTo, setPostTo] = useState(propCommunityId ? 'community' : 'profile');
  const [selectedCommunity, setSelectedCommunity] = useState(propCommunityId || '');
  const [communities, setCommunities] = useState([]);

  // ✅ Fetch user's communities
  useState(() => {
    (async () => {
      try {
        const res = await API.get('/users/me');
        const userCommunities = res.data.user.communities || [];
        
        // Fetch full community details
        if (userCommunities.length > 0) {
          const communityDetails = await Promise.all(
            userCommunities.map(id => API.get(`/communities/${id}`).catch(() => null))
          );
          setCommunities(communityDetails.filter(Boolean).map(r => r.data));
        }
      } catch (err) {
        console.error('Failed to fetch communities:', err);
      }
    })();
  }, []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const file = files[0]; // Only take first file
    const isVideo = file.type.startsWith('video/');

    if (isVideo && file.size > 50 * 1024 * 1024) {
      toast.error('Video must be less than 50MB');
      return;
    }

    if (!isVideo && file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    setMediaFiles([file]);

    // ✅ Create preview with original aspect ratio
    const reader = new FileReader();
    reader.onload = (event) => {
      if (isVideo) {
        // For video, create a video element to get dimensions
        const video = document.createElement('video');
        video.src = event.target.result;
        video.onloadedmetadata = () => {
          setMediaPreview({
            url: event.target.result,
            type: 'video',
            width: video.videoWidth,
            height: video.videoHeight,
            aspectRatio: video.videoWidth / video.videoHeight
          });
        };
      } else {
        // For image, create an image element to get dimensions
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          setMediaPreview({
            url: event.target.result,
            type: 'image',
            width: img.width,
            height: img.height,
            aspectRatio: img.width / img.height
          });
        };
      }
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMediaFiles([]);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim() && mediaFiles.length === 0) {
      toast.error('Post content or media is required');
      return;
    }

    // ✅ Validate community selection only if posting to community
    if (postTo === 'community' && !selectedCommunity) {
      toast.error('Please select a community');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('content', content);

      // ✅ Only add communityId if posting to community
      if (postTo === 'community' && selectedCommunity) {
        formData.append('communityId', selectedCommunity);
      }

      mediaFiles.forEach((file) => {
        formData.append('images', file);
      });

      await API.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Post created successfully! 🎉');
      
      // Reset form
      setContent('');
      setMediaFiles([]);
      setMediaPreview(null);
      setSelectedCommunity('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      onPostCreated?.();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create post';
      toast.error(message);
      console.error('Post creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ✅ POST TO SELECTOR - Only show if not forced to community */}
      {!propCommunityId && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPostTo('profile')}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all
              ${postTo === 'profile'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }
            `}
          >
            <Globe size={18} />
            Post to Profile
          </button>

          <button
            type="button"
            onClick={() => setPostTo('community')}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all
              ${postTo === 'community'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }
            `}
          >
            <Users size={18} />
            Post to Community
          </button>
        </div>
      )}

      {/* ✅ COMMUNITY SELECTOR - Only show if posting to community */}
      {postTo === 'community' && (
        <div>
          <select
            value={selectedCommunity}
            onChange={(e) => setSelectedCommunity(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required={postTo === 'community'}
          >
            <option value="">Select a community</option>
            {communities.map((community) => (
              <option key={community._id} value={community._id}>
                {community.name}
              </option>
            ))}
          </select>
          {communities.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              You haven't joined any communities yet
            </p>
          )}
        </div>
      )}

      {/* CONTENT */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        rows={4}
        maxLength={2000}
      />
      <div className="text-right text-xs text-slate-500 dark:text-slate-400">
        {content.length}/2000
      </div>

      {/* ✅ MEDIA PREVIEW - Maintains aspect ratio */}
      {mediaPreview && (
        <div className="relative bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={removeMedia}
            className="absolute top-2 right-2 z-10 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-all"
          >
            <X size={18} />
          </button>

          <div 
            className="flex items-center justify-center bg-slate-950"
            style={{
              aspectRatio: mediaPreview.aspectRatio,
              maxHeight: '500px'
            }}
          >
            {mediaPreview.type === 'video' ? (
              <video
                src={mediaPreview.url}
                controls
                className="w-full h-full object-contain"
                style={{ maxHeight: '500px' }}
              />
            ) : (
              <img
                src={mediaPreview.url}
                alt="Preview"
                className="w-full h-full object-contain"
                style={{ maxHeight: '500px' }}
              />
            )}
          </div>

          {/* Dimensions info */}
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-white text-xs">
            {mediaPreview.width} × {mediaPreview.height}
          </div>
        </div>
      )}

      {/* ACTIONS */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
            id="media-upload"
          />
          <label
            htmlFor="media-upload"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-all"
          >
            <ImageIcon size={18} />
            <span className="text-sm font-medium">Add Media</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || (!content.trim() && mediaFiles.length === 0)}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl font-semibold transition-all disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40"
        >
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  );
}