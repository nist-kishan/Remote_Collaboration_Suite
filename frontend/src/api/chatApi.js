import ApiClient from "./ApiClient";

export const getUserChats = (params = {}) => ApiClient.get('/chat', { params });
export const getUserGroupChats = (params = {}) => ApiClient.get('/chat', { params: { ...params, type: 'group' } });
export const getOneToOneChats = (params = {}) => ApiClient.get('/chat', { params: { ...params, type: 'one-to-one' } });
export const getChattedUsers = (params = {}) => {
  return ApiClient.get('/chat/chatted-users', { params });
};
export const getChatById = (chatId) => {

  if (!chatId) {
    throw new Error('Chat ID is required');
  }
  
  if (typeof chatId !== 'string' || chatId.length !== 24) {
    throw new Error('Invalid chat ID format');
  }
  
  return ApiClient.get(`/chat/${chatId}`);
};
export const getOrCreateOneToOneChat = (otherUserId) =>
  ApiClient.get(`/chat/one-to-one/${otherUserId}`);
export const createGroupChat = (data) => ApiClient.post('/chat/group', data);
export const updateGroupChat = (chatId, data) =>
  ApiClient.put(`/chat/group/${chatId}`, data);
export const addGroupMembers = (chatId, memberIds) =>
  ApiClient.post(`/chat/group/${chatId}/members`, { memberIds });
export const removeGroupMember = (chatId, memberId) =>
  ApiClient.delete(`/chat/group/${chatId}/members/${memberId}`);
export const leaveGroup = (chatId) =>
  ApiClient.post(`/chat/group/${chatId}/leave`);
export const updateMemberRole = (chatId, memberId, role) =>
  ApiClient.put(`/chat/group/${chatId}/members/${memberId}/role`, { role });
export const getGroupMembers = (chatId) =>
  ApiClient.get(`/chat/group/${chatId}/members`);
export const archiveChat = (chatId) =>
  ApiClient.post(`/chat/${chatId}/archive`);
export const unarchiveChat = (chatId) =>
  ApiClient.post(`/chat/${chatId}/unarchive`);
export const deleteChat = (chatId) =>
  ApiClient.delete(`/chat/${chatId}`);

// User-specific chat operations (soft delete/archive)
export const archiveChatForUser = (chatId) =>
  ApiClient.post(`/chat/${chatId}/archive-user`);
export const unarchiveChatForUser = (chatId) =>
  ApiClient.post(`/chat/${chatId}/unarchive-user`);
export const deleteChatForUser = (chatId) =>
  ApiClient.post(`/chat/${chatId}/delete-user`);
export const restoreChatForUser = (chatId) =>
  ApiClient.post(`/chat/${chatId}/restore-user`);

// Get archived and deleted chats for user
export const getArchivedChatsForUser = (params = {}) =>
  ApiClient.get('/chat/archived', { params });
export const getDeletedChatsForUser = (params = {}) =>
  ApiClient.get('/chat/deleted', { params });

// Message APIs
export const sendMessage = (chatId, data) =>
  ApiClient.post(`/chat/${chatId}/msg`, data);
export const uploadFile = (chatId, file, type, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  
  return ApiClient.post(`/chat/${chatId}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    },
  });
};
export const getChatMessages = (chatId, params) =>
  ApiClient.get(`/chat/${chatId}/msg`, { params });
export const editMessage = (chatId, messageId, content) =>
  ApiClient.put(`/chat/${chatId}/msg/${messageId}`, { content });
export const deleteMessage = (chatId, messageId) =>
  ApiClient.delete(`/chat/${chatId}/msg/${messageId}`);
export const addReaction = (chatId, messageId, emoji) =>
  ApiClient.post(`/chat/${chatId}/msg/${messageId}/reaction`, { emoji });
export const removeReaction = (chatId, messageId) =>
  ApiClient.delete(`/chat/${chatId}/msg/${messageId}/reaction`);
export const markAsRead = (chatId, messageId = null) =>
  ApiClient.post(`/chat/${chatId}/read`, { messageId });
export const markAsDelivered = (chatId, messageId) =>
  ApiClient.post(`/chat/${chatId}/msg/${messageId}/delivered`);
export const getReadReceipts = (chatId, messageId) =>
  ApiClient.get(`/chat/${chatId}/msg/${messageId}/receipts`);
export const getUnreadCount = (chatId) =>
  ApiClient.get(`/chat/${chatId}/unread-count`);
export const getTotalUnreadCount = () =>
  ApiClient.get('/chat/unread-count/total');

// User search API
export const searchUsers = (params = {}) => {
  // Convert 'query' parameter to 'q' as expected by backend
  const backendParams = { ...params };
  if (backendParams.query) {
    backendParams.q = backendParams.query;
    delete backendParams.query;
  }
  return ApiClient.get('/users/search', { params: backendParams });
};

