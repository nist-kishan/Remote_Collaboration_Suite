import { useRef, useState, useEffect, useCallback } from 'react';
import { isExtensionError } from '../utils/errorHandler';
import { 
  checkMediaDevices, 
  requestMediaPermissions, 
  getOptimalMediaConstraints, 
  validateMediaStream,
  createFallbackConstraints 
} from '../utils/mediaUtils';

export const useWebRTC = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const originalCameraStreamRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const releaseAllTracks = useCallback(() => {
    // Stop any existing local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        // Remove track from stream
        localStreamRef.current.removeTrack(track);
      });
      localStreamRef.current = null;
      setLocalStream(null);
    }
    
    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Reset states
    setRemoteStream(null);
    setIsVideoEnabled(true);
    setIsScreenSharing(false);
    
  }, []);

  const checkDeviceAvailability = useCallback(async () => {
    try {
      // Check if devices are available
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
      
      // First, release any existing tracks
      releaseAllTracks();
      
      // Wait longer for cleanup
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check available devices
      const deviceInfo = await checkDeviceAvailability();
      
      if (!deviceInfo.hasVideo) {
        throw new Error('No video devices found');
      }
      
      // Try different constraint strategies
      const strategies = [
        getOptimalMediaConstraints(),
        createFallbackConstraints(),
        { video: true, audio: true }, // Basic constraints
        { video: { facingMode: 'user' }, audio: true }, // Front camera only
        { video: true, audio: false } // Video only
      ];
      
      let stream = null;
      let lastError = null;
      
      for (let i = 0; i < strategies.length; i++) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(strategies[i]);
          break;
        } catch (error) {
          lastError = error;
          
          // If device is in use, wait a bit and try again
          if (error.name === 'NotReadableError' && i < strategies.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      if (!stream) {
        throw lastError || new Error('All media constraint strategies failed');
      }
      

      // Validate stream using utility function
      const validation = validateMediaStream(stream);
      
      localStreamRef.current = stream;
      originalCameraStreamRef.current = stream; // Store original camera stream
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        try {
          console.log('Setting local video stream:', stream);
          console.log('Video tracks:', stream.getVideoTracks());
          console.log('Audio tracks:', stream.getAudioTracks());
          
          // Clear any existing stream first
          localVideoRef.current.srcObject = null;
          
          // Set new stream
          localVideoRef.current.srcObject = stream;
          
          // Force video to load and play
          localVideoRef.current.load(); // Force reload
          
          // Ensure video plays with better error handling
          const playPromise = localVideoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              console.log('Local video playing successfully');
            }).catch(error => {
              console.error('Error playing local video:', error);
              // Try again after a short delay
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
      } else {
        console.warn('Local video ref not available');
      }
      
      return stream;
    } catch (error) {
      // Check if this is a browser extension error
      if (isExtensionError(error)) {
        return null;
      }
      
      
      // Provide more specific error messages
      if (error.name === 'NotAllowedError') {
        throw new Error('Camera and microphone access denied. Please allow access and try again.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No camera or microphone found. Please check your devices.');
      } else if (error.name === 'NotReadableError') {
        throw new Error('Camera or microphone is being used by another application.');
      }
      
      throw error;
    }
  }, []);

  const stopLocalStream = useCallback(() => {
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      localStreamRef.current = null;
      setLocalStream(null);
    }
    
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        const newVideoEnabled = !isVideoEnabled;
        videoTrack.enabled = newVideoEnabled;
        setIsVideoEnabled(newVideoEnabled);
        
        // Update peer connection senders
        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find(sender => 
            sender.track && sender.track.kind === 'video'
          );
          
          if (videoSender) {
            console.log('Updating video sender track enabled:', newVideoEnabled);
            videoSender.track.enabled = newVideoEnabled;
          }
        }
        
        console.log('Video toggled:', newVideoEnabled ? 'ON' : 'OFF');
      }
    }
  }, [isVideoEnabled]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMuted;
        setIsMuted(!isMuted);
      }
    }
  }, [isMuted]);


  const startScreenShare = useCallback(async () => {
    try {
      console.log('Starting screen share...');
      
      // Get screen share stream
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor'
        },
        audio: true
      });
      
      console.log('Screen share stream obtained:', screenStream);
      
      // Store the original camera stream for later restoration
      const originalStream = localStreamRef.current;
      
      // Replace video track in peer connection
      const videoTrack = screenStream.getVideoTracks()[0];
      const audioTrack = screenStream.getAudioTracks()[0];
      
      if (peerConnectionRef.current) {
        const videoSender = peerConnectionRef.current.getSenders().find(
          s => s.track?.kind === 'video'
        );
        const audioSender = peerConnectionRef.current.getSenders().find(
          s => s.track?.kind === 'audio'
        );
        
        // Replace video track
        if (videoSender && videoTrack) {
          await videoSender.replaceTrack(videoTrack);
          console.log('Video track replaced with screen share');
        }
        
        // Replace audio track if available
        if (audioSender && audioTrack) {
          await audioSender.replaceTrack(audioTrack);
          console.log('Audio track replaced with screen share audio');
        }
      }
      
      // Update local video display
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }
      
      // Store screen stream reference
      localStreamRef.current = screenStream;
      setLocalStream(screenStream);
      setIsScreenSharing(true);
      
      console.log('Screen sharing started successfully');
      
      // Handle screen share end
      videoTrack.onended = () => {
        console.log('Screen share ended by user');
        stopScreenShare();
      };
      
      return screenStream;
    } catch (error) {
      console.error('Error starting screen share:', error);
      
      // Check if this is a browser extension error
      if (isExtensionError(error)) {
        return null;
      }
      
      throw error;
    }
  }, []);

  const stopScreenShare = useCallback(async () => {
    try {
      console.log('Stopping screen share...');
      
      let cameraStream = null;
      
      // Try to use the original camera stream if available
      if (originalCameraStreamRef.current && !originalCameraStreamRef.current.getTracks().some(track => track.readyState === 'ended')) {
        console.log('Using original camera stream for restoration');
        cameraStream = originalCameraStreamRef.current;
      } else {
        // Get new camera stream if original is not available
        console.log('Getting new camera stream for restoration');
        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          },
          audio: true
        });
      }
      
      console.log('Camera stream obtained for restoration:', cameraStream);
      
      // Replace tracks in peer connection
      const videoTrack = cameraStream.getVideoTracks()[0];
      const audioTrack = cameraStream.getAudioTracks()[0];
      
      if (peerConnectionRef.current) {
        const videoSender = peerConnectionRef.current.getSenders().find(
          s => s.track?.kind === 'video'
        );
        const audioSender = peerConnectionRef.current.getSenders().find(
          s => s.track?.kind === 'audio'
        );
        
        // Replace video track
        if (videoSender && videoTrack) {
          await videoSender.replaceTrack(videoTrack);
          console.log('Video track restored to camera');
        }
        
        // Replace audio track
        if (audioSender && audioTrack) {
          await audioSender.replaceTrack(audioTrack);
          console.log('Audio track restored to microphone');
        }
      }
      
      // Update local video display
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = cameraStream;
      }
      
      // Update stream reference
      localStreamRef.current = cameraStream;
      setLocalStream(cameraStream);
      setIsScreenSharing(false);
      
      console.log('Screen sharing stopped successfully');
    } catch (error) {
      console.error('Error stopping screen share:', error);
      // Even if restoration fails, mark screen sharing as stopped
      setIsScreenSharing(false);
    }
  }, []);

  const createPeerConnection = useCallback(() => {
    // Close existing peer connection if any
    if (peerConnectionRef.current) {
      console.log('Closing existing peer connection');
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

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        console.log('Adding track to peer connection:', track.kind, track.label);
        pc.addTrack(track, localStreamRef.current);
      });
    } else {
      console.warn('No local stream available when creating peer connection');
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('=== REMOTE TRACK RECEIVED ===');
      console.log('Received remote track:', event);
      console.log('Track kind:', event.track.kind);
      console.log('Track enabled:', event.track.enabled);
      console.log('Track readyState:', event.track.readyState);
      console.log('Streams:', event.streams);
      console.log('Stream count:', event.streams.length);
      
      const [remoteStream] = event.streams;
      if (remoteStream) {
        console.log('Remote stream tracks:', remoteStream.getTracks());
        console.log('Remote stream active:', remoteStream.active);
        setRemoteStream(remoteStream);
        
        if (remoteVideoRef.current) {
          try {
            console.log('Setting remote video stream to element:', remoteVideoRef.current);
            remoteVideoRef.current.srcObject = remoteStream;
            
            // Ensure audio is not muted for remote stream
            remoteVideoRef.current.muted = false;
            
            // Force video to load
            remoteVideoRef.current.load();
            
            // Ensure video plays with better error handling
            const playPromise = remoteVideoRef.current.play();
            if (playPromise !== undefined) {
              playPromise.then(() => {
                console.log('Remote video playing successfully');
              }).catch(error => {
                console.error('Error playing remote video:', error);
                // Try again after a short delay
                setTimeout(() => {
                  remoteVideoRef.current?.play().catch(err => {
                    console.error('Retry failed:', err);
                  });
                }, 1000);
              });
            }
            
            console.log('Remote video stream set successfully');
          } catch (error) {
            console.error('Error setting remote video stream:', error);
          }
        } else {
          console.warn('Remote video ref not available');
        }
      } else {
        console.warn('No remote stream received in event');
      }
      console.log('=== END REMOTE TRACK ===');
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to peer via socket
        // This will be handled by the parent component that has access to socket
        if (window.currentSocket) {
          window.currentSocket.emit('ice_candidate', {
            candidate: event.candidate
          });
        }
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('=== CONNECTION STATE CHANGED ===');
      console.log('Connection state:', pc.connectionState);
      console.log('ICE connection state:', pc.iceConnectionState);
      console.log('Signaling state:', pc.signalingState);
      console.log('===============================');
    };

    // Handle ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log('=== ICE CONNECTION STATE CHANGED ===');
      console.log('ICE connection state:', pc.iceConnectionState);
      console.log('Connection state:', pc.connectionState);
      console.log('===================================');
    };

    // Handle ICE gathering state changes
    pc.onicegatheringstatechange = () => {
      console.log('=== ICE GATHERING STATE CHANGED ===');
      console.log('ICE gathering state:', pc.iceGatheringState);
      console.log('==================================');
    };

    peerConnectionRef.current = pc;
    return pc;
  }, []);

  const initializeWebRTC = useCallback(async () => {
    try {
      console.log('Initializing WebRTC...');
      
      // Start local stream first
      const stream = await startLocalStream();
      if (!stream) {
        throw new Error('Failed to get local media stream');
      }
      
      console.log('Local stream obtained, creating peer connection...');
      
      // Create peer connection
      const pc = createPeerConnection();
      
      // Ensure tracks are added immediately
      if (localStreamRef.current && pc.getSenders().length === 0) {
        console.log('Adding tracks to peer connection during initialization');
        localStreamRef.current.getTracks().forEach(track => {
          console.log('Adding track during init:', track.kind, track.label);
          pc.addTrack(track, localStreamRef.current);
        });
      }
      
      // Verify peer connection is created and ready
      if (!peerConnectionRef.current) {
        throw new Error('Peer connection was not created successfully');
      }
      
      console.log('WebRTC initialized successfully with peer connection:', peerConnectionRef.current);
      return { stream, pc: peerConnectionRef.current };
    } catch (error) {
      console.error('WebRTC initialization failed:', error);
      throw error;
    }
  }, [startLocalStream, createPeerConnection]);

  const createOffer = useCallback(async () => {
    try {
      if (!peerConnectionRef.current) {
        console.error('No peer connection available - peerConnectionRef.current is:', peerConnectionRef.current);
        throw new Error('No peer connection available');
      }

      // Check if peer connection is in a valid state for creating offers
      const pc = peerConnectionRef.current;
      console.log('Peer connection state:', pc.signalingState, 'connection state:', pc.connectionState);
      
      if (pc.signalingState === 'closed') {
        throw new Error('Peer connection is closed');
      }

      // Only create offer if we're in stable or have-local-offer state
      if (pc.signalingState !== 'stable' && pc.signalingState !== 'have-local-offer') {
        console.log('Peer connection not in stable state for offer creation:', pc.signalingState);
        return null;
      }

      // Ensure local stream is added to peer connection
      if (localStreamRef.current && pc.getSenders().length === 0) {
        console.log('Adding local stream tracks to peer connection for offer');
        localStreamRef.current.getTracks().forEach(track => {
          console.log('Adding track for offer:', track.kind, track.label);
          pc.addTrack(track, localStreamRef.current);
        });
      }

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      await pc.setLocalDescription(offer);
      console.log('Offer created and set as local description');
      
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
      
      // Check if peer connection is in a valid state for creating answers
      if (pc.signalingState === 'closed') {
        throw new Error('Peer connection is closed');
      }

      // Only create answer if we're in have-remote-offer state
      if (pc.signalingState !== 'have-remote-offer') {
        console.log('Peer connection not in correct state for answer creation:', pc.signalingState);
        return null;
      }

      // Ensure local stream is added to peer connection
      if (localStreamRef.current && pc.getSenders().length === 0) {
        console.log('Adding local stream tracks to peer connection for answer');
        localStreamRef.current.getTracks().forEach(track => {
          console.log('Adding track for answer:', track.kind, track.label);
          pc.addTrack(track, localStreamRef.current);
        });
      }

      await pc.setRemoteDescription(offer);
      console.log('Remote description set for answer');
      
      const answer = await pc.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      await pc.setLocalDescription(answer);
      console.log('Answer created and set as local description');
      
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
      
      // Check if peer connection is in a valid state
      if (pc.signalingState === 'closed') {
        throw new Error('Peer connection is closed');
      }

      await pc.setRemoteDescription(description);
      console.log('Remote description set successfully');
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

  useEffect(() => {
    return () => {
      releaseAllTracks();
    };
  }, [releaseAllTracks]);

  const forceReleaseDevices = useCallback(async () => {
    
    // Release all tracks
    releaseAllTracks();
    
    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try to enumerate devices to trigger cleanup
    try {
      await navigator.mediaDevices.enumerateDevices();
    } catch (error) {
    }
    
  }, [releaseAllTracks]);

  // Check if WebRTC is properly initialized
  const isWebRTCReady = useCallback(() => {
    const hasPeerConnection = peerConnectionRef.current !== null;
    const hasLocalStream = localStreamRef.current !== null;
    const hasVideoRef = localVideoRef.current !== null;
    
    console.log('WebRTC Ready Check:', {
      hasPeerConnection,
      hasLocalStream,
      hasVideoRef,
      peerConnectionState: peerConnectionRef.current?.connectionState,
      localStreamTracks: localStreamRef.current?.getTracks().length
    });
    
    return hasPeerConnection && hasLocalStream;
  }, []);

  // Check if WebRTC connection is established
  const isWebRTCConnected = useCallback(() => {
    if (!peerConnectionRef.current) return false;
    return peerConnectionRef.current.connectionState === 'connected' || 
           peerConnectionRef.current.iceConnectionState === 'connected';
  }, []);

  // Check if remote stream is available
  const hasRemoteStream = useCallback(() => {
    return remoteStream !== null && remoteStream.getTracks().length > 0;
  }, [remoteStream]);

  // Debug function to check WebRTC status
  const debugWebRTCStatus = useCallback(() => {
    console.log('=== WebRTC Debug Status ===');
    console.log('Local stream:', localStreamRef.current);
    console.log('Remote stream:', remoteStream);
    console.log('Peer connection:', peerConnectionRef.current);
    console.log('WebRTC Ready:', isWebRTCReady());
    
    if (localStreamRef.current) {
      console.log('Local tracks:', localStreamRef.current.getTracks());
      localStreamRef.current.getTracks().forEach(track => {
        console.log(`Local ${((track.kind))}: enabled=${track.enabled}, readyState=${track.readyState}, label=${track.label}`);
      });
    }
    
    if (peerConnectionRef.current) {
      console.log('Connection state:', peerConnectionRef.current.connectionState);
      console.log('ICE connection state:', peerConnectionRef.current.iceConnectionState);
      console.log('Signaling state:', peerConnectionRef.current.signalingState);
      console.log('ICE gathering state:', peerConnectionRef.current.iceGatheringState);
      console.log('Senders:', peerConnectionRef.current.getSenders());
      peerConnectionRef.current.getSenders().forEach(sender => {
        console.log(`Sender ${sender.track?.kind}: enabled=${sender.track?.enabled}, label=${sender.track?.label}`);
      });
      console.log('Receivers:', peerConnectionRef.current.getReceivers());
      peerConnectionRef.current.getReceivers().forEach(receiver => {
        console.log(`Receiver ${receiver.track?.kind}: enabled=${receiver.track?.enabled}, readyState=${receiver.track?.readyState}, label=${receiver.track?.label}`);
      });
    }
    
    if (remoteStream) {
      console.log('Remote stream active:', remoteStream.active);
      console.log('Remote tracks:', remoteStream.getTracks());
      remoteStream.getTracks().forEach(track => {
        console.log(`Remote ${track.kind}: enabled=${track.enabled}, readyState=${track.readyState}, label=${track.label}`);
      });
    }
    
    console.log('Local video element:', localVideoRef.current);
    console.log('Local video srcObject:', localVideoRef.current?.srcObject);
    console.log('Remote video element:', remoteVideoRef.current);
    console.log('Remote video srcObject:', remoteVideoRef.current?.srcObject);
    console.log('Remote video muted:', remoteVideoRef.current?.muted);
    console.log('Remote video paused:', remoteVideoRef.current?.paused);
    console.log('Remote video readyState:', remoteVideoRef.current?.readyState);
    console.log('========================');
  }, [remoteStream, isWebRTCReady]);

  // Force restart WebRTC negotiation
  const forceRestartWebRTC = useCallback(async () => {
    console.log('Force restarting WebRTC...');
    try {
      // Close existing peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      
      // Clear remote stream
      setRemoteStream(null);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      
      // Reinitialize WebRTC
      await initializeWebRTC();
      console.log('WebRTC force restart completed');
    } catch (error) {
      console.error('Error force restarting WebRTC:', error);
    }
  }, [initializeWebRTC]);

  return {
    localVideoRef,
    remoteVideoRef,
    localStream,
    remoteStream,
    isVideoEnabled,
    isScreenSharing,
    isMuted,
    startLocalStream,
    stopLocalStream,
    releaseAllTracks,
    forceReleaseDevices,
    checkDeviceAvailability,
    toggleVideo,
    toggleMute,
    startScreenShare,
    stopScreenShare,
    createPeerConnection,
    initializeWebRTC,
    createOffer,
    createAnswer,
    setRemoteDescription,
    addIceCandidate,
    peerConnection: peerConnectionRef.current,
    debugWebRTCStatus,
    isWebRTCReady,
    isWebRTCConnected,
    hasRemoteStream,
    forceRestartWebRTC
  };
};

