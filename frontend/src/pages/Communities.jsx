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
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      
      const res = await API.get('/communities', { params });
      console.log('API Response:', res.data);
      
      // Backend returns { communities: [], total, page, pages }
      const communitiesData = res.data.communities || [];
      setCommunities(communitiesData);
      setLoading(false);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load communities');
      setCommunities([]);
      setLoading(false);
    }
  };

  const handleJoin = async (communityId) => {
    try {
      await API.post(`/communities/${communityId}/join`);
      toast.success('Joined community!');
      fetchCommunities();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to join');
    }
  };

  const categories = ['Photography', 'Gaming', 'Cooking', 'Art', 'Music', 'Fitness', 'Travel', 'Tech', 'Books', 'Other'];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Discover Communities</h1>
        <Link to="/communities/create" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
          Create Community
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-4 mb-8">
        <input
          type="text"
          placeholder="Search communities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Communities Grid */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : communities.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <p className="text-gray-600">No communities found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map(community => (
            <div key={community._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
              <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600" style={{
                backgroundImage: community.coverImage?.url ? `url(${community.coverImage.url})` : undefined,
                backgroundSize: 'cover'
              }} />
              <div className="p-5">
                <h3 className="text-xl font-bold mb-2">{community.name}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{community.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-500">{community.memberCount} members</span>
                  <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded">{community.category}</span>
                </div>
                <Link
                  to={`/communities/${community._id}`}
                  className="block w-full text-center bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
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