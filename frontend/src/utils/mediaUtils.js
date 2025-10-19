// Image compression utility
export const compressImage = (file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        'image/jpeg',
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
};

// Generate thumbnail for videos
export const generateVideoThumbnail = (file) => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.onloadedmetadata = () => {
      // Set canvas size for thumbnail
      canvas.width = 320;
      canvas.height = 180;

      // Seek to 1 second or 10% of video duration
      video.currentTime = Math.min(1, video.duration * 0.1);
    };

    video.onseeked = () => {
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        'image/jpeg',
        0.7
      );
    };

    video.src = URL.createObjectURL(file);
    video.load();
  });
};

// Generate low-quality placeholder
export const generatePlaceholder = (file) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Create very small canvas for placeholder
      canvas.width = 20;
      canvas.height = 20;

      // Draw scaled down image
      ctx.drawImage(img, 0, 0, 20, 20);
      
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        'image/jpeg',
        0.3
      );
    };

    img.src = URL.createObjectURL(file);
  });
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Check if file is image
export const isImage = (file) => {
  return file.type.startsWith('image/');
};

// Check if file is video
export const isVideo = (file) => {
  return file.type.startsWith('video/');
};

// Check if file is audio
export const isAudio = (file) => {
  return file.type.startsWith('audio/');
};

// Get file type category
export const getFileType = (file) => {
  if (isImage(file)) return 'image';
  if (isVideo(file)) return 'video';
  if (isAudio(file)) return 'audio';
  return 'file';
};

// Check if media devices are available
export const checkMediaDevices = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return {
      hasVideo: devices.some(device => device.kind === 'videoinput'),
      hasAudio: devices.some(device => device.kind === 'audioinput'),
      devices
    };
  } catch (error) {
    return {
      hasVideo: false,
      hasAudio: false,
      devices: []
    };
  }
};

// Request media permissions
export const requestMediaPermissions = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: true 
    });
    // Stop the stream immediately as we just wanted to check permissions
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    return false;
  }
};

// Get optimal media constraints
export const getOptimalMediaConstraints = () => {
  return {
    video: {
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      frameRate: { ideal: 30, max: 60 },
      facingMode: 'user'
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  };
};

// Create fallback constraints for when optimal constraints fail
export const createFallbackConstraints = () => {
  return {
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      frameRate: { ideal: 15 },
      facingMode: 'user'
    },
    audio: true
  };
};

// Validate media stream
export const validateMediaStream = (stream) => {
  const videoTracks = stream.getVideoTracks();
  const audioTracks = stream.getAudioTracks();
  
  return {
    isValid: videoTracks.length > 0 || audioTracks.length > 0,
    hasVideo: videoTracks.length > 0,
    hasAudio: audioTracks.length > 0,
    videoTracks: videoTracks.length,
    audioTracks: audioTracks.length,
    tracks: stream.getTracks().map(track => ({
      kind: track.kind,
      enabled: track.enabled,
      muted: track.muted,
      readyState: track.readyState
    }))
  };
};