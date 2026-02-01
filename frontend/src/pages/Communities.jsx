import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';

// ✅ Cache for communities list
const communitiesCache = {
  data: null,
  timestamp: 0,
  params: {}
};

export default function Communities() {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const searchTimeout = useRef(null);

  useEffect(() => {
    // ✅ Debounce search
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    searchTimeout.current = setTimeout(() => {
      fetchCommunities();
    }, 300);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search, category]);

  const fetchCommunities = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;

      // ✅ Check cache
      const cacheKey = JSON.stringify(params);
      const now = Date.now();
      
      if (
        communitiesCache.data &&
        JSON.stringify(communitiesCache.params) === cacheKey &&
        now - communitiesCache.timestamp < 120000 // Cache for 2 minutes
      ) {
        setCommunities(communitiesCache.data);
        setLoading(false);
        return;
      }

      setLoading(true);
      const res = await API.get('/communities', { params });
      const data = res.data.communities || [];
      
      // ✅ Update cache
      communitiesCache.data = data;
      communitiesCache.timestamp = now;
      communitiesCache.params = params;
      
      setCommunities(data);
    } catch (error) {
      toast.error('Failed to load communities');
      setCommunities([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Photography',
    'Gaming',
    'Cooking',
    'Art',
    'Music',
    'Fitness',
    'Travel',
    'Tech',
    'Books',
    'Other',
  ];

  // ✅ Navigate to community without re-fetching
  const handleCommunityClick = (communityId) => {
    navigate(`/communities/${communityId}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold gradient-text">
            Discover Communities
          </h1>
          <p className="text-slate-500 mt-1">
            Find people who share your interests
          </p>
        </div>

        <Link to="/communities/create" className="btn-gradient ripple">
          + Create Community
        </Link>
      </div>

      {/* SEARCH & FILTER */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-10 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search communities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 input-modern"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input-modern md:max-w-xs bg-white dark:bg-slate-800"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : communities.length === 0 ? (
        <div className="empty-state card-modern py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="empty-state-icon animate-bounce-slow text-6xl mb-4">
            🔍
          </div>
          <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">
            No communities found
          </h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md">
            Try changing your search or be the first to create a community.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community) => (
            <div
              key={community._id}
              className="card-modern-hover group overflow-hidden bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all"
            >
              {/* COVER */}
              <div
                className="h-36 relative bg-gradient-to-br from-indigo-500 to-purple-600 cursor-pointer"
                style={{
                  backgroundImage: community.coverImage?.url
                    ? `url(${community.coverImage.url})`
                    : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
                onClick={() => handleCommunityClick(community._id)}
              >
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* BODY */}
              <div className="p-5">
                <h3 
                  className="text-lg font-bold mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition cursor-pointer text-slate-900 dark:text-slate-100"
                  onClick={() => handleCommunityClick(community._id)}
                >
                  {community.name}
                </h3>

                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
                  {community.description}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {community.memberCount} members
                  </span>
                  <span className="badge bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-medium">
                    {community.category}
                  </span>
                </div>

                <button
                  onClick={() => handleCommunityClick(community._id)}
                  className="btn-primary w-full text-center ripple bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium transition"
                >
                  View Community
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}