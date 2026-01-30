import { useEffect, useState, useCallback } from 'react';
import { Hash, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import API from '../../services/api';

export default function TrendingHashtags() {
  const { t } = useTranslation();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      const res = await API.get('/search/trending');
      setTags(res.data || []);
    } catch {
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = useCallback(
    (tag) => {
      const cleanTag = tag.startsWith('#') ? tag.substring(1) : tag;
      navigate(`/hashtag/${encodeURIComponent(cleanTag)}`);
    },
    [navigate]
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">

      {/* ================= HEADER ================= */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
          <TrendingUp size={16} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
          {t('sidebar.trending')}
        </h3>
      </div>

      {/* ================= CONTENT ================= */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="
                h-14 rounded-xl
                bg-slate-100 dark:bg-slate-700
                animate-pulse
              "
            />
          ))}
        </div>
      ) : tags.length === 0 ? (
        <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
          {t('search.noResults')} 🚀
        </div>
      ) : (
        <ul className="space-y-2">
          {tags.map((tag, index) => {
            if (!tag?._id) return null;

            return (
              <li
                key={tag._id}
                onClick={() => handleClick(tag._id)}
                className="
                  flex items-center gap-3
                  p-3 rounded-xl
                  cursor-pointer
                  hover:bg-indigo-50 dark:hover:bg-indigo-900/20
                  active:scale-[0.98]
                  transition-all
                  group
                  animate-fade-in
                "
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {/* RANK */}
                <div className="
                  w-6 text-center
                  text-xs font-bold
                  text-slate-400
                ">
                  #{index + 1}
                </div>

                {/* ICON */}
                <div className="
                  p-2 rounded-lg
                  bg-indigo-100 dark:bg-indigo-900/30
                  group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50
                  transition
                ">
                  <Hash size={14} className="text-indigo-600 dark:text-indigo-400" />
                </div>

                {/* TEXT */}
                <div className="flex-1 min-w-0">
                  <p className="
                    font-semibold
                    text-slate-800 dark:text-slate-200
                    truncate
                    group-hover:text-indigo-600 dark:group-hover:text-indigo-400
                    transition-colors
                  ">
                    #{tag._id}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {tag.count || 0} {t('search.posts').toLowerCase()}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}