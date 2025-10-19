import ApiClient from './ApiClient';

export const taskApi = {
  createTask: (projectId, data) => {
    return ApiClient.post(`/projects/${projectId}/tasks`, data);
  },

  // Get project tasks
  getProjectTasks: (projectId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return ApiClient.get(`/projects/${projectId}/tasks${queryString ? `?${queryString}` : ''}`);
  },

  // Get single task
  getTask: (taskId) => {
    return ApiClient.get(`/tasks/${taskId}`);
  },

  // Update task
  updateTask: (taskId, data) => {
    return ApiClient.put(`/tasks/${taskId}`, data);
  },

  // Move task (Kanban)
  moveTask: (taskId, data) => {
    return ApiClient.patch(`/tasks/${taskId}/move`, data);
  },

  // Delete task
  deleteTask: (taskId) => {
    return ApiClient.delete(`/tasks/${taskId}`);
  },

  // Add task comment
  addTaskComment: (taskId, data) => {
    return ApiClient.post(`/tasks/${taskId}/comments`, data);
  },

  // Log time on task
  logTaskTime: (taskId, data) => {
    return ApiClient.post(`/tasks/${taskId}/time-log`, data);
  },

  // Get task statistics
  getTaskStats: (projectId) => {
    return ApiClient.get(`/projects/${projectId}/task-stats`);
  },

  // Get all Kanban boards
  getAllKanbanBoards: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.status) queryParams.append('status', params.status);
    if (params.priority) queryParams.append('priority', params.priority);
    
    const queryString = queryParams.toString();
    const url = queryString ? `/kanban-boards?${queryString}` : '/kanban-boards';
    return ApiClient.get(url);
  }
};
