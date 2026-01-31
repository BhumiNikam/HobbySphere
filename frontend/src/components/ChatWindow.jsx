import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { ArrowLeft, Send, Image as ImageIcon, X } from 'lucide-react';
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

  /* ================= FETCH + SOCKET ================= */
  useEffect(() => {
    fetchMessages();
    markAsRead();
  }, [conversation._id]);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingMessage = ({ conversationId, message }) => {
      if (conversationId === conversation._id) {
        setMessages(prev => [...prev, message]);
        markAsRead();
      }
    };

    socket.on('newMessage', handleIncomingMessage);
    return () => socket.off('newMessage', handleIncomingMessage);
  }, [socket, conversation._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ================= API ================= */
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(
        `/messages/conversations/${conversation._id}/messages`
      );
      setMessages(data.messages || data);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await api.put(`/messages/conversations/${conversation._id}/read`);
    } catch {}
  };

  /* ================= IMAGE ================= */
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  /* ================= SEND ================= */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !imagePreview) || sending) return;

    setSending(true);
    try {
      const payload = {};
      if (newMessage.trim()) payload.text = newMessage.trim();
      if (imagePreview) payload.image = imagePreview;

      const { data } = await api.post(
        `/messages/conversations/${conversation._id}/messages`,
        payload
      );

      setMessages(prev => [...prev, data]);
      onNewMessage(conversation._id, data);
      setNewMessage('');
      setImagePreview(null);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="spinner" />
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">

      {/* HEADER */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-3 justify-between shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <button 
            onClick={onBack} 
            className="md:hidden text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
          >
            <ArrowLeft size={20} />
          </button>

          <img
            src={otherUser.profileImage}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-900 shadow-sm flex-shrink-0"
            alt={otherUser.fullName}
          />

          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm sm:text-base truncate text-slate-900 dark:text-slate-100">
              {otherUser.fullName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              @{otherUser.username}
            </p>
          </div>
        </div>

        <button 
          onClick={onBack} 
          className="hidden md:block text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <X size={20} />
        </button>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4 bg-slate-50 dark:bg-slate-950 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            Start the conversation 👋
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender === userId || msg.sender?._id === userId;

            return (
              <div
                key={msg._id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[85%] sm:max-w-[75%] space-y-1">
                  {msg.image && (
                    <img
                      src={msg.image}
                      className="rounded-2xl shadow-md max-w-full cursor-pointer hover:scale-[1.02] transition-transform border border-slate-200 dark:border-slate-800"
                      onClick={() => window.open(msg.image, '_blank')}
                      alt="Message attachment"
                    />
                  )}

                  {msg.text && (
                    <div
                      className={`
                        px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed break-words
                        ${isOwn
                          ? 'bg-indigo-600 dark:bg-indigo-500 text-white rounded-br-md shadow-sm'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-md shadow-sm'
                        }
                      `}
                    >
                      {msg.text}
                    </div>
                  )}

                  <p
                    className={`text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 ${
                      isOwn ? 'text-right' : ''
                    }`}
                  >
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* IMAGE PREVIEW */}
      {imagePreview && (
        <div className="border-t border-slate-200 dark:border-slate-800 p-2 sm:p-3 bg-slate-50 dark:bg-slate-950">
          <div className="relative inline-block">
            <img 
              src={imagePreview} 
              className="h-20 sm:h-24 rounded-xl shadow-md border border-slate-200 dark:border-slate-700" 
              alt="Preview"
            />
            <button
              onClick={() => setImagePreview(null)}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1 sm:p-1.5 rounded-full shadow-lg transition-all hover:scale-110"
            >
              <X size={12} className="sm:w-[14px] sm:h-[14px]" />
            </button>
          </div>
        </div>
      )}

      {/* INPUT */}
      <form
        onSubmit={handleSendMessage}
        className="border-t border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-3 bg-white dark:bg-slate-900 flex items-center gap-2"
      >
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept="image/*"
          onChange={handleImageSelect}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all tap-target flex-shrink-0"
          title="Attach image"
        >
          <ImageIcon size={20} className="sm:w-[22px] sm:h-[22px]" />
        </button>

        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Message…"
          className="flex-1 px-3 sm:px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 transition-all text-sm sm:text-base"
        />

        <button
          disabled={sending || (!newMessage.trim() && !imagePreview)}
          className="bg-indigo-600 dark:bg-indigo-500 text-white p-2 rounded-full hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:scale-105 active:scale-95 tap-target flex-shrink-0"
          title="Send message"
        >
          <Send size={18} className="sm:w-5 sm:h-5" />
        </button>
      </form>
    </div>
  );
}