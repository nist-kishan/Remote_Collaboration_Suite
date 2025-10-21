import React from 'react';

const UserAvatar = ({ 
  user, 
  size = 'md', 
  className = '', 
  showOnlineStatus = false,
  onClick 
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getBackgroundColor = (name) => {
    if (!name) return 'bg-gray-500';
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div 
      className={`relative inline-flex items-center justify-center rounded-full ${sizeClasses[size]} ${className}`}
      onClick={onClick}
    >
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={user.name || 'User'}
          className={`${sizeClasses[size]} rounded-full object-cover`}
        />
      ) : (
        <div 
          className={`${sizeClasses[size]} ${getBackgroundColor(user?.name)} rounded-full flex items-center justify-center text-white font-medium ${textSizeClasses[size]}`}
        >
          {getInitials(user?.name || user?.username)}
        </div>
      )}
      
      {showOnlineStatus && user?.isOnline && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
      )}
    </div>
  );
};

export default UserAvatar;
