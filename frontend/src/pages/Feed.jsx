import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PostForm from '../components/PostForm';
import StoriesFeed from '../components/StoriesFeed';
import PostCard from '../components/PostCard';
import SkeletonLoader from '../components/SkeletonLoader';
import API from '../services/api';

export default function Feed() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 sec delay
      const res = await API.get('/posts/feed');
      setPosts(res.data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-indigo-600">🎨 HobbySphere</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium hidden sm:block">{user?.fullName}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>


      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-4 mt-6">
        {/* Stories Feed */}
        <StoriesFeed />
        <PostForm onPostCreated={handlePostCreated} />

        {/* Show skeletons while loading, otherwise posts or empty state */}
        {loading ? (
          <>
            <SkeletonLoader />
            <SkeletonLoader />
            <SkeletonLoader />
          </>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg">No posts yet. Create the first one! 🎉</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard
              key={post._id}
              post={post}
              currentUser={user}
              onDelete={handlePostDeleted}
            />
          ))
        )}
      </div>
    </div>
  );
}