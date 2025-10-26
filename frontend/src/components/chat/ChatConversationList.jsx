import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getUserChats, getRecentChats, searchUsers, getChattedUsers } from '../../api/chatApi';
import { useSocket } from '../../hook/useSocket';
import { useContainerHeight } from '../../hook/useContainerHeight';
import { MessageSquare, Users, Search, Plus, Loader2, Phone, Video, MoreVertical, History } from 'lucide-react';
import CustomButton from '../ui/CustomButton';
import UserProfileAvatar from '../ui/UserProfileAvatar';
import ChatListItem from '../ui/ChatListItem';
import SkeletonLoader, { SkeletonChatList } from '../ui/SkeletonLoader';

const EnhancedChatList = ({ onSelectChat, onVideoCall, onNewChat, onCreateGroup, selectedChat }) => {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  
  const { user } = useSelector((state) => state.auth);
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('.menu-container')) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Sync selectedChatId with selectedChat from parent
  useEffect(() => {
    if (selectedChat) {
      setSelectedChatId(selectedChat._id);
    } else {
      setSelectedChatId(null);
    }
  }, [selectedChat]);

  // Use the new getRecentChats endpoint for better performance
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
    isRefetching
  } = useInfiniteQuery({
    queryKey: ['recentChats', searchTerm],
    queryFn: ({ pageParam = 1 }) => {
      return getRecentChats({ page: pageParam, limit: 20, search: searchTerm });
    },
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage.data || {};
      return pagination && pagination.page < pagination.pages ? pagination.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 30000, // 30 seconds - more reasonable for chat list updates
    enabled: !!user, // Only run query if user is authenticated
  });

  // User search query
  const { data: searchData, isLoading: isSearching } = useQuery({
    queryKey: ['searchUsers', userSearchQuery],
    queryFn: () => searchUsers({ query: userSearchQuery }),
    enabled: showNewChat && userSearchQuery.length >= 2,
    staleTime: 60000,
  });

  // Chatted users query - DISABLED to prevent duplicates
  // const { data: chattedUsersData } = useQuery({
  //   queryKey: ['chattedUsers'],
  //   queryFn: () => {
  //     return getChattedUsers({ page: 1, limit: 50 });
  //   },
  //   staleTime: 300000, // 5 minutes
  //   enabled: !!user, // Only run query if user is authenticated
  // });

  // Flatten all pages into a single array
  const allChats = useMemo(() => {
    const chats = data?.pages?.flatMap(page => {
      // Handle API response structure: page.data.data.chats
      const responseData = page.data?.data;
      return responseData?.chats || [];
    }) || [];

    return chats;
  }, [data, user]);

  // Get chatted users and convert them to virtual chat items
  const chattedUsers = useMemo(() => {
    // DISABLED: Return empty array to prevent duplicates
    // We're using only getRecentChats API now
    return [];
    
    // Handle API response structure: chattedUsersData.data.data.items
    // const responseData = chattedUsersData?.data?.data;
    // const users = responseData?.items || [];

    // return users
    //   .filter(userItem => {
    //     // Filter out items without valid structure and current user
    //     if (!userItem || !userItem.user || !userItem.user._id) {
    //       return false;
    //     }
    //     // Filter out current user - robust comparison
    //     return userItem.user._id.toString() !== user?._id.toString();
    //   })
    //   .map((userItem, index) => ({
    //     _id: `user-${userItem.user._id || `temp-${index}`}`, // Use user._id for the key
    //     type: 'user',
    //     name: userItem.user.name || 'Unknown User',
    //     avatar: userItem.user.avatar,
    //     lastMessage: userItem.lastMessage || null,
    //     unreadCount: userItem.unreadCount || 0,
    //     updatedAt: userItem.lastChatAt || userItem.user.lastSeen,
    //     isOnline: userItem.user.isOnline,
    //     user: userItem.user
    //   }));
  }, []);

  // Combine and filter chats with enhanced sorting and unread indicators
  const filteredChats = useMemo(() => {
    // Debug: Log the data sources
    // Since we're only using getRecentChats API, no need for complex deduplication
    const allItems = allChats; // Only use allChats, chattedUsers is now empty
    
    // Simple filtering for chats with messages
    const uniqueItems = allItems.filter(chat => {
      // Only include chats that have messages
      return hasMessages(chat);
    });
    
    // Helper function to check if a chat has messages
    function hasMessages(chat) {
      // For user type chats (from chattedUsers), check if lastMessage exists
      if (chat.type === 'user') {
        return chat.lastMessage && chat.lastMessage !== null;
      }
      
      // For regular chats, check if lastMessage exists and is not empty
      if (chat.lastMessage && chat.lastMessage.content && chat.lastMessage.content.trim() !== '') {
        return true;
      }
      
      // Check if there's a lastMessageAt timestamp (indicates messages were sent)
      if (chat.lastMessageAt) {
        return true;
      }
      
      // For chatted users, if there's a lastChatAt timestamp, it means there was activity
      if (chat.lastChatAt) {
        return true;
      }
      
      // If none of the above conditions are met, consider it empty
      return false;
    }
    
    // Debug: Log unique items and filtered out chats
    const filteredOutChats = allItems.filter(item => !hasMessages(item));
    // Filter based on search term
    let filtered = uniqueItems;
    if (searchTerm.trim()) {
      filtered = uniqueItems.filter(item => {
        if (item.type === 'group') {
          return item.name?.toLowerCase().includes(searchTerm.toLowerCase());
        } else if (item.type === 'user') {
          return item.name?.toLowerCase().includes(searchTerm.toLowerCase());
        } else {
          const otherParticipant = item.participants?.find(p => p.user?._id !== user?._id);
          return otherParticipant?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        }
      });
    }
    
    // Sort by latest message time, then by updatedAt
    return filtered.sort((a, b) => {
      const timeA = new Date(a.lastMessage?.createdAt || a.updatedAt || a.createdAt);
      const timeB = new Date(b.lastMessage?.createdAt || b.updatedAt || b.createdAt);
      return timeB - timeA; // Most recent first
    });
  }, [allChats, chattedUsers, searchTerm, user?._id]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) {
      return;
    }
    const handleNewMessage = (message) => {
      // Force invalidate and refetch recentChats to ensure live updates
      queryClient.invalidateQueries(['recentChats']);
      
      // Also trigger immediate refetch for instant updates
      refetch();
      
      // Also invalidate other related queries
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['groupChats']);
    };

    const handleChatUpdate = (updatedChat) => {
      // Force invalidate and refetch recentChats to ensure live updates
      queryClient.invalidateQueries(['recentChats']);
      
      // Also trigger immediate refetch for instant updates
      refetch();
      
      // Also invalidate other related queries
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['groupChats']);
    };

    const handleNewChat = (newChat) => {
      // Invalidate only recentChats query when a new chat is created
      queryClient.invalidateQueries(['recentChats']);
    };

    const handleChatCreated = (chat) => {
      // Invalidate only recentChats query when a chat is created
      queryClient.invalidateQueries(['recentChats']);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('chat_updated', handleChatUpdate);
    socket.on('new_chat', handleNewChat);
    socket.on('chat_created', handleChatCreated);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('chat_updated', handleChatUpdate);
      socket.off('new_chat', handleNewChat);
      socket.off('chat_created', handleChatCreated);
    };
  }, [socket, queryClient, searchTerm]);

  const handleChatSelect = useCallback((chat) => {
    setSelectedChatId(chat._id);
    onSelectChat(chat);
  }, [onSelectChat]);

  const handleCreateGroup = useCallback(() => {
    if (onCreateGroup) {
      onCreateGroup();
    } else {
      setShowCreateGroup(true);
    }
  }, [onCreateGroup]);

  const handleNewChat = useCallback(() => {
    if (onNewChat) {
      onNewChat();
    } else {
      setShowNewChat(true);
    }
  }, [onNewChat]);

  if (error) {
    return (
      <div className="h-full bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={24} className="text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Failed to load chats
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {error?.message || 'An error occurred while loading your chats'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full bg-white dark:bg-gray-900">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <SkeletonLoader className="h-8 w-32" />
        </div>
        <div className="flex-1 overflow-hidden">
          <SkeletonChatList count={8} />
        </div>
      </div>
    );
  }

  // Show refresh indicator when refetching
  if (isRefetching && !isLoading) {
  }

  return (
    <div className="h-full bg-white dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Messages</h2>
          <div className="relative menu-container">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="More Options"
            >
              <MoreVertical size={16} className="text-gray-600 dark:text-gray-400" />
            </button>
            
            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleNewChat();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                  >
                    <Plus size={16} className="text-gray-500 dark:text-gray-400" />
                    New Chat
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleCreateGroup();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                  >
                    <Users size={16} className="text-gray-500 dark:text-gray-400" />
                    Create Group
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      navigate('/call-history');
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                  >
                    <History size={16} className="text-gray-500 dark:text-gray-400" />
                    Call History
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Search */}
        <div className="relative flex items-center border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm || ''}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm md:text-base !border-0 !outline-none"
            style={{ border: 'none', outline: 'none' }}
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {searchTerm ? 'No chats match your search' : 'Start a conversation'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Send your first message to get started'}
            </p>
            {!searchTerm && (
              <CustomButton
                onClick={handleNewChat}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Start New Chat
              </CustomButton>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredChats.map((chat) => (
              <ChatListItem
                key={chat._id}
                chat={chat}
                isSelected={selectedChatId === chat._id}
                onClick={() => handleChatSelect(chat)}
                onVideoCall={() => onVideoCall(chat)}
                currentUserId={user?._id}
              />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasNextPage && (
          <div className="p-4 text-center">
            <CustomButton
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </CustomButton>
          </div>
        )}
      </div>

    </div>
  );
};

export default EnhancedChatList;