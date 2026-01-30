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

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!community) return <div className="text-center py-12">Community not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="max-w-[1200px] mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-8">
          {/* MAIN CONTENT */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden">
              <div className="h-40 bg-gradient-to-r from-indigo-500 to-purple-600" style={{
                backgroundImage: community.coverImage?.url ? `url(${community.coverImage.url})` : undefined,
                backgroundSize: 'cover'
              }} />
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl font-bold">{community.name}</h1>
                      <button
                        onClick={() => setShowAbout(!showAbout)}
                        className="p-1.5 hover:bg-gray-100 rounded-full transition"
                        title="About"
                      >
                        <Info size={20} className="text-gray-600" />
                      </button>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>{community.memberCount} members</span>
                      <span>•</span>
                      <span>{community.category}</span>
                    </div>
                  </div>
                  {isCreator ? (
                    <span className="bg-indigo-100 text-indigo-600 px-5 py-2 rounded-lg font-semibold text-sm">
                      Creator
                    </span>
                  ) : isMember ? (
                    <button onClick={handleLeave} className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-300 text-sm font-medium">
                      Leave
                    </button>
                  ) : (
                    <button onClick={handleJoin} className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium">
                      Join
                    </button>
                  )}
                </div>

                {showAbout && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-gray-600 mb-3">{community.description}</p>
                    {community.rules && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2 text-sm">Community Rules</h3>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{community.rules}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {isMember && <PostForm onPostCreated={handlePostCreated} communityId={id} />}

            <div className="space-y-6">
              {posts.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center border">
                  <div className="text-4xl mb-4">📝</div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">No posts yet</h3>
                  <p className="text-slate-600">
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

          {/* SIDEBAR (empty for now, but reserved for future use) */}
          <div className="hidden lg:block col-span-4"></div>
        </div>
      </div>
    </div>
  );
}