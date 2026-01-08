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

  useEffect(() => {
    if (user) {
      fetchUnreadMessageCount();
    }
  }, [user]);

  const fetchUnreadMessageCount = async () => {
    try {
      const { data } = await api.get('/messages/unread-count');
      setUnreadMessageCount(data.unreadCount);
      console.log('📬 Fetched unread message count:', data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    console.log('🔍 User object from AuthContext:', user);
    
    if (!user) {
      console.log('No user, skipping socket connection');
      return;
    }

    const userId = user._id || user.id;
    console.log('🆔 Extracted userId:', userId);
    
    if (!userId) {
      console.error('❌ User object has no ID:', user);
      return;
    }

    console.log('Initializing socket connection for user:', userId);
    
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      newSocket.emit('register', userId);
      console.log('📝 Registered user:', userId);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    newSocket.on('notification', (notification) => {
      console.log('🔔 New notification received:', notification);
      
      // ✅ Create NEW array to force re-render
      setNotifications(prev => {
        const newNotifs = [notification, ...prev];
        console.log('📬 Updated notifications array length:', newNotifs.length);
        return newNotifs;
      });
      
      setUnreadCount(prev => {
        const newCount = prev + 1;
        console.log('🔢 Updated unread count:', newCount);
        return newCount;
      });
      
      // Increment message count for message notifications
      if (notification.type === 'message') {
        console.log('💬 Message notification received, incrementing count');
        setUnreadMessageCount(prev => prev + 1);
      }
      
      if (Notification.permission === 'granted') {
        new Notification('HobbySphere', {
          body: getNotificationText(notification),
          icon: '/vite.svg'
        });
      }
    });

    newSocket.on('newMessage', ({ conversationId, message }) => {
      console.log('💬 New message received:', { conversationId, message });
      
      setUnreadMessageCount(prev => {
        const newCount = prev + 1;
        console.log('📬 New unread message count from socket:', newCount);
        return newCount;
      });
      
      if (Notification.permission === 'granted') {
        new Notification('New Message', {
          body: `${message.sender?.fullName || 'Someone'}: ${message.text || '📷 Image'}`,
          icon: message.sender?.profileImage || '/vite.svg'
        });
      }
    });

    setSocket(newSocket);

    return () => {
      console.log('🧹 Cleaning up socket connection');
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
      fetchUnreadMessageCount
    }}>
      {children}
    </SocketContext.Provider>
  );
}
