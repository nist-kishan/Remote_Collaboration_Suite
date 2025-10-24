import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useSocket } from '../../hook/useSocket';
import { useCall } from '../../hook/useCall';
import { startCall, endCall } from '../../api/callApi';
import { isExtensionError } from '../../utils/errorHandler';
import { toast } from 'react-hot-toast';
import ParticipantGrid from './ParticipantGrid';
import CallControls from './CallControls';
import { PhoneOff } from 'lucide-react';

const CallWindow = ({ chat, onEndCall }) => {
  const { user } = useSelector((state) => state.auth);
  const { socket } = useSocket();
  const {
    localVideoRef,
    remoteVideoRef,
    isVideoEnabled,
    isScreenSharing,
    startLocalStream,
    stopLocalStream,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    createPeerConnection,
    peerConnection
  } = useWebRTC(socket);

  const [callStatus, setCallStatus] = useState('ringing');
  const [participants, setParticipants] = useState([]);
  const [callDuration, setCallDuration] = useState(0);
  const durationIntervalRef = useRef(null);

  useEffect(() => {
    const initializeCall = async () => {
      try {
        // Start local stream first
        const stream = await startLocalStream();
        // Create peer connection
        createPeerConnection();
        // Start call
        if (socket && chat) {
          socket.emit('start_call', {
            chatId: chat._id,
            type: chat.type
          });
        }
      } catch (error) {
        console.error('Error initializing call:', error);
        
        // Check if this is a browser extension error
        if (isExtensionError(error)) {
          return;
        }
        
        // Show user-friendly error message
        toast.error('Failed to start video call: ' + error.message);
      }
    };

    initializeCall();

    return () => {
      stopLocalStream();
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  // Listen for call events
  useEffect(() => {
    if (socket) {
      socket.on('call_started', (data) => {
        setCallStatus('ringing');
        setParticipants(data.call.participants);
      });

      socket.on('call_joined', (data) => {
        setCallStatus('ongoing');
        setParticipants(data.call.participants);
        
        // Start duration timer
        durationIntervalRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);
      });

      socket.on('call_ended', () => {
        setCallStatus('ended');
        handleEndCall();
      });

      socket.on('participant_joined', (data) => {
        setParticipants(prev => [...prev, data]);
      });

      socket.on('participant_left', (data) => {
        setParticipants(prev => prev.filter(p => p.userId !== data.userId));
      });

      socket.on('call_settings_updated', (data) => {
        setParticipants(prev => prev.map(p => 
          p.userId === data.userId ? { ...p, ...data } : p
        ));
      });

      // WebRTC events
      socket.on('sdp_offer', async (data) => {
        if (peerConnection) {
          await peerConnection.setRemoteDescription(data.offer);
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          socket.emit('sdp_answer', {
            callId: chat._id,
            answer
          });
        }
      });

      socket.on('sdp_answer', async (data) => {
        if (peerConnection) {
          await peerConnection.setRemoteDescription(data.answer);
        }
      });

      socket.on('ice_candidate', async (data) => {
        if (peerConnection && data.candidate) {
          await peerConnection.addIceCandidate(data.candidate);
        }
      });

      return () => {
        socket.off('call_started');
        socket.off('call_joined');
        socket.off('call_ended');
        socket.off('participant_joined');
        socket.off('participant_left');
        socket.off('call_settings_updated');
        socket.off('sdp_offer');
        socket.off('sdp_answer');
        socket.off('ice_candidate');
      };
    }
  }, [socket, chat, peerConnection]);

  const handleEndCall = async () => {
    if (socket) {
      socket.emit('end_call', { callId: chat._id });
    }
    
    stopLocalStream();
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    
    onEndCall();
  };

  const handleTestCamera = async () => {
    try {
      const stream = await startLocalStream();
      toast.success('Camera is working! Check the small video window.');
    } catch (error) {
      console.error('Camera test failed:', error);
      toast.error('Camera test failed: ' + error.message);
    }
  };

  const handleToggleVideo = () => {
    toggleVideo();
    if (socket) {
      socket.emit('update_call_settings', {
        callId: chat._id,
        videoEnabled: !isVideoEnabled
      });
    }
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      await stopScreenShare();
    } else {
      await startScreenShare();
    }
    
    if (socket) {
      socket.emit('update_call_settings', {
        callId: chat._id,
        screenSharing: !isScreenSharing
      });
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* Remote Video */}
      <div className="absolute inset-0">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          style={{ backgroundColor: '#1f2937' }} // Dark background while loading
          onLoadedMetadata={() => }
          onCanPlay={() => }
          onPlay={() => }
          onError={(e) => console.error('Remote video error:', e)}
        />
        
        {/* No video fallback */}
        {!remoteVideoRef.current?.srcObject && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white">
              <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <PhoneOff className="w-12 h-12" />
              </div>
              <p className="text-xl font-semibold">
                {participants.find(p => p.userId !== user._id)?.userName || 'Waiting...'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Call Status Overlay */}
      {callStatus === 'ringing' && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-32 h-32 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <PhoneOff className="w-16 h-16" />
            </div>
            <p className="text-2xl font-semibold mb-2">Calling...</p>
            <p className="text-gray-300">
              {chat.type === 'group' ? chat.name : 'Waiting for answer'}
            </p>
          </div>
        </div>
      )}

      {/* Local Video - Show immediately when call starts */}
      {(callStatus === 'ringing' || callStatus === 'ongoing') && (
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
            onLoadedMetadata={() => }
            onCanPlay={() => }
            onPlay={() => }
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
      )}

      {/* Duration */}
      {callStatus === 'ongoing' && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 px-4 py-2 rounded-lg">
          <p className="text-white font-semibold">{formatDuration(callDuration)}</p>
        </div>
      )}

      {/* Participants Grid (for group calls) */}
      {chat.type === 'group' && (
        <ParticipantGrid
          participants={participants}
          localVideoRef={localVideoRef}
          remoteVideoRef={remoteVideoRef}
        />
      )}

      {/* Call Controls */}
      <CallControls
        isVideoEnabled={isVideoEnabled}
        isScreenSharing={isScreenSharing}
        callStatus={callStatus}
        onToggleVideo={handleToggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onEndCall={handleEndCall}
        callId={chat._id}
      />

      {/* Debug: Test Camera Button */}
      {callStatus === 'ringing' && (
        <button
          onClick={handleTestCamera}
          className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
        >
          Test Camera
        </button>
      )}
    </div>
  );
};

export default CallWindow;

