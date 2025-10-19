import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
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
  updateMemberRole,
  getGroupMembers
} from '../../api/chatApi';

// Async thunks for API calls
export const fetchUserChats = createAsyncThunk(
  'chat/fetchUserChats',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getUserChats(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch chats');
    }
  }
);

export const fetchGroupChats = createAsyncThunk(
  'chat/fetchGroupChats',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getUserGroupChats(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch group chats');
    }
  }
);

export const fetchOneToOneChats = createAsyncThunk(
  'chat/fetchOneToOneChats',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getOneToOneChats(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch one-to-one chats');
    }
  }
);

export const fetchChattedUsers = createAsyncThunk(
  'chat/fetchChattedUsers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getChattedUsers(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch chatted users');
    }
  }
);

export const fetchChatById = createAsyncThunk(
  'chat/fetchChatById',
  async (chatId, { rejectWithValue }) => {
    try {
      const response = await getChatById(chatId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch chat');
    }
  }
);

export const fetchOrCreateOneToOneChat = createAsyncThunk(
  'chat/fetchOrCreateOneToOneChat',
  async (otherUserId, { rejectWithValue }) => {
    try {
      const response = await getOrCreateOneToOneChat(otherUserId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create/fetch chat');
    }
  }
);

export const createGroupChatAction = createAsyncThunk(
  'chat/createGroupChat',
  async (data, { rejectWithValue }) => {
    try {
      const response = await createGroupChat(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create group chat');
    }
  }
);

export const updateGroupChatAction = createAsyncThunk(
  'chat/updateGroupChat',
  async ({ chatId, data }, { rejectWithValue }) => {
    try {
      const response = await updateGroupChat(chatId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update group chat');
    }
  }
);

export const addGroupMembersAction = createAsyncThunk(
  'chat/addGroupMembers',
  async ({ chatId, memberIds }, { rejectWithValue }) => {
    try {
      const response = await addGroupMembers(chatId, memberIds);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add members');
    }
  }
);

export const removeGroupMemberAction = createAsyncThunk(
  'chat/removeGroupMember',
  async ({ chatId, memberId }, { rejectWithValue }) => {
    try {
      const response = await removeGroupMember(chatId, memberId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove member');
    }
  }
);

export const updateMemberRoleAction = createAsyncThunk(
  'chat/updateMemberRole',
  async ({ chatId, memberId, role }, { rejectWithValue }) => {
    try {
      const response = await updateMemberRole(chatId, memberId, role);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update member role');
    }
  }
);

export const leaveGroupAction = createAsyncThunk(
  'chat/leaveGroup',
  async (chatId, { rejectWithValue }) => {
    try {
      const response = await leaveGroup(chatId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to leave group');
    }
  }
);

export const archiveChatAction = createAsyncThunk(
  'chat/archiveChat',
  async (chatId, { rejectWithValue }) => {
    try {
      const response = await archiveChat(chatId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to archive chat');
    }
  }
);

export const unarchiveChatAction = createAsyncThunk(
  'chat/unarchiveChat',
  async (chatId, { rejectWithValue }) => {
    try {
      const response = await unarchiveChat(chatId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to unarchive chat');
    }
  }
);

export const fetchGroupMembers = createAsyncThunk(
  'chat/fetchGroupMembers',
  async (chatId, { rejectWithValue }) => {
    try {
      const response = await getGroupMembers(chatId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch group members');
    }
  }
);

// Initial state
const initialState = {
  // Chat lists
  chats: [],
  groupChats: [],
  oneToOneChats: [],
  chattedUsers: [],
  
  // Current chat
  currentChat: null,
  currentChatMessages: [],
  
  // Group members
  groupMembers: [],
  isAdmin: false,
  userRole: 'member',
  
  // UI state
  selectedChatId: null,
  showCreateGroupModal: false,
  showNewChatModal: false,
  showGroupMembersModal: false,
  
  // Loading states
  loading: {
    chats: false,
    groupChats: false,
    oneToOneChats: false,
    chattedUsers: false,
    currentChat: false,
    groupMembers: false,
    creatingGroup: false,
    updatingGroup: false,
    addingMembers: false,
    removingMember: false,
    updatingRole: false,
    leavingGroup: false,
    archiving: false,
    unarchiving: false,
  },
  
  // Error states
  errors: {
    chats: null,
    groupChats: null,
    oneToOneChats: null,
    chattedUsers: null,
    currentChat: null,
    groupMembers: null,
    creatingGroup: null,
    updatingGroup: null,
    addingMembers: null,
    removingMember: null,
    updatingRole: null,
    leavingGroup: null,
    archiving: null,
    unarchiving: null,
  },
  
  // Pagination
  pagination: {
    chats: { page: 1, limit: 20, total: 0, pages: 0 },
    groupChats: { page: 1, limit: 20, total: 0, pages: 0 },
    oneToOneChats: { page: 1, limit: 20, total: 0, pages: 0 },
    chattedUsers: { page: 1, limit: 50, total: 0, pages: 0 },
  },
};

// Chat slice
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // UI state management
    setSelectedChatId: (state, action) => {
      state.selectedChatId = action.payload;
    },
    
    setCurrentChat: (state, action) => {
      state.currentChat = action.payload;
      state.selectedChatId = action.payload?._id || null;
    },
    
    setCurrentChatMessages: (state, action) => {
      state.currentChatMessages = action.payload;
    },
    
    addMessageToCurrentChat: (state, action) => {
      if (state.currentChatMessages) {
        state.currentChatMessages.push(action.payload);
      }
    },
    
    updateMessageInCurrentChat: (state, action) => {
      const { messageId, updates } = action.payload;
      const messageIndex = state.currentChatMessages.findIndex(msg => msg._id === messageId);
      if (messageIndex !== -1) {
        state.currentChatMessages[messageIndex] = { ...state.currentChatMessages[messageIndex], ...updates };
      }
    },
    
    removeMessageFromCurrentChat: (state, action) => {
      state.currentChatMessages = state.currentChatMessages.filter(msg => msg._id !== action.payload);
    },
    
    // Modal state management
    setShowCreateGroupModal: (state, action) => {
      state.showCreateGroupModal = action.payload;
    },
    
    setShowNewChatModal: (state, action) => {
      state.showNewChatModal = action.payload;
    },
    
    setShowGroupMembersModal: (state, action) => {
      state.showGroupMembersModal = action.payload;
    },
    
    // Clear errors
    clearError: (state, action) => {
      const errorType = action.payload;
      if (state.errors[errorType]) {
        state.errors[errorType] = null;
      }
    },
    
    clearAllErrors: (state) => {
      Object.keys(state.errors).forEach(key => {
        state.errors[key] = null;
      });
    },
    
    // Reset state
    resetChatState: (state) => {
      return { ...initialState };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user chats
      .addCase(fetchUserChats.pending, (state) => {
        state.loading.chats = true;
        state.errors.chats = null;
      })
      .addCase(fetchUserChats.fulfilled, (state, action) => {
        state.loading.chats = false;
        state.chats = action.payload.data?.chats || action.payload.data || [];
        state.pagination.chats = action.payload.pagination || state.pagination.chats;
      })
      .addCase(fetchUserChats.rejected, (state, action) => {
        state.loading.chats = false;
        state.errors.chats = action.payload;
      })
      
      // Fetch group chats
      .addCase(fetchGroupChats.pending, (state) => {
        state.loading.groupChats = true;
        state.errors.groupChats = null;
      })
      .addCase(fetchGroupChats.fulfilled, (state, action) => {
        state.loading.groupChats = false;
        state.groupChats = action.payload.data?.groupChats || action.payload.data || [];
        state.pagination.groupChats = action.payload.pagination || state.pagination.groupChats;
      })
      .addCase(fetchGroupChats.rejected, (state, action) => {
        state.loading.groupChats = false;
        state.errors.groupChats = action.payload;
      })
      
      // Fetch one-to-one chats
      .addCase(fetchOneToOneChats.pending, (state) => {
        state.loading.oneToOneChats = true;
        state.errors.oneToOneChats = null;
      })
      .addCase(fetchOneToOneChats.fulfilled, (state, action) => {
        state.loading.oneToOneChats = false;
        state.oneToOneChats = action.payload.data?.oneToOneChats || action.payload.data || [];
        state.pagination.oneToOneChats = action.payload.pagination || state.pagination.oneToOneChats;
      })
      .addCase(fetchOneToOneChats.rejected, (state, action) => {
        state.loading.oneToOneChats = false;
        state.errors.oneToOneChats = action.payload;
      })
      
      // Fetch chatted users
      .addCase(fetchChattedUsers.pending, (state) => {
        state.loading.chattedUsers = true;
        state.errors.chattedUsers = null;
      })
      .addCase(fetchChattedUsers.fulfilled, (state, action) => {
        state.loading.chattedUsers = false;
        state.chattedUsers = action.payload.data?.items || action.payload.data || [];
        state.pagination.chattedUsers = action.payload.pagination || state.pagination.chattedUsers;
      })
      .addCase(fetchChattedUsers.rejected, (state, action) => {
        state.loading.chattedUsers = false;
        state.errors.chattedUsers = action.payload;
      })
      
      // Fetch chat by ID
      .addCase(fetchChatById.pending, (state) => {
        state.loading.currentChat = true;
        state.errors.currentChat = null;
      })
      .addCase(fetchChatById.fulfilled, (state, action) => {
        state.loading.currentChat = false;
        state.currentChat = action.payload.data?.chat || action.payload.data || action.payload;
      })
      .addCase(fetchChatById.rejected, (state, action) => {
        state.loading.currentChat = false;
        state.errors.currentChat = action.payload;
      })
      
      // Create group chat
      .addCase(createGroupChatAction.pending, (state) => {
        state.loading.creatingGroup = true;
        state.errors.creatingGroup = null;
      })
      .addCase(createGroupChatAction.fulfilled, (state, action) => {
        state.loading.creatingGroup = false;
        const newChat = action.payload.data?.chat || action.payload.data || action.payload;
        state.groupChats.unshift(newChat);
        state.chats.unshift(newChat);
        state.currentChat = newChat;
        state.selectedChatId = newChat._id;
        state.showCreateGroupModal = false;
      })
      .addCase(createGroupChatAction.rejected, (state, action) => {
        state.loading.creatingGroup = false;
        state.errors.creatingGroup = action.payload;
      })
      
      // Update group chat
      .addCase(updateGroupChatAction.pending, (state) => {
        state.loading.updatingGroup = true;
        state.errors.updatingGroup = null;
      })
      .addCase(updateGroupChatAction.fulfilled, (state, action) => {
        state.loading.updatingGroup = false;
        const updatedChat = action.payload.data?.chat || action.payload.data || action.payload;
        
        // Update in group chats
        const groupIndex = state.groupChats.findIndex(chat => chat._id === updatedChat._id);
        if (groupIndex !== -1) {
          state.groupChats[groupIndex] = updatedChat;
        }
        
        // Update in all chats
        const chatIndex = state.chats.findIndex(chat => chat._id === updatedChat._id);
        if (chatIndex !== -1) {
          state.chats[chatIndex] = updatedChat;
        }
        
        // Update current chat if it's the same
        if (state.currentChat?._id === updatedChat._id) {
          state.currentChat = updatedChat;
        }
      })
      .addCase(updateGroupChatAction.rejected, (state, action) => {
        state.loading.updatingGroup = false;
        state.errors.updatingGroup = action.payload;
      })
      
      // Add group members
      .addCase(addGroupMembersAction.pending, (state) => {
        state.loading.addingMembers = true;
        state.errors.addingMembers = null;
      })
      .addCase(addGroupMembersAction.fulfilled, (state, action) => {
        state.loading.addingMembers = false;
        const updatedChat = action.payload.data?.chat || action.payload.data || action.payload;
        
        // Update in group chats
        const groupIndex = state.groupChats.findIndex(chat => chat._id === updatedChat._id);
        if (groupIndex !== -1) {
          state.groupChats[groupIndex] = updatedChat;
        }
        
        // Update in all chats
        const chatIndex = state.chats.findIndex(chat => chat._id === updatedChat._id);
        if (chatIndex !== -1) {
          state.chats[chatIndex] = updatedChat;
        }
        
        // Update current chat if it's the same
        if (state.currentChat?._id === updatedChat._id) {
          state.currentChat = updatedChat;
        }
      })
      .addCase(addGroupMembersAction.rejected, (state, action) => {
        state.loading.addingMembers = false;
        state.errors.addingMembers = action.payload;
      })
      
      // Remove group member
      .addCase(removeGroupMemberAction.pending, (state) => {
        state.loading.removingMember = true;
        state.errors.removingMember = null;
      })
      .addCase(removeGroupMemberAction.fulfilled, (state, action) => {
        state.loading.removingMember = false;
        const updatedChat = action.payload.data?.chat || action.payload.data || action.payload;
        
        // Update in group chats
        const groupIndex = state.groupChats.findIndex(chat => chat._id === updatedChat._id);
        if (groupIndex !== -1) {
          state.groupChats[groupIndex] = updatedChat;
        }
        
        // Update in all chats
        const chatIndex = state.chats.findIndex(chat => chat._id === updatedChat._id);
        if (chatIndex !== -1) {
          state.chats[chatIndex] = updatedChat;
        }
        
        // Update current chat if it's the same
        if (state.currentChat?._id === updatedChat._id) {
          state.currentChat = updatedChat;
        }
      })
      .addCase(removeGroupMemberAction.rejected, (state, action) => {
        state.loading.removingMember = false;
        state.errors.removingMember = action.payload;
      })
      
      // Update member role
      .addCase(updateMemberRoleAction.pending, (state) => {
        state.loading.updatingRole = true;
        state.errors.updatingRole = null;
      })
      .addCase(updateMemberRoleAction.fulfilled, (state, action) => {
        state.loading.updatingRole = false;
        const updatedChat = action.payload.data?.chat || action.payload.data || action.payload;
        
        // Update in group chats
        const groupIndex = state.groupChats.findIndex(chat => chat._id === updatedChat._id);
        if (groupIndex !== -1) {
          state.groupChats[groupIndex] = updatedChat;
        }
        
        // Update in all chats
        const chatIndex = state.chats.findIndex(chat => chat._id === updatedChat._id);
        if (chatIndex !== -1) {
          state.chats[chatIndex] = updatedChat;
        }
        
        // Update current chat if it's the same
        if (state.currentChat?._id === updatedChat._id) {
          state.currentChat = updatedChat;
        }
      })
      .addCase(updateMemberRoleAction.rejected, (state, action) => {
        state.loading.updatingRole = false;
        state.errors.updatingRole = action.payload;
      })
      
      // Leave group
      .addCase(leaveGroupAction.pending, (state) => {
        state.loading.leavingGroup = true;
        state.errors.leavingGroup = null;
      })
      .addCase(leaveGroupAction.fulfilled, (state, action) => {
        state.loading.leavingGroup = false;
        const leftChatId = action.payload.data?.chat?._id || action.payload.data?._id;
        
        // Remove from group chats
        state.groupChats = state.groupChats.filter(chat => chat._id !== leftChatId);
        
        // Remove from all chats
        state.chats = state.chats.filter(chat => chat._id !== leftChatId);
        
        // Clear current chat if it's the one we left
        if (state.currentChat?._id === leftChatId) {
          state.currentChat = null;
          state.selectedChatId = null;
        }
      })
      .addCase(leaveGroupAction.rejected, (state, action) => {
        state.loading.leavingGroup = false;
        state.errors.leavingGroup = action.payload;
      })
      
      // Archive chat
      .addCase(archiveChatAction.pending, (state) => {
        state.loading.archiving = true;
        state.errors.archiving = null;
      })
      .addCase(archiveChatAction.fulfilled, (state, action) => {
        state.loading.archiving = false;
        const archivedChat = action.payload.data?.chat || action.payload.data || action.payload;
        
        // Update in group chats
        const groupIndex = state.groupChats.findIndex(chat => chat._id === archivedChat._id);
        if (groupIndex !== -1) {
          state.groupChats[groupIndex] = archivedChat;
        }
        
        // Update in all chats
        const chatIndex = state.chats.findIndex(chat => chat._id === archivedChat._id);
        if (chatIndex !== -1) {
          state.chats[chatIndex] = archivedChat;
        }
        
        // Update current chat if it's the same
        if (state.currentChat?._id === archivedChat._id) {
          state.currentChat = archivedChat;
        }
      })
      .addCase(archiveChatAction.rejected, (state, action) => {
        state.loading.archiving = false;
        state.errors.archiving = action.payload;
      })
      
      // Unarchive chat
      .addCase(unarchiveChatAction.pending, (state) => {
        state.loading.unarchiving = true;
        state.errors.unarchiving = null;
      })
      .addCase(unarchiveChatAction.fulfilled, (state, action) => {
        state.loading.unarchiving = false;
        const unarchivedChat = action.payload.data?.chat || action.payload.data || action.payload;
        
        // Update in group chats
        const groupIndex = state.groupChats.findIndex(chat => chat._id === unarchivedChat._id);
        if (groupIndex !== -1) {
          state.groupChats[groupIndex] = unarchivedChat;
        }
        
        // Update in all chats
        const chatIndex = state.chats.findIndex(chat => chat._id === unarchivedChat._id);
        if (chatIndex !== -1) {
          state.chats[chatIndex] = unarchivedChat;
        }
        
        // Update current chat if it's the same
        if (state.currentChat?._id === unarchivedChat._id) {
          state.currentChat = unarchivedChat;
        }
      })
      .addCase(unarchiveChatAction.rejected, (state, action) => {
        state.loading.unarchiving = false;
        state.errors.unarchiving = action.payload;
      })
      
      // Fetch group members
      .addCase(fetchGroupMembers.pending, (state) => {
        state.loading.groupMembers = true;
        state.errors.groupMembers = null;
      })
      .addCase(fetchGroupMembers.fulfilled, (state, action) => {
        state.loading.groupMembers = false;
        state.groupMembers = action.payload.data?.members || action.payload.data || [];
        state.isAdmin = action.payload.data?.isAdmin || false;
        state.userRole = action.payload.data?.userRole || 'member';
      })
      .addCase(fetchGroupMembers.rejected, (state, action) => {
        state.loading.groupMembers = false;
        state.errors.groupMembers = action.payload;
      });
  },
});

// Export actions
export const {
  setSelectedChatId,
  setCurrentChat,
  setCurrentChatMessages,
  addMessageToCurrentChat,
  updateMessageInCurrentChat,
  removeMessageFromCurrentChat,
  setShowCreateGroupModal,
  setShowNewChatModal,
  setShowGroupMembersModal,
  clearError,
  clearAllErrors,
  resetChatState,
} = chatSlice.actions;

// Export selectors
export const selectChats = (state) => state.chat.chats;
export const selectGroupChats = (state) => state.chat.groupChats;
export const selectOneToOneChats = (state) => state.chat.oneToOneChats;
export const selectChattedUsers = (state) => state.chat.chattedUsers;
export const selectCurrentChat = (state) => state.chat.currentChat;
export const selectCurrentChatMessages = (state) => state.chat.currentChatMessages;
export const selectSelectedChatId = (state) => state.chat.selectedChatId;
export const selectGroupMembers = (state) => state.chat.groupMembers;
export const selectIsAdmin = (state) => state.chat.isAdmin;
export const selectUserRole = (state) => state.chat.userRole;

// Modal selectors
export const selectShowCreateGroupModal = (state) => state.chat.showCreateGroupModal;
export const selectShowNewChatModal = (state) => state.chat.showNewChatModal;
export const selectShowGroupMembersModal = (state) => state.chat.showGroupMembersModal;

// Loading selectors
export const selectChatLoading = (state) => state.chat.loading;
export const selectChatErrors = (state) => state.chat.errors;

// Pagination selectors
export const selectChatPagination = (state) => state.chat.pagination;

export default chatSlice.reducer;
