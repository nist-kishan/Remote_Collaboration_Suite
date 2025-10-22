import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useSocket } from './useSocket';

export const useUserStatus = () => {
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const { socket } = useSocket();
  const { user } = useSelector((state) => state.auth);

  // Check if a specific user is online
  const isUserOnline = useCallback((userId) => {
    if (!userId) return false;
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  // Get online status for current user
  const isCurrentUserOnline = useCallback(() => {
    return socket?.connected || false;
  }, [socket]);

  // Handle user coming online
  const handleUserOnline = useCallback((data) => {
    if (data.userId && data.userId !== user?._id) {
      setOnlineUsers(prev => new Set([...prev, data.userId]));
    }
  }, [user]);

  // Handle user going offline
  const handleUserOffline = useCallback((data) => {
    if (data.userId && data.userId !== user?._id) {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    }
  }, [user]);

  // Handle bulk online users
  const handleBulkOnlineUsers = useCallback((data) => {
    if (Array.isArray(data.userIds)) {
      setOnlineUsers(new Set(data.userIds.filter(id => id !== user?._id)));
    }
  }, [user]);

  // Set up socket listeners
  useEffect(() => {
    if (socket) {
      // Listen for user status events
      socket.on('user_online', handleUserOnline);
      socket.on('user_offline', handleUserOffline);
      socket.on('bulk_online_users', handleBulkOnlineUsers);

      // Emit that current user is online when connected (with throttling)
      if (socket.connected) {
        // Throttle user online emission to prevent spam
        const timeoutId = setTimeout(() => {
          socket.emit('user_online', { userId: user?._id });
        }, 1000); // 1 second delay

        // Request current online users (with throttling)
        const requestTimeoutId = setTimeout(() => {
          socket.emit('get_online_users');
        }, 2000); // 2 second delay

        return () => {
          clearTimeout(timeoutId);
          clearTimeout(requestTimeoutId);
        };
      }

      return () => {
        socket.off('user_online', handleUserOnline);
        socket.off('user_offline', handleUserOffline);
        socket.off('bulk_online_users', handleBulkOnlineUsers);
        
        // Emit that current user is going offline
        if (socket.connected) {
          socket.emit('user_offline', { userId: user?._id });
        }
      };
    }
  }, [socket, user, handleUserOnline, handleUserOffline, handleBulkOnlineUsers]);

  // Clean up online users periodically (remove stale entries)
  useEffect(() => {
    const interval = setInterval(() => {
      // This could be enhanced to track last seen timestamps
      // For now, we'll rely on socket events to manage the list
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    onlineUsers: Array.from(onlineUsers),
    isUserOnline,
    isCurrentUserOnline: isCurrentUserOnline(),
    onlineCount: onlineUsers.size,
  };
};
