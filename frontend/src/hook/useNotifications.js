import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket } from './useSocket';
import { notificationApi } from '../api/notificationApi';

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  const { data: notificationsData, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getNotifications(),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000 // Consider data stale after 10 seconds
  });

  const notifications = notificationsData?.data?.notifications || [];

  // Update unread count
  useEffect(() => {
    if (notifications) {
      const count = notifications.filter(n => !n.read).length;
      setUnreadCount(count);
    }
  }, [notifications]);

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (data) => {
      
      // Invalidate notifications query to refetch
      queryClient.invalidateQueries(['notifications']);
      
      // Show browser notification if permission is granted
      if (Notification.permission === 'granted') {
        new Notification(data.title || 'New Notification', {
          body: data.message,
          icon: '/favicon.png',
          tag: data._id
        });
      }
    };

    const handleNotificationRead = (data) => {
      queryClient.invalidateQueries(['notifications']);
    };

    const handleNotificationDeleted = (data) => {
      queryClient.invalidateQueries(['notifications']);
    };

    // Join user's notification room
    socket.emit('join_notifications');

    // Listen for notification events
    socket.on('notification_received', handleNewNotification);
    socket.on('notification_read', handleNotificationRead);
    socket.on('notification_deleted', handleNotificationDeleted);

    return () => {
      socket.off('notification_received', handleNewNotification);
      socket.off('notification_read', handleNotificationRead);
      socket.off('notification_deleted', handleNotificationDeleted);
      socket.emit('leave_notifications');
    };
  }, [socket, queryClient]);

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationApi.markNotificationAsRead(notificationId);
      queryClient.invalidateQueries(['notifications']);
    } catch (error) {
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllNotificationsAsRead();
      queryClient.invalidateQueries(['notifications']);
    } catch (error) {
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await notificationApi.deleteNotification(notificationId);
      queryClient.invalidateQueries(['notifications']);
    } catch (error) {
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    requestNotificationPermission
  };
};