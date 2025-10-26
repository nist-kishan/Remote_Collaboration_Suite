import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  MoreVertical, 
  Reply, 
  Smile,
  Image as ImageIcon,
  Video,
  FileText,
  Download
} from 'lucide-react';
import UserAvatar from './UserAvatar';
import LazyLoadedImage from './LazyLoadedImage';
import OptimizedVideoPlayer from './OptimizedVideoPlayer';
// Removed MediaViewer import - using inline previews instead

const MessageBubble = ({ 
  message, 
  onReply, 
  onReact,
  showAvatar = true,
  showTimestamp = true,
  className = '' 
}) => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  // Removed MediaViewer state - using inline previews instead

  const isOwnMessage = message.sender._id === user?._id;
  const reactions = message.reactions || [];
  const emojis = ['👍', '❤️', '😄', '😮', '😢', '🙏'];

  const handleReaction = (emoji) => {
    onReact(message._id, emoji);
    setShowReactions(false);
    setShowMenu(false);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu || showReactions) {
        const target = event.target;
        const isMenuButton = target.closest('[data-menu-button]');
        const isMenuContent = target.closest('[data-menu-content]');
        const isReactionContent = target.closest('[data-reaction-content]');
        
        if (!isMenuButton && !isMenuContent && !isReactionContent) {
          setShowMenu(false);
          setShowReactions(false);
        }
      }
    };

    if (showMenu || showReactions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu, showReactions]);

  const renderMessageContent = () => {
    switch (message.type) {
      case 'image':
        // Don't render if URL is a blob (temporary/invalid)
        if (message.media[0]?.url?.startsWith('blob:')) {
          return (
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl max-w-xs">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Image preview unavailable</p>
              </div>
            </div>
          );
        }
        
        return (
          <LazyLoadedImage
            src={message.media[0]?.url}
            alt="Shared image"
            className="w-full"
            maxHeight="max-h-80"
            downloadName={message.media[0]?.name || 'image'}
          />
        );
      
      case 'video':
        // Don't render if URL is a blob (temporary/invalid)
        if (message.media[0]?.url?.startsWith('blob:')) {
          return (
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl max-w-xs">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Video preview unavailable</p>
              </div>
            </div>
          );
        }
        
        return (
          <OptimizedVideoPlayer
            src={message.media[0]?.url}
            poster={message.media[0]?.thumbnail}
            className="w-full"
            maxHeight="max-h-80"
            downloadName={message.media[0]?.name || 'video'}
          />
        );
      
      case 'audio':
        return (
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-2xl max-w-full">
            <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <audio 
                src={message.media[0]?.url} 
                controls 
                className="w-full h-8"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const nextSibling = e.target.nextSibling;
                  if (nextSibling) {
                    nextSibling.style.display = 'block';
                  }
                }}
              />
              <div className="hidden text-center py-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Audio preview unavailable</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const link = document.createElement('a');
                link.href = message.media[0]?.url;
                link.download = message.media[0]?.name || 'audio';
                link.click();
              }}
              className="p-2 text-gray-500 hover:text-indigo-600 transition-colors"
              title="Download audio"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        );
      
      case 'file':
        return (
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-2xl max-w-full">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {message.media[0]?.name || 'File'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {(message.media[0]?.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <a
              href={message.media[0]?.url}
              download
              className="flex-shrink-0 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </a>
          </div>
        );
      
      default:
        return (
          <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
            {message.content}
          </p>
        );
    }
  };

  return (
    <div className={`flex gap-2 mb-2 px-2 ${isOwnMessage ? 'justify-end' : 'justify-start'} ${className}`}>
      {!isOwnMessage && showAvatar && (
        <UserAvatar 
          user={message.sender} 
          size="sm" 
          className="flex-shrink-0" 
        />
      )}

      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[85%] min-w-0`}>

        <div className="relative group w-full">
          <div
            className={`px-4 py-3 rounded-2xl w-full shadow-sm ${
              isOwnMessage 
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 text-white shadow-indigo-200 dark:shadow-indigo-900/50' 
                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 shadow-gray-200 dark:shadow-gray-800/50'
            }`}
          >
            {message.replyTo && (
              <div className={`mb-2 pb-2 border-l-2 ${
                isOwnMessage ? 'border-white/30' : 'border-indigo-400 dark:border-indigo-500'
              } pl-2`}>
                <p className={`text-xs font-medium ${
                  isOwnMessage ? 'text-white/80' : 'text-indigo-600 dark:text-indigo-400'
                }`}>
                  {message.replyTo.sender.name}
                </p>
                <p className={`text-xs ${
                  isOwnMessage ? 'text-white/70' : 'text-gray-600 dark:text-gray-300'
                }`}>
                  {message.replyTo.content?.substring(0, 50)}
                  {message.replyTo.content?.length > 50 && '...'}
                </p>
              </div>
            )}

            {renderMessageContent()}

            {message.isEdited && (
              <span className={`text-xs mt-1 ${
                isOwnMessage ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
              }`}>
                (edited)
              </span>
            )}
          </div>

          {/* Reactions */}
          {reactions.length > 0 && (
            <div className={`flex flex-wrap gap-1 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
              {reactions.map((reaction, index) => (
                <span
                  key={index}
                  className="text-sm bg-white dark:bg-gray-700 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-600"
                >
                  {reaction.emoji}
                </span>
              ))}
            </div>
          )}

          {/* Message Menu */}
          <div className={`absolute top-0 ${isOwnMessage ? 'right-0' : 'left-0'} opacity-0 group-hover:opacity-100 transition-opacity`}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
              data-menu-button
            >
              <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>

            {showMenu && (
              <div className={`absolute ${isOwnMessage ? 'bottom-full right-0 mb-2' : 'bottom-full left-0 mb-2'} bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-[150px]`} data-menu-content>
                <button
                  onClick={() => {
                    onReply(message);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Reply className="w-4 h-4" />
                  Reply
                </button>
                
                <button
                  onClick={() => {
                    setShowReactions(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Smile className="w-4 h-4" />
                  React
                </button>
              </div>
            )}

            {/* Reactions Picker */}
            {showReactions && (
              <div className={`absolute ${isOwnMessage ? 'bottom-full right-0 mb-2' : 'bottom-full left-0 mb-2'} bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-50`} data-reaction-content>
                <div className="flex gap-2">
                  {emojis.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => handleReaction(emoji)}
                      className="text-xl hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {showTimestamp && (
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-2 font-medium">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        )}
      </div>

      {isOwnMessage && showAvatar && (
        <UserAvatar 
          user={user} 
          size="sm" 
          className="flex-shrink-0" 
        />
      )}
      {/* Removed MediaViewer - using inline previews instead */}
    </div>
  );
};

export default MessageBubble;
