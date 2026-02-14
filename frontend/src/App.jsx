import {
  Home as HomeIcon,
  Users,
  MessageCircle,
  User,
  LogOut,
  Plus,
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
import { useContext, useState, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import toast, { Toaster } from 'react-hot-toast';
import './i18n';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Home from './pages/Home';

// ✅ LAZY LOAD HEAVY COMPONENTS
const Messages = lazy(() => import('./pages/Messages'));
const Profile = lazy(() => import('./pages/Profile'));
const FollowingFeed = lazy(() => import('./pages/FollowingFeed'));
const FollowersList = lazy(() => import('./pages/FollowersList'));
const FollowingList = lazy(() => import('./pages/FollowingList'));
const Hashtag = lazy(() => import('./pages/Hashtag'));
const Communities = lazy(() => import('./pages/Communities'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const CommunitiesLayout = lazy(() => import('./pages/CommunitiesLayout'));
const CreateCommunity = lazy(() => import('./pages/CreateCommunity'));

import NotificationBell from './components/NotificationBell';
import SearchBar from './components/SearchBar';
import ScrollToTop from './components/ScrollToTop';
import PostForm from './components/PostForm';

// ✅ LAZY LOAD SIDEBAR COMPONENTS - Only load when needed
const TrendingHashtags = lazy(() => import('./components/sidebar/TrendingHashtags'));
const SuggestedUsers = lazy(() => import('./components/sidebar/SuggestedUsers'));
const SuggestedCommunities = lazy(() => import('./components/sidebar/SuggestedCommunities'));

/* LOADING SPINNER */
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );
}

/* PROTECTED ROUTE */
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

/* LAYOUT */
function Layout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const { unreadMessageCount } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const { i18n, t } = useTranslation();
  const location = useLocation();

  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showFab, setShowFab] = useState(true);
  const [showGuestWarning, setShowGuestWarning] = useState(false);

  const isActive = (path) => location.pathname.startsWith(path);
  const isGuest = user?.username?.startsWith('guest_');

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setShowLangMenu(false);
  };

  const handleLogout = () => {
    if (isGuest) {
      setShowGuestWarning(true);
    } else {
      logout();
    }
  };

  const confirmGuestLogout = () => {
    setShowGuestWarning(false);
    logout();
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

      {/* NAVBAR */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">

            {/* Left: Brand + Mobile Menu */}
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
              </button>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm sm:text-base shadow-md">
                  H
                </div>
                <span className="hidden sm:block font-bold tracking-tight text-slate-900 dark:text-slate-100 text-lg">
                  HobbySphere
                </span>
              </div>
            </div>

            {/* Center: Search (Desktop) */}
            <div className="hidden lg:block flex-1 max-w-md mx-8">
              <SearchBar />
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="hidden lg:flex items-center gap-1">
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <Plus size={16} />
                  <span className="hidden xl:inline">{t('nav.create')}</span>
                </button>
              </div>

              <Link
                to="/"
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                title={t('nav.home')}
              >
                <HomeIcon size={20} />
              </Link>

              <Link
                to="/communities"
                className={`nav-link ${isActive('/communities') ? 'active' : ''}`}
                title={t('nav.communities')}
              >
                <Users size={20} />
              </Link>

              <NotificationBell />

              <Link to="/messages" className="nav-link relative" title={t('nav.messages')}>
                <MessageCircle size={20} />
                {unreadMessageCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-semibold">
                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                  </span>
                )}
              </Link>

              <Link to={`/profile/${user?.username}`} className="nav-link" title={t('nav.profile')}>
                <User size={20} />
              </Link>

              <button
                onClick={toggleTheme}
                className="nav-link hidden lg:block"
                title={t('nav.changeTheme')}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <div className="relative hidden lg:block">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="nav-link"
                  title={t('nav.changeLanguage')}
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

              <button
                onClick={handleLogout}
                className="nav-link text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                title={t('nav.logout')}
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          {!showMobileMenu && (
            <div className="lg:hidden pb-3 pt-1">
              <SearchBar />
            </div>
          )}
        </div>
      </nav>

      {/* GUEST LOGOUT WARNING MODAL */}
      {showGuestWarning && (
        <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="text-center space-y-4">
              <div className="text-5xl">⚠️</div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {t('auth.guestWarning')}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {t('auth.guestWarningDetail')}
              </p>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowGuestWarning(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  {t('auth.stayLoggedIn')}
                </button>
                <button
                  onClick={confirmGuestLogout}
                  className="flex-1 px-4 py-3 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  {t('auth.yesLogout')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE MENU */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="absolute left-0 top-[57px] sm:top-[65px] bottom-0 w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl animate-slide-in-left overflow-y-auto">
            <div className="flex flex-col p-4 space-y-2">
              
              {/* ✅ LAZY LOAD SIDEBAR COMPONENTS */}
              <div className="space-y-4 pb-2">
                <Suspense fallback={<div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />}>
                  <div className="px-2">
                    <TrendingHashtags />
                  </div>
                </Suspense>
                <Suspense fallback={<div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />}>
                  <div className="px-2">
                    <SuggestedUsers />
                  </div>
                </Suspense>
                <Suspense fallback={<div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />}>
                  <div className="px-2">
                    <SuggestedCommunities />
                  </div>
                </Suspense>
              </div>

              <div className="divider" />

              <button
                onClick={() => {
                  toggleTheme();
                  setShowMobileMenu(false);
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                {t('nav.changeTheme')}
              </button>

              <div className="divider" />

              <div className="px-4 py-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">{t('nav.changeLanguage')}</p>
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

      {/* CREATE POST MODAL */}
      {showCreatePost && (
        <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100">{t('nav.createPost')}</h2>
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
                  toast.success(t('post.postCreated'));
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="pt-[120px] sm:pt-24 lg:pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 lg:pb-8">
        {children}
      </main>

      {/* MOBILE FAB */}
      {showFab && (
        <div className="lg:hidden fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setShowCreatePost(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white w-14 h-14 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            title={t('nav.createPost')}
          >
            <Plus size={24} />
          </button>
        </div>
      )}

      <ScrollToTop />
    </div>
  );
}

/* APP ROOT */
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

              <Route path="/" element={<ProtectedRoute><Layout><Home /></Layout></ProtectedRoute>} />
              
              {/* ✅ LAZY LOADED ROUTES */}
              <Route path="/following" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <FollowingFeed />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/profile/:username" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Profile />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/profile/:username/followers" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <FollowersList />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/profile/:username/following" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <FollowingList />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/hashtag/:tag" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Hashtag />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/communities" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Communities />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/communities/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <CommunityPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/communities/my" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <CommunitiesLayout />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/communities/create" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <CreateCommunity />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/messages" element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Messages />
                  </Suspense>
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}