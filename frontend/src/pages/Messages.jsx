import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import { useSocket } from '../context/SocketContext';

export default function Messages() {
  const [searchParams] = useSearchParams();
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
      
      if (!conversations.find(c => c._id === data._id)) {
        setConversations(prev => [data, ...prev]);
      }
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
      console.log('✅ Marked conversation as read, refreshed count');
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // ✅ FIXED: Handle both 'text' and 'content' properties
  const handleNewMessage = (conversationId, message) => {
    // Get the message text from either property
    const messageText = message.text || message.content || '';
    
    console.log('📨 New message received:', { conversationId, message, messageText });
    
    setConversations(prev => 
      prev.map(conv => 
        conv._id === conversationId 
          ? { 
              ...conv, 
              lastMessage: { 
                text: messageText,  // ← Use the extracted text
                sender: message.sender, 
                createdAt: message.createdAt 
              }, 
              updatedAt: new Date() 
            }
          : conv
      ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      <div className={`w-full md:w-96 border-r bg-white ${selectedConversation ? 'hidden md:block' : 'block'}`}>
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold">Messages</h1>
        </div>
        <ChatList 
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={handleSelectConversation}
        />
      </div>

      <div className={`flex-1 ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        {selectedConversation ? (
          <ChatWindow 
            conversation={selectedConversation}
            onNewMessage={handleNewMessage}
            onBack={() => setSelectedConversation(null)}
          />
        ) : (
          <div className="flex items-center justify-center w-full">
            <div className="text-center">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Select a conversation</h3>
              <p className="mt-2 text-sm text-gray-500">Choose from your existing conversations or start a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}