import ApiClient from './ApiClient';

export const budgetRequestApi = {
  // Create budget request
  createBudgetRequest: (projectId, data) => {
    return ApiClient.post(`/projects/${projectId}/budget-requests`, data);
  },

  // Get budget requests for a project
  getBudgetRequests: (projectId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return ApiClient.get(`/projects/${projectId}/budget-requests${queryString ? `?${queryString}` : ''}`);
  },

  // Approve budget request
  approveBudgetRequest: (requestId) => {
    return ApiClient.post(`/budget-requests/${requestId}/approve`);
  },

  // Reject budget request
  rejectBudgetRequest: (requestId, data) => {
    return ApiClient.post(`/budget-requests/${requestId}/reject`, data);
  },

  // Get user's budget requests
  getUserBudgetRequests: () => {
    return ApiClient.get('/budget-requests/user');
  }
};

