import React, { useRef, useEffect, useState } from 'react';
import { Video, VideoOff, User } from 'lucide-react';
import UserAvatar from '../ui/UserAvatar';

const VideoStream = ({ 
  stream, 
  isLocal = false, 
  isVideoEnabled = true, 
  userName = 'User',
  userAvatar = null,
  className = '',
  muted = false,
  showControls = false,
  onVideoToggle = null
}) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
    };

    const handleCanPlay = () => {
      setIsPlaying(true);
      setHasError(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleError = (e) => {
      setHasError(true);
      setIsPlaying(false);
    };

    const handleWaiting = () => {
    };

    const handleStalled = () => {
    };

    // Add event listeners
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('stalled', handleStalled);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('stalled', handleStalled);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream && stream.getTracks().length > 0) {
      // Check if stream has video tracks
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length === 0) {
        setHasError(true);
        return;
      }

      // Set the stream
      video.srcObject = stream;
      
      // Wait for metadata to load before playing
      const handleLoadedMetadata = () => {
        video.play().catch(error => {
          setHasError(true);
        });
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
      
      // Also try to play immediately
      video.play().catch(error => {
        // Don't set error immediately, wait for loadedmetadata
      });
    } else {
  
      video.srcObject = null;
      setIsPlaying(false);
      setHasError(false);
    }
  }, [stream, isLocal]);

  const handleVideoClick = () => {
    if (onVideoToggle) {
      onVideoToggle();
    }
  };

  return (
    <div className={`relative w-full h-full bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* Video Element */}
      {stream && stream.getTracks().length > 0 ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className="w-full h-full object-cover"
          style={{
            transform: isLocal ? 'scaleX(-1)' : 'none', // Mirror local video
            filter: isLocal ? 'none' : 'none'
          }}
        />
      ) : (
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          <div className="text-center text-white">
            <Video className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No video stream</p>
          </div>
        </div>
      )}

      {/* Video Status Overlay */}
      {!isVideoEnabled && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
              {userAvatar ? (
                <UserAvatar user={{ avatar: userAvatar }} size="lg" />
              ) : (
                <User className="w-8 h-8" />
              )}
            </div>
            <p className="text-sm font-medium">{userName}</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <VideoOff className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">Camera off</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading/Error States */}
      {!isPlaying && !hasError && stream && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-xs">Loading video...</p>
          </div>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
          <div className="text-center text-white">
            <VideoOff className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <p className="text-xs text-red-400">Video error</p>
          </div>
        </div>
      )}

      {/* Video Controls (for local video) */}
      {showControls && isLocal && (
        <div className="absolute top-2 right-2">
          <button
            onClick={handleVideoClick}
            className="p-1 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-all"
            title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoEnabled ? (
              <Video className="w-4 h-4" />
            ) : (
              <VideoOff className="w-4 h-4" />
            )}
          </button>
        </div>
      )}

      {/* Video Quality Indicator */}
      {isPlaying && !isLocal && (
        <div className="absolute bottom-2 left-2">
          <div className="bg-black bg-opacity-50 px-2 py-1 rounded text-xs text-white">
            {stream?.getVideoTracks()[0]?.getSettings()?.width || 'HD'}
          </div>
        </div>
      )}

      {/* Connection Status */}
      {isPlaying && (
        <div className="absolute top-2 left-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      )}
    </div>
  );
};

export default VideoStream;
