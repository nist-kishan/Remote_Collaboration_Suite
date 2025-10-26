import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff,
  Settings,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Camera,
  CameraOff,
  MoreVertical,
  Wifi,
  WifiOff,
  Battery,
  Signal,
  Users,
  Share2,
  MessageSquare,
  Monitor
} from 'lucide-react';

const CallControls = ({
  isMuted,
  isVideoEnabled,
  isScreenSharing = false,
  connectionQuality = 'good',
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onEndCall,
  onOpenSettings,
  onToggleFullscreen,
  isFullscreen = false,
  showSettings = false,
  onCloseSettings,
  className = ''
}) => {
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Get connection quality color
  const getConnectionQualityColor = () => {
    switch (connectionQuality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Controls */}
      <div className="flex items-center justify-center gap-6">
        {/* Mute Button */}
        <button
          onClick={onToggleMute}
          className={`p-5 rounded-full transition-all duration-200 transform hover:scale-105 ${
            isMuted 
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg' 
              : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
        </button>

        {/* Video Button */}
        <button
          onClick={onToggleVideo}
          className={`p-5 rounded-full transition-all duration-200 transform hover:scale-105 ${
            !isVideoEnabled 
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg' 
              : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'
          }`}
          title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {isVideoEnabled ? <Video className="w-7 h-7" /> : <VideoOff className="w-7 h-7" />}
        </button>

        {/* Screen Share Button */}
        <button
          onClick={onToggleScreenShare}
          className={`p-5 rounded-full transition-all duration-200 transform hover:scale-105 ${
            isScreenSharing 
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' 
              : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'
          }`}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          <Monitor className="w-7 h-7" />
        </button>

        {/* More Options Button */}
        <button
          onClick={() => setShowMoreOptions(!showMoreOptions)}
          className="p-5 bg-white/20 hover:bg-white/30 rounded-full transition-all duration-200 text-white backdrop-blur-sm"
          title="More options"
        >
          <MoreVertical className="w-7 h-7" />
        </button>

        {/* End Call Button */}
        <button
          onClick={onEndCall}
          className="p-5 bg-red-600 hover:bg-red-700 rounded-full transition-all duration-200 text-white transform hover:scale-105 shadow-lg"
          title="End Call"
        >
          <PhoneOff className="w-7 h-7" />
        </button>
      </div>

      {/* More Options Panel */}
      <AnimatePresence>
        {showMoreOptions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-sm rounded-2xl p-6 min-w-80"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white text-lg font-semibold mb-4">Call Options</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white">Microphone</span>
                <button
                  onClick={onToggleMute}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isMuted ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                  }`}
                >
                  {isMuted ? 'Unmute' : 'Mute'}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white">Camera</span>
                <button
                  onClick={onToggleVideo}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    !isVideoEnabled ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                  }`}
                >
                  {isVideoEnabled ? 'Turn Off' : 'Turn On'}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white">Screen Share</span>
                <button
                  onClick={onToggleScreenShare}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isScreenSharing ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white'
                  }`}
                >
                  {isScreenSharing ? 'Stop' : 'Start'}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white">Connection Quality</span>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getConnectionQualityColor()}`}>
                  {connectionQuality}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white">Fullscreen</span>
                <button
                  onClick={onToggleFullscreen}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  {isFullscreen ? 'Exit' : 'Enter'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-sm rounded-2xl p-6 min-w-80"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">Call Settings</h3>
              <button
                onClick={onCloseSettings}
                className="text-white/70 hover:text-white transition-colors"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white">Microphone</span>
                <button
                  onClick={onToggleMute}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isMuted ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                  }`}
                >
                  {isMuted ? 'Unmute' : 'Mute'}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white">Camera</span>
                <button
                  onClick={onToggleVideo}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    !isVideoEnabled ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                  }`}
                >
                  {isVideoEnabled ? 'Turn Off' : 'Turn On'}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white">Connection Quality</span>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getConnectionQualityColor()}`}>
                  {connectionQuality}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CallControls;
