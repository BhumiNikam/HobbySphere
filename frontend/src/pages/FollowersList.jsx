import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function FollowersList() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowers();
  }, [username]);

  const fetchFollowers = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/users/${username}/followers`);
      setFollowers(res.data);
    } catch (error) {
      console.error('Fetch followers failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Followers</h1>
      
      {followers.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No followers yet</p>
      ) : (
        <div className="space-y-4">
          {followers.map(user => (
            <div key={user._id} className="bg-white rounded-lg p-4 flex items-center gap-4 shadow hover:shadow-md transition">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {user.fullName.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{user.fullName}</p>
                <p 
                  onClick={() => navigate(`/profile/${user.username}`)}
                  className="text-sm text-gray-500 cursor-pointer hover:text-indigo-600"
                >
                  @{user.username}
                </p>
                {user.bio && <p className="text-sm text-gray-600 mt-1">{user.bio}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}