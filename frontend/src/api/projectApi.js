import ApiClient from './ApiClient';

export const projectApi = {
  // Get all projects for user (across all workspaces)
  getAllProjects: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.status) queryParams.append('status', params.status);
    if (params.priority) queryParams.append('priority', params.priority);
    
    const queryString = queryParams.toString();
    const url = queryString ? `/projects/all?${queryString}` : '/projects/all';
    return ApiClient.get(url);
  },

  // Create project in workspace
  createProject: (workspaceId, data) => {
    return ApiClient.post(`/workspaces/${workspaceId}/projects`, data);
  },

  // Get workspace projects
  getWorkspaceProjects: (workspaceId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return ApiClient.get(`/workspaces/${workspaceId}/projects${queryString ? `?${queryString}` : ''}`);
  },

  // Get single project
  getProject: (projectId) => {
    return ApiClient.get(`/projects/${projectId}`);
  },

  // Update project
  updateProject: (projectId, data) => {
    return ApiClient.put(`/projects/${projectId}`, data);
  },

  // Delete project
  deleteProject: (projectId) => {
    return ApiClient.delete(`/projects/${projectId}`);
  },

  // Add project member
  addProjectMember: (projectId, data) => {
    return ApiClient.post(`/projects/${projectId}/members`, data);
  },

  // Remove project member
  removeProjectMember: (projectId, userId) => {
    return ApiClient.delete(`/projects/${projectId}/members/${userId}`);
  },

  // Update member role
  updateMemberRole: (projectId, userId, data) => {
    return ApiClient.put(`/projects/${projectId}/members/${userId}`, data);
  },

  // Search workspace members for project
  searchWorkspaceMembers: (projectId, query) => {
    return ApiClient.get(`/projects/${projectId}/search-members?q=${encodeURIComponent(query)}`);
  },

  // Upload document to project
  uploadDocument: (projectId, formData) => {
    return ApiClient.post(`/projects/${projectId}/documents/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};
