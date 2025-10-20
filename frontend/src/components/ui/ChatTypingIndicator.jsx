import React from 'react';
import UserAvatar from './UserAvatar';

const TypingIndicator = ({ typingUsers = [], className = '' }) => {
  if (typingUsers.length === 0) return null;

  return (
    <div className={`flex items-center gap-2 p-2 ${className}`}>
      <div className="flex -space-x-2">
        {typingUsers.slice(0, 3).map((user, index) => (
          <div key={user.userId} className="relative">
            <UserAvatar 
              user={{ name: user.name }} 
              size="sm" 
              className="border-2 border-white dark:border-gray-800"
            />
          </div>
        ))}
      </div>
      
      <div className="flex items-center gap-1">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {typingUsers.length === 1 
            ? `${typingUsers[0].name} is typing`
            : `${typingUsers.length} people are typing`
          }
        </span>
        
        <div className="flex gap-1">
          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
