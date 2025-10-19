import ApiClient from "./ApiClient";

// Get current user profile
export const getCurrentUser = async () => {
  try {
    const response = await ApiClient.get("/users/profile");
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Get user roles and permissions
export const getUserRoles = async () => {
  try {
    const response = await ApiClient.get("/users/roles");
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Update user role (admin only)
export const updateUserRole = async (userId, data) => {
  try {
    const response = await ApiClient.put(`/users/${userId}/role`, data);
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Get all users (admin only)
export const getAllUsers = async (params = {}) => {
  try {
    const response = await ApiClient.get("/users", { params });
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Search users for chat
export const searchUsers = async (searchTerm, limit = 20) => {
  try {
    const response = await ApiClient.get("/users/search", { 
      params: { q: searchTerm, limit } 
    });
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};