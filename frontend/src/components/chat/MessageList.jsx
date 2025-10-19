import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import MessageBubble from '../ui/MessageBubble';
import TypingIndicator from '../ui/TypingIndicator';
import { SkeletonMessageList } from '../ui/Skeleton';
import { useMessages, useEditMessage, useDeleteMessage, useAddReaction } from '../../hook/useMessages';
import { useReadStatus } from '../../hook/useReadStatus';

const MessageList = ({ 
  chatId, 
  typingUsers = [],
  onReply,
  isMobile = false,
  className = '' 
}) => {
  const { user } = useSelector((state) => state.auth);
  const messagesEndRef = useRef(null);
  const { data: messagesData, isLoading, error } = useMessages(chatId);
  const editMessageMutation = useEditMessage();
  const deleteMessageMutation = useDeleteMessage();
  const addReactionMutation = useAddReaction();
  const { handleChatOpened, handleMessageReceived } = useReadStatus(chatId);

  const messages = messagesData?.data?.data?.messages || [];

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Mark messages as read when chat is opened and scrolled to bottom
  useEffect(() => {
    if (messages.length > 0) {
      handleChatOpened();
    }
  }, [messages.length, handleChatOpened]);

  // Handle message received for delivery status
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      handleMessageReceived(lastMessage);
    }
  }, [messages, handleMessageReceived]);

  const handleEditMessage = (message) => {
    const newContent = prompt('Edit message:', message.content);
    if (newContent && newContent !== message.content) {
      editMessageMutation.mutate({
        chatId,
        messageId: message._id,
        content: newContent
      });
    }
  };

  const handleDeleteMessage = (messageId) => {
    deleteMessageMutation.mutate({
      chatId,
      messageId
    });
  };

  const handleReact = (messageId, emoji) => {
    addReactionMutation.mutate({
      chatId,
      messageId,
      emoji
    });
  };

  if (isLoading) {
    return (
      <div className={`h-full p-2 md:p-4 ${className}`}>
        <SkeletonMessageList count={8} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex-1 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <p className="text-red-500">Failed to load messages</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={`flex-1 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400">No messages yet</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            Start a conversation by sending a message
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full p-3 md:p-4 space-y-2 md:space-y-3 pb-4 overflow-x-hidden ${className}`}>
      {messages
        .filter((message, index, self) => 
          // Remove duplicates based on _id
          index === self.findIndex(m => m._id === message._id)
        )
        .map((message) => (
          <MessageBubble
            key={message._id}
            message={message}
            chatId={chatId}
            onReply={onReply}
            onEdit={handleEditMessage}
            onDelete={handleDeleteMessage}
            onReact={handleReact}
            isMobile={isMobile}
          />
        ))}
      
      {typingUsers.length > 0 && (
        <TypingIndicator typingUsers={typingUsers} />
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
