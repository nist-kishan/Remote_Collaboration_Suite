import { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useSocket } from './useSocket';
import { useWebRTC } from './useWebRTCRefactored';
import {
  setActiveCall,
  setIncomingCall,
  setOutgoingCall,
  setCallStatus,
  resetCallState,
  selectActiveCall,
  selectIncomingCall,
  selectOutgoingCall,
  selectCallStatus
} from '../store/slice/callSlice';
import { startCall as startCallAPI, joinCall as joinCallAPI, endCall as endCallAPI } from '../api/callApi';

/**
 * Unified Video Call Hook - Simplified and Reliable
 * Manages call state, WebRTC, and socket communication
 */
export const useVideoCall = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { user } = useSelector(state => state.auth);
  
  // Redux state
  const activeCall = useSelector(selectActiveCall);
  const incomingCall = useSelector(selectIncomingCall);
  const outgoingCall = useSelector(selectOutgoingCall);
  const callStatus = useSelector(selectCallStatus);
  
  // Local state
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  
  // WebRTC hook
  const callId = activeCall?._id || activeCall?.callId;
  const {
    localStream,
    remoteStream,
    connectionState,
    isMuted,
    isVideoEnabled,
    isScreenSharing,
    initializeMedia,
    createOffer,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    cleanup: cleanupWebRTC
  } = useWebRTC(callId, user?._id);

  /**
   * Start a new call
   */
  const startCall = useCallback(async ({ participants, type = 'one-to-one', chatId }) => {
    try {
      console.log('📞 Starting call...');
      setError(null);
      
      // Create call via API
      const response = await startCallAPI({ participants, type, chat: chatId });
      const call = response?.call || response;
      
      console.log('✅ Call created:', call._id);
      
      // Update Redux state
      dispatch(setOutgoingCall(call));
      dispatch(setActiveCall(call));
      dispatch(setCallStatus('outgoing'));
      
      // Initialize media
      console.log('🎬 Initializing media...');
      await initializeMedia();
      
      // Join socket room
      if (socket && isConnected) {
        console.log('🔌 Joining call room...');
        socket.emit('call:join', { callId: call._id, userId: user._id });
      }
      
      setIsInitialized(true);
      return call;
      
    } catch (error) {
      console.error('❌ Failed to start call:', error);
      setError(error.message);
      toast.error(error.message || 'Failed to start call');
      throw error;
    }
  }, [dispatch, socket, isConnected, user, initializeMedia]);

  /**
   * Accept incoming call
   */
  const acceptCall = useCallback(async (callIdToAccept) => {
    try {
      console.log('📞 Accepting call:', callIdToAccept);
      setError(null);
      
      // Join call via API
      const response = await joinCallAPI(callIdToAccept);
      const call = response?.call || response;
      
      console.log('✅ Call joined:', call._id);
      
      // Update Redux state
      dispatch(setActiveCall(call));
      dispatch(setIncomingCall(null));
      dispatch(setCallStatus('connected'));
      
      // Initialize media
      console.log('🎬 Initializing media...');
      await initializeMedia();
      
      // Join socket room
      if (socket && isConnected) {
        console.log('🔌 Joining call room...');
        socket.emit('call:join', { callId: call._id, userId: user._id });
      }
      
      setIsInitialized(true);
      navigate('/video-call');
      
    } catch (error) {
      console.error('❌ Failed to accept call:', error);
      setError(error.message);
      toast.error(error.message || 'Failed to accept call');
      throw error;
    }
  }, [dispatch, navigate, socket, isConnected, user, initializeMedia]);

  /**
   * Reject incoming call
   */
  const rejectCall = useCallback(async (callIdToReject) => {
    try {
      console.log('📞 Rejecting call:', callIdToReject);
      
      if (socket && isConnected) {
        socket.emit('call:reject', { callId: callIdToReject, userId: user._id });
      }
      
      dispatch(setIncomingCall(null));
      dispatch(setCallStatus('idle'));
      
    } catch (error) {
      console.error('❌ Failed to reject call:', error);
    }
  }, [dispatch, socket, isConnected, user]);

  /**
   * End active call
   */
  const endCall = useCallback(async () => {
    try {
      const currentCallId = activeCall?._id || activeCall?.callId;
      if (!currentCallId) {
        console.warn('⚠️ No active call to end');
        return;
      }
      
      console.log('📞 Ending call:', currentCallId);
      
      // End call via API
      await endCallAPI(currentCallId);
      
      // Leave socket room
      if (socket && isConnected) {
        socket.emit('call:leave', { callId: currentCallId, userId: user._id });
      }
      
      // Cleanup WebRTC
      cleanupWebRTC();
      
      // Reset Redux state
      dispatch(resetCallState());
      
      setIsInitialized(false);
      navigate('/chat');
      
      console.log('✅ Call ended');
      
    } catch (error) {
      console.error('❌ Failed to end call:', error);
      toast.error('Failed to end call');
      
      // Cleanup anyway
      cleanupWebRTC();
      dispatch(resetCallState());
      navigate('/chat');
    }
  }, [activeCall, dispatch, navigate, socket, isConnected, user, cleanupWebRTC]);

  /**
   * Handle incoming call event
   */
  const handleIncomingCall = useCallback((data) => {
    console.log('📥 Incoming call:', data);
    
    dispatch(setIncomingCall({
      callId: data.callId,
      fromUserId: data.fromUserId,
      fromUserName: data.fromUserName,
      fromUserAvatar: data.fromUserAvatar,
      type: data.type || 'one-to-one'
    }));
    dispatch(setCallStatus('incoming'));
    
    // Play ringtone (optional)
    // playRingtone();
    
  }, [dispatch]);

  /**
   * Handle call accepted event
   */
  const handleCallAccepted = useCallback((data) => {
    console.log('✅ Call accepted by peer');
    
    dispatch(setOutgoingCall(null));
    dispatch(setCallStatus('connected'));
    
    // Create WebRTC offer
    console.log('🤝 Creating WebRTC offer...');
    createOffer();
    
  }, [dispatch, createOffer]);

  /**
   * Handle call rejected event
   */
  const handleCallRejected = useCallback((data) => {
    console.log('❌ Call rejected by peer');
    
    toast.error('Call was rejected');
    
    cleanupWebRTC();
    dispatch(resetCallState());
    navigate('/chat');
    
  }, [dispatch, navigate, cleanupWebRTC]);

  /**
   * Handle call ended event
   */
  const handleCallEnded = useCallback((data) => {
    console.log('📞 Call ended by peer');
    
    toast.info('Call ended');
    
    cleanupWebRTC();
    dispatch(resetCallState());
    
    if (window.location.pathname.includes('/video-call')) {
      navigate('/chat');
    }
    
  }, [dispatch, navigate, cleanupWebRTC]);

  /**
   * Handle user joined call
   */
  const handleUserJoined = useCallback((data) => {
    console.log('👥 User joined call:', data.userId);
    
    // If we're already in the call, create an offer for the new user
    if (isInitialized && localStream) {
      console.log('🤝 Creating offer for new user...');
      createOffer();
    }
    
  }, [isInitialized, localStream, createOffer]);

  /**
   * Setup socket listeners
   */
  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log('🔌 Setting up call socket listeners');

    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('call:rejected', handleCallRejected);
    socket.on('call:ended', handleCallEnded);
    socket.on('call:user-joined', handleUserJoined);

    return () => {
      console.log('🔌 Removing call socket listeners');
      socket.off('call:incoming');
      socket.off('call:accepted');
      socket.off('call:rejected');
      socket.off('call:ended');
      socket.off('call:user-joined');
    };
  }, [socket, isConnected, handleIncomingCall, handleCallAccepted, handleCallRejected, handleCallEnded, handleUserJoined]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (isInitialized) {
        console.log('🧹 Component unmounting, cleaning up...');
        cleanupWebRTC();
      }
    };
  }, [isInitialized, cleanupWebRTC]);

  return {
    // State
    activeCall,
    incomingCall,
    outgoingCall,
    callStatus,
    isInitialized,
    error,
    
    // Media streams
    localStream,
    remoteStream,
    connectionState,
    
    // Media controls
    isMuted,
    isVideoEnabled,
    isScreenSharing,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    
    // Call actions
    startCall,
    acceptCall,
    rejectCall,
    endCall
  };
};

export default useVideoCall;
