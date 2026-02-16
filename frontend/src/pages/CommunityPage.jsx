import { useState, useEffect, useContext, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTranslation } from 'react-i18next';
import API from '../services/api';
import PostCard from '../components/PostCard';
import PostForm from '../components/PostForm';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';
import { Info, Trash2, Users as UsersIcon, TrendingUp, Tag, Crown, LogOut, X } from 'lucide-react';

const communityCache = new Map();

export default function CommunityPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useContext(AuthContext);
  const { socket } = useSocket();
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
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  useEffect(() => {
    const cached = communityCache.get(id);
    if (cached && Date.now() - cached.timestamp < 60000) {
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

  // ✅ Real-time updates via Socket.io
  useEffect(() => {
    if (!socket || !id) return;

    const handlePostCreated = (newPost) => {
      if (newPost.community?._id === id || newPost.community === id) {
        setPosts(prev => [newPost, ...prev]);
      }
    };

    const handlePostDeleted = ({ postId }) => {
      setPosts(prev => prev.filter(p => p._id !== postId));
    };

    const handleMemberJoined = ({ communityId, userId, memberCount }) => {
      if (communityId === id) {
        setCommunity(prev => ({ ...prev, memberCount }));
        if (userId === user._id) {
          setIsMember(true);
        }
      }
    };

    const handleMemberLeft = ({ communityId, userId, memberCount }) => {
      if (communityId === id) {
        setCommunity(prev => ({ ...prev, memberCount }));
        if (userId === user._id) {
          setIsMember(false);
        }
      }
    };

    const handleCommunityUpdated = (updatedCommunity) => {
      if (updatedCommunity._id === id) {
        setCommunity(updatedCommunity);
        communityCache.set(id, {
          data: updatedCommunity,
          timestamp: Date.now()
        });
      }
    };

    socket.on('community_post_created', handlePostCreated);
    socket.on('post_created', handlePostCreated);
    socket.on('post_deleted', handlePostDeleted);
    socket.on('community_member_joined', handleMemberJoined);
    socket.on('community_member_left', handleMemberLeft);
    socket.on('community_updated', handleCommunityUpdated);

    socket.emit('join_community', id);

    return () => {
      socket.off('community_post_created', handlePostCreated);
      socket.off('post_created', handlePostCreated);
      socket.off('post_deleted', handlePostDeleted);
      socket.off('community_member_joined', handleMemberJoined);
      socket.off('community_member_left', handleMemberLeft);
      socket.off('community_updated', handleCommunityUpdated);
      socket.emit('leave_community', id);
    };
  }, [socket, id, user]);

  const fetchCommunity = async () => {
    try {
      const res = await API.get(`/communities/${id}`);
      const communityData = res.data;
      
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
    const loadingToast = toast.loading('Joining community...');
    
    try {
      await API.post(`/communities/${id}/join`);
      
      toast.success(t('community.joined') || 'Welcome to the community! 🎉', { 
        id: loadingToast,
        duration: 3000,
      });
      
      setIsMember(true);
      setCommunity(prev => ({
        ...prev,
        memberCount: (prev?.memberCount || 0) + 1
      }));
      
      communityCache.delete(id);
      await refreshUser();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to join community', { 
        id: loadingToast,
        duration: 4000,
      });
    }
  };

  const handleLeave = async () => {
    const loadingToast = toast.loading('Leaving community...');
    
    try {
      await API.post(`/communities/${id}/leave`);
      
      toast.success(t('community.left') || 'You have left the community', { 
        id: loadingToast,
        icon: '👋',
        duration: 3000,
      });
      
      setIsMember(false);
      setCommunity(prev => ({
        ...prev,
        memberCount: Math.max((prev?.memberCount || 1) - 1, 0)
      }));
      
      communityCache.delete(id);
      await refreshUser();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to leave community', { 
        id: loadingToast,
        duration: 4000,
      });
    }
  };

  const handleDeleteCommunity = async () => {
    const loadingToast = toast.loading('Deleting community...');
    
    try {
      await API.delete(`/communities/${id}`);
      communityCache.delete(id);
      
      toast.success(t('community.deleted') || 'Community deleted successfully', { 
        id: loadingToast,
        icon: '🗑️',
        duration: 3000,
      });
      
      navigate('/communities');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete community', { 
        id: loadingToast,
        duration: 4000,
      });
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

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

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="w-full pb-12">
      {/* BACK BUTTON */}
      <button
        onClick={handleBack}
        className="mb-4 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex"
        title="Go back"
      >
        <X size={24} className="text-slate-700 dark:text-slate-300" />
      </button>
      
      {/* COMMUNITY HEADER */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card mb-8 overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
        <div className="h-40 bg-gradient-to-r from-indigo-500 to-purple-600" style={{
          backgroundImage: community.coverImage?.url ? `url(${community.coverImage.url})` : undefined,
          backgroundSize: 'cover'
        }} />
        
        <div className="p-6">
          {/* CREATOR INFO */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
            <img
              src={community.creator?.profileImage || `https://ui-avatars.com/api/?name=${community.creator?.fullName}&background=6366f1&color=fff`}
              alt={community.creator?.fullName}
              className="w-12 h-12 rounded-full ring-2 ring-yellow-400"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{community.creator?.fullName}</p>
                <Crown size={16} className="text-yellow-500" title="Community Creator" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">@{community.creator?.username} • Creator & Admin</p>
            </div>
            {isCreator && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 text-sm font-medium transition flex items-center gap-2"
                title="Delete Community (Admin Only)"
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
                
                {community.category && (
                  <span className="flex items-center gap-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-medium">
                    <Tag size={12} />
                    {community.category}
                  </span>
                )}
                
                <button
                  onClick={() => setShowAbout(!showAbout)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"
                  title="About"
                >
                  <Info size={20} className="text-slate-600 dark:text-slate-400" />
                </button>

                <button
                  onClick={() => {
                    setShowMembers(!showMembers);
                    if (!showMembers && members.length === 0) fetchMembers();
                  }}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"
                  title="Members"
                >
                  <UsersIcon size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
              </div>
              
              <div className="flex gap-4 text-sm text-slate-500 dark:text-slate-400 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <UsersIcon size={14} />
                  {community.memberCount} members
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <TrendingUp size={14} />
                  {activeMembers} active
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              {isCreator ? (
                <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-5 py-2 rounded-lg font-semibold text-sm flex items-center gap-2">
                  <Crown size={16} />
                  Creator
                </span>
              ) : isMember ? (
                <button 
                  onClick={() => setShowLeaveConfirm(true)}
                  className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-5 py-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 text-sm font-medium transition flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Leave Community
                </button>
              ) : (
                <button 
                  onClick={handleJoin} 
                  className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium transition"
                >
                  Join Community
                </button>
              )}
            </div>
          </div>

          {/* ABOUT SECTION */}
          {showAbout && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-4">
              <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-2">Description</h3>
                <p className="text-slate-600 dark:text-slate-300">{community.description}</p>
              </div>

              {community.rules && (
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                  <h3 className="font-semibold text-sm mb-2 text-slate-900 dark:text-slate-100">Community Rules</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{community.rules}</p>
                </div>
              )}
            </div>
          )}

          {/* MEMBERS LIST */}
          {showMembers && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-3">
                Members ({members.length || community.memberCount})
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

      {/* LEAVE CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={handleLeave}
        title="Leave Community"
        message="You will no longer see posts from this community and will need to rejoin to participate again. Are you sure?"
        confirmText="Leave"
        cancelText="Stay"
        type="warning"
      />

      {/* DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteCommunity}
        title="Delete Community"
        message="This action cannot be undone. All posts, members, and community data will be permanently deleted. Are you absolutely sure?"
        confirmText="Delete Permanently"
        cancelText="Cancel"
        type="danger"
      />

      {/* POST FORM */}
      {isMember && (
        <div className="mb-8">
          <PostForm onPostCreated={handlePostCreated} communityId={id} />
        </div>
      )}

      {/* JOIN PROMPT FOR NON-MEMBERS */}
      {!isMember && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 p-8 mb-8 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Join to Participate
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Join this community to create posts and interact with members
          </p>
          <button
            onClick={handleJoin}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
          >
            Join Community
          </button>
        </div>
      )}

      {/* POSTS LIST */}
      <div className="w-full space-y-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Posts
        </h2>

        {posts.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-16 text-center border border-slate-100 dark:border-slate-700">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">No posts yet</h3>
            <p className="text-slate-600 dark:text-slate-400">
              {isMember ? 'Be the first to post!' : 'Join to see and create posts.'}
            </p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard
              key={post._id}
              post={post}
              currentUser={user}
              isMember={isMember}
              onDelete={handlePostDeleted}
            />
          ))
        )}
      </div>
    </div>
  );
}