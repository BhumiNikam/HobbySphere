import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PostForm from './PostForm';

export default function CreatePostModal({ onClose }) {
  const { t } = useTranslation();

  /* ================= PREVENT BACKGROUND SCROLL ================= */
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  /* ================= ESC KEY CLOSE ================= */
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="
        fixed inset-0 z-50
        bg-black/50 dark:bg-black/70 backdrop-blur-sm
        flex items-center justify-center
        p-4
      "
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          bg-white dark:bg-slate-900 rounded-2xl
          w-full max-w-xl
          shadow-2xl border border-slate-200 dark:border-slate-800
          animate-scale-in
          overflow-hidden
        "
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {t('nav.createPost') || 'Create Post'}
          </h2>

          <button
            onClick={onClose}
            className="
              p-2 rounded-full
              hover:bg-slate-100 dark:hover:bg-slate-800
              transition
              active:scale-95
            "
            aria-label="Close"
          >
            <X size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* BODY */}
        <div className="px-6 py-5">
          <PostForm
            onPostCreated={() => {
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}