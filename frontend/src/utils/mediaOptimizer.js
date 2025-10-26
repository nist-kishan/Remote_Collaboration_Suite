/**
 * Media optimization utilities for faster uploads
 */

// Image compression function
export const compressImage = (file, maxWidth = 1920, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        file.type,
        quality
      );
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Video compression function (basic)
export const compressVideo = (file) => {
  return new Promise((resolve) => {
    // For now, return original file
    // In a real implementation, you'd use FFmpeg.js or similar
    resolve(file);
  });
};

// Optimize file based on type
export const optimizeFile = async (file, options = {}) => {
  const { maxImageSize = 1920, quality = 0.8, maxFileSize = 10 * 1024 * 1024 } = options;
  
  // If file is too large, compress it
  if (file.size > maxFileSize) {
    if (file.type.startsWith('image/')) {
      return await compressImage(file, maxImageSize, quality);
    } else if (file.type.startsWith('video/')) {
      return await compressVideo(file);
    }
  }
  
  return file;
};

// Create optimized file object
export const createOptimizedFile = async (file, options = {}) => {
  const optimizedFile = await optimizeFile(file, options);
  
  return {
    file: optimizedFile,
    originalSize: file.size,
    optimizedSize: optimizedFile.size,
    compressionRatio: ((file.size - optimizedFile.size) / file.size * 100).toFixed(1),
    url: URL.createObjectURL(optimizedFile),
    name: optimizedFile.name,
    type: optimizedFile.type,
    lastModified: optimizedFile.lastModified
  };
};

// Batch optimize files
export const optimizeFiles = async (files, options = {}) => {
  const optimizedFiles = await Promise.all(
    files.map(file => createOptimizedFile(file, options))
  );
  
  return optimizedFiles;
};

// Upload progress tracker
export class UploadProgressTracker {
  constructor() {
    this.progress = new Map();
    this.listeners = new Set();
  }
  
  setProgress(fileId, progress) {
    this.progress.set(fileId, progress);
    this.notifyListeners();
  }
  
  getProgress(fileId) {
    return this.progress.get(fileId) || 0;
  }
  
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.progress));
  }
  
  clear() {
    this.progress.clear();
    this.notifyListeners();
  }
}

// File size formatter
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Supported file types
export const SUPPORTED_TYPES = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/ogg'],
  audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'],
  document: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

// File validation
export const validateFile = (file, type = 'image') => {
  const maxSizes = {
    image: 10 * 1024 * 1024, // 10MB
    video: 50 * 1024 * 1024, // 50MB
    audio: 20 * 1024 * 1024, // 20MB
    document: 5 * 1024 * 1024  // 5MB
  };
  
  if (!SUPPORTED_TYPES[type]?.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }
  
  if (file.size > maxSizes[type]) {
    throw new Error(`File too large: ${formatFileSize(file.size)} (max: ${formatFileSize(maxSizes[type])})`);
  }
  
  return true;
};
