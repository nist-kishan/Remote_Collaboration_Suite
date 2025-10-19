import ApiClient from "./ApiClient";

// Create a new document
export const createDocument = async (data) => {
  try {
    const response = await ApiClient.post("/documents", data);
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Get user's documents
export const getUserDocuments = async (params = {}) => {
  try {
    const response = await ApiClient.get("/documents", { params });
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Get a single document
export const getDocument = async (documentId) => {
  try {
    const response = await ApiClient.get(`/documents/${documentId}`);
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Update document
export const updateDocument = async (documentId, data) => {
  try {
    const response = await ApiClient.put(`/documents/${documentId}`, data);
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Delete document
export const deleteDocument = async (documentId) => {
  try {
    const response = await ApiClient.delete(`/documents/${documentId}`);
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Share document
export const shareDocument = async (documentId, data) => {
  try {
    const response = await ApiClient.post(`/documents/${documentId}/share`, data);
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Update collaborator role
export const updateCollaboratorRole = async (documentId, userId, role) => {
  try {
    const response = await ApiClient.put(`/documents/${documentId}/collaborators/${userId}/role`, { role });
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Remove collaborator
export const removeCollaborator = async (documentId, userId) => {
  try {
    const response = await ApiClient.delete(`/documents/${documentId}/collaborators/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};


// Share document via email
export const shareDocumentViaEmail = async (documentId, data) => {
  try {
    const response = await ApiClient.post(`/documents/${documentId}/share-email`, data);
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Get document preview (public access)
export const getDocumentPreview = async (documentId) => {
  try {
    const response = await ApiClient.get(`/public/documents/${documentId}/preview`);
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Search documents
export const searchDocuments = async (params = {}) => {
  try {
    const response = await ApiClient.get("/documents/search", { params });
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Auto-save document
export const autoSaveDocument = async (documentId, content) => {
  try {
    const response = await ApiClient.post(`/documents/${documentId}/autosave`, {
      content,
    });
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Enable auto-save for document
export const enableAutoSave = async (documentId) => {
  try {
    const response = await ApiClient.post(`/documents/${documentId}/enable-autosave`);
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};