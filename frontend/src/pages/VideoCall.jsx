import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCall } from '../hook/useCall';
import { useSocket } from '../hook/useSocket';
import IncomingVideoCallModal from '../components/call/IncomingVideoCallModal';
import OutgoingVideoCallModal from '../components/call/OutgoingVideoCallModal';
import VideoCallInterface from '../components/call/VideoCallInterface';
import { toast } from 'react-hot-toast';

export default function VideoCall() {
  const { callId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  
  const {
    incomingCall,
    outgoingCall,
    activeCall,
    showIncomingCall,
    showOutgoingCall,
    showActiveCall,
    callStatus,
    localStream,
    remoteStream,
    isMuted,
    isVideoEnabled,
    isScreenSharing,
    participants,
    acceptCall,
    rejectCall,
    endActiveCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare
  } = useCall();

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (callId && socket) {
      console.log('VideoCall page loaded with callId:', callId);
      
      // Check if this is an incoming call that we need to handle
      if (incomingCall && incomingCall.callId === callId) {
        console.log('Handling incoming call on VideoCall page');
        setIsInitialized(true);
        
        // Auto-accept the call if we have an incoming call and we're on the call page
        setTimeout(async () => {
          console.log('Auto-accepting call from VideoCall page');
          try {
            await acceptCall();
            console.log('Call auto-accepted successfully');
          } catch (error) {
            console.error('Error auto-accepting call:', error);
          }
        }, 1000); // Small delay to ensure everything is loaded
      } else if (activeCall && activeCall._id === callId) {
        console.log('Active call found, showing call interface');
        setIsInitialized(true);
      } else {
        console.log('No active call found, initializing call interface');
        setIsInitialized(true);
        
        // Listen for call events to get the call data
        const handleIncomingCall = (data) => {
          console.log('Received incoming call data:', data);
          if (data.callId === callId) {
            setIsInitialized(true);
          }
        };

        const handleCallJoined = (data) => {
          console.log('Call joined data:', data);
          if (data.call && data.call._id === callId) {
            console.log('Call joined - transitioning to active call interface');
            setIsInitialized(true);
          }
        };

        socket.on('incoming_call', handleIncomingCall);
        socket.on('call_joined', handleCallJoined);

        // Set a timeout to show fallback if no call data comes
        const timeout = setTimeout(() => {
          console.log('Timeout waiting for call data, showing fallback');
          setIsInitialized(true);
        }, 5000);

        return () => {
          socket.off('incoming_call', handleIncomingCall);
          socket.off('call_joined', handleCallJoined);
          clearTimeout(timeout);
        };
      }
    }
  }, [callId, socket, incomingCall, activeCall]);

  const handleEndCall = () => {
    console.log('Ending call and navigating back');
    endActiveCall();
    navigate('/chat');
  };

  const handleToggleChat = () => {
    // Navigate to chat if needed
    navigate('/chat');
  };

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Initializing call...</p>
        </div>
      </div>
    );
  }

  // Show incoming call modal
  if (showIncomingCall && incomingCall) {
    return (
      <IncomingVideoCallModal
        call={incomingCall}
        onAccept={acceptCall}
        onReject={rejectCall}
      />
    );
  }

  // Show outgoing call modal
  if (showOutgoingCall && outgoingCall) {
    return (
      <OutgoingVideoCallModal
        call={outgoingCall}
        onCancel={() => {
          console.log('Canceling outgoing call');
          navigate('/chat');
        }}
      />
    );
  }

  // Show active call window
  if (showActiveCall && activeCall) {
    return (
      <VideoCallInterface
        localStream={localStream}
        remoteStream={remoteStream}
        isMuted={isMuted}
        isVideoEnabled={isVideoEnabled}
        isScreenSharing={isScreenSharing}
        participants={participants}
        callStatus={callStatus}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onEndCall={handleEndCall}
        onMinimize={() => navigate('/chat')}
        onMaximize={() => window.focus()}
        isMinimized={false}
      />
    );
  }

  // Default state - no active call
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-center text-white">
        <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold mb-2">No Active Call</h2>
        <p className="text-gray-400 mb-6">
          {callId ? `Call ${callId} not found or has ended` : 'Start a call from the chat interface'}
        </p>
        <button
          onClick={() => navigate('/chat')}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
        >
          Go to Chat
        </button>
      </div>
    </div>
  );
}