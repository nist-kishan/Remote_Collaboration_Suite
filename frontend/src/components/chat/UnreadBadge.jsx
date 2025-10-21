import React from 'react';

const UnreadBadge = ({ chat, count, maxCount = 99, className = '', currentUserId }) => {
  // Get unread count from chat object or direct count
  const getUnreadCount = () => {
    if (count !== undefined) return count;
    if (!chat) return 0;
    
    // Handle both Map and number formats for unread count
    if (typeof chat.unreadCount === 'object' && chat.unreadCount instanceof Map && currentUserId) {
      return chat.unreadCount.get(currentUserId) || 0;
    }
    return chat.unreadCount || 0;
  };

  const unreadCount = getUnreadCount();
  if (!unreadCount || unreadCount === 0) return null;

  const displayCount = unreadCount > maxCount ? `${maxCount}+` : unreadCount.toString();

  return (
    <span 
      className={`inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-full min-w-[20px] h-5 ${className}`}
    >
      {displayCount}
    </span>
  );
};

export default UnreadBadge;
