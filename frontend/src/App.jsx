import {
  Home,
  Film,
  Users,
  MessageCircle,
  User,
  LogOut,
  Plus,
  FileText,
  Moon,
  Sun,
  Languages,
} from 'lucide-react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast, { Toaster } from 'react-hot-toast';
import './i18n';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Messages from './pages/Messages';
import FollowingFeed from './pages/FollowingFeed';
import FollowersList from './pages/FollowersList';
import FollowingList from './pages/FollowingList';
import Profile from './pages/Profile';
import Hashtag from './pages/Hashtag';
import CommunitiesLayout from './pages/CommunitiesLayout';
import CreateCommunity from './pages/CreateCommunity';

import NotificationBell from './components/NotificationBell';
import SearchBar from './components/SearchBar';
import ScrollToTop from './components/ScrollToTop';
import PostForm from './components/PostForm';
import RightSidebar from './components/sidebar/RightSidebar';

/* =========================
   PROTECTED ROUTE
========================= */
function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
}

/* =========================
   LAYOUT
========================= */
function Layout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const { unreadMessageCount } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const { i18n } = useTranslation();
  const location = useLocation();

  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showFab, setShowFab] = useState(true);

  const isActive = (path) => location.pathname.startsWith(path);

  // 🔥 KEY LINE — detect communities pages
  const isCommunitiesPage = location.pathname.startsWith('/communities');

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setShowLangMenu(false);
  };

  /* FAB show / hide */
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const onScroll = () => {
      setShowFab(window.scrollY < lastScrollY);
      lastScrollY = window.scrollY;
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fb] dark:bg-slate-900">

      {/* ================= NAVBAR ================= */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 dark:bg-slate-800/90 backdrop-blur border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              H
            </div>
            <span className="hidden sm:block font-bold tracking-tight text-slate-900 dark:text-slate-100">
              HobbySphere
            </span>
          </Link>

          {/* Search */}
          <div className="hidden md:block w-full max-w-md mx-8">
            <SearchBar />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Create */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setShowCreateMenu(!showCreateMenu)}
                className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                <Plus size={16} className="inline mr-1" />
                Create
              </button>

              {showCreateMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowCreateMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl shadow-lg z-20 overflow-hidden">
                    <button
                      onClick={() => {
                        setShowCreateMenu(false);
                        setShowCreatePost(true);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-300"
                    >
                      <FileText size={16} /> Create Post
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateMenu(false);
                        window.location.href = '/communities/create';
                      }}
                      className="w-full px-4 py-3 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-300"
                    >
                      <Users size={16} /> Create Community
                    </button>
                  </div>
                </>
              )}
            </div>

            <NavLink to="/following" active={isActive('/following')} icon={<Home size={20} />} />
            <NavLink to="/communities" active={isActive('/communities')} icon={<Users size={20} />} />

            <NotificationBell />

            <Link to="/messages" className="nav-link relative">
              <MessageCircle size={20} />
              {unreadMessageCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                </span>
              )}
            </Link>

            <Link to={`/profile/${user?.username}`} className="nav-link">
              <User size={20} />
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="nav-link"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="nav-link"
                title="Change language"
              >
                <Languages size={20} />
              </button>

              {showLangMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowLangMenu(false)}
                  />
                  <div className="dropdown">
                    <button
                      onClick={() => changeLanguage('en')}
                      className="dropdown-item"
                    >
                      English
                    </button>
                    <button
                      onClick={() => changeLanguage('hi')}
                      className="dropdown-item"
                    >
                      हिंदी (Hindi)
                    </button>
                    <button
                      onClick={() => changeLanguage('mr')}
                      className="dropdown-item"
                    >
                      मराठी (Marathi)
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={logout}
              className="nav-link text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* ================= CREATE POST MODAL ================= */}
      {showCreatePost && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-xl">
            <div className="flex justify-between items-center p-4 border-b dark:border-slate-700">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Create Post</h2>
              <button 
                onClick={() => setShowCreatePost(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <PostForm
                onPostCreated={() => {
                  setShowCreatePost(false);
                  toast.success('Post created!');
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= MAIN CONTENT ================= */}
      <main className="pt-20 max-w-[1200px] mx-auto px-6">
        {children}
      </main>

      {/* ================= MOBILE FAB ================= */}
      {showFab && (
        <button
          onClick={() => setShowCreateMenu(true)}
          className="fixed bottom-6 right-6 md:hidden bg-indigo-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-50"
        >
          <Plus />
        </button>
      )}

      <ScrollToTop />
    </div>
  );
}

/* =========================
   NAV LINK
========================= */
function NavLink({ to, icon, active }) {
  return (
    <Link
      to={to}
      className={`nav-link ${active ? 'active' : ''}`}
    >
      {icon}
    </Link>
  );
}

/* =========================
   APP ROOT
========================= */
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <Toaster position="top-right" />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              <Route path="/following" element={<ProtectedRoute><Layout><FollowingFeed /></Layout></ProtectedRoute>} />
              <Route path="/profile/:username" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
              <Route path="/profile/:username/followers" element={<ProtectedRoute><Layout><FollowersList /></Layout></ProtectedRoute>} />
              <Route path="/profile/:username/following" element={<ProtectedRoute><Layout><FollowingList /></Layout></ProtectedRoute>} />
              <Route path="/hashtag/:tag" element={<ProtectedRoute><Layout><Hashtag /></Layout></ProtectedRoute>} />
              <Route path="/communities/*" element={<ProtectedRoute><Layout><CommunitiesLayout /></Layout></ProtectedRoute>} />
              <Route path="/communities/create" element={<ProtectedRoute><Layout><CreateCommunity /></Layout></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />

              <Route path="/" element={<Navigate to="/following" />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}