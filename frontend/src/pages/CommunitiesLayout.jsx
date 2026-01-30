import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import PostCard from '../components/PostCard';
import PostForm from '../components/PostForm';
import toast from 'react-hot-toast';
import { Users } from 'lucide-react';

export default function CommunitiesLayout() {
  const { user } = useContext(AuthContext);

  const [myCommunities, setMyCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="grid grid-cols-12 gap-8">
      {/* ================= CENTER FEED ================= */}
      <section className="col-span-12 lg:col-span-8 min-w-0 w-full">
        {selectedCommunity ? (
          <CommunityFeed
            community={selectedCommunity}
            user={user}
          />
        ) : (
          <div className="bg-white rounded-2xl p-16 text-center border shadow-sm w-full">
            <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-600">
              Select a community to view posts
            </p>
          </div>
        )}
      </section>

      {/* ================= RIGHT SIDEBAR ================= */}
      <aside className="hidden lg:block col-span-4 flex-shrink-0 w-full">
        <div className="sticky top-24">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h2 className="font-bold text-lg mb-4">My Communities</h2>

            <button
              onClick={() => (window.location.href = '/communities/create')}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition mb-4 text-sm font-medium"
            >
              + Create Community
            </button>

            {loading ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : myCommunities.length === 0 ? (
              <p className="text-sm text-slate-500">
                You haven't joined any communities yet.
              </p>
            ) : (
              <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
                {myCommunities.map((community) => (
                  <button
                    key={community._id}
                    onClick={() => setSelectedCommunity(community)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                      selectedCommunity?._id === community._id
                        ? 'bg-indigo-50 text-indigo-600 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {community.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

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
    <div className="space-y-6 w-full">
      <div className="bg-white rounded-xl shadow-sm border p-5 w-full">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">{community.name}</h1>
            <p className="text-sm text-slate-500">
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
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-slate-600 whitespace-pre-wrap">
              {community.description}
            </p>
            {community.rules && (
              <div className="mt-3 bg-slate-50 p-3 rounded-lg">
                <h4 className="font-semibold text-sm mb-1">Rules</h4>
                <p className="text-xs text-slate-600 whitespace-pre-wrap">
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
        <div className="bg-white rounded-xl p-12 text-center border shadow-sm">
          Loading posts…
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border shadow-sm">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-slate-600">
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