import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Plus, Search } from 'lucide-react';
import ChatItem from '../ui/ChatItem';
import { useChats, useArchiveChat } from '../../hook/useChat';
import { useUserSearch } from '../../hook/useUsers';

const ChatList = ({ 
  selectedChatId, 
  onChatSelect, 
  onNewChat,
  onCall,
  onVideoCall,
  className = '' 
}) => {
  const { user } = useSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  
  const { data: chatsData, isLoading, error } = useChats();
  const { data: searchResults } = useUserSearch(searchQuery, showUserSearch && searchQuery.length >= 2);
  const archiveChatMutation = useArchiveChat();

  const chats = chatsData?.data?.data?.chats || [];
  const users = searchResults?.data?.data?.users || [];

  const handleChatSelect = (chat) => {
    onChatSelect?.(chat);
  };

  const handleMenuClick = (chat) => {
    // Handle chat menu actions
  };

  const handleArchiveChat = (chat) => {
    archiveChatMutation.mutate(chat._id);
  };

  const handleUserSelect = (selectedUser) => {
    onNewChat?.(selectedUser);
    setShowUserSearch(false);
    setSearchQuery('');
  };

  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    
    const chatName = chat.type === 'group' 
      ? chat.name 
      : chat.participants?.find(p => p.user?._id !== user._id)?.user?.name;
    
    return chatName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className={`flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Chats</h2>
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="flex-1 overflow-y-auto">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                <div className="flex-1">
                  <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                  <div className="w-32 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Chats</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500">Failed to load chats</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {error.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Chats</h2>
          <button
            onClick={() => setShowUserSearch(!showUserSearch)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="New chat"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {showUserSearch && searchQuery.length >= 2 && users.length > 0 && (
          <div className="p-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 px-2">
              Start new chat with:
            </h3>
            {users.map((user) => (
              <div
                key={user._id}
                onClick={() => handleUserSelect(user)}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer rounded-lg transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                  <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredChats.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400">No chats yet</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                Start a new conversation
              </p>
            </div>
          </div>
        ) : (
          filteredChats
            .filter((chat, index, self) => 
              // Remove duplicates based on _id
              index === self.findIndex(c => c._id === chat._id)
            )
            .map((chat) => (
              <ChatItem
                key={chat._id}
                chat={chat}
                isSelected={selectedChatId === chat._id}
                onClick={() => handleChatSelect(chat)}
                onCall={onCall}
                onVideoCall={onVideoCall}
                onMenuClick={handleMenuClick}
              />
            ))
        )}
      </div>
    </div>
  );
};

export default ChatList;