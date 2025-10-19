import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getUserChats } from '../../api/chatApi';
import { useSocket } from '../../hook/useSocket';
import { MessageSquare, Users, Search, Plus, Loader2 } from 'lucide-react';
import Button from '../ui/Button';

const ChatListOptimized = ({ onSelectChat, onCreateGroup, onNewChat }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChatId, setSelectedChatId] = useState(null);
  const { user } = useSelector((state) => state.auth);
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  // Infinite query for paginated chat loading
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ['chats', searchTerm],
    queryFn: ({ pageParam = 1 }) => {
      return getUserChats({ page: pageParam, limit: 20, search: searchTerm });
    },
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage.data || {};
      return pagination && pagination.page < pagination.pages ? pagination.page + 1 : undefined;
    },
    staleTime: 0, // Always fetch fresh data for real-time updates
    refetchOnWindowFocus: true,
    enabled: !!user, // Only fetch chats if user is authenticated
  });


  // Flatten all pages into a single array
  const allChats = useMemo(() => {
    const chats = data?.pages?.flatMap(page => page.data?.chats || []) || [];
    
    return chats;
  }, [data, user]);

  // Filter and sort chats based on search term and lastMessageAt
  const filteredChats = useMemo(() => {
    // Filter based on search term
    const filtered = !searchTerm.trim() ? allChats : allChats.filter(chat => {
      if (chat.type === 'group') {
        return chat.name?.toLowerCase().includes(searchTerm.toLowerCase());
      } else {
        const otherParticipant = chat.participants?.find(
          p => p.user._id !== user._id
        );
        return otherParticipant?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      }
    });
    
    // Sort by lastMessageAt (most recent messages first)
    return filtered.sort((a, b) => {
      const aTime = new Date(a.lastMessageAt || a.updatedAt || 0);
      const bTime = new Date(b.lastMessageAt || b.updatedAt || 0);
      return bTime - aTime;
    });
  }, [allChats, searchTerm, user._id]);

  // Listen for new messages to update chat list
  useEffect(() => {
    if (socket) {
      const handleNewMessage = (data) => {
        
        // Update chat list cache immediately
        queryClient.setQueryData(['chats', searchTerm], (oldData) => {
          if (!oldData) return oldData;
          
          // Find the chat in the list and move it to the top
          const updatedPages = oldData.pages.map(page => {
            const chats = page.data?.chats || [];
            const chatIndex = chats.findIndex(chat => chat._id === data.chatId);
            
            if (chatIndex !== -1) {
              // Remove chat from current position and add to top
              const [updatedChat] = chats.splice(chatIndex, 1);
              updatedChat.lastMessage = data.message;
              updatedChat.lastMessageAt = data.message.createdAt;
              updatedChat.updatedAt = data.message.createdAt;
              chats.unshift(updatedChat); // Add to beginning
            }
            
            return {
              ...page,
              data: {
                ...page.data,
                chats
              }
            };
          });
          
          return {
            ...oldData,
            pages: updatedPages
          };
        });
        
        // Also invalidate to ensure fresh data
        queryClient.invalidateQueries(['chats']);
      };

      socket.on('new_message', handleNewMessage);

      return () => {
        socket.off('new_message', handleNewMessage);
      };
    }
  }, [socket, queryClient, searchTerm]);

  // Virtual scrolling setup
  const [containerHeight, setContainerHeight] = useState(600);
  const [itemHeight] = useState(80);
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStartIndex = Math.floor(scrollTop / itemHeight);
  const visibleEndIndex = Math.min(
    visibleStartIndex + Math.ceil(containerHeight / itemHeight) + 2,
    filteredChats.length
  );

  const visibleChats = filteredChats.slice(visibleStartIndex, visibleEndIndex);

  // Load more when scrolling near bottom
  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    setScrollTop(scrollTop);

    // Load more when 200px from bottom
    if (scrollHeight - scrollTop - clientHeight < 200 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Update container height on resize
  useEffect(() => {
    const updateHeight = () => {
      const container = document.getElementById('chat-list-container');
      if (container) {
        setContainerHeight(container.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Auto-refresh chat list every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  const formatLastMessage = (chat) => {
    if (!chat.lastMessage) return 'No messages yet';
    const message = chat.lastMessage;
    
    if (message.type === 'image') return '📷 Image';
    if (message.type === 'video') return '🎥 Video';
    if (message.type === 'audio') return '🎵 Audio';
    if (message.type === 'file') return '📄 File';
    
    return message.content?.substring(0, 50) + (message.content?.length > 50 ? '...' : '');
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getChatName = (chat) => {
    if (chat.type === 'group') {
      return chat.name || 'Group Chat';
    }
    const otherParticipant = chat.participants?.find(
      p => p.user._id !== user._id
    );
    return otherParticipant?.user?.name || 'Unknown User';
  };

  const getChatAvatar = (chat) => {
    if (chat.type === 'group') {
      return chat.avatar || null;
    }
    const otherParticipant = chat.participants?.find(
      p => p.user._id !== user._id
    );
    return otherParticipant?.user?.avatar || null;
  };

  const getUnreadCount = (chat) => {
    return chat.unreadCount?.get?.(user._id) || 0;
  };

  // Show authentication required message if user is not logged in
  if (!user) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Chats</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">Authentication Required</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Please log in to access your chats
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Chats</h2>
            <div className="flex items-center gap-2">
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Chat
              </Button>
              <Button size="sm" variant="outline" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Group
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchTerm || ''}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-400">Loading chats...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Chats</h2>
            <div className="flex items-center gap-2">
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Chat
              </Button>
              <Button size="sm" variant="outline" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Group
              </Button>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-2">Failed to load chats</p>
            <Button onClick={() => refetch()} size="sm">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Chats</h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={onNewChat}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </Button>
            <Button
              onClick={onCreateGroup}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Group
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm || ''}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Chat List with Virtual Scrolling */}
      <div 
        id="chat-list-container"
        className="flex-1 overflow-y-auto"
        onScroll={handleScroll}
      >
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-semibold mb-2">
              {isLoading ? 'Loading chats...' : 'No chats yet'}
            </p>
            <p className="text-sm text-center mb-4">
              {searchTerm ? 'No chats match your search' : 'Start a conversation to see your chats here'}
            </p>
            {!searchTerm && !isLoading && (
              <Button onClick={onNewChat} size="sm">
                Start New Chat
              </Button>
            )}
            {error && (
              <p className="text-red-500 text-sm mt-2">
                Error loading chats: {error.message}
              </p>
            )}
          </div>
        ) : (
          <div style={{ height: filteredChats.length * itemHeight, position: 'relative' }}>
            {visibleChats.map((chat, index) => {
              const actualIndex = visibleStartIndex + index;
              const isSelected = selectedChatId === chat._id;
              const unreadCount = getUnreadCount(chat);
              
              return (
                <div
                  key={chat._id}
                  style={{
                    position: 'absolute',
                    top: actualIndex * itemHeight,
                    left: 0,
                    right: 0,
                    height: itemHeight,
                  }}
                >
                  <div
                    onClick={() => {
                      setSelectedChatId(chat._id);
                      onSelectChat(chat);
                    }}
                    className={`flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-800 ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0 relative">
                      {getChatAvatar(chat) ? (
                        <img
                          src={getChatAvatar(chat)}
                          alt={getChatName(chat)}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                          {chat.type === 'group' ? (
                            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                          ) : (
                            <MessageSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                          )}
                        </div>
                      )}
                      {unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </div>
                      )}
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {getChatName(chat)}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                          {formatTime(chat.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${
                          unreadCount > 0 
                            ? 'text-gray-900 dark:text-gray-100 font-medium' 
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {formatLastMessage(chat)}
                        </p>
                        {chat.type === 'group' && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                            <Users className="w-3 h-3" />
                            <span>{chat.participants?.length || 0}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Loading More Indicator */}
        {isFetchingNextPage && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600 mr-2" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Loading more chats...</span>
          </div>
        )}

        {/* End of List */}
        {!hasNextPage && filteredChats.length > 0 && (
          <div className="flex items-center justify-center py-4">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              You've reached the end of your chats
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatListOptimized;
