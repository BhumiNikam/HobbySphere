import { useEffect, useState, memo } from 'react';
import TrendingHashtags from './TrendingHashtags';
import SuggestedUsers from './SuggestedUsers';
import SuggestedCommunities from './SuggestedCommunities';

const SidebarSection = memo(function SidebarSection({ delay = 0, children }) {
  return (
    <div
      className="animate-fade-in"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  );
});

function SidebarSkeleton() {
  return (
    <div className="space-y-5">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-48 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 animate-pulse"
        />
      ))}
    </div>
  );
}

export default function RightSidebar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setMounted(true);
      return;
    }

    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <aside className="hidden lg:block w-80 sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto 
                      overscroll-contain scrollbar-thin">
      <div className="space-y-5 pr-1">
        {!mounted ? (
          <SidebarSkeleton />
        ) : (
          <>
            <SidebarSection delay={0}>
              <TrendingHashtags />
            </SidebarSection>

            <SidebarSection delay={100}>
              <SuggestedUsers />
            </SidebarSection>

            <SidebarSection delay={200}>
              <SuggestedCommunities />
            </SidebarSection>
          </>
        )}
      </div>
    </aside>
  );
}