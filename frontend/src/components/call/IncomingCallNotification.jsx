import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  X,
  User,
  Clock
} from 'lucide-react';

const IncomingCallNotification = ({
  callData,
  onAccept,
  onReject,
  onMinimize,
  isVisible = true,
  className = ''
}) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth < 1024);

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible || !callData) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -100, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed top-2 right-2 sm:top-4 sm:right-4 z-50 ${className} ${isMobile ? 'max-w-[calc(100vw-1rem)]' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-green-500 overflow-hidden w-full max-w-xs sm:w-96 sm:max-w-md mx-2 sm:mx-0">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 p-2 sm:p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="p-1.5 sm:p-2 bg-white/20 rounded-full">
                  <Video className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-xs sm:text-sm">Incoming Call</h3>
                  <p className="text-white/80 text-xs">Tap to answer</p>
                </div>
              </div>
              <button
                onClick={onMinimize}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title="Minimize"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Call Info */}
          <div className="p-2 sm:p-3">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              {/* Caller Avatar */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                {callData.caller?.avatar ? (
                  <img 
                    src={callData.caller.avatar} 
                    alt={callData.caller.name} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-semibold text-sm sm:text-base">
                    {callData.caller?.name?.charAt(0) || 'U'}
                  </span>
                )}
              </div>

              {/* Call Details */}
              <div className="flex-1 min-w-0">
                <h4 className="text-gray-900 dark:text-white font-medium truncate text-sm sm:text-base">
                  {callData.caller?.name || callData.fromUserName || 'Unknown Caller'}
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm truncate">
                  Video Call
                </p>
                {timeElapsed > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-gray-500" />
                    <span className="text-gray-500 text-xs">{formatTime(timeElapsed)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={onReject}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors flex items-center justify-center gap-1 sm:gap-2"
                title="Reject Call"
              >
                <PhoneOff className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-medium">Reject</span>
              </button>
              <button
                onClick={onAccept}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors flex items-center justify-center gap-1 sm:gap-2"
                title="Accept Call"
              >
                <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-medium">Accept</span>
              </button>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="h-1 bg-green-500" />
        </div>

        {/* Hover Effects - Only show on desktop */}
        <AnimatePresence>
          {isHovered && !isMobile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -top-2 -right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full shadow-lg"
            >
              Tap to answer
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default IncomingCallNotification;
