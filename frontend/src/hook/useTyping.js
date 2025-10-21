import { useState, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useSocket } from './useSocket';

export const useTyping = (chatId) => {
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  
  const { socket } = useSocket();
  const { user } = useSelector((state) => state.auth);

  // Start typing
  const startTyping = useCallback(() => {
    if (socket && chatId && user) {
      socket.emit('typing', {
        chatId,
        userId: user._id,
        userName: user.name
      });
      
      if (!isTyping) {
        setIsTyping(true);
        
        // Auto-stop typing after 3 seconds
        setTimeout(() => {
          stopTyping();
        }, 3000);
      }
    }
  }, [socket, chatId, user, isTyping]);

  // Stop typing
  const stopTyping = useCallback(() => {
    if (socket && chatId && user && isTyping) {
      socket.emit('stop_typing', {
        chatId,
        userId: user._id
      });
      setIsTyping(false);
    }
  }, [socket, chatId, user, isTyping]);

  // Handle typing event from other users
  const handleTypingEvent = useCallback((data) => {
    if (data.chatId === chatId && data.userId !== user?._id) {
      setTypingUsers(prev => {
        const existingUser = prev.find(u => u.userId === data.userId);
        if (existingUser) {
          return prev.map(u => 
            u.userId === data.userId 
              ? { ...u, timestamp: Date.now() }
              : u
          );
        } else {
          return [...prev, { userId: data.userId, userName: data.userName, timestamp: Date.now() }];
        }
      });
    }
  }, [chatId, user]);

  // Handle stop typing event from other users
  const handleStopTypingEvent = useCallback((data) => {
    if (data.chatId === chatId) {
      setTypingUsers(prev => prev.filter(user => user.userId !== data.userId));
    }
  }, [chatId]);

  // Set up socket listeners
  useEffect(() => {
    if (socket && chatId) {
      socket.on('typing', handleTypingEvent);
      socket.on('stop_typing', handleStopTypingEvent);

      return () => {
        socket.off('typing', handleTypingEvent);
        socket.off('stop_typing', handleStopTypingEvent);
      };
    }
  }, [socket, chatId, handleTypingEvent, handleStopTypingEvent]);

  // Clean up old typing users (older than 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => 
        prev.filter(user => now - user.timestamp < 5000)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    isTyping,
    typingUsers,
    startTyping,
    stopTyping,
    handleTypingEvent,
    handleStopTypingEvent
  };
};
