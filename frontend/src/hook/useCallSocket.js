import { useEffect, useCallback, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useSocket } from "./useSocket";
import { CALL_CONFIG } from "../config/environment";
import {
  setActiveCall,
  setOutgoingCall,
  setIncomingCall,
  setShowIncomingCallModal,
  setShowOutgoingCallModal,
  setShowCallWindow,
  setLocalStream,
  setRemoteStream,
  setCallStatus as setCallStatusAction,
  setRingingState,
  setMinimizedCall,
  setLastCallMeta,
  resetCallState,
  selectActiveCall,
  selectOutgoingCall,
  selectIncomingCall,
  selectShowIncomingCallModal,
  selectShowOutgoingCallModal,
  selectShowCallWindow,
  selectCallStatus,
  selectRingingType,
  selectIsCallMinimized,
  selectCallMinimizedFromRoute,
} from "../store/slice/callSlice";

export const useCallSocket = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();
  const { user } = useSelector((state) => state.auth);

  // Refs (must come first)
  const callTimeoutRef = useRef(null);
  const participantCheckIntervalRef = useRef(null);
  const connectingTimeoutRef = useRef(null);
  const incomingCallAudioRef = useRef(null);
  const outgoingCallAudioRef = useRef(null);
  const audioInitializedRef = useRef(false);

  // Redux state
  const activeCall = useSelector(selectActiveCall);
  const outgoingCall = useSelector(selectOutgoingCall);
  const incomingCall = useSelector(selectIncomingCall);
  const callStatus = useSelector(selectCallStatus);
  const ringingType = useSelector(selectRingingType);
  const isCallMinimized = useSelector(selectIsCallMinimized);
  const minimizedFromRoute = useSelector(selectCallMinimizedFromRoute);

  // Local state
  const [callPersistData, setCallPersistData] = useState(null);
  const [processedCallIds, setProcessedCallIds] = useState(new Set());
  const [lastEventTime, setLastEventTime] = useState({});
  const [hasShownIncomingToast, setHasShownIncomingToast] = useState(false);

  /** ✅ Ensure socket is connected before emit */
  const ensureSocketConnection = useCallback(async () => {
    if (!socket) throw new Error("Socket not available");
    if (socket.disconnected) {
      socket.connect();
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("Socket reconnection timeout")),
          4000
        );
        socket.once("connect", () => {
          clearTimeout(timeout);
          resolve();
        });
        socket.once("connect_error", (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    }
  }, [socket]);

  /** ✅ Timeout handling helpers */
  const startConnectingTimeout = useCallback(() => {
    clearTimeout(connectingTimeoutRef.current);
    connectingTimeoutRef.current = setTimeout(() => {
      console.warn("⚠️ Connecting timeout triggered — resetting call");
      endCall();
    }, 30000);
  }, []);

  const clearAllTimers = useCallback(() => {
    [callTimeoutRef, participantCheckIntervalRef, connectingTimeoutRef].forEach(
      (ref) => {
        if (ref.current) {
          clearTimeout(ref.current);
          clearInterval(ref.current);
          ref.current = null;
        }
      }
    );
  }, []);

  /** ✅ Ringtone helpers */
  const stopIncomingRingtone = useCallback(() => {
    const audio = incomingCallAudioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  const stopOutgoingRingtone = useCallback(() => {
    const audio = outgoingCallAudioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  const stopAllRingtones = useCallback(() => {
    stopIncomingRingtone();
    stopOutgoingRingtone();
  }, [stopIncomingRingtone, stopOutgoingRingtone]);

  const playAudioSafe = useCallback(async (audioRef) => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      await audio.play();
    } catch (error) {
      // Autoplay might be blocked until user interaction; ignore
    }
  }, []);

  const playIncomingRingtone = useCallback(() => {
    dispatch(setRingingState({ type: "incoming", isRinging: true }));
    playAudioSafe(incomingCallAudioRef);
  }, [dispatch, playAudioSafe]);

  const playOutgoingRingtone = useCallback(() => {
    dispatch(setRingingState({ type: "outgoing", isRinging: true }));
    playAudioSafe(outgoingCallAudioRef);
  }, [dispatch, playAudioSafe]);

  /** ✅ Save call data to localStorage */
  const saveCallData = useCallback((data) => {
    if (data) {
      localStorage.setItem("activeCallData", JSON.stringify(data));
      setCallPersistData(data);
    } else {
      localStorage.removeItem("activeCallData");
      setCallPersistData(null);
    }
  }, []);

  /** ✅ End call cleanly */
  const endCall = useCallback(() => {
    console.log('🛑 Ending call - cleaning up all resources');
    clearAllTimers();
    dispatch(resetCallState());
    dispatch(setCallStatusAction("idle"));
    dispatch(setRingingState({ type: null, isRinging: false }));
    dispatch(setMinimizedCall({ minimized: false }));
    dispatch(setLocalStream(null));
    dispatch(setRemoteStream(null));
    saveCallData(null);
    stopAllRingtones();
    setProcessedCallIds(new Set());
    setLastEventTime({});
    if (location.pathname.includes("/video-call")) navigate(-1);
  }, [clearAllTimers, dispatch, navigate, location.pathname, saveCallData, stopAllRingtones]);

  /** ✅ Prevent duplicate socket events */
  const isDuplicateEvent = useCallback(
    (type, callId) => {
      const key = `${type}_${callId}`;
      const now = Date.now();
      const timeSinceLastEvent = now - (lastEventTime[key] || 0);
      
      // Check for duplicates within 2 seconds or already processed
      if (timeSinceLastEvent < 2000 || processedCallIds.has(callId)) {
        console.warn(`⚠️ Duplicate ${type} event detected for callId: ${callId} (${timeSinceLastEvent}ms since last)`);
        return true;
      }
      
      setProcessedCallIds((prev) => new Set(prev).add(callId));
      setLastEventTime((prev) => ({ ...prev, [key]: now }));
      return false;
    },
    [lastEventTime, processedCallIds]
  );

  /** ✅ Socket event handlers */
  const handleIncomingCall = useCallback(
    (data) => {
      const callId = data.callId || data._id || `incoming_${Date.now()}`;
      if (isDuplicateEvent("incoming_call", callId)) return;

      console.log('📞 Incoming call received:', data);
      
      // Check if user is on chat page
      const currentPage = window.location.pathname;
      const isOnChatPage = currentPage.startsWith('/chat');
      
      dispatch(setIncomingCall(data));
      dispatch(setShowIncomingCallModal(true));
      dispatch(setCallStatusAction("incoming"));
      dispatch(setLastCallMeta({ type: "incoming", callId, from: data.fromUserName }));
      saveCallData({ callId, status: "incoming", caller: data.fromUserName });
      playIncomingRingtone();

      // Show notification based on current location
      if (!hasShownIncomingToast) {
        if (isOnChatPage) {
          toast.success(`Incoming video call from ${data.fromUserName}`, {
            duration: 5000,
            icon: '📞'
          });
        } else {
          toast(`📞 Incoming call from ${data.fromUserName}\\nYou can answer from any page!`, {
            duration: 8000,
            style: {
              background: '#4F46E5',
              color: '#fff',
              fontWeight: '500'
            }
          });
        }
        setHasShownIncomingToast(true);
      }
    },
    [dispatch, isDuplicateEvent, saveCallData, hasShownIncomingToast, playIncomingRingtone]
  );

  const handleCallStarted = useCallback(
    (data) => {
      const callId = data.call?._id || data.callId;
      if (isDuplicateEvent("call_started", callId)) return;

      dispatch(setOutgoingCall(data));
      dispatch(setShowOutgoingCallModal(true));
      dispatch(setCallStatusAction("connecting"));
      dispatch(setLastCallMeta({ type: "outgoing", callId }));
      saveCallData({ callId, status: "connecting" });
      startConnectingTimeout();
      playOutgoingRingtone();
    },
    [dispatch, isDuplicateEvent, saveCallData, startConnectingTimeout, playOutgoingRingtone]
  );

  const handleCallJoined = useCallback(
    (data) => {
      const callId = data.call?._id || data.callId;
      if (isDuplicateEvent("call_joined", callId)) return;

      dispatch(setActiveCall(data.call));
      dispatch(setCallStatusAction("connected"));
      dispatch(setShowIncomingCallModal(false));
      dispatch(setShowOutgoingCallModal(false));
      dispatch(setShowCallWindow(true));
      dispatch(setRingingState({ type: null, isRinging: false }));
      stopAllRingtones();
      saveCallData({ callId, status: "connected" });
      clearTimeout(connectingTimeoutRef.current);
      navigate("/video-call", { replace: true });
    },
    [dispatch, isDuplicateEvent, navigate, saveCallData, stopAllRingtones]
  );

  const handleCallEnded = useCallback(
    (data) => {
      const reason = data.reason || "ended";
      
      console.log('📞 Call ended event received:', reason);
      
      // Clear state immediately to prevent UI flicker
      stopAllRingtones();
      dispatch(resetCallState());
      dispatch(setCallStatusAction("idle"));
      dispatch(setRingingState({ type: null, isRinging: false }));
      dispatch(setLocalStream(null));
      dispatch(setRemoteStream(null));
      saveCallData(null);
      setProcessedCallIds(new Set());
      setLastEventTime({});
      
      // Show toast notification
      if (reason === "rejected") toast.error("Call rejected");
      else if (reason === "missed") toast("Call missed", { icon: "⏰" });
      else if (reason === "timeout") toast.error("Call timed out");
      else toast.success("Call ended");

      // Navigate away from video call page
      if (location.pathname.includes("/video-call")) {
        navigate("/chat");
      }
    },
    [dispatch, stopAllRingtones, saveCallData, location.pathname, navigate]
  );

  const handleCallAccepted = useCallback(
    (data) => {
      const callId = data.call?._id || data.callId;
      dispatch(setActiveCall(data.call));
      dispatch(setCallStatusAction("connected"));
      dispatch(setShowIncomingCallModal(false));
      dispatch(setShowOutgoingCallModal(false));
      dispatch(setShowCallWindow(true));
      dispatch(setRingingState({ type: null, isRinging: false }));
      stopAllRingtones();
      saveCallData({ callId, status: "connected" });
    },
    [dispatch, saveCallData, stopAllRingtones]
  );

  const handleCallRejected = useCallback(
    (data) => {
      const { rejectedByName } = data;
      toast.error(`${rejectedByName ? rejectedByName : "Participant"} rejected the call`);
      dispatch(setCallStatusAction("ended"));
      dispatch(setRingingState({ type: null, isRinging: false }));
      stopAllRingtones();
      endCall();
    },
    [dispatch, endCall, stopAllRingtones]
  );

  const handleCallCancelled = useCallback(
    (data) => {
      const { cancelledByName, message } = data;
      toast.error(message || `${cancelledByName ? cancelledByName : "Caller"} cancelled the call`);
      dispatch(setCallStatusAction("ended"));
      dispatch(setRingingState({ type: null, isRinging: false }));
      stopAllRingtones();
      endCall();
    },
    [dispatch, endCall, stopAllRingtones]
  );

  const handleSocketError = useCallback((err) => {
    console.error("Socket error:", err);
    toast.error(err?.message || "Call socket error");
  }, []);

  /** ✅ Socket listeners */
  useEffect(() => {
    if (!socket) return;
    socket.on("incoming_call", handleIncomingCall);
    socket.on("call_started", handleCallStarted);
    socket.on("call_joined", handleCallJoined);
    socket.on("call_ended", handleCallEnded);
    socket.on("call_accepted", handleCallAccepted);
    socket.on("call_rejected", handleCallRejected);
    socket.on("call_cancelled", handleCallCancelled);
    socket.on("error", handleSocketError);

    return () => {
      socket.off("incoming_call", handleIncomingCall);
      socket.off("call_started", handleCallStarted);
      socket.off("call_joined", handleCallJoined);
      socket.off("call_ended", handleCallEnded);
      socket.off("call_accepted", handleCallAccepted);
      socket.off("call_rejected", handleCallRejected);
      socket.off("call_cancelled", handleCallCancelled);
      socket.off("error", handleSocketError);
    };
  }, [
    socket,
    handleIncomingCall,
    handleCallStarted,
    handleCallJoined,
    handleCallEnded,
    handleCallAccepted,
    handleCallRejected,
    handleCallCancelled,
    handleSocketError,
  ]);

  /** ✅ Socket action methods */
  const startCallSocket = useCallback(
    async (chatId, type = "video") => {
      try {
        await ensureSocketConnection();
        socket.emit("start_call", { chatId, type });
        toast.success("Starting call...");
        startConnectingTimeout();
        dispatch(setCallStatusAction("connecting"));
        playOutgoingRingtone();
      } catch (err) {
        toast.error("Unable to start call");
      }
    },
    [socket, ensureSocketConnection, startConnectingTimeout, dispatch, playOutgoingRingtone]
  );

  const joinCallSocket = useCallback(
    async (callId) => {
      try {
        await ensureSocketConnection();
        socket.emit("join_call", { callId });
        toast.success("Joining call...");
        dispatch(setCallStatusAction("connecting"));
      } catch {
        toast.error("Unable to join call");
      }
    },
    [socket, ensureSocketConnection, dispatch]
  );

  const rejectCallSocket = useCallback(
    async (callId) => {
      try {
        if (!callId) {
          console.error('❌ No callId provided to reject');
          toast.error("Unable to reject call - no call ID");
          return;
        }
        
        console.log('🚫 Rejecting call:', callId);
        await ensureSocketConnection();
        socket.emit("reject_call", { callId });
        
        // Clean up immediately on client side
        dispatch(setIncomingCall(null));
        dispatch(setShowIncomingCallModal(false));
        dispatch(setCallStatusAction("ended"));
        dispatch(setRingingState({ type: null, isRinging: false }));
        stopAllRingtones();
        
        toast("Call rejected", { icon: "🚫" });
        
        // Clean up call state
        setTimeout(() => {
          endCall();
        }, 500);
      } catch (error) {
        console.error('❌ Error rejecting call:', error);
        toast.error("Unable to reject call");
      }
    },
    [socket, ensureSocketConnection, dispatch, endCall, stopAllRingtones]
  );

  const cancelCallSocket = useCallback(
    async (callId) => {
      try {
        if (!callId) {
          console.error('❌ No callId provided to cancel');
          toast.error("Unable to cancel call - no call ID");
          return;
        }
        
        console.log('🚫 Canceling outgoing call:', callId);
        await ensureSocketConnection();
        socket.emit("cancel_call", { callId });
        
        // Clean up immediately on client side
        dispatch(setOutgoingCall(null));
        dispatch(setShowOutgoingCallModal(false));
        dispatch(setCallStatusAction("ended"));
        dispatch(setRingingState({ type: null, isRinging: false }));
        stopAllRingtones();
        
        toast("Call cancelled", { icon: "🚫" });
        
        // Clean up call state
        setTimeout(() => {
          endCall();
        }, 500);
      } catch (error) {
        console.error('❌ Error canceling call:', error);
        toast.error("Unable to cancel call");
      }
    },
    [socket, ensureSocketConnection, dispatch, endCall, stopAllRingtones]
  );

  const endCallSocket = useCallback(
    async (callId) => {
      try {
        if (!callId) {
          console.error('❌ No callId provided to end');
          return;
        }
        
        console.log('📞 Ending call:', callId);
        await ensureSocketConnection();
        socket.emit("end_call", { callId });
        endCall();
      } catch (error) {
        console.error('❌ Error ending call:', error);
        toast.error("Failed to end call");
      }
    },
    [socket, ensureSocketConnection, endCall]
  );

  /** ✅ Restore call state from localStorage on mount */
  useEffect(() => {
    const restoreCallState = async () => {
      try {
        const savedCallData = localStorage.getItem('activeCallData');
        if (!savedCallData) return;

        const callData = JSON.parse(savedCallData);
        console.log('🔄 Restoring call state:', callData);

        // Only restore if call is in active state
        if (callData.status === 'connected' && callData.callId) {
          // Restore to Redux state
          dispatch(setActiveCall({ _id: callData.callId, ...callData }));
          dispatch(setCallStatusAction('connected'));
          dispatch(setShowCallWindow(true));
          
          // Rejoin the call room via socket
          if (socket && socket.connected && user) {
            console.log('🔌 Rejoining call room:', callData.callId);
            socket.emit('join-call', { callId: callData.callId, userId: user._id });
          }
        } else if (callData.status === 'incoming') {
          // Restore incoming call state
          dispatch(setIncomingCall(callData));
          dispatch(setShowIncomingCallModal(true));
          dispatch(setCallStatusAction('incoming'));
          playIncomingRingtone();
        } else {
          // Clear stale data
          localStorage.removeItem('activeCallData');
        }
      } catch (error) {
        console.error('❌ Error restoring call state:', error);
        localStorage.removeItem('activeCallData');
      }
    };

    // Restore call state when socket connects and user is available
    if (socket && socket.connected && user) {
      restoreCallState();
    }
  }, [socket, dispatch, user, playIncomingRingtone]);

  useEffect(() => clearAllTimers, [clearAllTimers]);

  useEffect(() => {
    if (!audioInitializedRef.current) {
      incomingCallAudioRef.current = new Audio("/sounds/incoming-call.mp3");
      incomingCallAudioRef.current.loop = true;
      outgoingCallAudioRef.current = new Audio("/sounds/outgoing-call.mp3");
      outgoingCallAudioRef.current.loop = true;
      audioInitializedRef.current = true;
    }

    return () => {
      stopAllRingtones();
    };
  }, [stopAllRingtones]);

  return {
    socket,
    callStatus,
    callPersistData,
    startCallSocket,
    joinCallSocket,
    rejectCallSocket,
    cancelCallSocket,
    endCallSocket,
    endCall,
  };
};
