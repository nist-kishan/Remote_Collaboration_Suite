import React, { useState, useEffect, useCallback, forwardRef } from 'react';
import { useSelector } from 'react-redux';
import ChatWindowHeader from './ChatWindowHeader';
import ChatMessageList from './ChatMessageList';
import ChatMessageInput from '../ui/ChatMessageInput';
import ChatGroupMembersModal from './ChatGroupMembersModal';
import { useSocket } from '../../hook/useSocket';
import { useChat } from '../../hook/useChat';
import { useTyping } from '../../hook/useTyping';
import { useQueryClient } from '@tanstack/react-query';
import { createOptimizedMessageSender } from '../../utils/messageOptimizer';

// Debounce utility function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const ChatWindow = forwardRef(({ 
  chat, 
  onVideoCall,
  onChatSelect,
  onDelete,
  onInfo,
  onBack,
  isMobile = false,
  className = '' 
}, ref) => {
  const { user } = useSelector((state) => state.auth);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  const { socket } = useSocket();
  const { 
    isTyping, 
    typingUsers, 
    startTyping, 
    stopTyping, 
    handleTypingEvent, 
    handleStopTypingEvent 
  } = useTyping(chat?._id);
  
  // Note: These mutations would be implemented using React Query's useMutation
  // For now, we'll handle them directly in the component
  const queryClient = useQueryClient();

  // Create debounced mark as read function
  const debouncedMarkAsRead = useCallback(
    debounce(() => {
      if (socket && socket.connected && chat?._id) {
        // Marking messages as read for chat
        socket.emit('mark_as_read', { chatId: chat._id });
      }
    }, 1000), // Debounce for 1 second
    [socket, chat?._id]
  );

  // Join chat room and handle Socket.IO events
  useEffect(() => {
    if (!socket || !chat?._id) return;

    // Socket connection status check
    if (!socket.connected) {
      console.log('Socket not connected, attempting to connect...');
      socket.connect();
      return; // Wait for socket to connect
    }

    // Join the chat room
    console.log('Joining chat room:', chat._id);
    socket.emit('join_chat', { chatId: chat._id });
    
    // Mark messages as read when opening the chat
    debouncedMarkAsRead();

    const handleNewMessage = (data) => {
      console.log('📨 Received new message:', data);

      // Validate message data
      if (!data || !data.message) {
        console.warn('Invalid message data received:', data);
        return;
      }

      // Update for all messages in the current chat (including own messages)
      if (data.chatId === chat._id) {
        console.log('✅ Message belongs to current chat, refreshing...');

        // Force refresh messages to ensure real-time updates
        queryClient.invalidateQueries(['messages', chat._id]);
        queryClient.invalidateQueries(['chats']);
        queryClient.invalidateQueries(['recentChats']);
        queryClient.invalidateQueries(['groupChats']);
      } else {
        console.log('Message for different chat:', data.chatId);
      }
    };

    const handleChatJoined = (data) => {
      // Chat joined successfully
    };

    const handleError = (error) => {
      // Handle different types of errors
      if (typeof error === 'string') {
        if (error === 'Failed to send message' || error.includes('Failed to send message')) {
          socket.connect();
        }
      }
    };

    // Register event listeners
    socket.on('new_message', handleNewMessage);
    socket.on('chat_joined', handleChatJoined);
    socket.on('user_typing', handleTypingEvent);
    socket.on('user_stop_typing', handleStopTypingEvent);
    socket.on('error', handleError);
    
    // Listen for socket connection to ensure chat room is joined
    const handleConnect = () => {

      socket.emit('join_chat', { chatId: chat._id });
    };
    
    socket.on('connect', handleConnect);

    return () => {
      socket.emit('leave_chat', { chatId: chat._id });
      socket.off('new_message', handleNewMessage);
      socket.off('chat_joined', handleChatJoined);
      socket.off('user_typing', handleTypingEvent);
      socket.off('user_stop_typing', handleStopTypingEvent);
      socket.off('error', handleError);
      socket.off('connect', handleConnect);
    };
  }, [socket, chat?._id, queryClient, handleTypingEvent, handleStopTypingEvent]);

  const handleSendMessage = (data) => {
    if (!chat?._id || isSendingMessage) {

      return;
    }

    setIsSendingMessage(true);

    // Prepare message data, excluding undefined values
    const messageId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const messageData = {
      chatId: chat._id,
      content: data.content,
      type: data.type || 'text',
      tempId: messageId // Add temporary ID to track this specific message
    };

    // Only include media if it exists
    if (data.media) {
      messageData.media = data.media;
    }

    // Only include replyTo if it exists
    if (data.replyTo) {
      messageData.replyTo = data.replyTo;
    }

    // For real-time messaging, we'll rely on Socket.IO events rather than optimistic updates
    // This ensures messages appear consistently for both sender and receiver

    // Try Socket.IO first

    if (socket && socket.connected) {
      console.log('📤 Sending message via socket:', messageData);

      // Reset sending flag immediately for better UX
      setIsSendingMessage(false);
      
      // Listen for confirmation from Socket.IO
      const confirmationHandler = (data) => {
        console.log('✅ Message confirmed by server:', data);
        
        // Refresh messages and chat list to show the confirmed message
        queryClient.invalidateQueries(['messages', chat._id]);
        queryClient.invalidateQueries(['chats']);
        queryClient.invalidateQueries(['recentChats']);
        queryClient.invalidateQueries(['groupChats']);
        
        socket.off('message_confirmed', confirmationHandler);
      };
      
      socket.on('message_confirmed', confirmationHandler);
      
      // Clean up confirmation handler after timeout
      setTimeout(() => {
        socket.off('message_confirmed', confirmationHandler);
      }, 5000);
      
      // Emit the message
      socket.emit('send_message', messageData);

      // Immediately invalidate queries to update chat list
      queryClient.invalidateQueries(['recentChats']);
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['groupChats']);
    } else {
      // Socket.IO not available, use API directly

      sendMessageMutation.mutate({
        chatId: chat._id,
        data: { ...messageData, wasSentViaSocket: false } // Mark as API fallback
      });
      // Reset flag after API call
      setTimeout(() => setIsSendingMessage(false), 1000);
    }
  };

  const handleReply = (message) => {
    setReplyTo(message);
    setEditingMessage(null);
  };

  const handleEdit = (message) => {
    setEditingMessage(message);
    setReplyTo(null);
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  // Use the handler functions passed as props

  if (!chat) {
    return (
      <div className={`flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Welcome to Chat
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Select a chat from the sidebar to start messaging
          </p>
        </div>
      </div>
    );
  }

  // Add error boundary for socket errors
  if (isSendingMessage && !socket?.connected) {

  }

  return (
    <div className={`chat-container bg-white dark:bg-gray-900 flex flex-col h-full w-full overflow-hidden relative ${className}`}>
      {/* Chat Header - Fixed at top */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 relative z-50 sticky top-0">
        <ChatWindowHeader
          chat={chat}
          onVideoCall={onVideoCall}
          onDelete={(chat) => onDelete(chat, onChatSelect)}
          onInfo={(chat) => {
            if (chat.type === 'group') {

              setShowGroupMembers(true);
            } else {

              onInfo?.(chat);
            }
          }}
          onBack={onBack}
          isMobile={isMobile}
        />
      </div>

      {/* Messages - Scrollable Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-gray-800 min-h-0 pb-2 px-2 sm:px-4 relative z-10">
        <ChatMessageList
          chatId={chat._id}
          typingUsers={typingUsers}
          onReply={handleReply}
          onMarkAsRead={debouncedMarkAsRead}
          isMobile={isMobile}
        />
      </div>

      {/* Message Input - Fixed at bottom */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 min-h-[80px] px-2 sm:px-4 relative z-20">
        <ChatMessageInput
          ref={ref}
          onSendMessage={handleSendMessage}
          onTyping={startTyping}
          replyTo={replyTo}
          onCancelReply={handleCancelReply}
          autoFocus={true}
          disabled={false}
          isMobile={isMobile}
          chatId={chat._id}
        />
      </div>

      {/* Group Members Modal */}
      {chat.type === 'group' && (
        <ChatGroupMembersModal
          isOpen={showGroupMembers}
          onClose={() => setShowGroupMembers(false)}
          chatId={chat._id}
          chatName={chat.name}
        />
      )}

    </div>
  );
});

ChatWindow.displayName = 'ChatWindow';

export default ChatWindow;