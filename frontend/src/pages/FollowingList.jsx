import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { X } from 'lucide-react';

export default function FollowingList() {
  const { username } = useParams();
  const navigate = useNavigate();

  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowing();
  }, [username]);

  const fetchFollowing = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/users/${username}/following`);
      setFollowing(res.data || []);
    } catch (error) {
      console.error('Fetch following failed:', error);
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-fade-in">
      
      {/* ================= HEADER ================= */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Following</h1>
          <p className="text-slate-500 text-sm mt-1">
            People @{username} follows
          </p>
        </div>
        <button
          onClick={() => navigate(`/profile/${username}`)}
          className="ml-4 p-2 rounded-full hover:bg-slate-100 transition"
          title="Close"
        >
          <X size={24} />
        </button>
      </div>

      {/* ================= EMPTY STATE ================= */}
      {following.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
          <div className="text-5xl mb-4">🚀</div>
          <p className="text-slate-700 font-semibold">
            Not following anyone yet
          </p>
          <p className="text-slate-400 text-sm mt-1">
            Follow people to see them listed here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {following.map((user) => (
            <button
              key={user._id}
              onClick={() => navigate(`/profile/${user.username}`)}
              className="
                w-full text-left
                bg-white rounded-2xl
                p-4 flex items-center gap-4
                shadow-sm border border-slate-100
                hover:shadow-md hover:border-slate-200
                transition-all duration-200
                active:scale-[0.98]
              "
            >
              {/* ================= AVATAR ================= */}
              <img
                src={
                  user.profileImage ||
                  `https://ui-avatars.com/api/?name=${user.fullName}&background=6366f1&color=fff&size=128`
                }
                alt={user.fullName}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              />

              {/* ================= INFO ================= */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">
                  {user.fullName}
                </p>
                <p className="text-sm text-slate-500 truncate">
                  @{user.username}
                </p>

                {user.bio && (
                  <p className="text-sm text-slate-600 mt-1 line-clamp-1">
                    {user.bio}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
