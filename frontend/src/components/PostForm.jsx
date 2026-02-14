import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Globe, Users, Image as ImageIcon, X, Video, Music, FileText, File, Paperclip } from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PostForm({ onPostCreated, communityId: propCommunityId }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [postTo, setPostTo] = useState(propCommunityId ? 'community' : 'profile');
  const [selectedCommunity, setSelectedCommunity] = useState(propCommunityId || '');
  const [communities, setCommunities] = useState([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        setLoadingCommunities(true);
        const res = await API.get('/communities');
        const allCommunities = res.data.communities || [];
        
        const joinedCommunities = allCommunities.filter((community) =>
          community.members.some(
            (member) => 
              (typeof member === 'string' ? member : member._id) === user._id
          )
        );
        
        setCommunities(joinedCommunities);
      } catch (err) {
        console.error('Failed to fetch communities:', err);
        toast.error(t('post.failedToLoadCommunities') || 'Failed to load communities');
      } finally {
        setLoadingCommunities(false);
      }
    };

    fetchCommunities();
  }, [user._id, t]);

  const getMediaType = (file) => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type === 'application/pdf') return 'pdf';
    return 'document';
  };

  const getMediaIcon = (type) => {
    switch (type) {
      case 'image': return <ImageIcon size={20} />;
      case 'video': return <Video size={20} />;
      case 'audio': return <Music size={20} />;
      case 'pdf': return <FileText size={20} />;
      case 'document': return <File size={20} />;
      default: return <Paperclip size={20} />;
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Validate file sizes
    for (const file of files) {
      if (file.size > 100 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 100MB`);
        return;
      }
    }

    // Limit to 10 files
    const totalFiles = mediaFiles.length + files.length;
    if (totalFiles > 10) {
      toast.error('Maximum 10 files allowed');
      return;
    }

    setMediaFiles(prev => [...prev, ...files]);

    // Create previews
    files.forEach(file => {
      const type = getMediaType(file);
      const reader = new FileReader();

      reader.onload = (event) => {
        if (type === 'video') {
          const video = document.createElement('video');
          video.src = event.target.result;
          video.onloadedmetadata = () => {
            setMediaPreviews(prev => [...prev, {
              url: event.target.result,
              type: 'video',
              name: file.name,
              size: file.size,
              width: video.videoWidth,
              height: video.videoHeight,
              aspectRatio: video.videoWidth / video.videoHeight
            }]);
          };
        } else if (type === 'image') {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
            setMediaPreviews(prev => [...prev, {
              url: event.target.result,
              type: 'image',
              name: file.name,
              size: file.size,
              width: img.width,
              height: img.height,
              aspectRatio: img.width / img.height
            }]);
          };
        } else {
          setMediaPreviews(prev => [...prev, {
            url: event.target.result,
            type,
            name: file.name,
            size: file.size
          }]);
        }
      };
      
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current && mediaFiles.length === 1) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim() && mediaFiles.length === 0) {
      toast.error(t('post.contentRequired') || 'Post content or media is required');
      return;
    }

    if (postTo === 'community' && !selectedCommunity) {
      toast.error(t('post.selectCommunityRequired') || 'Please select a community');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('content', content);

      if (postTo === 'community' && selectedCommunity) {
        const communityId = typeof selectedCommunity === 'string' 
          ? selectedCommunity 
          : selectedCommunity._id;
        formData.append('communityId', communityId);
      }

      // ✅ Changed from 'images' to 'media'
      mediaFiles.forEach((file) => {
        formData.append('media', file);
      });

      const res = await API.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(t('post.postCreated') || 'Post created successfully! 🎉');
      
      // Reset form
      setContent('');
      setMediaFiles([]);
      setMediaPreviews([]);
      setSelectedCommunity(propCommunityId || '');
      if (!propCommunityId) setPostTo('profile');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Call callback with new post
      if (onPostCreated) {
        onPostCreated(res.data);
      }
    } catch (err) {
      const message = err.response?.data?.message || t('post.createFailed') || 'Failed to create post';
      toast.error(message);
      console.error('Post creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* POST TO SELECTOR */}
      {!propCommunityId && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setPostTo('profile');
              setSelectedCommunity('');
            }}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all
              ${postTo === 'profile'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }
            `}
          >
            <Globe size={18} />
            {t('post.postToProfile') || 'Post to Profile'}
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
            {t('post.postToCommunity') || 'Post to Community'}
          </button>
        </div>
      )}

      {/* COMMUNITY SELECTOR */}
      {postTo === 'community' && (
        <div>
          <select
            value={selectedCommunity}
            onChange={(e) => setSelectedCommunity(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required={postTo === 'community'}
            disabled={loadingCommunities || propCommunityId}
          >
            <option value="">
              {loadingCommunities 
                ? (t('common.loading') || 'Loading...') 
                : (t('post.selectCommunity') || 'Select a community')
              }
            </option>
            {communities.map((community) => (
              <option key={community._id} value={community._id}>
                {community.name}
              </option>
            ))}
          </select>
          {!loadingCommunities && communities.length === 0 && !propCommunityId && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              {t('post.noCommunities') || "You haven't joined any communities yet"}
            </p>
          )}
        </div>
      )}

      {/* CONTENT */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t('post.whatOnMind') || "What's on your mind?"}
        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        rows={4}
        maxLength={2000}
      />
      <div className="text-right text-xs text-slate-500 dark:text-slate-400">
        {content.length}/2000
      </div>

      {/* MEDIA PREVIEWS */}
      {mediaPreviews.length > 0 && (
        <div className="space-y-3">
          {mediaPreviews.map((preview, index) => (
            <div key={index} className="relative bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => removeMedia(index)}
                className="absolute top-2 right-2 z-10 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-all"
              >
                <X size={18} />
              </button>

              {preview.type === 'video' ? (
                <div 
                  className="flex items-center justify-center bg-slate-950"
                  style={{
                    aspectRatio: preview.aspectRatio,
                    maxHeight: '400px'
                  }}
                >
                  <video
                    src={preview.url}
                    controls
                    className="w-full h-full object-contain"
                    style={{ maxHeight: '400px' }}
                  />
                </div>
              ) : preview.type === 'image' ? (
                <div 
                  className="flex items-center justify-center bg-slate-950"
                  style={{
                    aspectRatio: preview.aspectRatio,
                    maxHeight: '400px'
                  }}
                >
                  <img
                    src={preview.url}
                    alt="Preview"
                    className="w-full h-full object-contain"
                    style={{ maxHeight: '400px' }}
                  />
                </div>
              ) : (
                <div className="p-4 flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    {getMediaIcon(preview.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {preview.name}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {formatFileSize(preview.size)}
                    </p>
                  </div>
                </div>
              )}

              {/* Dimensions info for images/videos */}
              {(preview.type === 'image' || preview.type === 'video') && (
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-white text-xs">
                  {preview.width} × {preview.height}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ACTIONS */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            onChange={handleFileChange}
            className="hidden"
            id="media-upload"
            multiple
          />
          <label
            htmlFor="media-upload"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-all"
          >
            <Paperclip size={18} />
            <span className="text-sm font-medium">
              {t('post.addMedia') || 'Add Media'} 
              {mediaFiles.length > 0 && ` (${mediaFiles.length})`}
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || (!content.trim() && mediaFiles.length === 0) || (postTo === 'community' && !selectedCommunity)}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl font-semibold transition-all disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40"
        >
          {loading ? (t('post.posting') || 'Posting...') : (t('post.post') || 'Post')}
        </button>
      </div>
    </form>
  );
}