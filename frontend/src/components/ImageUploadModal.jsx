import { useState, useRef } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../services/api';

export default function ImageUploadModal({ type, currentImage, onClose, onUpdate }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const isProfile = type === 'profile';
  const title = isProfile ? 'Update Profile Picture' : 'Update Cover Image';
  const endpoint = isProfile ? '/users/upload-profile-image' : '/users/upload-cover-image';
  const deleteEndpoint = isProfile ? '/users/remove-profile-image' : '/users/remove-cover-image';

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setFile(selectedFile);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await API.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(res.data.message);
      onUpdate(isProfile ? res.data.profileImage : res.data.coverImage);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Remove ${isProfile ? 'profile picture' : 'cover image'}?`)) return;

    setUploading(true);
    try {
      await API.delete(deleteEndpoint);
      toast.success(`${isProfile ? 'Profile picture' : 'Cover image'} removed`);
      onUpdate('');
      onClose();
    } catch (error) {
      toast.error('Failed to remove image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Preview */}
        <div className="mb-6">
          {preview || currentImage ? (
            <div className="relative">
              <img
                src={preview || currentImage}
                alt="Preview"
                className={`w-full object-cover rounded-lg ${
                  isProfile ? 'h-64' : 'h-48'
                }`}
              />
              {preview && (
                <button
                  onClick={() => {
                    setPreview(null);
                    setFile(null);
                    fileInputRef.current.value = '';
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition ${
                isProfile ? 'h-64' : 'h-48'
              }`}
            >
              <Upload size={48} className="text-gray-400 mb-2" />
              <p className="text-gray-600">Click to select image</p>
              <p className="text-sm text-gray-400 mt-1">Max size: 5MB</p>
            </div>
          )}
        </div>

        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Actions */}
        <div className="flex gap-3">
          {!preview && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 font-semibold"
            >
              Choose Image
            </button>
          )}

          {preview && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-semibold disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          )}

          {currentImage && !preview && (
            <button
              onClick={handleRemove}
              disabled={uploading}
              className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Trash2 size={18} />
              Remove
            </button>
          )}

          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}