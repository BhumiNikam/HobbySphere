import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { X, Image } from 'lucide-react';
import API from '../services/api';

export default function PostForm({ onPostCreated, communityId = null }) {
  const { user } = useContext(AuthContext);
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(communityId || '');
  const [userCommunities, setUserCommunities] = useState([]);

  useEffect(() => {
    if (!communityId) {
      fetchUserCommunities();
    }
  }, [communityId]);

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

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 4) {
      toast.error('Maximum 4 images allowed');
      return;
    }

    setImages([...images, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    const finalCommunityId = communityId || selectedCommunity;
    
    if (!finalCommunityId) {
      toast.error('Please select a community');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('communityId', finalCommunityId);
      
      images.forEach(image => {
        formData.append('images', image);
      });

      console.log('Submitting post with communityId:', finalCommunityId);

      const res = await API.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setContent('');
      setImages([]);
      setPreviews([]);
      setSelectedCommunity(communityId || '');
      onPostCreated(res.data);
      toast.success('Post created!');
    } catch (error) {
      console.error('Post creation error:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <form onSubmit={handleSubmit}>
        {/* Community Selector - Only show if not on community page */}
        {!communityId && (
          <div className="mb-4">
            <select
              value={selectedCommunity}
              onChange={(e) => setSelectedCommunity(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select a community</option>
              {userCommunities.map(community => (
                <option key={community._id} value={community._id}>
                  {community.name}
                </option>
              ))}
            </select>
            {userCommunities.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Join communities to start posting!
              </p>
            )}
          </div>
        )}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind? Use #hashtags"
          className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          rows="4"
          maxLength={2000}
        />

        {/* Image Previews */}
        {previews.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative">
                <img src={preview} alt="" className="w-full h-40 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <label className="flex items-center gap-2 text-indigo-600 cursor-pointer hover:text-indigo-700">
            <Image size={20} />
            <span className="text-sm font-medium">Add Images</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
              disabled={images.length >= 4}
            />
          </label>

          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}