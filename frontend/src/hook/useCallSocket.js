import { useEffect, useCallback, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useSocket } from './useSocket';
import {
  setActiveCall,
  setOutgoingCall,
  setIncomingCall,
  setShowIncomingCallModal,
  setShowOutgoingCallModal,
  setShowCallWindow,
  addError,
  clearError,
  clearAllErrors,
  resetCallState,
  selectActiveCall,
  selectOutgoingCall,
  selectIncomingCall,
  selectShowIncomingCallModal,
  selectShowOutgoingCallModal,
  selectShowCallWindow
} from '../store/slice/callSlice';

/**
 * Hook for managing all call-related socket events and communication
 * Separates socket logic from WebRTC and call management logic
 */
export const useCallSocket = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();
  const { user } = useSelector((state) => state.auth);

  // Redux state selectors
  const activeCall = useSelector(selectActiveCall);
  const outgoingCall = useSelector(selectOutgoingCall);
  const incomingCall = useSelector(selectIncomingCall);
  const showIncomingCallModal = useSelector(selectShowIncomingCallModal);
  const showOutgoingCallModal = useSelector(selectShowOutgoingCallModal);
  const showCallWindow = useSelector(selectShowCallWindow);

  // Local state for call management
  const [callStatus, setCallStatus] = useState('idle');
  const [callPersistData, setCallPersistData] = useState(null);
  const [hasShownIncomingToast, setHasShownIncomingToast] = useState(false);
  const [hasShownOutgoingToast, setHasShownOutgoingToast] = useState(false);
  
  // State to prevent duplicate event handling
  const [processedCallIds, setProcessedCallIds] = useState(new Set());
  const [lastEventTime, setLastEventTime] = useState({});
  
  // Helper function to ensure socket connection
  const ensureSocketConnection = async () => {
    if (!socket) {
      throw new Error('Socket not available');
    }

    if (socket.disconnected) {
      console.warn('⚠️ Socket is disconnected, attempting to reconnect...');
      
      // Attempt to reconnect
      socket.connect();
      
      // Wait for reconnection
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Socket reconnection timeout'));
        }, 5000);
        
        const onConnect = () => {
          clearTimeout(timeout);
          socket.off('connect', onConnect);
          socket.off('connect_error', onError);
          resolve();
        };
        
        const onError = (error) => {
          clearTimeout(timeout);
          socket.off('connect', onConnect);
          socket.off('connect_error', onError);
          reject(error);
        };
        
        socket.on('connect', onConnect);
        socket.on('connect_error', onError);
      });
      
      console.log('✅ Socket reconnected successfully');
    }
  };

  // Helper function to start connecting timeout
  const startConnectingTimeout = useCallback(() => {
    // Clear any existing timeout
    if (connectingTimeoutRef.current) {
      clearTimeout(connectingTimeoutRef.current);
    }
    
    // Set a 30-second timeout for connecting state
    connectingTimeoutRef.current = setTimeout(() => {
      console.warn('⚠️ Call stuck in connecting state, cleaning up...');
      
      // Reset call status
      setCallStatus('idle');
      
      // Clear localStorage
      localStorage.removeItem('activeCallData');
      
      // Clear Redux state
      dispatch(setActiveCall(null));
      dispatch(setIncomingCall(null));
      dispatch(setOutgoingCall(null));
      dispatch(setShowIncomingCallModal(false));
      dispatch(setShowOutgoingCallModal(false));
      dispatch(setShowCallWindow(false));
      
      // Clear processed call IDs
      setProcessedCallIds(new Set());
      setLastEventTime({});
      
      console.log('✅ Call state cleaned up due to timeout');
    }, 30000); // 30 seconds timeout
  }, [dispatch]);

  // Helper function to clear connecting timeout
  const clearConnectingTimeout = useCallback(() => {
    if (connectingTimeoutRef.current) {
      clearTimeout(connectingTimeoutRef.current);
      connectingTimeoutRef.current = null;
    }
  }, []);

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
    if (participantCheckIntervalRef.current) {
      clearInterval(participantCheckIntervalRef.current);
      participantCheckIntervalRef.current = null;
    }
    if (connectingTimeoutRef.current) {
      clearTimeout(connectingTimeoutRef.current);
      connectingTimeoutRef.current = null;
    }
  }, []);

  // Save call data to localStorage
  const saveCallData = (callData) => {
    if (callData) {
      localStorage.setItem('activeCallData', JSON.stringify(callData));
      setCallPersistData(callData);
    } else {
      localStorage.removeItem('activeCallData');
      setCallPersistData(null);
    }
  };

  // Helper functions
  const stopCallSounds = () => {
    try {
      if (incomingCallAudioRef.current) {
        // Web Audio API doesn't have pause method, just stop the current sound
        console.log('🔇 Stopping incoming call audio');
      }
    } catch (error) {
      console.log('🔇 Error stopping incoming call audio:', error.message);
    }
    
    try {
      if (outgoingCallAudioRef.current) {
        // Web Audio API doesn't have pause method, just stop the current sound
        console.log('🔇 Stopping outgoing call audio');
      }
    } catch (error) {
      console.log('🔇 Error stopping outgoing call audio:', error.message);
    }
  };

  // Function to end call and clear all state
  const endCall = useCallback(() => {
    console.log('🧹 Ending call and clearing all state...');
    
    // Clear all timers
    clearAllTimers();
    
    // Reset call status
    setCallStatus('idle');
    
    // Clear localStorage
    localStorage.removeItem('activeCallData');
    
    // Clear Redux state
    dispatch(setActiveCall(null));
    dispatch(setIncomingCall(null));
    dispatch(setOutgoingCall(null));
    dispatch(setShowIncomingCallModal(false));
    dispatch(setShowOutgoingCallModal(false));
    dispatch(setShowCallWindow(false));
    
    // Clear processed call IDs
    setProcessedCallIds(new Set());
    setLastEventTime({});
    
    // Reset toast flags
    setHasShownIncomingToast(false);
    setHasShownOutgoingToast(false);
    
    // Clear persisted call data
    saveCallData(null);
    
    // Stop call sounds
    stopCallSounds();
    
    // Navigate if on call page
    if (location.pathname.includes('/call/')) {
      navigate(-1);
    }
    
    console.log('✅ Call state completely cleared');
  }, [dispatch, clearAllTimers, saveCallData, stopCallSounds, location.pathname, navigate]);

  // Auto-cancel timeout refs
  const callTimeoutRef = useRef(null);
  const participantCheckIntervalRef = useRef(null);
  const connectingTimeoutRef = useRef(null);

  // Audio refs for call sounds
  const incomingCallAudioRef = useRef(null);
  const outgoingCallAudioRef = useRef(null);
  const audioInitializedRef = useRef(false);

  // Initialize audio elements with Web Audio API fallback
  useEffect(() => {
    // Prevent multiple initializations
    if (audioInitializedRef.current) {
      return;
    }
    
    try {
      // Create simple beep sound using Web Audio API
      const createBeepSound = () => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
        
        return audioContext;
      };

      // Store the beep function
      incomingCallAudioRef.current = { play: createBeepSound };
      outgoingCallAudioRef.current = { play: createBeepSound };
      audioInitializedRef.current = true;

      console.log('🔊 Audio elements initialized with Web Audio API');
    } catch (error) {
      console.log('🔇 Audio initialization failed:', error.message);
      // Fallback to silent audio objects
      incomingCallAudioRef.current = { play: () => console.log('🔇 Audio not available') };
      outgoingCallAudioRef.current = { play: () => console.log('🔇 Audio not available') };
      audioInitializedRef.current = true;
    }

    return () => {
      try {
        incomingCallAudioRef.current = null;
        outgoingCallAudioRef.current = null;
        audioInitializedRef.current = false;
      } catch (error) {
        console.log('🔇 Error cleaning up audio:', error.message);
      }
    };
  }, []);

  // Load call data from localStorage on mount
  useEffect(() => {
    const savedCallData = localStorage.getItem('activeCallData');
    if (savedCallData) {
      try {
        const parsedData = JSON.parse(savedCallData);
        setCallPersistData(parsedData);
        console.log('Restored call data from localStorage:', parsedData);
      } catch (error) {
        console.error('Error parsing saved call data:', error);
        localStorage.removeItem('activeCallData');
      }
    }
  }, []);

  // Auto-cancel call after timeout
  const startCallTimeout = useCallback((callId, timeoutMs = 60000) => {
    // Clear any existing timeout
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
    }

    console.log(`⏰ Starting call timeout: ${timeoutMs}ms for call ${callId}`);
    
    callTimeoutRef.current = setTimeout(() => {
      console.log('⏰ Call timeout reached - auto-cancelling call');
      
      // Check if call is still active and not answered
      const currentCallData = JSON.parse(localStorage.getItem('activeCallData') || 'null');
      if (currentCallData && (currentCallData.status === 'connecting' || currentCallData.status === 'incoming')) {
        console.log('📞 Auto-cancelling unanswered call');
        
        // Emit call ended event
        if (socket) {
          socket.emit('end_call', { 
            callId: currentCallData.callId,
            reason: 'timeout',
            message: 'Call not answered within 1 minute'
          });
        }
        
        // End the call locally
        endCall();
        
        toast.error('Call cancelled - not answered within 1 minute');
      }
    }, timeoutMs);
  }, [socket]);

  // Check participant count and auto-cancel if less than 2
  const startParticipantCheck = useCallback((callId) => {
    // Clear any existing interval
    if (participantCheckIntervalRef.current) {
      clearInterval(participantCheckIntervalRef.current);
    }

    console.log('👥 Starting participant count check for call:', callId);
    
    participantCheckIntervalRef.current = setInterval(() => {
      const currentCallData = JSON.parse(localStorage.getItem('activeCallData') || 'null');
      
      if (currentCallData && currentCallData.status === 'connected') {
        // Count active participants (excluding ended calls)
        const activeParticipants = currentCallData.participants?.filter(p => 
          p.status !== 'ended' && p.status !== 'left'
        ) || [];
        
        console.log(`👥 Active participants: ${activeParticipants.length + 1}`); // +1 for caller
        
        if (activeParticipants.length + 1 < 2) {
          console.log('📞 Auto-cancelling call - less than 2 participants');
          
          // Emit call ended event
          if (socket) {
            socket.emit('end_call', { 
              callId: currentCallData.callId,
              reason: 'insufficient_participants',
              message: 'Call ended - insufficient participants'
            });
          }
          
          // End the call locally
          endCall();
          
          toast.error('Call ended - insufficient participants');
          
          // Clear the interval
          if (participantCheckIntervalRef.current) {
            clearInterval(participantCheckIntervalRef.current);
            participantCheckIntervalRef.current = null;
          }
        }
      }
    }, 5000); // Check every 5 seconds
  }, [socket]);

  // Helper function to check for duplicate events
  const isDuplicateEvent = useCallback((eventType, callId, data) => {
    const eventKey = `${eventType}_${callId}`;
    const now = Date.now();
    const lastTime = lastEventTime[eventKey] || 0;
    
    // If same event happened within 2 seconds, consider it duplicate
    if (now - lastTime < 2000) {
      console.log(`🚫 Duplicate ${eventType} event ignored for call ${callId}`);
      return true;
    }
    
    // Check if this call ID is already being processed
    if (processedCallIds.has(callId)) {
      console.log(`🚫 Call ${callId} already being processed, ignoring duplicate ${eventType}`);
      return true;
    }
    
    // Mark this call ID as being processed
    setProcessedCallIds(prev => new Set([...prev, callId]));
    
    // Update last event time
    setLastEventTime(prev => ({
      ...prev,
      [eventKey]: now
    }));
    
    return false;
  }, [lastEventTime, processedCallIds]);

  // Socket event handlers
  const handleIncomingCall = useCallback((data) => {
    console.log('📞 Incoming call data:', data);
    console.log('🔍 Available fields:', Object.keys(data));
    
    // Extract call ID for duplicate checking
    const callId = data.callId || data._id || `incoming_${Date.now()}`;
    
    // Check for duplicate event
    if (isDuplicateEvent('incoming_call', callId, data)) {
      return;
    }
    
    dispatch(setIncomingCall(data));
    dispatch(setShowIncomingCallModal(true));
    setCallStatus('incoming');
    
    // Extract receiver ID from various possible fields
    const receiverId = data.callerId || data.senderId || data.fromUserId || data.userId || data.chatId || 'unknown';
    console.log('🎯 Extracted receiver ID:', receiverId);
    
    // Save incoming call data for persistence
    const callData = {
      callId: data.callId || `incoming_${Date.now()}`,
      receiverId: receiverId,
      type: 'video',
      startTime: new Date().toISOString(),
      status: 'incoming',
      caller: data.caller || data.user || { name: data.fromUserName }
    };
    saveCallData(callData);
    
    if (incomingCallAudioRef.current) {
      // Try to play audio using Web Audio API
      try {
        incomingCallAudioRef.current.play();
        console.log('🔊 Incoming call beep played');
      } catch (error) {
        console.log('🔇 Incoming call audio play failed:', error.message);
      }
    }
    
    // Only show toast if we haven't shown it yet for this call
    if (!hasShownIncomingToast) {
      toast.success(`Incoming video call from ${data.fromUserName}`);
      setHasShownIncomingToast(true);
    }
    
    // Navigate to receiver page for incoming calls
    if (!location.pathname.includes('/video-call/')) {
      navigate(`/video-call/receiver/${receiverId}`, { replace: true });
    }
    
    window.acceptCall = async () => {
      try {
        await acceptCall();
      } catch (error) {
        console.error('Error accepting call:', error);
      }
    };
  }, [dispatch, navigate, location.pathname]);

  const handleCallStarted = useCallback((data) => {
    console.log('📞 Call started data:', data);
    console.log('🔍 Available fields:', Object.keys(data));
    
    // Extract call ID for duplicate checking
    const callId = data.call?._id || data.callId || `started_${Date.now()}`;
    
    // Check for duplicate event
    if (isDuplicateEvent('call_started', callId, data)) {
      return;
    }
    
    dispatch(setOutgoingCall(data));
    dispatch(setShowOutgoingCallModal(true));
    setCallStatus('connecting');
    
    // Update call data with real call ID from server
    if (data.call && data.call._id) {
      // Extract receiver ID from participants or chat
      let receiverId = data.call.receiverId || data.call.chatId;
      
      // If no direct receiver ID, get it from participants
      if (!receiverId && data.call.participants) {
        const otherParticipant = data.call.participants.find(p => 
          p.user._id.toString() !== user._id.toString()
        );
        receiverId = otherParticipant?.user._id;
      }
      
      console.log('🎯 Call started - receiver ID:', receiverId);
      console.log('🔍 Call participants:', data.call.participants);
      
      const callData = {
        callId: data.call._id,
        receiverId: receiverId,
        type: 'video',
        startTime: new Date().toISOString(),
        status: 'connecting',
        caller: data.call.caller || data.user,
        participants: data.call.participants
      };
      saveCallData(callData);
      console.log('✅ Updated call data with real call ID:', data.call._id);
      
      // Start auto-cancel timeout (1 minute)
      startCallTimeout(data.call._id, 60000);
    }
    
    if (outgoingCallAudioRef.current) {
      // Try to play audio using Web Audio API
      try {
        outgoingCallAudioRef.current.play();
        console.log('🔊 Outgoing call beep played');
      } catch (error) {
        console.log('🔇 Outgoing call audio play failed:', error.message);
      }
    }
  }, [dispatch]);

  const handleCallJoined = useCallback((data) => {
    console.log('📞 handleCallJoined called with data:', data);
    
    // Extract call ID for duplicate checking
    const callId = data.call?._id || data.callId || `joined_${Date.now()}`;
    console.log('🆔 Extracted callId for duplicate check:', callId);
    
    // Check for duplicate event
    if (isDuplicateEvent('call_joined', callId, data)) {
      console.log('🚫 Duplicate call_joined event ignored');
      return;
    }
    
    console.log('✅ Processing call_joined event...');
    dispatch(setActiveCall(data.call));
    console.log('🔄 Setting call status to connected...');
    setCallStatus('connected');
    
    // Clear connecting timeout since call is now connected
    console.log('⏰ Clearing connecting timeout...');
    clearConnectingTimeout();
    
    console.log('🎭 Updating UI state...');
    dispatch(setShowIncomingCallModal(false));
    dispatch(setShowOutgoingCallModal(false));
    dispatch(setShowCallWindow(true));
    
    console.log('🔇 Stopping call sounds...');
    stopCallSounds();
    
    // Update call data with connected status
    if (data.call && data.call._id) {
      const callData = {
        callId: data.call._id,
        receiverId: data.call.receiverId || data.call.chatId,
        type: 'video',
        startTime: new Date().toISOString(),
        status: 'connected',
        caller: data.call.caller || data.user,
        participants: data.call.participants
      };
      saveCallData(callData);
      console.log('✅ Updated call status to connected');
      
      // Clear the timeout since call was answered
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
        console.log('⏰ Call timeout cleared - call was answered');
      }
      
      // Start participant count checking
      startParticipantCheck(data.call._id);
    }
    
    // Navigate to caller page for outgoing calls
    if (!location.pathname.includes('/video-call/')) {
      const receiverId = data.call.receiverId || data.call.chatId;
      console.log('🎯 Call joined - navigating to caller page with receiver ID:', receiverId);
      navigate(`/video-call/caller/${receiverId}`, { replace: true });
    }
  }, [dispatch, navigate, location.pathname, saveCallData, startParticipantCheck]);

  const handleCallEnded = useCallback((data) => {
    console.log('📞 Call ended data:', data);
    
    // Clear duplicate tracking for this call
    const callId = data.callId;
    if (callId) {
      setProcessedCallIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(callId);
        return newSet;
      });
    }
    
    endCall();
    
    // Show appropriate message based on reason
    if (data.reason === 'rejected') {
      toast.error(`Call was rejected by ${data.rejectedByName || 'the receiver'}`);
    } else if (data.reason === 'insufficient_participants') {
      toast.error('Call ended - insufficient participants');
    } else {
      toast.success('Call ended');
    }
    
    if (location.pathname.includes('/video-call/')) {
      navigate('/video-call/ended', { 
        state: { 
          message: data.reason === 'rejected' ? 'Call rejected' : 'Call ended',
          caller: data?.caller || data?.user,
          reason: data.reason,
          rejectedBy: data.rejectedByName
        } 
      });
    }
  }, [navigate, location.pathname, endCall]);

  const handleCallRejected = useCallback((data) => {
    console.log('📞 Call rejected data:', data);
    
    // Clear duplicate tracking for this call
    const callId = data.callId;
    if (callId) {
      setProcessedCallIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(callId);
        return newSet;
      });
    }
    
    // Note: We don't call endCall() here because handleCallEnded will also be called
    // and will handle the cleanup. This prevents duplicate handling.
    
    // Just show the rejection toast - the call_ended event will handle the rest
    toast.error(`Call was rejected by ${data.rejectedByName || 'the receiver'}`);
  }, []);

  const handleSDPOffer = useCallback(async (data, createAnswer) => {
    try {
      const answer = await createAnswer(data.offer);
      
      socket.emit('sdp_answer', {
        callId: data.callId,
        answer: answer
      });
    } catch (error) {
      console.error('Error handling SDP offer:', error);
    }
  }, [socket]);

  const handleSDPAnswer = useCallback(async (data, setRemoteDescription) => {
    try {
      await setRemoteDescription(data.answer);
    } catch (error) {
      console.error('Error handling SDP answer:', error);
    }
  }, []);

  const handleICECandidate = useCallback(async (data, addIceCandidate) => {
    try {
      if (data.candidate) {
        await addIceCandidate(data.candidate);
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }, []);

  // Socket event listeners setup
  useEffect(() => {
    if (!socket) return;

    window.currentSocket = socket;

    // Register event listeners
    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_started', handleCallStarted);
    socket.on('call_joined', handleCallJoined);
    socket.on('call_ended', handleCallEnded);
    socket.on('call_rejected', handleCallRejected);

    return () => {
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_started', handleCallStarted);
      socket.off('call_joined', handleCallJoined);
      socket.off('call_ended', handleCallEnded);
      socket.off('call_rejected', handleCallRejected);
      
      delete window.acceptCall;
    };
  }, [socket, handleIncomingCall, handleCallStarted, handleCallJoined, handleCallEnded, handleCallRejected]);

  // WebRTC socket event listeners (to be called from useCall)
  const setupWebRTCListeners = useCallback((createAnswer, setRemoteDescription, addIceCandidate) => {
    if (!socket) return () => {};

    const handleSDPOfferWrapper = (data) => handleSDPOffer(data, createAnswer);
    const handleSDPAnswerWrapper = (data) => handleSDPAnswer(data, setRemoteDescription);
    const handleICECandidateWrapper = (data) => handleICECandidate(data, addIceCandidate);

    socket.on('sdp_offer', handleSDPOfferWrapper);
    socket.on('sdp_answer', handleSDPAnswerWrapper);
    socket.on('ice_candidate', handleICECandidateWrapper);

    return () => {
      socket.off('sdp_offer', handleSDPOfferWrapper);
      socket.off('sdp_answer', handleSDPAnswerWrapper);
      socket.off('ice_candidate', handleICECandidateWrapper);
    };
  }, [socket, handleSDPOffer, handleSDPAnswer, handleICECandidate]);

  // Socket actions
  const startCallSocket = useCallback(async (chatId, type = 'one-to-one') => {
    // Ensure socket connection
    await ensureSocketConnection();

    console.log('📡 Emitting start_call event...');
    console.log('🔍 Socket connected:', socket.connected);
    console.log('🔍 Socket ID:', socket.id);
    
    socket.emit('start_call', {
      chatId,
      type
    });

    setCallStatus('connecting');
    console.log('✅ Call status set to connecting');
    
    // Start connecting timeout
    startConnectingTimeout();
  }, [socket]);

  const joinCallSocket = useCallback(async (callId) => {
    console.log('📡 joinCallSocket called with callId:', callId);
    
    // Ensure socket connection
    console.log('🔌 Ensuring socket connection...');
    await ensureSocketConnection();

    console.log('📤 Emitting join_call event with callId:', callId);
    socket.emit('join_call', { 
      callId 
    });

    console.log('🔄 Setting call status to connecting...');
    setCallStatus('connecting');
    
    // Start connecting timeout
    console.log('⏰ Starting connecting timeout...');
    startConnectingTimeout();
    
    console.log('✅ joinCallSocket completed');
  }, [socket]);

  const rejectCallSocket = useCallback(async (callId) => {
    // Ensure socket connection
    await ensureSocketConnection();

    socket.emit('reject_call', { 
      callId 
    });
    
    dispatch(setShowIncomingCallModal(false));
    dispatch(setShowOutgoingCallModal(false));
    dispatch(setShowCallWindow(false));
    dispatch(setIncomingCall(null));
    dispatch(setOutgoingCall(null));
    dispatch(setActiveCall(null));
    
    endCall();
  }, [socket, dispatch]);

  const endCallSocket = useCallback(async (callId) => {
    // Ensure socket connection
    await ensureSocketConnection();

    socket.emit('end_call', { 
      callId 
    });
    
    endCall();
  }, [socket, endCall]);

  const sendSDPOffer = useCallback(async (callId, offer) => {
    // Ensure socket connection
    await ensureSocketConnection();

    socket.emit('sdp_offer', {
      callId: callId,
      offer: offer
    });
  }, [socket]);

  const sendSDPAnswer = useCallback(async (callId, answer) => {
    // Ensure socket connection
    await ensureSocketConnection();

    socket.emit('sdp_answer', {
      callId: callId,
      answer: answer
    });
  }, [socket]);

  const sendICECandidate = useCallback(async (candidate) => {
    // Ensure socket connection
    await ensureSocketConnection();

    socket.emit('ice_candidate', {
      candidate: candidate
    });
  }, [socket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  return {
    // State
    socket,
    callStatus,
    callPersistData,
    
    // Socket actions
    startCallSocket,
    joinCallSocket,
    rejectCallSocket,
    endCallSocket,
    sendSDPOffer,
    sendSDPAnswer,
    sendICECandidate,
    
    // WebRTC setup
    setupWebRTCListeners,
    
    // Utilities
    saveCallData,
    stopCallSounds,
    endCall,
    
    // Auto-cancel functions
    startCallTimeout,
    startParticipantCheck,
    clearAllTimers
  };
};
