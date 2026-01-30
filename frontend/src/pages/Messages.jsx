import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import { useSocket } from '../context/SocketContext';
import { MessageCircle, X } from 'lucide-react';

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
      <div className="h-screen w-screen flex items-center justify-center bg-slate-100">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] w-screen flex bg-slate-100 overflow-hidden shadow-sm relative">
      {/* Close Icon for overall messages */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 right-4 z-20 bg-white text-slate-400 hover:text-slate-700 p-2 rounded-full shadow transition"
        title="Close messages"
      >
        <X size={24} />
      </button>
      {/* ================= SIDEBAR ================= */}
      <aside
        className={`w-full md:w-[360px] bg-white border-r border-slate-200 flex flex-col transition-all ${
          selectedConversation ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200">
          <h1 className="text-xl font-semibold">Messages</h1>
          <p className="text-sm text-slate-500 mt-1">
            {conversations.length} conversation
            {conversations.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <ChatList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={handleSelectConversation}
          />
        </div>
      </aside>

      {/* ================= CHAT WINDOW ================= */}
      <section
        className={`flex-1 flex flex-col bg-white transition-all ${
          !selectedConversation ? 'hidden md:flex' : 'flex'
        }`}
      >
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            onNewMessage={handleNewMessage}
            onBack={() => setSelectedConversation(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/40">
            <div className="text-center px-6 w-full animate-fade-in">
              <div className="mb-6 inline-flex p-5 rounded-full bg-indigo-100">
                <MessageCircle size={42} className="text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Your messages
              </h3>
              <p className="text-slate-500 text-sm">
                Select a conversation or start chatting from a user’s profile
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
