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
  
  // Auto-cancel timeout refs
  const callTimeoutRef = useRef(null);
  const participantCheckIntervalRef = useRef(null);

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
  }, []);

  const endCall = () => {
    dispatch(setIncomingCall(null));
    dispatch(setOutgoingCall(null));
    dispatch(setActiveCall(null));
    setCallStatus('idle');
    setHasShownIncomingToast(false); // Reset toast flag
    dispatch(setShowIncomingCallModal(false));
    dispatch(setShowOutgoingCallModal(false));
    dispatch(setShowCallWindow(false));
    
    // Clear persisted call data
    saveCallData(null);
    
    // Clear all timers
    clearAllTimers();
    
    stopCallSounds();
    
    if (location.pathname.includes('/call/')) {
      navigate(-1);
    }
  };

  // Socket event handlers
  const handleIncomingCall = useCallback((data) => {
    console.log('📞 Incoming call data:', data);
    console.log('🔍 Available fields:', Object.keys(data));
    
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
    dispatch(setActiveCall(data.call));
    setCallStatus('connected');
    dispatch(setShowIncomingCallModal(false));
    dispatch(setShowOutgoingCallModal(false));
    dispatch(setShowCallWindow(true));
    
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
    endCall();
    toast.success('Call ended');
    
    if (location.pathname.includes('/video-call/')) {
      navigate('/video-call/ended', { 
        state: { 
          message: 'Call ended',
          caller: data?.caller || data?.user 
        } 
      });
    }
  }, [navigate, location.pathname]);

  const handleCallRejected = useCallback((data) => {
    endCall();
    toast.error('Call was rejected');
    
    if (location.pathname.includes('/video-call/')) {
      navigate('/video-call/ended', { 
        state: { 
          message: 'Call rejected',
          caller: data?.caller || data?.user 
        } 
      });
    }
  }, [navigate, location.pathname]);

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
    if (!socket) {
      console.error('❌ Socket not connected');
      throw new Error('Socket not connected');
    }

    // Check socket connection status
    if (socket.disconnected) {
      console.error('❌ Socket is disconnected');
      throw new Error('Socket is disconnected');
    }

    console.log('📡 Emitting start_call event...');
    console.log('🔍 Socket connected:', socket.connected);
    console.log('🔍 Socket ID:', socket.id);
    
    socket.emit('start_call', {
      chatId,
      type
    });

    setCallStatus('connecting');
    console.log('✅ Call status set to connecting');
  }, [socket]);

  const joinCallSocket = useCallback(async (callId) => {
    if (!socket) {
      throw new Error('Socket not connected');
    }

    socket.emit('join_call', { 
      callId 
    });

    setCallStatus('connecting');
  }, [socket]);

  const rejectCallSocket = useCallback(async (callId) => {
    if (!socket) {
      throw new Error('Socket not connected');
    }

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
    if (!socket) {
      throw new Error('Socket not connected');
    }

    socket.emit('end_call', { 
      callId 
    });
    
    endCall();
  }, [socket]);

  const sendSDPOffer = useCallback(async (callId, offer) => {
    if (!socket) {
      throw new Error('Socket not connected');
    }

    socket.emit('sdp_offer', {
      callId: callId,
      offer: offer
    });
  }, [socket]);

  const sendSDPAnswer = useCallback(async (callId, answer) => {
    if (!socket) {
      throw new Error('Socket not connected');
    }

    socket.emit('sdp_answer', {
      callId: callId,
      answer: answer
    });
  }, [socket]);

  const sendICECandidate = useCallback(async (candidate) => {
    if (!socket) {
      throw new Error('Socket not connected');
    }

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
