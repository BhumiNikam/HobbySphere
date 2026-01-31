import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import PostForm from './PostForm';

export default function FloatingCreatePost() {
  const [open, setOpen] = useState(false);

  /* =========================
     LOCK BACKGROUND SCROLL
     ========================= */
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : 'auto';
    return () => (document.body.style.overflow = 'auto');
  }, [open]);

  /* =========================
     ESC KEY CLOSE
     ========================= */
  useEffect(() => {
    const onEsc = (e) => e.key === 'Escape' && setOpen(false);
    if (open) window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open]);

  return (
    <>
      {/* ================= FLOATING BUTTON ================= */}
      <button
        onClick={() => setOpen(true)}
        className="
          fixed bottom-6 right-6 z-40
          flex items-center gap-2
          px-5 py-3
          rounded-full
          bg-gradient-to-r from-indigo-600 to-purple-600
          text-white font-semibold
          shadow-xl
          hover:scale-105 hover:shadow-2xl
          active:scale-95
          transition-all duration-200
        "
      >
        <Plus size={20} />
        <span className="hidden sm:inline">Create</span>
      </button>

      {/* ================= MODAL ================= */}
      {open && (
        <div
          className="
            fixed inset-0 z-50
            flex items-center justify-center
            bg-black/50 dark:bg-black/70 backdrop-blur-sm
            animate-fade-in
            p-4
          "
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="
              bg-white dark:bg-slate-900 rounded-2xl
              w-full max-w-2xl
              shadow-2xl border border-slate-200 dark:border-slate-800
              max-h-[90vh] overflow-y-auto
              animate-scale-in
            "
          >
            {/* HEADER */}
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100">Create Post</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* POST FORM */}
            <div className="p-4 sm:p-6">
              <PostForm
                onPostCreated={() => {
                  setOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}