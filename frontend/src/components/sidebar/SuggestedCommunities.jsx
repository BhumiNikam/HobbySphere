import { useEffect, useState, useCallback } from 'react';
import { Users, Plus, Loader2 } from 'lucide-react';
import API from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function SuggestedCommunities() {
  const { t } = useTranslation();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const res = await API.get('/communities/suggestions');
      setCommunities(res.data || []);
    } catch {
      setCommunities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = useCallback(async (communityId) => {
    if (joiningId) return;

    try {
      setJoiningId(communityId);
      await API.post(`/communities/${communityId}/join`);

      // Remove joined community from suggestions
      setCommunities((prev) =>
        prev.filter((c) => c._id !== communityId)
      );

      // Optional: navigate directly after join
      navigate(`/communities/${communityId}`);
    } catch {
      console.error('Join community failed');
    } finally {
      setJoiningId(null);
    }
  }, [joiningId, navigate]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">

      {/* ================= HEADER ================= */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
          <Users size={16} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="text-sm font-semibold tracking-wide text-slate-600 dark:text-slate-400 uppercase">
          {t('sidebar.suggestedCommunities')}
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
      ) : communities.length === 0 ? (
        <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-400">
          {t('search.noResults')} 🌱
        </div>
      ) : (
        <ul className="space-y-2">
          {communities.map((community, index) => {
            if (!community?._id) return null;

            const isJoining = joiningId === community._id;

            return (
              <li
                key={community._id}
                className="
                  flex items-center gap-3
                  p-3 rounded-xl
                  hover:bg-indigo-50 dark:hover:bg-indigo-900/20
                  transition
                  animate-fade-in
                "
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {/* COVER */}
                <div
                  onClick={() =>
                    navigate(`/communities/${community._id}`)
                  }
                  className="
                    w-12 h-12 rounded-xl
                    bg-gradient-to-br from-indigo-500 to-purple-600
                    flex-shrink-0 cursor-pointer
                  "
                  style={{
                    backgroundImage: community.coverImage?.url
                      ? `url(${community.coverImage.url})`
                      : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />

                {/* INFO */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() =>
                    navigate(`/communities/${community._id}`)
                  }
                >
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                    {community.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {community.memberCount || 0} {t('community.members').toLowerCase()}
                  </p>
                </div>

                {/* JOIN BUTTON */}
                <button
                  onClick={() => handleJoin(community._id)}
                  disabled={isJoining}
                  className="
                    min-w-[64px]
                    px-3 py-1.5
                    text-xs font-semibold
                    rounded-full
                    border border-indigo-200 dark:border-indigo-800
                    text-indigo-600 dark:text-indigo-400
                    hover:bg-indigo-100 dark:hover:bg-indigo-900/30
                    disabled:opacity-60
                    transition
                    flex items-center justify-center
                  "
                >
                  {isJoining ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      <Plus size={12} className="mr-1" />
                      {t('community.join')}
                    </>
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