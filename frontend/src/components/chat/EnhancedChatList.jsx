import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getUserChats, searchUsers, getChattedUsers } from '../../api/chatApi';
import { useChattedUsers } from '../../hook/useChat';
import { useSocket } from '../../hook/useSocket';
import { MessageSquare, Users, Search, Plus, Loader2, Phone, Video, MoreVertical } from 'lucide-react';
import Button from '../ui/Button';
import UserAvatar from '../ui/UserAvatar';
import ChatItem from '../ui/ChatItem';
import CreateGroupModal from './CreateGroupModal';
import Skeleton, { SkeletonChatList } from '../ui/Skeleton';

const EnhancedChatList = ({ onSelectChat, onVideoCall }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  const { user } = useSelector((state) => state.auth);
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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
    staleTime: 0,
    refetchOnWindowFocus: true,
    enabled: !!user,
  });

  // User search query
  const { data: userSearchData } = useQuery({
    queryKey: ['userSearch', userSearchQuery],
    queryFn: () => searchUsers({ query: userSearchQuery }),
    enabled: showNewChat && userSearchQuery.length >= 2,
    staleTime: 60000,
  });

  // Chatted users query
  const { data: chattedUsersData } = useChattedUsers({ page: 1, limit: 50 });

  // Flatten all pages into a single array
  const allChats = useMemo(() => {
    const chats = data?.pages?.flatMap(page => page.data?.chats || []) || [];
    return chats;
  }, [data]);

  // Get chatted users and convert them to virtual chat items
  const chattedUsers = useMemo(() => {
    const items = chattedUsersData?.data?.data?.items || chattedUsersData?.data?.items || [];
    return items.map(item => {
      if (item.type === 'one-to-one') {
        // Handle individual users
        return {
          _id: `chatted_user_${item.user._id}`,
          type: 'chatted_user',
          name: item.user.name,
          avatar: item.user.avatar,
          lastMessageAt: item.lastChatAt,
          lastMessage: item.lastMessage || { content: `Last chat: ${new Date(item.lastChatAt).toLocaleDateString()}` },
          participants: [{ user: item.user, role: 'member' }],
          chatCount: item.chatCount,
          isVirtualChat: true
        };
      } else if (item.type === 'group') {
        // Handle group chats
        return {
          _id: `chatted_group_${item.group._id}`,
          type: 'chatted_group',
          name: item.group.name,
          lastMessageAt: item.lastChatAt,
          lastMessage: item.lastMessage || { content: `Last chat: ${new Date(item.lastChatAt).toLocaleDateString()}` },
          participants: item.group.participants,
          memberCount: item.group.memberCount,
          chatCount: item.chatCount,
          isVirtualChat: true
        };
      }
      return null;
    }).filter(Boolean);
  }, [chattedUsersData]);

  // Combine regular chats and chatted users, then filter and sort
  const filteredChats = useMemo(() => {
    // Combine all chats and chatted users
    const allItems = [...allChats, ...chattedUsers];
    
    // Filter based on search term
    const filtered = !searchTerm.trim() ? allItems : allItems.filter(item => {
      if (item.type === 'group') {
        return item.name?.toLowerCase().includes(searchTerm.toLowerCase());
      } else if (item.type === 'chatted_user') {
        return item.name?.toLowerCase().includes(searchTerm.toLowerCase());
      } else {
        const otherParticipant = item.participants?.find(
          p => p.user && p.user._id !== user?._id
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
  }, [allChats, chattedUsers, searchTerm, user?._id]);

  // Listen for new messages to update chat list
  useEffect(() => {
    if (socket) {
      const handleNewMessage = (data) => {
        // Update chat list cache immediately
        queryClient.setQueryData(['chats', searchTerm], (oldData) => {
          if (!oldData) return oldData;
          
          const updatedPages = oldData.pages.map(page => {
            const chats = page.data?.chats || [];
            const chatIndex = chats.findIndex(chat => chat._id === data.chatId);
            
            if (chatIndex !== -1) {
              const [updatedChat] = chats.splice(chatIndex, 1);
              updatedChat.lastMessage = data.message;
              updatedChat.lastMessageAt = data.message.createdAt;
              updatedChat.updatedAt = data.message.createdAt;
              chats.unshift(updatedChat);
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
        
        queryClient.invalidateQueries(['chats']);
      };

      const handleMessagesRead = (data) => {
        console.log('EnhancedChatList: Messages marked as read:', data);
        
        // Update the chat list to reflect the unread count change
        queryClient.invalidateQueries(['chats']);
        
        // Also update the specific chat in the cache if needed
        queryClient.setQueryData(['chats'], (oldData) => {
          if (!oldData?.pages) return oldData;
          
          const updatedPages = oldData.pages.map(page => ({
            ...page,
            data: {
              ...page.data,
              chats: page.data?.chats?.map(chat => {
                if (chat._id === data.chatId) {
                  // Reset unread count for the current user
                  const updatedChat = { ...chat };
                  if (updatedChat.unreadCount && typeof updatedChat.unreadCount === 'object') {
                    updatedChat.unreadCount = new Map(updatedChat.unreadCount);
                    updatedChat.unreadCount.set(data.userId, 0);
                  } else {
                    updatedChat.unreadCount = 0;
                  }
                  return updatedChat;
                }
                return chat;
              }) || []
            }
          }));
          
          return {
            ...oldData,
            pages: updatedPages
          };
        });
      };

      const handleChatUpdated = (data) => {
        console.log('EnhancedChatList: Chat updated:', data);
        
        // Update the chat list to reflect the updated chat data
        queryClient.setQueryData(['chats'], (oldData) => {
          if (!oldData?.pages) return oldData;
          
          const updatedPages = oldData.pages.map(page => ({
            ...page,
            data: {
              ...page.data,
              chats: page.data?.chats?.map(chat => {
                if (chat._id === data.chatId) {
                  // Update the chat with new data
                  const updatedChat = { ...chat };
                  
                  // Update last message if provided
                  if (data.updatedFields.lastMessage) {
                    updatedChat.lastMessage = data.updatedFields.lastMessage;
                  }
                  
                  // Update unread count if provided
                  if (data.updatedFields.unreadCount) {
                    updatedChat.unreadCount = data.updatedFields.unreadCount;
                  }
                  
                  // Update last seen if provided
                  if (data.updatedFields.lastSeen) {
                    const participant = updatedChat.participants?.find(p => 
                      p.user && p.user._id === data.updatedFields.lastSeen.userId
                    );
                    if (participant) {
                      participant.lastSeen = data.updatedFields.lastSeen;
                    }
                  }
                  
                  // Update timestamp
                  if (data.updatedFields.updatedAt) {
                    updatedChat.updatedAt = data.updatedFields.updatedAt;
                  }
                  
                  return updatedChat;
                }
                return chat;
              }) || []
            }
          }));
          
          // Sort chats by lastMessageAt to ensure most recent messages appear first
          const sortedPages = updatedPages.map(page => ({
            ...page,
            data: {
              ...page.data,
              chats: page.data?.chats?.sort((a, b) => {
                // Use lastMessageAt if available, fallback to updatedAt
                const aTime = new Date(a.lastMessageAt || a.updatedAt || 0);
                const bTime = new Date(b.lastMessageAt || b.updatedAt || 0);
                return bTime - aTime;
              }) || []
            }
          }));
          
          return {
            ...oldData,
            pages: sortedPages
          };
        });
      };

      socket.on('new_message', handleNewMessage);
      socket.on('messages_read', handleMessagesRead);
      socket.on('chat_updated', handleChatUpdated);
      
      return () => {
        socket.off('new_message', handleNewMessage);
        socket.off('messages_read', handleMessagesRead);
        socket.off('chat_updated', handleChatUpdated);
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

    if (scrollHeight - scrollTop - clientHeight < 200 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Update container height on resize
  useEffect(() => {
    const updateHeight = () => {
      const container = document.getElementById('enhanced-chat-list-container');
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
      p => p.user && p.user._id !== user?._id
    );
    return otherParticipant?.user?.name || 'Unknown User';
  };

  const getChatAvatar = (chat) => {
    if (chat.type === 'group') {
      return chat.avatar || null;
    }
    const otherParticipant = chat.participants?.find(
      p => p.user && p.user._id !== user?._id
    );
    return otherParticipant?.user || null;
  };

  const getUnreadCount = (chat) => {
    return chat.unreadCount?.get?.(user?._id) || 0;
  };

  const handleChatSelect = async (chat) => {
    setSelectedChatId(chat._id);
    
    // If it's a chatted user (virtual chat), create/load the actual chat
    if (chat.isVirtualChat) {
      if (chat.type === 'chatted_user') {
        try {
          const { getOrCreateOneToOneChat } = await import('../../api/chatApi');
          const response = await getOrCreateOneToOneChat(chat.participants[0].user._id);
          const actualChat = response.data?.data?.chat || response.data?.chat || response.data;
          
          if (actualChat && actualChat._id) {
            onSelectChat?.(actualChat);
            // Navigate to the new URL format
            navigate(`/chat/${chat.participants[0].user._id}`);
            queryClient.invalidateQueries(['chats']);
          }
        } catch (error) {
          // Handle error silently
        }
      } else if (chat.type === 'chatted_group') {
        // For chatted groups, navigate directly to group URL
        onSelectChat?.(chat);
        navigate(`/chats/group/${chat._id.replace('chatted_group_', '')}`);
      }
    } else {
      onSelectChat?.(chat);
      // Navigate based on chat type
      if (chat.type === 'one-to-one') {
        const receiver = chat.participants?.find(p => p.user._id !== user?._id);
        if (receiver) {
          navigate(`/chat/${receiver.user._id}`);
        }
      } else if (chat.type === 'group') {
        navigate(`/chats/group/${chat._id}`);
      }
    }
  };

  const handleNewChatWithUser = async (selectedUser) => {
    try {
      const { getOrCreateOneToOneChat } = await import('../../api/chatApi');
      const response = await getOrCreateOneToOneChat(selectedUser._id);
      const chat = response.data?.data?.chat || response.data?.chat || response.data;
      
      if (chat && chat._id) {
        handleChatSelect(chat);
        setShowNewChat(false);
        setUserSearchQuery('');
        queryClient.invalidateQueries(['chats']);
        // Navigate to the new URL format
        navigate(`/chat/${selectedUser._id}`);
      }
    } catch (error) {
      // Handle error silently
    }
  };

  const handleGroupCreated = (groupChat) => {
    setShowCreateGroup(false);
    handleChatSelect(groupChat);
    queryClient.invalidateQueries(['chats']);
  };

  // Show authentication required message if user is not logged in
  if (!user || !user._id) {
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
            <Skeleton className="w-20 h-6" />
            <div className="flex items-center gap-2">
              <Skeleton className="w-20 h-8" />
              <Skeleton className="w-16 h-8" />
            </div>
          </div>
          <Skeleton className="w-full h-10 rounded-lg" />
        </div>
        <div className="flex-1 overflow-hidden">
          <SkeletonChatList count={10} />
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
      <div className="p-2 md:p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-2 md:mb-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">Chats</h2>
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            <Button
              onClick={() => setShowNewChat(true)}
              size="sm"
              className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3"
            >
              <Plus className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">New Chat</span>
            </Button>
            <Button
              onClick={() => setShowCreateGroup(true)}
              size="sm"
              variant="outline"
              className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3"
            >
              <Plus className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Group</span>
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm || ''}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-7 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm md:text-base"
          />
        </div>
      </div>

      {/* Chat List with Virtual Scrolling */}
      <div 
        id="enhanced-chat-list-container"
        className="flex-1 overflow-y-auto min-h-0"
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
              <div className="flex gap-2">
                <Button onClick={() => setShowNewChat(true)} size="sm">
                  Start New Chat
                </Button>
                <Button onClick={() => setShowCreateGroup(true)} size="sm" variant="outline">
                  Create Group
                </Button>
              </div>
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
                  <ChatItem
                    chat={chat}
                    isSelected={isSelected}
                    onClick={() => handleChatSelect(chat)}
                    onVideoCall={onVideoCall}
                    onMenuClick={(chat) => {}}
                    currentUserId={user?._id}
                  />
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

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={handleGroupCreated}
      />

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Start New Chat
              </h2>
              <button
                onClick={() => setShowNewChat(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <span className="text-gray-600 dark:text-gray-400">×</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Users
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {userSearchData?.data?.data?.users && (
                <div className="max-h-64 overflow-y-auto">
                  {userSearchData.data.data.users.map((searchUser) => (
                    <div
                      key={searchUser._id}
                      onClick={() => handleNewChatWithUser(searchUser)}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer rounded-lg transition-colors"
                    >
                      <UserAvatar user={searchUser} size="md" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {searchUser.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {searchUser.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedChatList;

