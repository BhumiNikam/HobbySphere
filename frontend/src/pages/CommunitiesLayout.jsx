import { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import PostCard from '../components/PostCard';
import toast from 'react-hot-toast';
import { Users, Menu, X, Plus } from 'lucide-react';

// ✅ Cache for communities and posts
const communityCache = new Map();
const postsCache = new Map();

export default function CommunitiesLayout() {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [myCommunities, setMyCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  useEffect(() => {
    fetchMyCommunities();
  }, []);

  const fetchMyCommunities = async () => {
    try {
      // ✅ Check cache
      const cached = communityCache.get(user._id);
      if (cached && Date.now() - cached.timestamp < 120000) {
        setMyCommunities(cached.data);
        if (cached.data.length > 0 && !selectedCommunity) {
          setSelectedCommunity(cached.data[0]);
        }
        setLoading(false);
        return;
      }

      const res = await API.get('/communities/my-communities');
      const joined = res.data || [];
      
      // ✅ Cache the result
      communityCache.set(user._id, {
        data: joined,
        timestamp: Date.now()
      });
      
      setMyCommunities(joined);
      
      if (joined.length > 0 && !selectedCommunity) {
        setSelectedCommunity(joined[0]);
      }
    } catch (error) {
      console.error('Failed to fetch communities:', error);
      toast.error(t('community.failedToLoad') || 'Failed to load communities');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCommunity = (community) => {
    setSelectedCommunity(community);
    setShowMobileSidebar(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 relative">
      {/* BACK BUTTON - Top Right */}
      <button
        onClick={() => navigate('/communities')}
        className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-md dark:shadow-xl border border-slate-200 dark:border-slate-700"
        title="Go back"
      >
        <X size={24} className="text-slate-700 dark:text-slate-300" />
      </button>
      
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* MAIN CONTENT */}
        <div className="w-full space-y-6 min-w-0">
          {/* MOBILE: Community Selector at Top */}
          <div className="lg:hidden bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                {selectedCommunity ? (
                  <button
                    onClick={() => setShowMobileSidebar(true)}
                    className="w-full flex items-center justify-between gap-3 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100 truncate">
                        {selectedCommunity.name}
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {selectedCommunity.memberCount} {t('community.members').toLowerCase()}
                      </p>
                    </div>
                    <Menu size={20} className="text-slate-600 dark:text-slate-400 flex-shrink-0" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowMobileSidebar(true)}
                    className="w-full flex items-center justify-between gap-3 py-2 px-4 bg-slate-100 dark:bg-slate-700 rounded-lg"
                  >
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {t('community.selectCommunity') || 'Select Community'}
                    </span>
                    <Menu size={20} className="text-slate-600 dark:text-slate-400" />
                  </button>
                )}
              </div>
              
              <Link
                to="/communities/create"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex-shrink-0"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">{t('nav.create')}</span>
              </Link>
            </div>
          </div>

          {/* MAIN FEED AREA */}
          {selectedCommunity ? (
            <CommunityFeed
              community={selectedCommunity}
              user={user}
              t={t}
            />
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 sm:p-16 text-center border border-slate-200 dark:border-slate-700 shadow-sm">
              <Users className="w-20 h-20 mx-auto mb-6 text-slate-300 dark:text-slate-600" />
              
              {loading ? (
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  {t('common.loading') || 'Loading...'}
                </p>
              ) : myCommunities.length === 0 ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                      {t('community.noCommunities') || 'No Communities Yet'}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                      {t('community.joinOrCreate') || 'Join existing communities or create your own to start connecting with people who share your interests!'}
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <Link
                      to="/communities"
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-semibold shadow-lg"
                    >
                      {t('community.discoverCommunities') || 'Discover Communities'}
                    </Link>
                    <Link
                      to="/communities/create"
                      className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition font-semibold"
                    >
                      {t('community.createCommunity') || 'Create Community'}
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <CommunitySidebar
              myCommunities={myCommunities}
              loading={loading}
              selectedCommunity={selectedCommunity}
              onSelectCommunity={handleSelectCommunity}
              t={t}
            />
          </div>
        </aside>

        {/* MOBILE SIDEBAR (MODAL) */}
        {showMobileSidebar && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
              onClick={() => setShowMobileSidebar(false)}
            />
            
            <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-slate-900 shadow-xl animate-slide-in-right overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between z-10">
                <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                  {t('community.myCommunities') || 'My Communities'}
                </h2>
                <button
                  onClick={() => setShowMobileSidebar(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  <X size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
              </div>

              <div className="p-4">
                <CommunitySidebar
                  myCommunities={myCommunities}
                  loading={loading}
                  selectedCommunity={selectedCommunity}
                  onSelectCommunity={handleSelectCommunity}
                  t={t}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* COMMUNITY SIDEBAR */
function CommunitySidebar({ myCommunities, loading, selectedCommunity, onSelectCommunity, t }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
      <h2 className="font-bold text-lg mb-4 text-slate-900 dark:text-slate-100">
        {t('community.myCommunities') || 'My Communities'}
      </h2>

      <Link
        to="/communities/create"
        className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition mb-4 text-sm font-medium flex items-center justify-center gap-2"
      >
        <Plus size={16} />
        {t('community.createCommunity') || 'Create Community'}
      </Link>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('common.loading') || 'Loading...'}
        </p>
      ) : myCommunities.length === 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('community.notJoinedYet') || "You haven't joined any communities yet."}
          </p>
          <Link
            to="/communities"
            className="block text-center text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            {t('community.discover') || 'Discover Communities'}
          </Link>
        </div>
      ) : (
        <div className="space-y-1 max-h-[calc(100vh-250px)] overflow-y-auto">
          {myCommunities.map((community) => (
            <button
              key={community._id}
              onClick={() => onSelectCommunity(community)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition ${
                selectedCommunity?._id === community._id
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="truncate">{community.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {community.memberCount} {t('community.members').toLowerCase()}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* COMMUNITY FEED */
function CommunityFeed({ community, user, t }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [community._id]);

  const fetchPosts = async () => {
    try {
      // ✅ Check cache
      const cached = postsCache.get(community._id);
      if (cached && Date.now() - cached.timestamp < 60000) {
        setPosts(cached.data);
        setLoading(false);
        return;
      }

      setLoading(true);
      const res = await API.get(`/communities/${community._id}/posts`);
      const data = res.data.posts || res.data;
      
      // ✅ Cache posts
      postsCache.set(community._id, {
        data: data,
        timestamp: Date.now()
      });
      
      setPosts(data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      toast.error(t('post.failedToLoad') || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
    // Clear cache
    postsCache.delete(community._id);
  };

  // ✅ Memoized membership check
  const isMember = useMemo(() => {
    return community.members?.some(
      (m) => m.toString() === user._id || m._id === user._id
    ) || false;
  }, [community.members, user._id]);

  return (
    <div className="w-full space-y-6">
      {/* COMMUNITY HEADER */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-slate-100 truncate">
              {community.name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {community.memberCount} {t('community.members').toLowerCase()}
            </p>
          </div>
          <button
            onClick={() => setShowAbout(!showAbout)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm font-medium flex-shrink-0"
          >
            {showAbout ? (t('common.hide') || 'Hide') : (t('community.about') || 'About')}
          </button>
        </div>

        {showAbout && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
              {community.description}
            </p>
            {community.rules && (
              <div className="mt-3 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                <h4 className="font-semibold text-sm mb-1 text-slate-900 dark:text-slate-100">
                  {t('community.rules') || 'Rules'}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                  {community.rules}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* POSTS */}
      {loading ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            {t('common.loading') || 'Loading posts...'}
          </p>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-slate-600 dark:text-slate-400">
            {isMember
              ? (t('community.beFirst') || 'No posts yet. Be the first to post using the Create button!')
              : (t('community.joinToSee') || 'Join this community to see posts')}
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