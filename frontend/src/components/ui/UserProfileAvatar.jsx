import React from 'react';
import { User } from 'lucide-react';
import { SkeletonAvatar } from './SkeletonLoader';

const UserAvatar = ({ 
  user, 
  size = 'md', 
  showOnlineStatus = false, 
  isOnline = false,
  isLoading = false,
  className = '' 
}) => {
  if (isLoading || !user) {
    return <SkeletonAvatar size={size} className={className} />;
  }
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const statusSizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
  };

  const avatarUrl = user?.avatar || user?.profilePicture;
  const userName = user?.name || user?.username || 'Unknown User';
  const initials = userName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`relative inline-block ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center`}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={userName}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className={`w-full h-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium ${
            avatarUrl ? 'hidden' : 'flex'
          }`}
        >
          {initials || <User className="w-1/2 h-1/2" />}
        </div>
      </div>
      
      {showOnlineStatus && (
        <div className={`absolute bottom-0 right-0 ${statusSizeClasses[size]} rounded-full border-2 border-white dark:border-gray-900 ${
          isOnline ? 'bg-green-500' : 'bg-gray-400'
        }`} />
      )}
    </div>
  );
};

export default UserAvatar;
