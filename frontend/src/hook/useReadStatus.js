import { useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useSocket } from './useSocket';
import { useMarkAsRead, useMarkAsDelivered } from './useChat';

export const useReadStatus = (chatId) => {
  const { user } = useSelector((state) => state.auth);
  const socket = useSocket();
  const markAsReadMutation = useMarkAsRead();
  const markAsDeliveredMutation = useMarkAsDelivered();
  
  const lastReadMessageRef = useRef(null);
  const deliveredMessagesRef = useRef(new Set());

  // Mark messages as read when chat becomes visible or user scrolls to bottom
  const markMessagesAsRead = useCallback((messageId = null) => {
    if (!chatId || !user) return;
    
    // Mark via API
    markAsReadMutation.mutate({ chatId, messageId });
    
    // Mark via socket
    if (socket) {
      socket.emit('mark_as_read', { chatId, messageId });
    }
  }, [chatId, user, socket, markAsReadMutation]);

  // Mark message as delivered
  const markMessageAsDelivered = useCallback((messageId) => {
    if (!chatId || !messageId || !user) return;
    
    // Avoid duplicate delivery marking
    if (deliveredMessagesRef.current.has(messageId)) return;
    
    deliveredMessagesRef.current.add(messageId);
    
    // Mark via API
    markAsDeliveredMutation.mutate({ chatId, messageId });
    
    // Mark via socket
    if (socket) {
      socket.emit('mark_as_delivered', { chatId, messageId });
    }
  }, [chatId, user, socket, markAsDeliveredMutation]);

  // Handle incoming read status updates
  useEffect(() => {
    if (!socket || !chatId) return;

    const handleMessagesRead = (data) => {
      if (data.chatId === chatId && data.userId !== user?._id) {
        // Update UI to show read status
        console.log('Messages read by user:', data.userId);
      }
    };

    const handleMessageDelivered = (data) => {
      if (data.chatId === chatId && data.userId !== user?._id) {
        // Update UI to show delivery status
        console.log('Message delivered to user:', data.userId);
      }
    };

    socket.on('messages_read', handleMessagesRead);
    socket.on('message_delivered', handleMessageDelivered);

    return () => {
      socket.off('messages_read', handleMessagesRead);
      socket.off('message_delivered', handleMessageDelivered);
    };
  }, [socket, chatId, user]);

  // Auto-mark messages as delivered when they are received
  const handleMessageReceived = useCallback((message) => {
    if (message.sender._id !== user?._id) {
      markMessageAsDelivered(message._id);
    }
  }, [user, markMessageAsDelivered]);

  // Auto-mark messages as read when chat is opened and scrolled to bottom
  const handleChatOpened = useCallback(() => {
    markMessagesAsRead();
  }, [markMessagesAsRead]);

  // Mark specific message as read (for read receipts)
  const markMessageAsRead = useCallback((messageId) => {
    markMessagesAsRead(messageId);
  }, [markMessagesAsRead]);

  return {
    markMessagesAsRead,
    markMessageAsDelivered,
    markMessageAsRead,
    handleMessageReceived,
    handleChatOpened,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAsDelivered: markAsDeliveredMutation.isPending,
  };
};

export default useReadStatus;

