import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import PostCard from '../components/PostCard';
import PostForm from '../components/PostForm';
import toast from 'react-hot-toast';
import { Users, Menu, X } from 'lucide-react';

export default function CommunitiesLayout() {
  const { user } = useContext(AuthContext);

  const [myCommunities, setMyCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  useEffect(() => {
    fetchMyCommunities();
  }, []);

  const fetchMyCommunities = async () => {
    try {
      const res = await API.get('/communities');
      const joined = res.data.communities.filter((c) =>
        c.members.some(
          (m) => m.toString() === user._id || m._id === user._id
        )
      );
      setMyCommunities(joined);
    } catch {
      toast.error('Failed to load communities');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCommunity = (community) => {
    setSelectedCommunity(community);
    setShowMobileSidebar(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_336px] gap-8">
      {/* ================= MAIN CONTENT ================= */}
      <div className="w-full space-y-12 py-6 min-w-0">
        {/* Mobile: Show toggle button when community is selected */}
        {selectedCommunity && (
          <button
            onClick={() => setShowMobileSidebar(true)}
            className="lg:hidden fixed bottom-20 right-6 z-30 bg-indigo-600 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
          >
            <Menu size={20} />
          </button>
        )}

        {selectedCommunity ? (
          <CommunityFeed
            community={selectedCommunity}
            user={user}
          />
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-16 text-center border border-slate-200 dark:border-slate-700 shadow-sm">
            <Users className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-600 dark:text-slate-400">
              Select a community to view posts
            </p>
            {/* Mobile: Show communities button if none selected */}
            <button
              onClick={() => setShowMobileSidebar(true)}
              className="lg:hidden mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              View Communities
            </button>
          </div>
        )}
      </div>

      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <CommunitySidebar
            myCommunities={myCommunities}
            loading={loading}
            selectedCommunity={selectedCommunity}
            onSelectCommunity={handleSelectCommunity}
          />
        </div>
      </aside>

      {/* ================= MOBILE SIDEBAR (MODAL) ================= */}
      {showMobileSidebar && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
            onClick={() => setShowMobileSidebar(false)}
          />
          
          {/* Sidebar */}
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-slate-900 shadow-xl animate-slide-in-right overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between z-10">
              <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">My Communities</h2>
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                <X size={20} className="text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <CommunitySidebar
                myCommunities={myCommunities}
                loading={loading}
                selectedCommunity={selectedCommunity}
                onSelectCommunity={handleSelectCommunity}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= COMMUNITY SIDEBAR (SHARED) ================= */
function CommunitySidebar({ myCommunities, loading, selectedCommunity, onSelectCommunity }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
      <h2 className="font-bold text-lg mb-4 text-slate-900 dark:text-slate-100">My Communities</h2>

      <button
        onClick={() => (window.location.href = '/communities/create')}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition mb-4 text-sm font-medium"
      >
        + Create Community
      </button>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      ) : myCommunities.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          You haven't joined any communities yet.
        </p>
      ) : (
        <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
          {myCommunities.map((community) => (
            <button
              key={community._id}
              onClick={() => onSelectCommunity(community)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                selectedCommunity?._id === community._id
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {community.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= COMMUNITY FEED ================= */
function CommunityFeed({ community, user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [community._id]);

  const fetchPosts = async () => {
    try {
      const res = await API.get(`/communities/${community._id}/posts`);
      setPosts(res.data.posts || res.data);
    } catch {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  const isMember = community.members.some(
    (m) => m.toString() === user._id || m._id === user._id
  );

  return (
    <div className="w-full space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-slate-100">{community.name}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {community.memberCount} members
            </p>
          </div>
          <button
            onClick={() => setShowAbout(!showAbout)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
          >
            {showAbout ? 'Hide About' : 'About'}
          </button>
        </div>

        {showAbout && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
              {community.description}
            </p>
            {community.rules && (
              <div className="mt-3 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                <h4 className="font-semibold text-sm mb-1 text-slate-900 dark:text-slate-100">Rules</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                  {community.rules}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {isMember && (
        <PostForm
          onPostCreated={handlePostCreated}
          communityId={community._id}
        />
      )}

      {loading ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-slate-600 dark:text-slate-400">Loading posts…</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-slate-600 dark:text-slate-400">
            {isMember
              ? 'No posts yet. Be the first!'
              : 'Join this community to see posts'}
          </p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            currentUser={user}
            onDelete={handlePostDeleted}
          />
        ))
      )}
    </div>
  );
}