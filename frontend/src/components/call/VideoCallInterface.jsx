import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff,
  User,
  Users,
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
  Monitor,
  Share2
} from 'lucide-react';
import CallControls from './CallControls';
import CallStatusBar from './CallStatusBar';
import ConnectionStatus from './ConnectionStatus';

const VideoCallInterface = ({
  callData,
  callStatus,
  localStream,
  remoteStream,
  isMuted,
  isVideoEnabled,
  isScreenSharing = false,
  timeElapsed,
  socket,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onEndCall,
  onAcceptCall,
  onRejectCall,
  isIncoming = false,
  className = ''
}) => {
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState('good'); // good, poor, excellent
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth < 1024);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-hide controls
  useEffect(() => {
    if (showControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 5000);
    }
    return () => clearTimeout(controlsTimeoutRef.current);
  }, [showControls]);

  // Set up video streams with better error handling
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      try {
        localVideoRef.current.srcObject = localStream;
        console.log('✅ Local video stream set successfully');
      } catch (error) {
        console.error('❌ Error setting local video stream:', error);
      }
    }
    
    if (remoteStream && remoteVideoRef.current) {
      try {
        // Clear previous stream first
        remoteVideoRef.current.srcObject = null;
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.load();
        
        console.log('✅ Remote video stream set successfully');
        
        // Try to play the video
        const playPromise = remoteVideoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log('✅ Remote video playing successfully');
          }).catch(error => {
            console.warn('⚠️ Remote video play failed:', error);
            // Retry after a short delay
            setTimeout(() => {
              remoteVideoRef.current?.play().catch(err => {
                console.error('❌ Remote video retry failed:', err);
              });
            }, 1000);
          });
        }
      } catch (error) {
        console.error('❌ Error setting remote video stream:', error);
      }
    } else if (remoteVideoRef.current) {
      // Clear remote video if no stream
      remoteVideoRef.current.srcObject = null;
    }
  }, [localStream, remoteStream]);

  // Format time
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 VideoCallInterface unmounting, ensuring media cleanup...');
      // The useCall hook will handle the actual cleanup, but we log here for debugging
    };
  }, []);

  // Get connection quality color
  const getConnectionQualityColor = () => {
    switch (connectionQuality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // Handle fullscreen toggle
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle click to show controls
  const handleClick = () => {
    setShowControls(!showControls);
  };

  // Incoming Call UI
  if (isIncoming && callStatus === 'incoming') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 z-50 overflow-hidden">
        {/* Connection Status */}
        <ConnectionStatus socket={socket} />
        
        {/* Modern Background Pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-purple-500/10 to-blue-500/10" />
          {/* Floating particles */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-emerald-400/30 rounded-full animate-ping" />
          <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-purple-400/30 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/6 w-1 h-1 bg-blue-400/30 rounded-full animate-ping" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-emerald-400/20 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-4 sm:px-6">
          {/* Status Header */}
          <div className="absolute top-4 sm:top-8 left-1/2 transform -translate-x-1/2 z-20">
            <div className="flex items-center gap-2 sm:gap-3 bg-black/30 backdrop-blur-md rounded-full px-4 sm:px-8 py-2 sm:py-4 border border-white/10">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm sm:text-xl font-semibold">Incoming Video Call</span>
            </div>
          </div>

          {/* Caller Avatar with Modern Design */}
          <div className="mb-6 sm:mb-8 mt-16 sm:mt-20">
            <div className="relative inline-block">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-white/30 shadow-2xl bg-gradient-to-br from-emerald-500 via-purple-500 to-blue-500 p-1">
                {callData?.caller?.avatar ? (
                  <img 
                    src={callData.caller.avatar} 
                    alt={callData.caller.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-400 to-purple-400 flex items-center justify-center">
                    <User className="w-16 h-16 sm:w-20 sm:h-20 text-white" />
                  </div>
                )}
              </div>
              
              {/* Modern Ringing Animation */}
              <div className="absolute inset-0 rounded-full border-4 border-emerald-400/50 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-2 border-purple-400/30 animate-ping" />
            </div>
          </div>

          {/* Caller Info */}
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
              {callData?.caller?.name || 'Unknown Caller'}
            </h2>
            <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex items-center gap-1 sm:gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2">
                <Video className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-lg font-medium">Video Call</span>
              </div>
            </div>
            
            <div className="text-lg sm:text-xl text-white/80 animate-pulse font-medium">
              Tap to answer
            </div>
          </div>

          {/* Local Video Preview - Modern Design */}
          <div className="mb-6 sm:mb-8">
            <div className="relative w-64 h-48 sm:w-72 sm:h-54 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-gray-800/50 backdrop-blur-sm">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              {!localStream && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-4 border-white/20 border-t-emerald-400 mx-auto mb-2 sm:mb-4"></div>
                    <p className="text-sm sm:text-lg text-white/70 font-medium">Preparing camera...</p>
                  </div>
                </div>
              )}
              {/* Video overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </div>

          {/* Always Visible Call Controls */}
          <div className="flex items-center gap-4 sm:gap-8">
            {/* Reject Button */}
            <button
              onClick={onRejectCall}
              className="group w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-2xl border-2 border-red-400/30"
              title="Reject Call"
            >
              <PhoneOff className="w-8 h-8 sm:w-10 sm:h-10 group-hover:rotate-12 transition-transform duration-300" />
            </button>

            {/* Accept Button */}
            <button
              onClick={onAcceptCall}
              className="group w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-2xl border-2 border-emerald-400/30"
              title="Accept Call"
            >
              <Phone className="w-8 h-8 sm:w-10 sm:h-10 group-hover:rotate-12 transition-transform duration-300" />
            </button>
          </div>

          {/* Status Messages */}
          <div className="mt-6 sm:mt-8 text-center space-y-2 sm:space-y-3">
            <div className="text-white/70 text-sm sm:text-lg font-medium">
              Swipe up to answer or tap the buttons
            </div>
            
            <div className="text-white/50 text-xs sm:text-sm">
              Video call • Secure connection
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calling State UI
  if (callStatus === 'calling') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 z-50 overflow-hidden">
        {/* Connection Status */}
        <ConnectionStatus socket={socket} />
        
        {/* Modern Background Pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-indigo-500/10" />
          {/* Floating particles */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/30 rounded-full animate-ping" />
          <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-purple-400/30 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/6 w-1 h-1 bg-indigo-400/30 rounded-full animate-ping" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-blue-400/20 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-4 sm:px-6">
          {/* Status Header */}
          <div className="absolute top-4 sm:top-8 left-1/2 transform -translate-x-1/2 z-20">
            <div className="flex items-center gap-2 sm:gap-3 bg-black/30 backdrop-blur-md rounded-full px-4 sm:px-8 py-2 sm:py-4 border border-white/10">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded-full animate-pulse" />
              <span className="text-sm sm:text-xl font-semibold">Calling...</span>
            </div>
          </div>

          {/* Recipient Avatar with Modern Design */}
          <div className="mb-6 sm:mb-8 mt-16 sm:mt-20">
            <div className="relative inline-block">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-white/30 shadow-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-500 p-1">
                {callData?.receiver?.avatar ? (
                  <img 
                    src={callData.receiver.avatar} 
                    alt={callData.receiver.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                    <User className="w-16 h-16 sm:w-20 sm:h-20 text-white" />
                  </div>
                )}
              </div>
              
              {/* Modern Calling Animation */}
              <div className="absolute inset-0 rounded-full border-4 border-blue-400/50 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-2 border-purple-400/30 animate-ping" />
            </div>
          </div>

          {/* Recipient Info */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Calling...
            </h2>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Video className="w-5 h-5" />
                <span className="text-lg font-medium">Video Call</span>
              </div>
            </div>
            
            <div className="text-xl text-white/80 animate-pulse font-medium">
              Waiting for answer...
            </div>
          </div>

          {/* Local Video Preview - Modern Design */}
          <div className="mb-8">
            <div className="relative w-72 h-54 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-gray-800/50 backdrop-blur-sm">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              {!localStream && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-blue-400 mx-auto mb-4"></div>
                    <p className="text-lg text-white/70 font-medium">Starting camera...</p>
                  </div>
                </div>
              )}
              {/* Video overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </div>

          {/* Always Visible Call Controls */}
          <div className="flex items-center gap-6">
            {/* Mute Button */}
            <button
              onClick={onToggleMute}
              className={`group w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-2xl border-2 ${
                isMuted 
                  ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-red-400/30' 
                  : 'bg-white/20 hover:bg-white/30 border-white/20'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-8 h-8 group-hover:rotate-12 transition-transform duration-300" /> : <Mic className="w-8 h-8 group-hover:rotate-12 transition-transform duration-300" />}
            </button>

            {/* Video Toggle Button */}
            <button
              onClick={onToggleVideo}
              className={`group w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-2xl border-2 ${
                !isVideoEnabled 
                  ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-red-400/30' 
                  : 'bg-white/20 hover:bg-white/30 border-white/20'
              }`}
              title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {isVideoEnabled ? <Video className="w-8 h-8 group-hover:rotate-12 transition-transform duration-300" /> : <VideoOff className="w-8 h-8 group-hover:rotate-12 transition-transform duration-300" />}
            </button>

            {/* Reject/Cancel Call Button */}
            <button
              onClick={onEndCall}
              className="group w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-2xl border-2 border-red-400/30"
              title="Cancel Call"
            >
              <PhoneOff className="w-10 h-10 group-hover:rotate-12 transition-transform duration-300" />
            </button>
          </div>

          {/* Status Messages */}
          <div className="mt-8 text-center space-y-3">
            <div className="text-white/70 text-lg font-medium">
              Tap Cancel to end call
            </div>
            
            <div className="text-white/50 text-sm">
              Video call • Secure connection
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Connected State UI
  if (callStatus === 'connected') {
    return (
      <div 
        className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 z-50 flex flex-col"
        onClick={handleClick}
      >
        {/* Connection Status */}
        <ConnectionStatus socket={socket} />
        {/* Remote Video (Main) */}
        <div className="flex-1 relative">
          <video
            ref={remoteVideoRef}
            autoPlay
            className="w-full h-full object-cover"
          />
          
          {/* Fallback for no remote video */}
          {!remoteStream && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-40 h-40 mx-auto mb-8 bg-gray-700 rounded-full flex items-center justify-center">
                  <User className="w-20 h-20 text-gray-400" />
                </div>
                <h3 className="text-3xl font-semibold mb-4">Connected</h3>
                <p className="text-gray-400 text-lg">Waiting for video stream...</p>
                <div className="mt-4">
                  <div className="animate-pulse bg-gray-600 h-2 w-32 mx-auto rounded"></div>
                  <p className="text-sm text-gray-500 mt-2">Establishing connection...</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Connection status overlay */}
          {remoteStream && (
            <div className="absolute top-4 left-4 bg-black/50 rounded-lg px-3 py-2 text-white text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Video Connected</span>
              </div>
            </div>
          )}
          
          {/* Local Video (Picture-in-picture) */}
          <div className="absolute top-6 right-6 w-64 h-48 bg-gray-900 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            
            {/* Local Video Status */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              {isMuted && (
                <div className="bg-red-600 rounded-full p-2">
                  <MicOff className="w-4 h-4 text-white" />
                </div>
              )}
              {!isVideoEnabled && (
                <div className="bg-red-600 rounded-full p-2">
                  <VideoOff className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Top Status Bar */}
          <div className="absolute top-6 left-6">
            <CallStatusBar
              timeElapsed={timeElapsed}
              connectionQuality={connectionQuality}
              participantCount={callData?.participants?.length + 1 || 1}
              callerName={callData?.caller?.name || callData?.receiver?.name || 'Connected'}
            />
          </div>
        </div>

        {/* Bottom Controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-w-2xl mx-auto">
                <CallControls
                  isMuted={isMuted}
                  isVideoEnabled={isVideoEnabled}
                  isScreenSharing={isScreenSharing}
                  connectionQuality={connectionQuality}
                  onToggleMute={onToggleMute}
                  onToggleVideo={onToggleVideo}
                  onToggleScreenShare={onToggleScreenShare}
                  onEndCall={onEndCall}
                  onOpenSettings={() => setShowSettings(!showSettings)}
                  onToggleFullscreen={handleFullscreen}
                  isFullscreen={isFullscreen}
                  showSettings={showSettings}
                  onCloseSettings={() => setShowSettings(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Connecting State UI
  if (callStatus === 'connecting') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 z-50 overflow-hidden">
        {/* Connection Status */}
        <ConnectionStatus socket={socket} />
        
        {/* Modern Background Pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-blue-500/10" />
          {/* Floating particles */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-indigo-400/30 rounded-full animate-ping" />
          <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-purple-400/30 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/6 w-1 h-1 bg-blue-400/30 rounded-full animate-ping" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-indigo-400/20 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex flex-col h-full text-white px-6">
          {/* Header */}
          <div className="flex items-center justify-between pt-8 pb-6 z-20">
            <div className="flex items-center gap-3 bg-black/30 backdrop-blur-md rounded-full px-6 py-3 border border-white/10">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
              <span className="text-lg font-semibold">Connecting...</span>
            </div>
            
            {/* Reject Call Button */}
            <button
              onClick={onEndCall}
              className="group w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-2xl border-2 border-red-400/30"
              title="Cancel Call"
            >
              <PhoneOff className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex items-center justify-center -mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl">
              
              {/* Left Side - Receiver Profile */}
              <div className="flex flex-col items-center justify-center space-y-6">
                {/* Receiver Avatar */}
                <div className="relative">
                  <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white/30 shadow-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-500 p-1">
                    {callData?.receiver?.avatar || callData?.caller?.avatar ? (
                      <img 
                        src={callData.receiver?.avatar || callData.caller?.avatar} 
                        alt={callData.receiver?.name || callData.caller?.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center">
                        <User className="w-24 h-24 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Connecting Animation */}
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-400/50 animate-pulse" />
                  <div className="absolute inset-0 rounded-full border-2 border-purple-400/30 animate-ping" />
                </div>

                {/* Receiver Info */}
                <div className="text-center">
                  <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    {callData?.receiver?.name || callData?.caller?.name || 'Connecting...'}
                  </h2>
                  <div className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                    <Video className="w-5 h-5" />
                    <span className="text-lg font-medium">Video Call</span>
                  </div>
                </div>

              </div>

              {/* Right Side - Your Video Preview */}
              <div className="flex flex-col items-center justify-center space-y-6">

                {/* Your Video Preview */}
                <div className="relative w-80 h-60 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-gray-800/50 backdrop-blur-sm">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  {!localStream && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-indigo-400 mx-auto mb-4"></div>
                        <p className="text-lg text-white/70 font-medium">Starting camera...</p>
                      </div>
                    </div>
                  )}
                  {/* Video overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  
                  {/* Video Status Indicators */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    {isMuted && (
                      <div className="bg-red-600 rounded-full p-1">
                        <MicOff className="w-4 h-4 text-white" />
                      </div>
                    )}
                    {!isVideoEnabled && (
                      <div className="bg-red-600 rounded-full p-1">
                        <VideoOff className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Controls */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={onToggleMute}
                    className={`group w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-2xl border-2 ${
                      isMuted 
                        ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-red-400/30' 
                        : 'bg-white/20 hover:bg-white/30 border-white/20'
                    }`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <MicOff className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" /> : <Mic className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />}
                  </button>

                  <button
                    onClick={onToggleVideo}
                    className={`group w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-2xl border-2 ${
                      !isVideoEnabled 
                        ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-red-400/30' 
                        : 'bg-white/20 hover:bg-white/30 border-white/20'
                    }`}
                    title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                  >
                    {isVideoEnabled ? <Video className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" /> : <VideoOff className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Status */}
          <div className="pb-8 text-center">
            <div className="text-white/70 text-lg font-medium mb-2">
              Establishing secure connection...
            </div>
            <div className="text-white/50 text-sm">
              Video call • Tap Cancel to end call
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default VideoCallInterface;