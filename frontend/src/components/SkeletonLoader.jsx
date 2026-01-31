export default function SkeletonLoader() {
  return (
    <article className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-card animate-pulse">
      {/* HEADER - exact match */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
          <div>
            <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-1.5"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
          </div>
        </div>
        <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
      </div>

      {/* MEDIA - matches PostCard */}
      <div className="w-full h-[520px] bg-slate-200 dark:bg-slate-700"></div>

      {/* ACTIONS - exact match */}
      <div className="flex items-center gap-1 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
        <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
        <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
        <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
        <div className="ml-auto w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
      </div>

      {/* CONTENT - matches PostCard structure */}
      <div className="px-4 pt-3 pb-4">
        <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-16 mb-2"></div>
        <div className="space-y-2">
          <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
          <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
        </div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-32 mt-2"></div>
      </div>
    </article>
  );
}