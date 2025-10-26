import React from 'react';
import { useTotalUnreadCount } from '../../hook/useChat';

const TotalUnreadBadge = ({ className = '' }) => {
  const { data: unreadData, isLoading, error } = useTotalUnreadCount();
  
  if (isLoading) {
    return null;
  }

  if (error) {

    return null;
  }

  const totalUnreadCount = unreadData?.data?.totalUnreadCount || 0;
  
  if (totalUnreadCount === 0) {
    return null;
  }

  return (
    <div className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium text-white bg-red-500 rounded-full ${className}`}>
      {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
    </div>
  );
};

export default TotalUnreadBadge;
