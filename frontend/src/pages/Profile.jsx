import { useState, useEffect, useContext } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { MapPin, Link as LinkIcon, Calendar, Edit, Camera } from 'lucide-react';
import ImageUploadModal from '../components/ImageUploadModal';
import PostCard from '../components/PostCard';
import API from '../services/api';

export default function Profile() {
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
  // Image upload handlers
  const handleImageUpdate = (type) => {
    setImageUploadType(type);
    setShowImageModal(true);
  };

  const handleImageUploaded = (newImageUrl) => {
    if (imageUploadType === 'profile') {
      setProfile({ ...profile, profileImage: newImageUrl });
    } else {
      setProfile({ ...profile, coverImage: newImageUrl });
    }
    setShowImageModal(false);
  };

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, [username]);

  const fetchProfile = async () => {
    try {
      const res = await API.get(`/users/${username}`);
      setProfile(res.data);
      setFollowerCount(res.data.followers.length);
      // FIX: Check using string comparison, not object comparison
      setIsFollowing(
        currentUser?._id 
          ? res.data.followers.some(f => f._id.toString() === currentUser._id.toString())
          : false
      );
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await API.get(`/users/${username}/posts`);
      setPosts(res.data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    }
  };

  const handleFollow = async () => {
    try {
      const res = await API.post(`/users/${profile._id}/follow`);
      setIsFollowing(res.data.isFollowing);
      // Update follower count
      setFollowerCount(prev => res.data.isFollowing ? prev + 1 : prev - 1);
      toast.success(res.data.isFollowing ? 'Following user' : 'Unfollowed user');
    } catch (error) {
      toast.error('Failed to follow/unfollow');
    }
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">User not found</h2>
          <button onClick={() => navigate('/communities')} className="text-indigo-600">Go back to feed</button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.username === profile.username;
  const userId = profile?._id;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 onClick={() => navigate('/communities')} className="text-2xl font-bold text-indigo-600 cursor-pointer">🎨 HobbySphere</h1>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-4 mt-6">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-md mb-6">

          {/* Cover Image */}
          <div className="relative">
            <img
              src={profile.coverImage || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=300&fit=crop'}
              alt="Cover"
              loading="lazy"
              className="h-48 w-full object-cover rounded-t-xl"
            />
            {/* Cover Image Upload Button */}
            {isOwnProfile && (
              <button
                onClick={() => handleImageUpdate('cover')}
                className="absolute bottom-4 right-4 bg-white text-gray-700 p-2 rounded-full shadow-lg hover:bg-gray-100"
              >
                <Camera size={20} />
              </button>
            )}
          </div>

          <div className="px-6 pb-6">

            {/* Avatar */}
            <div className="flex items-end justify-between -mt-16 mb-4">
              <div className="relative">
                <img
                  src={profile.profileImage || `https://ui-avatars.com/api/?name=${profile.username}&background=6366f1&color=fff&size=150`}
                  alt={profile.username}
                  loading="lazy"
                  className="w-32 h-32 object-cover rounded-full border-4 border-white text-white text-5xl font-bold bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center"
                />
                {/* Profile Image Upload Button */}
                {isOwnProfile && (
                  <button
                    onClick={() => handleImageUpdate('profile')}
                    className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700"
                  >
                    <Camera size={16} />
                  </button>
                )}
              </div>
              {isOwnProfile ? (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Edit size={18} />
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={handleFollow}
                    className={`px-6 py-2 rounded-lg font-semibold ${
                      isFollowing
                        ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                  {/* Message Button */}
                  <button
                    onClick={() => navigate(`/messages?userId=${userId}`)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 ml-2"
                  >
                    Message
                  </button>
                </>
              )}
            </div>

            {/* User Info */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{profile.fullName}</h2>
              <p className="text-gray-600">@{profile.username}</p>

              {profile.bio && <p className="text-gray-800 mt-4">{profile.bio}</p>}

              <div className="flex flex-wrap gap-4 mt-4 text-gray-600 text-sm">
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin size={16} />
                    {profile.location}
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center gap-1">
                    <LinkIcon size={16} />
                    <a href={profile.website} target="_blank" className="text-indigo-600 hover:underline">
                      {profile.website}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar size={16} />
                  Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </div>
              </div>

              {/* Stats - CLICKABLE */}
              <div className="flex gap-6 mt-4">
                <div>
                  <span className="font-bold text-gray-800">{posts.length}</span>
                  <span className="text-gray-600 ml-1">Posts</span>
                </div>
                <div 
                  onClick={() => navigate(`/profile/${username}/followers`)}
                  className="cursor-pointer hover:underline"
                >
                  <span className="font-bold text-gray-800">{followerCount}</span>
                  <span className="text-gray-600 ml-1">Followers</span>
                </div>
                <div 
                  onClick={() => navigate(`/profile/${username}/following`)}
                  className="cursor-pointer hover:underline"
                >
                  <span className="font-bold text-gray-800">{profile.following.length}</span>
                  <span className="text-gray-600 ml-1">Following</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4">Posts</h3>
          {posts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <p className="text-gray-600">No posts yet</p>
            </div>
          ) : (
            posts.map(post => (
              <PostCard
                key={post._id}
                post={post}
                currentUser={currentUser}
                onDelete={handlePostDeleted}
              />
            ))
          )}
        </div>
      </div>

      {/* Image Upload Modal */}
      {showImageModal && (
        <ImageUploadModal
          type={imageUploadType}
          currentImage={imageUploadType === 'profile' ? profile.profileImage : profile.coverImage}
          onClose={() => setShowImageModal(false)}
          onUpdate={handleImageUploaded}
        />
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onUpdate={(updated) => {
            setProfile(updated);
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
}

function EditProfileModal({ profile, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    fullName: profile.fullName,
    bio: profile.bio || '',
    website: profile.website || '',
    location: profile.location || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.put('/users/profile', formData);
      toast.success('Profile updated!');
      onUpdate(res.data);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
              rows="3"
              maxLength={160}
            />
            <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/160</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="City, Country"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}