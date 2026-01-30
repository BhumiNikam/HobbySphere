import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Hash, User, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import API from '../services/api';

export default function SearchBar() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [trending, setTrending] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);
  const activeQueryRef = useRef('');
  const navigate = useNavigate();

  /* ================= INITIAL ================= */
  useEffect(() => {
    fetchTrending();
  }, []);

  /* ================= OUTSIDE CLICK ================= */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ================= ESC KEY ================= */
  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  /* ================= SEARCH ================= */
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    clearTimeout(debounceRef.current);
    activeQueryRef.current = query;

    debounceRef.current = setTimeout(() => {
      searchUsers(query);
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  /* ================= POSITION ================= */
  useEffect(() => {
    if (!isOpen || !searchRef.current) return;

    const updatePosition = () => {
      const rect = searchRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isOpen]);

  /* ================= API ================= */
  const fetchTrending = async () => {
    try {
      const res = await API.get('/search/trending');
      setTrending(res.data || []);
    } catch {
      setTrending([]);
    }
  };

  const searchUsers = async (q) => {
    try {
      const res = await API.get(`/search/users?query=${q}`);

      // Prevent stale responses
      if (activeQueryRef.current !== q) return;

      setResults(res.data || []);
    } catch {
      setResults([]);
    } finally {
      if (activeQueryRef.current === q) {
        setLoading(false);
      }
    }
  };

  const resetSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  /* ================= UI ================= */
  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      {/* INPUT */}
      <div className="relative group">
        <Search
          size={18}
          className="
            absolute left-3 top-1/2 -translate-y-1/2
            text-slate-400
            group-focus-within:text-indigo-500
            transition
          "
        />

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={t('search.searchPlaceholder')}
          className="
            w-full
            pl-10 pr-10 py-2.5
            rounded-full
            bg-slate-100 dark:bg-slate-800
            border border-transparent
            text-slate-900 dark:text-slate-100
            placeholder:text-slate-500 dark:placeholder:text-slate-400
            focus:bg-white dark:focus:bg-slate-700
            focus:border-indigo-300
            focus:ring-2 focus:ring-indigo-100
            transition
          "
        />

        {query && (
          <button
            onClick={resetSearch}
            className="
              absolute right-3 top-1/2 -translate-y-1/2
              text-slate-400 hover:text-slate-600 dark:hover:text-slate-300
              transition
            "
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* DROPDOWN */}
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="
              absolute z-50
              bg-white dark:bg-slate-800
              rounded-2xl
              shadow-xl
              border border-slate-100 dark:border-slate-700
              overflow-hidden
              animate-scale-in
            "
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
            }}
          >
            {query.trim() ? (
              loading ? (
                <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  {t('common.loading')}
                </div>
              ) : results.length ? (
                <>
                  <div className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {t('search.users').toUpperCase()}
                  </div>

                  {results.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => {
                        navigate(`/profile/${user.username}`);
                        resetSearch();
                      }}
                      className="
                        w-full px-4 py-3
                        flex items-center gap-3
                        hover:bg-indigo-50 dark:hover:bg-indigo-900/20
                        transition
                      "
                    >
                      <div className="
                        w-9 h-9 rounded-full
                        bg-indigo-100 dark:bg-indigo-900/30
                        flex items-center justify-center
                        font-semibold text-indigo-600 dark:text-indigo-400
                      ">
                        {user.fullName?.[0]}
                      </div>

                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-semibold truncate text-slate-900 dark:text-slate-100">
                          {user.fullName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          @{user.username}
                        </p>
                      </div>

                      <User size={14} className="text-slate-400" />
                    </button>
                  ))}
                </>
              ) : (
                <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  {t('search.noResults')}
                </div>
              )
            ) : (
              <>
                <div className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t('sidebar.trending').toUpperCase()}
                </div>

                {trending.length ? (
                  trending.map((tag) => (
                    <button
                      key={tag._id}
                      onClick={() => {
                        const cleanTag = tag._id.startsWith('#') ? tag._id.substring(1) : tag._id;
                        navigate(`/hashtag/${encodeURIComponent(cleanTag)}`);
                        resetSearch();
                      }}
                      className="
                        w-full px-4 py-3
                        flex items-center justify-between
                        hover:bg-indigo-50 dark:hover:bg-indigo-900/20
                        transition
                      "
                    >
                      <div className="flex items-center gap-3">
                        <Hash size={16} className="text-indigo-500 dark:text-indigo-400" />
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          #{tag._id}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {tag.count} {t('search.posts').toLowerCase()}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    {t('search.noResults')}
                  </div>
                )}
              </>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}