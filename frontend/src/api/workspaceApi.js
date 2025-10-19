import ApiClient from './ApiClient';

export const workspaceApi = {
  // Create workspace
  createWorkspace: (data) => {
    return ApiClient.post('/workspaces', data);
  },

  // Get user's workspaces
  getUserWorkspaces: () => {
    return ApiClient.get('/workspaces');
  },

  // Get all workspaces with pagination and filtering
  getAllWorkspaces: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add pagination parameters
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    // Add search parameter
    if (params.search) queryParams.append('search', params.search);
    
    // Add sorting parameters
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    const queryString = queryParams.toString();
    const url = queryString ? `/workspaces/all?${queryString}` : '/workspaces/all';
    
    return ApiClient.get(url);
  },

  // Get workspace by ID
  getWorkspace: (workspaceId) => {
    return ApiClient.get(`/workspaces/${workspaceId}`);
  },

  // Update workspace
  updateWorkspace: (workspaceId, data) => {
    return ApiClient.put(`/workspaces/${workspaceId}`, data);
  },

  // Delete workspace
  deleteWorkspace: (workspaceId) => {
    return ApiClient.delete(`/workspaces/${workspaceId}`);
  },

  // Add member to workspace
  addMember: (workspaceId, data) => {
    return ApiClient.post(`/workspaces/${workspaceId}/members`, data);
  },

  // Remove member from workspace
  removeMember: (workspaceId, userId) => {
    return ApiClient.delete(`/workspaces/${workspaceId}/members/${userId}`);
  },

  // Update member role
  updateMemberRole: (workspaceId, userId, data) => {
    return ApiClient.put(`/workspaces/${workspaceId}/members/${userId}`, data);
  },

  // Search users for workspace
  searchUsers: (workspaceId, query) => {
    return ApiClient.get(`/workspaces/${workspaceId}/search-users?q=${encodeURIComponent(query)}`);
  }
};
