import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';

export default function CreateCommunity() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    privacy: 'public',
    rules: ''
  });
  const [coverImage, setCoverImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const categories = ['Photography', 'Gaming', 'Cooking', 'Art', 'Music', 'Fitness', 'Travel', 'Tech', 'Books', 'Other'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (coverImage) data.append('coverImage', coverImage);

      const res = await API.post('/communities', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Community created!');
      navigate(`/communities/${res.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create community');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Create Community</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Community Name *</label>
          <input
            type="text"
            required
            minLength={3}
            maxLength={50}
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="e.g. Photography Enthusiasts"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description *</label>
          <textarea
            required
            maxLength={500}
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg h-24"
            placeholder="What's this community about?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Category *</label>
          <select
            required
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="">Select category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Cover Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverImage(e.target.files[0])}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Privacy</label>
          <select
            value={formData.privacy}
            onChange={(e) => setFormData({...formData, privacy: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="public">Public - Anyone can join</option>
            <option value="private">Private - Approval required</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Community Rules (Optional)</label>
          <textarea
            maxLength={2000}
            value={formData.rules}
            onChange={(e) => setFormData({...formData, rules: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg h-32"
            placeholder="Set guidelines for your community..."
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {loading ? 'Creating...' : 'Create Community'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/communities')}
            className="px-6 py-3 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}