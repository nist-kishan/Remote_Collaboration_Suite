import React, { useState, useRef, useEffect } from 'react';
import { Download, Play, Pause } from 'lucide-react';
import { videoOptimizer } from '../../utils/videoOptimizer';
import { mediaCache } from '../../utils/mediaCache';

const OptimizedVideo = ({ 
  src, 
  poster,
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef(null);
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
        rootMargin: '100px' // Load videos earlier than images
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Load video metadata when in view
  useEffect(() => {
    if (isInView && src && !isLoaded && !hasError) {
      setIsLoading(true);
      
      if (videoRef.current) {
        videoRef.current.load();
      }
    }
  }, [isInView, src, isLoaded, hasError]);

  const handleLoadedMetadata = () => {
    setIsLoaded(true);
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    if (onDownload) {
      onDownload();
    } else {
      const link = document.createElement('a');
      link.href = src;
      link.download = downloadName || 'video';
      link.click();
    }
  };

  const handleMouseEnter = () => {
    setShowControls(true);
  };

  const handleMouseLeave = () => {
    if (!isPlaying) {
      setShowControls(false);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative group ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative overflow-hidden rounded-2xl max-w-full">
        {/* Loading placeholder */}
        {isLoading && (
          <div className={`w-full ${maxHeight} bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}>
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Loading video...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className={`w-full ${maxHeight} bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded-2xl`}>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Video preview unavailable</p>
            </div>
          </div>
        )}

        {/* Video element */}
        {isInView && !hasError && (
          <>
            <video
              ref={videoRef}
              src={src}
              poster={poster}
              className={`w-full h-auto ${maxHeight} object-cover transition-all duration-300 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              preload="metadata" // Only load metadata initially
              onLoadedMetadata={handleLoadedMetadata}
              onError={handleError}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              {...props}
            />

            {/* Custom play/pause button */}
            {isLoaded && (
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
                showControls || isPlaying ? 'opacity-100' : 'opacity-0'
              }`}>
                <button
                  onClick={handlePlayPause}
                  className="bg-black bg-opacity-50 text-white rounded-full p-3 hover:bg-opacity-70 transition-all"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-1" />
                  )}
                </button>
              </div>
            )}

            {/* Download button overlay */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={handleDownload}
                className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                title="Download video"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            {/* Progress bar */}
            {isPlaying && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-30">
                <div className="h-full bg-indigo-600 transition-all duration-100" style={{ width: '0%' }}></div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OptimizedVideo;
