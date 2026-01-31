import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const { user } = useAuth();

  // Fetch initial unread message count
  useEffect(() => {
    if (user) {
      fetchUnreadMessageCount();
      fetchNotifications(); // ✅ Also fetch initial notifications
    }
  }, [user]);

  const fetchUnreadMessageCount = async () => {
    try {
      const { data } = await api.get('/messages/unread-count');
      setUnreadMessageCount(data.unreadCount);
    } catch (error) {
      // Error fetching unread count
    }
  };

  // ✅ NEW: Fetch initial notifications
  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
      const unread = data.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      // Error fetching notifications
    }
  };

  // Socket connection setup
  useEffect(() => {
    if (!user) {
      return;
    }

    const userId = user._id || user.id;
    
    if (!userId) {
      return;
    }
    
    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    newSocket.on('connect', () => {
      newSocket.emit('register', userId);
    });

    newSocket.on('connect_error', (error) => {
      // Socket connection error
    });

    newSocket.on('disconnect', (reason) => {
      // Socket disconnected
    });

    // ✅ FIXED: Notification listener
    newSocket.on('notification', (notification) => {
      // Add to notifications array
      setNotifications(prev => {
        // Check if notification already exists
        if (prev.some(n => n._id === notification._id)) {
          return prev;
        }
        const newNotifs = [notification, ...prev];
        return newNotifs;
      });
      
      // Increment unread count
      setUnreadCount(prev => {
        const newCount = prev + 1;
        return newCount;
      });
      
      // Browser notification
      if (Notification.permission === 'granted') {
        new Notification('HobbySphere', {
          body: getNotificationText(notification),
          icon: notification.from?.profileImage || '/vite.svg'
        });
      }
    });

    // ✅ FIXED: Message listener
    newSocket.on('newMessage', ({ conversationId, message }) => {
      // Increment unread message count
      setUnreadMessageCount(prev => {
        const newCount = prev + 1;
        return newCount;
      });
      
      // Browser notification
      if (Notification.permission === 'granted') {
        new Notification('New Message', {
          body: `${message.sender?.fullName || 'Someone'}: ${message.text || '📷 Image'}`,
          icon: message.sender?.profileImage || '/vite.svg'
        });
      }
    });

    // Post update listeners (for real-time likes/comments)
    newSocket.on('post_liked', ({ postId, userId, likesCount }) => {
      // This will be caught by PostCard components
    });

    newSocket.on('post_unliked', ({ postId, userId, likesCount }) => {
      // This will be caught by PostCard components
    });

    newSocket.on('post_commented', ({ postId, comment, commentsCount }) => {
      // This will be caught by PostCard components
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
      setSocket(null);
    };
  }, [user]);

  const getNotificationText = (notif) => {
    switch (notif.type) {
      case 'follow':
        return `${notif.from?.fullName || 'Someone'} started following you`;
      case 'like':
        return `${notif.from?.fullName || 'Someone'} liked your post`;
      case 'comment':
        return `${notif.from?.fullName || 'Someone'} commented on your post`;
      case 'message':
        return `${notif.from?.fullName || 'Someone'} sent you a message`;
      default:
        return 'New notification';
    }
  };

  return (
    <SocketContext.Provider value={{ 
      socket, 
      notifications, 
      setNotifications, 
      unreadCount, 
      setUnreadCount,
      unreadMessageCount,
      setUnreadMessageCount,
      fetchUnreadMessageCount,
      fetchNotifications // ✅ Export this for manual refresh
    }}>
      {children}
    </SocketContext.Provider>
  );
}