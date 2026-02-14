import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API, { clearCache } from '../services/api';
import toast from 'react-hot-toast';
import { Check, Users, Crown } from 'lucide-react';

export default function Communities() {
  const navigate = useNavigate();
  const { user, refreshUser } = useContext(AuthContext);
  const [communities, setCommunities] = useState([]);
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [joiningId, setJoiningId] = useState(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCommunities();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, category]);

  const fetchCommunities = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;

      setLoading(true);
      const res = await API.get('/communities', { params });
      const data = res.data.communities || [];
      
      separateCommunities(data);
    } catch (error) {
      toast.error('Failed to load communities');
      setCommunities([]);
      setJoinedCommunities([]);
    } finally {
      setLoading(false);
    }
  };

  const separateCommunities = (allCommunities) => {
    const joined = allCommunities.filter(c => c.isMember);
    const notJoined = allCommunities.filter(c => !c.isMember);
    
    setJoinedCommunities(joined);
    setCommunities(notJoined);
  };

  const handleJoinToggle = async (communityId, isJoined) => {
    try {
      setJoiningId(communityId);
      
      if (isJoined) {
        await API.post(`/communities/${communityId}/leave`);
        toast.success('Left community');
        
        const community = joinedCommunities.find(c => c._id === communityId);
        setJoinedCommunities(joinedCommunities.filter(c => c._id !== communityId));
        if (community) {
          setCommunities([{ ...community, isMember: false }, ...communities]);
        }
      } else {
        await API.post(`/communities/${communityId}/join`);
        toast.success('Joined community!');
        
        const community = communities.find(c => c._id === communityId);
        setCommunities(communities.filter(c => c._id !== communityId));
        if (community) {
          setJoinedCommunities([{ ...community, isMember: true }, ...joinedCommunities]);
        }
      }
      
      clearCache('/communities');
      await refreshUser();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update membership');
    } finally {
      setJoiningId(null);
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

  const CommunityCard = ({ community, isJoined }) => (
    <div className="card-modern-hover group overflow-hidden bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all">
      <div
        className="h-36 relative bg-gradient-to-br from-indigo-500 to-purple-600 cursor-pointer"
        style={{
          backgroundImage: community.coverImage?.url ? `url(${community.coverImage.url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        onClick={() => navigate(`/communities/${community._id}`)}
      >
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <h3 
            className="text-lg font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition cursor-pointer text-slate-900 dark:text-slate-100 line-clamp-1 flex-1"
            onClick={() => navigate(`/communities/${community._id}`)}
          >
            {community.name}
          </h3>
          {isJoined && (
            <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full text-xs font-semibold">
              <Check size={12} />
              Joined
            </div>
          )}
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3 min-h-[40px]">
          {community.description}
        </p>

        {/* Admin/Creator Info */}
        {community.creator && (
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-slate-700">
            <img
              src={community.creator.profileImage || `https://ui-avatars.com/api/?name=${community.creator.fullName}&background=6366f1&color=fff`}
              alt={community.creator.fullName}
              className="w-6 h-6 rounded-full ring-2 ring-yellow-400"
            />
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <Crown size={12} className="text-yellow-500 flex-shrink-0" />
              <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
                {community.creator.fullName}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Users size={14} />
            {community.memberCount} members
          </span>
          <span className="badge bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-medium">
            {community.category}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleJoinToggle(community._id, isJoined);
            }}
            disabled={joiningId === community._id}
            className={`flex-1 py-2 rounded-lg font-medium transition text-sm flex items-center justify-center gap-1.5 ${
              isJoined
                ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-slate-600'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {joiningId === community._id ? (
              'Loading...'
            ) : isJoined ? (
              <>
                <Check size={16} />
                Joined
              </>
            ) : (
              'Join'
            )}
          </button>

          <button
            onClick={() => navigate(`/communities/${community._id}`)}
            className="px-4 py-2 rounded-lg font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition text-sm border border-slate-200 dark:border-slate-600"
          >
            View
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-80 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : joinedCommunities.length === 0 && communities.length === 0 ? (
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
        <div className="space-y-10">
          {joinedCommunities.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Check size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                  Your Communities
                </h2>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {joinedCommunities.length} {joinedCommunities.length === 1 ? 'community' : 'communities'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {joinedCommunities.map((community) => (
                  <CommunityCard key={community._id} community={community} isJoined={true} />
                ))}
              </div>
            </div>
          )}

          {communities.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <Users size={20} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  Discover More Communities
                </h2>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {communities.length} available
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {communities.map((community) => (
                  <CommunityCard key={community._id} community={community} isJoined={false} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}