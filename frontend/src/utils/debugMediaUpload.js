// Debug utility for media upload issues
export const debugMediaUpload = {
  logFileSelection: (file, type) => {
    console.log('📁 File Selected:', {
      name: file.name,
      type: type,
      size: file.size,
      mimeType: file.type,
      lastModified: file.lastModified
    });
  },

  logUploadStart: (chatId, fileCount) => {
    console.log('🚀 Upload Starting:', {
      chatId,
      fileCount,
      timestamp: new Date().toISOString()
    });
  },

  logUploadProgress: (fileIndex, totalFiles, progress) => {
    console.log('📊 Upload Progress:', {
      fileIndex: fileIndex + 1,
      totalFiles,
      progress: `${progress}%`,
      timestamp: new Date().toISOString()
    });
  },

  logUploadSuccess: (response, fileIndex) => {
    console.log('✅ Upload Success:', {
      fileIndex: fileIndex + 1,
      response: response.data,
      timestamp: new Date().toISOString()
    });
  },

  logUploadError: (error, fileIndex) => {
    console.error('❌ Upload Error:', {
      fileIndex: fileIndex + 1,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  },

  logPreviewState: (previewFiles, captions) => {
    console.log('👀 Preview State:', {
      fileCount: previewFiles.length,
      files: previewFiles.map(f => ({ name: f.name, type: f.type, size: f.size })),
      captions: Object.keys(captions).length,
      timestamp: new Date().toISOString()
    });
  }
};

// Helper function to test if Cloudinary is accessible
export const testCloudinaryConnection = async () => {
  try {
    const response = await fetch('https://res.cloudinary.com/demo/image/upload/sample.jpg');
    if (response.ok) {
      console.log('✅ Cloudinary connection test successful');
      return true;
    } else {
      console.log('⚠️ Cloudinary connection test failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Cloudinary connection test error:', error);
    return false;
  }
};
