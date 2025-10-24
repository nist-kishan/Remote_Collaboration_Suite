import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Share2, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize
} from 'lucide-react';

const MediaViewer = ({ 
  isOpen = false, 
  mediaItems = [], 
  currentIndex = 0, 
  onClose, 
  onIndexChange 
}) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(currentIndex);
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setCurrentMediaIndex(currentIndex);
  }, [currentIndex]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      resetImageTransform();
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const resetImageTransform = () => {
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const handlePrevious = () => {
    if (currentMediaIndex > 0) {
      const newIndex = currentMediaIndex - 1;
      setCurrentMediaIndex(newIndex);
      onIndexChange?.(newIndex);
      resetImageTransform();
      setIsVideoPlaying(false);
    }
  };

  const handleNext = () => {
    if (currentMediaIndex < mediaItems.length - 1) {
      const newIndex = currentMediaIndex + 1;
      setCurrentMediaIndex(newIndex);
      onIndexChange?.(newIndex);
      resetImageTransform();
      setIsVideoPlaying(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        handlePrevious();
        break;
      case 'ArrowRight':
        handleNext();
        break;
      case '+':
      case '=':
        handleZoomIn();
        break;
      case '-':
        handleZoomOut();
        break;
      case '0':
        resetImageTransform();
        break;
      case ' ':
        if (currentMedia?.type === 'video') {
          toggleVideoPlay();
        }
        break;
      case 'f':
        toggleFullscreen();
        break;
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentMediaIndex, currentMedia?.type]);

  const handleZoomIn = () => {
    setImageScale(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setImageScale(prev => Math.max(prev / 1.2, 0.5));
  };

  const handleMouseDown = (e) => {
    if (imageScale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && imageScale > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    if (currentMedia?.type === 'image') {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setImageScale(prev => Math.max(0.5, Math.min(5, prev * delta)));
    }
  };

  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const toggleVideoMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isVideoMuted;
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleDownload = () => {
    const currentMedia = mediaItems[currentMediaIndex];
    if (currentMedia?.url) {
      const link = document.createElement('a');
      link.href = currentMedia.url;
      link.download = currentMedia.name || 'media';
      link.click();
    }
  };

  const handleShare = async () => {
    const currentMedia = mediaItems[currentMediaIndex];
    if (navigator.share && currentMedia?.url) {
      try {
        await navigator.share({
          title: currentMedia.name || 'Media',
          url: currentMedia.url
        });
      } catch (error) {
        }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(currentMedia?.url || '');
    }
  };

  const currentMedia = mediaItems[currentMediaIndex];

  if (!isOpen || !currentMedia) return null;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navigation Buttons */}
      {mediaItems.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            disabled={currentMediaIndex === 0}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentMediaIndex === mediaItems.length - 1}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Media Content */}
      <div className="relative w-full h-full flex items-center justify-center">
        {currentMedia.type === 'image' ? (
          <img
            src={currentMedia.url}
            alt={currentMedia.name || 'Image'}
            className="max-w-full max-h-full object-contain select-none"
            style={{
              transform: `scale(${imageScale}) translate(${imagePosition.x / imageScale}px, ${imagePosition.y / imageScale}px)`,
              cursor: imageScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
            }}
            onMouseDown={handleMouseDown}
            draggable={false}
          />
        ) : currentMedia.type === 'video' ? (
          <video
            ref={videoRef}
            src={currentMedia.url}
            className="max-w-full max-h-full"
            controls={false}
            loop
            onPlay={() => setIsVideoPlaying(true)}
            onPause={() => setIsVideoPlaying(false)}
            onLoadedMetadata={() => {
              if (videoRef.current) {
                videoRef.current.muted = isVideoMuted;
              }
            }}
          />
        ) : (
          <div className="text-center text-white">
            <p className="text-lg mb-4">Unsupported media type</p>
            <a
              href={currentMedia.url}
              download={currentMedia.name}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download File
            </a>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black bg-opacity-50 rounded-lg px-4 py-2">
        {currentMedia.type === 'image' && (
          <>
            <button
              onClick={handleZoomOut}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-white text-sm min-w-[3rem] text-center">
              {Math.round(imageScale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-white bg-opacity-30" />
            <button
              onClick={resetImageTransform}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors"
              title="Reset"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </>
        )}

        {currentMedia.type === 'video' && (
          <>
            <button
              onClick={toggleVideoPlay}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors"
              title={isVideoPlaying ? 'Pause' : 'Play'}
            >
              {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={toggleVideoMute}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors"
              title={isVideoMuted ? 'Unmute' : 'Mute'}
            >
              {isVideoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </>
        )}

        <div className="w-px h-6 bg-white bg-opacity-30" />
        <button
          onClick={toggleFullscreen}
          className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
        <button
          onClick={handleDownload}
          className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={handleShare}
          className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors"
          title="Share"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Media Counter */}
      {mediaItems.length > 1 && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
          {currentMediaIndex + 1} / {mediaItems.length}
        </div>
      )}

      {/* Media Info */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg max-w-xs">
        <p className="text-sm font-medium truncate">{currentMedia.name}</p>
        {currentMedia.size && (
          <p className="text-xs opacity-75">
            {Math.round(currentMedia.size / 1024)} KB
          </p>
        )}
      </div>
    </div>
  );
};

export default MediaViewer;
