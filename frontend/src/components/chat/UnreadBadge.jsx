import React from 'react';
import { useUnreadCount } from '../../hook/useChat';

const UnreadBadge = ({ chatId, className = '' }) => {
  // Check if this is a virtual chat ID (chatted_user_ or chatted_group_)
  const isVirtualChat = chatId && (chatId.startsWith('chatted_user_') || chatId.startsWith('chatted_group_'));
  
  // For virtual chats, don't fetch unread count as they don't exist in the database
  const { data: unreadData, isLoading, error } = useUnreadCount(chatId, {
    enabled: !isVirtualChat // Only fetch for real chat IDs
  });
  
  if (isVirtualChat) {
    // For virtual chats, return null (no unread count)
    return null;
  }
  
  if (isLoading) {
    return null;
  }

  if (error) {
    console.error('Error fetching unread count:', error);
    return null;
  }

  const unreadCount = unreadData?.data?.unreadCount || 0;
  
  if (unreadCount === 0) {
    return null;
  }

  return (
    <div className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium text-white bg-red-500 rounded-full ${className}`}>
      {unreadCount > 99 ? '99+' : unreadCount}
    </div>
  );
};

export default UnreadBadge;
