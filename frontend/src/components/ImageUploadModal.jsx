import { useState, useRef } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../services/api';

export default function ImageUploadModal({
  type,
  currentImage,
  onClose,
  onUpdate,
}) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);

  const isProfile = type === 'profile';
  const title = isProfile ? 'Update Profile Picture' : 'Update Cover Image';

  const uploadEndpoint = isProfile
    ? '/users/upload-profile-image'
    : '/users/upload-cover-image';

  const deleteEndpoint = isProfile
    ? '/users/remove-profile-image'
    : '/users/remove-cover-image';

  /* ================= FILE SELECT ================= */
  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setFile(selected);

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(selected);
  };

  /* ================= UPLOAD ================= */
  const handleUpload = async () => {
    if (!file || uploading) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await API.post(uploadEndpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(res.data.message || 'Image updated');
      onUpdate(isProfile ? res.data.profileImage : res.data.coverImage);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  /* ================= REMOVE ================= */
  const handleRemove = async () => {
    if (!window.confirm(`Remove ${isProfile ? 'profile picture' : 'cover image'}?`))
      return;

    setUploading(true);
    try {
      await API.delete(deleteEndpoint);
      toast.success('Image removed');
      onUpdate('');
      onClose();
    } catch {
      toast.error('Failed to remove image');
    } finally {
      setUploading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4"
      onClick={!uploading ? onClose : undefined}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 animate-scale-in"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-2 rounded-full hover:bg-slate-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* PREVIEW */}
        <div className="mb-6">
          {preview || currentImage ? (
            <div className="relative">
              <img
                src={preview || currentImage}
                alt="Preview"
                className={`w-full rounded-xl object-cover ${
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
                  className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black transition"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed border-slate-300 rounded-xl
                flex flex-col items-center justify-center cursor-pointer
                hover:border-indigo-500 hover:bg-indigo-50/30 transition
                ${isProfile ? 'h-64' : 'h-48'}
              `}
            >
              <Upload size={42} className="text-slate-400 mb-2" />
              <p className="font-medium text-slate-700">Click to select image</p>
              <p className="text-xs text-slate-400 mt-1">Max size 5MB</p>
            </div>
          )}
        </div>

        {/* INPUT */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row gap-3">
          {!preview && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 btn-secondary"
              disabled={uploading}
            >
              Choose Image
            </button>
          )}

          {preview && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 btn-primary"
            >
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          )}

          {currentImage && !preview && (
            <button
              onClick={handleRemove}
              disabled={uploading}
              className="flex-1 bg-red-500 text-white rounded-xl py-3 font-semibold hover:bg-red-600 transition"
            >
              <Trash2 size={16} className="inline mr-1" />
              Remove
            </button>
          )}

          <button
            onClick={onClose}
            disabled={uploading}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
