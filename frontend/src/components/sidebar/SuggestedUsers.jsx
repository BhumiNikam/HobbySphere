import { useEffect, useState, useCallback } from 'react';
import API from '../../services/api';
import { UserPlus, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function SuggestedUsers() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingId, setFollowingId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const res = await API.get('/users/suggestions');
      setUsers(res.data || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = useCallback(async (userId) => {
    if (followingId) return;

    try {
      setFollowingId(userId);
      await API.post(`/users/${userId}/follow`);

      // remove user smoothly after follow
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch {
      console.error('Follow failed');
    } finally {
      setFollowingId(null);
    }
  }, [followingId]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">

      {/* ================= HEADER ================= */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
          <UserPlus size={16} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="text-sm font-semibold tracking-wide text-slate-600 dark:text-slate-400 uppercase">
          {t('sidebar.suggested')}
        </h3>
      </div>

      {/* ================= CONTENT ================= */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 rounded-xl bg-slate-100 dark:bg-slate-700 animate-pulse"
            />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-400">
          {t('search.noResults')} 🎉
        </div>
      ) : (
        <ul className="space-y-2">
          {users.map((user, index) => {
            if (!user?._id) return null;

            const isFollowing = followingId === user._id;

            return (
              <li
                key={user._id}
                className="
                  flex items-center gap-3
                  p-3 rounded-xl
                  hover:bg-indigo-50 dark:hover:bg-indigo-900/20
                  transition
                  animate-fade-in
                "
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {/* AVATAR */}
                <img
                  src={
                    user.profileImage ||
                    `https://ui-avatars.com/api/?name=${user.fullName}&background=6366f1&color=fff`
                  }
                  alt={user.username}
                  onClick={() => navigate(`/profile/${user.username}`)}
                  className="
                    w-10 h-10 rounded-full object-cover
                    cursor-pointer
                  "
                />

                {/* INFO */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => navigate(`/profile/${user.username}`)}
                >
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    @{user.username}
                  </p>
                </div>

                {/* FOLLOW BUTTON */}
                <button
                  onClick={() => handleFollow(user._id)}
                  disabled={isFollowing}
                  className="
                    min-w-[70px]
                    text-xs font-semibold
                    px-3 py-1.5
                    rounded-full
                    border
                    border-indigo-200 dark:border-indigo-800
                    text-indigo-600 dark:text-indigo-400
                    hover:bg-indigo-100 dark:hover:bg-indigo-900/30
                    disabled:opacity-60
                    transition
                    flex items-center justify-center
                  "
                >
                  {isFollowing ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    t('profile.follow')
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}