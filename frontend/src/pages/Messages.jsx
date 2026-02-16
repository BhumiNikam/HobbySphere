import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api, { clearCache } from '../services/api';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import { useSocket } from '../context/SocketContext';
import { MessageCircle, X, ArrowLeft } from 'lucide-react';
import { safeNavigateBack } from '../utils/navigation';

export default function Messages() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { socket, fetchUnreadMessageCount } = useSocket();
  
  const [conversations, setConversations] = useState([]);
  const [followingUsers, setFollowingUsers] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    fetchData();

    const userId = searchParams.get('userId');
    if (userId) {
      openConversationWithUser(userId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedConversation) {
      markConversationAsRead(selectedConversation._id);
    }
  }, [selectedConversation]);

  /* ================= REAL-TIME FOLLOW/UNFOLLOW UPDATES ================= */
  useEffect(() => {
    if (!socket || !currentUserId) return;

    const handleUserFollowed = ({ followedUserId, followerUserId }) => {
      // If current user followed someone, refresh the following list
      if (followerUserId === currentUserId) {
        fetchData();
      }
    };

    const handleUserUnfollowed = ({ unfollowedUserId, unfollowerUserId }) => {
      // If current user unfollowed someone, refresh the following list
      if (unfollowerUserId === currentUserId) {
        fetchData();
      }
    };

    socket.on('user_followed', handleUserFollowed);
    socket.on('user_unfollowed', handleUserUnfollowed);

    return () => {
      socket.off('user_followed', handleUserFollowed);
      socket.off('user_unfollowed', handleUserUnfollowed);
    };
  }, [socket, currentUserId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [conversationsRes, meRes] = await Promise.all([
        api.get('/messages/conversations'),
        api.get('/auth/me')
      ]);

      setConversations(conversationsRes.data);
      
      const userId = meRes.data.user._id || meRes.data.user.id;
      setCurrentUserId(userId);
      
      const following = meRes.data.user.following || [];
      const conversationUserIds = conversationsRes.data.map(conv => 
        conv.participants.find(p => p._id !== userId)?._id
      ).filter(Boolean);
      
      const followingWithoutConversations = following.filter(
        user => !conversationUserIds.includes(user._id)
      );
      
      setFollowingUsers(followingWithoutConversations);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openConversationWithUser = async (userId) => {
    try {
      const { data } = await api.get(`/messages/conversations/${userId}`);
      setSelectedConversation(data);

      setConversations(prev => {
        const exists = prev.some(c => c._id === data._id);
        return exists ? prev : [data, ...prev];
      });
      
      setFollowingUsers(prev => 
        prev.filter(user => user._id !== userId)
      );
      
      clearCache('/messages/conversations');
    } catch (error) {
      console.error('Error opening conversation:', error);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
  };

  const handleSelectFollowingUser = async (user) => {
    await openConversationWithUser(user._id);
  };

  const markConversationAsRead = async (conversationId) => {
    try {
      await api.put(`/messages/conversations/${conversationId}/read`);
      fetchUnreadMessageCount();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleNewMessage = (conversationId, message) => {
    const messageText = message.text || message.content || '';

    setConversations(prev => {
      const updatedConversations = prev.map(conv =>
        conv._id === conversationId
          ? {
              ...conv,
              lastMessage: {
                text: messageText,
                sender: message.sender,
                createdAt: message.createdAt,
              },
              updatedAt: new Date(),
            }
          : conv
      );
      
      return updatedConversations.sort((a, b) => 
        new Date(b.updatedAt) - new Date(a.updatedAt)
      );
    });
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const totalItems = conversations.length + followingUsers.length;

  return (
    <div className="h-screen w-screen flex bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      
      <button
        onClick={() => safeNavigateBack(navigate)}
        className="hidden md:block absolute top-4 right-4 z-20 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-2 rounded-xl shadow-md dark:shadow-xl dark:shadow-black/20 transition-all border border-slate-200 dark:border-slate-800 hover:scale-105"
        title="Close messages"
      >
        <X size={20} />
      </button>

      {selectedConversation && (
        <button
          onClick={() => safeNavigateBack(navigate)}
          className="md:hidden fixed top-4 left-4 z-20 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 p-2 rounded-xl shadow-md dark:shadow-xl dark:shadow-black/20 border border-slate-200 dark:border-slate-800"
          title="Go back"
        >
          <ArrowLeft size={20} />
        </button>
      )}

      <aside
        className={`
          w-full md:w-80 lg:w-96 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col
          ${selectedConversation ? 'hidden md:flex' : 'flex'}
        `}
      >
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">Messages</h1>
            <button
              onClick={() => safeNavigateBack(navigate)}
              className="md:hidden text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {conversations.length > 0 && (
              <span>{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</span>
            )}
            {conversations.length > 0 && followingUsers.length > 0 && <span> • </span>}
            {followingUsers.length > 0 && (
              <span>{followingUsers.length} following</span>
            )}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {totalItems === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <MessageCircle size={32} className="sm:w-10 sm:h-10 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                No messages yet
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Follow people to start conversations
              </p>
            </div>
          ) : (
            <div>
              {conversations.length > 0 && (
                <ChatList
                  conversations={conversations}
                  selectedConversation={selectedConversation}
                  onSelectConversation={handleSelectConversation}
                />
              )}

              {followingUsers.length > 0 && (
                <div>
                  <div className="px-4 py-3 bg-slate-100 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <span>Following</span>
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                        {followingUsers.length}
                      </span>
                    </p>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {followingUsers.map((user) => (
                      <button
                        key={user._id}
                        onClick={() => handleSelectFollowingUser(user)}
                        className="w-full px-4 py-4 flex items-start gap-3 text-left transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900"
                      >
                        <img
                          src={
                            user.profileImage ||
                            `https://ui-avatars.com/api/?name=${user.fullName}&background=6366f1&color=fff`
                          }
                          alt={user.fullName}
                          className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                            {user.fullName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            @{user.username}
                          </p>
                          {user.bio && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                              {user.bio}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      <section
        className={`
          flex-1 flex flex-col bg-white dark:bg-slate-900
          ${!selectedConversation ? 'hidden md:flex' : 'flex'}
        `}
      >
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            onNewMessage={handleNewMessage}
            onBack={() => setSelectedConversation(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/40 dark:from-slate-950 dark:to-indigo-950/20">
            <div className="text-center px-6 w-full animate-fade-in">
              <div className="mb-6 inline-flex p-4 sm:p-5 rounded-full bg-indigo-100 dark:bg-indigo-950/50">
                <MessageCircle size={36} className="sm:w-[42px] sm:h-[42px] text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">
                Your messages
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-sm mx-auto">
                Select a conversation to start chatting
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}