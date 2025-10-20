import { useState, useRef, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useSocket } from './useSocket';
import {
  // API functions
  getUserChats,
  getUserGroupChats,
  getOneToOneChats,
  getChattedUsers,
  getChatById,
  getOrCreateOneToOneChat,
  createGroupChat,
  updateGroupChat,
  addGroupMembers,
  removeGroupMember,
  leaveGroup,
  archiveChat,
  unarchiveChat,
  deleteChat,
  archiveChatForUser,
  unarchiveChatForUser,
  deleteChatForUser,
  restoreChatForUser,
  getArchivedChatsForUser,
  getDeletedChatsForUser,
  updateMemberRole,
  getGroupMembers,
  markAsRead,
  markAsDelivered,
  getReadReceipts,
  getUnreadCount,
  getTotalUnreadCount,
  sendMessage,
  getChatMessages,
  editMessage,
  deleteMessage,
  addReaction,
  removeReaction
} from '../api/chatApi';
import {
  // Redux actions
  fetchUserChats,
  fetchGroupChats,
  fetchOneToOneChats,
  fetchChattedUsers,
  fetchChatById,
  fetchOrCreateOneToOneChat,
  createGroupChatAction,
  updateGroupChatAction,
  addGroupMembersAction,
  removeGroupMemberAction,
  updateMemberRoleAction,
  leaveGroupAction,
  archiveChatAction,
  unarchiveChatAction,
  fetchGroupMembers,
  setCurrentChat,
  setSelectedChatId,
  setShowCreateGroupModal,
  setShowNewChatModal,
  setShowGroupMembersModal,
  addMessageToCurrentChat,
  updateMessageInCurrentChat,
  removeMessageFromCurrentChat,
  clearError,
  // Redux selectors
  selectChats,
  selectGroupChats,
  selectOneToOneChats,
  selectChattedUsers,
  selectCurrentChat,
  selectCurrentChatMessages,
  selectSelectedChatId,
  selectGroupMembers,
  selectIsAdmin,
  selectUserRole,
  selectShowCreateGroupModal,
  selectShowNewChatModal,
  selectShowGroupMembersModal,
  selectChatLoading,
  selectChatErrors,
  selectChatPagination,
} from '../store/slice/chatSlice';

/**
 * Consolidated Chat Hook - All chat-related functionality in one place
 * Combines: useChat, useChatManager, useMessages, useTyping, useReadStatus
 */
