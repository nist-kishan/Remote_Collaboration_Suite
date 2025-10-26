import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useCall } from "./useCallIntegration";
import { useSocket } from "./useSocket";

/**
 * Hook for managing seamless integration between chat and call components
 * Provides synchronized state management and smooth transitions
 */
export const useChatCallIntegration = (selectedChat) => {
  const navigate = useNavigate();
  const { socket } = useSocket();

  // Call state from useCall hook
  const {
    incomingCall,
    outgoingCall,
    activeCall,
    showIncomingCall,
    showOutgoingCall,
    showActiveCall,
    acceptCall,
    rejectCall,
    declineCall,
    cancelCall,
    endActiveCall,
    startCall,
    callHistory,
  } = useCall();

  // Enhanced call-chat integration state
  const [integrationState, setIntegrationState] = useState({
    isCallInProgress: false,
    currentCallChat: null,
    callStartTime: null,
    callDuration: 0,
    lastCallChat: null,
    callTransitionState: "idle", // 'idle', 'connecting', 'connected', 'ending'
    pendingCallAction: null,
  });

  // Update call duration every second when call is active
  useEffect(() => {
    let interval;
    if (integrationState.isCallInProgress && integrationState.callStartTime) {
      interval = setInterval(() => {
        setIntegrationState((prev) => ({
          ...prev,
          callDuration: Date.now() - prev.callStartTime.getTime(),
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [integrationState.isCallInProgress, integrationState.callStartTime]);

  // Sync call state with integration state
  useEffect(() => {
    if (showActiveCall && activeCall) {
      setIntegrationState((prev) => ({
        ...prev,
        isCallInProgress: true,
        currentCallChat: selectedChat,
        callStartTime: prev.callStartTime || new Date(),
        callTransitionState: "connected",
      }));
    } else if (!showActiveCall && integrationState.isCallInProgress) {
      // Call ended
      const duration = integrationState.callStartTime
        ? Date.now() - integrationState.callStartTime.getTime()
        : 0;

      setIntegrationState((prev) => ({
        ...prev,
        isCallInProgress: false,
        lastCallChat: prev.currentCallChat,
        currentCallChat: null,
        callStartTime: null,
        callDuration: duration,
        callTransitionState: "idle",
      }));
    }
  }, [
    showActiveCall,
    activeCall,
    selectedChat,
    integrationState.isCallInProgress,
  ]);

  // Enhanced video call initiation with chat context
  const initiateVideoCall = useCallback(
    async (chat) => {
      if (!chat) {
        return { success: false, error: "No chat selected" };
      }

      try {
        setIntegrationState((prev) => ({
          ...prev,
          callTransitionState: "connecting",
          pendingCallAction: "initiate",
        }));
        await startCall(chat._id);

        // Update integration state
        setIntegrationState((prev) => ({
          ...prev,
          currentCallChat: chat,
          callTransitionState: "connecting",
          pendingCallAction: null,
        }));

        const chatName =
          chat.name || chat.participants?.[0]?.user?.name || "Unknown Chat";
        toast.success(`Video call initiated with ${chatName}`);
        return { success: true };
      } catch (error) {
        toast.error("Error starting video call");
        setIntegrationState((prev) => ({
          ...prev,
          callTransitionState: "idle",
          pendingCallAction: null,
        }));
        return { success: false, error: error.message };
      }
    },
    [startCall]
  );

  // Enhanced call acceptance with chat integration
  const handleCallAccept = useCallback(async () => {
    try {
      setIntegrationState((prev) => ({
        ...prev,
        callTransitionState: "connecting",
      }));

      await acceptCall();

      // Update chat context if available
      if (selectedChat && incomingCall) {
        // Could add call status message to chat
        toast.success("Call accepted");
      }

      setIntegrationState((prev) => ({
        ...prev,
        callTransitionState: "connected",
      }));
    } catch (error) {
      toast.error("Error accepting call");
      setIntegrationState((prev) => ({
        ...prev,
        callTransitionState: "idle",
      }));
    }
  }, [acceptCall, selectedChat, incomingCall]);

  // Enhanced call rejection with chat integration
  const handleCallReject = useCallback(async () => {
    try {
      setIntegrationState((prev) => ({
        ...prev,
        callTransitionState: "ending",
      }));

      await rejectCall();

      // Could add missed call notification to chat
      if (selectedChat && incomingCall) {
        toast.info("Call declined");
      }

      setIntegrationState((prev) => ({
        ...prev,
        callTransitionState: "idle",
      }));
    } catch (error) {
      toast.error("Error rejecting call");
      setIntegrationState((prev) => ({
        ...prev,
        callTransitionState: "idle",
      }));
    }
  }, [rejectCall, selectedChat, incomingCall]);

  // Enhanced call ending with chat integration
  const handleCallEnd = useCallback(async () => {
    try {
      setIntegrationState((prev) => ({
        ...prev,
        callTransitionState: "ending",
      }));

      await endActiveCall();

      // Could add call ended notification to chat
      if (integrationState.currentCallChat) {
        const duration = Math.floor(integrationState.callDuration / 1000);
        toast.success(`Call ended (${duration}s)`);
      }

      setIntegrationState((prev) => ({
        ...prev,
        callTransitionState: "idle",
      }));
    } catch (error) {
      toast.error("Error ending call");
      setIntegrationState((prev) => ({
        ...prev,
        callTransitionState: "idle",
      }));
    }
  }, [
    endActiveCall,
    integrationState.currentCallChat,
    integrationState.callDuration,
  ]);

  // Get call status for UI display
  const getCallStatus = useCallback(() => {
    if (integrationState.isCallInProgress) {
      return {
        status: "active",
        chatName: integrationState.currentCallChat?.name || "Unknown",
        duration: Math.floor(integrationState.callDuration / 1000),
        transitionState: integrationState.callTransitionState,
      };
    } else if (integrationState.callTransitionState === "connecting") {
      return {
        status: "connecting",
        chatName: selectedChat?.name || "Unknown",
        transitionState: "connecting",
      };
    } else if (showIncomingCall) {
      return {
        status: "incoming",
        chatName: incomingCall?.chatName || "Unknown",
        transitionState: "incoming",
      };
    } else if (showOutgoingCall) {
      return {
        status: "outgoing",
        chatName: outgoingCall?.chatName || "Unknown",
        transitionState: "outgoing",
      };
    }

    return {
      status: "idle",
      transitionState: "idle",
    };
  }, [
    integrationState,
    selectedChat,
    showIncomingCall,
    showOutgoingCall,
    incomingCall,
    outgoingCall,
  ]);

  // Check if video call is available for current chat
  const isVideoCallAvailable = useCallback(
    (chat) => {
      if (!chat) return false;
      if (integrationState.isCallInProgress) return false;
      if (integrationState.callTransitionState !== "idle") return false;

      // Check if chat has participants for video call
      const participants = chat.participants || [];
      return participants.length > 0;
    },
    [integrationState]
  );

  return {
    // Call state
    incomingCall,
    outgoingCall,
    activeCall,
    showIncomingCall,
    showOutgoingCall,
    showActiveCall,

    // Integration state
    integrationState,
    callStatus: getCallStatus(),

    // Actions
    initiateVideoCall,
    handleCallAccept,
    handleCallReject,
    handleCallEnd,
    cancelCall,
    declineCall,

    // Utilities
    isVideoCallAvailable,

    // Call history
    callHistory,
  };
};
