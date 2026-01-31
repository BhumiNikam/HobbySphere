import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { X, Image as ImageIcon, Video, Globe, Users } from 'lucide-react';
import API from '../services/api';

export default function PostForm({ onPostCreated, communityId = null }) {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);

  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const [postType, setPostType] = useState(communityId ? 'community' : 'profile');
  const [selectedCommunity, setSelectedCommunity] = useState(communityId || '');
  const [userCommunities, setUserCommunities] = useState([]);

  /* ================= FETCH COMMUNITIES ================= */
  useEffect(() => {
    if (!communityId) fetchUserCommunities();
  }, [communityId]);

  const fetchUserCommunities = async () => {
    try {
      const res = await API.get('/communities');
      const all = res.data.communities || res.data || [];

      const joined = all.filter((c) =>
        c.members?.some(
          (m) => m.toString() === user._id || m._id === user._id
        )
      );

      setUserCommunities(joined);
    } catch {
      setUserCommunities([]);
    }
  };

  /* ================= FILE HANDLING ================= */
  const addFiles = (newFiles) => {
    if (!newFiles.length) return;

    const remaining = 4 - files.length;
    if (remaining <= 0) {
      toast.error('Maximum 4 files allowed');
      return;
    }

    const allowedTypes = ['image/', 'video/'];
    const validFiles = [];
    const validPreviews = [];

    newFiles.slice(0, remaining).forEach((file) => {
      if (!allowedTypes.some((t) => file.type.startsWith(t))) {
        toast.error('Only images and videos are allowed');
        return;
      }

      validFiles.push(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        validPreviews.push({
          url: reader.result,
          type: file.type.startsWith('video/') ? 'video' : 'image'
        });
        if (validPreviews.length === validFiles.length) {
          setPreviews((prev) => [...prev, ...validPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const handleFileSelect = (e) => {
    addFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    addFiles(Array.from(e.dataTransfer.files));
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Please write something');
      return;
    }

    // If posting to community, require community selection
    if (postType === 'community') {
      const finalCommunityId = communityId || selectedCommunity;
      if (!finalCommunityId) {
        toast.error('Please select a community');
        return;
      }
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      
      // Only add communityId if posting to community
      if (postType === 'community') {
        formData.append('communityId', communityId || selectedCommunity);
      }
      
      files.forEach((file) => formData.append('images', file));

      const res = await API.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setContent('');
      setFiles([]);
      setPreviews([]);
      setSelectedCommunity(communityId || '');
      setPostType(communityId ? 'community' : 'profile');

      onPostCreated(res.data);
      toast.success('Post created successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="
        bg-white dark:bg-slate-900 rounded-2xl
        border border-slate-200 dark:border-slate-700
        shadow-sm
        p-6
      "
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* USER INFO */}
        <div className="flex gap-3 items-center">
          <img
            src={
              user?.profileImage ||
              `https://ui-avatars.com/api/?name=${user?.fullName || 'User'}`
            }
            alt={user?.fullName}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800 shadow-sm"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
              {user.fullName}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
              @{user.username}
            </p>
          </div>
        </div>

        {/* POST TYPE TOGGLE (only show if not locked to community) */}
        {!communityId && (
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setPostType('profile')}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all
                ${postType === 'profile'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }
              `}
            >
              <Globe size={18} />
              Post to Profile
            </button>
            <button
              type="button"
              onClick={() => setPostType('community')}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all
                ${postType === 'community'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }
              `}
            >
              <Users size={18} />
              Post to Community
            </button>
          </div>
        )}

        {/* COMMUNITY SELECTOR (only show if posting to community) */}
        {!communityId && postType === 'community' && (
          <select
            required
            value={selectedCommunity}
            onChange={(e) => setSelectedCommunity(e.target.value)}
            className="
              w-full px-4 py-3
              rounded-xl
              border border-slate-200 dark:border-slate-700
              bg-white dark:bg-slate-800
              text-slate-900 dark:text-slate-100
              focus:border-indigo-500 dark:focus:border-indigo-400
              focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30
              transition-all
            "
          >
            <option value="">Select a community</option>
            {userCommunities.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        {/* TEXT AREA */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          rows={4}
          maxLength={2000}
          className="
            w-full px-4 py-3
            rounded-xl
            border border-slate-200 dark:border-slate-700
            bg-white dark:bg-slate-800
            text-slate-900 dark:text-slate-100
            placeholder:text-slate-400 dark:placeholder:text-slate-500
            resize-none
            focus:border-indigo-500 dark:focus:border-indigo-400
            focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30
            transition-all
          "
        />
        <div className="text-right text-xs text-slate-400 dark:text-slate-500">
          {content.length}/2000
        </div>

        {/* MEDIA PREVIEW */}
        {previews.length > 0 && (
          <div className={`grid gap-3 ${previews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {previews.map((preview, i) => (
              <div key={i} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                {preview.type === 'video' ? (
                  <video
                    src={preview.url}
                    controls
                    className="w-full h-48 object-cover bg-black"
                  />
                ) : (
                  <img
                    src={preview.url}
                    alt="preview"
                    className="w-full h-48 object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="
                    absolute top-2 right-2
                    bg-black/70 hover:bg-black/90 text-white
                    p-2 rounded-full
                    opacity-0 group-hover:opacity-100
                    transition-all hover:scale-110
                  "
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
          <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
            <ImageIcon size={20} />
            <span>Add Media</span>
            <input
              type="file"
              hidden
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
            />
          </label>

          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="
              px-6 py-2.5
              rounded-xl
              bg-indigo-600 dark:bg-indigo-500 text-white
              font-semibold
              hover:bg-indigo-700 dark:hover:bg-indigo-600
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all
              shadow-md hover:shadow-lg
              hover:scale-105 active:scale-95
            "
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}