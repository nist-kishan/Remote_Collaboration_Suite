import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useSocket } from './useSocket';
import { useWebRTC } from './useWebRTC';
import { toast } from 'react-hot-toast';

export const useCallManager = () => {
  const { user } = useSelector((state) => state.auth);
  const { socket } = useSocket();
  const {
    releaseAllTracks,
    forceReleaseDevices,
    initializeWebRTC,
    createOffer,
    createAnswer,
    setRemoteDescription,
    addIceCandidate,
    isWebRTCReady
  } = useWebRTC();

  // Call states
  const [incomingCall, setIncomingCall] = useState(null);
  const [outgoingCall, setOutgoingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [callStatus, setCallStatus] = useState('idle');
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  const [showOutgoingCall, setShowOutgoingCall] = useState(false);
  const [showActiveCall, setShowActiveCall] = useState(false);
  const [isNegotiating, setIsNegotiating] = useState(false);

  // Audio refs for call sounds
  const incomingCallAudioRef = useRef(null);
  const outgoingCallAudioRef = useRef(null);

  // Initialize audio elements and load call data from localStorage
  useEffect(() => {
    incomingCallAudioRef.current = new Audio('/sounds/incoming-call.mp3');
    outgoingCallAudioRef.current = new Audio('/sounds/outgoing-call.mp3');
    
    // Set audio properties
    [incomingCallAudioRef.current, outgoingCallAudioRef.current].forEach(audio => {
      audio.loop = true;
      audio.volume = 0.5;
    });

    // Load call data from localStorage if available
    const savedIncomingCall = localStorage.getItem('currentIncomingCall');
    const savedOutgoingCall = localStorage.getItem('currentOutgoingCall');
    const savedActiveCall = localStorage.getItem('currentActiveCall');

    if (savedIncomingCall) {
      try {
        const callData = JSON.parse(savedIncomingCall);
        console.log('Loading incoming call from localStorage:', callData);
        setIncomingCall(callData);
        setShowIncomingCall(true);
        setCallStatus('ringing');
      } catch (error) {
        console.error('Error parsing saved incoming call:', error);
        localStorage.removeItem('currentIncomingCall');
      }
    }

    if (savedOutgoingCall) {
      try {
        const callData = JSON.parse(savedOutgoingCall);
        console.log('Loading outgoing call from localStorage:', callData);
        setOutgoingCall(callData);
        setShowOutgoingCall(true);
        setCallStatus('connecting');
      } catch (error) {
        console.error('Error parsing saved outgoing call:', error);
        localStorage.removeItem('currentOutgoingCall');
      }
    }

    if (savedActiveCall) {
      try {
        const callData = JSON.parse(savedActiveCall);
        console.log('Loading active call from localStorage:', callData);
        setActiveCall(callData);
        setShowActiveCall(true);
        setCallStatus('active');
      } catch (error) {
        console.error('Error parsing saved active call:', error);
        localStorage.removeItem('currentActiveCall');
      }
    }

    return () => {
      // Cleanup audio
      if (incomingCallAudioRef.current) {
        incomingCallAudioRef.current.pause();
        incomingCallAudioRef.current = null;
      }
      if (outgoingCallAudioRef.current) {
        outgoingCallAudioRef.current.pause();
        outgoingCallAudioRef.current = null;
      }
    };
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Set global socket reference for WebRTC
    window.currentSocket = socket;

    // Incoming call
    const handleIncomingCall = (data) => {
      console.log('Incoming call received:', data);
      setIncomingCall(data);
      setShowIncomingCall(true);
      setCallStatus('ringing');
      
      // Store call data in localStorage for persistence across navigation
      localStorage.setItem('currentIncomingCall', JSON.stringify(data));
      
      // Play incoming call sound
      if (incomingCallAudioRef.current) {
        incomingCallAudioRef.current.play().catch(() => {});
      }
      
      // Show notification
      toast.success(`Incoming video call from ${data.fromUserName}`);
      
      // Set global accept call function for notification
      window.acceptCall = async () => {
        console.log('Accepting call from notification');
        try {
          await acceptCall();
          console.log('Call accepted successfully from notification');
        } catch (error) {
          console.error('Error accepting call from notification:', error);
        }
      };
    };

    // Call started (outgoing)
    const handleCallStarted = (data) => {
      console.log('Call started (outgoing):', data);
      setOutgoingCall(data);
      setShowOutgoingCall(true);
      setCallStatus('connecting');
      
      // Store outgoing call data in localStorage
      localStorage.setItem('currentOutgoingCall', JSON.stringify(data));
      
      // Play outgoing call sound
      if (outgoingCallAudioRef.current) {
        outgoingCallAudioRef.current.play().catch(() => {});
      }
    };

    // Call joined (answered)
    const handleCallJoined = (data) => {
      console.log('Call joined/answered:', data);
      setActiveCall(data.call);
      setCallStatus('active');
      setShowIncomingCall(false);
      setShowOutgoingCall(false);
      setShowActiveCall(true);
      
      // Store active call data in localStorage for persistence
      localStorage.setItem('currentActiveCall', JSON.stringify(data.call));
      
      // Clear incoming call data from localStorage
      localStorage.removeItem('currentIncomingCall');
      localStorage.removeItem('currentOutgoingCall');
      
      // Stop all call sounds
      stopCallSounds();
      
      // Initialize WebRTC first, then start negotiation
      const initAndNegotiate = async () => {
        try {
          console.log('Initializing WebRTC before negotiation...');
          await initializeWebRTC();
          console.log('WebRTC initialized, starting negotiation...');
          
          // Wait longer for initialization to complete and verify it's ready
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Check if WebRTC is ready before starting negotiation
          let retryCount = 0;
          const maxRetries = 3;
          
          while (!isWebRTCReady() && retryCount < maxRetries) {
            console.log(`WebRTC not ready, retry ${retryCount + 1}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            retryCount++;
          }
          
          if (isWebRTCReady()) {
            console.log('WebRTC is ready, starting negotiation...');
            startWebRTCNegotiation();
          } else {
            console.error('WebRTC not ready after retries, skipping negotiation');
          }
        } catch (error) {
          console.error('Failed to initialize WebRTC:', error);
        }
      };
      
      // Start the process
      setTimeout(initAndNegotiate, 2000); // 2 second delay to ensure both users are ready
      
      // Force navigation to call page if not already there
      if (!window.location.pathname.includes('/call/')) {
        console.log('Navigating to active call page:', `/call/${data.call._id}`);
        window.location.href = `/call/${data.call._id}`;
      }
    };

    // Call ended
    const handleCallEnded = (data) => {
      console.log('Call ended:', data);
      endCall();
      toast.success('Call ended');
      
      // Close any open call windows/modals
      setShowIncomingCall(false);
      setShowOutgoingCall(false);
      setShowActiveCall(false);
      setIncomingCall(null);
      setOutgoingCall(null);
      setActiveCall(null);
      
      // Navigate away from call page if currently on it
      if (window.location.pathname.includes('/call/')) {
        window.history.back();
      }
    };

    // Call rejected
    const handleCallRejected = (data) => {
      console.log('Call rejected:', data);
      endCall();
      toast.error('Call was rejected');
      
      // Close any open call windows/modals
      setShowIncomingCall(false);
      setShowOutgoingCall(false);
      setShowActiveCall(false);
      setIncomingCall(null);
      setOutgoingCall(null);
      setActiveCall(null);
      
      // Navigate away from call page if currently on it
      if (window.location.pathname.includes('/call/')) {
        window.history.back();
      }
    };

    // Participant joined
    const handleParticipantJoined = (data) => {
      if (activeCall) {
        setActiveCall(prev => ({
          ...prev,
          participants: [...(prev.participants || []), data]
        }));
      }
      // Participant joined - no toast needed
    };

    // Participant left
    const handleParticipantLeft = (data) => {
      if (activeCall) {
        setActiveCall(prev => ({
          ...prev,
          participants: (prev.participants || []).filter(p => p.userId !== data.userId)
        }));
      }
      // Participant left - no toast needed
    };

    // WebRTC signaling events
    const handleSDPOffer = async (data) => {
      try {
        console.log('=== RECEIVED SDP OFFER ===');
        console.log('Offer data:', data);
        console.log('Call ID:', data.callId);
        console.log('Offer type:', data.offer?.type);
        
        const answer = await createAnswer(data.offer);
        console.log('Created answer:', answer);
        
        socket.emit('sdp_answer', {
          callId: data.callId,
          answer: answer
        });
        console.log('SDP answer sent via socket');
      } catch (error) {
        console.error('Error handling SDP offer:', error);
      }
    };

    const handleSDPAnswer = async (data) => {
      try {
        console.log('=== RECEIVED SDP ANSWER ===');
        console.log('Answer data:', data);
        console.log('Call ID:', data.callId);
        console.log('Answer type:', data.answer?.type);
        
        await setRemoteDescription(data.answer);
        console.log('Remote description set successfully');
      } catch (error) {
        console.error('Error handling SDP answer:', error);
      }
    };

    const handleICECandidate = async (data) => {
      try {
        console.log('=== RECEIVED ICE CANDIDATE ===');
        console.log('ICE candidate data:', data);
        
        if (data.candidate) {
          await addIceCandidate(data.candidate);
          console.log('ICE candidate added successfully');
        } else {
          console.log('ICE candidate is null (end of candidates)');
        }
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    };

    // Register event listeners
    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_started', handleCallStarted);
    socket.on('call_joined', handleCallJoined);
    socket.on('call_ended', handleCallEnded);
    socket.on('call_rejected', handleCallRejected);
    socket.on('participant_joined', handleParticipantJoined);
    socket.on('participant_left', handleParticipantLeft);
    socket.on('sdp_offer', handleSDPOffer);
    socket.on('sdp_answer', handleSDPAnswer);
    socket.on('ice_candidate', handleICECandidate);

    // Set up global accept call function for notifications
    window.acceptCall = async () => {
      console.log('Accepting call from notification');
      try {
        await acceptCall();
        console.log('Call accepted successfully from notification');
      } catch (error) {
        console.error('Error accepting call from notification:', error);
      }
    };

    return () => {
      // Cleanup event listeners
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_started', handleCallStarted);
      socket.off('call_joined', handleCallJoined);
      socket.off('call_ended', handleCallEnded);
      socket.off('call_rejected', handleCallRejected);
      socket.off('participant_joined', handleParticipantJoined);
      socket.off('participant_left', handleParticipantLeft);
      socket.off('sdp_offer', handleSDPOffer);
      socket.off('sdp_answer', handleSDPAnswer);
      socket.off('ice_candidate', handleICECandidate);
      
      // Clean up global function
      delete window.acceptCall;
    };
  }, [socket, activeCall]);

  // Helper functions
  const stopCallSounds = () => {
    if (incomingCallAudioRef.current) {
      incomingCallAudioRef.current.pause();
      incomingCallAudioRef.current.currentTime = 0;
    }
    if (outgoingCallAudioRef.current) {
      outgoingCallAudioRef.current.pause();
      outgoingCallAudioRef.current.currentTime = 0;
    }
  };

  const endCall = () => {
    console.log('Ending call...');
    
    setIncomingCall(null);
    setOutgoingCall(null);
    setActiveCall(null);
    setCallStatus('idle');
    setShowIncomingCall(false);
    setShowOutgoingCall(false);
    setShowActiveCall(false);
    
    // Clear call data from localStorage
    localStorage.removeItem('currentIncomingCall');
    localStorage.removeItem('currentOutgoingCall');
    localStorage.removeItem('currentActiveCall');
    
    // Stop all sounds
    stopCallSounds();
    
    // Release all media tracks and connections
    releaseAllTracks();
    
    // Navigate away from call page if currently on it
    if (window.location.pathname.includes('/call/')) {
      console.log('Navigating away from call page...');
      window.history.back();
    }
  };

  // Call actions
  const startCall = async (chatId) => {
    try {
      if (!socket) {
        throw new Error('Socket not connected');
      }

      // Initialize WebRTC (this will start local stream and create peer connection)
      await initializeWebRTC();

      // Emit start call event - video calls only
      socket.emit('start_call', {
        chatId,
        type: 'one-to-one' // or 'group' based on chat type
      });

      setCallStatus('connecting');
    } catch (error) {
      // Provide specific error messages and recovery options
      if (error.message.includes('Device in use') || error.name === 'NotReadableError') {
        toast.error('Camera or microphone is being used by another application. Trying to release devices...', {
          duration: 3000,
        });
        
        // Try to force release devices and retry
        try {
          await forceReleaseDevices();
          toast.success('Devices released. Please try starting the call again.', {
            duration: 3000,
          });
        } catch (releaseError) {
          toast.error('Please close other applications using camera/microphone and try again.', {
            duration: 5000,
          });
        }
      } else if (error.message.includes('permission denied')) {
        toast.error('Camera and microphone access denied. Please allow access and try again.');
      } else if (error.message.includes('not found')) {
        toast.error('No camera or microphone found. Please check your devices.');
      } else {
        toast.error('Failed to start call: ' + error.message);
      }
      
      endCall();
    }
  };

  const acceptCall = async () => {
    if (!socket || !incomingCall) return;

    try {
      console.log('Accepting call:', incomingCall.callId);
      
      // Stop incoming call sound
      stopCallSounds();

      // Initialize WebRTC first
      console.log('Initializing WebRTC...');
      await initializeWebRTC();
      console.log('WebRTC initialized successfully');

      // Emit join call event
      socket.emit('join_call', { 
        callId: incomingCall.callId 
      });
      console.log('Join call event emitted');

      setCallStatus('connecting');

      // Navigate to call page if not already there
      if (!window.location.pathname.includes('/call/')) {
        console.log('Navigating to call page:', `/call/${incomingCall.callId}`);
        window.location.href = `/call/${incomingCall.callId}`;
      }
    } catch (error) {
      console.error('Error accepting call:', error);
      
      // Provide specific error messages and recovery options
      if (error.message.includes('Device in use') || error.name === 'NotReadableError') {
        toast.error('Camera or microphone is being used by another application. Please close other apps and try again.', {
          duration: 5000,
        });
      } else if (error.message.includes('permission denied') || error.name === 'NotAllowedError') {
        toast.error('Camera and microphone access denied. Please allow access in browser settings and try again.', {
          duration: 5000,
        });
      } else if (error.message.includes('not found') || error.name === 'NotFoundError') {
        toast.error('No camera or microphone found. Please check your devices and try again.', {
          duration: 5000,
        });
      } else if (error.message.includes('NotSupportedError')) {
        toast.error('WebRTC is not supported in this browser. Please use a modern browser.', {
          duration: 5000,
        });
      } else {
        toast.error('Failed to accept call: ' + (error.message || 'Unknown error'), {
          duration: 5000,
        });
      }
      
      endCall();
    }
  };

  const rejectCall = () => {
    if (!socket || !incomingCall) return;

    console.log('Rejecting call:', incomingCall.callId);
    
    socket.emit('reject_call', { 
      callId: incomingCall.callId 
    });
    
    // Immediately close all call interfaces
    setShowIncomingCall(false);
    setShowOutgoingCall(false);
    setShowActiveCall(false);
    setIncomingCall(null);
    setOutgoingCall(null);
    setActiveCall(null);
    
    endCall();
  };

  const cancelCall = () => {
    if (!socket || !outgoingCall) return;

    socket.emit('end_call', { 
      callId: outgoingCall.callId 
    });
    
    endCall();
  };

  const endActiveCall = () => {
    if (!socket || !activeCall) return;

    socket.emit('end_call', { 
      callId: activeCall._id 
    });
    
    endCall();
  };

  const startWebRTCNegotiation = async () => {
    try {
      // Prevent multiple negotiation attempts
      if (isNegotiating) {
        console.log('WebRTC negotiation already in progress');
        return;
      }
      
      setIsNegotiating(true);
      console.log('=== STARTING WebRTC NEGOTIATION ===');
      
      // Check if WebRTC is ready
      if (!isWebRTCReady()) {
        console.error('WebRTC is not ready - cannot start negotiation');
        console.log('WebRTC ready check failed - forcing WebRTC initialization...');
        
        // Force WebRTC initialization if not ready
        try {
          await initializeWebRTC();
          console.log('WebRTC force initialization completed');
          
          // Wait a bit for initialization to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check again
          if (!isWebRTCReady()) {
            console.error('WebRTC still not ready after force initialization');
            return;
          }
        } catch (error) {
          console.error('Error force initializing WebRTC:', error);
          return;
        }
      }
      
      // Wait a moment to ensure peer connection is ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create and send offer
      console.log('Creating SDP offer...');
      const offer = await createOffer();
      if (!offer) {
        console.log('No offer created - peer connection may not be in correct state');
        console.log('Peer connection state:', peerConnectionRef.current?.signalingState);
        console.log('Peer connection connection state:', peerConnectionRef.current?.connectionState);
        return;
      }
      
      console.log('WebRTC offer created:', offer);
      console.log('Offer type:', offer.type);
      console.log('Offer sdp:', offer.sdp);
      
      if (socket && activeCall?._id) {
        socket.emit('sdp_offer', {
          callId: activeCall._id,
          offer: offer
        });
        console.log('SDP offer sent via socket to call:', activeCall._id);
      } else {
        console.error('Socket or call ID not available for sending offer');
        console.log('Socket:', socket);
        console.log('Active call:', activeCall);
      }
    } catch (error) {
      console.error('WebRTC negotiation failed:', error);
    } finally {
      setIsNegotiating(false);
      console.log('=== WebRTC NEGOTIATION COMPLETED ===');
    }
  };

  // Manual negotiation trigger for debugging
  const manualStartNegotiation = async () => {
    console.log('Manual negotiation triggered');
    await startWebRTCNegotiation();
  };

  return {
    // States
    incomingCall,
    outgoingCall,
    activeCall,
    callStatus,
    showIncomingCall,
    showOutgoingCall,
    showActiveCall,
    
    // Actions
    startCall,
    acceptCall,
    rejectCall,
    cancelCall,
    endActiveCall,
    endCall,
    
    // Debug actions
    manualStartNegotiation
  };
};
