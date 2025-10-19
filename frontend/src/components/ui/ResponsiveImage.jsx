import React, { useState, useEffect } from 'react';

const ResponsiveImage = ({ 
  src, 
  alt = "Image", 
  className = "",
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  quality = 80,
  ...props 
}) => {
  const [optimizedSrc, setOptimizedSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) return;

    setIsLoading(true);
    setHasError(false);

    // Generate optimized URL based on screen size and quality
    const generateOptimizedUrl = () => {
      const screenWidth = window.innerWidth;
      let targetWidth = 1920; // Default high resolution

      if (screenWidth <= 480) {
        targetWidth = 480; // Mobile
      } else if (screenWidth <= 768) {
        targetWidth = 768; // Tablet
      } else if (screenWidth <= 1200) {
        targetWidth = 1200; // Desktop
      }

      // If using Cloudinary or similar service, you can add transformation parameters
      if (src.includes('cloudinary.com')) {
        const baseUrl = src.split('/upload/')[0];
        const imagePath = src.split('/upload/')[1];
        return `${baseUrl}/upload/w_${targetWidth},q_${quality},f_auto/${imagePath}`;
      }

      // For other services, return original URL
      return src;
    };

    setOptimizedSrc(generateOptimizedUrl());

    // Handle window resize
    const handleResize = () => {
      setOptimizedSrc(generateOptimizedUrl());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [src, quality]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Loading placeholder */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded-lg">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Failed to load image</p>
          </div>
        </div>
      )}

      {/* Image */}
      <img
        src={optimizedSrc}
        alt={alt}
        className={`w-full h-auto transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        sizes={sizes}
        {...props}
      />
    </div>
  );
};

export default ResponsiveImage;
