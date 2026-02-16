// frontend/src/pages/MyCommunities.jsx
import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import { X } from 'lucide-react';
import { safeNavigateBack } from '../utils/navigation';

export default function MyCommunities() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyCommunities();
  }, []);

  const fetchMyCommunities = async () => {
    try {
      const res = await API.get('/communities');
      const joined = res.data.filter(c => c.members.includes(user._id));
      setCommunities(joined);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 relative">
      {/* BACK BUTTON - Top Right */}
      <button
        onClick={() => safeNavigateBack(navigate)}
        className="fixed top-20 right-6 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-lg hover:shadow-xl transition-all duration-200 border border-slate-200 dark:border-slate-700 group"
        title="Go back"
      >
        <X size={20} className="text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
      </button>
      
      <h1 className="text-3xl font-bold mb-8">My Communities</h1>
      
      {communities.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <p className="text-gray-600 mb-4">You haven't joined any communities yet</p>
          <Link to="/communities" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
            Discover Communities
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map(community => (
            <Link key={community._id} to={`/communities/${community._id}`} 
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
              <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600" style={{
                backgroundImage: community.coverImage?.url ? `url(${community.coverImage.url})` : undefined,
                backgroundSize: 'cover'
              }} />
              <div className="p-5">
                <h3 className="text-xl font-bold mb-2">{community.name}</h3>
                <p className="text-sm text-gray-500">{community.memberCount} members</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}