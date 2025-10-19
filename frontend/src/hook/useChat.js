import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { 
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
  getTotalUnreadCount
} from '../api/chatApi';
import { toast } from 'react-hot-toast';

export const useChats = (params = {}) => {
  const { user } = useSelector((state) => state.auth);
  
  return useQuery({
    queryKey: ['chats', params],
    queryFn: () => getUserChats(params),
    enabled: !!user,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
};

export const useGroupChats = (params = {}) => {
  const { user } = useSelector((state) => state.auth);
  
  return useQuery({
    queryKey: ['groupChats', params],
    queryFn: () => getUserGroupChats(params),
    enabled: !!user,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
};

export const useChattedUsers = (params = {}) => {
  const { user } = useSelector((state) => state.auth);
  
  return useQuery({
    queryKey: ['chattedUsers', params],
    queryFn: () => getChattedUsers(params),
    enabled: !!user,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
};

export const useGroupMembers = (chatId) => {
  const { user } = useSelector((state) => state.auth);
  
  return useQuery({
    queryKey: ['groupMembers', chatId],
    queryFn: () => getGroupMembers(chatId),
    enabled: !!user && !!chatId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
};

export const useAddGroupMembers = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chatId, memberIds }) => addGroupMembers(chatId, memberIds),
    onSuccess: (data, variables) => {
      toast.success(`Added ${data.data?.data?.addedCount || 0} members to group`);
      queryClient.invalidateQueries(['groupMembers', variables.chatId]);
      queryClient.invalidateQueries(['chats']);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to add members');
    }
  });
};

export const useRemoveGroupMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chatId, memberId }) => removeGroupMember(chatId, memberId),
    onSuccess: (data, variables) => {
      toast.success('Member removed from group');
      queryClient.invalidateQueries(['groupMembers', variables.chatId]);
      queryClient.invalidateQueries(['chats']);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to remove member');
    }
  });
};

export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chatId, memberId, role }) => updateMemberRole(chatId, memberId, role),
    onSuccess: (data, variables) => {
      toast.success(`Member role updated to ${variables.role}`);
      queryClient.invalidateQueries(['groupMembers', variables.chatId]);
      queryClient.invalidateQueries(['chats']);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update member role');
    }
  });
};

export const useLeaveGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (chatId) => leaveGroup(chatId),
    onSuccess: () => {
      toast.success('Left group successfully');
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['groupChats']);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to leave group');
    }
  });
};

export const useChat = (chatId) => {
  const { user } = useSelector((state) => state.auth);
  
  return useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => getChatById(chatId),
    enabled: !!user && !!chatId,
    staleTime: 60000, // 1 minute
  });
};

export const useCreateOneToOneChat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId) => getOrCreateOneToOneChat(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['chats']);
      toast.success('Chat created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create chat');
    },
  });
};

export const useCreateGroupChat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => createGroupChat(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['chats']);
      toast.success('Group chat created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create group chat');
    },
  });
};

export const useUpdateGroupChat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chatId, data }) => updateGroupChat(chatId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['chat', variables.chatId]);
      toast.success('Group chat updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update group chat');
    },
  });
};

export const useArchiveChat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (chatId) => archiveChat(chatId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['chat', variables]);
      toast.success('Chat archived successfully');
    },
    onError: (error) => {
      toast.error('Failed to archive chat');
    },
  });
};

export const useUnarchiveChat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (chatId) => unarchiveChat(chatId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['chat', variables]);
      toast.success('Chat unarchived successfully');
    },
    onError: (error) => {
      toast.error('Failed to unarchive chat');
    },
  });
};

// User-specific chat operations (soft delete/archive)
export const useArchiveChatForUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (chatId) => archiveChatForUser(chatId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['chat', variables]);
      toast.success('Chat archived successfully');
    },
    onError: (error) => {
      toast.error('Failed to archive chat');
    },
  });
};

export const useUnarchiveChatForUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (chatId) => unarchiveChatForUser(chatId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['chat', variables]);
      toast.success('Chat unarchived successfully');
    },
    onError: (error) => {
      toast.error('Failed to unarchive chat');
    },
  });
};

export const useDeleteChatForUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (chatId) => deleteChatForUser(chatId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['chat', variables]);
      toast.success('Chat deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete chat');
    },
  });
};

export const useRestoreChatForUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (chatId) => restoreChatForUser(chatId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['chat', variables]);
      toast.success('Chat restored successfully');
    },
    onError: (error) => {
      toast.error('Failed to restore chat');
    },
  });
};

// Hooks for getting archived and deleted chats
export const useArchivedChats = (params = {}) => {
  const { user } = useSelector((state) => state.auth);
  
  return useQuery({
    queryKey: ['archivedChats', params],
    queryFn: () => getArchivedChatsForUser(params),
    enabled: !!user,
    staleTime: 60000, // 1 minute
  });
};

export const useDeletedChats = (params = {}) => {
  const { user } = useSelector((state) => state.auth);
  
  return useQuery({
    queryKey: ['deletedChats', params],
    queryFn: () => getDeletedChatsForUser(params),
    enabled: !!user,
    staleTime: 60000, // 1 minute
  });
};

// Read/Unread Status Hooks
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chatId, messageId }) => markAsRead(chatId, messageId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['chat', variables.chatId]);
      queryClient.invalidateQueries(['messages', variables.chatId]);
    },
    onError: (error) => {
      console.error('Failed to mark messages as read:', error);
    }
  });
};

export const useMarkAsDelivered = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chatId, messageId }) => markAsDelivered(chatId, messageId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['messages', variables.chatId]);
    },
    onError: (error) => {
      console.error('Failed to mark message as delivered:', error);
    }
  });
};

export const useReadReceipts = (chatId, messageId) => {
  const { user } = useSelector((state) => state.auth);
  
  return useQuery({
    queryKey: ['readReceipts', chatId, messageId],
    queryFn: () => getReadReceipts(chatId, messageId),
    enabled: !!user && !!chatId && !!messageId,
    staleTime: 30000, // 30 seconds
  });
};

export const useUnreadCount = (chatId, options = {}) => {
  const { user } = useSelector((state) => state.auth);
  
  return useQuery({
    queryKey: ['unreadCount', chatId],
    queryFn: () => getUnreadCount(chatId),
    enabled: !!user && !!chatId && (options.enabled !== false),
    staleTime: 10000, // 10 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
    ...options
  });
};

export const useTotalUnreadCount = () => {
  const { user } = useSelector((state) => state.auth);
  
  return useQuery({
    queryKey: ['totalUnreadCount'],
    queryFn: () => getTotalUnreadCount(),
    enabled: !!user,
    staleTime: 10000, // 10 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
