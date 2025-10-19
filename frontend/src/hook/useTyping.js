import { useState, useRef, useCallback } from 'react';
import { useSocket } from './useSocket';

export const useTyping = (chatId) => {
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const { socket } = useSocket();
  const typingTimeoutRef = useRef(null);

  const startTyping = useCallback(() => {
    if (!socket || !chatId) return;
    
    if (!isTyping) {
      socket.emit('typing', { chatId });
      setIsTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  }, [socket, chatId, isTyping]);

  const stopTyping = useCallback(() => {
    if (!socket || !chatId) return;
    
    if (isTyping) {
      socket.emit('stop_typing', { chatId });
      setIsTyping(false);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [socket, chatId, isTyping]);

  const handleTypingEvent = useCallback((data) => {
    if (data.chatId === chatId) {
      setTypingUsers(prev => {
        const filtered = prev.filter(user => user.userId !== data.userId);
        return [...filtered, { userId: data.userId, name: data.userName }];
      });

      // Remove user from typing list after 3 seconds
      setTimeout(() => {
        setTypingUsers(prev => prev.filter(user => user.userId !== data.userId));
      }, 3000);
    }
  }, [chatId]);

  const handleStopTypingEvent = useCallback((data) => {
    if (data.chatId === chatId) {
      setTypingUsers(prev => prev.filter(user => user.userId !== data.userId));
    }
  }, [chatId]);

  return {
    isTyping,
    typingUsers,
    startTyping,
    stopTyping,
    handleTypingEvent,
    handleStopTypingEvent,
  };
};