export const useChat = (chatId = null, params = {}) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.auth);
  const { socket } = useSocket();

  // Redux state selectors
  const chats = useSelector(selectChats);
  const groupChats = useSelector(selectGroupChats);
  const oneToOneChats = useSelector(selectOneToOneChats);
  const chattedUsers = useSelector(selectChattedUsers);
  const currentChat = useSelector(selectCurrentChat);
  const currentChatMessages = useSelector(selectCurrentChatMessages);
  const selectedChatId = useSelector(selectSelectedChatId);
  const groupMembers = useSelector(selectGroupMembers);
  const isAdmin = useSelector(selectIsAdmin);
  const userRole = useSelector(selectUserRole);
  const showCreateGroupModal = useSelector(selectShowCreateGroupModal);
  const showNewChatModal = useSelector(selectShowNewChatModal);
  const showGroupMembersModal = useSelector(selectShowGroupMembersModal);
  const loading = useSelector(selectChatLoading);
  const errors = useSelector(selectChatErrors);
  const pagination = useSelector(selectChatPagination);

  // Local state for typing and read status
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [lastReadMessageRef, setLastReadMessageRef] = useState(null);
  const [deliveredMessagesRef, setDeliveredMessagesRef] = useState(new Set());
  const typingTimeoutRef = useRef(null);

  // Fetch chats with React Query
  const { data: chatsData, isLoading: isLoadingChats, error: chatsError, refetch: refetchChats } = useQuery({
    queryKey: ['chats', params],
    queryFn: () => getUserChats(params),
    enabled: !!user,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const { data: groupChatsData, isLoading: isLoadingGroupChats, error: groupChatsError } = useQuery({
    queryKey: ['groupChats', params],
    queryFn: () => getUserGroupChats(params),
    enabled: !!user,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const { data: chattedUsersData, isLoading: isLoadingChattedUsers, error: chattedUsersError } = useQuery({
    queryKey: ['chattedUsers', params],
    queryFn: () => getChattedUsers(params),
    enabled: !!user,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const { data: currentChatData, isLoading: isLoadingCurrentChat, error: currentChatError } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => getChatById(chatId),
    enabled: !!user && !!chatId,
    staleTime: 60000,
  });

  const { data: messagesData, isLoading: isLoadingMessages, error: messagesError } = useQuery({
    queryKey: ['messages', chatId, params],
    queryFn: () => getChatMessages(chatId, params),
    enabled: !!user && !!chatId,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });

  const { data: groupMembersData, isLoading: isLoadingGroupMembers, error: groupMembersError } = useQuery({
    queryKey: ['groupMembers', chatId],
    queryFn: () => getGroupMembers(chatId),
    enabled: !!user && !!chatId,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const { data: unreadCountData, isLoading: isLoadingUnreadCount } = useQuery({
    queryKey: ['unreadCount', chatId],
    queryFn: () => getUnreadCount(chatId),
    enabled: !!user && !!chatId,
    staleTime: 10000,
    refetchInterval: 30000,
  });

  const { data: totalUnreadCountData, isLoading: isLoadingTotalUnreadCount } = useQuery({
    queryKey: ['totalUnreadCount'],
    queryFn: () => getTotalUnreadCount(),
    enabled: !!user,
    staleTime: 10000,
    refetchInterval: 30000,
  });

  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: ({ chatId, data }) => sendMessage(chatId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['messages', variables.chatId]);
      queryClient.invalidateQueries(['chats']);
    },
    onError: (error) => {
      toast.error('Failed to send message');
    },
  });

  const editMessageMutation = useMutation({
    mutationFn: ({ chatId, messageId, content }) => editMessage(chatId, messageId, content),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['messages', variables.chatId]);
      toast.success('Message edited successfully');
    },
    onError: (error) => {
      toast.error('Failed to edit message');
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: ({ chatId, messageId }) => deleteMessage(chatId, messageId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['messages', variables.chatId]);
      toast.success('Message deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete message');
    },
  });

  const addReactionMutation = useMutation({
    mutationFn: ({ chatId, messageId, emoji }) => addReaction(chatId, messageId, emoji),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['messages', variables.chatId]);
    },
    onError: (error) => {
      toast.error('Failed to add reaction');
    },
  });

  const removeReactionMutation = useMutation({
    mutationFn: ({ chatId, messageId, emoji }) => removeReaction(chatId, messageId, emoji),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['messages', variables.chatId]);
    },
    onError: (error) => {
      toast.error('Failed to remove reaction');
    },
  });

  const createGroupChatMutation = useMutation({
    mutationFn: (data) => createGroupChat(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['groupChats']);
      toast.success('Group chat created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create group chat');
    },
  });

  const updateGroupChatMutation = useMutation({
    mutationFn: ({ chatId, data }) => updateGroupChat(chatId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['chat', variables.chatId]);
      queryClient.invalidateQueries(['groupChats']);
      toast.success('Group chat updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update group chat');
    },
  });

  const addGroupMembersMutation = useMutation({
    mutationFn: ({ chatId, memberIds }) => addGroupMembers(chatId, memberIds),
    onSuccess: (data, variables) => {
      toast.success(`Added ${data.data?.data?.addedCount || 0} members to group`);
      queryClient.invalidateQueries(['groupMembers', variables.chatId]);
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['groupChats']);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to add members');
    },
  });

  const removeGroupMemberMutation = useMutation({
    mutationFn: ({ chatId, memberId }) => removeGroupMember(chatId, memberId),
    onSuccess: (data, variables) => {
      toast.success('Member removed from group');
      queryClient.invalidateQueries(['groupMembers', variables.chatId]);
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['groupChats']);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to remove member');
    },
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ chatId, memberId, role }) => updateMemberRole(chatId, memberId, role),
    onSuccess: (data, variables) => {
      toast.success(`Member role updated to ${variables.role}`);
      queryClient.invalidateQueries(['groupMembers', variables.chatId]);
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['groupChats']);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update member role');
    },
  });

  const leaveGroupMutation = useMutation({
    mutationFn: (chatId) => leaveGroup(chatId),
    onSuccess: () => {
      toast.success('Left group successfully');
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['groupChats']);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to leave group');
    },
  });

  const archiveChatMutation = useMutation({
    mutationFn: (chatId) => archiveChat(chatId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['chat', variables]);
      queryClient.invalidateQueries(['groupChats']);
      toast.success('Chat archived successfully');
    },
    onError: (error) => {
      toast.error('Failed to archive chat');
    },
  });

  const unarchiveChatMutation = useMutation({
    mutationFn: (chatId) => unarchiveChat(chatId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['chat', variables]);
      queryClient.invalidateQueries(['groupChats']);
      toast.success('Chat unarchived successfully');
    },
    onError: (error) => {
      toast.error('Failed to unarchive chat');
    },
  });

  const createOneToOneChatMutation = useMutation({
    mutationFn: (userId) => getOrCreateOneToOneChat(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['oneToOneChats']);
      toast.success('Chat created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create chat');
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: ({ chatId, messageId }) => markAsRead(chatId, messageId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['chat', variables.chatId]);
      queryClient.invalidateQueries(['messages', variables.chatId]);
    },
    onError: (error) => {
      console.error('Failed to mark messages as read:', error);
    },
  });

  const markAsDeliveredMutation = useMutation({
    mutationFn: ({ chatId, messageId }) => markAsDelivered(chatId, messageId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['messages', variables.chatId]);
    },
    onError: (error) => {
      console.error('Failed to mark message as delivered:', error);
    },
  });

  // Typing functions
  const startTyping = useCallback(() => {
    if (!socket || !chatId) return;
    
    if (!isTyping) {
      socket.emit('typing', { chatId });
      setIsTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  }, [socket, chatId, isTyping]);

  const stopTyping = useCallback(() => {
    if (!socket || !chatId) return;
    
    if (isTyping) {
      socket.emit('stop_typing', { chatId });
      setIsTyping(false);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [socket, chatId, isTyping]);

  const handleTypingEvent = useCallback((data) => {
    if (data.chatId === chatId) {
      setTypingUsers(prev => {
        const filtered = prev.filter(user => user.userId !== data.userId);
        return [...filtered, { userId: data.userId, name: data.userName }];
      });

      setTimeout(() => {
        setTypingUsers(prev => prev.filter(user => user.userId !== data.userId));
      }, 3000);
    }
  }, [chatId]);

  const handleStopTypingEvent = useCallback((data) => {
    if (data.chatId === chatId) {
      setTypingUsers(prev => prev.filter(user => user.userId !== data.userId));
    }
  }, [chatId]);

  // Read status functions
  const markMessagesAsRead = useCallback((messageId = null) => {
    if (!chatId || !user) return;
    
    markAsReadMutation.mutate({ chatId, messageId });
    
    if (socket) {
      socket.emit('mark_as_read', { chatId, messageId });
    }
  }, [chatId, user, socket, markAsReadMutation]);

  const markMessageAsDelivered = useCallback((messageId) => {
    if (!chatId || !messageId || !user) return;
    
    if (deliveredMessagesRef.has(messageId)) return;
    
    deliveredMessagesRef.add(messageId);
    
    markAsDeliveredMutation.mutate({ chatId, messageId });
    
    if (socket) {
      socket.emit('mark_as_delivered', { chatId, messageId });
    }
  }, [chatId, user, socket, markAsDeliveredMutation]);

  const handleMessageReceived = useCallback((message) => {
    if (message.sender._id !== user?._id) {
      markMessageAsDelivered(message._id);
    }
  }, [user, markMessageAsDelivered]);

  const handleChatOpened = useCallback(() => {
    markMessagesAsRead();
  }, [markMessagesAsRead]);

  const markMessageAsRead = useCallback((messageId) => {
    markMessagesAsRead(messageId);
  }, [markMessagesAsRead]);

  // Chat management functions
  const selectChat = useCallback((chat) => {
    dispatch(setCurrentChat(chat));
    dispatch(setSelectedChatId(chat?._id || null));
  }, [dispatch]);

  const openCreateGroupModal = useCallback(() => {
    dispatch(setShowCreateGroupModal(true));
  }, [dispatch]);

  const closeCreateGroupModal = useCallback(() => {
    dispatch(setShowCreateGroupModal(false));
  }, [dispatch]);

  const openNewChatModal = useCallback(() => {
    dispatch(setShowNewChatModal(true));
  }, [dispatch]);

  const closeNewChatModal = useCallback(() => {
    dispatch(setShowNewChatModal(false));
  }, [dispatch]);

  const openGroupMembersModal = useCallback(() => {
    dispatch(setShowGroupMembersModal(true));
  }, [dispatch]);

  const closeGroupMembersModal = useCallback(() => {
    dispatch(setShowGroupMembersModal(false));
  }, [dispatch]);

  const addMessage = useCallback((message) => {
    dispatch(addMessageToCurrentChat(message));
  }, [dispatch]);

  const updateMessage = useCallback((messageId, updates) => {
    dispatch(updateMessageInCurrentChat({ messageId, updates }));
  }, [dispatch]);

  const removeMessage = useCallback((messageId) => {
    dispatch(removeMessageFromCurrentChat(messageId));
  }, [dispatch]);

  const clearChatError = useCallback((errorType) => {
    dispatch(clearError(errorType));
  }, [dispatch]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !chatId) return;

    const handleMessagesRead = (data) => {
      if (data.chatId === chatId && data.userId !== user?._id) {
        console.log('Messages read by user:', data.userId);
      }
    };

    const handleMessageDelivered = (data) => {
      if (data.chatId === chatId && data.userId !== user?._id) {
        console.log('Message delivered to user:', data.userId);
      }
    };

    socket.on('typing', handleTypingEvent);
    socket.on('stop_typing', handleStopTypingEvent);
    socket.on('messages_read', handleMessagesRead);
    socket.on('message_delivered', handleMessageDelivered);

    return () => {
      socket.off('typing', handleTypingEvent);
      socket.off('stop_typing', handleStopTypingEvent);
      socket.off('messages_read', handleMessagesRead);
      socket.off('message_delivered', handleMessageDelivered);
    };
  }, [socket, chatId, user, handleTypingEvent, handleStopTypingEvent]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Extract data from API responses
  const apiChatsData = chatsData?.data;
  const apiGroupChatsData = groupChatsData?.data;
  const apiChattedUsersData = chattedUsersData?.data;
  const apiCurrentChatData = currentChatData?.data;
  const apiMessagesData = messagesData?.data;
  const apiGroupMembersData = groupMembersData?.data;

  const chatsList = apiChatsData?.data?.chats || [];
  const groupChatsList = apiGroupChatsData?.data?.chats || [];
  const chattedUsersList = apiChattedUsersData?.data?.users || [];
  const currentChatDetails = apiCurrentChatData?.data?.chat;
  const messagesList = apiMessagesData?.data?.messages || [];
  const groupMembersList = apiGroupMembersData?.data?.members || [];
  const unreadCount = unreadCountData?.data?.data?.unreadCount || 0;
  const totalUnreadCount = totalUnreadCountData?.data?.data?.totalUnreadCount || 0;

  // Return consolidated interface
  return {
    // State
    user,
    chats: chatsList,
    groupChats: groupChatsList,
    chattedUsers: chattedUsersList,
    currentChat: currentChatDetails || currentChat,
    messages: messagesList,
    groupMembers: groupMembersList,
    selectedChatId,
    isAdmin,
    userRole,
    showCreateGroupModal,
    showNewChatModal,
    showGroupMembersModal,
    loading,
    errors,
    pagination,
    
    // Typing state
    isTyping,
    typingUsers,
    
    // Read status
    unreadCount,
    totalUnreadCount,
    
    // Loading states
    isLoadingChats,
    isLoadingGroupChats,
    isLoadingChattedUsers,
    isLoadingCurrentChat,
    isLoadingMessages,
    isLoadingGroupMembers,
    isLoadingUnreadCount,
    isLoadingTotalUnreadCount,
    
    // Error states
    chatsError,
    groupChatsError,
    chattedUsersError,
    currentChatError,
    messagesError,
    groupMembersError,
    
    // Chat management actions
    selectChat,
    openCreateGroupModal,
    closeCreateGroupModal,
    openNewChatModal,
    closeNewChatModal,
    openGroupMembersModal,
    closeGroupMembersModal,
    addMessage,
    updateMessage,
    removeMessage,
    clearChatError,
    
    // Message actions
    sendMessage: sendMessageMutation.mutate,
    editMessage: editMessageMutation.mutate,
    deleteMessage: deleteMessageMutation.mutate,
    addReaction: addReactionMutation.mutate,
    removeReaction: removeReactionMutation.mutate,
    
    // Group management actions
    createGroupChat: createGroupChatMutation.mutate,
    updateGroupChat: updateGroupChatMutation.mutate,
    addGroupMembers: addGroupMembersMutation.mutate,
    removeGroupMember: removeGroupMemberMutation.mutate,
    updateMemberRole: updateMemberRoleMutation.mutate,
    leaveGroup: leaveGroupMutation.mutate,
    
    // Chat operations
    archiveChat: archiveChatMutation.mutate,
    unarchiveChat: unarchiveChatMutation.mutate,
    createOneToOneChat: createOneToOneChatMutation.mutate,
    
    // Typing actions
    startTyping,
    stopTyping,
    
    // Read status actions
    markMessagesAsRead,
    markMessageAsDelivered,
    markMessageAsRead,
    handleMessageReceived,
    handleChatOpened,
    
    // Refetch functions
    refetchChats,
    
    // Mutation states
    isSendingMessage: sendMessageMutation.isPending,
    isEditingMessage: editMessageMutation.isPending,
    isDeletingMessage: deleteMessageMutation.isPending,
    isAddingReaction: addReactionMutation.isPending,
    isRemovingReaction: removeReactionMutation.isPending,
    isCreatingGroup: createGroupChatMutation.isPending,
    isUpdatingGroup: updateGroupChatMutation.isPending,
    isAddingMembers: addGroupMembersMutation.isPending,
    isRemovingMember: removeGroupMemberMutation.isPending,
    isUpdatingRole: updateMemberRoleMutation.isPending,
    isLeavingGroup: leaveGroupMutation.isPending,
    isArchivingChat: archiveChatMutation.isPending,
    isUnarchivingChat: unarchiveChatMutation.isPending,
    isCreatingOneToOneChat: createOneToOneChatMutation.isPending,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAsDelivered: markAsDeliveredMutation.isPending,
  };
};