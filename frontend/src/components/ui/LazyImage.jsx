import React, { useState, useRef, useEffect } from 'react';
import { Download } from 'lucide-react';
import { imageOptimizer } from '../../utils/imageOptimizer';
import { mediaCache } from '../../utils/mediaCache';

const LazyImage = ({ 
  src, 
  alt = "Image", 
  className = "", 
  maxHeight = "max-h-80",
  onDownload,
  downloadName,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Load image when in view
  useEffect(() => {
    if (isInView && src && !isLoaded && !hasError) {
      setIsLoading(true);
      const img = new Image();
      
      img.onload = () => {
        setIsLoaded(true);
        setIsLoading(false);
      };
      
      img.onerror = () => {
        setHasError(true);
        setIsLoading(false);
      };
      
      img.src = src;
    }
  }, [isInView, src, isLoaded, hasError]);

  const handleDownload = (e) => {
    e.stopPropagation();
    if (onDownload) {
      onDownload();
    } else {
      const link = document.createElement('a');
      link.href = src;
      link.download = downloadName || 'image';
      link.click();
    }
  };

  return (
    <div ref={containerRef} className={`relative group ${className}`}>
      <div className="relative overflow-hidden rounded-2xl max-w-full">
        {/* Loading placeholder */}
        {isLoading && (
          <div className={`w-full ${maxHeight} bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}>
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Loading image...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className={`w-full ${maxHeight} bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded-2xl`}>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Image preview unavailable</p>
            </div>
          </div>
        )}

        {/* Loaded image */}
        {isLoaded && !hasError && (
          <>
            <img
              ref={imgRef}
              src={src}
              alt={alt}
              className={`w-full h-auto ${maxHeight} object-cover transition-all duration-300 ${
                isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              } hover:scale-105`}
              loading="lazy"
              {...props}
            />
            
            {/* Download button overlay */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={handleDownload}
                className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                title="Download image"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            {/* WhatsApp-style overlay on hover */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-2 transform scale-75 group-hover:scale-100 transition-transform duration-200">
                <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LazyImage;
