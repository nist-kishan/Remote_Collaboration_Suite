import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCall } from "../hook/useCallIntegration";
import { useSocket } from "../hook/useSocket";
import { useSelector } from "react-redux";
import { selectActiveCall, selectCallStatus } from "../store/slice/callSlice";
import IncomingVideoCallModal from "../components/call/IncomingVideoCallModal";
import OutgoingVideoCallModal from "../components/call/OutgoingVideoCallModal";
import VideoCallInterface from "../components/call/VideoCallInterface";
import { toast } from "react-hot-toast";

export default function VideoCall() {
  const { callId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  
  // Get call state from Redux
  const reduxActiveCall = useSelector(selectActiveCall);
  const reduxCallStatus = useSelector(selectCallStatus);

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
    toggleScreenShare,
    fetchCallById,
  } = useCall();

  const [isInitialized, setIsInitialized] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // 🔍 CONSOLE LOGGING - Redux State & User Data
  useEffect(() => {
    console.group('📞 VIDEO CALL - Redux State');
    console.log('🔴 Active Call:', activeCall);
    console.log('📥 Incoming Call:', incomingCall);
    console.log('📤 Outgoing Call:', outgoingCall);
    console.log('📊 Call Status:', callStatus);
    console.log('🎥 Local Stream:', localStream);
    console.log('🎥 Remote Stream:', remoteStream);
    console.log('🔇 Is Muted:', isMuted);
    console.log('📹 Is Video Enabled:', isVideoEnabled);
    console.log('🖥️ Is Screen Sharing:', isScreenSharing);
    console.log('👥 Participants:', participants);
    console.log('✅ Show Active Call:', showActiveCall);
    console.log('📥 Show Incoming Call:', showIncomingCall);
    console.log('📤 Show Outgoing Call:', showOutgoingCall);
    console.groupEnd();
  }, [activeCall, incomingCall, outgoingCall, callStatus, localStream, remoteStream, 
      isMuted, isVideoEnabled, isScreenSharing, participants, showActiveCall, 
      showIncomingCall, showOutgoingCall]);

  // Restore call state on page refresh
  useEffect(() => {
    const restoreCall = async () => {
      // If no callId in URL, check if we have an active call
      if (!callId) {
        if (activeCall || incomingCall || outgoingCall) {
          console.log('📞 No callId in URL but have call state, initializing...');
          setIsInitialized(true);
          return;
        }
        // No callId and no call state - set initialized to show fallback
        setIsInitialized(true);
        return;
      }
      
      if (isRestoring) return;
      
      // Check if we have an active call in Redux (restored from localStorage)
      if (reduxActiveCall && reduxCallStatus === 'connected') {
        const savedCallId = reduxActiveCall._id || reduxActiveCall.callId;
        if (savedCallId === callId) {
          console.log('🔄 Call state restored from localStorage');
          setIsInitialized(true);
          return;
        }
      }
      
      // Try to fetch call data from backend
      if (callId && !activeCall && !incomingCall && !outgoingCall) {
        setIsRestoring(true);
        try {
          console.log('🔍 Fetching call data for:', callId);
          const callData = await fetchCallById(callId);
          if (callData) {
            console.log('✅ Call data fetched successfully');
            setIsInitialized(true);
          } else {
            console.warn('⚠️ Call not found:', callId);
            setIsInitialized(true);
          }
        } catch (error) {
          console.error('❌ Error fetching call:', error);
          setIsInitialized(true);
        } finally {
          setIsRestoring(false);
        }
      }
    };
    
    restoreCall();
  }, [callId, reduxActiveCall, reduxCallStatus, activeCall, incomingCall, outgoingCall, fetchCallById, isRestoring]);

  useEffect(() => {
    if (callId && socket) {
      // Check if this is an incoming call that we need to handle
      if (
        incomingCall &&
        (incomingCall.callId === callId || incomingCall._id === callId)
      ) {
        setIsInitialized(true);

        // Auto-accept the call if we have an incoming call and we're on the call page
        setTimeout(async () => {
          try {
            const currentCallId = incomingCall.callId || incomingCall._id || callId;
            console.log('📞 Auto-accepting call:', currentCallId);
            await acceptCall(currentCallId);
          } catch (error) {
            console.error("❌ Error auto-accepting call:", error);
            toast.error("Failed to accept call: " + error.message);
          }
        }, 2000); // Increased delay to ensure everything is loaded
      } else if (
        activeCall &&
        (activeCall._id === callId || activeCall.callId === callId)
      ) {
        setIsInitialized(true);
      } else if (!isRestoring) {
        setIsInitialized(true);

        // Listen for call events to get the call data
        const handleIncomingCall = (data) => {
          if (data.callId === callId || data.call?._id === callId) {
            setIsInitialized(true);
          }
        };

        const handleCallJoined = (data) => {
          if (
            data.call &&
            (data.call._id === callId || data.callId === callId)
          ) {
            setIsInitialized(true);
          }
        };

        socket.on("incoming_call", handleIncomingCall);
        socket.on("call_joined", handleCallJoined);

        // Set a timeout to show fallback if no call data comes
        const timeout = setTimeout(() => {
          setIsInitialized(true);
        }, 5000);

        return () => {
          socket.off("incoming_call", handleIncomingCall);
          socket.off("call_joined", handleCallJoined);
          clearTimeout(timeout);
        };
      }
    }
  }, [callId, socket, incomingCall, activeCall, acceptCall, isRestoring]);

  const handleEndCall = async () => {
    try {
      const currentCallId = activeCall?._id || activeCall?.callId || callId;
      if (!currentCallId) {
        console.warn('⚠️ No callId found, navigating to chat');
        navigate("/chat");
        return;
      }
      console.log('🛑 Ending call:', currentCallId);
      await endActiveCall(currentCallId);
    } catch (error) {
      console.error('❌ Error ending call:', error);
    } finally {
      // Always navigate away after ending call
      navigate("/chat");
    }
  };

  const handleToggleChat = () => {
    // Navigate to chat if needed
    navigate("/chat");
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

  // If call has ended, navigate away immediately
  if (callStatus === 'ended' || callStatus === 'idle') {
    navigate("/chat");
    return null;
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
          navigate("/chat");
        }}
      />
    );
  }

  // Show active call window
  if (showActiveCall && activeCall) {
    return (
      <VideoCallInterface
        callData={activeCall}
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
        onMinimize={() => navigate("/chat")}
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
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold mb-2">No Active Call</h2>
        <p className="text-gray-400 mb-6">
          {callId
            ? `Call ${callId} not found or has ended`
            : "Start a call from the chat interface"}
        </p>
        <button
          onClick={() => navigate("/chat")}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
        >
          Go to Chat
        </button>
      </div>
    </div>
  );
}
