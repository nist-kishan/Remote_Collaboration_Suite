import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Reply, 
  Smile,
  Image as ImageIcon,
  Video,
  FileText,
  Download
} from 'lucide-react';
import ReadReceipt from './ReadReceipt';

const MessageBubble = ({ message, onReply, onEdit, onDelete, onReact, chatId }) => {
  const { user } = useSelector((state) => state.auth);
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const isOwnMessage = message.sender._id === user._id;
  const isOptimistic = message.isOptimistic;
  const reactions = message.reactions || [];

  const emojis = ['👍', '❤️', '😄', '😮', '😢', '🙏'];

  const handleReaction = (emoji) => {
    onReact(message._id, emoji);
    setShowReactions(false);
    setShowMenu(false);
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="rounded-lg overflow-hidden">
            <img
              src={message.media[0]?.url}
              alt="Shared image"
              className="max-w-xs max-h-64 object-contain cursor-pointer"
              onClick={() => window.open(message.media[0]?.url, '_blank')}
            />
          </div>
        );
      
      case 'video':
        return (
          <div className="rounded-lg overflow-hidden">
            <video
              src={message.media[0]?.url}
              controls
              className="max-w-xs max-h-64"
            />
          </div>
        );
      
      case 'audio':
        return (
          <div className="flex items-center gap-2">
            <audio src={message.media[0]?.url} controls />
          </div>
        );
      
      case 'file':
        return (
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
            <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {message.media[0]?.name || 'File'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {(message.media[0]?.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <a
              href={message.media[0]?.url}
              download
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
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
    <div className={`flex gap-2 mb-2 ${isOwnMessage ? 'justify-end' : 'justify-start'} ${isOptimistic ? 'opacity-70' : ''}`}>
      {!isOwnMessage && (
        <img
          src={message.sender.avatar || '/default-avatar.png'}
          alt={message.sender.name}
          className="w-8 h-8 rounded-full object-cover"
        />
      )}

      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {!isOwnMessage && (
          <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-2">
            {message.sender.name}
          </span>
        )}

        <div className="relative group">
          <div
            className={`px-4 py-2 rounded-2xl ${
              isOwnMessage
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
            }`}
          >
            {message.replyTo && (
              <div className={`mb-2 pb-2 border-l-2 ${
                isOwnMessage ? 'border-white/30' : 'border-gray-400'
              } pl-2`}>
                <p className={`text-xs font-medium ${
                  isOwnMessage ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {message.replyTo.sender.name}
                </p>
                <p className={`text-xs ${
                  isOwnMessage ? 'text-white/70' : 'text-gray-500 dark:text-gray-500'
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
          <div className={`absolute top-0 ${isOwnMessage ? 'left-0' : 'right-0'} opacity-0 group-hover:opacity-100 transition-opacity`}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>

            {showMenu && (
              <div className={`absolute top-8 ${isOwnMessage ? 'left-0' : 'right-0'} bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10 min-w-[150px]`}>
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

                {isOwnMessage && (
                  <>
                    <button
                      onClick={() => {
                        onEdit(message);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    
                    <button
                      onClick={() => {
                        onDelete(message._id);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Reactions Picker */}
            {showReactions && (
              <div className={`absolute top-8 ${isOwnMessage ? 'left-10' : 'right-10'} bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-10`}>
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

        <div className="flex items-center gap-2 mt-1 px-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          {isOwnMessage && chatId && (
            <ReadReceipt 
              chatId={chatId} 
              messageId={message._id} 
              senderId={message.sender._id}
            />
          )}
        </div>
      </div>

      {isOwnMessage && (
        <img
          src={user.avatar || '/default-avatar.png'}
          alt={user.name}
          className="w-8 h-8 rounded-full object-cover"
        />
      )}
    </div>
  );
};

export default MessageBubble;

