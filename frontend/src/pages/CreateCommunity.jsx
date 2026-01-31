import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Upload } from 'lucide-react';

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
  const [coverPreview, setCoverPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const categories = ['Photography', 'Gaming', 'Cooking', 'Art', 'Music', 'Fitness', 'Travel', 'Tech', 'Books', 'Other'];

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/communities')}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft size={24} className="text-slate-700 dark:text-slate-300" />
          </button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Create Community
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 p-8 space-y-6">
          
          {/* Cover Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Cover Image
            </label>
            <div className="relative">
              {coverPreview ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                  <img src={coverPreview} alt="Cover preview" className="w-full h-48 object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setCoverImage(null);
                      setCoverPreview(null);
                    }}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white px-3 py-1 rounded-lg text-sm"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition bg-slate-50 dark:bg-slate-800">
                  <Upload size={40} className="text-slate-400 dark:text-slate-500 mb-2" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">Click to upload cover image</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Community Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Community Name *
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={50}
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition"
              placeholder="e.g. Photography Enthusiasts"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Description *
            </label>
            <textarea
              required
              maxLength={500}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl h-28 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition"
              placeholder="What's this community about?"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Category *
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition"
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Privacy */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Privacy
            </label>
            <select
              value={formData.privacy}
              onChange={(e) => setFormData({...formData, privacy: e.target.value})}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition"
            >
              <option value="public">Public - Anyone can join</option>
              <option value="private">Private - Approval required</option>
            </select>
          </div>

          {/* Rules */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Community Rules (Optional)
            </label>
            <textarea
              maxLength={2000}
              value={formData.rules}
              onChange={(e) => setFormData({...formData, rules: e.target.value})}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl h-32 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition"
              placeholder="Set guidelines for your community..."
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 dark:bg-indigo-500 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition shadow-lg hover:shadow-xl"
            >
              {loading ? 'Creating...' : 'Create Community'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/communities')}
              className="px-8 py-3 border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}