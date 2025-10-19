import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
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

// Custom hook for chat management
export const useChatManager = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  
  // Redux state
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

  // Actions
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

  return {
    // State
    chats,
    groupChats,
    oneToOneChats,
    chattedUsers,
    currentChat,
    currentChatMessages,
    selectedChatId,
    groupMembers,
    isAdmin,
    userRole,
    showCreateGroupModal,
    showNewChatModal,
    showGroupMembersModal,
    loading,
    errors,
    pagination,
    
    // Actions
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
  };
};

// Custom hook for fetching chats with React Query
export const useChatsQuery = (params = {}) => {
  const dispatch = useDispatch();
  
  return useQuery({
    queryKey: ['chats', params],
    queryFn: () => dispatch(fetchUserChats(params)).unwrap(),
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
};

// Custom hook for fetching group chats
export const useGroupChatsQuery = (params = {}) => {
  const dispatch = useDispatch();
  
  return useQuery({
    queryKey: ['groupChats', params],
    queryFn: () => dispatch(fetchGroupChats(params)).unwrap(),
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
};

// Custom hook for fetching one-to-one chats
export const useOneToOneChatsQuery = (params = {}) => {
  const dispatch = useDispatch();
  
  return useQuery({
    queryKey: ['oneToOneChats', params],
    queryFn: () => dispatch(fetchOneToOneChats(params)).unwrap(),
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
};

// Custom hook for fetching chatted users
export const useChattedUsersQuery = (params = {}) => {
  const dispatch = useDispatch();
  
  return useQuery({
    queryKey: ['chattedUsers', params],
    queryFn: () => dispatch(fetchChattedUsers(params)).unwrap(),
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
};

// Custom hook for fetching chat by ID
export const useChatQuery = (chatId) => {
  const dispatch = useDispatch();
  
  return useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => dispatch(fetchChatById(chatId)).unwrap(),
    enabled: !!chatId,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
};

// Custom hook for fetching group members
export const useGroupMembersQuery = (chatId) => {
  const dispatch = useDispatch();
  
  return useQuery({
    queryKey: ['groupMembers', chatId],
    queryFn: () => dispatch(fetchGroupMembers(chatId)).unwrap(),
    enabled: !!chatId,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
};

// Custom hook for creating group chat
export const useCreateGroupChat = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => dispatch(createGroupChatAction(data)).unwrap(),
    onSuccess: (data) => {
      toast.success('Group created successfully!');
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['groupChats']);
    },
    onError: (error) => {
      toast.error(error || 'Failed to create group');
    },
  });
};

// Custom hook for updating group chat
export const useUpdateGroupChat = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chatId, data }) => dispatch(updateGroupChatAction({ chatId, data })).unwrap(),
    onSuccess: () => {
      toast.success('Group updated successfully!');
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['groupChats']);
    },
    onError: (error) => {
      toast.error(error || 'Failed to update group');
    },
  });
};

// Custom hook for adding group members
export const useAddGroupMembers = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chatId, memberIds }) => dispatch(addGroupMembersAction({ chatId, memberIds })).unwrap(),
    onSuccess: (data) => {
      const addedCount = data.data?.addedCount || 0;
      toast.success(`Added ${addedCount} members to group`);
      queryClient.invalidateQueries(['groupMembers']);
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['groupChats']);
    },
    onError: (error) => {
      toast.error(error || 'Failed to add members');
    },
  });
};

// Custom hook for removing group member
export const useRemoveGroupMember = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chatId, memberId }) => dispatch(removeGroupMemberAction({ chatId, memberId })).unwrap(),
    onSuccess: () => {
      toast.success('Member removed from group');
      queryClient.invalidateQueries(['groupMembers']);
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['groupChats']);
    },
    onError: (error) => {
      toast.error(error || 'Failed to remove member');
    },
  });
};

// Custom hook for updating member role
export const useUpdateMemberRole = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chatId, memberId, role }) => dispatch(updateMemberRoleAction({ chatId, memberId, role })).unwrap(),
    onSuccess: (data, variables) => {
      toast.success(`Member role updated to ${variables.role}`);
      queryClient.invalidateQueries(['groupMembers']);
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['groupChats']);
    },
    onError: (error) => {
      toast.error(error || 'Failed to update member role');
    },
  });
};

// Custom hook for leaving group
export const useLeaveGroup = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (chatId) => dispatch(leaveGroupAction(chatId)).unwrap(),
    onSuccess: () => {
      toast.success('Left group successfully');
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['groupChats']);
    },
    onError: (error) => {
      toast.error(error || 'Failed to leave group');
    },
  });
};

// Custom hook for archiving chat
export const useArchiveChat = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (chatId) => dispatch(archiveChatAction(chatId)).unwrap(),
    onSuccess: () => {
      toast.success('Chat archived successfully');
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['groupChats']);
    },
    onError: (error) => {
      toast.error(error || 'Failed to archive chat');
    },
  });
};

// Custom hook for unarchiving chat
export const useUnarchiveChat = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (chatId) => dispatch(unarchiveChatAction(chatId)).unwrap(),
    onSuccess: () => {
      toast.success('Chat unarchived successfully');
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['groupChats']);
    },
    onError: (error) => {
      toast.error(error || 'Failed to unarchive chat');
    },
  });
};

// Custom hook for creating/fetching one-to-one chat
export const useCreateOneToOneChat = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (otherUserId) => dispatch(fetchOrCreateOneToOneChat(otherUserId)).unwrap(),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['oneToOneChats']);
    },
    onError: (error) => {
      toast.error(error || 'Failed to create chat');
    },
  });
};
