import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';

export default function Communities() {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchCommunities();
  }, [search, category]);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;

      const res = await API.get('/communities', { params });
      setCommunities(res.data.communities || []);
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* ================= HEADER ================= */}
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

      {/* ================= SEARCH & FILTER ================= */}
      <div className="bg-white rounded-2xl shadow-sm border p-4 mb-10 flex flex-col md:flex-row gap-4">
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
          className="input-modern md:max-w-xs bg-white"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* ================= CONTENT ================= */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-2xl" />
          ))}
        </div>
      ) : communities.length === 0 ? (
        <div className="empty-state card-modern py-20">
          <div className="empty-state-icon animate-bounce-slow">
            🔍
          </div>
          <h3 className="text-xl font-semibold mb-2">
            No communities found
          </h3>
          <p className="text-slate-500 max-w-md">
            Try changing your search or be the first to create a community.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community) => (
            <div
              key={community._id}
              className="card-modern-hover group overflow-hidden"
            >
              {/* COVER */}
              <div
                className="h-36 relative bg-gradient-to-br from-indigo-500 to-purple-600"
                style={{
                  backgroundImage: community.coverImage?.url
                    ? `url(${community.coverImage.url})`
                    : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* BODY */}
              <div className="p-5">
                <h3 className="text-lg font-bold mb-1 group-hover:text-indigo-600 transition">
                  {community.name}
                </h3>

                <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                  {community.description}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium text-slate-500">
                    {community.memberCount} members
                  </span>
                  <span className="badge">{community.category}</span>
                </div>

                <Link
                  to={`/communities/${community._id}`}
                  className="btn-primary w-full text-center ripple"
                >
                  View Community
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
