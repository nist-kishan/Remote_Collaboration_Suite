import ApiClient from './ApiClient';

export const notificationApi = {
  // Get user notifications
  getNotifications: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return ApiClient.get(`/notifications${queryString ? `?${queryString}` : ''}`);
  },

  // Mark notification as read
  markNotificationAsRead: (notificationId) => {
    return ApiClient.put(`/notifications/${notificationId}/mark-read`);
  },

  // Mark all notifications as read
  markAllNotificationsAsRead: () => {
    return ApiClient.put('/notifications/mark-all-read');
  },

  // Delete notification
  deleteNotification: (notificationId) => {
    return ApiClient.delete(`/notifications/${notificationId}`);
  },

  // Get notification count
  getNotificationCount: () => {
    return ApiClient.get('/notifications/count');
  }
};
