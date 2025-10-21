import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Phone, 
  PhoneOff, 
  Settings, 
  Maximize2, 
  Minimize2,
  Users,
  MessageSquare,
  Volume2,
  VolumeX,
  Camera,
  CameraOff,
  MoreVertical
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const VideoCallInterface = ({
  localStream,
  remoteStream,
  isMuted,
  isVideoEnabled,
  isScreenSharing,
  participants = [],
  callStatus,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onEndCall,
  onMinimize,
  onMaximize,
  isMinimized = false,
  className = ''
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [showControls, setShowControls] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [localVideoSize, setLocalVideoSize] = useState('small');

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showControls]);

  // Set video streams
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleToggleControls = () => {
    setShowControls(!showControls);
  };

  const handleToggleLocalVideoSize = () => {
    setLocalVideoSize(localVideoSize === 'small' ? 'large' : 'small');
  };

  const getCallStatusColor = () => {
    switch (callStatus) {
      case 'connecting':
        return 'bg-yellow-500';
      case 'connected':
        return 'bg-green-500';
      case 'ended':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getCallStatusText = () => {
    switch (callStatus) {
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return 'Connected';
      case 'ended':
        return 'Call Ended';
      default:
        return 'Unknown';
    }
  };

  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`fixed bottom-4 right-4 bg-gray-900 rounded-lg shadow-2xl border border-gray-700 z-50 ${className}`}
      >
        <div className="flex items-center gap-3 p-3">
          {/* Minimized video preview */}
          <div className="relative w-16 h-12 bg-gray-800 rounded overflow-hidden">
            {localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Video className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${getCallStatusColor()}`} />
          </div>

          {/* Call info */}
          <div className="text-white">
            <p className="text-sm font-medium">Video Call</p>
            <p className="text-xs text-gray-300">{getCallStatusText()}</p>
          </div>

          {/* Minimized controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={onMaximize}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Maximize"
            >
              <Maximize2 className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={onEndCall}
              className="p-1 hover:bg-red-600 rounded transition-colors"
              title="End Call"
            >
              <PhoneOff className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 bg-black z-50 flex flex-col ${className}`}
      onClick={handleToggleControls}
    >
      {/* Main video area */}
      <div className="flex-1 relative">
        {/* Remote video (main) */}
        <div className="absolute inset-0">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-32 h-32 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                  <Users className="w-16 h-16 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Waiting for participant</h3>
                <p className="text-gray-400">Your video call is ready</p>
              </div>
            </div>
          )}
        </div>

        {/* Local video (picture-in-picture) */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`absolute top-4 right-4 bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-700 ${
            localVideoSize === 'small' ? 'w-48 h-36' : 'w-64 h-48'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative w-full h-full">
            {localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <Video className="w-8 h-8 text-gray-400" />
              </div>
            )}
            
            {/* Local video controls overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent">
              <div className="absolute bottom-2 right-2 flex items-center gap-1">
                <button
                  onClick={handleToggleLocalVideoSize}
                  className="p-1 bg-black/50 rounded hover:bg-black/70 transition-colors"
                  title={localVideoSize === 'small' ? 'Enlarge' : 'Shrink'}
                >
                  {localVideoSize === 'small' ? (
                    <Maximize2 className="w-3 h-3 text-white" />
                  ) : (
                    <Minimize2 className="w-3 h-3 text-white" />
                  )}
                </button>
              </div>
            </div>

            {/* Local video status indicators */}
            <div className="absolute top-2 left-2 flex items-center gap-1">
              {isMuted && (
                <div className="bg-red-600 rounded-full p-1">
                  <MicOff className="w-3 h-3 text-white" />
                </div>
              )}
              {!isVideoEnabled && (
                <div className="bg-red-600 rounded-full p-1">
                  <VideoOff className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Call status indicator */}
        <AnimatePresence>
          {callStatus === 'connecting' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute top-4 left-4 bg-black/70 rounded-lg px-4 py-2"
            >
              <div className="flex items-center gap-2 text-white">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Connecting...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Participants count */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 text-white">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">{participants.length + 1} participant{participants.length !== 0 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-md mx-auto">
              {/* Primary controls */}
              <div className="flex items-center justify-center gap-4 mb-4">
                {/* Mute button */}
                <button
                  onClick={onToggleMute}
                  className={`p-4 rounded-full transition-all duration-200 ${
                    isMuted 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-white/20 hover:bg-white/30 text-white'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>

                {/* Video toggle button */}
                <button
                  onClick={onToggleVideo}
                  className={`p-4 rounded-full transition-all duration-200 ${
                    !isVideoEnabled 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-white/20 hover:bg-white/30 text-white'
                  }`}
                  title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                >
                  {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                </button>

                {/* End call button */}
                <button
                  onClick={onEndCall}
                  className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition-all duration-200 text-white"
                  title="End call"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>

                {/* Screen share button */}
                <button
                  onClick={onToggleScreenShare}
                  className={`p-4 rounded-full transition-all duration-200 ${
                    isScreenSharing 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-white/20 hover:bg-white/30 text-white'
                  }`}
                  title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                >
                  <Maximize2 className="w-6 h-6" />
                </button>
              </div>

              {/* Secondary controls */}
              <div className="flex items-center justify-center gap-4">
                {/* Participants button */}
                <button
                  onClick={() => setShowParticipants(!showParticipants)}
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all duration-200 text-white"
                  title="Participants"
                >
                  <Users className="w-5 h-5" />
                </button>

                {/* Minimize button */}
                <button
                  onClick={onMinimize}
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all duration-200 text-white"
                  title="Minimize"
                >
                  <Minimize2 className="w-5 h-5" />
                </button>

                {/* Settings button */}
                <button
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all duration-200 text-white"
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Participants panel */}
      <AnimatePresence>
        {showParticipants && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-0 right-0 w-80 h-full bg-gray-900 border-l border-gray-700 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Participants</h3>
              <button
                onClick={() => setShowParticipants(false)}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
              >
                <Minimize2 className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="space-y-3">
              {/* You */}
              <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">You</span>
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">You</p>
                  <p className="text-gray-400 text-sm">Host</p>
                </div>
                <div className="flex items-center gap-1">
                  {isMuted && <MicOff className="w-4 h-4 text-red-500" />}
                  {!isVideoEnabled && <VideoOff className="w-4 h-4 text-red-500" />}
                </div>
              </div>

              {/* Other participants */}
              {participants.map((participant, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                  <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">{participant.name?.charAt(0) || 'U'}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{participant.name || 'Unknown User'}</p>
                    <p className="text-gray-400 text-sm">Participant</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {participant.isMuted && <MicOff className="w-4 h-4 text-red-500" />}
                    {!participant.isVideoEnabled && <VideoOff className="w-4 h-4 text-red-500" />}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VideoCallInterface;