import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  MonitorOff,
  Settings,
  Users,
  MessageSquare,
  Phone,
  RefreshCw
} from 'lucide-react';
import { useSocket } from '../../hook/useSocket';
import { useWebRTC } from '../../hook/useWebRTC';
import { useCallManager } from '../../hook/useCallManager';
import Button from '../ui/Button';
import UserAvatar from '../ui/UserAvatar';
import { toast } from 'react-hot-toast';

const ActiveCallWindow = ({ 
  call, 
  onEndCall, 
  onToggleChat
}) => {
  const { user } = useSelector((state) => state.auth);
  const { socket } = useSocket();
  const {
    localVideoRef,
    remoteVideoRef,
    localStream,
    remoteStream,
    isVideoEnabled,
    isScreenSharing,
    isMuted,
    toggleVideo,
    toggleMute,
    startScreenShare,
    stopScreenShare,
    initializeWebRTC,
    debugWebRTCStatus,
    forceRestartWebRTC,
    isWebRTCConnected,
    hasRemoteStream,
    isWebRTCReady
  } = useWebRTC();

  // Get manual negotiation function from call manager
  const { manualStartNegotiation } = useCallManager();

  const [callDuration, setCallDuration] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const durationIntervalRef = useRef(null);

  useEffect(() => {
    if (call) {
      setParticipants(call.participants || []);
      
      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [call]);

  // Initialize WebRTC when component mounts
  useEffect(() => {
    const initWebRTC = async () => {
      try {
        await initializeWebRTC();
      } catch (error) {
        console.error('Failed to initialize WebRTC:', error);
      }
    };

    initWebRTC();
  }, [initializeWebRTC]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = async () => {
    try {
      if (socket && call) {
        socket.emit('end_call', { callId: call._id });
      }
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      
      if (onEndCall) {
        onEndCall();
      }
    } catch (error) {
      console.error('Error ending call:', error);
      toast.error('Failed to end call');
    }
  };

  const handleToggleMute = async () => {
    try {
      setIsUpdatingSettings(true);
      toggleMute();
      
      if (socket && call) {
        socket.emit('update_call_settings', {
          callId: call._id,
          muted: !isMuted
        });
      }
      
      toast.success(isMuted ? 'Microphone unmuted' : 'Microphone muted');
    } catch (error) {
      toast.error('Failed to toggle microphone');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleToggleVideo = async () => {
    try {
      setIsUpdatingSettings(true);
      toggleVideo();
      
      if (socket && call) {
        socket.emit('update_call_settings', {
          callId: call._id,
          videoEnabled: !isVideoEnabled
        });
      }
      
      toast.success(isVideoEnabled ? 'Camera turned off' : 'Camera turned on');
    } catch (error) {
      toast.error('Failed to toggle camera');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleToggleScreenShare = async () => {
    try {
      setIsUpdatingSettings(true);
      
      if (isScreenSharing) {
        await stopScreenShare();
        toast.success('Screen sharing stopped');
      } else {
        await startScreenShare();
        toast.success('Screen sharing started');
      }
      
      if (socket && call) {
        socket.emit('update_call_settings', {
          callId: call._id,
          screenSharing: !isScreenSharing
        });
      }
    } catch (error) {
      console.error('Screen sharing error:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Screen sharing permission denied');
      } else if (error.name === 'NotFoundError') {
        toast.error('No screen sharing source found');
      } else {
        toast.error('Failed to toggle screen sharing: ' + error.message);
      }
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  // Get other participants (excluding current user)
  const otherParticipants = participants.filter(
    p => p.user._id !== user._id
  );

  // Check if it's a group call
  const isGroupCall = participants.length > 2;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Main Video Area */}
      <div className="flex-1 relative">
        {/* Remote Video */}
        <div className="absolute inset-0">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted={false}
            className="w-full h-full object-cover"
            style={{ backgroundColor: '#1f2937' }}
            onLoadedMetadata={() => console.log('Remote video metadata loaded')}
            onCanPlay={() => console.log('Remote video can play')}
            onPlay={() => console.log('Remote video started playing')}
            onError={(e) => console.error('Remote video error:', e)}
          />
          
          {/* No video fallback */}
          {(!remoteVideoRef.current?.srcObject || 
            !remoteVideoRef.current.srcObject.getVideoTracks().some(track => track.enabled) ||
            remoteVideoRef.current.readyState === 0) && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserAvatar 
                    user={otherParticipants[0]?.user || {}} 
                    size="lg" 
                  />
                </div>
                <p className="text-xl font-semibold">
                  {otherParticipants[0]?.user?.name || 'Waiting...'}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  {!remoteVideoRef.current?.srcObject ? 'Connecting video...' : 
                   !remoteVideoRef.current.srcObject.getVideoTracks().some(track => track.enabled) ? 'Camera is off' :
                   'Loading video...'}
                </p>
                {/* Debug info */}
                <div className="mt-4 text-xs text-gray-500">
                  <p>Remote stream: {remoteStream ? 'Yes' : 'No'}</p>
                  <p>Remote video ref: {remoteVideoRef.current ? 'Yes' : 'No'}</p>
                  <p>Remote srcObject: {remoteVideoRef.current?.srcObject ? 'Yes' : 'No'}</p>
                  <p>Video tracks: {remoteVideoRef.current?.srcObject?.getVideoTracks().length || 0}</p>
                  <p>WebRTC Ready: {isWebRTCReady() ? 'Yes' : 'No'}</p>
                  <p>WebRTC Connected: {isWebRTCConnected() ? 'Yes' : 'No'}</p>
                  <p>Has Remote Stream: {hasRemoteStream() ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Local Video */}
        <div className="absolute bottom-24 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-white shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ 
              backgroundColor: '#1f2937',
              transform: 'scaleX(-1)' // Mirror the local video
            }}
            onLoadedMetadata={() => console.log('Local video metadata loaded')}
            onCanPlay={() => console.log('Local video can play')}
            onPlay={() => console.log('Local video started playing')}
            onError={(e) => console.error('Local video error:', e)}
          />
          {/* Fallback if no video stream */}
          {!localVideoRef.current?.srcObject && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-xs">Starting camera...</p>
              </div>
            </div>
          )}
        </div>

            {/* Call Duration */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 px-4 py-2 rounded-lg">
              <p className="text-white font-semibold">{formatDuration(callDuration)}</p>
            </div>

            {/* Screen Sharing Indicator */}
            {isScreenSharing && (
              <div className="absolute top-4 right-4 bg-black bg-opacity-75 px-3 py-1 rounded-lg">
                <div className="flex items-center gap-2 text-white text-sm">
                  <Monitor className="w-4 h-4" />
                  <span>Sharing Screen</span>
                </div>
              </div>
            )}

        {/* Settings Status Indicator */}
        {isUpdatingSettings && (
          <div className="absolute top-4 right-4">
            <div className="flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full text-white text-xs">
              <Settings className="w-3 h-3 animate-spin" />
              <span>Updating...</span>
            </div>
          </div>
        )}
      </div>

      {/* Call Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent p-6">
        <div className="flex justify-center items-center space-x-4">
          {/* Microphone On/Off */}
          <Button
            onClick={handleToggleMute}
            variant="ghost"
            size="lg"
            className={`rounded-full w-14 h-14 ${
              !isMuted
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            disabled={isUpdatingSettings}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </Button>

          {/* Video On/Off */}
          <Button
            onClick={handleToggleVideo}
            variant="ghost"
            size="lg"
            className={`rounded-full w-14 h-14 ${
              isVideoEnabled
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            disabled={isUpdatingSettings}
          >
            {isVideoEnabled ? (
              <Video className="w-6 h-6" />
            ) : (
              <VideoOff className="w-6 h-6" />
            )}
          </Button>

          {/* Screen Share */}
          <Button
            onClick={handleToggleScreenShare}
            variant="ghost"
            size="lg"
            className={`rounded-full w-14 h-14 ${
              isScreenSharing
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
            disabled={isUpdatingSettings}
          >
            {isScreenSharing ? (
              <MonitorOff className="w-6 h-6" />
            ) : (
              <Monitor className="w-6 h-6" />
            )}
          </Button>

    {/* Debug Button */}
    <Button
      onClick={debugWebRTCStatus}
      variant="ghost"
      size="lg"
      className="rounded-full w-14 h-14 bg-white/10 hover:bg-white/20 text-white"
      title="Debug WebRTC"
    >
      <Settings className="w-6 h-6" />
    </Button>

    {/* Force Refresh Remote Video Button */}
    <Button
      onClick={() => {
        console.log('Force refreshing remote video...');
        if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
          remoteVideoRef.current.srcObject = null;
          setTimeout(() => {
            if (remoteStream) {
              remoteVideoRef.current.srcObject = remoteStream;
              remoteVideoRef.current.play().catch(console.error);
            }
          }, 100);
        }
      }}
      variant="ghost"
      size="lg"
      className="rounded-full w-14 h-14 bg-white/10 hover:bg-white/20 text-white"
      title="Refresh Remote Video"
    >
      <RefreshCw className="w-6 h-6" />
    </Button>

    {/* Force Restart WebRTC Button */}
    <Button
      onClick={async () => {
        console.log('Force restarting WebRTC...');
        try {
          await forceRestartWebRTC();
          toast.success('WebRTC restarted');
        } catch (error) {
          console.error('Error restarting WebRTC:', error);
          toast.error('Failed to restart WebRTC');
        }
      }}
      variant="ghost"
      size="lg"
      className="rounded-full w-14 h-14 bg-red-500/20 hover:bg-red-500/30 text-white"
      title="Restart WebRTC"
    >
      <Phone className="w-6 h-6" />
    </Button>

    {/* Manual Negotiation Button */}
    <Button
      onClick={async () => {
        console.log('Manual negotiation triggered');
        try {
          // First check WebRTC status
          debugWebRTCStatus();
          
          // Force initialize WebRTC if needed
          if (!isWebRTCReady()) {
            console.log('WebRTC not ready, initializing...');
            await initializeWebRTC();
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          // Start negotiation
          await manualStartNegotiation();
          toast.success('Negotiation started');
        } catch (error) {
          console.error('Error starting negotiation:', error);
          toast.error('Failed to start negotiation');
        }
      }}
      variant="ghost"
      size="lg"
      className="rounded-full w-14 h-14 bg-blue-500/20 hover:bg-blue-500/30 text-white"
      title="Start Negotiation"
    >
      <MessageSquare className="w-6 h-6" />
    </Button>

          {/* End Call Action */}
          <Button
            onClick={handleEndCall}
            variant="ghost"
            size="lg"
            className="rounded-full w-14 h-14 bg-red-600 hover:bg-red-700 text-white"
            title="End call"
            disabled={isUpdatingSettings}
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ActiveCallWindow;