import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { X, Image } from 'lucide-react';
import API from '../services/api';

export default function PostForm({ onPostCreated, communityId = null }) {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);

  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedCommunity, setSelectedCommunity] = useState(
    communityId || ''
  );
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
        validPreviews.push(reader.result);
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
    if (!content.trim()) return;

    const finalCommunityId = communityId || selectedCommunity;
    if (!finalCommunityId) {
      toast.error(t('community.createCommunity'));
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      formData.append('communityId', finalCommunityId);
      files.forEach((file) => formData.append('images', file));

      const res = await API.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setContent('');
      setFiles([]);
      setPreviews([]);
      setSelectedCommunity(communityId || '');

      onPostCreated(res.data);
      toast.success(t('post.postCreated'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
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
        bg-white dark:bg-slate-800 rounded-2xl
        border border-slate-100 dark:border-slate-700
        shadow-sm
        p-6
      "
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* USER */}
        <div className="flex gap-3 items-center">
          <img
            src={
              user?.profileImage ||
              `https://ui-avatars.com/api/?name=${user?.fullName || 'User'}`
            }
            alt={user?.fullName}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              {user.fullName}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              @{user.username}
            </p>
          </div>
        </div>

        {/* COMMUNITY */}
        {!communityId && (
          <select
            required
            value={selectedCommunity}
            onChange={(e) => setSelectedCommunity(e.target.value)}
            className="
              w-full px-4 py-2.5
              rounded-xl
              border border-slate-200 dark:border-slate-600
              bg-slate-50 dark:bg-slate-700
              text-slate-900 dark:text-slate-100
              focus:bg-white dark:focus:bg-slate-600
              focus:border-indigo-300
              focus:ring-2 focus:ring-indigo-100
              transition
            "
          >
            <option value="">{t('community.createCommunity')}</option>
            {userCommunities.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        {/* TEXT */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('post.whatOnMind')}
          rows={4}
          maxLength={2000}
          className="
            w-full px-4 py-3
            rounded-xl
            border border-slate-200 dark:border-slate-600
            bg-white dark:bg-slate-700
            text-slate-900 dark:text-slate-100
            placeholder:text-slate-400 dark:placeholder:text-slate-500
            resize-none
            focus:border-indigo-300
            focus:ring-2 focus:ring-indigo-100
            transition
          "
        />
        <div className="text-right text-xs text-slate-400">
          {content.length}/2000
        </div>

        {/* MEDIA PREVIEW */}
        {previews.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {previews.map((src, i) => (
              <div key={i} className="relative group">
                <img
                  src={src}
                  alt="preview"
                  className="w-full h-40 rounded-xl object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="
                    absolute top-2 right-2
                    bg-black/60 text-white
                    p-1.5 rounded-full
                    opacity-0 group-hover:opacity-100
                    transition
                  "
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex justify-between items-center pt-4 border-t dark:border-slate-700">
          <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition">
            <Image size={18} />
            Add media
            <input
              type="file"
              hidden
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
            />
          </label>

          <button
            disabled={loading || !content.trim()}
            className="
              px-6 py-2
              rounded-xl
              bg-indigo-600 text-white
              font-semibold
              hover:bg-indigo-700
              disabled:opacity-50
              transition
            "
          >
            {loading ? t('common.loading') : t('nav.createPost')}
          </button>
        </div>
      </form>
    </div>
  );
}