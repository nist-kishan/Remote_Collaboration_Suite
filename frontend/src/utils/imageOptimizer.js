// Advanced image optimization service
export class ImageOptimizer {
  constructor() {
    this.supportedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    this.qualitySettings = {
      thumbnail: 0.6,
      preview: 0.7,
      full: 0.8,
      high: 0.9
    };
    this.sizePresets = {
      thumbnail: { width: 150, height: 150 },
      small: { width: 400, height: 300 },
      medium: { width: 800, height: 600 },
      large: { width: 1200, height: 900 },
      xlarge: { width: 1920, height: 1080 }
    };
  }

  // Convert image to WebP format for better compression
  async convertToWebP(file, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => resolve(blob),
          'image/webp',
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Generate multiple sizes for responsive images
  async generateResponsiveImages(file) {
    const images = {};
    
    for (const [sizeName, dimensions] of Object.entries(this.sizePresets)) {
      try {
        const resizedImage = await this.resizeImage(file, dimensions.width, dimensions.height);
        images[sizeName] = resizedImage;
      } catch (error) {
        console.error(`Error generating ${sizeName} image:`, error);
      }
    }

    return images;
  }

  // Resize image to specific dimensions
  async resizeImage(file, targetWidth, targetHeight, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate aspect ratio
        const aspectRatio = img.width / img.height;
        let { width, height } = { width: targetWidth, height: targetHeight };

        // Maintain aspect ratio
        if (aspectRatio > 1) {
          height = width / aspectRatio;
        } else {
          width = height * aspectRatio;
        }

        canvas.width = width;
        canvas.height = height;

        // Use high-quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => resolve(blob),
          file.type,
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Generate progressive JPEG
  async generateProgressiveJPEG(file, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Convert to progressive JPEG
        canvas.toBlob(
          (blob) => resolve(blob),
          'image/jpeg',
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Optimize image based on file size and type
  async optimizeImage(file) {
    const maxFileSize = 2 * 1024 * 1024; // 2MB
    let optimizedFile = file;

    // If file is too large, compress it
    if (file.size > maxFileSize) {
      const compressionRatio = maxFileSize / file.size;
      const quality = Math.max(0.3, compressionRatio);
      
      optimizedFile = await this.resizeImage(
        file, 
        file.width || 1920, 
        file.height || 1080, 
        quality
      );
    }

    // Convert to WebP if supported and beneficial
    if (this.supportedFormats.includes(file.type) && file.type !== 'image/webp') {
      const webpFile = await this.convertToWebP(optimizedFile);
      if (webpFile.size < optimizedFile.size) {
        optimizedFile = webpFile;
      }
    }

    return optimizedFile;
  }

  // Generate blur placeholder
  async generateBlurPlaceholder(file, size = 20) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = size;
        canvas.height = size;

        // Draw scaled down image
        ctx.drawImage(img, 0, 0, size, size);
        
        // Apply blur effect
        ctx.filter = 'blur(5px)';
        ctx.drawImage(canvas, 0, 0, size, size);
        
        canvas.toBlob(
          (blob) => resolve(blob),
          'image/jpeg',
          0.3
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Calculate optimal image dimensions
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

  // Get image metadata
  async getImageMetadata(file) {
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: img.naturalWidth / img.naturalHeight,
          size: file.size,
          type: file.type
        });
      };

      img.src = URL.createObjectURL(file);
    });
  }
}

// Create singleton instance
export const imageOptimizer = new ImageOptimizer();
