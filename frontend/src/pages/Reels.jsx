import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Plus, X } from 'lucide-react';
import ReelsFeed from '../components/ReelsFeed';
import ReelUploadModal from '../components/ReelUploadModal';
import axios from 'axios';
import API from '../services/api';

export default function Reels() {
  const { user } = useContext(AuthContext);
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [hasJoinedCommunities, setHasJoinedCommunities] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkCommunities();
    fetchReels();
  }, []);

  const checkCommunities = async () => {
    try {
      const res = await API.get(`/users/${user.username}`);
      setHasJoinedCommunities(res.data.communities?.length > 0);
    } catch (error) {
      console.error('Failed to check communities');
    }
  };

  const fetchReels = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/reels?page=${page}&limit=10`);
      
      if (page === 1) {
        setReels(response.data.reels);
      } else {
        setReels(prev => [...prev, ...response.data.reels]);
      }
      
      setHasMore(response.data.currentPage < response.data.totalPages);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch reels:', error);
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!hasMore) return;
    setPage(prev => prev + 1);
    fetchReels();
  };

  const handleUploadSuccess = (newReel) => {
    setReels([newReel, ...reels]);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  // Show message if no communities joined
  if (!hasJoinedCommunities) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-center text-white p-8">
          <h2 className="text-2xl font-bold mb-4">Join Communities to See Reels</h2>
          <p className="text-gray-300 mb-6">
            Discover and join hobby communities to watch and share reels
          </p>
          <Link
            to="/communities"
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 font-semibold"
          >
            Browse Communities
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black to-transparent">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate('/communities')}
            className="text-white hover:text-gray-300"
          >
            <X size={28} />
          </button>
          <h1 className="text-white text-xl font-bold">Reels</h1>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Reels Feed */}
      {reels.length === 0 ? (
        <div className="h-full flex items-center justify-center text-white text-center p-8">
          <div>
            <p className="text-xl mb-4">No reels yet in your communities</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 font-semibold"
            >
              Upload First Reel
            </button>
          </div>
        </div>
      ) : (
        <ReelsFeed
          reels={reels}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
        />
      )}

      {/* Upload Modal */}
      <ReelUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}