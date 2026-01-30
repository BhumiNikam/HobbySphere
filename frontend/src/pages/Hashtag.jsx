import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Hash, X } from 'lucide-react';
import PostCard from '../components/PostCard';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';

export default function Hashtag() {
  const { tag } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    fetchPosts(1);
  }, [tag]);

  const fetchPosts = async (pageNumber) => {
    setLoading(true);
    try {
      const res = await API.get(
        `/search/hashtag/${encodeURIComponent(tag)}?page=${pageNumber}`
      );

      setPosts(pageNumber === 1 ? res.data.posts : prev => [...prev, ...res.data.posts]);
      setHasMore(res.data.hasMore);
    } catch (error) {
      console.error('Failed to fetch hashtag posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage);
  };

  const handleDelete = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="text-slate-500">Loading posts…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6">
      {/* HEADER */}
      <div className="bg-white rounded-2xl p-6 border shadow-sm">
        <div className="flex items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Hash size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">#{tag}</h1>
              <p className="text-slate-500 text-sm">
                {posts.length} posts
              </p>
            </div>
          </div>
          <button
            aria-label="Close"
            onClick={() => navigate(-1)}
            className="ml-auto p-2 rounded-full hover:bg-slate-100 transition"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* POSTS */}
      {posts.length > 0 ? (
        <>
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              currentUser={user}
              onDelete={handleDelete}
            />
          ))}

          {hasMore && (
            <button
              onClick={loadMore}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium"
            >
              Load more
            </button>
          )}
        </>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border shadow-sm text-slate-500">
          No posts found with #{tag}
        </div>
      )}
    </div>
  );
}