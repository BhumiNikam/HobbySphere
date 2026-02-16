import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import { ArrowLeft, Loader2 } from 'lucide-react';
import API from '../services/api';
import toast from 'react-hot-toast';
import { safeNavigateBack } from '../utils/navigation';

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    setLoading(true);
    setError(false);
    
    try {
      const res = await API.get(`/posts/${postId}`);
      setPost(res.data);
    } catch (err) {
      console.error('Failed to fetch post:', err);
      setError(true);
      toast.error('Post not found or has been deleted');
    } finally {
      setLoading(false);
    }
  };

  const handlePostDeleted = () => {
    toast.success('Post deleted');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Post Not Found
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            This post may have been deleted or the link is incorrect.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6">
      {/* Back Button */}
      <button
        onClick={() => safeNavigateBack(navigate)}
        className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="font-medium">Back</span>
      </button>

      {/* Post Card */}
      <PostCard
        post={post}
        currentUser={user}
        onDelete={handlePostDeleted}
        isMember={true}
      />

      {/* Related Posts or Community Info (Optional) */}
      {post.community && (
        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            Posted in
          </p>
          <button
            onClick={() => navigate(`/communities/${post.community._id}`)}
            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
          >
            {post.community.name}
          </button>
        </div>
      )}
    </div>
  );
}