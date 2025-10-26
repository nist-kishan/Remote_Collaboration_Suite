import { useEffect, useRef, useCallback, useState } from 'react';
import { useSocket } from './useSocket';
import { toast } from 'react-hot-toast';

/**
 * Clean WebRTC Hook - Refactored for Reliability
 * Handles peer-to-peer video/audio connections
 */
export const useWebRTC = (callId, localUserId) => {
  const { socket, isConnected } = useSocket();
  
  // Refs for persistent data
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const isInitializingRef = useRef(false);
  
  // State
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionState, setConnectionState] = useState('new'); // new, connecting, connected, disconnected, failed
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // ICE servers configuration
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  /**
   * Initialize local media stream (camera + microphone)
   */
  const initializeMedia = useCallback(async () => {
    if (isInitializingRef.current || localStreamRef.current) {
      console.log('📹 Media already initialized or initializing');
      return localStreamRef.current;
    }

    isInitializingRef.current = true;

    try {
      console.log('🎬 Requesting media access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      
      console.log('✅ Media access granted');
      console.log(`📊 Tracks: ${stream.getTracks().map(t => `${t.kind} (${t.label})`).join(', ')}`);
      
      return stream;
      
    } catch (error) {
      console.error('❌ Media access error:', error);
      
      if (error.name === 'NotAllowedError') {
        toast.error('Camera/microphone access denied. Please allow permissions.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No camera or microphone found.');
      } else {
        toast.error('Failed to access media devices.');
      }
      
      throw error;
    } finally {
      isInitializingRef.current = false;
    }
  }, []);

  /**
   * Create peer connection
   */
  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      console.log('🔄 Peer connection already exists');
      return peerConnectionRef.current;
    }

    console.log('🤝 Creating peer connection...');
    const pc = new RTCPeerConnection(iceServers);

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        console.log(`➕ Adding ${track.kind} track to peer connection`);
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && isConnected) {
        console.log('🧊 Sending ICE candidate');
        socket.emit('webrtc:ice-candidate', {
          callId,
          candidate: event.candidate
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`🔗 Connection state: ${pc.connectionState}`);
      setConnectionState(pc.connectionState);
      
      if (pc.connectionState === 'connected') {
        console.log('✅ Peer connection established');
      } else if (pc.connectionState === 'failed') {
        console.error('❌ Peer connection failed');
        toast.error('Connection failed. Please try again.');
      }
    };

    // Handle ICE connection state
    pc.oniceconnectionstatechange = () => {
      console.log(`🧊 ICE connection state: ${pc.iceConnectionState}`);
    };

    // Handle remote tracks
    pc.ontrack = (event) => {
      console.log('📹 Received remote track:', event.track.kind);
      const [stream] = event.streams;
      
      if (stream) {
        console.log('✅ Remote stream received');
        remoteStreamRef.current = stream;
        setRemoteStream(stream);
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [callId, socket, isConnected]);

  /**
   * Create and send offer
   */
  const createOffer = useCallback(async () => {
    try {
      console.log('📤 Creating offer...');
      
      const pc = createPeerConnection();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      console.log('✅ Offer created, sending to peer');
      
      if (socket && isConnected) {
        socket.emit('webrtc:offer', {
          callId,
          offer: pc.localDescription
        });
      }
      
    } catch (error) {
      console.error('❌ Error creating offer:', error);
      toast.error('Failed to create connection offer');
    }
  }, [callId, socket, isConnected, createPeerConnection]);

  /**
   * Handle incoming offer
   */
  const handleOffer = useCallback(async (offer) => {
    try {
      console.log('📥 Received offer, creating answer...');
      
      const pc = createPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      
      // Add pending ICE candidates
      if (pendingCandidatesRef.current.length > 0) {
        console.log(`🧊 Adding ${pendingCandidatesRef.current.length} pending ICE candidates`);
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidatesRef.current = [];
      }
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      console.log('✅ Answer created, sending to peer');
      
      if (socket && isConnected) {
        socket.emit('webrtc:answer', {
          callId,
          answer: pc.localDescription
        });
      }
      
    } catch (error) {
      console.error('❌ Error handling offer:', error);
      toast.error('Failed to handle connection offer');
    }
  }, [callId, socket, isConnected, createPeerConnection]);

  /**
   * Handle incoming answer
   */
  const handleAnswer = useCallback(async (answer) => {
    try {
      console.log('📥 Received answer');
      
      const pc = peerConnectionRef.current;
      if (!pc) {
        console.error('❌ No peer connection to set answer');
        return;
      }
      
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      
      // Add pending ICE candidates
      if (pendingCandidatesRef.current.length > 0) {
        console.log(`🧊 Adding ${pendingCandidatesRef.current.length} pending ICE candidates`);
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidatesRef.current = [];
      }
      
      console.log('✅ Answer set successfully');
      
    } catch (error) {
      console.error('❌ Error handling answer:', error);
      toast.error('Failed to handle connection answer');
    }
  }, []);

  /**
   * Handle incoming ICE candidate
   */
  const handleIceCandidate = useCallback(async (candidate) => {
    try {
      const pc = peerConnectionRef.current;
      
      if (!pc) {
        console.warn('⚠️ No peer connection yet, queuing ICE candidate');
        pendingCandidatesRef.current.push(candidate);
        return;
      }
      
      if (!pc.remoteDescription) {
        console.warn('⚠️ No remote description yet, queuing ICE candidate');
        pendingCandidatesRef.current.push(candidate);
        return;
      }
      
      console.log('🧊 Adding ICE candidate');
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
      
    } catch (error) {
      console.error('❌ Error adding ICE candidate:', error);
    }
  }, []);

  /**
   * Toggle microphone
   */
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        console.log(`🔇 Microphone ${audioTrack.enabled ? 'unmuted' : 'muted'}`);
      }
    }
  }, []);

  /**
   * Toggle camera
   */
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        console.log(`📹 Camera ${videoTrack.enabled ? 'enabled' : 'disabled'}`);
      }
    }
  }, []);

  /**
   * Start screen sharing
   */
  const startScreenShare = useCallback(async () => {
    try {
      console.log('🖥️ Starting screen share...');
      
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      
      const screenTrack = screenStream.getVideoTracks()[0];
      
      // Replace video track in peer connection
      const pc = peerConnectionRef.current;
      if (pc) {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(screenTrack);
          setIsScreenSharing(true);
          console.log('✅ Screen sharing started');
          
          // Stop screen share when user stops it
          screenTrack.onended = () => {
            stopScreenShare();
          };
        }
      }
      
    } catch (error) {
      console.error('❌ Screen share error:', error);
      if (error.name !== 'NotAllowedError') {
        toast.error('Failed to start screen sharing');
      }
    }
  }, []);

  /**
   * Stop screen sharing
   */
  const stopScreenShare = useCallback(async () => {
    try {
      console.log('🖥️ Stopping screen share...');
      
      const pc = peerConnectionRef.current;
      if (pc && localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        
        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
          setIsScreenSharing(false);
          console.log('✅ Screen sharing stopped');
        }
      }
      
    } catch (error) {
      console.error('❌ Error stopping screen share:', error);
    }
  }, []);

  /**
   * Cleanup everything
   */
  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up WebRTC...');
    
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`🛑 Stopped ${track.kind} track`);
      });
      localStreamRef.current = null;
      setLocalStream(null);
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Clear remote stream
    remoteStreamRef.current = null;
    setRemoteStream(null);
    
    // Clear pending candidates
    pendingCandidatesRef.current = [];
    
    // Reset state
    setConnectionState('new');
    setIsMuted(false);
    setIsVideoEnabled(true);
    setIsScreenSharing(false);
    
    console.log('✅ Cleanup complete');
  }, []);

  /**
   * Setup socket listeners
   */
  useEffect(() => {
    if (!socket || !isConnected || !callId) return;

    console.log('🔌 Setting up WebRTC socket listeners for call:', callId);

    socket.on('webrtc:offer', ({ offer }) => handleOffer(offer));
    socket.on('webrtc:answer', ({ answer }) => handleAnswer(answer));
    socket.on('webrtc:ice-candidate', ({ candidate }) => handleIceCandidate(candidate));

    return () => {
      console.log('🔌 Removing WebRTC socket listeners');
      socket.off('webrtc:offer');
      socket.off('webrtc:answer');
      socket.off('webrtc:ice-candidate');
    };
  }, [socket, isConnected, callId, handleOffer, handleAnswer, handleIceCandidate]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    // State
    localStream,
    remoteStream,
    connectionState,
    isMuted,
    isVideoEnabled,
    isScreenSharing,
    
    // Actions
    initializeMedia,
    createOffer,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    cleanup
  };
};

export default useWebRTC;
