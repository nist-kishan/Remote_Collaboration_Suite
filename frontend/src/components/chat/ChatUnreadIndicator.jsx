import React from 'react';
import { useUnreadCount } from '../../hook/useChat';

const UnreadBadge = ({ chatId, className = '' }) => {
  const isVirtualChat = chatId && (chatId.startsWith('chatted_user_') || chatId.startsWith('chatted_group_'));

  const { data: unreadData, isLoading, error } = useUnreadCount(chatId, {
    enabled: !isVirtualChat 
  });
  
  if (isVirtualChat) {
    return null;
  }
  
  if (isLoading) {
    return null;
  }

  if (error) {
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
