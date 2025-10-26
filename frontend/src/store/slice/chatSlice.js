import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Current chat state
  currentChat: null,
  selectedChat: null,
  
  // Chat list state
  chatList: [],
  filteredChatList: [],
  
  // UI state
  showCreateGroupModal: false,
  showNewChatModal: false,
  showChatDetails: false,
  showGroupMembers: false,
  showEmojiPicker: false,
  showMediaViewer: false,
  
  // Search and filters
  searchQuery: '',
  chatType: 'all', // 'all', 'one-to-one', 'group'
  
  // Message state
  messages: [],
  typingUsers: [],
  isTyping: false,
  messageInput: '',
  replyToMessage: null,
  
  // Media state
  selectedMedia: null,
  mediaViewerIndex: 0,
  
  // Group management
  groupMembers: [],
  selectedMembers: [],
  
  // Error handling
  errors: [],
  
  // Loading states (for UI only)
  isLoading: false,
  isSendingMessage: false,
  isUploadingMedia: false
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Chat management
    setCurrentChat: (state, action) => {
      state.currentChat = action.payload;
    },
    
    setSelectedChat: (state, action) => {
      state.selectedChat = action.payload;
    },
    
    updateChatList: (state, action) => {
      state.chatList = action.payload;
    },
    
    addChatToList: (state, action) => {
      const newChat = action.payload;
      const existingIndex = state.chatList.findIndex(chat => chat._id === newChat._id);
      
      if (existingIndex >= 0) {
        state.chatList[existingIndex] = newChat;
      } else {
        state.chatList.unshift(newChat);
      }
    },
    
    updateChatInList: (state, action) => {
      const { chatId, updates } = action.payload;
      const chatIndex = state.chatList.findIndex(chat => chat._id === chatId);
      
      if (chatIndex >= 0) {
        state.chatList[chatIndex] = {
          ...state.chatList[chatIndex],
          ...updates
        };
      }
    },
    
    removeChatFromList: (state, action) => {
      state.chatList = state.chatList.filter(chat => chat._id !== action.payload);
    },
    
    // Message management
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    
    updateMessage: (state, action) => {
      const { messageId, updates } = action.payload;
      const messageIndex = state.messages.findIndex(msg => msg._id === messageId);
      
      if (messageIndex >= 0) {
        state.messages[messageIndex] = {
          ...state.messages[messageIndex],
          ...updates
        };
      }
    },
    
    removeMessage: (state, action) => {
      state.messages = state.messages.filter(msg => msg._id !== action.payload);
    },
    
    // Typing indicators
    setTypingUsers: (state, action) => {
      state.typingUsers = action.payload;
    },
    
    addTypingUser: (state, action) => {
      const userId = action.payload;
      if (!state.typingUsers.includes(userId)) {
        state.typingUsers.push(userId);
      }
    },
    
    removeTypingUser: (state, action) => {
      state.typingUsers = state.typingUsers.filter(userId => userId !== action.payload);
    },
    
    setIsTyping: (state, action) => {
      state.isTyping = action.payload;
    },
    
    // Message input
    setMessageInput: (state, action) => {
      state.messageInput = action.payload;
    },
    
    setReplyToMessage: (state, action) => {
      state.replyToMessage = action.payload;
    },
    
    clearReplyToMessage: (state) => {
      state.replyToMessage = null;
    },
    
    // Search and filters
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    
    setChatType: (state, action) => {
      state.chatType = action.payload;
    },
    
    setFilteredChatList: (state, action) => {
      state.filteredChatList = action.payload;
    },
    
    // Modal management
    setShowCreateGroupModal: (state, action) => {
      state.showCreateGroupModal = action.payload;
    },
    
    setShowNewChatModal: (state, action) => {
      state.showNewChatModal = action.payload;
    },
    
    setShowChatDetails: (state, action) => {
      state.showChatDetails = action.payload;
    },
    
    setShowGroupMembers: (state, action) => {
      state.showGroupMembers = action.payload;
    },
    
    setShowEmojiPicker: (state, action) => {
      state.showEmojiPicker = action.payload;
    },
    
    setShowMediaViewer: (state, action) => {
      state.showMediaViewer = action.payload;
    },
    
    // Media management
    setSelectedMedia: (state, action) => {
      state.selectedMedia = action.payload;
    },
    
    setMediaViewerIndex: (state, action) => {
      state.mediaViewerIndex = action.payload;
    },
    
    // Group management
    setGroupMembers: (state, action) => {
      state.groupMembers = action.payload;
    },
    
    addGroupMember: (state, action) => {
      const member = action.payload;
      const existingIndex = state.groupMembers.findIndex(m => m._id === member._id);
      
      if (existingIndex >= 0) {
        state.groupMembers[existingIndex] = member;
      } else {
        state.groupMembers.push(member);
      }
    },
    
    removeGroupMember: (state, action) => {
      state.groupMembers = state.groupMembers.filter(member => member._id !== action.payload);
    },
    
    updateGroupMember: (state, action) => {
      const { memberId, updates } = action.payload;
      const memberIndex = state.groupMembers.findIndex(m => m._id === memberId);
      
      if (memberIndex >= 0) {
        state.groupMembers[memberIndex] = {
          ...state.groupMembers[memberIndex],
          ...updates
        };
      }
    },
    
    setSelectedMembers: (state, action) => {
      state.selectedMembers = action.payload;
    },
    
    addSelectedMember: (state, action) => {
      const member = action.payload;
      const existingIndex = state.selectedMembers.findIndex(m => m._id === member._id);
      
      if (existingIndex === -1) {
        state.selectedMembers.push(member);
      }
    },
    
    removeSelectedMember: (state, action) => {
      state.selectedMembers = state.selectedMembers.filter(member => member._id !== action.payload);
    },
    
    // Loading states
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    
    setSendingMessage: (state, action) => {
      state.isSendingMessage = action.payload;
    },
    
    setUploadingMedia: (state, action) => {
      state.isUploadingMedia = action.payload;
    },
    
    // Error handling
    addError: (state, action) => {
      state.errors.push({
        id: Date.now(),
        message: action.payload,
        timestamp: new Date().toISOString()
      });
    },
    
    clearError: (state, action) => {
      state.errors = state.errors.filter(error => error.id !== action.payload);
    },
    
    clearAllErrors: (state) => {
      state.errors = [];
    },
    
    // Reset state
    resetChatState: (state) => {
      return { ...initialState };
    },
    
    // Convenience functions for ChatPageRedux
    selectChat: (state, action) => {
      state.selectedChat = action.payload;
      state.currentChat = action.payload;
    },
    
    openCreateGroupModal: (state) => {
      state.showCreateGroupModal = true;
    },
    
    closeCreateGroupModal: (state) => {
      state.showCreateGroupModal = false;
    },
    
    openNewChatModal: (state) => {
      state.showNewChatModal = true;
    },
    
    closeNewChatModal: (state) => {
      state.showNewChatModal = false;
    }
  }
});

