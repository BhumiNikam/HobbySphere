import { lazy, Suspense } from 'react';

// ✅ LAZY LOAD SIDEBAR COMPONENTS - Only load when visible
const TrendingHashtags = lazy(() => import('./TrendingHashtags'));
const SuggestedUsers = lazy(() => import('./SuggestedUsers'));
const SuggestedCommunities = lazy(() => import('./SuggestedCommunities'));

function SidebarSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
      <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-14 rounded-xl bg-slate-100 dark:bg-slate-700 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

export default function RightSidebar() {
  return (
    <aside className="hidden lg:block w-[336px] flex-shrink-0">
      <div className="sticky top-24 space-y-4">
        {/* ✅ LAZY LOAD WITH SUSPENSE - Loads components one by one */}
        <Suspense fallback={<SidebarSkeleton />}>
          <TrendingHashtags />
        </Suspense>
        
        <Suspense fallback={<SidebarSkeleton />}>
          <SuggestedUsers />
        </Suspense>
        
        <Suspense fallback={<SidebarSkeleton />}>
          <SuggestedCommunities />
        </Suspense>
      </div>
    </aside>
  );
}