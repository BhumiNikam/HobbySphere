import { useState, useEffect, useContext, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import API from '../services/api';
import PostCard from '../components/PostCard';
import PostForm from '../components/PostForm';
import toast from 'react-hot-toast';
import { Info, Trash2, Users as UsersIcon, TrendingUp, Tag, Crown } from 'lucide-react';

// ✅ Cache for community data
const communityCache = new Map();

export default function CommunityPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [isMember, setIsMember] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAbout, setShowAbout] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    // ✅ Check cache first
    const cached = communityCache.get(id);
    if (cached && Date.now() - cached.timestamp < 60000) { // Cache for 1 minute
      setCommunity(cached.data);
      setIsMember(cached.data.isMember);
      setIsCreator(cached.data.isCreator);
      setLoading(false);
      fetchPosts();
      if (showMembers) fetchMembers();
    } else {
      fetchCommunity();
      fetchPosts();
    }
  }, [id]);

  const fetchCommunity = async () => {
    try {
      const res = await API.get(`/communities/${id}`);
      const communityData = res.data;
      
      // ✅ Cache the data
      communityCache.set(id, {
        data: communityData,
        timestamp: Date.now()
      });
      
      setCommunity(communityData);
      const memberIds = communityData.members.map(m => m.toString());
      setIsMember(memberIds.includes(user._id) || communityData.isMember);
      setIsCreator(communityData.creator._id === user._id || communityData.isCreator);
      setLoading(false);
    } catch (error) {
      toast.error(t('community.failedToLoad') || 'Failed to load community');
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await API.get(`/communities/${id}/posts`);
      setPosts(res.data.posts || res.data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await API.get(`/communities/${id}/members`);
      setMembers(res.data.members || res.data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  const handleJoin = async () => {
    try {
      await API.post(`/communities/${id}/join`);
      toast.success(t('community.joined') || 'Joined community!');
      setIsMember(true);
      communityCache.delete(id); // Clear cache
      fetchCommunity();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to join');
    }
  };

  const handleLeave = async () => {
    try {
      await API.post(`/communities/${id}/leave`);
      toast.success(t('community.left') || 'Left community');
      setIsMember(false);
      communityCache.delete(id); // Clear cache
      fetchCommunity();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to leave');
    }
  };

  const handleDeleteCommunity = async () => {
    try {
      await API.delete(`/communities/${id}`);
      communityCache.delete(id); // Clear cache
      toast.success(t('community.deleted') || 'Community deleted successfully');
      navigate('/communities');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete community');
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  // ✅ Memoized active members calculation
  const activeMembers = useMemo(() => {
    return posts.reduce((acc, post) => {
      const daysSincePost = (Date.now() - new Date(post.createdAt)) / (1000 * 60 * 60 * 24);
      if (daysSincePost <= 7 && !acc.includes(post.author._id)) {
        acc.push(post.author._id);
      }
      return acc;
    }, []).length;
  }, [posts]);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );
  
  if (!community) return (
    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
      {t('community.notFound') || 'Community not found'}
    </div>
  );

  return (
    <div className="w-full pb-12">
      {/* COMMUNITY HEADER */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card mb-8 overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
        <div className="h-40 bg-gradient-to-r from-indigo-500 to-purple-600" style={{
          backgroundImage: community.coverImage?.url ? `url(${community.coverImage.url})` : undefined,
          backgroundSize: 'cover'
        }} />
        
        <div className="p-6">
          {/* ✅ CREATOR INFO AT TOP */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
            <img
              src={community.creator?.profileImage || `https://ui-avatars.com/api/?name=${community.creator?.fullName}&background=6366f1&color=fff`}
              alt={community.creator?.fullName}
              className="w-12 h-12 rounded-full ring-2 ring-indigo-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{community.creator?.fullName}</p>
                <Crown size={16} className="text-yellow-500" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">@{community.creator?.username} • Creator</p>
            </div>
            {/* ✅ DELETE BUTTON FOR CREATOR */}
            {isCreator && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 text-sm font-medium transition flex items-center gap-2"
                title={t('community.delete') || 'Delete Community'}
              >
                <Trash2 size={16} />
                Delete
              </button>
            )}
          </div>

          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{community.name}</h1>
                
                {/* Category Badge */}
                {community.category && (
                  <span className="flex items-center gap-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-medium">
                    <Tag size={12} />
                    {community.category}
                  </span>
                )}
                
                <button
                  onClick={() => setShowAbout(!showAbout)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"
                  title={t('community.about') || 'About'}
                >
                  <Info size={20} className="text-slate-600 dark:text-slate-400" />
                </button>

                <button
                  onClick={() => {
                    setShowMembers(!showMembers);
                    if (!showMembers && members.length === 0) fetchMembers();
                  }}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"
                  title={t('community.members') || 'Members'}
                >
                  <UsersIcon size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
              </div>
              
              <div className="flex gap-4 text-sm text-slate-500 dark:text-slate-400 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <UsersIcon size={14} />
                  {community.memberCount} {t('community.members').toLowerCase()}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <TrendingUp size={14} />
                  {activeMembers} {t('community.activeMembers') || 'active'}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              {isCreator ? (
                <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-5 py-2 rounded-lg font-semibold text-sm">
                  {t('community.creator') || 'Creator'}
                </span>
              ) : isMember ? (
                <button 
                  onClick={handleLeave} 
                  className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-5 py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 text-sm font-medium transition"
                >
                  {t('community.leave')}
                </button>
              ) : (
                <button 
                  onClick={handleJoin} 
                  className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium transition"
                >
                  {t('community.join')}
                </button>
              )}
            </div>
          </div>

          {/* ABOUT SECTION */}
          {showAbout && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-4">
              <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-2">
                  {t('community.description') || 'Description'}
                </h3>
                <p className="text-slate-600 dark:text-slate-300">{community.description}</p>
              </div>

              {/* Rules */}
              {community.rules && (
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                  <h3 className="font-semibold text-sm mb-2 text-slate-900 dark:text-slate-100">
                    {t('community.rules') || 'Community Rules'}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{community.rules}</p>
                </div>
              )}
            </div>
          )}

          {/* MEMBERS LIST */}
          {showMembers && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-3">
                {t('community.membersList') || 'Members'} ({members.length || community.memberCount})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                {members.map((member) => (
                  <div
                    key={member._id}
                    onClick={() => navigate(`/profile/${member.username}`)}
                    className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                  >
                    <img
                      src={member.profileImage || `https://ui-avatars.com/api/?name=${member.fullName}&background=6366f1&color=fff`}
                      alt={member.fullName}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{member.fullName}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">@{member.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="text-center space-y-4">
              <div className="text-5xl">🗑️</div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {t('community.deleteConfirmTitle') || 'Delete Community?'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {t('community.deleteConfirmMsg') || 'This action cannot be undone. All posts and data will be permanently deleted.'}
              </p>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleDeleteCommunity}
                  className="flex-1 px-4 py-3 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  {t('common.delete') || 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POST FORM */}
      {isMember && (
        <div className="mb-8">
          <PostForm onPostCreated={handlePostCreated} communityId={id} />
        </div>
      )}

      {/* POSTS LIST */}
      <div className="w-full space-y-6">
        {posts.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-16 text-center border border-slate-100 dark:border-slate-700">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
              {t('community.noPosts') || 'No posts yet'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {isMember ? t('community.beFirst') || 'Be the first to post!' : t('community.joinToSee') || 'Join to see posts'}
            </p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard
              key={post._id}
              post={post}
              currentUser={user}
              onDelete={handlePostDeleted}
            />
          ))
        )}
      </div>
    </div>
  );
}