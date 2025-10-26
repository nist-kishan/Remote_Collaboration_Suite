import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallSocket } from './useCallSocket';
import { toast } from 'react-hot-toast';
import { isExtensionError } from '../utils/errorHandler';
import { WEBRTC_CONFIG, REALTIME_CONFIG } from '../config/environment';
import {  
  getOptimalMediaConstraints, 
  validateMediaStream,
  createFallbackConstraints 
} from '../utils/mediaUtils';
import {
  getCallHistory,
  deleteCallHistory,
  clearCallHistory,
} from '../api/callApi';
import {
  // Redux actions
  setLocalStream,
  setRemoteStream,
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
    try {
      // Stop all local stream tracks
      if (localStreamRef.current) {
        const tracks = localStreamRef.current.getTracks();
        tracks.forEach(track => {
          track.stop();
        });
        localStreamRef.current = null;
        setWebrtcLocalStream(null);
      }
      
      // Also stop any remaining tracks from localStream (from Redux state)
      if (localStream && localStream.getTracks) {
        const tracks = localStream.getTracks();
        tracks.forEach(track => {
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
            track.stop();
          });
        });
        
        // Clear any global stream references
        if (window.localStreams) {
          window.localStreams = [];
        }
      } catch (error) {
        // Error in force cleanup
      }
      
      // Wait a bit for devices to be released
      await new Promise(resolve => setTimeout(resolve, 1000)); // Increased wait time
      
      // Verify devices are released
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        // Devices enumerated after cleanup
      } catch (error) {
        // Device enumeration failed
      }
      
      // All tracks released
    } catch (error) {
      // Error releasing tracks
    }
  }, [localStream]);

  // Force release all media devices
  const forceReleaseAllMediaDevices = useCallback(async () => {
    try {
      // Get all active media streams from the browser
      const allTracks = [];
      
      // Check for any remaining active tracks
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        try {
          // This is a fallback to ensure all tracks are stopped
          const testStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          testStream.getTracks().forEach(track => {
            track.stop();
          });
        } catch (error) {
          // This is expected if devices are already in use
          console.log('Media devices test failed:', error);
        }
      }
      
      // Force garbage collection
      if (window.gc) {
        window.gc();
      }
      
      // Wait for devices to be fully released
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
      return false;
    } catch (error) {
      if (error.name === 'NotReadableError') {
        return true;
      }
      return false;
    }
  }, []);

  const startLocalStream = useCallback(async () => {
    try {
      console.log('🎥 Starting local media stream...');
      
      // Check if devices are in use first
      const devicesInUse = await checkDeviceInUse();
      if (devicesInUse) {
        console.error('❌ Devices are in use');
        throw new Error('Camera or microphone is being used by another application. Please close other applications and try again.');
      }
      
      // More aggressive cleanup
      console.log('🧹 Cleaning up existing streams...');
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
      console.log('📱 Available devices:', deviceInfo);
      
      if (!deviceInfo.hasVideo) {
        console.error('❌ No video devices found');
        throw new Error('No video devices found');
      }
      
      // If device is in use, try to force release it
      if (deviceInUseRetryCount > 0) {
        try {
          // Try to get a test stream and immediately release it
          const testStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          testStream.getTracks().forEach(track => track.stop());
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (testError) {
          }
      }
      
      console.log('🎬 Requesting media stream with optimal constraints...');
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
          console.log(`📝 Trying constraint strategy ${i + 1}/${strategies.length}`);
          stream = await navigator.mediaDevices.getUserMedia(strategies[i]);
          console.log('✅ Media stream obtained successfully');
          
          // Log stream details
          const tracks = stream.getTracks();
          console.log('📹 Stream tracks:', tracks.map(t => `${t.kind} - ${t.label} (${t.enabled ? 'enabled' : 'disabled'})`));
          break;
        } catch (error) {
          lastError = error;
          console.warn(`⚠️ Strategy ${i + 1} failed:`, error.name, error.message);
          
          if (error.name === 'NotReadableError' && i < strategies.length - 1) {
            console.log('⏳ Waiting for devices to be released...');
            await new Promise(resolve => setTimeout(resolve, 2000));
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
      
      console.log('🔍 Validating media stream...');
      const validation = validateMediaStream(stream);
      console.log('✅ Stream validation:', validation);
      
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
      dispatch(setLocalStream(stream));
      
      console.log('🎬 Setting local video element source...');
      if (localVideoRef.current) {
        try {
          // Clear previous stream
          if (localVideoRef.current.srcObject) {
            const oldStream = localVideoRef.current.srcObject;
            oldStream.getTracks().forEach(track => track.stop());
          }
          
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.autoplay = true;
          localVideoRef.current.muted = true; // Mute local video to prevent feedback
          localVideoRef.current.playsInline = true;
          
          const playPromise = localVideoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              console.log('✅ Local video playing');
            }).catch(error => {
              console.warn('⚠️ Local video play failed, retrying...', error);
              setTimeout(() => {
                localVideoRef.current?.play().catch(err => {
                  console.error('❌ Local video retry failed:', err);
                });
              }, 1000);
            });
          }
        } catch (error) {
          console.error('❌ Error setting local video stream:', error);
        }
      } else {
        console.warn('⚠️ Local video ref not available');
      }
      
      console.log('✅ Local stream started successfully');
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
    try {
      // First release all media tracks
      await releaseAllTracks();
      // Force release all media devices
      await forceReleaseAllMediaDevices();
      // Then call the socket end call function
      if (callId) {
        endCallSocketFunction(callId);
      } else {
        endCallSocketFunction();
      }
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
      console.log('⚠️ Closing existing peer connection');
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    console.log('🔄 Creating new peer connection with ICE servers:', WEBRTC_CONFIG.ICE_SERVERS);
    
    const configuration = {
      iceServers: WEBRTC_CONFIG.ICE_SERVERS.map(server => ({ urls: server })),
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    };

    const pc = new RTCPeerConnection(configuration);
    console.log('✅ Peer connection created');
    
    peerConnectionRef.current = pc;

    // Add local stream tracks to peer connection
    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getTracks();
      console.log('📹 Adding local tracks to peer connection:', tracks.length, tracks.map(t => t.kind));
      
      tracks.forEach(track => {
        try {
          pc.addTrack(track, localStreamRef.current);
          console.log('✅ Added track:', track.kind, track.id);
        } catch (error) {
          console.error('❌ Error adding track:', track.kind, error);
        }
      });
    } else {
      console.warn('⚠️ No local stream available when creating peer connection');
    }

    // Handle remote stream when receiving tracks
    pc.ontrack = (event) => {
      console.log('📥 Received remote track:', event.track.kind, event.track.id);
      
      const [remoteStream] = event.streams;
      if (remoteStream) {
        console.log('✅ Remote stream received with tracks:', remoteStream.getTracks().map(t => `${t.kind} (${t.id})`));
        
        // Update both local state and Redux state
        setWebrtcRemoteStream(remoteStream);
        dispatch(setRemoteStream(remoteStream));
        
        if (remoteVideoRef.current) {
          try {
            console.log('🎬 Setting remote video element source');
            // Clear previous stream first
            if (remoteVideoRef.current.srcObject) {
              const oldStream = remoteVideoRef.current.srcObject;
              oldStream.getTracks().forEach(track => track.stop());
            }
            
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.muted = false;
            remoteVideoRef.current.autoplay = true;
            remoteVideoRef.current.playsInline = true;
            
            const playPromise = remoteVideoRef.current.play();
            if (playPromise !== undefined) {
              playPromise.then(() => {
                console.log('✅ Remote video playing');
              }).catch(error => {
                console.warn('⚠️ Remote video play failed, retrying...', error);
                setTimeout(() => {
                  remoteVideoRef.current?.play().catch(err => {
                    console.error('❌ Remote video retry failed:', err);
                  });
                }, 1000);
              });
            }
          } catch (error) {
            console.error('❌ Error setting remote video stream:', error);
          }
        } else {
          console.warn('⚠️ Remote video ref not available');
        }
      }
    };

    // Handle ICE candidates for NAT traversal
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && socket.connected) {
        console.log('🧊 Sending ICE candidate:', event.candidate.candidate.substring(0, 50) + '...');
        socket.emit('ice_candidate', {
          candidate: event.candidate
        });
      } else if (event.candidate === null) {
        console.log('✅ ICE gathering complete');
      }
    };

    // Handle ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state changed:', pc.iceConnectionState);
      
      if (pc.iceConnectionState === 'failed') {
        console.error('❌ ICE connection failed');
        // Try to restart ICE
        pc.restartIce();
      } else if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        console.log('✅ ICE connection established');
      }
    };

    // Handle signaling state changes
    pc.onsignalingstatechange = () => {
      console.log('📡 Signaling state changed:', pc.signalingState);
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [socket]);

  const initializeWebRTC = useCallback(async () => {
    // Prevent multiple simultaneous initializations using ref lock
    if (initializationLockRef.current) {
      console.log('WebRTC initialization already in progress, waiting...');
      // Wait a bit and try again
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (peerConnectionRef.current && localStreamRef.current) {
        return { stream: localStreamRef.current, pc: peerConnectionRef.current };
      }
      return null;
    }

    // Prevent multiple simultaneous initializations using state
    if (isInitializingWebRTC) {
      console.log('WebRTC initialization already in progress, waiting...');
      // Wait a bit and try again
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (peerConnectionRef.current && localStreamRef.current) {
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
      return { stream: localStreamRef.current, pc: peerConnectionRef.current };
    }

    try {
      // Set both locks
      initializationLockRef.current = true;
      setIsInitializingWebRTC(true);
      setInitializationAttempts(prev => prev + 1);
      console.log('Initializing WebRTC...');
      
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
      
      setInitializationAttempts(0); // Reset on success
      return { stream, pc: peerConnectionRef.current };
    } catch (error) {
      console.error('❌ WebRTC initialization failed:', error);
      
      // Handle specific device errors
      if (error.name === 'NotReadableError') {
        // Force cleanup and wait longer
        await releaseAllTracks();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try one more time with a longer delay
        if (initializationAttempts < 4) { // Increased retry limit
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
        videoTrack.enabled = newVideoEnabled;
        setWebrtcIsVideoEnabled(newVideoEnabled);
        
        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find(sender => 
            sender.track && sender.track.kind === 'video'
          );
          
          if (videoSender) {
            videoSender.track.enabled = newVideoEnabled;
          } else {
            }
        } else {
          }
      } else {
        }
    } else {
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
  const startCall = async (chatId, retryCount = 0) => {
    try {
      console.log('Starting call for chat:', chatId);
      if (!socket) {
        throw new Error('Socket not connected');
      }

      // Navigate to caller page immediately
      if (!location.pathname.includes('/video-call/')) {
        navigate('/video-call/caller/' + chatId, { replace: true });
      }

      await initializeWebRTC();

      await startCallSocket(chatId, 'one-to-one');

      // Don't save temporary call data - wait for real call ID from server
      } catch (error) {
        console.error('Error starting call (attempt ' + (retryCount + 1) + '):', error);
        
        // Handle socket reconnection errors with retry
        if (error.message.includes('Socket reconnection timeout') || error.message.includes('Socket not available')) {
          if (retryCount < 2) {
            console.log('Retrying call start...');
          toast.error('Connection lost. Retrying... (' + (retryCount + 1) + '/3)', {
            duration: 3000,
          });
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
          return startCall(chatId, retryCount + 1);
        } else {
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
      }
      
      // Handle different types of media device errors
      if (error.message.includes('Device in use') || error.name === 'NotReadableError') {
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

    try {
      stopCallSounds();
      
      await initializeWebRTC();

      // Use the correct callId from incomingCall
      const callId = incomingCall.callId || incomingCall._id;
      if (!callId) {
        throw new Error('Call ID not found in incoming call data');
      }

      await joinCallSocket(callId);

      // Don't navigate when accepting a call - stay on current page
      // The handleCallJoined function will handle the proper state transition
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

    // Reset initialization attempts counter
    setInitializationAttempts(0);
    
    // Use the enhanced end call function that includes media cleanup
    await endCallWithCleanup(callId);
    
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
    return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
  };

  const formatDate = (date) => {
    const callDate = new Date(date);
    const now = new Date();
    const diffInDays = Math.floor((now - callDate) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today, ' + callDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday, ' + callDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
    
    return statusText[status] + ' with ' + otherParticipant.name;
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
      releaseAllTracks();
    }
  }, [socketCallStatus, releaseAllTracks]);

  // Cleanup on unmount and page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      releaseAllTracks();
    };

    const handlePageHide = () => {
      releaseAllTracks();
    };

    // Add event listeners for page unload
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
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
