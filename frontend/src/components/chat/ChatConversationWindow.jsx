import React, { useState, useEffect, useCallback, forwardRef } from 'react';
import { useSelector } from 'react-redux';
import ChatWindowHeader from './ChatWindowHeader';
import ChatMessageList from './ChatMessageList';
import ChatMessageInput from '../ui/ChatMessageInput';
import ChatGroupMembersModal from './ChatGroupMembersModal';
import { useSocket } from '../../hook/useSocket';
import { useChat } from '../../hook/useChat';
import { useCreateOneToOneChat, useArchiveChatForUser, useDeleteChatForUser } from '../../hook/useChat';
import { useQueryClient } from '@tanstack/react-query';

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
  onCallHistory,
  onChatSelect,
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
  
  const createChatMutation = useCreateOneToOneChat();
  const sendMessageMutation = useSendMessage();
  const archiveChatForUserMutation = useArchiveChatForUser();
  const deleteChatForUserMutation = useDeleteChatForUser();
  const queryClient = useQueryClient();

  // Create debounced mark as read function
  const debouncedMarkAsRead = useCallback(
    debounce(() => {
      if (socket && socket.connected && chat?._id) {
        console.log('ChatWindow: Marking messages as read for chat:', chat._id);
        socket.emit('mark_as_read', { chatId: chat._id });
      }
    }, 1000), // Debounce for 1 second
    [socket, chat?._id]
  );

  // Join chat room and handle Socket.IO events
  useEffect(() => {
    if (!socket || !chat?._id) return;

    console.log('ChatWindow: Socket connection status:', { 
      socket: !!socket, 
      connected: socket?.connected, 
      chatId: chat._id 
    });

    // Join the chat room
    console.log('ChatWindow: Socket connection status:', { 
      connected: socket?.connected, 
      id: socket?.id,
      chatId: chat._id 
    });
    
    // Ensure socket is connected before joining chat
    if (socket && socket.connected) {
      socket.emit('join_chat', { chatId: chat._id });
      console.log('ChatWindow: Joined chat room successfully');
    } else {
      console.log('ChatWindow: Socket not connected, retrying...');
      // Retry connection
      setTimeout(() => {
        if (socket) {
          socket.connect();
          socket.emit('join_chat', { chatId: chat._id });
        }
      }, 1000);
    }
    
    // Mark messages as read when opening the chat
    socket.emit('mark_as_read', { chatId: chat._id });

    const handleNewMessage = (data) => {
      console.log('=== NEW MESSAGE EVENT RECEIVED ===');
      console.log('ChatWindow: Received new_message event:', data);
      console.log('Current chat ID:', chat._id);
      console.log('Message chat ID:', data.chatId);
      console.log('Message details:', {
        messageId: data.message?._id,
        content: data.message?.content,
        senderId: data.message?.sender?._id,
        senderName: data.message?.sender?.name
      });
      
      // Validate message data
      if (!data || !data.message) {
        console.log('ChatWindow: Invalid message data received');
        return;
      }

      // Update for all messages in the current chat (including own messages)
      if (data.chatId === chat._id) {
        console.log('ChatWindow: Updating queries for current chat:', chat._id);
        
        // Simply refresh messages to show new message in real-time
        console.log('ChatWindow: Refreshing messages for real-time update');
        
        // Force refresh messages to ensure real-time updates
        queryClient.invalidateQueries(['messages', chat._id]);
        queryClient.invalidateQueries(['chats']);
        
        console.log('ChatWindow: Invalidated queries for real-time update');
      } else {
        console.log('ChatWindow: Message not for current chat. Expected:', chat._id, 'Received:', data.chatId);
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
      console.log('ChatWindow: Socket connected, joining chat room');
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
      console.log('ChatWindow: Cannot send message - no chat or already sending');
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
    
    console.log('ChatWindow: Sending message with tempId:', messageId);

    // Only include media if it exists
    if (data.media) {
      messageData.media = data.media;
    }

    // Only include replyTo if it exists
    if (data.replyTo) {
      messageData.replyTo = data.replyTo;
    }

    console.log('ChatWindow sending:', messageData);

    // For real-time messaging, we'll rely on Socket.IO events rather than optimistic updates
    // This ensures messages appear consistently for both sender and receiver

    // Try Socket.IO first
    console.log('ChatWindow: Socket status:', { 
      socket: !!socket, 
      connected: socket?.connected,
      socketId: socket?.id,
      messageData: messageData 
    });
    
    if (socket && socket.connected) {
      console.log('=== SENDING MESSAGE VIA SOCKET.IO ===');
      console.log('ChatWindow: Socket.IO connected, sending via Socket.IO');
      console.log('Socket connection details:', {
        connected: socket.connected,
        id: socket.id,
        messageData: messageData
      });
      
      // Reset sending flag immediately for better UX
      setIsSendingMessage(false);
      
      socket.emit('send_message', messageData);
      console.log('ChatWindow: Message sent via Socket.IO');
      
      // Listen for confirmation from Socket.IO
      const confirmationHandler = (data) => {
        console.log('ChatWindow: Socket.IO message confirmation received:', data);
        
        // Refresh messages to show the confirmed message
        queryClient.invalidateQueries(['messages', chat._id]);
        
        socket.off('message_confirmed', confirmationHandler);
      };
      
      socket.on('message_confirmed', confirmationHandler);
      
      // Clean up confirmation handler after timeout
      setTimeout(() => {
        socket.off('message_confirmed', confirmationHandler);
      }, 5000);
    } else {
      // Socket.IO not available, use API directly
      console.log('=== USING API FALLBACK ===');
      console.log('ChatWindow: Socket.IO not connected, using API fallback');
      console.log('Socket status:', { socket: !!socket, connected: socket?.connected });
      
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

  const handleArchive = (chat) => {
    if (!chat?._id) return;
    
    archiveChatForUserMutation.mutate(chat._id, {
      onSuccess: () => {
        // Invalidate chats query to refresh the list
        queryClient.invalidateQueries(['chats']);
        // Navigate away from this chat
        if (onChatSelect) {
          onChatSelect(null);
        }
      },
      onError: (error) => {
        console.error('Failed to archive chat:', error);
      }
    });
  };

  const handleDelete = (chat) => {
    if (!chat?._id) return;
    
    deleteChatForUserMutation.mutate(chat._id, {
      onSuccess: () => {
        // Invalidate chats query to refresh the list
        queryClient.invalidateQueries(['chats']);
        // Navigate away from this chat
        if (onChatSelect) {
          onChatSelect(null);
        }
      },
      onError: (error) => {
        console.error('Failed to delete chat:', error);
      }
    });
  };

  const handleInfo = (chat) => {
    if (chat.type === 'group') {
      setShowGroupMembers(true);
    }
  };

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

  return (
    <div className={`chat-container bg-white dark:bg-gray-900 flex flex-col h-full ${className}`}>
      {/* Chat Header - Fixed at top */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <ChatHeader
          chat={chat}
          onVideoCall={onVideoCall}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onInfo={handleInfo}
          onCallHistory={onCallHistory}
          isMobile={isMobile}
        />
      </div>

      {/* Messages - Scrollable Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-gray-800 min-h-0 pb-2">
        <ChatMessageList
          chatId={chat._id}
          typingUsers={typingUsers}
          onReply={handleReply}
          onMarkAsRead={debouncedMarkAsRead}
          isMobile={isMobile}
        />
      </div>

      {/* Message Input - Fixed at bottom */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 min-h-[80px]">
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
        <GroupMembersModal
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