import { useEffect, useState, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import PostCard from '../components/PostCard';
import API from '../services/api';
import PostSkeleton from '../components/ui/PostSkeleton';

const SEEN_POSTS_KEY = 'hobbysphere_seen_posts';
const LIMIT = 5;

export default function FollowingFeed() {
  const { user } = useContext(AuthContext);
  const { socket } = useSocket();

  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
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
    loadFeed(1, true);
  }, []);

  const loadFeed = async (pageNum, initial = false) => {
    try {
      initial ? setLoading(true) : setLoadingMore(true);

      const res = await API.get(
        `/posts/feed/following?page=${pageNum}&limit=${LIMIT}`
      );

      const newPosts = Array.isArray(res.data?.posts)
        ? res.data.posts
        : [];

      const more = Boolean(res.data?.hasMore);

      setPosts((prev) =>
        pageNum === 1 ? newPosts : [...prev, ...newPosts]
      );

      setHasMore(more);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to load feed', err);
    } finally {
      setLoading(false);
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
      setPosts((prev) => [e.detail, ...prev]);
      setHasNewPosts(false);
    };

    window.addEventListener('post-created', onPostCreated);
    return () =>
      window.removeEventListener('post-created', onPostCreated);
  }, []);

  const handleRefresh = async () => {
    setSeenPosts(new Set());
    localStorage.removeItem(SEEN_POSTS_KEY);
    await loadFeed(1, true);
    setHasNewPosts(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
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
    if (!hasMore || loadingMore) return;

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
  }, [page, hasMore, loadingMore]);

  const firstUnseenIndex = posts.findIndex(
    (p) => !seenPosts.has(p._id)
  );

  return (
    <div className="space-y-12 py-6">
      {hasNewPosts && (
        <div className="sticky top-20 z-30 flex justify-center py-4">
          <button
            onClick={handleRefresh}
            className="bg-indigo-600 text-white px-6 py-2 text-sm rounded-full shadow-lg hover:bg-indigo-700 transition"
          >
            New posts available · Tap to refresh
          </button>
        </div>
      )}

      {loading ? (
        <>
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border">
          <p className="text-slate-500 text-sm">
            No posts yet.<br />Follow people to see updates ✨
          </p>
        </div>
      ) : (
        <>
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
                  <div className="flex items-center my-14">
                    <div className="flex-grow border-t" />
                    <span className="mx-4 text-xs text-slate-500 uppercase tracking-widest">
                      New posts
                    </span>
                    <div className="flex-grow border-t" />
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
        </>
      )}
    </div>
  );
}