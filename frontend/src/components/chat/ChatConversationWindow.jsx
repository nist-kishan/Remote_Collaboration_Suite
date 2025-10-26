import React, { useState, useEffect, useCallback, forwardRef } from 'react';
import ChatWindowHeader from './ChatWindowHeader';
import ChatMessageList from './ChatMessageList';
import ChatMessageInput from '../ui/ChatMessageInput';
import ChatGroupMembersModal from './ChatGroupMembersModal';
import { useSocket } from '../../hook/useSocket';
import { useTyping } from '../../hook/useTyping';
import { useQueryClient } from '@tanstack/react-query';

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
  const [replyTo, setReplyTo] = useState(null);
  const [ setEditingMessage] = useState(null);
  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  const { socket } = useSocket();
  const { 
    typingUsers, 
    startTyping,  
    handleTypingEvent, 
    handleStopTypingEvent 
  } = useTyping(chat?._id);
  
  const queryClient = useQueryClient();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedMarkAsRead = useCallback(
    debounce(() => {
      if (socket && socket.connected && chat?._id) {
        socket.emit('mark_as_read', { chatId: chat._id });
      }
    }, 1000),
    [socket, chat?._id]
  );

  useEffect(() => {
    if (!socket || !chat?._id) return;

    if (!socket.connected) {
      socket.connect();
      return; 
    }

    socket.emit('join_chat', { chatId: chat._id });

    debouncedMarkAsRead();

    const handleNewMessage = (data) => {
      if (!data || !data.message) {
        return;
      }

      if (data.chatId === chat._id) {
        queryClient.invalidateQueries(['messages', chat._id]);
        queryClient.invalidateQueries(['chats']);
        queryClient.invalidateQueries(['recentChats']);
        queryClient.invalidateQueries(['groupChats']);
      }
    };

    const handleChatJoined = () => {
      // Chat joined successfully
    };

    const handleError = (error) => {
      if (typeof error === 'string') {
        if (error === 'Failed to send message' || error.includes('Failed to send message')) {
          socket.connect();
        }
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('chat_joined', handleChatJoined);
    socket.on('user_typing', handleTypingEvent);
    socket.on('user_stop_typing', handleStopTypingEvent);
    socket.on('error', handleError);

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
  }, [socket, chat._id, queryClient, handleTypingEvent, handleStopTypingEvent, debouncedMarkAsRead]);

  const handleSendMessage = (data) => {
    if (!chat?._id || isSendingMessage) {

      return;
    }

    setIsSendingMessage(true);
    const messageId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const messageData = {
      chatId: chat._id,
      content: data.content,
      type: data.type || 'text',
      tempId: messageId 
    };

    if (data.media) {
      messageData.media = data.media;
    }


    if (data.replyTo) {
      messageData.replyTo = data.replyTo;
    }

    if (socket && socket.connected) {
      setIsSendingMessage(false);

      const confirmationHandler = (data) => {

        queryClient.invalidateQueries(['messages', chat._id]);
        queryClient.invalidateQueries(['chats']);
        queryClient.invalidateQueries(['recentChats']);
        queryClient.invalidateQueries(['groupChats']);
        
        socket.off('message_confirmed', confirmationHandler);
      };
      
      socket.on('message_confirmed', confirmationHandler);

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

      // eslint-disable-next-line no-undef
      sendMessageMutation.mutate({
        chatId: chat._id,
        data: { ...messageData, wasSentViaSocket: false } 
      });
      setTimeout(() => setIsSendingMessage(false), 1000);
    }
  };

  const handleReply = (message) => {
    setReplyTo(message);
    setEditingMessage(null);
  };


  const handleCancelReply = () => {
    setReplyTo(null);
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
    <div className={`chat-container bg-white dark:bg-gray-900 flex flex-col h-full w-full overflow-hidden relative ${className}`}>
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 relative z-50 top-0">
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

      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-gray-800 min-h-0 pb-2 px-2 sm:px-4 relative z-10">
        <ChatMessageList
          chatId={chat._id}
          typingUsers={typingUsers}
          onReply={handleReply}
          onMarkAsRead={debouncedMarkAsRead}
          isMobile={isMobile}
        />
      </div>

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