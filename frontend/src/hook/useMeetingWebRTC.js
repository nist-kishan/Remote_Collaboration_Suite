import { useEffect, useRef, useCallback, useState } from 'react';
import { useSocket } from './useSocket';
import { toast } from 'react-hot-toast';

/**
 * WebRTC Hook for Meeting Video Conferencing
 * Specifically designed for many-to-many video meetings
 * Separate from regular 1-on-1 calls
 */
export const useMeetingWebRTC = (meetingId, userId) => {
  const { socket, isConnected } = useSocket();
  
  // Refs for persistent data across renders
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const remoteStreamsRef = useRef({});
  const socketRef = useRef(socket);
  const isConnectedRef = useRef(isConnected);
  const hasJoinedCallRef = useRef(false);
  
  // Update refs when socket/connection changes
  useEffect(() => {
    socketRef.current = socket;
    isConnectedRef.current = isConnected;
  }, [socket, isConnected]);
  
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [remoteStreams, setRemoteStreams] = useState({});

  // ICE servers configuration (STUN/TURN servers)
  const iceServers = {
    iceServers: [
      // STUN servers for NAT traversal
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      // TURN server for relay (configure with your credentials)
      // Uncomment and configure when you have a TURN server
      // {
      //   urls: 'turn:your-turn-server.com:3478',
      //   username: process.env.REACT_APP_TURN_USERNAME || 'user',
      //   credential: process.env.REACT_APP_TURN_PASSWORD || 'pass'
      // }
    ]
  };

  /**
   * Remove peer connection and stream
   */
  const handleRemovePeer = useCallback((remoteUserId) => {
    // Close peer connection
    if (peerConnectionsRef.current[remoteUserId]) {
      peerConnectionsRef.current[remoteUserId].close();
      delete peerConnectionsRef.current[remoteUserId];
    }

    // Remove remote stream
    if (remoteStreamsRef.current[remoteUserId]) {
      delete remoteStreamsRef.current[remoteUserId];
      setRemoteStreams(prev => {
        const updated = { ...prev };
        delete updated[remoteUserId];
        return updated;
      });
    }
  }, []);

  /**
   * Create a new peer connection for a remote user
   */
  const createPeerConnection = useCallback((remoteUserId) => {
    try {
      // Check if peer connection already exists
      if (peerConnectionsRef.current[remoteUserId]) {
        return peerConnectionsRef.current[remoteUserId];
      }

      const peerConnection = new RTCPeerConnection(iceServers);
      
      // Add local stream tracks to peer connection
      if (localStreamRef.current) {
        const tracks = localStreamRef.current.getTracks();
        console.log(`📹 [Meeting] Adding ${tracks.length} tracks to peer connection for ${remoteUserId}:`, tracks.map(t => `${t.kind} (${t.enabled})`));

        tracks.forEach(track => {
          console.log(`➕ [Meeting] Adding ${track.kind} track:`, track.label, track.enabled);
          peerConnection.addTrack(track, localStreamRef.current);
        });
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socketRef.current && isConnectedRef.current) {
          console.log(`🧊 [Meeting] Sending ICE candidate to ${remoteUserId}`);
          socketRef.current.emit('ice_candidate', {
            callId: meetingId,
            candidate: event.candidate,
            to: remoteUserId
          });
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log(`🔗 [Meeting] Connection state with ${remoteUserId}:`, peerConnection.connectionState);
        if (peerConnection.connectionState === 'connected') {
          setConnectionStatus('connected');
          // Don't show toast - video feed appearing is enough feedback
        } else if (peerConnection.connectionState === 'disconnected' || 
                   peerConnection.connectionState === 'failed') {
          console.warn(`⚠️ [Meeting] Connection ${peerConnection.connectionState} with ${remoteUserId}`);
          handleRemovePeer(remoteUserId);
        }
      };

      // Handle incoming remote tracks
      peerConnection.ontrack = (event) => {
        const [remoteStream] = event.streams;
        
        if (remoteStream) {
          console.log('📹 [Meeting] Received remote stream from:', remoteUserId);
          console.log('📊 [Meeting] Remote stream tracks:', remoteStream.getTracks().map(t => `${t.kind} (${t.enabled})`));

          const audioTracks = remoteStream.getAudioTracks();
          const videoTracks = remoteStream.getVideoTracks();

          console.log(`🎵 [Meeting] Audio tracks: ${audioTracks.length}`, audioTracks.map(t => `${t.label} (${t.enabled})`));
          console.log(`📹 [Meeting] Video tracks: ${videoTracks.length}`, videoTracks.map(t => `${t.label} (${t.enabled})`));

          remoteStreamsRef.current[remoteUserId] = remoteStream;
          setRemoteStreams(prev => ({
            ...prev,
            [remoteUserId]: remoteStream
          }));
        }
      };

      peerConnectionsRef.current[remoteUserId] = peerConnection;
      return peerConnection;
      
    } catch (error) {
      console.error('❌ Error creating peer connection:', error);
      toast.error('Failed to establish peer connection');
      return null;
    }
  }, [meetingId, handleRemovePeer]);

  /**
   * Initialize local media stream
   */
  const initializeLocalStream = useCallback(async (constraints = { video: true, audio: true }) => {
    try {
      console.log('🎤 [Meeting] Requesting media access with constraints:', constraints);

      // Enhanced constraints for better audio/video quality
      const enhancedConstraints = {
        video: constraints.video ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        } : false,
        audio: constraints.audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } : false
      };

      console.log('🎬 [Meeting] Enhanced constraints:', enhancedConstraints);
      const stream = await navigator.mediaDevices.getUserMedia(enhancedConstraints);

      // Log what we actually got
      const tracks = stream.getTracks();
      console.log(`✅ [Meeting] Media access granted. Tracks: ${tracks.length}`);
      tracks.forEach(track => {
        console.log(`  ${track.kind}: ${track.label} (${track.enabled})`);
      });

      localStreamRef.current = stream;
      setIsInitialized(true);
      console.log('🎉 [Meeting] Local stream initialized successfully');
      return stream;
      
    } catch (error) {
      console.error('❌ [Meeting] Error accessing media devices:', error);
      
      if (error.name === 'NotAllowedError') {
        toast.error('Camera/microphone access denied. Please grant permissions.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No camera or microphone found.');
      } else if (error.name === 'NotReadableError') {
        toast.error('Camera/microphone is already in use by another application.');
      } else if (error.name === 'OverconstrainedError') {
        toast.error('Camera/microphone does not support the requested quality settings.');
        // Try with basic constraints as fallback
        console.log('🔄 [Meeting] Retrying with basic constraints...');
        return initializeLocalStream({ video: true, audio: true });
      } else {
        toast.error('Failed to access media devices.');
      }
      
      throw error;
    }
  }, []);

  /**
   * Create and send offer to remote peer
   */
  const createOffer = useCallback(async (remoteUserId) => {
    try {
      let peerConnection = peerConnectionsRef.current[remoteUserId];
      if (!peerConnection) {
        peerConnection = createPeerConnection(remoteUserId);
      }

      if (!peerConnection) {
        throw new Error('Failed to create peer connection');
      }

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      console.log(`📤 [Meeting] Sending offer to ${remoteUserId}`);
      if (socketRef.current && isConnectedRef.current) {
        socketRef.current.emit('sdp_offer', {
          callId: meetingId,
          offer,
          to: remoteUserId
        });
        console.log(`✅ [Meeting] Offer sent successfully`);
      } else {
        console.error('❌ [Meeting] Socket not connected, cannot send offer');
      }
      
    } catch (error) {
      console.error('❌ Error creating offer:', error);
      toast.error('Failed to create connection offer');
    }
  }, [meetingId, createPeerConnection]);

  /**
   * Handle incoming offer from remote peer
   */
  const handleOffer = useCallback(async ({ fromUserId, offer }) => {
    try {
      console.log(`📥 [Meeting] Received offer from ${fromUserId}`);
      let peerConnection = peerConnectionsRef.current[fromUserId];
      if (!peerConnection) {
        peerConnection = createPeerConnection(fromUserId);
      }

      if (!peerConnection) {
        throw new Error('Failed to create peer connection');
      }

      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      console.log(`✅ [Meeting] Remote description set for ${fromUserId}`);
      
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      console.log(`📤 [Meeting] Sending answer to ${fromUserId}`);
      if (socketRef.current && isConnectedRef.current) {
        socketRef.current.emit('sdp_answer', {
          callId: meetingId,
          answer,
          to: fromUserId
        });
        console.log(`✅ [Meeting] Answer sent successfully`);
      } else {
        console.error('❌ [Meeting] Socket not connected, cannot send answer');
      }
      
    } catch (error) {
      console.error('❌ [Meeting] Error handling offer:', error);
      toast.error('Failed to handle connection offer');
    }
  }, [meetingId, createPeerConnection]);

  /**
   * Handle incoming answer from remote peer
   */
  const handleAnswer = useCallback(async ({ fromUserId, answer }) => {
    try {
      console.log(`📥 [Meeting] Received answer from ${fromUserId}`);
      const peerConnection = peerConnectionsRef.current[fromUserId];
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        console.log(`✅ [Meeting] Answer set successfully for peer: ${fromUserId}`);
      } else {
        console.warn(`⚠️ [Meeting] No peer connection found for ${fromUserId}`);
      }
      
    } catch (error) {
      console.error('❌ [Meeting] Error handling answer:', error);
      toast.error('Failed to handle connection answer');
    }
  }, []);

  /**
   * Handle incoming ICE candidate
   */
  const handleIceCandidate = useCallback(async ({ fromUserId, candidate }) => {
    try {
      console.log(`🧊 [Meeting] Received ICE candidate from ${fromUserId}`);
      const peerConnection = peerConnectionsRef.current[fromUserId];
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log(`✅ [Meeting] ICE candidate added successfully for peer: ${fromUserId}`);
      } else {
        console.warn(`⚠️ [Meeting] No peer connection found for ${fromUserId}`);
      }
      
    } catch (error) {
      console.error('❌ [Meeting] Error handling ICE candidate:', error);
    }
  }, []);

  /**
   * Handle new user joining the meeting
   */
  const handleUserJoined = useCallback(async ({ userId: newUserId, user }) => {
    if (newUserId !== userId) {
      console.log(`👥 [Meeting] New user joined: ${newUserId}`);
      // Create offer for the new user
      await createOffer(newUserId);
    }
  }, [userId, createOffer]);

  /**
   * Handle user leaving the meeting
   */
  const handleUserLeft = useCallback(({ userId: leftUserId }) => {
    console.log(`👋 [Meeting] User left: ${leftUserId}`);
    handleRemovePeer(leftUserId);
  }, [handleRemovePeer]);

  /**
   * Toggle audio track
   */
  const toggleAudio = useCallback((enabled) => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }, []);

  /**
   * Toggle video track
   */
  const toggleVideo = useCallback((enabled) => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }, []);

  /**
   * Start screen sharing
   */
  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      const screenTrack = screenStream.getVideoTracks()[0];
      
      // Replace video track in all peer connections
      Object.values(peerConnectionsRef.current).forEach(peerConnection => {
        const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
      });

      // Handle screen share stop
      screenTrack.onended = () => {
        stopScreenShare();
      };

      return screenStream;
      
    } catch (error) {
      console.error('❌ Error starting screen share:', error);
      toast.error('Failed to start screen sharing');
      throw error;
    }
  }, []);

  /**
   * Stop screen sharing
   */
  const stopScreenShare = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      
      // Replace screen track with camera track in all peer connections
      Object.values(peerConnectionsRef.current).forEach(peerConnection => {
        const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
      });
    }
  }, []);

  /**
   * Cleanup all connections and streams
   */
  const cleanup = useCallback(() => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Close all peer connections
    Object.keys(peerConnectionsRef.current).forEach(remoteUserId => {
      handleRemovePeer(remoteUserId);
    });
    
    setIsInitialized(false);
    setConnectionStatus('disconnected');
    setRemoteStreams({});
  }, [handleRemovePeer]);

  /**
   * Setup socket event listeners for WebRTC signaling
   */
  useEffect(() => {
    if (!socket || !isConnected || !meetingId) return;

    console.log('🔌 [Meeting] Setting up WebRTC signaling listeners for meeting:', meetingId);

    socket.on('sdp_offer', handleOffer);
    socket.on('sdp_answer', handleAnswer);
    socket.on('ice_candidate', handleIceCandidate);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);

    return () => {
      console.log('🔌 [Meeting] Cleaning up WebRTC signaling listeners');
      socket.off('sdp_offer', handleOffer);
      socket.off('sdp_answer', handleAnswer);
      socket.off('ice_candidate', handleIceCandidate);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
    };
  }, [socket, isConnected, meetingId, handleOffer, handleAnswer, handleIceCandidate, handleUserJoined, handleUserLeft]);

  /**
   * Join meeting call room via socket
   */
  const joinCallRoom = useCallback(() => {
    if (socketRef.current && isConnectedRef.current && meetingId) {
      // Allow rejoining even if hasJoinedCallRef is true (for page refresh scenarios)
      console.log('🔌 [Meeting] Joining call room:', meetingId);
      socketRef.current.emit('join-call', { callId: meetingId, userId });
      hasJoinedCallRef.current = true;
    }
  }, [meetingId, userId]);

  /**
   * Leave meeting call room via socket
   */
  const leaveCallRoom = useCallback(() => {
    if (socketRef.current && isConnectedRef.current && meetingId && hasJoinedCallRef.current) {
      console.log('🔌 [Meeting] Leaving call room:', meetingId);
      socketRef.current.emit('leave-call', { callId: meetingId, userId });
      hasJoinedCallRef.current = false;
      cleanup();
    }
  }, [meetingId, userId, cleanup]);

  return {
    // State
    isInitialized,
    connectionStatus,
    localStream: localStreamRef.current,
    remoteStreams,
    
    // Actions
    initializeLocalStream,
    createOffer,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    joinCallRoom,
    leaveCallRoom,
    cleanup
  };
};

export default useMeetingWebRTC;
