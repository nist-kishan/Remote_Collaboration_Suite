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
    console.error('❌ getUserDocuments API Error:', error);
    throw error.response || error;
  }
};

// Get all documents (for admin or public access)
export const getAllDocuments = async (params = {}) => {
  try {
    const response = await ApiClient.get("/documents/all", { params });
    return response.data;
  } catch (error) {
    console.error('❌ getAllDocuments API Error:', error);
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

// Upload file to document
export const uploadFileToDocument = async (documentId, file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentId', documentId);
    
    const response = await ApiClient.post(`/documents/${documentId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Download document in different formats
export const downloadDocument = async (documentId, format = 'pdf') => {
  try {
    const response = await ApiClient.get(`/documents/${documentId}/download`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Export document (legacy function for backward compatibility)
export const exportDocument = async (documentId, format = 'pdf') => {
  return downloadDocument(documentId, format);
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
    console.error('❌ [AUTO-SAVE API] Auto-save error:', {
      documentId,
      error: error.response?.data || error.message,
      status: error.response?.status
    });
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

// Get document by ID (alias for getDocument)
export const getDocumentById = getDocument;

// Get document comments
export const getDocumentComments = async (documentId) => {
  try {
    const response = await ApiClient.get(`/documents/${documentId}/comments`);
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Add comment to document
export const addComment = async (documentId, data) => {
  try {
    const response = await ApiClient.post(`/documents/${documentId}/comments`, data);
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Update comment
export const updateComment = async (documentId, commentId, data) => {
  try {
    const response = await ApiClient.put(`/documents/${documentId}/comments/${commentId}`, data);
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

// Delete comment
export const deleteComment = async (documentId, commentId) => {
  try {
    const response = await ApiClient.delete(`/documents/${documentId}/comments/${commentId}`);
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};