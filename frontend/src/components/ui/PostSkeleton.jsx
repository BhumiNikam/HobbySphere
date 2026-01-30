export default function PostSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 space-y-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-3 w-24 bg-slate-200 rounded" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 rounded w-full" />
        <div className="h-4 bg-slate-200 rounded w-5/6" />
        <div className="h-4 bg-slate-200 rounded w-3/4" />
      </div>

      {/* Media */}
      <div className="h-52 bg-slate-200 rounded-xl" />

      {/* Actions */}
      <div className="flex gap-6 pt-4 border-t">
        <div className="h-5 w-10 bg-slate-200 rounded" />
        <div className="h-5 w-10 bg-slate-200 rounded" />
        <div className="ml-auto h-5 w-6 bg-slate-200 rounded" />
      </div>
    </div>
  );
}
