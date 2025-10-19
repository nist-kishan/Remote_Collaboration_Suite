import { useEffect, useState } from 'react';
import { useSocket } from './useSocket';

export const useUserStatus = () => {
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleUserStatusChange = (data) => {
      const { userId, isOnline } = data;
      console.log('useUserStatus: Received status change:', { userId, isOnline });
      
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (isOnline) {
          newSet.add(userId);
          console.log('useUserStatus: User is now online:', userId);
        } else {
          newSet.delete(userId);
          console.log('useUserStatus: User is now offline:', userId);
        }
        console.log('useUserStatus: Current online users:', Array.from(newSet));
        return newSet;
      });
    };

    socket.on('user_status_changed', handleUserStatusChange);

    return () => {
      socket.off('user_status_changed', handleUserStatusChange);
    };
  }, [socket]);

  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  return {
    onlineUsers,
    isUserOnline
  };
};
