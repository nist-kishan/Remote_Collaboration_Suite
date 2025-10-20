import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount
} from '../../api/notificationApi';

// Async thunks for API calls
export const fetchUserNotifications = createAsyncThunk(
  'notification/fetchUserNotifications',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getUserNotifications(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const markNotificationAsReadThunk = createAsyncThunk(
  'notification/markNotificationAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await markNotificationAsRead(notificationId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark notification as read');
    }
  }
);

export const markAllNotificationsAsReadThunk = createAsyncThunk(
  'notification/markAllNotificationsAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await markAllNotificationsAsRead();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark all notifications as read');
    }
  }
);

export const deleteNotificationThunk = createAsyncThunk(
  'notification/deleteNotification',
  async (notificationId, { rejectWithValue }) => {
    try {
      await deleteNotification(notificationId);
      return notificationId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete notification');
    }
  }
);

export const deleteAllNotificationsThunk = createAsyncThunk(
  'notification/deleteAllNotifications',
  async (_, { rejectWithValue }) => {
    try {
      await deleteAllNotifications();
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete all notifications');
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notification/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getUnreadCount();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch unread count');
    }
  }
);

const initialState = {
  // Notifications list
  notifications: [],
  notificationsLoading: false,
  notificationsError: null,
  
  // Unread count
  unreadCount: 0,
  unreadCountLoading: false,
  unreadCountError: null,
  
  // UI state
  showNotificationsPanel: false,
  filter: 'all', // 'all', 'unread', 'read'
  sortBy: 'createdAt', // 'createdAt', 'type', 'priority'
  sortOrder: 'desc', // 'asc', 'desc'
  
  // Operations
  operations: {
    markingAsRead: false,
    markingAllAsRead: false,
    deleting: false,
    deletingAll: false
  },
  
  // Pagination
  pagination: {
    notifications: { page: 1, limit: 20, total: 0, pages: 0 }
  }
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    // UI state management
    setShowNotificationsPanel: (state, action) => {
      state.showNotificationsPanel = action.payload;
    },
    
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
    
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    
    setSortOrder: (state, action) => {
      state.sortOrder = action.payload;
    },
    
    // Real-time notification management
    addNotification: (state, action) => {
      const notification = action.payload;
      state.notifications.unshift(notification);
      if (!notification.isRead) {
        state.unreadCount += 1;
      }
    },
    
    updateNotification: (state, action) => {
      const { notificationId, updates } = action.payload;
      const notification = state.notifications.find(n => n._id === notificationId);
      if (notification) {
        const wasUnread = !notification.isRead;
        Object.assign(notification, updates);
        const isNowRead = notification.isRead;
        
        // Update unread count
        if (wasUnread && isNowRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        } else if (!wasUnread && !isNowRead) {
          state.unreadCount += 1;
        }
      }
    },
    
    removeNotification: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n._id === notificationId);
      if (notification && !notification.isRead) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.notifications = state.notifications.filter(n => n._id !== notificationId);
    },
    
    // Optimistic updates
    markNotificationAsReadOptimistic: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n._id === notificationId);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        notification.readAt = new Date().toISOString();
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    
    markAllNotificationsAsReadOptimistic: (state) => {
      state.notifications.forEach(notification => {
        if (!notification.isRead) {
          notification.isRead = true;
          notification.readAt = new Date().toISOString();
        }
      });
      state.unreadCount = 0;
    },
    
    // Error management
    clearError: (state, action) => {
      const errorType = action.payload;
      if (state[errorType]) {
        state[errorType] = null;
      }
    },
    
    clearAllErrors: (state) => {
      state.notificationsError = null;
      state.unreadCountError = null;
    },
    
    // Reset state
    resetNotificationState: (state) => {
      return { ...initialState };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch user notifications
      .addCase(fetchUserNotifications.pending, (state) => {
        state.notificationsLoading = true;
        state.notificationsError = null;
      })
      .addCase(fetchUserNotifications.fulfilled, (state, action) => {
        state.notificationsLoading = false;
        state.notifications = action.payload.notifications || [];
        state.pagination.notifications = action.payload.pagination || state.pagination.notifications;
      })
      .addCase(fetchUserNotifications.rejected, (state, action) => {
        state.notificationsLoading = false;
        state.notificationsError = action.payload;
      })
      
      // Mark notification as read
      .addCase(markNotificationAsReadThunk.pending, (state) => {
        state.operations.markingAsRead = true;
      })
      .addCase(markNotificationAsReadThunk.fulfilled, (state, action) => {
        state.operations.markingAsRead = false;
        const updatedNotification = action.payload.notification;
        const notification = state.notifications.find(n => n._id === updatedNotification._id);
        if (notification) {
          Object.assign(notification, updatedNotification);
        }
      })
      .addCase(markNotificationAsReadThunk.rejected, (state, action) => {
        state.operations.markingAsRead = false;
        state.notificationsError = action.payload;
      })
      
      // Mark all notifications as read
      .addCase(markAllNotificationsAsReadThunk.pending, (state) => {
        state.operations.markingAllAsRead = true;
      })
      .addCase(markAllNotificationsAsReadThunk.fulfilled, (state, action) => {
        state.operations.markingAllAsRead = false;
        state.notifications.forEach(notification => {
          notification.isRead = true;
          notification.readAt = new Date().toISOString();
        });
        state.unreadCount = 0;
      })
      .addCase(markAllNotificationsAsReadThunk.rejected, (state, action) => {
        state.operations.markingAllAsRead = false;
        state.notificationsError = action.payload;
      })
      
      // Delete notification
      .addCase(deleteNotificationThunk.pending, (state) => {
        state.operations.deleting = true;
      })
      .addCase(deleteNotificationThunk.fulfilled, (state, action) => {
        state.operations.deleting = false;
        const notificationId = action.payload;
        state.notifications = state.notifications.filter(n => n._id !== notificationId);
      })
      .addCase(deleteNotificationThunk.rejected, (state, action) => {
        state.operations.deleting = false;
        state.notificationsError = action.payload;
      })
      
      // Delete all notifications
      .addCase(deleteAllNotificationsThunk.pending, (state) => {
        state.operations.deletingAll = true;
      })
      .addCase(deleteAllNotificationsThunk.fulfilled, (state, action) => {
        state.operations.deletingAll = false;
        state.notifications = [];
        state.unreadCount = 0;
      })
      .addCase(deleteAllNotificationsThunk.rejected, (state, action) => {
        state.operations.deletingAll = false;
        state.notificationsError = action.payload;
      })
      
      // Fetch unread count
      .addCase(fetchUnreadCount.pending, (state) => {
        state.unreadCountLoading = true;
        state.unreadCountError = null;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCountLoading = false;
        state.unreadCount = action.payload.count || 0;
      })
      .addCase(fetchUnreadCount.rejected, (state, action) => {
        state.unreadCountLoading = false;
        state.unreadCountError = action.payload;
      });
  }
});

