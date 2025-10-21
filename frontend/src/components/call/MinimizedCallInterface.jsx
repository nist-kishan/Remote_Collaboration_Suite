import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  Maximize2, 
  PhoneOff,
  Users,
  Clock
} from 'lucide-react';

const MinimizedCallInterface = ({
  callData,
  onMaximize,
  onEndCall,
  onToggleMute,
  onToggleVideo,
  className = ''
}) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 320, y: 100 });

  // Calculate elapsed time
  useEffect(() => {
    if (!callData?.startTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(callData.startTime)) / 1000);
      setTimeElapsed(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [callData?.startTime]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (e) => {
      const newX = e.clientX - startX;
      const newY = e.clientY - startY;
      
      // Keep within viewport bounds
      const maxX = window.innerWidth - 300;
      const maxY = window.innerHeight - 80;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 100 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        x: position.x, 
        y: position.y 
      }}
      exit={{ opacity: 0, scale: 0.8, y: 100 }}
      drag={false} // We handle dragging manually
      className={`fixed z-50 ${className}`}
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      <div className="bg-gray-900 rounded-lg shadow-2xl border border-gray-700 overflow-hidden w-80">
        {/* Header - Draggable area */}
        <div 
          className="bg-gradient-to-r from-indigo-600 to-purple-600 p-3 cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-white/20 rounded-full">
                <Video className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Video Call</h3>
                <p className="text-white/80 text-xs">
                  {callData?.status === 'connected' ? 'Connected' : 'Connecting...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onMaximize}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title="Maximize"
              >
                <Maximize2 className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={onEndCall}
                className="p-1 hover:bg-red-500/50 rounded transition-colors"
                title="End Call"
              >
                <PhoneOff className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Call Info */}
        <div className="p-3">
          <div className="flex items-center gap-3 mb-3">
            {/* Caller Avatar */}
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
              {callData?.caller?.avatar ? (
                <img 
                  src={callData.caller.avatar} 
                  alt={callData.caller.name} 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-sm">
                  {callData?.caller?.name?.charAt(0) || 'U'}
                </span>
              )}
            </div>

            {/* Call Details */}
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium truncate">
                {callData?.caller?.name || 'Unknown User'}
              </h4>
              <p className="text-gray-400 text-sm truncate">
                {callData?.type === 'group' ? 'Group Call' : 'Video Call'}
              </p>
              {callData?.status === 'connected' && timeElapsed > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-400 text-xs">{formatTime(timeElapsed)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Mute toggle */}
              <button
                onClick={onToggleMute}
                className={`p-2 rounded-full transition-colors ${
                  callData?.isMuted 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
                title={callData?.isMuted ? 'Unmute' : 'Mute'}
              >
                {callData?.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Video toggle */}
              <button
                onClick={onToggleVideo}
                className={`p-2 rounded-full transition-colors ${
                  !callData?.isVideoEnabled 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
                title={callData?.isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
              >
                {callData?.isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>
            </div>

            {/* Participants count */}
            {callData?.participants && callData.participants.length > 0 && (
              <div className="flex items-center gap-1 text-gray-400">
                <Users className="w-4 h-4" />
                <span className="text-sm">{callData.participants.length + 1}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Indicator */}
        <div className={`h-1 ${
          callData?.status === 'connected' ? 'bg-green-500' : 'bg-yellow-500'
        }`} />
      </div>
    </motion.div>
  );
};

export default MinimizedCallInterface;
