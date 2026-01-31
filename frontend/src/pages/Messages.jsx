import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import { useSocket } from '../context/SocketContext';
import { MessageCircle, X, ArrowLeft } from 'lucide-react';

export default function Messages() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const { fetchUnreadMessageCount } = useSocket();

  useEffect(() => {
    fetchConversations();

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

  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/messages/conversations');
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const openConversationWithUser = async (userId) => {
    try {
      const { data } = await api.get(`/messages/conversations/${userId}`);
      setSelectedConversation(data);

      setConversations(prev =>
        prev.some(c => c._id === data._id)
          ? prev
          : [data, ...prev]
      );
    } catch (error) {
      console.error('Error opening conversation:', error);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
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

    setConversations(prev =>
      prev
        .map(conv =>
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
        )
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    );
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      
      {/* Desktop Close Button */}
      <button
        onClick={() => navigate(-1)}
        className="hidden md:block absolute top-4 right-4 z-20 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-2 rounded-xl shadow-md dark:shadow-xl dark:shadow-black/20 transition-all border border-slate-200 dark:border-slate-800 hover:scale-105"
        title="Close messages"
      >
        <X size={20} />
      </button>

      {/* Mobile Back Button (when chat is open) */}
      {selectedConversation && (
        <button
          onClick={() => navigate(-1)}
          className="md:hidden fixed top-4 left-4 z-20 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 p-2 rounded-xl shadow-md dark:shadow-xl dark:shadow-black/20 border border-slate-200 dark:border-slate-800"
          title="Go back"
        >
          <ArrowLeft size={20} />
        </button>
      )}

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`
          w-full md:w-80 lg:w-96 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col
          ${selectedConversation ? 'hidden md:flex' : 'flex'}
        `}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">Messages</h1>
            <button
              onClick={() => navigate(-1)}
              className="md:hidden text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <MessageCircle size={32} className="sm:w-10 sm:h-10 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                No messages yet
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Start a conversation from a user's profile
              </p>
            </div>
          ) : (
            <ChatList
              conversations={conversations}
              selectedConversation={selectedConversation}
              onSelectConversation={handleSelectConversation}
            />
          )}
        </div>
      </aside>

      {/* ================= CHAT WINDOW ================= */}
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
                Select a conversation or start chatting from a user's profile
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}