// Export actions
export const {
  setShowNotificationsPanel,
  setFilter,
  setSortBy,
  setSortOrder,
  addNotification,
  updateNotification,
  removeNotification,
  markNotificationAsReadOptimistic,
  markAllNotificationsAsReadOptimistic,
  clearError,
  clearAllErrors,
  resetNotificationState
} = notificationSlice.actions;

// Export selectors
export const selectNotifications = (state) => state.notification.notifications;
export const selectUnreadCount = (state) => state.notification.unreadCount;
export const selectShowNotificationsPanel = (state) => state.notification.showNotificationsPanel;
export const selectFilter = (state) => state.notification.filter;
export const selectSortBy = (state) => state.notification.sortBy;
export const selectSortOrder = (state) => state.notification.sortOrder;
export const selectNotificationLoading = (state) => ({
  notifications: state.notification.notificationsLoading,
  unreadCount: state.notification.unreadCountLoading
});
export const selectNotificationErrors = (state) => ({
  notifications: state.notification.notificationsError,
  unreadCount: state.notification.unreadCountError
});
export const selectNotificationOperations = (state) => state.notification.operations;
export const selectNotificationPagination = (state) => state.notification.pagination;

// Computed selectors
export const selectFilteredNotifications = (state) => {
  const notifications = selectNotifications(state);
  const filter = selectFilter(state);
  const sortBy = selectSortBy(state);
  const sortOrder = selectSortOrder(state);
  
  let filtered = notifications;
  
  // Apply filter
  if (filter === 'unread') {
    filtered = filtered.filter(n => !n.isRead);
  } else if (filter === 'read') {
    filtered = filtered.filter(n => n.isRead);
  }
  
  // Apply sorting
  filtered.sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'createdAt') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
  
  return filtered;
};

export const selectUnreadNotifications = (state) => {
  return selectNotifications(state).filter(n => !n.isRead);
};

export const selectReadNotifications = (state) => {
  return selectNotifications(state).filter(n => n.isRead);
};

export default notificationSlice.reducer;
