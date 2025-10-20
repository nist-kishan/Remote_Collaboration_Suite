/**
 * URL Configuration Helper
 * Provides robust URL generation with fallbacks
 */

/**
 * Get the frontend URL with fallback options
 * @returns {string} The frontend URL
 */
export const getFrontendUrl = () => {
  // Try multiple environment variables in order of preference
  const frontendUrl = 
    process.env.FRONTEND_URL || 
    process.env.CLIENT_URL || 
    process.env.NEXT_PUBLIC_FRONTEND_URL ||
    process.env.REACT_APP_FRONTEND_URL ||
    process.env.VITE_FRONTEND_URL ||
    'http://localhost:5173'; // Default fallback

  // console.log('🌐 Frontend URL resolved to:', frontendUrl);
  return frontendUrl;
};

/**
 * Generate a document sharing URL
 * @param {string} documentId - The document ID
 * @returns {string} The complete document URL
 */
export const getDocumentUrl = (documentId) => {
  const frontendUrl = getFrontendUrl();
  const documentUrl = `${frontendUrl}/documents/shared/${documentId}`;
  
  // console.log('📄 Document URL generated:', documentUrl);
  return documentUrl;
};

/**
 * Generate a whiteboard sharing URL
 * @param {string} whiteboardId - The whiteboard ID
 * @returns {string} The complete whiteboard URL
 */
export const getWhiteboardUrl = (whiteboardId) => {
  const frontendUrl = getFrontendUrl();
  const whiteboardUrl = `${frontendUrl}/boards/${whiteboardId}`;
  
  // console.log('🎨 Whiteboard URL generated:', whiteboardUrl);
  return whiteboardUrl;
};

/**
 * Generate a meeting URL
 * @param {string} meetingId - The meeting ID
 * @returns {string} The complete meeting URL
 */
export const getMeetingUrl = (meetingId) => {
  const frontendUrl = getFrontendUrl();
  const meetingUrl = `${frontendUrl}/meetings/${meetingId}`;
  
  // console.log('📅 Meeting URL generated:', meetingUrl);
  return meetingUrl;
};

/**
 * Generate a project URL
 * @param {string} projectId - The project ID
 * @returns {string} The complete project URL
 */
export const getProjectUrl = (projectId) => {
  const frontendUrl = getFrontendUrl();
  const projectUrl = `${frontendUrl}/projects/${projectId}`;
  
  // console.log('📁 Project URL generated:', projectUrl);
  return projectUrl;
};

/**
 * Generate a workspace URL
 * @param {string} workspaceId - The workspace ID
 * @returns {string} The complete workspace URL
 */
export const getWorkspaceUrl = (workspaceId) => {
  const frontendUrl = getFrontendUrl();
  const workspaceUrl = `${frontendUrl}/workspaces/${workspaceId}`;
  
  // console.log('🏢 Workspace URL generated:', workspaceUrl);
  return workspaceUrl;
};

/**
 * Validate if a URL is properly formed
 * @param {string} url - The URL to validate
 * @returns {boolean} Whether the URL is valid
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get environment-specific configuration
 * @returns {object} Environment configuration
 */
export const getEnvironmentConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    isDevelopment,
    isProduction,
    frontendUrl: getFrontendUrl(),
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development'
  };
};
