import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import MessageBubble from '../ui/ChatMessageBubble';
import TypingIndicator from '../ui/ChatTypingIndicator';
import { SkeletonMessageList } from '../ui/Skeleton';
import { useChat } from '../../hook/useChat';
import { useMessages, useEditMessage, useDeleteMessage, useAddReaction } from '../../hook/useMessages';

const MessageList = ({ 
  chatId, 
  typingUsers = [],
  onReply,
  onMarkAsRead,
  isMobile = false,
  className = '' 
}) => {
  const { user } = useSelector((state) => state.auth);
  const messagesEndRef = useRef(null);
  const [page, setPage] = useState(1);
  const [allMessages, setAllMessages] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const { data: messagesData, isLoading, error } = useMessages(chatId, { page, limit: 50 });
  const editMessageMutation = useEditMessage();
  const deleteMessageMutation = useDeleteMessage();
  const addReactionMutation = useAddReaction();

  const messages = messagesData?.data?.data?.messages || [];
  const pagination = messagesData?.data?.data?.pagination;

  // Update all messages when new data arrives
  useEffect(() => {
    if (messages.length > 0) {
      if (page === 1) {
        // First page - replace all messages
        setAllMessages(messages);
      } else {
        // Subsequent pages - prepend older messages, but avoid duplicates
        setAllMessages(prev => {
          const existingIds = new Set(prev.map(msg => msg._id));
          const newMessages = messages.filter(msg => !existingIds.has(msg._id));
          return [...newMessages, ...prev];
        });
      }
      setHasMore(pagination ? page < pagination.pages : false);
    }
  }, [messages, page, pagination]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (page === 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [allMessages.length, page]);

  // Load more messages when scrolling to top and mark as read when scrolling to bottom
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    
    // Load more messages when scrolling to top
    if (scrollTop < 100 && hasMore && !isLoadingMore) {
      setIsLoadingMore(true);
      setPage(prev => prev + 1);
      setTimeout(() => setIsLoadingMore(false), 1000);
    }
    
    // Mark messages as read when user scrolls to bottom (within 50px)
    if (scrollHeight - scrollTop - clientHeight < 50 && onMarkAsRead) {
      onMarkAsRead();
    }
  };

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

  if (isLoading && page === 1) {
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

  if (allMessages.length === 0) {
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
    <div 
      className={`h-full p-3 md:p-4 space-y-2 md:space-y-3 pb-4 overflow-x-hidden overflow-y-auto ${className}`}
      onScroll={handleScroll}
    >
      {/* Load more indicator */}
      {isLoadingMore && (
        <div className="flex justify-center p-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
        </div>
      )}
      
      {allMessages
        .filter((message, index, self) => 
          // Remove duplicates based on _id
          index === self.findIndex(m => m._id === message._id)
        )
        .map((message) => (
          <MessageBubble
            key={message._id}
            message={message}
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
