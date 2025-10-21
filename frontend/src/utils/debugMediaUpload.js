export const debugMediaUpload = {
  logFileSelection: (file, type) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[MediaUpload] File selected:', {
        name: file.name,
        size: file.size,
        type: file.type,
        dataType: type
      });
    }
  },
  
  logUploadStart: (chatId, fileCount) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[MediaUpload] Upload started:', {
        chatId,
        fileCount
      });
    }
  },
  
  logUploadProgress: (progress) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[MediaUpload] Upload progress:', progress);
    }
  },
  
  logUploadSuccess: (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[MediaUpload] Upload successful:', response);
    }
  },
  
  logUploadError: (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[MediaUpload] Upload error:', error);
    }
  },
  
  logMessage: (message, data = null) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MediaUpload] ${message}`, data);
    }
  }
};
