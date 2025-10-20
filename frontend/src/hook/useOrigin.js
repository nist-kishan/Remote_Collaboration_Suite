import { useState, useEffect } from 'react';

/**
 * Custom hook for getting the origin URL of the current application
 * Replaces direct window.location.origin usage with React patterns
 */
export const useOrigin = () => {
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    // Get origin from window.location
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  // Helper function to build full URLs
  const buildUrl = (path = '') => {
    if (!origin) return path;
    
    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${origin}${normalizedPath}`;
  };

  // Helper function to get share URL for documents
  const getDocumentShareUrl = (documentId) => {
    return buildUrl(`/documents/shared/${documentId}`);
  };

  // Helper function to get share URL for whiteboards
  const getWhiteboardShareUrl = (whiteboardId) => {
    return buildUrl(`/whiteboards/shared/${whiteboardId}`);
  };

  // Helper function to get share URL for projects
  const getProjectShareUrl = (projectId) => {
    return buildUrl(`/projects/shared/${projectId}`);
  };

  // Helper function to get share URL for meetings
  const getMeetingShareUrl = (meetingId) => {
    return buildUrl(`/meetings/shared/${meetingId}`);
  };

  return {
    origin,
    buildUrl,
    getDocumentShareUrl,
    getWhiteboardShareUrl,
    getProjectShareUrl,
    getMeetingShareUrl
  };
};
