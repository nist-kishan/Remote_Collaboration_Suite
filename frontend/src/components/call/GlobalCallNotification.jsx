import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCall } from '../../hook/useCall';
import CallNotification from './CallNotification';
import IncomingCallNotification from './IncomingCallNotification';
import { useNavigate } from 'react-router-dom';

const GlobalCallNotification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState('active'); // 'active' or 'incoming'
  const [notificationId, setNotificationId] = useState(null); // Track notification ID to prevent duplicates
  
  const {
    activeCall,
    incomingCall,
    outgoingCall,
    callStatus,
    localStream,
    isMuted,
    isVideoEnabled,
    endActiveCall,
    rejectCall,
    acceptCall,
    participants
  } = useCall();

  // Determine notification type and visibility
  useEffect(() => {
    const isOnCallPage = location.pathname.includes('/video-call/') || location.pathname.includes('/call/');
    
    // Don't show notification if we're on call pages or if modals are already showing
    if (isOnCallPage) {
      setShowNotification(false);
      setNotificationId(null);
      return;
    }
    
    if (incomingCall && callStatus === 'incoming') {
      const currentNotificationId = `incoming-${incomingCall.callId || incomingCall._id}`;
      
      // Only show notification if it's a new incoming call
      if (notificationId !== currentNotificationId) {
        setNotificationType('incoming');
        setNotificationId(currentNotificationId);
        setShowNotification(true);
      }
    } else if (activeCall && callStatus === 'connected') {
      const currentNotificationId = `active-${activeCall._id}`;
      
      // Only show notification if it's a new active call
      if (notificationId !== currentNotificationId) {
        setNotificationType('active');
        setNotificationId(currentNotificationId);
        setShowNotification(true);
      }
    } else {
      setShowNotification(false);
      setNotificationId(null);
    }
  }, [activeCall, incomingCall, callStatus, location.pathname, notificationId]);

  const handleJoinCall = () => {
    if (activeCall) {
      navigate(`/call/${activeCall._id}`);
    }
  };

  const handleEndCall = () => {
    endActiveCall();
    setShowNotification(false);
  };

  const handleAcceptCall = async () => {
    try {
      await acceptCall();
      setShowNotification(false);
      
      // Navigate to receiver page after accepting the call
      if (incomingCall) {
        const receiverId = incomingCall.callerId || incomingCall.senderId || incomingCall.fromUserId || incomingCall.userId || incomingCall.chatId || 'unknown';
        navigate(`/video-call/receiver/${receiverId}`, { replace: true });
      }
    } catch (error) {
      console.error('Error accepting call:', error);
    }
  };

  const handleRejectCall = () => {
    rejectCall();
    setShowNotification(false);
  };

  const handleMinimize = () => {
    setShowNotification(false);
  };

  // Prepare call data for active call notification
  const activeCallData = activeCall ? {
    ...activeCall,
    status: callStatus,
    isMuted,
    isVideoEnabled,
    participants,
    caller: activeCall.caller || activeCall.participants?.[0] || { name: 'Unknown User' },
    startTime: activeCall.createdAt || activeCall.startTime
  } : null;

  // Prepare call data for incoming call notification
  const incomingCallData = incomingCall ? {
    ...incomingCall,
    status: 'incoming',
    caller: incomingCall.caller || { name: incomingCall.fromUserName || 'Unknown Caller' },
    startTime: new Date().toISOString()
  } : null;

  if (!showNotification) {
    return null;
  }

  // Show incoming call notification
  if (notificationType === 'incoming' && incomingCallData) {
    return (
      <IncomingCallNotification
        callData={incomingCallData}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
        onMinimize={handleMinimize}
        isVisible={showNotification}
      />
    );
  }

  // Show active call notification
  if (notificationType === 'active' && activeCallData) {
    return (
      <CallNotification
        callData={activeCallData}
        onJoinCall={handleJoinCall}
        onEndCall={handleEndCall}
        onMinimize={handleMinimize}
        isVisible={showNotification}
      />
    );
  }

  return null;
};

export default GlobalCallNotification;
