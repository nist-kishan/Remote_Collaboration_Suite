import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Video, VideoOff, User } from 'lucide-react';
import Button from '../ui/Button';
import UserAvatar from '../ui/UserAvatar';

const OutgoingCallModal = ({ 
  outgoingCall, 
  onCancel, 
  isVisible = false 
}) => {
  const [callDuration, setCallDuration] = useState(0);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    if (isVisible && outgoingCall) {
      setIsConnecting(true);
      setCallDuration(0);
      
      // Start call duration timer
      const timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      return () => {
        clearInterval(timer);
      };
    }
  }, [isVisible, outgoingCall]);

  if (!isVisible || !outgoingCall) return null;

  const { participants } = outgoingCall;
  
  // Get the other participant (not the current user)
  const otherParticipant = participants?.find(p => p.status === 'invited');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 to-blue-600/20 animate-pulse" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-96 h-96 bg-green-500/10 rounded-full animate-ping" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-500/20 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-500/30 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center text-white max-w-md w-full mx-4">
        {/* Recipient Avatar */}
        <div className="mb-8">
          <div className="relative inline-block">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
              {otherParticipant?.user ? (
                <UserAvatar user={otherParticipant.user} size="xl" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
                  <User className="w-16 h-16 text-white" />
                </div>
              )}
            </div>
            
            {/* Connecting Animation */}
            {isConnecting && (
              <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-pulse" />
            )}
          </div>
        </div>

        {/* Recipient Info */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            {otherParticipant?.user?.name || 'Unknown User'}
          </h2>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Video className="w-5 h-5" />
            <span className="text-lg">
              {isConnecting ? 'Connecting...' : 'Calling...'}
            </span>
          </div>
          
          {/* Call Duration */}
          <div className="text-sm text-white/70">
            {callDuration > 0 ? (
              <span>{Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}</span>
            ) : (
              <span className="animate-pulse">Waiting for answer...</span>
            )}
          </div>
        </div>

        {/* Call Controls */}
        <div className="flex items-center justify-center">
          {/* Cancel Button */}
          <Button
            onClick={onCancel}
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transform hover:scale-105 transition-all duration-200"
            title="Cancel Call"
          >
            <PhoneOff className="w-8 h-8" />
          </Button>
        </div>

        {/* Status Messages */}
        <div className="mt-6 space-y-2">
          {isConnecting && (
            <div className="text-white/70 text-sm animate-pulse">
              Connecting to {otherParticipant?.user?.name || 'recipient'}...
            </div>
          )}
          
          <div className="text-white/50 text-xs">
            Video call • Tap to cancel
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center gap-2 text-white/70 text-sm">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          <span>Calling...</span>
        </div>
      </div>
    </div>
  );
};

export default OutgoingCallModal;
