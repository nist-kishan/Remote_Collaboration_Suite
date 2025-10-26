import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCall } from '../../hook/useCall';
import { 
  Phone, 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  Maximize2, 
  PhoneOff,
  X,
  Users,
  Clock
} from 'lucide-react';

const VideoCallNotification = ({
  onJoinCall,
  onEndCall,
  onMinimize,
  isVisible = true,
  className = ''
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  const { 
    activeCall, 
    callStatus, 
    isMuted, 
    isVideoEnabled, 
    participants,
    endActiveCall 
  } = useCall();

  // Get call data from active call or localStorage
  const callData = activeCall || JSON.parse(localStorage.getItem('activeCallData') || 'null');

  // Calculate elapsed time - always call this hook
  useEffect(() => {
    if (!callData?.startTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(callData.startTime)) / 1000);
      setTimeElapsed(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [callData?.startTime]);

  // Check if we should show the notification
  // Only show when:
  // 1. There's an active call (connected status)
  // 2. User is NOT on call-related pages
  // 3. Component is visible
  const isOnCallPage = location.pathname.includes('/video-call/') || location.pathname.includes('/call/');
  const hasActiveCall = callData && (callData.status === 'connected' || callStatus === 'connected');
  const shouldShow = hasActiveCall && !isOnCallPage && isVisible;

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallStatusColor = () => {
    switch (callData?.status) {
      case 'connecting':
        return 'border-yellow-500';
      case 'connected':
        return 'border-green-500';
      case 'ended':
        return 'border-red-500';
      default:
        return 'border-gray-500';
    }
  };

  const getCallStatusText = () => {
    const status = callData?.status || callStatus;
    switch (status) {
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

  const handleJoinCall = () => {
    if (callData?.receiverId) {
      navigate(`/video-call/receiver/${callData.receiverId}`);
    } else if (callData?.callerId) {
      navigate(`/video-call/caller/${callData.callerId}`);
    } else if (callData?.callId) {
      navigate(`/call/${callData.callId}`);
    }
    onJoinCall?.();
  };

  const handleEndCall = () => {
    endActiveCall();
    localStorage.removeItem('activeCallData');
    navigate('/video-call/ended', { 
      state: { 
        message: 'Call ended',
        caller: callData.caller || callData.receiver
      } 
    });
  };

  // Don't render anything if we shouldn't show the notification
  if (!shouldShow) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -100, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed top-4 right-4 z-50 ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 ${getCallStatusColor()} overflow-hidden max-w-sm`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/20 rounded-full">
                  <Video className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Video Call Active</h3>
                  <p className="text-white/80 text-xs">{getCallStatusText()}</p>
                </div>
              </div>
              <button
                onClick={onMinimize}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title="Minimize"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Call Info */}
          <div className="p-3">
            <div className="flex items-center gap-3 mb-3">
              {/* Caller/Receiver Avatar */}
              <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                {callData.caller?.avatar || callData.receiver?.avatar ? (
                  <img 
                    src={callData.caller?.avatar || callData.receiver?.avatar} 
                    alt={callData.caller?.name || callData.receiver?.name} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-semibold">
                    {(callData.caller?.name || callData.receiver?.name || 'U').charAt(0)}
                  </span>
                )}
              </div>

              {/* Call Details */}
              <div className="flex-1 min-w-0">
                <h4 className="text-gray-900 dark:text-white font-medium truncate">
                  {callData.caller?.name || callData.receiver?.name || 'Unknown User'}
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm truncate">
                  {callData.type === 'group' ? 'Group Call' : 'Video Call'}
                </p>
                {callData.status === 'connected' && timeElapsed > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-gray-500" />
                    <span className="text-gray-500 text-xs">{formatTime(timeElapsed)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Participants Count */}
            {callData.participants && callData.participants.length > 0 && (
              <div className="flex items-center gap-2 mb-3 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400 text-sm">
                  {callData.participants.length + 1} participant{callData.participants.length !== 0 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Media Status */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1">
                {(callData.isMuted || isMuted) ? (
                  <MicOff className="w-4 h-4 text-red-500" />
                ) : (
                  <Mic className="w-4 h-4 text-green-500" />
                )}
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {(callData.isMuted || isMuted) ? 'Muted' : 'Unmuted'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {!(callData.isVideoEnabled !== undefined ? callData.isVideoEnabled : isVideoEnabled) ? (
                  <VideoOff className="w-4 h-4 text-red-500" />
                ) : (
                  <Video className="w-4 h-4 text-green-500" />
                )}
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {(callData.isVideoEnabled !== undefined ? callData.isVideoEnabled : isVideoEnabled) ? 'Video On' : 'Video Off'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleJoinCall}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Maximize2 className="w-4 h-4" />
                <span className="text-sm font-medium">Join Call</span>
              </button>
              <button
                onClick={handleEndCall}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                title="End Call"
              >
                <PhoneOff className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Status Indicator */}
          <div className={`h-1 ${getCallStatusColor().replace('border-', 'bg-')}`} />
        </div>

        {/* Hover Effects */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full shadow-lg"
            >
              Click to join call
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoCallNotification;
