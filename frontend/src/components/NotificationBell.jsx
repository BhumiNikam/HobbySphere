import { useState, useEffect, useRef } from 'react';
import { Bell, Heart, MessageCircle, UserPlus, X } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, setNotifications, unreadCount, setUnreadCount, fetchNotifications } = useSocket();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // ✅ FIXED: Sync with socket notifications
  useEffect(() => {
    console.log('🔔 NotificationBell synced with socket:', { 
      unreadCount, 
      notificationsLength: notifications.length 
    });
  }, [notifications, unreadCount]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await API.patch(`/notifications/${notificationId}/read`);
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
      
      // Decrement unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      console.log('✅ Marked notification as read:', notificationId);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.patch('/notifications/read-all');
      
      // Update all notifications to read
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      console.log('✅ Marked all notifications as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await API.delete(`/notifications/${notificationId}`);
      
      // Find if the deleted notification was unread
      const deletedNotif = notifications.find(n => n._id === notificationId);
      
      // Remove from state
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      
      // Decrement unread count if it was unread
      if (deletedNotif && !deletedNotif.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      console.log('🗑️ Deleted notification:', notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);
    setIsOpen(false);

    if (notification.type === 'follow') {
      navigate(`/profile/${notification.from.username}`);
    } else if (notification.type === 'message') {
      navigate('/messages');
    } else if (notification.post) {
      navigate('/'); // Navigate to feed to see the post
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'follow': return <UserPlus size={18} className="text-blue-500" />;
      case 'like': return <Heart size={18} className="text-red-500" />;
      case 'comment': return <MessageCircle size={18} className="text-green-500" />;
      case 'message': return <MessageCircle size={18} className="text-purple-500" />;
      default: return <Bell size={18} />;
    }
  };

  const getText = (notification) => {
    const name = notification.from?.fullName || 'Someone';
    switch (notification.type) {
      case 'follow': return `${name} started following you`;
      case 'like': return `${name} liked your post`;
      case 'comment': return `${name} commented on your post`;
      case 'message': return `${name} sent you a message`;
      default: return 'New notification';
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const posted = new Date(date);
    const diff = Math.floor((now - posted) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border z-50 max-h-[500px] overflow-hidden flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-bold text-lg">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No notifications yet</p>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition ${
                    !notif.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex gap-3 items-start">
                    <img
                      src={notif.from?.profileImage || `https://ui-avatars.com/api/?name=${notif.from?.username}&background=6366f1&color=fff`}
                      alt={notif.from?.username}
                      loading="lazy"
                      className="w-10 h-10 object-cover rounded-full flex-shrink-0"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        {getIcon(notif.type)}
                        <p className="text-sm flex-1">{getText(notif)}</p>
                        <button
                          onClick={(e) => deleteNotification(notif._id, e)}
                          className="text-gray-400 hover:text-red-500 flex-shrink-0"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <span className="text-xs text-gray-500 mt-1 block">
                        {formatDate(notif.createdAt)}
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