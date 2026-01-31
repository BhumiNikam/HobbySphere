import TrendingHashtags from './TrendingHashtags';
import SuggestedUsers from './SuggestedUsers';
import SuggestedCommunities from './SuggestedCommunities';

export default function RightSidebar() {
  return (
    <aside className="hidden lg:block w-[336px] flex-shrink-0">
      <div className="sticky top-24 space-y-4">
        <TrendingHashtags />
        <SuggestedUsers />
        <SuggestedCommunities />
      </div>
    </aside>
  );
}