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
            bg-black/40 backdrop-blur-sm
            animate-fade-in
          "
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="
              relative w-full max-w-2xl mx-4
              animate-scale-in
            "
          >
            {/* CLOSE */}
            <button
              onClick={() => setOpen(false)}
              className="
                absolute top-3 right-3 z-10
                p-2 rounded-full
                bg-white shadow
                hover:bg-slate-100
                transition
              "
            >
              <X size={18} />
            </button>

            {/* POST FORM */}
            <PostForm
              onPostCreated={(newPost) => {
                setOpen(false);

                window.dispatchEvent(
                  new CustomEvent('post-created', { detail: newPost })
                );
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