// Export actions
export const {
  setCurrentChat,
  setSelectedChat,
  updateChatList,
  addChatToList,
  updateChatInList,
  removeChatFromList,
  setMessages,
  addMessage,
  updateMessage,
  removeMessage,
  setTypingUsers,
  addTypingUser,
  removeTypingUser,
  setIsTyping,
  setMessageInput,
  setReplyToMessage,
  clearReplyToMessage,
  setSearchQuery,
  setChatType,
  setFilteredChatList,
  setShowCreateGroupModal,
  setShowNewChatModal,
  setShowChatDetails,
  setShowGroupMembers,
  setShowEmojiPicker,
  setShowMediaViewer,
  setSelectedMedia,
  setMediaViewerIndex,
  setGroupMembers,
  addGroupMember,
  removeGroupMember,
  updateGroupMember,
  setSelectedMembers,
  addSelectedMember,
  removeSelectedMember,
  setLoading,
  setSendingMessage,
  setUploadingMedia,
  addError,
  clearError,
  clearAllErrors,
  resetChatState,
  selectChat,
  openCreateGroupModal,
  closeCreateGroupModal,
  openNewChatModal,
  closeNewChatModal
} = chatSlice.actions;

// Export selectors
export const selectCurrentChat = (state) => state.chat.currentChat;
export const selectSelectedChat = (state) => state.chat.selectedChat;
export const selectChatList = (state) => state.chat.chatList;
export const selectFilteredChatList = (state) => state.chat.filteredChatList;
export const selectMessages = (state) => state.chat.messages;
export const selectTypingUsers = (state) => state.chat.typingUsers;
export const selectIsTyping = (state) => state.chat.isTyping;
export const selectMessageInput = (state) => state.chat.messageInput;
export const selectReplyToMessage = (state) => state.chat.replyToMessage;
export const selectSearchQuery = (state) => state.chat.searchQuery;
export const selectChatType = (state) => state.chat.chatType;
export const selectShowCreateGroupModal = (state) => state.chat.showCreateGroupModal;
export const selectShowNewChatModal = (state) => state.chat.showNewChatModal;
export const selectShowChatDetails = (state) => state.chat.showChatDetails;
export const selectShowGroupMembers = (state) => state.chat.showGroupMembers;
export const selectShowEmojiPicker = (state) => state.chat.showEmojiPicker;
export const selectShowMediaViewer = (state) => state.chat.showMediaViewer;
export const selectSelectedMedia = (state) => state.chat.selectedMedia;
export const selectMediaViewerIndex = (state) => state.chat.mediaViewerIndex;
export const selectGroupMembers = (state) => state.chat.groupMembers;
export const selectSelectedMembers = (state) => state.chat.selectedMembers;
export const selectIsLoading = (state) => state.chat.isLoading;
export const selectIsSendingMessage = (state) => state.chat.isSendingMessage;
export const selectIsUploadingMedia = (state) => state.chat.isUploadingMedia;
export const selectChatErrors = (state) => state.chat.errors;

export default chatSlice.reducer;