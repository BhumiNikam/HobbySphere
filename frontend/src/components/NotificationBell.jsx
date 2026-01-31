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

  /* ================= LOCK SCROLL ON MOBILE ================= */
  useEffect(() => {
    if (isOpen && window.innerWidth < 640) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

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
        return <UserPlus size={18} className="text-blue-500 flex-shrink-0" />;
      case 'like':
        return <Heart size={18} className="text-red-500 flex-shrink-0" />;
      case 'comment':
        return <MessageCircle size={18} className="text-green-500 flex-shrink-0" />;
      case 'message':
        return <MessageCircle size={18} className="text-purple-500 flex-shrink-0" />;
      default:
        return <Bell size={18} className="flex-shrink-0" />;
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
        className="
          relative p-2 rounded-xl 
          text-slate-700 dark:text-slate-300
          hover:bg-slate-100 dark:hover:bg-slate-800 
          transition-colors
        "
        aria-label="Notifications"
      >
        <Bell size={20} />

        {unreadCount > 0 && (
          <span
            className="
              absolute -top-1 -right-1
              h-4 w-4 sm:h-5 sm:w-5 text-[10px]
              rounded-full
              bg-gradient-to-r from-red-500 to-pink-500
              text-white font-bold
              flex items-center justify-center
              shadow-md
            "
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* NOTIFICATION PANEL */}
      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm z-[9998] sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Notification panel */}
          <div
            className="
              fixed sm:absolute
              left-0 right-0 top-[64px] sm:left-auto sm:right-0 sm:top-full sm:mt-2
              w-full sm:w-96
              bg-white dark:bg-slate-900
              rounded-b-3xl sm:rounded-2xl
              shadow-2xl 
              border sm:border 
              border-slate-200 dark:border-slate-700
              overflow-hidden
              z-[9999]
            "
            style={{
              maxHeight: window.innerWidth < 640 ? 'calc(100vh - 64px)' : '85vh',
            }}
          >
            {/* HEADER */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                Notifications
              </h3>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold transition-colors"
                  >
                    Mark all read
                  </button>
                )}

                <button
                  onClick={() => setIsOpen(false)}
                  className="sm:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={18} className="text-slate-600 dark:text-slate-400" />
                </button>
              </div>
            </div>

            {/* LIST */}
            <div 
              className="overflow-y-auto"
              style={{
                maxHeight: window.innerWidth < 640 ? 'calc(100vh - 132px)' : '460px',
              }}
            >
              {notifications.length === 0 ? (
                <div className="py-20 text-center text-slate-500 dark:text-slate-400">
                  <div className="text-5xl mb-3">🔔</div>
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => handleNotificationClick(n)}
                    className={`
                      px-5 py-3.5 cursor-pointer
                      border-b border-slate-100 dark:border-slate-800 last:border-b-0
                      hover:bg-slate-50 dark:hover:bg-slate-800/50
                      active:bg-slate-100 dark:active:bg-slate-800
                      transition-colors
                      ${!n.read ? 'bg-indigo-50/60 dark:bg-indigo-950/30' : ''}
                    `}
                  >
                    <div className="flex gap-3">
                      {/* Avatar */}
                      <img
                        src={
                          n.from?.profileImage ||
                          `https://ui-avatars.com/api/?name=${n.from?.username}&background=6366f1&color=fff`
                        }
                        alt={n.from?.username}
                        className="w-11 h-11 rounded-full object-cover flex-shrink-0 ring-2 ring-white dark:ring-slate-900"
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex gap-2 items-start mb-1">
                          {getIcon(n.type)}
                          <p className="text-sm flex-1 leading-snug text-slate-700 dark:text-slate-300">
                            {getText(n)}
                          </p>

                          {/* Delete button */}
                          <button
                            disabled={busyId === n._id}
                            onClick={(e) =>
                              deleteNotification(n._id, e)
                            }
                            className="
                              p-1 rounded-lg
                              text-slate-400 dark:text-slate-500
                              hover:text-red-500 dark:hover:text-red-400
                              hover:bg-red-50 dark:hover:bg-red-900/20
                              disabled:opacity-40
                              transition-all
                              flex-shrink-0
                            "
                          >
                            <X size={16} />
                          </button>
                        </div>

                        <span className="text-xs text-slate-500 dark:text-slate-400 block">
                          {formatDate(n.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}