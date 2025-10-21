import { useState, useCallback } from 'react';
import { 
  compressImage, 
  generateVideoThumbnail, 
  generatePlaceholder,
  formatFileSize,
  getFileType 
} from '../utils/mediaUtils';

export const useOptimizedMediaUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadFile, setCurrentUploadFile] = useState(null);

  const processFile = useCallback(async (file) => {
    const fileType = getFileType(file);
    const processedFile = {
      original: file,
      type: fileType,
      name: file.name,
      size: file.size,
      formattedSize: formatFileSize(file.size),
      url: null,
      thumbnail: null,
      placeholder: null
    };

    try {
      // Generate placeholder immediately
      if (fileType === 'image') {
        processedFile.placeholder = await generatePlaceholder(file);
      }

      // Process based on file type
      switch (fileType) {
        case 'image':
          // Compress image
          const compressedImage = await compressImage(file);
          processedFile.url = URL.createObjectURL(compressedImage);
          break;

        case 'video':
          // Generate thumbnail and use original video
          processedFile.thumbnail = await generateVideoThumbnail(file);
          processedFile.url = URL.createObjectURL(file);
          break;

        case 'audio':
          // Use original file for audio
          processedFile.url = URL.createObjectURL(file);
          break;

        default:
          // For other files, just create URL
          processedFile.url = URL.createObjectURL(file);
          break;
      }

      return processedFile;
    } catch (error) {
      // Fallback to original file
      processedFile.url = URL.createObjectURL(file);
      return processedFile;
    }
  }, []);

  const uploadFile = useCallback(async (file, uploadFunction) => {
    setIsUploading(true);
    setUploadProgress(0);
    setCurrentUploadFile(file);

    try {
      const processedFile = await processFile(file);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 200);

      // Upload the file
      const result = await uploadFunction(processedFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Clean up object URLs after successful upload
      setTimeout(() => {
        if (processedFile.url) URL.revokeObjectURL(processedFile.url);
        if (processedFile.thumbnail) URL.revokeObjectURL(processedFile.thumbnail);
        if (processedFile.placeholder) URL.revokeObjectURL(processedFile.placeholder);
      }, 1000);

      return result;
    } catch (error) {
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentUploadFile(null);
    }
  }, [processFile]);

  const uploadMultipleFiles = useCallback(async (files, uploadFunction) => {
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const result = await uploadFile(file, uploadFunction);
        results.push(result);
      } catch (error) {
        results.push({ error: error.message, file: file.name });
      }
    }
    
    return results;
  }, [uploadFile]);

  return {
    isUploading,
    uploadProgress,
    currentUploadFile,
    uploadFile,
    uploadMultipleFiles,
    processFile
  };
};
