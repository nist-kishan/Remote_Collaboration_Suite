import ApiClient from "./ApiClient";

export const taskApi = {
  // Get all Kanban boards
  getAllKanbanBoards: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.priority) queryParams.append('priority', params.priority);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    return ApiClient.get(`/tasks/kanban-boards?${queryParams.toString()}`);
  },

  // Get project tasks
  getProjectTasks: (projectId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.assignedTo) queryParams.append('assignedTo', params.assignedTo);
    if (params.priority) queryParams.append('priority', params.priority);
    if (params.type) queryParams.append('type', params.type);
    if (params.search) queryParams.append('search', params.search);
    
    return ApiClient.get(`/tasks/projects/${projectId}/tasks?${queryParams.toString()}`);
  },

  // Get single task
  getTask: (taskId) => {
    return ApiClient.get(`/tasks/tasks/${taskId}`);
  },

  // Create task
  createTask: (projectId, data) => {
    return ApiClient.post(`/tasks/projects/${projectId}/tasks`, data);
  },

  // Update task
  updateTask: (taskId, data) => {
    return ApiClient.put(`/tasks/tasks/${taskId}`, data);
  },

  // Delete task
  deleteTask: (taskId) => {
    return ApiClient.delete(`/tasks/tasks/${taskId}`);
  },

  // Move task (drag & drop)
  moveTask: (taskId, data) => {
    return ApiClient.patch(`/tasks/tasks/${taskId}/move`, data);
  },

  // Add task comment
  addTaskComment: (taskId, data) => {
    return ApiClient.post(`/tasks/tasks/${taskId}/comments`, data);
  },

  // Log time on task
  logTaskTime: (taskId, data) => {
    return ApiClient.post(`/tasks/tasks/${taskId}/time-log`, data);
  },

  // Get task statistics
  getTaskStats: (projectId) => {
    return ApiClient.get(`/tasks/projects/${projectId}/task-stats`);
  }
};

export default taskApi;
