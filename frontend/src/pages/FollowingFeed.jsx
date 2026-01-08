import { useState, useEffect } from 'react';
import PostCard from '../components/PostCard';
import API from '../services/api';

export default function FollowingFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser();
    fetchFollowingPosts();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await API.get('/auth/me');
      setUser(res.data);
    } catch (error) {
      console.error('Fetch user failed:', error);
    }
  };

  const fetchFollowingPosts = async () => {
    try {
      setLoading(true);
      const res = await API.get('/posts/feed/following');
      setPosts(res.data);
    } catch (error) {
      console.error('Fetch following feed failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Following Feed</h1>
      
      {posts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No posts yet from people you follow.</p>
          <p className="text-sm mt-2">Follow some users to see their posts here!</p>
        </div>
      ) : (
        posts.map(post => (
          <PostCard
            key={post._id}
            post={post}
            currentUser={user}
            onDelete={handleDelete}
          />
        ))
      )}
    </div>
  );
}