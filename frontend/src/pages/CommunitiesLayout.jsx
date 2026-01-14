import { useState, useEffect, useContext } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import PostCard from '../components/PostCard';
import PostForm from '../components/PostForm';
import toast from 'react-hot-toast';
import { ArrowLeft, Users } from 'lucide-react';

export default function CommunitiesLayout() {
  const { user } = useContext(AuthContext);
  const [myCommunities, setMyCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [showMobileList, setShowMobileList] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyCommunities();
  }, []);

  const fetchMyCommunities = async () => {
    try {
      const res = await API.get('/communities');
      const joined = res.data.communities.filter(c => 
        c.members.some(m => m.toString() === user._id || m._id === user._id)
      );
      setMyCommunities(joined);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load communities');
      setLoading(false);
    }
  };

  const handleSelectCommunity = (community) => {
    setSelectedCommunity(community);
    setShowMobileList(false); // Hide list on mobile
  };

  const handleBack = () => {
    setSelectedCommunity(null);
    setShowMobileList(true);
  };

  return (
    <div className="flex h-[calc(100vh-73px)]">
      {/* LEFT SIDEBAR - Communities List */}
      <div className={`
        ${showMobileList ? 'block' : 'hidden'} 
        md:block w-full md:w-80 bg-white border-r overflow-y-auto
      `}>
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold mb-2">My Communities</h2>
          <button
            onClick={() => window.location.href = '/communities/create'}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 text-sm"
          >
            + Create Community
          </button>
        </div>

        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : myCommunities.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-600 mb-4">No communities yet</p>
            <a href="/communities/discover" className="text-indigo-600 hover:underline">
              Discover Communities
            </a>
          </div>
        ) : (
          <div>
            {myCommunities.map((community) => (
              <div
                key={community._id}
                onClick={() => handleSelectCommunity(community)}
                className={`
                  p-4 border-b cursor-pointer hover:bg-gray-50 transition
                  ${selectedCommunity?._id === community._id ? 'bg-indigo-50' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0" 
                    style={{
                      backgroundImage: community.coverImage?.url ? `url(${community.coverImage.url})` : undefined,
                      backgroundSize: 'cover'
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold truncate">{community.name}</h3>
                      {community.unreadCount > 0 && (
                        <span className="bg-indigo-600 text-white text-xs rounded-full px-2 py-0.5">
                          {community.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      <Users className="inline w-3 h-3" /> {community.memberCount} members
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT CONTENT AREA */}
      <div className={`
        ${!showMobileList ? 'block' : 'hidden'} 
        md:block flex-1 overflow-y-auto bg-gray-50
      `}>
        {selectedCommunity ? (
          <CommunityContent 
            community={selectedCommunity} 
            onBack={handleBack}
            user={user}
          />
        ) : (
          <div className="hidden md:flex h-full items-center justify-center text-gray-500">
            <div className="text-center">
              <Users className="w-20 h-20 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Select a community to view posts</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Community Content Component
function CommunityContent({ community, onBack, user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    fetchPosts();
    checkMembership();
  }, [community._id]);

  const fetchPosts = async () => {
    try {
      const res = await API.get(`/communities/${community._id}/posts`);
      setPosts(res.data.posts || res.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch posts');
      setLoading(false);
    }
  };

  const checkMembership = () => {
    const memberIds = community.members.map(m => m.toString());
    setIsMember(memberIds.includes(user._id));
  };

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Mobile Back Button */}
      <div className="md:hidden bg-white border-b p-4 sticky top-0 z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-700">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">{community.name}</span>
        </button>
      </div>

      {/* Community Header */}
      <div className="bg-white shadow-sm mb-4 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">{community.name}</h1>
            <p className="text-gray-600 text-sm mb-2">{community.description}</p>
            <div className="flex gap-3 text-sm text-gray-500">
              <span><Users className="inline w-4 h-4" /> {community.memberCount} members</span>
              <span>•</span>
              <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded text-xs">
                {community.category}
              </span>
            </div>
          </div>
        </div>

        {community.rules && (
          <div className="bg-gray-50 p-3 rounded-lg text-sm">
            <p className="font-semibold mb-1">Rules</p>
            <p className="text-gray-600">{community.rules}</p>
          </div>
        )}
      </div>

      {/* Post Form */}
      {isMember && (
        <div className="px-4">
          <PostForm onPostCreated={handlePostCreated} communityId={community._id} />
        </div>
      )}

      {/* Posts Feed */}
      <div className="px-4 space-y-4 pb-6">
        {loading ? (
          <div className="text-center py-12">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <p className="text-gray-600">
              {isMember ? 'No posts yet. Be the first!' : 'Join to see posts'}
            </p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard
              key={post._id}
              post={post}
              currentUser={user}
              onDelete={handlePostDeleted}
            />
          ))
        )}
      </div>
    </div>
  );
}