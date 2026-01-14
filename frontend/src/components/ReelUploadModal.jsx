import { useState, useRef, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { X, Upload, Loader } from 'lucide-react';
import axios from 'axios';
import API from '../services/api';

const ReelUploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const { user } = useContext(AuthContext);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState('');
  const [userCommunities, setUserCommunities] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchUserCommunities();
    }
  }, [isOpen]);

  const fetchUserCommunities = async () => {
    try {
      const res = await API.get('/communities');
      console.log('Communities response:', res.data);
      
      // Backend returns { communities: [], total, page, pages }
      const allCommunities = res.data.communities || res.data || [];
      
      // Filter only communities user is member of
      const memberCommunities = allCommunities.filter(c => 
        c.members && c.members.some(m => m.toString() === user._id || m === user._id)
      );
      
      setUserCommunities(memberCommunities);
    } catch (error) {
      console.error('Failed to fetch communities:', error);
      setUserCommunities([]);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setError('Please select a video file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('Video must be less than 50MB');
      return;
    }

    setError('');
    setVideoFile(file);
    
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
  };

  const handleUpload = async () => {
    if (!videoFile) {
      setError('Please select a video');
      return;
    }

    if (!selectedCommunity) {
      setError('Please select a community');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('caption', caption);
    formData.append('communityId', selectedCommunity);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/reels',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        }
      );

      onUploadSuccess(response.data);
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setCaption('');
    setSelectedCommunity('');
    setUploadProgress(0);
    setError('');
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Upload Reel</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Community Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select Community *</label>
          <select
            value={selectedCommunity}
            onChange={(e) => setSelectedCommunity(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Choose a community</option>
            {userCommunities.map(community => (
              <option key={community._id} value={community._id}>
                {community.name}
              </option>
            ))}
          </select>
          {userCommunities.length === 0 && (
            <p className="text-sm text-red-500 mt-2">
              You need to join a community first to upload reels
            </p>
          )}
        </div>

        {/* Video Preview */}
        {videoPreview ? (
          <div className="mb-4">
            <video
              src={videoPreview}
              controls
              className="w-full rounded-lg max-h-96 bg-black"
            />
            <button
              onClick={() => {
                setVideoFile(null);
                setVideoPreview(null);
              }}
              className="mt-2 text-sm text-red-500 hover:text-red-700"
            >
              Remove video
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 mb-4"
          >
            <Upload className="mx-auto mb-2 text-gray-400" size={48} />
            <p className="text-gray-600">Click to upload video</p>
            <p className="text-sm text-gray-400 mt-1">MP4, MOV, AVI (max 50MB)</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Caption */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption... (use #hashtags)"
            className="w-full border rounded-lg p-2 resize-none"
            rows="3"
            maxLength={500}
          />
          <p className="text-sm text-gray-400 mt-1">{caption.length}/500</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="mb-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-1 text-center">{uploadProgress}%</p>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!videoFile || !selectedCommunity || uploading || userCommunities.length === 0}
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {uploading ? (
            <>
              <Loader className="animate-spin mr-2" size={20} />
              Uploading...
            </>
          ) : (
            'Upload Reel'
          )}
        </button>
      </div>
    </div>
  );
};

export default ReelUploadModal;