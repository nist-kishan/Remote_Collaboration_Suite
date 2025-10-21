import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCall } from '../../hook/useCall';
import CallNotification from './CallNotification';
import { useNavigate } from 'react-router-dom';

const GlobalCallNotification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotification, setShowNotification] = useState(false);
  
  const {
    activeCall,
    callStatus,
    localStream,
    isMuted,
    isVideoEnabled,
    endActiveCall,
    participants
  } = useCall();

  // Show notification when there's an active call and we're not on the call page
  useEffect(() => {
    const isOnCallPage = location.pathname.includes('/call/');
    const hasActiveCall = activeCall && callStatus === 'connected';
    
    setShowNotification(hasActiveCall && !isOnCallPage);
  }, [activeCall, callStatus, location.pathname]);

  const handleJoinCall = () => {
    if (activeCall) {
      navigate(`/call/${activeCall._id}`);
    }
  };

  const handleEndCall = () => {
    endActiveCall();
    setShowNotification(false);
  };

  const handleMinimize = () => {
    setShowNotification(false);
  };

  // Prepare call data for notification
  const callData = activeCall ? {
    ...activeCall,
    status: callStatus,
    isMuted,
    isVideoEnabled,
    participants,
    caller: activeCall.caller || activeCall.participants?.[0] || { name: 'Unknown User' },
    startTime: activeCall.createdAt || activeCall.startTime
  } : null;

  if (!showNotification || !callData) {
    return null;
  }

  return (
    <CallNotification
      callData={callData}
      onJoinCall={handleJoinCall}
      onEndCall={handleEndCall}
      onMinimize={handleMinimize}
      isVisible={showNotification}
    />
  );
};

export default GlobalCallNotification;
