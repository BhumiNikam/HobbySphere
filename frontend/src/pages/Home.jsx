import { useEffect, useState, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import PostCard from '../components/PostCard';
import API from '../services/api';
import PostSkeleton from '../components/ui/PostSkeleton';
import RightSidebar from '../components/sidebar/RightSidebar';

const SEEN_POSTS_KEY = 'hobbysphere_seen_home_posts';
const LIMIT = 5;

function FeedSkeleton() {
  return (
    <div className="w-full min-h-[600px] space-y-6">
      <PostSkeleton />
      <PostSkeleton />
      <PostSkeleton />
    </div>
  );
}

export default function Home() {
  const { user } = useContext(AuthContext);
  const { socket } = useSocket();

  const [posts, setPosts] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNewPosts, setHasNewPosts] = useState(false);

  const [seenPosts, setSeenPosts] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SEEN_POSTS_KEY));
      return new Set(saved || []);
    } catch {
      return new Set();
    }
  });

  const seenObserverRef = useRef(null);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(
      SEEN_POSTS_KEY,
      JSON.stringify(Array.from(seenPosts))
    );
  }, [seenPosts]);

  useEffect(() => {
    loadFeed(1);
  }, []);

  const loadFeed = async (pageNum) => {
    try {
      if (pageNum === 1) {
        // Keep posts as null for initial skeleton
      } else {
        setLoadingMore(true);
      }

      // Get ALL posts (no following filter)
      const res = await API.get(
        `/posts?page=${pageNum}&limit=${LIMIT}`
      );

      const newPosts = Array.isArray(res.data?.posts)
        ? res.data.posts
        : [];

      const more = Boolean(res.data?.hasMore);

      setPosts((prev) =>
        pageNum === 1 ? newPosts : [...(prev || []), ...newPosts]
      );

      setHasMore(more);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to load feed', err);
      setPosts([]);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const onPostCreated = () => {
      if (window.scrollY > 200) {
        setHasNewPosts(true);
      } else {
        handleRefresh();
      }
    };

    socket.on('post_created', onPostCreated);
    return () => socket.off('post_created', onPostCreated);
  }, [socket]);

  useEffect(() => {
    const onPostCreated = (e) => {
      setPosts((prev) => [e.detail, ...(prev || [])]);
      setHasNewPosts(false);
    };

    window.addEventListener('post-created', onPostCreated);
    return () =>
      window.removeEventListener('post-created', onPostCreated);
  }, []);

  const handleRefresh = async () => {
    setSeenPosts(new Set());
    localStorage.removeItem(SEEN_POSTS_KEY);
    await loadFeed(1);
    setHasNewPosts(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => (prev || []).filter((p) => p._id !== postId));
    setSeenPosts((prev) => {
      const updated = new Set(prev);
      updated.delete(postId);
      return updated;
    });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.dataset.postid;
          setSeenPosts((prev) =>
            prev.has(id) ? prev : new Set([...prev, id])
          );
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );

    seenObserverRef.current = observer;
    return () => observer.disconnect();
  }, []);

  const observePost = (el) => {
    if (el && seenObserverRef.current) {
      seenObserverRef.current.observe(el);
    }
  };

  useEffect(() => {
    if (!hasMore || loadingMore || !posts) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadFeed(page + 1);
        }
      },
      { threshold: 1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [page, hasMore, loadingMore, posts]);

  const firstUnseenIndex = posts?.findIndex(
    (p) => !seenPosts.has(p._id)
  ) ?? -1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_336px] gap-8">
      {/* Main content column */}
      <div className="w-full space-y-6 py-6 min-w-0">
        {/* Tab selector */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-1 inline-flex gap-1">
          <button className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-medium text-sm transition-all">
            For You
          </button>
          <a
            href="/following"
            className="px-6 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium text-sm transition-all"
          >
            Following
          </a>
        </div>

        {hasNewPosts && (
          <div className="sticky top-20 z-30 flex justify-center">
            <button
              onClick={handleRefresh}
              className="bg-indigo-600 text-white px-6 py-2 text-sm rounded-full shadow-lg hover:bg-indigo-700 transition"
            >
              New posts available · Tap to refresh
            </button>
          </div>
        )}

        {posts === null ? (
          <FeedSkeleton />
        ) : posts.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="text-6xl">🌍</div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                No posts yet
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Be the first to share something! ✨
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-6">
            {posts.map((post, index) => (
              <div
                key={post._id}
                ref={observePost}
                data-postid={post._id}
                className={
                  !seenPosts.has(post._id)
                    ? 'animate-fade-in-up'
                    : ''
                }
              >
                {index === firstUnseenIndex &&
                  firstUnseenIndex !== -1 && (
                    <div className="flex items-center my-8">
                      <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
                      <span className="mx-4 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        New posts
                      </span>
                      <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
                    </div>
                  )}

                <PostCard
                  post={post}
                  currentUser={user}
                  isSeen={seenPosts.has(post._id)}
                  onDelete={handlePostDeleted}
                />
              </div>
            ))}

            {hasMore && (
              <div ref={loadMoreRef}>
                {loadingMore && <PostSkeleton />}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sidebar column */}
      <aside className="hidden lg:block">
        <RightSidebar />
      </aside>
    </div>
  );
}