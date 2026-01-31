import { useState, useEffect, useContext } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import {
  MapPin,
  Link as LinkIcon,
  Calendar,
  Edit,
  Camera,
  Mail,
  User as UserIcon,
} from 'lucide-react';
import ImageUploadModal from '../components/ImageUploadModal';
import PostCard from '../components/PostCard';
import API from '../services/api';

export default function Profile() {
  const { t } = useTranslation();
  const { username } = useParams();
  const { user: currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUploadType, setImageUploadType] = useState(null);

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [profileRes, postsRes] = await Promise.all([
        API.get(`/users/${username}`),
        API.get(`/users/${username}/posts`),
      ]);

      const data = profileRes.data;
      setProfile(data);
      setPosts(postsRes.data || []);
      setFollowerCount(data.followers?.length || 0);

      setIsFollowing(
        currentUser?._id
          ? data.followers?.some(
              (f) => f._id.toString() === currentUser._id.toString()
            )
          : false
      );
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      const res = await API.post(`/users/${profile._id}/follow`);
      setIsFollowing(res.data.isFollowing);
      setFollowerCount((c) => (res.data.isFollowing ? c + 1 : c - 1));
      toast.success(res.data.isFollowing ? t('profile.follow') : t('profile.unfollow'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-24">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <UserIcon size={40} className="text-slate-300 dark:text-slate-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">{t('search.noResults')}</h2>
        <p className="text-slate-500 dark:text-slate-400">{t('search.noResults')}</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?.username === profile.username;

  return (
    <div className="w-full pb-12 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-card overflow-hidden mb-8">
        <div className="relative h-72 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-hidden">
          {profile.coverImage && (
            <img
              src={profile.coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

          {isOwnProfile && (
            <button
              onClick={() => {
                setImageUploadType('cover');
                setShowImageModal(true);
              }}
              className="absolute bottom-6 right-6 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm p-3 rounded-xl shadow-lg 
                         hover:scale-105 transition-transform"
            >
              <Camera size={20} className="text-slate-700 dark:text-slate-300" />
            </button>
          )}
        </div>

        <div className="px-6 sm:px-8 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-20 gap-6">
            <div className="relative">
              <img
                src={
                  profile.profileImage ||
                  `https://ui-avatars.com/api/?name=${profile.username}&background=6366f1&color=fff&size=256`
                }
                alt="Avatar"
                className="w-36 h-36 rounded-full border-4 border-white dark:border-slate-800 shadow-xl object-cover"
              />
              {isOwnProfile && (
                <button
                  onClick={() => {
                    setImageUploadType('profile');
                    setShowImageModal(true);
                  }}
                  className="absolute bottom-2 right-2 bg-white dark:bg-slate-800 p-2.5 rounded-full shadow-lg 
                             hover:scale-110 transition-transform"
                >
                  <Camera size={18} className="text-slate-700 dark:text-slate-300" />
                </button>
              )}
            </div>

            <div className="flex gap-3">
              {isOwnProfile ? (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 
                             text-white font-semibold rounded-xl shadow-lg hover:shadow-glow 
                             hover:scale-105 transition-all"
                >
                  <Edit size={18} /> {t('profile.editProfile')}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleFollow}
                    className={`
                      flex items-center gap-2 px-6 py-2.5 font-semibold rounded-xl shadow-md 
                      transition-all hover:scale-105
                      ${isFollowing
                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-glow'
                      }
                    `}
                  >
                    {isFollowing ? t('profile.following') : '+ ' + t('profile.follow')}
                  </button>
                  <button
                    onClick={() => navigate(`/messages?userId=${profile._id}`)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold 
                               rounded-xl shadow-md hover:bg-slate-200 dark:hover:bg-slate-600 hover:scale-105 transition-all"
                  >
                    <Mail size={18} /> {t('messages.send')}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="mt-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{profile.fullName}</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">@{profile.username}</p>

            {profile.bio && (
              <p className="mt-4 max-w-xl text-slate-700 dark:text-slate-300 leading-relaxed">
                {profile.bio}
              </p>
            )}

            <div className="flex flex-wrap gap-4 mt-5 text-sm text-slate-600 dark:text-slate-400">
              {profile.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={16} className="text-slate-400" /> {profile.location}
                </span>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                  <LinkIcon size={16} /> Website
                </a>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar size={16} className="text-slate-400" /> {t('profile.joinedOn')}{' '}
                {new Date(profile.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          <div className="flex gap-8 mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
            <Stat label={t('profile.posts')} value={posts.length} />
            <Stat
              label={t('profile.followers')}
              value={followerCount}
              clickable
              onClick={() => navigate(`/profile/${username}/followers`)}
            />
            <Stat
              label={t('profile.following')}
              value={profile.following?.length || 0}
              clickable
              onClick={() => navigate(`/profile/${username}/following`)}
            />
          </div>
        </div>
      </div>

      <div className="w-full space-y-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 px-1">{t('profile.posts')}</h2>

        {posts.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-20 text-center shadow-card border border-slate-100 dark:border-slate-700">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center">
              <UserIcon size={32} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              {isOwnProfile ? t('community.noPosts') : t('community.noPosts')}
            </p>
          </div>
        ) : (
          <div className="w-full space-y-6">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} currentUser={currentUser} />
            ))}
          </div>
        )}
      </div>

      {showImageModal && (
        <ImageUploadModal
          type={imageUploadType}
          currentImage={
            imageUploadType === 'profile' ? profile.profileImage : profile.coverImage
          }
          onClose={() => setShowImageModal(false)}
          onUpdate={(url) => {
            setProfile((p) => ({
              ...p,
              ...(imageUploadType === 'profile'
                ? { profileImage: url }
                : { coverImage: url }),
            }));
            setShowImageModal(false);
          }}
        />
      )}

      {showEditModal && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onUpdate={(p) => {
            setProfile(p);
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
}

function Stat({ label, value, onClick, clickable }) {
  const Tag = clickable ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`
        text-left group transition-all
        ${clickable ? 'hover:scale-105 cursor-pointer' : ''}
      `}
    >
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        {value}
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
    </Tag>
  );
}

function EditProfileModal({ profile, onClose, onUpdate }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    fullName: profile.fullName || '',
    bio: profile.bio || '',
    location: profile.location || '',
    website: profile.website || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await API.put('/users/profile', formData);
      toast.success(t('common.success'));
      onUpdate(res.data);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('profile.editProfile')}</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('auth.fullName')}
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder={t('auth.fullName')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('profile.bio')}
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder={t('profile.bio')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="City, Country"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="https://example.com"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}