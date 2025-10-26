import { useEffect, useRef, useCallback, useState } from 'react';
import { useSocket } from './useSocket';
import { toast } from 'react-hot-toast';

/**
 * WebRTC Hook for Regular Calls (1-on-1 or Group)
 * Used for chat-based video/audio calls, NOT for meetings
 * For meetings, use useMeetingWebRTC instead
 * 
 * Handles peer connections, media streams, and signaling
 */
export const useWebRTC = (callId, userId) => {
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
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
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
        localStreamRef.current.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStreamRef.current);
        });
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socketRef.current && isConnectedRef.current) {
          socketRef.current.emit('ice-candidate', {
            callId,
            candidate: event.candidate,
            to: remoteUserId
          });
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === 'connected') {
          setConnectionStatus('connected');
          toast.success(`Connected to peer`);
        } else if (peerConnection.connectionState === 'disconnected' || 
                   peerConnection.connectionState === 'failed') {
          setConnectionStatus('disconnected');
          handleRemovePeer(remoteUserId);
        }
      };

      // Handle incoming remote tracks
      peerConnection.ontrack = (event) => {
        const [remoteStream] = event.streams;
        
        if (remoteStream) {
          console.log('📹 Received remote stream from:', remoteUserId);
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
  }, [callId, handleRemovePeer]);

  /**
   * Initialize local media stream
   */
  const initializeLocalStream = useCallback(async (constraints = { video: true, audio: true }) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setIsInitialized(true);
      return stream;
      
    } catch (error) {
      console.error('❌ Error accessing media devices:', error);
      
      if (error.name === 'NotAllowedError') {
        toast.error('Camera/microphone access denied. Please grant permissions.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No camera or microphone found.');
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

      if (socketRef.current && isConnectedRef.current) {
        socketRef.current.emit('offer', {
          callId,
          offer,
          to: remoteUserId
        });
      }
      
    } catch (error) {
      console.error('❌ Error creating offer:', error);
      toast.error('Failed to create connection offer');
    }
  }, [callId, createPeerConnection]);

  /**
   * Handle incoming offer from remote peer
   */
  const handleOffer = useCallback(async ({ from, offer }) => {
    try {
      let peerConnection = peerConnectionsRef.current[from];
      if (!peerConnection) {
        peerConnection = createPeerConnection(from);
      }

      if (!peerConnection) {
        throw new Error('Failed to create peer connection');
      }

      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      if (socketRef.current && isConnectedRef.current) {
        socketRef.current.emit('answer', {
          callId,
          answer,
          to: from
        });
      }
      
    } catch (error) {
      console.error('❌ Error handling offer:', error);
      toast.error('Failed to handle connection offer');
    }
  }, [callId, createPeerConnection]);

  /**
   * Handle incoming answer from remote peer
   */
  const handleAnswer = useCallback(async ({ from, answer }) => {
    try {
      const peerConnection = peerConnectionsRef.current[from];
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      }
      
    } catch (error) {
      console.error('❌ Error handling answer:', error);
      toast.error('Failed to handle connection answer');
    }
  }, []);

  /**
   * Handle incoming ICE candidate
   */
  const handleIceCandidate = useCallback(async ({ from, candidate }) => {
    try {
      const peerConnection = peerConnectionsRef.current[from];
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
      
    } catch (error) {
      console.error('❌ Error handling ICE candidate:', error);
    }
  }, []);


  /**
   * Handle new user joining the call
   */
  const handleUserJoined = useCallback(async ({ userId: newUserId, user }) => {
    if (newUserId !== userId) {
      // Create offer for the new user
      await createOffer(newUserId);
    }
  }, [userId, createOffer]);

  /**
   * Handle user leaving the call
   */
  const handleUserLeft = useCallback(({ userId: leftUserId }) => {
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
    if (!socket || !isConnected || !callId) return;

    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
    };
  }, [socket, isConnected, callId, handleOffer, handleAnswer, handleIceCandidate, handleUserJoined, handleUserLeft]);

  /**
   * Join call room via socket
   */
  const joinCallRoom = useCallback(() => {
    if (socketRef.current && isConnectedRef.current && callId) {
      // Allow rejoining even if hasJoinedCallRef is true (for page refresh scenarios)
      console.log('🔌 Joining call room:', callId);
      socketRef.current.emit('join-call', { callId, userId });
      hasJoinedCallRef.current = true;
    }
  }, [callId, userId]);

  /**
   * Leave call room via socket
   */
  const leaveCallRoom = useCallback(() => {
    if (socketRef.current && isConnectedRef.current && callId && hasJoinedCallRef.current) {
      socketRef.current.emit('leave-call', { callId, userId });
      hasJoinedCallRef.current = false;
      cleanup();
    }
  }, [callId, userId, cleanup]);

  return {
    // State
    isInitialized,
    connectionStatus,
    localStream: localStreamRef.current,
    remoteStreams, // Return state instead of ref for re-renders
    
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

export default useWebRTC;
