import { createContext, useContext, useEffect, useState, useRef } from 'react';
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
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Fetch initial unread message count
  useEffect(() => {
    if (user) {
      fetchUnreadMessageCount();
      fetchNotifications();
    }
  }, [user]);

  const fetchUnreadMessageCount = async () => {
    try {
      const { data } = await api.get('/messages/unread-count');
      setUnreadMessageCount(data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
      const unread = data.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Socket connection setup
  useEffect(() => {
    if (!user) {
      // Clean up socket if user logs out
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    const userId = user._id || user.id;
    
    if (!userId) {
      return;
    }

    // ✅ FIX: Get socket URL from env, fallback to current origin
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    
    // ✅ FIX: Better socket configuration
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      // ✅ Prevent connection before page is ready
      forceNew: false,
      // ✅ Add auth if needed
      auth: {
        userId: userId
      }
    });

    socketRef.current = newSocket;
    
    newSocket.on('connect', () => {
      console.log('✅ Socket connected');
      newSocket.emit('register', userId);
    });

    // ✅ FIX: Better error handling
    newSocket.on('connect_error', (error) => {
      console.warn('⚠️ Socket connection error:', error.message);
      // Don't show error toast, let it retry silently
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      
      // Only try to reconnect if it's not a manual disconnect
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, reconnect manually
        newSocket.connect();
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Attempting to reconnect...', attemptNumber);
    });

    newSocket.on('reconnect_error', (error) => {
      console.warn('⚠️ Reconnection error:', error.message);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Failed to reconnect after maximum attempts');
    });

    // Notification listener
    newSocket.on('notification', (notification) => {
      setNotifications(prev => {
        if (prev.some(n => n._id === notification._id)) {
          return prev;
        }
        return [notification, ...prev];
      });
      
      setUnreadCount(prev => prev + 1);
      
      // Browser notification
      if (Notification.permission === 'granted') {
        new Notification('HobbySphere', {
          body: getNotificationText(notification),
          icon: notification.from?.profileImage || '/favicon.svg'
        });
      }
    });

    // Message listener
    newSocket.on('newMessage', ({ conversationId, message }) => {
      setUnreadMessageCount(prev => prev + 1);
      
      // Browser notification
      if (Notification.permission === 'granted') {
        new Notification('New Message', {
          body: `${message.sender?.fullName || 'Someone'}: ${message.text || '📷 Image'}`,
          icon: message.sender?.profileImage || '/favicon.svg'
        });
      }
    });

    // Post update listeners
    newSocket.on('post_liked', ({ postId, userId, likesCount }) => {
      // Handled by PostCard components
    });

    newSocket.on('post_unliked', ({ postId, userId, likesCount }) => {
      // Handled by PostCard components
    });

    newSocket.on('post_commented', ({ postId, comment, commentsCount }) => {
      // Handled by PostCard components
    });

    setSocket(newSocket);

    // ✅ FIX: Proper cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (newSocket) {
        newSocket.removeAllListeners();
        newSocket.close();
      }
      
      socketRef.current = null;
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
      fetchNotifications
    }}>
      {children}
    </SocketContext.Provider>
  );
}