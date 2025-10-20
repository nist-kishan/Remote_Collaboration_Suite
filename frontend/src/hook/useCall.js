import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSocket } from './useSocket';
import { toast } from 'react-hot-toast';
import { isExtensionError } from '../utils/errorHandler';
import { 
  checkMediaDevices, 
  requestMediaPermissions, 
  getOptimalMediaConstraints, 
  validateMediaStream,
  createFallbackConstraints 
} from '../utils/mediaUtils';
import {
  getCallHistory,
  deleteCallHistory,
  clearCallHistory,
  startCallApi,
  endCallApi,
  answerCallApi,
  rejectCallApi
} from '../api/callApi';
import {
  // Redux actions
  setActiveCall,
  setOutgoingCall,
  setIncomingCall,
  clearCall,
  setLocalStream,
  setRemoteStream,
  toggleMute,
  toggleVideo,
  toggleScreenShare,
  setParticipants,
  addParticipant,
  removeParticipant,
  updateParticipant,
  setShowIncomingCallModal,
  setShowOutgoingCallModal,
  setShowCallWindow,
  clearError,
  clearAllErrors,
  resetCallState,
  // Redux selectors
  selectActiveCall,
  selectOutgoingCall,
  selectIncomingCall,
  selectCallHistory,
  selectLocalStream,
  selectRemoteStream,
  selectIsMuted,
  selectIsVideoEnabled,
  selectIsScreenSharing,
  selectParticipants,
  selectCallLoading,
  selectCallErrors,
  selectCallPagination,
  selectShowIncomingCallModal,
  selectShowOutgoingCallModal,
  selectShowCallWindow
} from '../store/slice/callSlice';

/**
 * Consolidated Call Hook - All call-related functionality in one place
 * Combines: useCallManager, useCallHistory, useWebRTC, useCallBusinessLogic
 */
