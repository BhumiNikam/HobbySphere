import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Hash, User, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [trending, setTrending] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrending();
  }, []);

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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim()) {
      const timer = setTimeout(() => {
        searchUsers();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
    }
  }, [query]);

  useEffect(() => {
    if (isOpen && searchRef.current) {
      const rect = searchRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen]);

  const fetchTrending = async () => {
    try {
      const res = await API.get('/search/trending');
      setTrending(res.data);
    } catch (error) {
      console.error('Failed to fetch trending:', error);
    }
  };

  const searchUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/search/users?query=${query}`);
      setResults(res.data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (username) => {
    navigate(`/profile/${username}`);
    setTimeout(() => {
      setQuery('');
      setIsOpen(false);
    }, 100);
  };

  const handleHashtagClick = (tag) => {
    navigate(`/hashtag/${tag.replace('#', '')}`);
    setTimeout(() => {
      setQuery('');
      setIsOpen(false);
    }, 100);
  };

  return (
    <div className="relative flex-1 max-w-md" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search users or hashtags..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-white rounded-lg shadow-xl border z-[9999] max-h-96 overflow-y-auto"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`
          }}
        >
          {query.trim() ? (
            <div>
              {loading ? (
                <p className="text-center py-4 text-gray-500">Searching...</p>
              ) : results.length > 0 ? (
                <div>
                  <p className="px-4 py-2 text-xs text-gray-500 font-semibold">USERS</p>
                  {results.map(user => (
                    <button
                      key={user._id}
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleUserClick(user.username);
                      }}
                      className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {user.fullName.charAt(0)}
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-semibold text-sm">{user.fullName}</p>
                        <p className="text-xs text-gray-500">@{user.username}</p>
                      </div>
                      <User size={16} className="text-gray-400" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-gray-500">No users found</p>
              )}
            </div>
          ) : (
            <div>
              <p className="px-4 py-2 text-xs text-gray-500 font-semibold">TRENDING HASHTAGS</p>
              {trending.length > 0 ? (
                trending.map(tag => (
                  <button
                    key={tag._id}
                    onClick={() => handleHashtagClick(tag._id)}
                    className="w-full px-4 py-3 hover:bg-gray-50 flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-3">
                      <Hash size={18} className="text-indigo-500" />
                      <span className="font-medium">#{tag._id}</span>
                    </div>
                    <span className="text-xs text-gray-500">{tag.count} posts</span>
                  </button>
                ))
              ) : (
                <p className="text-center py-4 text-gray-500">No trending hashtags</p>
              )}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}