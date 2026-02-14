import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { X } from 'lucide-react';

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
      setFollowers(res.data || []);
    } catch (error) {
      console.error('Fetch followers failed:', error);
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-fade-in relative">
      
      {/* ================= HEADER ================= */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Followers</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            People who follow @{username}
          </p>
        </div>
        <button
          onClick={() => navigate(`/profile/${username}`)}
          className="ml-4 p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-md dark:shadow-xl border border-slate-200 dark:border-slate-700"
          title="Close"
        >
          <X size={24} className="text-slate-700 dark:text-slate-300" />
        </button>
      </div>

      {/* ================= EMPTY STATE ================= */}
      {followers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-xl dark:shadow-black/20 p-16 text-center border border-slate-100 dark:border-slate-800">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-slate-700 dark:text-slate-300 font-semibold">
            No followers yet
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
            When someone follows this profile, they'll appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {followers.map((user) => (
            <button
              key={user._id}
              onClick={() => navigate(`/profile/${user.username}`)}
              className="
                w-full text-left
                bg-white dark:bg-slate-900 rounded-2xl
                p-4 flex items-center gap-4
                shadow-sm dark:shadow-xl dark:shadow-black/20
                border border-slate-100 dark:border-slate-800
                hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700
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
                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {user.fullName}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  @{user.username}
                </p>

                {user.bio && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 line-clamp-1">
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