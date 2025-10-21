import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallSocket } from './useCallSocket';
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
  startCall,
  endCall,
  joinCall,
  rejectCall
} from '../api/callApi';
import {
  // Redux actions
  setActiveCall,
  setOutgoingCall,
  setIncomingCall,
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
  addError,
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
  selectCallErrors,
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
  
  // Use the new useCallSocket hook with cleanup callback
  const {
    socket,
    callStatus: socketCallStatus,
    callPersistData,
    startCallSocket,
    joinCallSocket,
    rejectCallSocket,
    endCallSocket,
    sendSDPOffer,
    sendSDPAnswer,
    sendICECandidate,
    setupWebRTCListeners,
    saveCallData,
    stopCallSounds,
    endCall: endCallSocketFunction
  } = useCallSocket();

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
  const errors = useSelector(selectCallErrors);
  const showIncomingCallModal = useSelector(selectShowIncomingCallModal);
  const showOutgoingCallModal = useSelector(selectShowOutgoingCallModal);
  const showCallWindow = useSelector(selectShowCallWindow);

  // Local state for call management
  const [callStatus, setCallStatus] = useState('idle');
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [isInitializingWebRTC, setIsInitializingWebRTC] = useState(false);
  const [initializationAttempts, setInitializationAttempts] = useState(0);
  const [deviceInUseRetryCount, setDeviceInUseRetryCount] = useState(0);
  
  // Reset attempts counter after timeout
  useEffect(() => {
    if (initializationAttempts > 0) {
      const timeout = setTimeout(() => {
        console.log('🔄 Resetting initialization attempts counter after timeout');
        setInitializationAttempts(0);
      }, 30000); // Reset after 30 seconds
      
      return () => clearTimeout(timeout);
    }
  }, [initializationAttempts]);
  const [filter, setFilter] = useState('all'); // all, missed, outgoing, incoming
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [selectedCallId, setSelectedCallId] = useState(null);

  // WebRTC refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const originalCameraStreamRef = useRef(null);
  const initializationLockRef = useRef(false);
  

  // WebRTC state
  const [webrtcLocalStream, setWebrtcLocalStream] = useState(null);
  const [webrtcRemoteStream, setWebrtcRemoteStream] = useState(null);
  const [webrtcIsVideoEnabled, setWebrtcIsVideoEnabled] = useState(true);
  const [webrtcIsScreenSharing, setWebrtcIsScreenSharing] = useState(false);
  const [webrtcIsMuted, setWebrtcIsMuted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

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
  const releaseAllTracks = useCallback(async () => {
    console.log('🧹 Releasing all media tracks...');
    
    try {
      // Stop all local stream tracks
      if (localStreamRef.current) {
        console.log('📹 Stopping local stream tracks...');
        const tracks = localStreamRef.current.getTracks();
        tracks.forEach(track => {
          console.log(`🛑 Stopping track: ${track.kind} - ${track.label}`);
          track.stop();
        });
        localStreamRef.current = null;
        setWebrtcLocalStream(null);
      }
      
      // Also stop any remaining tracks from localStream (from Redux state)
      if (localStream && localStream.getTracks) {
        console.log('📹 Stopping Redux local stream tracks...');
        const tracks = localStream.getTracks();
        tracks.forEach(track => {
          console.log(`🛑 Stopping Redux track: ${track.kind} - ${track.label}`);
          track.stop();
        });
      }
      
      // Clear video elements
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
        localVideoRef.current.load(); // Force reload
        localVideoRef.current.pause();
      }
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
        remoteVideoRef.current.load(); // Force reload
        remoteVideoRef.current.pause();
      }
      
      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      
      // Reset state
      setWebrtcRemoteStream(null);
      setWebrtcIsVideoEnabled(true);
      setWebrtcIsScreenSharing(false);
      
      // Clear Redux state streams
      setLocalStream(null);
      setRemoteStream(null);
      
      // Force garbage collection of media streams
      if (window.gc) {
        window.gc();
      }
      
      // Force stop all remaining media streams
      try {
        console.log('🔍 Checking for any remaining active streams...');
        const allStreams = [];
        
        // Check if there are any global media streams that weren't caught
        if (window.localStreams) {
          window.localStreams.forEach(stream => {
            if (stream && stream.getTracks) {
              allStreams.push(stream);
            }
          });
        }
        
        // Stop any remaining streams
        allStreams.forEach(stream => {
          stream.getTracks().forEach(track => {
            console.log(`🛑 Force stopping remaining track: ${track.kind} - ${track.label}`);
            track.stop();
          });
        });
        
        // Clear any global stream references
        if (window.localStreams) {
          window.localStreams = [];
        }
      } catch (error) {
        console.log('⚠️ Error in force cleanup:', error.message);
      }
      
      // Wait a bit for devices to be released
      await new Promise(resolve => setTimeout(resolve, 1000)); // Increased wait time
      
      // Verify devices are released
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log('🔍 Found devices after cleanup:', devices.length);
      } catch (error) {
        console.log('🔍 Device enumeration failed:', error.message);
      }
      
      console.log('✅ All tracks released');
    } catch (error) {
      console.error('❌ Error releasing tracks:', error);
    }
  }, [localStream]);

  // Force release all media devices
  const forceReleaseAllMediaDevices = useCallback(async () => {
    console.log('🔧 Force releasing all media devices...');
    
    try {
      // Get all active media streams from the browser
      const allTracks = [];
      
      // Check for any remaining active tracks
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        try {
          // This is a fallback to ensure all tracks are stopped
          const testStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          testStream.getTracks().forEach(track => {
            console.log(`🛑 Force stopping test track: ${track.kind}`);
            track.stop();
          });
        } catch (error) {
          // This is expected if devices are already in use
          console.log('🔍 Test stream creation failed (expected if devices are in use)');
        }
      }
      
      // Force garbage collection
      if (window.gc) {
        window.gc();
      }
      
      // Wait for devices to be fully released
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('✅ All media devices force released');
    } catch (error) {
      console.error('❌ Error in force release:', error);
    }
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

  // Check if devices are currently in use
  const checkDeviceInUse = useCallback(async () => {
    try {
      // Try to get a test stream to see if devices are available
      const testStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1, height: 1 }, // Minimal video
        audio: false
      });
      
      // If we can get a stream, devices are available
      testStream.getTracks().forEach(track => track.stop());
      console.log('✅ Devices are available');
      return false;
    } catch (error) {
      if (error.name === 'NotReadableError') {
        console.log('⚠️ Devices are in use by another application');
        return true;
      }
      console.log('⚠️ Device check failed:', error.message);
      return false;
    }
  }, []);

  const startLocalStream = useCallback(async () => {
    try {
      console.log('🎬 Starting local stream...');
      
      // Check if devices are in use first
      const devicesInUse = await checkDeviceInUse();
      if (devicesInUse) {
        throw new Error('Camera or microphone is being used by another application. Please close other applications and try again.');
      }
      
      // More aggressive cleanup
      await releaseAllTracks();
      
      // Wait a bit longer for devices to be fully released
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if we already have a valid stream
      if (localStreamRef.current && localStreamRef.current.active) {
        console.log('✅ Reusing existing active stream');
        return localStreamRef.current;
      }
      
      console.log('🔍 Checking device availability...');
      const deviceInfo = await checkDeviceAvailability();
      
      if (!deviceInfo.hasVideo) {
        throw new Error('No video devices found');
      }
      
      console.log('📱 Device info:', deviceInfo);
      
      // If device is in use, try to force release it
      if (deviceInUseRetryCount > 0) {
        console.log('🔄 Device in use detected, attempting force release...');
        try {
          // Try to get a test stream and immediately release it
          const testStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          testStream.getTracks().forEach(track => track.stop());
          console.log('✅ Test stream released successfully');
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (testError) {
          console.log('⚠️ Test stream failed:', testError.message);
        }
      }
      
      const strategies = [
        getOptimalMediaConstraints(),
        createFallbackConstraints(),
        { video: true, audio: true },
        { video: { facingMode: 'user' }, audio: true },
        { video: true, audio: false },
        { video: { width: 640, height: 480 }, audio: true }
      ];
      
      let stream = null;
      let lastError = null;
      
      for (let i = 0; i < strategies.length; i++) {
        try {
          console.log(`🎯 Trying strategy ${i + 1}/${strategies.length}:`, strategies[i]);
          stream = await navigator.mediaDevices.getUserMedia(strategies[i]);
          console.log(`✅ Strategy ${i + 1} successful`);
          break;
        } catch (error) {
          console.log(`❌ Strategy ${i + 1} failed:`, error.name, error.message);
          lastError = error;
          
          if (error.name === 'NotReadableError' && i < strategies.length - 1) {
            console.log('⏳ Waiting before trying next strategy...');
            await new Promise(resolve => setTimeout(resolve, 2000)); // Increased delay
          }
        }
      }
      
      if (!stream) {
        console.error('❌ All strategies failed, last error:', lastError);
        if (lastError && lastError.name === 'NotReadableError') {
          setDeviceInUseRetryCount(prev => prev + 1);
        }
        throw lastError || new Error('All media constraint strategies failed');
      }
      
      const validation = validateMediaStream(stream);
      
      localStreamRef.current = stream;
      originalCameraStreamRef.current = stream;
      
      // Track stream globally for cleanup
      if (!window.localStreams) {
        window.localStreams = [];
      }
      window.localStreams.push(stream);
      
      // Reset retry count on success
      setDeviceInUseRetryCount(0);
      setWebrtcLocalStream(stream);
      
      if (localVideoRef.current) {
        try {
          localVideoRef.current.srcObject = null;
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.load();
          
          const playPromise = localVideoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
            }).catch(error => {
              setTimeout(() => {
                localVideoRef.current?.play().catch(err => {
                });
              }, 1000);
            });
          }
        } catch (error) {
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
  }, [releaseAllTracks, checkDeviceInUse, deviceInUseRetryCount]);

  // Enhanced end call function that includes media cleanup
  const endCallWithCleanup = useCallback(async (callId) => {
    console.log('🧹 Ending call with media cleanup...');
    try {
      // First release all media tracks
      await releaseAllTracks();
      console.log('✅ Media tracks released');
      
      // Force release all media devices
      await forceReleaseAllMediaDevices();
      console.log('✅ Media devices force released');
      
      // Then call the socket end call function
      if (callId) {
        endCallSocketFunction(callId);
      } else {
        endCallSocketFunction();
      }
      console.log('✅ Call ended via socket');
    } catch (error) {
      console.error('❌ Error during call cleanup:', error);
      // Still try to end the call even if cleanup fails
      if (callId) {
        endCallSocketFunction(callId);
      } else {
        endCallSocketFunction();
      }
    }
  }, [releaseAllTracks, forceReleaseAllMediaDevices, endCallSocketFunction]);

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
      console.log('📥 Remote track received:', event.track.kind, event.track.label);
      const [remoteStream] = event.streams;
      if (remoteStream) {
        console.log('📹 Remote stream received with tracks:', remoteStream.getTracks().map(t => t.kind));
        setWebrtcRemoteStream(remoteStream);
        
        if (remoteVideoRef.current) {
          try {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.muted = false;
            remoteVideoRef.current.load();
            
            const playPromise = remoteVideoRef.current.play();
            if (playPromise !== undefined) {
              playPromise.then(() => {
              }).catch(error => {
                setTimeout(() => {
                  remoteVideoRef.current?.play().catch(err => {
                  });
                }, 1000);
              });
            }
          } catch (error) {
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
    // Prevent multiple simultaneous initializations using ref lock
    if (initializationLockRef.current) {
      console.log('⏳ WebRTC initialization already in progress (ref lock), waiting...');
      // Wait a bit and try again
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (peerConnectionRef.current && localStreamRef.current) {
        console.log('✅ WebRTC already initialized after wait, reusing existing connection');
        return { stream: localStreamRef.current, pc: peerConnectionRef.current };
      }
      return null;
    }

    // Prevent multiple simultaneous initializations using state
    if (isInitializingWebRTC) {
      console.log('⏳ WebRTC initialization already in progress (state lock), waiting...');
      // Wait a bit and try again
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (peerConnectionRef.current && localStreamRef.current) {
        console.log('✅ WebRTC already initialized after wait, reusing existing connection');
        return { stream: localStreamRef.current, pc: peerConnectionRef.current };
      }
      return null;
    }

    // Limit initialization attempts to prevent infinite loops
    if (initializationAttempts >= 5) { // Increased limit
      console.error('❌ Too many WebRTC initialization attempts, giving up');
      // Reset attempts counter to allow future calls
      setInitializationAttempts(0);
      throw new Error('Too many initialization attempts. Please refresh the page.');
    }

    if (peerConnectionRef.current && localStreamRef.current) {
      console.log('✅ WebRTC already initialized, reusing existing connection');
      return { stream: localStreamRef.current, pc: peerConnectionRef.current };
    }

    try {
      // Set both locks
      initializationLockRef.current = true;
      setIsInitializingWebRTC(true);
      setInitializationAttempts(prev => prev + 1);
      console.log(`🎬 Initializing WebRTC... (Attempt ${initializationAttempts + 1}/3)`);
      
      console.log('📹 Getting local media stream...');
      const stream = await startLocalStream();
      if (!stream) {
        throw new Error('Failed to get local media stream');
      }
      console.log('✅ Local media stream obtained');
      
      console.log('🔗 Creating peer connection...');
      const pc = createPeerConnection();
      
      if (localStreamRef.current && pc.getSenders().length === 0) {
        console.log('📤 Adding tracks to peer connection...');
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current);
        });
      }
      
      if (!peerConnectionRef.current) {
        throw new Error('Peer connection was not created successfully');
      }
      
      console.log('✅ WebRTC initialized successfully');
      setInitializationAttempts(0); // Reset on success
      return { stream, pc: peerConnectionRef.current };
    } catch (error) {
      console.error('❌ WebRTC initialization failed:', error);
      
      // Handle specific device errors
      if (error.name === 'NotReadableError') {
        console.log('🔧 Device in use error detected, attempting recovery...');
        
        // Force cleanup and wait longer
        await releaseAllTracks();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try one more time with a longer delay
        if (initializationAttempts < 4) { // Increased retry limit
          console.log('🔄 Retrying WebRTC initialization after device cleanup...');
          await new Promise(resolve => setTimeout(resolve, 3000));
          // Don't increment attempts here, let the main loop handle it
          return initializeWebRTC();
        }
        
        throw new Error('Camera or microphone is being used by another application. Please close other applications and try again.');
      }
      
      throw error;
    } finally {
      // Release both locks
      initializationLockRef.current = false;
      setIsInitializingWebRTC(false);
    }
  }, [startLocalStream, createPeerConnection, isInitializingWebRTC, initializationAttempts]);

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

      // Always add local stream tracks when creating offer (for outgoing calls)
      if (localStreamRef.current) {
        const existingSenders = pc.getSenders();
        
        localStreamRef.current.getTracks().forEach(track => {
          const hasTrack = existingSenders.some(sender => sender.track === track);
          if (!hasTrack) {
            console.log(`📤 Adding ${track.kind} track to peer connection for offer`);
            pc.addTrack(track, localStreamRef.current);
          }
        });
      }

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      await pc.setLocalDescription(offer);
      
      return offer;
    } catch (error) {
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

      // Always add local stream tracks when creating answer (for incoming calls)
      if (localStreamRef.current) {
        const existingSenders = pc.getSenders();
        const hasVideoTrack = existingSenders.some(sender => sender.track?.kind === 'video');
        const hasAudioTrack = existingSenders.some(sender => sender.track?.kind === 'audio');
        
        localStreamRef.current.getTracks().forEach(track => {
          const hasTrack = existingSenders.some(sender => sender.track === track);
          if (!hasTrack) {
            console.log(`📤 Adding ${track.kind} track to peer connection for answer`);
            pc.addTrack(track, localStreamRef.current);
          }
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
        console.log(`🎥 Toggling video: ${newVideoEnabled ? 'enabled' : 'disabled'}`);
        videoTrack.enabled = newVideoEnabled;
        setWebrtcIsVideoEnabled(newVideoEnabled);
        
        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          console.log(`📤 Found ${senders.length} senders in peer connection`);
          
          const videoSender = senders.find(sender => 
            sender.track && sender.track.kind === 'video'
          );
          
          if (videoSender) {
            console.log(`🎥 Video sender found, setting enabled to: ${newVideoEnabled}`);
            videoSender.track.enabled = newVideoEnabled;
          } else {
            console.log('⚠️ No video sender found in peer connection');
          }
        } else {
          console.log('⚠️ No peer connection available');
        }
      } else {
        console.log('⚠️ No video track found in local stream');
      }
    } else {
      console.log('⚠️ No local stream available');
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

  // WebRTC socket event listeners setup
  useEffect(() => {
    if (!socket) return;

    const cleanup = setupWebRTCListeners(createAnswer, setRemoteDescription, addIceCandidate);
    
    return cleanup;
  }, [socket, setupWebRTCListeners, createAnswer, setRemoteDescription, addIceCandidate]);

  // Helper functions
  const stopCallSoundsWrapper = () => {
    stopCallSounds();
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
          return;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const offer = await createOffer();
      if (!offer) {
        return;
      }
      
      if (socket && activeCall?._id) {
        await sendSDPOffer(activeCall._id, offer);
      }
    } catch (error) {
      console.error('Error in WebRTC negotiation:', error);
    } finally {
      setIsNegotiating(false);
    }
  };

  // Call actions
  const startCall = async (chatId) => {
    try {
      console.log('🎥 Starting video call for chat:', chatId);
      console.log('🔍 Chat ID type and value:', typeof chatId, chatId);
      
      if (!socket) {
        throw new Error('Socket not connected');
      }

      // Navigate to caller page immediately
      if (!location.pathname.includes('/video-call/')) {
        navigate(`/video-call/caller/${chatId}`, { replace: true });
      }

      console.log('🔌 Socket connected, initializing WebRTC...');
      await initializeWebRTC();

      console.log('📡 Starting call via socket...');
      await startCallSocket(chatId, 'one-to-one');

      console.log('✅ Call started successfully');
      
      // Don't save temporary call data - wait for real call ID from server
      console.log('⏳ Waiting for real call ID from server...');
    } catch (error) {
      console.error('❌ Error starting call:', error);
      
      // Handle socket reconnection errors
      if (error.message.includes('Socket reconnection timeout') || error.message.includes('Socket not available')) {
        console.log('🔄 Socket reconnection failed, showing user-friendly message...');
        toast.error('Connection lost. Please check your internet connection and try again.', {
          duration: 5000,
          action: {
            label: 'Retry',
            onClick: () => {
              // Retry the call
              startCall(chatId);
            }
          }
        });
        throw error;
      }
      
      // Handle different types of media device errors
      if (error.message.includes('Device in use') || error.name === 'NotReadableError') {
        console.log('🔄 Device in use, attempting to release...');
        
        // Increment device in use retry count
        setDeviceInUseRetryCount(prev => prev + 1);
        
        // If we've tried too many times, give up
        if (deviceInUseRetryCount >= 2) {
          toast.error('Camera or microphone is being used by another application. Please close other apps and refresh the page.', {
            duration: 5000,
            action: {
              label: 'Refresh Page',
              onClick: () => window.location.reload()
            }
          });
          endCallSocket();
          return;
        }
        
        toast.error('Camera or microphone is being used by another application. Trying to release devices...', {
          duration: 3000,
        });
        
        try {
          // More aggressive cleanup
          releaseAllTracks();
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Try to get media again after cleanup
          try {
            const testStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            testStream.getTracks().forEach(track => track.stop());
            console.log('✅ Devices released successfully');
            toast.success('Devices released. Please try starting the call again.', {
              duration: 3000,
            });
          } catch (testError) {
            console.error('❌ Devices still in use:', testError);
            toast.error('Please close other applications using camera/microphone and refresh the page if needed.', {
              duration: 5000,
              action: {
                label: 'Refresh Page',
                onClick: () => window.location.reload()
              }
            });
          }
        } catch (releaseError) {
          console.error('❌ Failed to release devices:', releaseError);
          toast.error('Please close other applications using camera/microphone and refresh the page if needed.', {
            duration: 5000,
            action: {
              label: 'Refresh Page',
              onClick: () => window.location.reload()
            }
          });
        }
      } else if (error.message.includes('permission denied') || error.name === 'NotAllowedError') {
        toast.error('Camera and microphone access denied. Please allow access and try again.');
      } else if (error.message.includes('not found') || error.name === 'NotFoundError') {
        toast.error('No camera or microphone found. Please check your devices.');
      } else if (error.name === 'AbortError') {
        toast.error('Camera or microphone access was interrupted. Please try again.');
      } else if (error.name === 'OverconstrainedError') {
        toast.error('Camera settings are not supported. Please try again.');
      } else {
        toast.error('Failed to start call: ' + error.message);
      }
      
      endCallSocket();
    }
  };

  const acceptCall = async () => {
    if (!socket || !incomingCall) {
      console.error('❌ Cannot accept call: missing socket or incomingCall', { socket: !!socket, incomingCall: !!incomingCall });
      return;
    }

    console.log('📞 Accepting call with data:', incomingCall);

    try {
      console.log('🔇 Stopping call sounds...');
      stopCallSounds();
      
      console.log('🔧 Initializing WebRTC...');
      await initializeWebRTC();

      // Use the correct callId from incomingCall
      const callId = incomingCall.callId || incomingCall._id;
      if (!callId) {
        throw new Error('Call ID not found in incoming call data');
      }

      console.log('📡 Joining call socket with callId:', callId);
      await joinCallSocket(callId);

      // Don't navigate when accepting a call - stay on current page
      // The handleCallJoined function will handle the proper state transition
      console.log('🎯 Call accepted - staying on current page for state transition');
      
      console.log('✅ Call accepted successfully');
    } catch (error) {
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
      
      endCallSocket();
    }
  };

  const rejectCall = async () => {
    if (!socket || !incomingCall) return;

    const callId = incomingCall.callId || incomingCall._id;
    if (!callId) {
      console.error('❌ Call ID not found in incoming call data');
      return;
    }

    console.log('📞 Rejecting call...');
    
    // Reset initialization attempts counter
    setInitializationAttempts(0);
    
    // Release media tracks before rejecting
    await releaseAllTracks();
    
    rejectCallSocket(callId);
  };

  const cancelCall = async () => {
    if (!socket || !outgoingCall) return;

    const callId = outgoingCall.callId || outgoingCall._id;
    if (!callId) {
      console.error('❌ Call ID not found in outgoing call data');
      return;
    }

    console.log('📞 Cancelling call...');
    
    // Reset initialization attempts counter
    setInitializationAttempts(0);
    
    // Release media tracks before cancelling
    await releaseAllTracks();
    
    // Use the enhanced end call function that includes media cleanup
    endCallWithCleanup(callId);
  };

  const endActiveCall = async () => {
    if (!socket || !activeCall) return;

    const callId = activeCall._id || activeCall.callId;
    if (!callId) {
      console.error('❌ Call ID not found in active call data');
      return;
    }

    console.log('📞 Ending active call and cleaning up...');
    
    // Reset initialization attempts counter
    setInitializationAttempts(0);
    
    // Use the enhanced end call function that includes media cleanup
    await endCallWithCleanup(callId);
    
    console.log('✅ Call ended and cleanup completed');
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

  // Timer for call duration
  useEffect(() => {
    let interval;
    if (socketCallStatus === 'connected') {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    } else {
      setTimeElapsed(0);
    }
    return () => clearInterval(interval);
  }, [socketCallStatus]);

  // Auto cleanup when call status changes to idle or ends
  useEffect(() => {
    if (socketCallStatus === 'idle' || !socketCallStatus || socketCallStatus === 'ended') {
      console.log('🧹 Call status changed to idle/ended, releasing media tracks...');
      releaseAllTracks();
    }
  }, [socketCallStatus, releaseAllTracks]);

  // Cleanup on unmount and page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('🧹 Page unloading, releasing media tracks...');
      releaseAllTracks();
    };

    const handlePageHide = () => {
      console.log('🧹 Page hidden, releasing media tracks...');
      releaseAllTracks();
    };

    // Add event listeners for page unload
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      console.log('🧹 useCall hook unmounting, cleaning up...');
      releaseAllTracks();
      
      // Remove event listeners
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [releaseAllTracks]);

  return {
    // State
    user,
    activeCall,
    outgoingCall,
    incomingCall,
    callStatus: socketCallStatus,
    localStream: localStream || webrtcLocalStream,
    remoteStream: remoteStream || webrtcRemoteStream,
    isMuted: isMuted || webrtcIsMuted,
    isVideoEnabled: isVideoEnabled || webrtcIsVideoEnabled,
    isScreenSharing: isScreenSharing || webrtcIsScreenSharing,
    timeElapsed,
    participants,
    errors,
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
    endCall: endCallSocketFunction,
    endCallWithCleanup,
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
    forceReleaseAllMediaDevices,
    
    // Socket functions
    socket,
    startCallSocket,
    joinCallSocket,
    rejectCallSocket,
    endCallSocket,
    sendSDPOffer,
    sendSDPAnswer,
    sendICECandidate,
    
    // Mutation states
    isDeleting: deleteCallMutation.isPending,
    isClearing: clearAllMutation.isPending,
  };
};
