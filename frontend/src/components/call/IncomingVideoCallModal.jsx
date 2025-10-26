import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Video, VideoOff, User } from 'lucide-react';
import CustomButton from '../ui/CustomButton';
import UserProfileAvatar from '../ui/UserProfileAvatar';

const IncomingCallModal = ({ 
  incomingCall, 
  onAccept, 
  onReject, 
  onDecline,
  isVisible = false 
}) => {
  const [callDuration, setCallDuration] = useState(0);
  const [isRinging, setIsRinging] = useState(true);

  useEffect(() => {
    if (isVisible && incomingCall) {
      setIsRinging(true);
      setCallDuration(0);
      
      // Start call duration timer
      const timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      // Auto-reject after 30 seconds
      const autoRejectTimer = setTimeout(() => {
        onDecline?.();
      }, 30000);

      return () => {
        clearInterval(timer);
        clearTimeout(autoRejectTimer);
      };
    }
  }, [isVisible, incomingCall, onDecline]);

  if (!isVisible || !incomingCall) return null;

  // Extract caller info from incomingCall
  const fromUserName = incomingCall?.fromUserName || incomingCall?.caller?.name || 'Unknown User';
  const fromUserAvatar = incomingCall?.fromUserAvatar || incomingCall?.caller?.avatar || null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 animate-pulse" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-96 h-96 bg-blue-500/10 rounded-full animate-ping" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/20 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/30 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center text-white max-w-md w-full mx-4">
        {/* Caller Avatar */}
        <div className="mb-8">
          <div className="relative inline-block">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl bg-gradient-to-br from-blue-500 to-purple-600">
              {fromUserAvatar ? (
                <img 
                  src={fromUserAvatar} 
                  alt={fromUserName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="w-full h-full flex items-center justify-center" style={{ display: fromUserAvatar ? 'none' : 'flex' }}>
                <User className="w-16 h-16 text-white" />
              </div>
            </div>
            
            {/* Ringing Animation */}
            {isRinging && (
              <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping" />
            )}
          </div>
        </div>

        {/* Caller Info */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">{fromUserName}</h2>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Video className="w-5 h-5" />
            <span className="text-lg">
              Incoming Video Call
            </span>
          </div>
          
          {/* Call Duration */}
          <div className="text-sm text-white/70">
            {callDuration > 0 ? (
              <span>{Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}</span>
            ) : (
              <span className="animate-pulse">Ringing...</span>
            )}
          </div>
        </div>

        {/* Call Controls */}
        <div className="flex items-center justify-center gap-6">
          {/* Reject Button */}
          <CustomButton
            onClick={onReject}
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transform hover:scale-105 transition-all duration-200"
            title="Reject"
          >
            <PhoneOff className="w-8 h-8" />
          </CustomButton>

          {/* Accept Button */}
          <CustomButton
            onClick={onAccept}
            className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg transform hover:scale-105 transition-all duration-200"
            title="Accept Video Call"
          >
            <Video className="w-8 h-8" />
          </CustomButton>
        </div>

        {/* Decline Option */}
        <div className="mt-6">
          <button
            onClick={onDecline}
            className="text-white/70 hover:text-white text-sm underline transition-colors"
          >
            Decline & Send Message
          </button>
        </div>
      </div>

      {/* Sound Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center gap-2 text-white/70 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Call in progress</span>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
