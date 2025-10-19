import React from 'react';
import { X } from 'lucide-react';
import Button from '../ui/Button';

const WhiteboardChat = ({
  showChat,
  chatMessages,
  newMessage,
  onClose,
  onMessageChange,
  onSendMessage,
}) => {
  if (!showChat) return null;

  return (
    <div className="absolute inset-0 sm:relative sm:w-80 bg-gradient-to-b from-white to-indigo-50/30 dark:from-gray-800 dark:to-indigo-950/30 border-l border-gray-200 dark:border-gray-700 flex flex-col z-50 flex-shrink-0 shadow-xl">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-500">
        <h3 className="font-bold text-white text-lg">💬 Chat</h3>
        <button
          onClick={onClose}
          className="sm:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.map((message, index) => (
          <div key={index} className="flex flex-col group">
            <div className="flex items-center gap-2 mb-1">
              <div 
                className="w-2 h-2 rounded-full ring-2 ring-white dark:ring-gray-800"
                style={{ backgroundColor: message.userInfo?.color || '#3B82F6' }}
              />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {message.userInfo?.name}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="ml-4 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm text-gray-900 dark:text-white">
                {message.message}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          <Button
            onClick={onSendMessage}
            disabled={!newMessage.trim()}
            size="sm"
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WhiteboardChat;

