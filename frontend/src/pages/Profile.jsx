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
  const { user: currentUser, refreshUser } = useContext(AuthContext);
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
  }, [username, currentUser]);

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

      // Fixed comparison - check if currentUser._id exists in followers array
      if (currentUser?._id && data.followers) {
        const isUserFollowing = data.followers.some(
          (follower) => {
            // Handle both populated and non-populated followers
            const followerId = typeof follower === 'object' ? follower._id : follower;
            return followerId.toString() === currentUser._id.toString();
          }
        );
        setIsFollowing(isUserFollowing);
      } else {
        setIsFollowing(false);
      }
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
      
      // Refresh current user data to update following list
      if (refreshUser) {
        await refreshUser();
      }
      
      toast.success(res.data.isFollowing ? t('profile.follow') : t('profile.unfollow'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 sm:py-24">
        <div className="spinner" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 sm:py-24">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <UserIcon size={32} className="sm:w-10 sm:h-10 text-slate-300 dark:text-slate-600" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">{t('search.noResults')}</h2>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">{t('search.noResults')}</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?.username === profile.username;

  return (
    <div className="w-full pb-8 sm:pb-12 animate-fade-in max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-sm dark:shadow-xl dark:shadow-black/20 overflow-hidden mb-6 sm:mb-8 border border-slate-200 dark:border-slate-800">
        {/* Cover Image */}
        <div className="relative h-40 sm:h-56 md:h-72 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-hidden">
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
              className="absolute bottom-3 right-3 sm:bottom-6 sm:right-6 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm p-2 sm:p-3 rounded-xl shadow-lg 
                         hover:scale-105 transition-transform"
            >
              <Camera size={16} className="sm:w-5 sm:h-5 text-slate-700 dark:text-slate-300" />
            </button>
          )}
        </div>

        {/* Profile Content */}
        <div className="px-4 sm:px-6 md:px-8 pb-6 sm:pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-12 sm:-mt-20 gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="relative">
              <img
                src={
                  profile.profileImage ||
                  `https://ui-avatars.com/api/?name=${profile.username}&background=6366f1&color=fff&size=256`
                }
                alt="Avatar"
                className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full border-4 border-white dark:border-slate-900 shadow-xl object-cover"
              />
              {isOwnProfile && (
                <button
                  onClick={() => {
                    setImageUploadType('profile');
                    setShowImageModal(true);
                  }}
                  className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-white dark:bg-slate-800 p-2 sm:p-2.5 rounded-full shadow-lg 
                             hover:scale-110 transition-transform"
                >
                  <Camera size={14} className="sm:w-[18px] sm:h-[18px] text-slate-700 dark:text-slate-300" />
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 sm:gap-3">
              {isOwnProfile ? (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 
                             text-white font-semibold rounded-xl shadow-md hover:shadow-lg 
                             hover:scale-105 transition-all text-sm sm:text-base"
                >
                  <Edit size={16} className="sm:w-[18px] sm:h-[18px]" /> 
                  <span className="hidden sm:inline">{t('profile.editProfile')}</span>
                  <span className="sm:hidden">Edit</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleFollow}
                    className={`
                      flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 font-semibold rounded-xl shadow-md 
                      transition-all hover:scale-105 text-sm sm:text-base
                      ${isFollowing
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg'
                      }
                    `}
                  >
                    {isFollowing ? t('profile.following') : '+ ' + t('profile.follow')}
                  </button>
                  <button
                    onClick={() => navigate(`/messages?userId=${profile._id}`)}
                    className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold 
                               rounded-xl shadow-md hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105 transition-all text-sm sm:text-base"
                  >
                    <Mail size={16} className="sm:w-[18px] sm:h-[18px]" /> 
                    <span className="hidden sm:inline">{t('messages.send')}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="mt-4 sm:mt-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 break-words">{profile.fullName}</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm sm:text-base">@{profile.username}</p>

            {profile.bio && (
              <p className="mt-3 sm:mt-4 max-w-xl text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed break-words">
                {profile.bio}
              </p>
            )}

            <div className="flex flex-wrap gap-3 sm:gap-4 mt-4 sm:mt-5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {profile.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="sm:w-4 sm:h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" /> 
                  <span className="truncate">{profile.location}</span>
                </span>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors truncate"
                >
                  <LinkIcon size={14} className="sm:w-4 sm:h-4 flex-shrink-0" /> 
                  <span className="truncate">Website</span>
                </a>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="sm:w-4 sm:h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" /> 
                <span className="truncate">
                  {t('profile.joinedOn')}{' '}
                  {new Date(profile.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 sm:gap-8 mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-100 dark:border-slate-800">
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

      {/* Posts Section */}
      <div className="w-full space-y-4 sm:space-y-6">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 px-1">{t('profile.posts')}</h2>

        {posts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 sm:p-20 text-center shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center">
              <UserIcon size={24} className="sm:w-8 sm:h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
              {isOwnProfile ? t('community.noPosts') : t('community.noPosts')}
            </p>
          </div>
        ) : (
          <div className="w-full space-y-4 sm:space-y-6">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} currentUser={currentUser} />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
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
      <p className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        {value}
      </p>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium truncate">{label}</p>
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
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">{t('profile.editProfile')}</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('auth.fullName')}
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
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
              className="w-full px-3 sm:px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm sm:text-base"
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
              className="w-full px-3 sm:px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
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
              className="w-full px-3 sm:px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
              placeholder="https://example.com"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 sm:px-6 py-2 sm:py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm sm:text-base"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 text-sm sm:text-base"
            >
              {loading ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}