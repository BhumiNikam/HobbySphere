import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  X,
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const {
    notifications,
    setNotifications,
    unreadCount,
    setUnreadCount,
  } = useSocket();

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  /* ================= PERMISSION ================= */
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  /* ================= OUTSIDE CLICK ================= */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ================= ACTIONS ================= */
  const markAsRead = useCallback(async (id) => {
    try {
      await API.patch(`/notifications/${id}/read`);

      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id ? { ...n, read: true } : n
        )
      );

      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      console.error('Mark as read failed');
    }
  }, [setNotifications, setUnreadCount]);

  const markAllAsRead = async () => {
    try {
      await API.patch('/notifications/read-all');

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch {
      console.error('Mark all failed');
    }
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    if (busyId === id) return;

    try {
      setBusyId(id);

      const deleted = notifications.find((n) => n._id === id);

      await API.delete(`/notifications/${id}`);
      setNotifications((prev) =>
        prev.filter((n) => n._id !== id)
      );

      if (deleted && !deleted.read) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch {
      console.error('Delete failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.read) markAsRead(notif._id);
    setIsOpen(false);

    if (notif.type === 'follow') {
      navigate(`/profile/${notif.from.username}`);
    } else if (notif.type === 'message') {
      navigate('/messages');
    } else if (notif.post) {
      navigate('/');
    }
  };

  /* ================= HELPERS ================= */
  const getIcon = (type) => {
    switch (type) {
      case 'follow':
        return <UserPlus size={18} className="text-blue-500" />;
      case 'like':
        return <Heart size={18} className="text-red-500" />;
      case 'comment':
        return <MessageCircle size={18} className="text-green-500" />;
      case 'message':
        return <MessageCircle size={18} className="text-purple-500" />;
      default:
        return <Bell size={18} />;
    }
  };

  const getText = (n) => {
    const name = n.from?.fullName || 'Someone';
    switch (n.type) {
      case 'follow':
        return `${name} started following you`;
      case 'like':
        return `${name} liked your post`;
      case 'comment':
        return `${name} commented on your post`;
      case 'message':
        return `${name} sent you a message`;
      default:
        return 'New notification';
    }
  };

  const formatDate = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  /* ================= UI ================= */
  return (
    <div className="relative" ref={dropdownRef}>
      {/* BELL */}
      <button
        onClick={() => setIsOpen((p) => !p)}
        className="relative p-2 rounded-full hover:bg-slate-100 transition"
        aria-label="Notifications"
      >
        <Bell size={22} />

        {unreadCount > 0 && (
          <span
            className="
              absolute -top-1 -right-1
              h-5 w-5 text-[10px]
              rounded-full
              bg-gradient-to-r from-red-500 to-pink-500
              text-white font-bold
              flex items-center justify-center
              shadow-md
              animate-bounce-slow
            "
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN */}
      {isOpen && (
        <div
          className="
            absolute right-0 mt-2
            w-96 max-h-[520px]
            bg-white rounded-2xl
            shadow-xl border
            overflow-hidden
            z-50
            animate-scale-in
          "
        >
          {/* HEADER */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-bold text-lg">Notifications</h3>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-indigo-600 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* LIST */}
          <div className="overflow-y-auto max-h-[460px]">
            {notifications.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <div className="text-3xl mb-3">🔔</div>
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`
                    px-4 py-3 cursor-pointer
                    border-b last:border-b-0
                    hover:bg-slate-50
                    transition
                    ${!n.read ? 'bg-indigo-50/60' : ''}
                  `}
                >
                  <div className="flex gap-3">
                    <img
                      src={
                        n.from?.profileImage ||
                        `https://ui-avatars.com/api/?name=${n.from?.username}`
                      }
                      alt={n.from?.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex gap-2 items-start">
                        {getIcon(n.type)}
                        <p className="text-sm flex-1 leading-snug">
                          {getText(n)}
                        </p>

                        <button
                          disabled={busyId === n._id}
                          onClick={(e) =>
                            deleteNotification(n._id, e)
                          }
                          className="
                            text-slate-400
                            hover:text-red-500
                            disabled:opacity-40
                            transition
                          "
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <span className="text-xs text-slate-400 mt-1 block">
                        {formatDate(n.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
