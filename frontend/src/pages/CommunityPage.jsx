import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import PostCard from '../components/PostCard';
import PostForm from '../components/PostForm';
import toast from 'react-hot-toast';
import { Info } from 'lucide-react';

export default function CommunityPage() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isMember, setIsMember] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    fetchCommunity();
    fetchPosts();
  }, [id]);

  const fetchCommunity = async () => {
    try {
      const res = await API.get(`/communities/${id}`);
      setCommunity(res.data);
      const memberIds = res.data.members.map(m => m.toString());
      setIsMember(memberIds.includes(user._id) || res.data.isMember);
      setIsCreator(res.data.creator._id === user._id || res.data.isCreator);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load community');
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

  const handleJoin = async () => {
    try {
      await API.post(`/communities/${id}/join`);
      toast.success('Joined community!');
      setIsMember(true);
      fetchCommunity();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to join');
    }
  };

  const handleLeave = async () => {
    try {
      await API.post(`/communities/${id}/leave`);
      toast.success('Left community');
      setIsMember(false);
      fetchCommunity();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to leave');
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
    fetchPosts();
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );
  
  if (!community) return (
    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
      Community not found
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
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{community.name}</h1>
                <button
                  onClick={() => setShowAbout(!showAbout)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"
                  title="About"
                >
                  <Info size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
              </div>
              <div className="flex gap-4 text-sm text-slate-500 dark:text-slate-400">
                <span>{community.memberCount} members</span>
                <span>•</span>
                <span>{community.category}</span>
              </div>
            </div>
            {isCreator ? (
              <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-5 py-2 rounded-lg font-semibold text-sm">
                Creator
              </span>
            ) : isMember ? (
              <button 
                onClick={handleLeave} 
                className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-5 py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 text-sm font-medium transition"
              >
                Leave
              </button>
            ) : (
              <button 
                onClick={handleJoin} 
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium transition"
              >
                Join
              </button>
            )}
          </div>

          {showAbout && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <p className="text-slate-600 dark:text-slate-300 mb-3">{community.description}</p>
              {community.rules && (
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-sm text-slate-900 dark:text-slate-100">Community Rules</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{community.rules}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">No posts yet</h3>
            <p className="text-slate-600 dark:text-slate-400">
              {isMember ? 'Be the first to post!' : 'Join to see posts'}
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