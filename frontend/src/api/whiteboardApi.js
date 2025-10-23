import ApiClient from "./ApiClient";

// Create a new whiteboard
export const createWhiteboard = async (data) => {
  try {
    const response = await ApiClient.post("/whiteboards", data);
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Get user's whiteboards
export const getUserWhiteboards = async (params = {}) => {
  try {
    const response = await ApiClient.get("/whiteboards", { params });
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Get all whiteboards (admin function)
export const getAllWhiteboards = async (params = {}) => {
  try {
    const response = await ApiClient.get("/whiteboards/all", { params });
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Get a single whiteboard
export const getWhiteboard = async (whiteboardId) => {
  try {
    const response = await ApiClient.get(`/whiteboards/${whiteboardId}`);
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Get whiteboard by ID (alias for getWhiteboard)
export const getWhiteboardById = getWhiteboard;

// Update whiteboard
export const updateWhiteboard = async (whiteboardId, data) => {
  try {
    const response = await ApiClient.put(`/whiteboards/${whiteboardId}`, data);
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Delete whiteboard
export const deleteWhiteboard = async (whiteboardId) => {
  try {
    const response = await ApiClient.delete(`/whiteboards/${whiteboardId}`);
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Share whiteboard
export const shareWhiteboard = async (whiteboardId, data) => {
  try {
    const response = await ApiClient.post(`/whiteboards/${whiteboardId}/share`, data);
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Update collaborator role
export const updateCollaboratorRole = async (whiteboardId, userId, role) => {
  try {
    const response = await ApiClient.put(`/whiteboards/${whiteboardId}/collaborators/${userId}/role`, { role });
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Update whiteboard collaborator role (alias for updateCollaboratorRole)
export const updateWhiteboardCollaboratorRole = updateCollaboratorRole;

// Remove collaborator
export const removeCollaborator = async (whiteboardId, userId) => {
  try {
    const response = await ApiClient.delete(`/whiteboards/${whiteboardId}/collaborators/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Remove whiteboard collaborator (alias for removeCollaborator)
export const removeWhiteboardCollaborator = removeCollaborator;

// Share whiteboard via email
export const shareWhiteboardViaEmail = async (whiteboardId, data) => {
  try {
    const response = await ApiClient.post(`/whiteboards/${whiteboardId}/share-email`, data);
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Get whiteboard preview (public access)
export const getWhiteboardPreview = async (whiteboardId) => {
  try {
    const response = await ApiClient.get(`/public/whiteboards/${whiteboardId}/preview`);
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Get whiteboard collaborators
export const getWhiteboardCollaborators = async (whiteboardId) => {
  try {
    const response = await ApiClient.get(`/whiteboards/${whiteboardId}/collaborators`);
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Search whiteboards
export const searchWhiteboards = async (params = {}) => {
  try {
    const response = await ApiClient.get("/whiteboards/search", { params });
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Auto-save whiteboard
export const autoSaveWhiteboard = async (whiteboardId, canvasData) => {
  try {
    const response = await ApiClient.post(`/whiteboards/${whiteboardId}/auto-save`, { canvasData });
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Enable/disable auto-save for whiteboard
export const enableAutoSave = async (whiteboardId, enabled = true) => {
  try {
    const response = await ApiClient.put(`/whiteboards/${whiteboardId}/auto-save/enable`, { enabled });
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};
