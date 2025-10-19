// Video optimization service
export class VideoOptimizer {
  constructor() {
    this.supportedFormats = ['video/mp4', 'video/webm', 'video/ogg'];
    this.qualityPresets = {
      low: { bitrate: 500000, width: 480, height: 360 },      // 500kbps
      medium: { bitrate: 1000000, width: 720, height: 480 }, // 1Mbps
      high: { bitrate: 2000000, width: 1280, height: 720 },  // 2Mbps
      ultra: { bitrate: 4000000, width: 1920, height: 1080 } // 4Mbps
    };
  }

  // Generate video thumbnail
  async generateThumbnail(file, timeOffset = 1) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadedmetadata = () => {
        // Set canvas size for thumbnail
        canvas.width = 320;
        canvas.height = 180;

        // Seek to specified time
        video.currentTime = Math.min(timeOffset, video.duration * 0.1);
      };

      video.onseeked = () => {
        try {
          // Draw video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to generate thumbnail'));
              }
            },
            'image/jpeg',
            0.7
          );
        } catch (error) {
          reject(error);
        }
      };

      video.onerror = () => {
        reject(new Error('Video loading failed'));
      };

      video.src = URL.createObjectURL(file);
      video.load();
    });
  }

  // Generate multiple thumbnails for video preview
  async generateMultipleThumbnails(file, count = 3) {
    const thumbnails = [];
    const video = document.createElement('video');
    
    return new Promise((resolve, reject) => {
      video.onloadedmetadata = () => {
        const duration = video.duration;
        const interval = duration / (count + 1);

        const generateThumbnailAtTime = async (time) => {
          try {
            const thumbnail = await this.generateThumbnail(file, time);
            return thumbnail;
          } catch (error) {
            console.error(`Error generating thumbnail at ${time}s:`, error);
            return null;
          }
        };

        const generateAllThumbnails = async () => {
          for (let i = 1; i <= count; i++) {
            const time = interval * i;
            const thumbnail = await generateThumbnailAtTime(time);
            if (thumbnail) {
              thumbnails.push(thumbnail);
            }
          }
          resolve(thumbnails);
        };

        generateAllThumbnails();
      };

      video.onerror = () => {
        reject(new Error('Video loading failed'));
      };

      video.src = URL.createObjectURL(file);
      video.load();
    });
  }

  // Get video metadata
  async getVideoMetadata(file) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      
      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          aspectRatio: video.videoWidth / video.videoHeight,
          size: file.size,
          type: file.type
        });
      };

      video.onerror = () => {
        reject(new Error('Failed to load video metadata'));
      };

      video.src = URL.createObjectURL(file);
      video.load();
    });
  }

  // Calculate optimal video quality based on file size and duration
  calculateOptimalQuality(fileSize, duration, targetBitrate = 1000000) {
    const currentBitrate = (fileSize * 8) / duration; // bits per second
    
    if (currentBitrate <= this.qualityPresets.low.bitrate) {
      return 'low';
    } else if (currentBitrate <= this.qualityPresets.medium.bitrate) {
      return 'medium';
    } else if (currentBitrate <= this.qualityPresets.high.bitrate) {
      return 'high';
    } else {
      return 'ultra';
    }
  }

  // Generate video preview (low quality version)
  async generatePreview(file, quality = 'low') {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadedmetadata = () => {
        const preset = this.qualityPresets[quality];
        const { width, height } = this.calculateOptimalDimensions(
          video.videoWidth,
          video.videoHeight,
          preset.width,
          preset.height
        );

        canvas.width = width;
        canvas.height = height;

        // Draw video frame
        ctx.drawImage(video, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to generate preview'));
            }
          },
          'image/jpeg',
          0.6
        );
      };

      video.onerror = () => {
        reject(new Error('Video loading failed'));
      };

      video.src = URL.createObjectURL(file);
      video.load();
    });
  }

  // Calculate optimal dimensions maintaining aspect ratio
  calculateOptimalDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
    const aspectRatio = originalWidth / originalHeight;
    
    let width = originalWidth;
    let height = originalHeight;

    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  // Format video duration
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Check if video format is supported
  isSupportedFormat(file) {
    return this.supportedFormats.includes(file.type);
  }

  // Get recommended quality based on device capabilities
  getRecommendedQuality() {
    const connection = navigator.connection;
    const memory = navigator.deviceMemory;
    
    // Check network connection
    if (connection) {
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        return 'low';
      } else if (connection.effectiveType === '3g') {
        return 'medium';
      } else if (connection.effectiveType === '4g') {
        return 'high';
      }
    }

    // Check device memory
    if (memory && memory < 4) {
      return 'low';
    } else if (memory && memory < 8) {
      return 'medium';
    }

    return 'high';
  }
}

// Create singleton instance
export const videoOptimizer = new VideoOptimizer();
