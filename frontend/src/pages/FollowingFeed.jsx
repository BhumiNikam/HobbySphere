import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import API from '../services/api';
import { ArrowLeft, User } from 'lucide-react';

export default function FollowingFeed() {
  const { user } = useContext(AuthContext);
  const [following, setFollowing] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [showMobileList, setShowMobileList] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowing();
    fetchAllFollowingPosts();
  }, []);

  const fetchFollowing = async () => {
    try {
      const res = await API.get(`/users/${user.username}/following`);
      setFollowing(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch following');
      setLoading(false);
    }
  };

  const fetchAllFollowingPosts = async () => {
    try {
      const res = await API.get('/posts/feed/following');
      setAllPosts(res.data);
      setPosts(res.data); // Show all by default
    } catch (error) {
      console.error('Failed to fetch posts');
    }
  };

  const handleSelectUser = async (selectedUser) => {
    setSelectedUser(selectedUser);
    setShowMobileList(false);
    
    // Filter posts by selected user
    const userPosts = allPosts.filter(post => post.author._id === selectedUser._id);
    setPosts(userPosts);
  };

  const handleShowAll = () => {
    setSelectedUser(null);
    setPosts(allPosts);
    setShowMobileList(false);
  };

  const handleBack = () => {
    setShowMobileList(true);
  };

  const handleDelete = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
    setAllPosts(allPosts.filter(p => p._id !== postId));
  };

  return (
    <div className="flex h-[calc(100vh-73px)]">
      {/* LEFT SIDEBAR - Following List */}
      <div className={`
        ${showMobileList ? 'block' : 'hidden'} 
        md:block w-full md:w-80 bg-white border-r overflow-y-auto
      `}>
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold mb-2">Following</h2>
          <button
            onClick={handleShowAll}
            className={`w-full py-2 px-4 rounded-lg text-left hover:bg-gray-50 transition ${
              !selectedUser ? 'bg-indigo-50 text-indigo-600 font-semibold' : ''
            }`}
          >
            All Posts ({allPosts.length})
          </button>
        </div>

        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : following.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-600 mb-4">You're not following anyone yet</p>
            <p className="text-sm text-gray-500">Discover users to follow!</p>
          </div>
        ) : (
          <div>
            {following.map((followedUser) => {
              const userPostCount = allPosts.filter(p => p.author._id === followedUser._id).length;
              return (
                <div
                  key={followedUser._id}
                  onClick={() => handleSelectUser(followedUser)}
                  className={`
                    p-4 border-b cursor-pointer hover:bg-gray-50 transition
                    ${selectedUser?._id === followedUser._id ? 'bg-indigo-50' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={followedUser.profileImage || `https://ui-avatars.com/api/?name=${followedUser.fullName}`}
                      alt={followedUser.fullName}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold truncate">{followedUser.fullName}</h3>
                        {userPostCount > 0 && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                            {userPostCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">@{followedUser.username}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT CONTENT AREA */}
      <div className={`
        ${!showMobileList ? 'block' : 'hidden'} 
        md:block flex-1 overflow-y-auto bg-gray-50
      `}>
        {/* Mobile Back Button */}
        <div className="md:hidden bg-white border-b p-4 sticky top-0 z-10">
          <button onClick={handleBack} className="flex items-center gap-2 text-gray-700">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">
              {selectedUser ? selectedUser.fullName : 'All Posts'}
            </span>
          </button>
        </div>

        {/* Posts Content */}
        <div className="max-w-3xl mx-auto px-4 py-6">
          {selectedUser && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedUser.profileImage || `https://ui-avatars.com/api/?name=${selectedUser.fullName}`}
                  alt={selectedUser.fullName}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-2xl font-bold">{selectedUser.fullName}</h2>
                  <p className="text-gray-600">@{selectedUser.username}</p>
                </div>
              </div>
            </div>
          )}

          {posts.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center">
              <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600">
                {selectedUser 
                  ? `${selectedUser.fullName} hasn't posted yet` 
                  : 'No posts from people you follow'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUser={user}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}