  import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
  import { AuthProvider, AuthContext } from './context/AuthContext';
  import { SocketProvider, useSocket } from './context/SocketContext';
  import { useContext } from 'react';
  import Login from './pages/Login';
  import Register from './pages/Register';
  import ForgotPassword from './pages/ForgotPassword';
  import ResetPassword from './pages/ResetPassword';
  import Messages from './pages/Messages';
  import Feed from './pages/Feed';
  import FollowingFeed from './pages/FollowingFeed';
  import FollowersList from './pages/FollowersList';
  import FollowingList from './pages/FollowingList';
  import Profile from './pages/Profile';
  import Hashtag from './pages/Hashtag';
  import Reels from './pages/Reels'; // 🆕 NEW
  import Communities from './pages/Communities';
  import CommunityPage from './pages/CommunityPage';
  import CreateCommunity from './pages/CreateCommunity';
  import MyCommunities from './pages/MyCommunities';
  import NotificationBell from './components/NotificationBell';
  import SearchBar from './components/SearchBar';
  import { Toaster } from 'react-hot-toast';

  function ProtectedRoute({ children }) {
    const { user, loading } = useContext(AuthContext);
    if (loading) return <div>Loading...</div>;
    return user ? children : <Navigate to="/login" />;
  }

  function Layout({ children }) {
    const { user, logout } = useContext(AuthContext);
    const { unreadMessageCount } = useSocket();

    console.log('🎨 Layout render - unreadMessageCount:', unreadMessageCount);

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4 relative">
            <Link to="/" className="text-2xl font-bold text-indigo-600 whitespace-nowrap">HobbySphere</Link>
            
            <SearchBar />
            
            <div className="flex items-center gap-4">
              <Link to="/feed" className="font-medium hover:text-indigo-600 whitespace-nowrap">
                All Posts
              </Link>
              <Link to="/following" className="font-medium hover:text-indigo-600 whitespace-nowrap">
                Following
              </Link>
              {/* 🆕 NEW - Reels Link */}
              <Link to="/reels" className="font-medium hover:text-indigo-600 whitespace-nowrap">
                Reels
              </Link>
              <Link to="/communities" className="font-medium hover:text-indigo-600 whitespace-nowrap">
                Communities
              </Link>
                <Link to="/my-communities" className="font-medium hover:text-indigo-600 whitespace-nowrap">
                  My Communities
                </Link>
              <NotificationBell />
              <Link to="/messages" className="flex items-center gap-2 hover:text-blue-500 relative">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Messages
                {unreadMessageCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                  </span>
                )}
              </Link>
              <Link to={`/profile/${user?.username}`} className="font-medium hover:text-indigo-600 whitespace-nowrap">
                Profile
              </Link>
              <button onClick={logout} className="text-red-600 hover:text-red-700 font-medium whitespace-nowrap">
                Logout
              </button>
            </div>
          </div>
        </nav>
        {children}
      </div>
    );
  }

  function App() {
    return (
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <Toaster position="top-right" />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/feed" element={<ProtectedRoute><Layout><Feed /></Layout></ProtectedRoute>} />
              <Route path="/following" element={<ProtectedRoute><Layout><FollowingFeed /></Layout></ProtectedRoute>} />
              <Route path="/profile/:username" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
              <Route path="/profile/:username/followers" element={<ProtectedRoute><Layout><FollowersList /></Layout></ProtectedRoute>} />
              <Route path="/profile/:username/following" element={<ProtectedRoute><Layout><FollowingList /></Layout></ProtectedRoute>} />
              <Route path="/hashtag/:tag" element={<ProtectedRoute><Layout><Hashtag /></Layout></ProtectedRoute>} />
              {/* 🆕 NEW - Reels Route (no Layout, fullscreen experience) */}
              <Route path="/reels" element={<ProtectedRoute><Reels /></ProtectedRoute>} />
              <Route path="/communities" element={<ProtectedRoute><Layout><Communities /></Layout></ProtectedRoute>} />
              <Route path="/communities/create" element={<ProtectedRoute><Layout><CreateCommunity /></Layout></ProtectedRoute>} />
              <Route path="/communities/:id" element={<ProtectedRoute><Layout><CommunityPage /></Layout></ProtectedRoute>} />
              <Route path="/my-communities" element={<ProtectedRoute><Layout><MyCommunities /></Layout></ProtectedRoute>} />
              <Route path="/" element={<Navigate to="/feed" />} />
              <Route path="/messages" element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    );
  }

  export default App;