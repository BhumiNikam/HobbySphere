import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Hash } from 'lucide-react';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/AuthContext';  // ADD THIS
import API from '../services/api';

export default function Hashtag() {
  const { tag } = useParams();
  const { user } = useAuth();  // ADD THIS
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [tag]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/search/hashtag/${tag}?page=${page}`);
      setPosts(res.data.posts);
      setHasMore(res.data.hasMore);
    } catch (error) {
      console.error('Failed to fetch hashtag posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    try {
      const res = await API.get(`/search/hashtag/${tag}?page=${page + 1}`);
      setPosts([...posts, ...res.data.posts]);
      setPage(page + 1);
      setHasMore(res.data.hasMore);
    } catch (error) {
      console.error('Failed to load more posts:', error);
    }
  };

  const handleDelete = (postId) => {  // ADD THIS
    setPosts(posts.filter(p => p._id !== postId));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-lg p-6 mb-6 border">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
            <Hash size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">#{tag}</h1>
            <p className="text-gray-500">{posts.length} posts</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {posts.length > 0 ? (
          <>
            {posts.map(post => (
              <PostCard 
                key={post._id} 
                post={post} 
                currentUser={user}      // ADD THIS
                onDelete={handleDelete} // ADD THIS
              />
            ))}
            {hasMore && (
              <button
                onClick={loadMore}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                Load More
              </button>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No posts found with #{tag}
          </div>
        )}
      </div>
    </div>
  );
}