export const useCall = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.auth);
  const { socket } = useSocket();

  // Redux state selectors
  const activeCall = useSelector(selectActiveCall);
  const outgoingCall = useSelector(selectOutgoingCall);
  const incomingCall = useSelector(selectIncomingCall);
  const callHistory = useSelector(selectCallHistory);
  const localStream = useSelector(selectLocalStream);
  const remoteStream = useSelector(selectRemoteStream);
  const isMuted = useSelector(selectIsMuted);
  const isVideoEnabled = useSelector(selectIsVideoEnabled);
  const isScreenSharing = useSelector(selectIsScreenSharing);
  const participants = useSelector(selectParticipants);
  const loading = useSelector(selectCallLoading);
  const errors = useSelector(selectCallErrors);
  const pagination = useSelector(selectCallPagination);
  const showIncomingCallModal = useSelector(selectShowIncomingCallModal);
  const showOutgoingCallModal = useSelector(selectShowOutgoingCallModal);
  const showCallWindow = useSelector(selectShowCallWindow);

  // Local state for call management
  const [callStatus, setCallStatus] = useState('idle');
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [filter, setFilter] = useState('all'); // all, missed, outgoing, incoming
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [selectedCallId, setSelectedCallId] = useState(null);

  // WebRTC refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const originalCameraStreamRef = useRef(null);

  // Audio refs for call sounds
  const incomingCallAudioRef = useRef(null);
  const outgoingCallAudioRef = useRef(null);

  // WebRTC state
  const [webrtcLocalStream, setWebrtcLocalStream] = useState(null);
  const [webrtcRemoteStream, setWebrtcRemoteStream] = useState(null);
  const [webrtcIsVideoEnabled, setWebrtcIsVideoEnabled] = useState(true);
  const [webrtcIsScreenSharing, setWebrtcIsScreenSharing] = useState(false);
  const [webrtcIsMuted, setWebrtcIsMuted] = useState(false);

  // Initialize audio elements
  useEffect(() => {
    incomingCallAudioRef.current = new Audio('/sounds/incoming-call.mp3');
    outgoingCallAudioRef.current = new Audio('/sounds/outgoing-call.mp3');
    
    [incomingCallAudioRef.current, outgoingCallAudioRef.current].forEach(audio => {
      audio.loop = true;
      audio.volume = 0.5;
    });

    return () => {
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

  // Fetch call history with React Query
  const { data: callHistoryData, isLoading: isLoadingHistory, error: historyError, refetch } = useQuery({
    queryKey: ['callHistory', filter],
    queryFn: () => getCallHistory({ filter }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user?._id,
  });

  const apiData = callHistoryData?.data;
  const calls = apiData?.data?.calls || [];
  const historyPagination = apiData?.data?.pagination;

  // Delete single call mutation
  const deleteCallMutation = useMutation({
    mutationFn: deleteCallHistory,
    onSuccess: () => {
      toast.success('Call deleted successfully');
      queryClient.invalidateQueries(['callHistory']);
    },
    onError: (error) => {
      toast.error(error?.data?.message || 'Failed to delete call');
    }
  });

  // Clear all calls mutation
  const clearAllMutation = useMutation({
    mutationFn: clearCallHistory,
    onSuccess: (response) => {
      const deletedCount = response.data?.data?.deletedCount || response.data?.deletedCount || 0;
      toast.success(`Cleared ${deletedCount} calls from history`);
      queryClient.invalidateQueries(['callHistory']);
      setShowClearConfirm(false);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to clear call history');
    }
  });

  // WebRTC Functions
  const releaseAllTracks = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        localStreamRef.current.removeTrack(track);
      });
      localStreamRef.current = null;
      setWebrtcLocalStream(null);
    }
    
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    setWebrtcRemoteStream(null);
    setWebrtcIsVideoEnabled(true);
    setWebrtcIsScreenSharing(false);
  }, []);

  const checkDeviceAvailability = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      return {
        hasVideo: videoDevices.length > 0,
        videoDevices
      };
    } catch (error) {
      return { hasVideo: false, videoDevices: [] };
    }
  }, []);

  const startLocalStream = useCallback(async () => {
    try {
      releaseAllTracks();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const deviceInfo = await checkDeviceAvailability();
      
      if (!deviceInfo.hasVideo) {
        throw new Error('No video devices found');
      }
      
      const strategies = [
        getOptimalMediaConstraints(),
        createFallbackConstraints(),
        { video: true, audio: true },
        { video: { facingMode: 'user' }, audio: true },
        { video: true, audio: false }
      ];
      
      let stream = null;
      let lastError = null;
      
      for (let i = 0; i < strategies.length; i++) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(strategies[i]);
          break;
        } catch (error) {
          lastError = error;
          
          if (error.name === 'NotReadableError' && i < strategies.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      if (!stream) {
        throw lastError || new Error('All media constraint strategies failed');
      }
      
      const validation = validateMediaStream(stream);
      
      localStreamRef.current = stream;
      originalCameraStreamRef.current = stream;
      setWebrtcLocalStream(stream);
      
      if (localVideoRef.current) {
        try {
          localVideoRef.current.srcObject = null;
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.load();
          
          const playPromise = localVideoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              console.log('Local video playing successfully');
            }).catch(error => {
              console.error('Error playing local video:', error);
              setTimeout(() => {
                localVideoRef.current?.play().catch(err => {
                  console.error('Local video retry failed:', err);
                });
              }, 1000);
            });
          }
        } catch (error) {
          console.error('Error setting local video stream:', error);
        }
      }
      
      return stream;
    } catch (error) {
      if (isExtensionError(error)) {
        return null;
      }
      
      if (error.name === 'NotAllowedError') {
        throw new Error('Camera and microphone access denied. Please allow access and try again.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No camera or microphone found. Please check your devices.');
      } else if (error.name === 'NotReadableError') {
        throw new Error('Camera or microphone is being used by another application.');
      }
      
      throw error;
    }
  }, [releaseAllTracks, checkDeviceAvailability]);

  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        setWebrtcRemoteStream(remoteStream);
        
        if (remoteVideoRef.current) {
          try {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.muted = false;
            remoteVideoRef.current.load();
            
            const playPromise = remoteVideoRef.current.play();
            if (playPromise !== undefined) {
              playPromise.then(() => {
                console.log('Remote video playing successfully');
              }).catch(error => {
                console.error('Error playing remote video:', error);
                setTimeout(() => {
                  remoteVideoRef.current?.play().catch(err => {
                    console.error('Retry failed:', err);
                  });
                }, 1000);
              });
            }
          } catch (error) {
            console.error('Error setting remote video stream:', error);
          }
        }
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice_candidate', {
          candidate: event.candidate
        });
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [socket]);

  const initializeWebRTC = useCallback(async () => {
    try {
      const stream = await startLocalStream();
      if (!stream) {
        throw new Error('Failed to get local media stream');
      }
      
      const pc = createPeerConnection();
      
      if (localStreamRef.current && pc.getSenders().length === 0) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current);
        });
      }
      
      if (!peerConnectionRef.current) {
        throw new Error('Peer connection was not created successfully');
      }
      
      return { stream, pc: peerConnectionRef.current };
    } catch (error) {
      console.error('WebRTC initialization failed:', error);
      throw error;
    }
  }, [startLocalStream, createPeerConnection]);

  const createOffer = useCallback(async () => {
    try {
      if (!peerConnectionRef.current) {
        throw new Error('No peer connection available');
      }

      const pc = peerConnectionRef.current;
      
      if (pc.signalingState === 'closed') {
        throw new Error('Peer connection is closed');
      }

      if (pc.signalingState !== 'stable' && pc.signalingState !== 'have-local-offer') {
        return null;
      }

      if (localStreamRef.current && pc.getSenders().length === 0) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      await pc.setLocalDescription(offer);
      
      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }, []);

  const createAnswer = useCallback(async (offer) => {
    try {
      if (!peerConnectionRef.current) {
        throw new Error('No peer connection available');
      }

      const pc = peerConnectionRef.current;
      
      if (pc.signalingState === 'closed') {
        throw new Error('Peer connection is closed');
      }

      if (pc.signalingState !== 'have-remote-offer') {
        return null;
      }

      if (localStreamRef.current && pc.getSenders().length === 0) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      await pc.setRemoteDescription(offer);
      
      const answer = await pc.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      await pc.setLocalDescription(answer);
      
      return answer;
    } catch (error) {
      console.error('Error creating answer:', error);
      throw error;
    }
  }, []);

  const setRemoteDescription = useCallback(async (description) => {
    try {
      if (!peerConnectionRef.current) {
        throw new Error('No peer connection available');
      }

      const pc = peerConnectionRef.current;
      
      if (pc.signalingState === 'closed') {
        throw new Error('Peer connection is closed');
      }

      await pc.setRemoteDescription(description);
    } catch (error) {
      console.error('Error setting remote description:', error);
      throw error;
    }
  }, []);

  const addIceCandidate = useCallback(async (candidate) => {
    try {
      if (!peerConnectionRef.current) {
        throw new Error('No peer connection available');
      }

      await peerConnectionRef.current.addIceCandidate(candidate);
    } catch (error) {
      throw error;
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        const newVideoEnabled = !webrtcIsVideoEnabled;
        videoTrack.enabled = newVideoEnabled;
        setWebrtcIsVideoEnabled(newVideoEnabled);
        
        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find(sender => 
            sender.track && sender.track.kind === 'video'
          );
          
          if (videoSender) {
            videoSender.track.enabled = newVideoEnabled;
          }
        }
      }
    }
  }, [webrtcIsVideoEnabled]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !webrtcIsMuted;
        setWebrtcIsMuted(!webrtcIsMuted);
      }
    }
  }, [webrtcIsMuted]);

  const isWebRTCReady = useCallback(() => {
    const hasPeerConnection = peerConnectionRef.current !== null;
    const hasLocalStream = localStreamRef.current !== null;
    
    return hasPeerConnection && hasLocalStream;
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    window.currentSocket = socket;

    const handleIncomingCall = (data) => {
      console.log('Incoming call received:', data);
      dispatch(setIncomingCall(data));
      dispatch(setShowIncomingCallModal(true));
      setCallStatus('ringing');
      
      if (incomingCallAudioRef.current) {
        incomingCallAudioRef.current.play().catch(() => {});
      }
      
      toast.success(`Incoming video call from ${data.fromUserName}`);
      
      window.acceptCall = async () => {
        try {
          await acceptCall();
        } catch (error) {
          console.error('Error accepting call from notification:', error);
        }
      };
    };

    const handleCallStarted = (data) => {
      console.log('Call started (outgoing):', data);
      dispatch(setOutgoingCall(data));
      dispatch(setShowOutgoingCallModal(true));
      setCallStatus('connecting');
      
      if (outgoingCallAudioRef.current) {
        outgoingCallAudioRef.current.play().catch(() => {});
      }
    };

    const handleCallJoined = (data) => {
      console.log('Call joined/answered:', data);
      dispatch(setActiveCall(data.call));
      setCallStatus('active');
      dispatch(setShowIncomingCallModal(false));
      dispatch(setShowOutgoingCallModal(false));
      dispatch(setShowCallWindow(true));
      
      stopCallSounds();
      
      const initAndNegotiate = async () => {
        try {
          await initializeWebRTC();
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          let retryCount = 0;
          const maxRetries = 3;
          
          while (!isWebRTCReady() && retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            retryCount++;
          }
          
          if (isWebRTCReady()) {
            startWebRTCNegotiation();
          }
        } catch (error) {
          console.error('Failed to initialize WebRTC:', error);
        }
      };
      
      setTimeout(initAndNegotiate, 2000);
      
      if (!location.pathname.includes('/call/')) {
        navigate(`/call/${data.call._id}`, { replace: true });
      }
    };

    const handleCallEnded = (data) => {
      console.log('Call ended:', data);
      endCall();
      toast.success('Call ended');
      
      dispatch(setShowIncomingCallModal(false));
      dispatch(setShowOutgoingCallModal(false));
      dispatch(setShowCallWindow(false));
      dispatch(setIncomingCall(null));
      dispatch(setOutgoingCall(null));
      dispatch(setActiveCall(null));
      
      if (location.pathname.includes('/call/')) {
        navigate(-1);
      }
    };

    const handleCallRejected = (data) => {
      console.log('Call rejected:', data);
      endCall();
      toast.error('Call was rejected');
      
      dispatch(setShowIncomingCallModal(false));
      dispatch(setShowOutgoingCallModal(false));
      dispatch(setShowCallWindow(false));
      dispatch(setIncomingCall(null));
      dispatch(setOutgoingCall(null));
      dispatch(setActiveCall(null));
      
      if (location.pathname.includes('/call/')) {
        navigate(-1);
      }
    };

    const handleSDPOffer = async (data) => {
      try {
        const answer = await createAnswer(data.offer);
        
        socket.emit('sdp_answer', {
          callId: data.callId,
          answer: answer
        });
      } catch (error) {
        console.error('Error handling SDP offer:', error);
      }
    };

    const handleSDPAnswer = async (data) => {
      try {
        await setRemoteDescription(data.answer);
      } catch (error) {
        console.error('Error handling SDP answer:', error);
      }
    };

    const handleICECandidate = async (data) => {
      try {
        if (data.candidate) {
          await addIceCandidate(data.candidate);
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
    socket.on('sdp_offer', handleSDPOffer);
    socket.on('sdp_answer', handleSDPAnswer);
    socket.on('ice_candidate', handleICECandidate);

    return () => {
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_started', handleCallStarted);
      socket.off('call_joined', handleCallJoined);
      socket.off('call_ended', handleCallEnded);
      socket.off('call_rejected', handleCallRejected);
      socket.off('sdp_offer', handleSDPOffer);
      socket.off('sdp_answer', handleSDPAnswer);
      socket.off('ice_candidate', handleICECandidate);
      
      delete window.acceptCall;
    };
  }, [socket, activeCall, dispatch, navigate, location.pathname, initializeWebRTC, isWebRTCReady, createAnswer, setRemoteDescription, addIceCandidate]);

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
    dispatch(setIncomingCall(null));
    dispatch(setOutgoingCall(null));
    dispatch(setActiveCall(null));
    setCallStatus('idle');
    dispatch(setShowIncomingCallModal(false));
    dispatch(setShowOutgoingCallModal(false));
    dispatch(setShowCallWindow(false));
    
    stopCallSounds();
    releaseAllTracks();
    
    if (location.pathname.includes('/call/')) {
      navigate(-1);
    }
  };

  const startWebRTCNegotiation = async () => {
    try {
      if (isNegotiating) {
        return;
      }
      
      setIsNegotiating(true);
      
      if (!isWebRTCReady()) {
        try {
          await initializeWebRTC();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          if (!isWebRTCReady()) {
            return;
          }
        } catch (error) {
          console.error('Error force initializing WebRTC:', error);
          return;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const offer = await createOffer();
      if (!offer) {
        return;
      }
      
      if (socket && activeCall?._id) {
        socket.emit('sdp_offer', {
          callId: activeCall._id,
          offer: offer
        });
      }
    } catch (error) {
      console.error('WebRTC negotiation failed:', error);
    } finally {
      setIsNegotiating(false);
    }
  };

  // Call actions
  const startCall = async (chatId) => {
    try {
      if (!socket) {
        throw new Error('Socket not connected');
      }

      await initializeWebRTC();

      socket.emit('start_call', {
        chatId,
        type: 'one-to-one'
      });

      setCallStatus('connecting');
    } catch (error) {
      if (error.message.includes('Device in use') || error.name === 'NotReadableError') {
        toast.error('Camera or microphone is being used by another application. Trying to release devices...', {
          duration: 3000,
        });
        
        try {
          releaseAllTracks();
          await new Promise(resolve => setTimeout(resolve, 1000));
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
      stopCallSounds();
      await initializeWebRTC();

      socket.emit('join_call', { 
        callId: incomingCall.callId 
      });

      setCallStatus('connecting');

      if (!location.pathname.includes('/call/')) {
        navigate(`/call/${incomingCall.callId}`, { replace: true });
      }
    } catch (error) {
      console.error('Error accepting call:', error);
      
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

    socket.emit('reject_call', { 
      callId: incomingCall.callId 
    });
    
    dispatch(setShowIncomingCallModal(false));
    dispatch(setShowOutgoingCallModal(false));
    dispatch(setShowCallWindow(false));
    dispatch(setIncomingCall(null));
    dispatch(setOutgoingCall(null));
    dispatch(setActiveCall(null));
    
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

  // Call history functions
  const handleDeleteCall = (callId) => {
    deleteCallMutation.mutate(callId);
  };

  const handleClearAll = () => {
    clearAllMutation.mutate();
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date) => {
    const callDate = new Date(date);
    const now = new Date();
    const diffInDays = Math.floor((now - callDate) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return `Today, ${callDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays === 1) {
      return `Yesterday, ${callDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays < 7) {
      return callDate.toLocaleDateString([], { weekday: 'long', hour: '2-digit', minute: '2-digit' });
    } else {
      return callDate.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const getCallStatus = (call, currentUserId) => {
    if (!call || !currentUserId) return 'unknown';
    
    const participant = call.participants?.find(p => p.user?._id === currentUserId);
    const isIncoming = call.startedBy?._id !== currentUserId;
    
    if (call.status === 'missed') return 'missed';
    if (call.status === 'rejected') return 'rejected';
    if (isIncoming) return 'incoming';
    return 'outgoing';
  };

  const getCallIcon = (call, currentUserId) => {
    const status = getCallStatus(call, currentUserId);
    
    if (status === 'missed' || status === 'rejected') {
      return 'missed';
    }
    
    return 'success';
  };

  const getOtherParticipant = (call, currentUserId) => {
    if (!call || !currentUserId) return { name: 'Unknown User', isGroup: false };
    
    if (call.type === 'group') {
      return { name: call.chat?.name || 'Group Call', isGroup: true };
    }
    
    const otherParticipant = call.participants?.find(p => p.user?._id !== currentUserId);
    return otherParticipant?.user || { name: 'Unknown User', isGroup: false };
  };

  const getCallTitle = (call, currentUserId) => {
    const otherParticipant = getOtherParticipant(call, currentUserId);
    const status = getCallStatus(call, currentUserId);
    
    if (otherParticipant.isGroup) {
      return otherParticipant.name;
    }
    
    const statusText = {
      missed: 'Missed call',
      rejected: 'Rejected call',
      incoming: 'Incoming call',
      outgoing: 'Outgoing call'
    };
    
    return `${statusText[status]} with ${otherParticipant.name}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      releaseAllTracks();
    };
  }, [releaseAllTracks]);

  // Return consolidated interface
  return {
    // State
    user,
    activeCall,
    outgoingCall,
    incomingCall,
    callStatus,
    localStream: localStream || webrtcLocalStream,
    remoteStream: remoteStream || webrtcRemoteStream,
    isMuted: isMuted || webrtcIsMuted,
    isVideoEnabled: isVideoEnabled || webrtcIsVideoEnabled,
    isScreenSharing: isScreenSharing || webrtcIsScreenSharing,
    participants,
    loading,
    errors,
    pagination,
    showIncomingCallModal,
    showOutgoingCallModal,
    showCallWindow,
    
    // Call history state
    filter,
    calls,
    historyPagination,
    isLoadingHistory,
    historyError,
    showClearConfirm,
    selectedCallId,
    
    // WebRTC refs
    localVideoRef,
    remoteVideoRef,
    peerConnection: peerConnectionRef.current,
    
    // Call actions
    startCall,
    acceptCall,
    rejectCall,
    cancelCall,
    endActiveCall,
    endCall,
    toggleMute,
    toggleVideo,
    
    // Call history actions
    setFilter,
    setShowClearConfirm,
    setSelectedCallId,
    handleDeleteCall,
    handleClearAll,
    refetch,
    
    // Utility functions
    formatDuration,
    formatDate,
    getCallStatus,
    getCallIcon,
    getOtherParticipant,
    getCallTitle,
    
    // WebRTC functions
    initializeWebRTC,
    createOffer,
    createAnswer,
    setRemoteDescription,
    addIceCandidate,
    isWebRTCReady,
    releaseAllTracks,
    
    // Mutation states
    isDeleting: deleteCallMutation.isPending,
    isClearing: clearAllMutation.isPending,
  };
};
