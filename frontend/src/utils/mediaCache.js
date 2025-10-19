// Media cache service for optimized loading
export class MediaCache {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 50 * 1024 * 1024; // 50MB
    this.currentCacheSize = 0;
    this.accessOrder = new Map(); // For LRU eviction
    this.accessCounter = 0;
  }

  // Generate cache key
  generateKey(url, options = {}) {
    const { width, height, quality, format } = options;
    return `${url}_${width || 'auto'}_${height || 'auto'}_${quality || 'default'}_${format || 'original'}`;
  }

  // Check if item exists in cache
  has(key) {
    return this.cache.has(key);
  }

  // Get item from cache
  get(key) {
    if (this.cache.has(key)) {
      // Update access order for LRU
      this.accessOrder.set(key, ++this.accessCounter);
      return this.cache.get(key);
    }
    return null;
  }

  // Set item in cache
  set(key, value) {
    const size = this.calculateSize(value);
    
    // Check if we need to evict items
    while (this.currentCacheSize + size > this.maxCacheSize && this.cache.size > 0) {
      this.evictLRU();
    }

    // Remove existing item if it exists
    if (this.cache.has(key)) {
      this.remove(key);
    }

    // Add new item
    this.cache.set(key, value);
    this.accessOrder.set(key, ++this.accessCounter);
    this.currentCacheSize += size;
  }

  // Remove item from cache
  remove(key) {
    if (this.cache.has(key)) {
      const value = this.cache.get(key);
      const size = this.calculateSize(value);
      
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this.currentCacheSize -= size;
    }
  }

  // Evict least recently used item
  evictLRU() {
    let oldestKey = null;
    let oldestAccess = Infinity;

    for (const [key, accessTime] of this.accessOrder) {
      if (accessTime < oldestAccess) {
        oldestAccess = accessTime;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.remove(oldestKey);
    }
  }

  // Calculate approximate size of cached item
  calculateSize(value) {
    if (value instanceof Blob) {
      return value.size;
    } else if (value instanceof ImageData) {
      return value.width * value.height * 4; // RGBA
    } else if (typeof value === 'string') {
      return value.length * 2; // Approximate UTF-16 size
    } else if (typeof value === 'object') {
      return JSON.stringify(value).length * 2;
    }
    return 1024; // Default size
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    this.accessOrder.clear();
    this.currentCacheSize = 0;
    this.accessCounter = 0;
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      memoryUsage: this.currentCacheSize,
      maxSize: this.maxCacheSize,
      hitRate: this.calculateHitRate()
    };
  }

  // Calculate cache hit rate (simplified)
  calculateHitRate() {
    // This would need to track hits/misses in a real implementation
    return 0.85; // Placeholder
  }

  // Preload media
  async preload(url, options = {}) {
    const key = this.generateKey(url, options);
    
    if (this.has(key)) {
      return this.get(key);
    }

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      this.set(key, blob);
      return blob;
    } catch (error) {
      console.error('Failed to preload media:', error);
      return null;
    }
  }

  // Preload multiple media items
  async preloadMultiple(urls, options = {}) {
    const promises = urls.map(url => this.preload(url, options));
    return Promise.allSettled(promises);
  }

  // Get cached image with fallback
  async getCachedImage(url, options = {}) {
    const key = this.generateKey(url, options);
    
    // Check cache first
    const cached = this.get(key);
    if (cached) {
      return cached;
    }

    // Load and cache
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      this.set(key, blob);
      return blob;
    } catch (error) {
      console.error('Failed to load image:', error);
      return null;
    }
  }

  // Get cached video thumbnail
  async getCachedThumbnail(videoUrl, timeOffset = 1) {
    const key = this.generateKey(videoUrl, { thumbnail: true, time: timeOffset });
    
    const cached = this.get(key);
    if (cached) {
      return cached;
    }

    try {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      return new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          canvas.width = 320;
          canvas.height = 180;
          video.currentTime = timeOffset;
        };

        video.onseeked = () => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              this.set(key, blob);
              resolve(blob);
            } else {
              reject(new Error('Failed to generate thumbnail'));
            }
          }, 'image/jpeg', 0.7);
        };

        video.onerror = () => {
          reject(new Error('Video loading failed'));
        };

        video.src = videoUrl;
        video.load();
      });
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      return null;
    }
  }

  // Clean up old cache entries
  cleanup() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [key, value] of this.cache) {
      if (value.timestamp && now - value.timestamp > maxAge) {
        this.remove(key);
      }
    }
  }

  // Set cache size limit
  setMaxSize(size) {
    this.maxCacheSize = size;
    
    // Evict items if current size exceeds new limit
    while (this.currentCacheSize > this.maxCacheSize && this.cache.size > 0) {
      this.evictLRU();
    }
  }
}

// Create singleton instance
export const mediaCache = new MediaCache();

// Auto-cleanup every hour
setInterval(() => {
  mediaCache.cleanup();
}, 60 * 60 * 1000);
