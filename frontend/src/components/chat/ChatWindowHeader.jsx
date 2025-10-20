import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Phone, 
  Video, 
  MoreVertical, 
  Users, 
  Settings,
  Archive,
  Trash2,
  Info,
  History
} from 'lucide-react';
import UserAvatar from '../ui/UserAvatar';
import { useChat } from '../../hook/useChat';

const ChatHeader = ({ 
  chat, 
  onVideoCall, 
  onArchive, 
  onDelete,
  onInfo,
  onCallHistory,
  isMobile = false,
  className = '' 
}) => {
  const { user } = useSelector((state) => state.auth);
  const [showMenu, setShowMenu] = useState(false);
  const { isUserOnline } = useUserStatus();

  const getChatName = () => {
    if (!chat) return 'Loading...';
    if (chat.type === 'group') {
      return chat.name || 'Group Chat';
    }
    if (!chat.participants || !Array.isArray(chat.participants)) {
      return 'Unknown User';
    }
    const otherParticipant = chat.participants.find(
      p => p.user && p.user._id !== user?._id
    );
    return otherParticipant?.user?.name || 'Unknown User';
  };

  const getChatAvatar = () => {
    if (!chat) return null;
    if (chat.type === 'group') {
      return null; // Group avatar logic
    }
    if (!chat.participants || !Array.isArray(chat.participants)) {
      return null;
    }
    const otherParticipant = chat.participants.find(
      p => p.user && p.user._id !== user?._id
    );
    return otherParticipant?.user || null;
  };

  const getOnlineStatus = () => {
    if (!chat || chat.type === 'group') return false;
    const otherParticipant = chat.participants?.find(
      p => p.user && p.user._id !== user?._id
    );
    if (!otherParticipant?.user?._id) return false;
    
    // Use real-time status from useUserStatus hook
    const isOnline = isUserOnline(otherParticipant.user._id);
    console.log('ChatHeader: User status check:', {
      userId: otherParticipant.user._id,
      userName: otherParticipant.user.name,
      isOnline: isOnline
    });
    
    return isOnline;
  };

  const getParticipantCount = () => {
    if (!chat || !chat.participants) return 0;
    return chat.participants.length;
  };

  if (!chat || !user) {
    return (
      <div className={`flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          <div>
            <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between p-3 md:p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 ${className}`}>
      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
        {chat.type === 'group' ? (
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 md:w-6 md:h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
        ) : (
          <UserAvatar 
            user={getChatAvatar()} 
            size={isMobile ? "sm" : "md"} 
            showOnlineStatus={true}
            isOnline={getOnlineStatus()}
          />
        )}
        
        <div className="min-w-0 flex-1">
          <h2 className="text-sm md:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
            {getChatName()}
          </h2>
          {chat.type === 'group' ? (
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">
              {getParticipantCount()} participants
            </p>
          ) : (
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">
              {getOnlineStatus() ? 'Online' : 'Offline'}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
        {chat.type === 'one-to-one' && (
          <button
            onClick={() => onVideoCall?.(chat)}
            className="p-1.5 md:p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Video call"
          >
            <Video className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        )}
        
        <button
          onClick={() => onCallHistory?.(chat)}
          className="p-1.5 md:p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Call history"
        >
          <History className="w-4 h-4 md:w-5 md:h-5" />
        </button>

        <button
          onClick={() => onInfo?.(chat)}
          className="p-1.5 md:p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Chat info"
        >
          <Info className="w-4 h-4 md:w-5 md:h-5" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 md:p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10 min-w-[150px]">
              <button
                onClick={() => {
                  onArchive?.(chat);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Archive className="w-4 h-4" />
                Archive
              </button>
              
              <button
                onClick={() => {
                  onDelete?.(chat);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
