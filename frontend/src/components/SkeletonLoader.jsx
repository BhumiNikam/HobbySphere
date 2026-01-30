export default function SkeletonLoader() {
  return (
    <div className="card-modern p-6 mb-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-slate-200 rounded-full skeleton"></div>
        <div className="flex-1">
          <div className="h-4 bg-slate-200 rounded-lg w-32 mb-2 skeleton"></div>
          <div className="h-3 bg-slate-200 rounded-lg w-24 skeleton"></div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-slate-200 rounded-lg skeleton"></div>
        <div className="h-4 bg-slate-200 rounded-lg w-5/6 skeleton"></div>
        <div className="h-4 bg-slate-200 rounded-lg w-4/6 skeleton"></div>
      </div>

      {/* Image placeholder */}
      <div className="h-64 bg-slate-200 rounded-xl mb-4 skeleton"></div>

      {/* Actions */}
      <div className="flex gap-6 pt-4 border-t border-slate-100">
        <div className="h-4 bg-slate-200 rounded-lg w-16 skeleton"></div>
        <div className="h-4 bg-slate-200 rounded-lg w-16 skeleton"></div>
        <div className="h-4 bg-slate-200 rounded-lg w-16 skeleton"></div>
      </div>
    </div>
  );
}