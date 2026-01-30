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
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="spinner" />
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="flex flex-col h-full bg-white">

      {/* HEADER */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b px-4 py-3 flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="md:hidden text-slate-600">
            <ArrowLeft size={20} />
          </button>

          <img
            src={otherUser.profileImage}
            className="w-10 h-10 rounded-full object-cover"
          />

          <div className="min-w-0">
            <p className="font-semibold truncate">{otherUser.fullName}</p>
            <p className="text-xs text-slate-500">@{otherUser.username}</p>
          </div>
        </div>
        <button onClick={onBack} className="text-slate-400 hover:text-slate-700 p-1 rounded-full transition ml-2">
          <X size={22} />
        </button>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-gradient-to-b from-slate-50 to-white">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm">
            Start the conversation 👋
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn =
              msg.sender === userId || msg.sender?._id === userId;

            return (
              <div
                key={msg._id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[75%] space-y-1">
                  {msg.image && (
                    <img
                      src={msg.image}
                      className="rounded-2xl shadow-md max-w-full cursor-pointer hover:scale-[1.02] transition"
                      onClick={() => window.open(msg.image, '_blank')}
                    />
                  )}

                  {msg.text && (
                    <div
                      className={`
                        px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                        ${isOwn
                          ? 'bg-indigo-600 text-white rounded-br-md'
                          : 'bg-white border rounded-bl-md'}
                      `}
                    >
                      {msg.text}
                    </div>
                  )}

                  <p
                    className={`text-xs text-slate-400 ${
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
        <div className="border-t p-3 bg-slate-50">
          <div className="relative inline-block">
            <img src={imagePreview} className="h-24 rounded-xl shadow-md" />
            <button
              onClick={() => setImagePreview(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* INPUT */}
      <form
        onSubmit={handleSendMessage}
        className="border-t px-4 py-3 bg-white flex items-center gap-2"
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
          className="text-slate-600 hover:text-indigo-600 transition"
        >
          <ImageIcon size={22} />
        </button>

        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Message…"
          className="flex-1 px-4 py-2 rounded-full bg-slate-100 outline-none focus:ring-2 focus:ring-indigo-200"
        />

        <button
          disabled={sending}
          className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
