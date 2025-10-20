import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useSocket } from './useSocket';
import {
  // API functions
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications,
  getNotificationSettings,
  updateNotificationSettings
} from '../api/notificationApi';
import {
  // Redux actions
  addNotification,
  removeNotification,
  markOneAsRead,
  markAllAsRead as markAllAsReadAction,
  setUnreadCount,
  clearNotificationErrors,
  resetNotificationState,
  // Redux selectors
  selectNotifications,
  selectUnreadCount,
  selectNotificationLoading,
  selectNotificationErrors,
  selectNotificationPagination
} from '../store/slice/notificationSlice';

/**
 * Consolidated Notification Hook - All notification-related functionality in one place
 * Combines: useNotifications
 */
export const useNotification = (params = {}) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.auth);
  const { socket } = useSocket();

  // Redux state selectors
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  const loading = useSelector(selectNotificationLoading);
  const errors = useSelector(selectNotificationErrors);
  const pagination = useSelector(selectNotificationPagination);

  // Local state
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission || 'default');

  // Fetch notifications with React Query
  const { data: notificationsData, isLoading: isLoadingNotifications, error: notificationsError, refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications', params],
    queryFn: () => getNotifications(params),
    enabled: !!user,
    staleTime: 10000,
    refetchInterval: 30000,
  });

  const { data: settingsData, isLoading: isLoadingSettings, error: settingsError } = useQuery({
    queryKey: ['notificationSettings'],
    queryFn: () => getNotificationSettings(),
    enabled: !!user,
    staleTime: 300000, // 5 minutes
  });

  // Mutations
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => markAsRead(notificationId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['notifications']);
      dispatch(markOneAsRead(variables));
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to mark notification as read');
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      dispatch(markAllAsReadAction());
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to mark all notifications as read');
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId) => deleteNotification(notificationId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['notifications']);
      dispatch(removeNotification(variables));
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete notification');
    },
  });

  const clearAllNotificationsMutation = useMutation({
    mutationFn: () => clearNotifications(),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      dispatch(resetNotificationState());
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to clear all notifications');
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (settings) => updateNotificationSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries(['notificationSettings']);
      toast.success('Notification settings updated successfully');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update notification settings');
    },
  });

  // Notification management functions
  const handleMarkAsRead = useCallback((notificationId) => {
    markAsReadMutation.mutate(notificationId);
  }, [markAsReadMutation]);

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  const handleDeleteNotification = useCallback((notificationId) => {
    deleteNotificationMutation.mutate(notificationId);
  }, [deleteNotificationMutation]);

  const handleClearAllNotifications = useCallback(() => {
    clearAllNotificationsMutation.mutate();
  }, [clearAllNotificationsMutation]);

  const handleUpdateSettings = useCallback((settings) => {
    updateSettingsMutation.mutate(settings);
  }, [updateSettingsMutation]);

  // Browser notification functions
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        
        if (permission === 'granted') {
          toast.success('Notification permission granted');
          return true;
        } else {
          toast.error('Notification permission denied');
          return false;
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        toast.error('Failed to request notification permission');
        return false;
      }
    }
    return false;
  }, []);

  const showBrowserNotification = useCallback((notification) => {
    if (notificationPermission === 'granted' && 'Notification' in window) {
      try {
        const browserNotification = new Notification(notification.title || 'New Notification', {
          body: notification.message,
          icon: '/favicon.png',
          tag: notification._id,
          requireInteraction: notification.priority === 'high',
          silent: notification.silent || false,
        });

        // Auto-close after 5 seconds unless it's high priority
        if (notification.priority !== 'high') {
          setTimeout(() => {
            browserNotification.close();
          }, 5000);
        }

        // Handle click on notification
        browserNotification.onclick = () => {
          window.focus();
          browserNotification.close();
          
          // Navigate to relevant page if URL is provided
          if (notification.url) {
            window.location.href = notification.url;
          }
        };

        return browserNotification;
      } catch (error) {
        console.error('Error showing browser notification:', error);
      }
    }
    return null;
  }, [notificationPermission]);

  // Utility functions
  const formatNotificationTime = useCallback((timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes < 1440) { // 24 hours
      const diffInHours = Math.floor(diffInMinutes / 60);
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes < 10080) { // 7 days
      const diffInDays = Math.floor(diffInMinutes / 1440);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
      return notificationTime.toLocaleDateString();
    }
  }, []);

  const getNotificationIcon = useCallback((type) => {
    const iconMap = {
      message: '💬',
      call: '📞',
      project: '📋',
      task: '✅',
      meeting: '📅',
      document: '📄',
      whiteboard: '🎨',
      workspace: '🏢',
      system: '⚙️',
      error: '❌',
      success: '✅',
      warning: '⚠️',
      info: 'ℹ️',
    };
    return iconMap[type] || '🔔';
  }, []);

  const getNotificationColor = useCallback((priority) => {
    const colorMap = {
      low: 'text-gray-600',
      medium: 'text-blue-600',
      high: 'text-orange-600',
      urgent: 'text-red-600',
    };
    return colorMap[priority] || 'text-gray-600';
  }, []);

  const filterNotifications = useCallback((notifications, filter) => {
    if (!notifications) return [];
    
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'read':
        return notifications.filter(n => n.read);
      case 'high_priority':
        return notifications.filter(n => n.priority === 'high' || n.priority === 'urgent');
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return notifications.filter(n => new Date(n.createdAt) >= today);
      case 'this_week':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return notifications.filter(n => new Date(n.createdAt) >= weekAgo);
      default:
        return notifications;
    }
  }, []);

  const groupNotificationsByDate = useCallback((notifications) => {
    if (!notifications) return {};
    
    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    notifications.forEach(notification => {
      const notificationDate = new Date(notification.createdAt);
      
      if (notificationDate >= today) {
        groups.today.push(notification);
      } else if (notificationDate >= yesterday) {
        groups.yesterday.push(notification);
      } else if (notificationDate >= weekAgo) {
        groups.thisWeek.push(notification);
      } else {
        groups.older.push(notification);
      }
    });

    return groups;
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewNotification = (data) => {
      console.log('New notification received:', data);
      
      // Add to Redux state
      dispatch(addNotification(data.notification));
      
      // Invalidate React Query cache
      queryClient.invalidateQueries(['notifications']);
      
      // Show browser notification
      showBrowserNotification(data.notification);
      
      // Show toast notification
      toast.success(data.notification.title || 'New notification received');
    };

    const handleNotificationRead = (data) => {
      console.log('Notification marked as read:', data);
      dispatch(markOneAsRead(data.notificationId));
      queryClient.invalidateQueries(['notifications']);
    };

    const handleNotificationDeleted = (data) => {
      console.log('Notification deleted:', data);
      dispatch(removeNotification(data.notificationId));
      queryClient.invalidateQueries(['notifications']);
    };

    const handleNotificationCleared = (data) => {
      console.log('All notifications cleared:', data);
      dispatch(resetNotificationState());
      queryClient.invalidateQueries(['notifications']);
    };

    // Join user's notification room
    socket.emit('join_notifications');

    // Listen for notification events
    socket.on('notification_received', handleNewNotification);
    socket.on('notification_read', handleNotificationRead);
    socket.on('notification_deleted', handleNotificationDeleted);
    socket.on('notifications_cleared', handleNotificationCleared);

    return () => {
      socket.off('notification_received', handleNewNotification);
      socket.off('notification_read', handleNotificationRead);
      socket.off('notification_deleted', handleNotificationDeleted);
      socket.off('notifications_cleared', handleNotificationCleared);
      socket.emit('leave_notifications');
    };
  }, [socket, user, dispatch, queryClient, showBrowserNotification]);

  // Update unread count when notifications change
  useEffect(() => {
    if (notifications) {
      const count = notifications.filter(n => !n.read).length;
      dispatch(setUnreadCount(count));
    }
  }, [notifications, dispatch]);

  // Extract data from API responses
  const apiNotificationsData = notificationsData?.data;
  const apiSettingsData = settingsData?.data;

  const notificationsList = apiNotificationsData?.data?.notifications || [];
  const settings = apiSettingsData?.data?.settings || {};

  // Return consolidated interface
  return {
    // State
    user,
    notifications: notificationsList,
    unreadCount,
    settings,
    notificationPermission,
    loading,
    errors,
    pagination,
    
    // Loading states
    isLoadingNotifications,
    isLoadingSettings,
    
    // Error states
    notificationsError,
    settingsError,
    
    // Notification management actions
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDeleteNotification,
    clearAllNotifications: handleClearAllNotifications,
    updateSettings: handleUpdateSettings,
    
    // Browser notification actions
    requestNotificationPermission,
    showBrowserNotification,
    
    // Utility functions
    formatNotificationTime,
    getNotificationIcon,
    getNotificationColor,
    filterNotifications,
    groupNotificationsByDate,
    
    // Refetch functions
    refetchNotifications,
    
    // Mutation states
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeletingNotification: deleteNotificationMutation.isPending,
    isClearingAll: clearAllNotificationsMutation.isPending,
    isUpdatingSettings: updateSettingsMutation.isPending,
  };
};
