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
  Menu,
  X,
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
      <div className="min-h-screen flex items-center justify-center text-slate-500 dark:text-slate-400">
        <div className="spinner" />
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showFab, setShowFab] = useState(true);

  const isActive = (path) => location.pathname.startsWith(path);

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setShowLangMenu(false);
  };

  /* FAB show / hide on scroll */
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const onScroll = () => {
      setShowFab(window.scrollY < lastScrollY);
      lastScrollY = window.scrollY;
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Close mobile menu on route change */
  useEffect(() => {
    setShowMobileMenu(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* ================= NAVBAR ================= */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">

            {/* Left: Brand + Mobile Menu */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
              </button>

              {/* Brand */}
              <Link to="/" className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm sm:text-base shadow-md">
                  H
                </div>
                <span className="hidden sm:block font-bold tracking-tight text-slate-900 dark:text-slate-100 text-lg">
                  HobbySphere
                </span>
              </Link>
            </div>

            {/* Center: Search (Desktop) */}
            <div className="hidden lg:block flex-1 max-w-md mx-8">
              <SearchBar />
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center gap-1">
                {/* Create Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowCreateMenu(!showCreateMenu)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <Plus size={16} />
                    <span className="hidden xl:inline">Create</span>
                  </button>

                  {showCreateMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowCreateMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-20 overflow-hidden">
                        <button
                          onClick={() => {
                            setShowCreateMenu(false);
                            setShowCreatePost(true);
                          }}
                          className="w-full px-4 py-3 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          <FileText size={16} /> Create Post
                        </button>
                        <button
                          onClick={() => {
                            setShowCreateMenu(false);
                            window.location.href = '/communities/create';
                          }}
                          className="w-full px-4 py-3 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          <Users size={16} /> Create Community
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <NavLink to="/following" active={isActive('/following')} icon={<Home size={20} />} label="Home" />
                <NavLink to="/communities" active={isActive('/communities')} icon={<Users size={20} />} label="Communities" />
              </div>

              {/* Notifications */}
              <NotificationBell />

              {/* Messages */}
              <Link to="/messages" className="nav-link relative">
                <MessageCircle size={20} />
                {unreadMessageCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-semibold">
                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                  </span>
                )}
              </Link>

              {/* Profile */}
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
              <div className="relative hidden sm:block">
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
                      <button onClick={() => changeLanguage('en')} className="dropdown-item">
                        English
                      </button>
                      <button onClick={() => changeLanguage('hi')} className="dropdown-item">
                        हिंदी (Hindi)
                      </button>
                      <button onClick={() => changeLanguage('mr')} className="dropdown-item">
                        मराठी (Marathi)
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                className="nav-link text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="lg:hidden pb-3 pt-1">
            <SearchBar />
          </div>
        </div>
      </nav>

      {/* ================= MOBILE MENU ================= */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="absolute left-0 top-[57px] sm:top-[65px] bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl animate-slide-in-left">
            <div className="flex flex-col p-4 space-y-2">
              <Link
                to="/following"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActive('/following')
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Home size={20} />
                Home
              </Link>

              <Link
                to="/communities"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActive('/communities')
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Users size={20} />
                Communities
              </Link>

              <Link
                to="/messages"
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <MessageCircle size={20} />
                Messages
                {unreadMessageCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                  </span>
                )}
              </Link>

              <Link
                to={`/profile/${user?.username}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <User size={20} />
                Profile
              </Link>

              <div className="divider" />

              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  setShowCreatePost(true);
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <FileText size={20} />
                Create Post
              </button>

              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  window.location.href = '/communities/create';
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Users size={20} />
                Create Community
              </button>

              <div className="divider" />

              <div className="px-4 py-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Language</p>
                <div className="space-y-1">
                  <button
                    onClick={() => { changeLanguage('en'); setShowMobileMenu(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    English
                  </button>
                  <button
                    onClick={() => { changeLanguage('hi'); setShowMobileMenu(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    हिंदी
                  </button>
                  <button
                    onClick={() => { changeLanguage('mr'); setShowMobileMenu(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    मराठी
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= CREATE POST MODAL ================= */}
      {showCreatePost && (
        <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100">Create Post</h2>
              <button
                onClick={() => setShowCreatePost(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 sm:p-6">
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
      <main className="pt-[120px] sm:pt-24 lg:pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 lg:pb-8">
        {children}
      </main>

      {/* ================= MOBILE FAB ================= */}
      {showFab && (
        <button
          onClick={() => setShowCreatePost(true)}
          className="fixed bottom-6 right-6 lg:hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white w-14 h-14 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center z-40 transition-all hover:scale-110 active:scale-95"
        >
          <Plus size={24} />
        </button>
      )}

      <ScrollToTop />
    </div>
  );
}

/* =========================
   NAV LINK
========================= */
function NavLink({ to, icon, active, label }) {
  return (
    <Link
      to={to}
      className={`nav-link ${active ? 'active' : ''}`}
      title={label}
    >
      {icon}
      <span className="hidden xl:inline text-sm">{label}</span>
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
            <Toaster 
              position="top-right" 
              toastOptions={{
                className: 'dark:bg-slate-800 dark:text-slate-100',
                style: {
                  background: 'var(--toast-bg)',
                  color: 'var(--toast-color)',
                }
              }}
            />
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