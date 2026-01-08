import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

export default function ChatWindow({ conversation, onNewMessage, onBack }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const userId = user._id || user.id;
  const otherUser = conversation.participants.find(p => p._id !== userId);

  // Fetch messages when conversation changes
  useEffect(() => {
    fetchMessages();
    markAsRead();
  }, [conversation._id]);

  // Setup socket listener
  useEffect(() => {
    if (!socket) {
      console.log('Socket not connected yet');
      return;
    }

    const handleIncomingMessage = ({ conversationId, message }) => {
      console.log('Incoming message:', { conversationId, message });
      if (conversationId === conversation._id) {
        setMessages(prev => [...prev, message]);
        markAsRead();
      }
    };

    socket.on('newMessage', handleIncomingMessage);
    console.log('Socket listener registered for conversation:', conversation._id);

    return () => {
      socket.off('newMessage', handleIncomingMessage);
      console.log('Socket listener removed');
    };
  }, [socket, conversation._id]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/messages/conversations/${conversation._id}/messages`);
      console.log('Fetched messages:', data);
      setMessages(data.messages || data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      alert('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await api.put(`/messages/conversations/${conversation._id}/read`);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !imagePreview) || sending) return;

    setSending(true);
    try {
      const payload = {};
      if (newMessage.trim()) payload.text = newMessage.trim();
      if (imagePreview) payload.image = imagePreview;

      console.log('Sending message:', payload);
      const { data } = await api.post(`/messages/conversations/${conversation._id}/messages`, payload);
      
      console.log('Message sent:', data);
      setMessages(prev => [...prev, data]);
      onNewMessage(conversation._id, data);
      setNewMessage('');
      setImagePreview(null);
    } catch (error) {
      console.error('Error sending message:', error);
      alert(error.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-screen">
      {/* Header */}
      <div className="p-4 border-b bg-white flex items-center gap-3">
        <button onClick={onBack} className="md:hidden">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <img
          src={otherUser.profileImage || `https://ui-avatars.com/api/?name=${otherUser.fullName}&background=random`}
          alt={otherUser.fullName}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <h2 className="font-semibold">{otherUser.fullName}</h2>
          <p className="text-sm text-gray-500">@{otherUser.username}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender._id === userId || message.sender === userId;
            // ✅ ADD THIS DEBUG LINE
            console.log('Message object:', message);
            console.log('Message type:', message.messageType);
            console.log('Message text:', message.text);
            console.log('Message content:', message.content);
            // ✅ FIXED: Get message text from either 'text' or 'content' property
            const messageText = message.text || message.content;
            const isStoryReaction = message.messageType === 'story_reaction';
            
            return (
              <div key={message._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Message attachment"
                      className="rounded-lg mb-1 max-w-full cursor-pointer hover:opacity-90"
                      onClick={() => window.open(message.image, '_blank')}
                    />
                  )}
                  {messageText && (
                    <div className={`px-4 py-2 rounded-2xl ${
                      isStoryReaction 
                        ? 'bg-purple-100 text-purple-900 border border-purple-300' 
                        : isOwn 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white text-gray-900'
                    }`}>
                      <p className="break-words">{messageText}</p>
                    </div>
                  )}
                  <p className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="p-4 bg-white border-t">
          <div className="relative inline-block">
            <img src={imagePreview} alt="Preview" className="h-20 rounded" />
            <button
              onClick={() => setImagePreview(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={(!newMessage.trim() && !imagePreview) || sending}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}