import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useMeeting } from '../../hook/useMeeting';
import { useSocket } from '../../hook/useSocket';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { meetingApi } from '../../api/meetingApi';
import { minimizeMeeting, restoreMeeting } from '../../store/slice/meetingSlice';
import MeetingHeader from '../../components/meeting/MeetingHeader';
import VideoGrid from '../../components/meeting/VideoGrid';
import MeetingControls from '../../components/meeting/MeetingControls';
import ParticipantsPanel from '../../components/meeting/ParticipantsPanel';
import ChatPanel from '../../components/meeting/ChatPanel';
import MeetingPasswordModal from '../../components/meeting/MeetingPasswordModal';
import MeetingScheduleNotification from '../../components/meeting/MeetingScheduleNotification';

/**
 * MeetingRoom Component - Main meeting room page
 * Business logic handled by useMeeting hook
 * UI rendered by separate presentational components
 */
const MeetingRoom = () => {
  const { meetingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { socket, isConnected } = useSocket();
  
  const {
    currentMeeting,
    participants,
    isLoading,
    isMuted,
    isVideoOn,
    isScreenSharing,
    chatMessages,
    isChatOpen,
    localStream,
    remoteStreams,
    connectionStatus,
    handleToggleMute,
    handleToggleVideo,
    handleToggleScreenShare,
    handleToggleChat,
    handleLeaveMeeting,
    refetchMeeting
  } = useMeeting(meetingId);

  const [duration, setDuration] = useState('00:00');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordValidated, setPasswordValidated] = useState(false);
  const [isValidatingAccess, setIsValidatingAccess] = useState(true);
  const [showScheduleNotification, setShowScheduleNotification] = useState(false);
  const [scheduleNotificationType, setScheduleNotificationType] = useState('too-early');

  // Restore meeting when component mounts
  useEffect(() => {
    dispatch(restoreMeeting());
  }, [dispatch]);

  // Minimize meeting when navigating away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentMeeting) {
        dispatch(minimizeMeeting(meetingId));
      }
    };

    // Listen for route changes
    return () => {
      // Only minimize if we're actually leaving the meeting page
      if (!location.pathname.includes('/meeting/')) {
        handleBeforeUnload();
      }
    };
  }, [currentMeeting, meetingId, location.pathname, dispatch]);

  // Fetch meeting data on mount
  useEffect(() => {
    if (meetingId && !isLoading) {
      refetchMeeting();
    }
  }, [meetingId, refetchMeeting, isLoading]);

  // Validate meeting access (password and time)
  useEffect(() => {
    if (!currentMeeting || isLoading) return;

    // First, validate scheduled meeting time (before password check)
    // This way users see the schedule notification before being asked for password
    if (currentMeeting.meetingType === 'scheduled' && currentMeeting.startTime) {
      const scheduledTime = new Date(currentMeeting.startTime);
      const endTime = new Date(currentMeeting.endTime);
      const now = new Date();
      const timeDiff = scheduledTime - now;
      const minutesDiff = timeDiff / (1000 * 60);
      const minutesAfterEnd = (now - endTime) / (1000 * 60);

      // Meeting hasn't started yet (more than 10 minutes early)
      if (minutesDiff > 10) {
        setScheduleNotificationType('too-early');
        setShowScheduleNotification(true);
        setIsValidatingAccess(false);
        return;
      }

      // Meeting ended
      if (minutesAfterEnd > 0) {
        setScheduleNotificationType('ended');
        setShowScheduleNotification(true);
        setIsValidatingAccess(false);
        return;
      }
    }

    // Check if meeting is private and needs password (after schedule validation)
    if (currentMeeting.accessType === 'private' && !passwordValidated) {
      setShowPasswordModal(true);
      setIsValidatingAccess(false);
      return;
    }

    // Check participant limit for all meetings
    if (currentMeeting.maxParticipants) {
      const currentParticipants = currentMeeting.attendees?.filter(
        a => a.status === 'accepted' || a.status === 'joined'
      ).length || 0;
      
      if (currentParticipants >= currentMeeting.maxParticipants) {
        toast.error(`This meeting has reached its maximum capacity of ${currentMeeting.maxParticipants} participants.`);
        setTimeout(() => {
          navigate('/meetings');
        }, 3000);
        return;
      }
    }

    setIsValidatingAccess(false);
  }, [currentMeeting, isLoading, passwordValidated, navigate]);

  // Handle password submission
  const handlePasswordSubmit = async (password) => {
    try {
      // Call the join meeting API with password
      const response = await meetingApi.joinMeeting(meetingId, password);
      
      if (response.data) {
        setPasswordValidated(true);
        setShowPasswordModal(false);
        toast.success('Password verified successfully!');
      }
    } catch (error) {
      console.error('Password validation error:', error);
      const errorMessage = error?.response?.data?.message || 'Invalid password';
      toast.error(errorMessage);
    }
  };

  // Handle password modal close
  const handlePasswordModalClose = () => {
    setShowPasswordModal(false);
    toast('Password required to join this meeting', { icon: 'ℹ️' });
    navigate('/meetings');
  };

  // Handle schedule notification close
  const handleScheduleNotificationClose = () => {
    setShowScheduleNotification(false);
    navigate('/meetings');
  };

  // Handle minimize meeting
  const handleMinimize = () => {
    dispatch(minimizeMeeting(meetingId));
    navigate('/meetings'); // Navigate to meetings list while keeping meeting active
  };

  // Calculate meeting duration
  useEffect(() => {
    if (!currentMeeting?.startTime) return;

    const updateDuration = () => {
      const start = new Date(currentMeeting.startTime);
      const now = new Date();
      const diff = Math.floor((now - start) / 1000);
      
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;
      
      if (hours > 0) {
        setDuration(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);

    return () => clearInterval(interval);
  }, [currentMeeting?.startTime]);

  // Handle sending chat messages
  const handleSendMessage = (messageText) => {
    if (!messageText.trim()) return;
    
    // Send message via socket
    if (socket && isConnected) {
      socket.emit('meeting_chat_message', {
        meetingId,
        message: messageText,
        text: messageText
      });
    } else {
      toast.error('Not connected to chat server');
    }
  };

  // Loading or validating access state
  if (isLoading || isValidatingAccess) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-white text-lg">Loading meeting...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (!currentMeeting) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Meeting not found</div>
          <button
            onClick={() => window.location.href = '/meetings'}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Back to Meetings
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <MeetingHeader
        meetingTitle={currentMeeting?.title || 'Meeting Room'}
        meetingId={meetingId}
        duration={duration}
        connectionStatus={connectionStatus}
        onMinimize={handleMinimize}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 min-h-0">
          <VideoGrid
            localStream={localStream}
            remoteStreams={remoteStreams}
            participants={participants}
            currentUser={user}
            isMuted={isMuted}
          />
        </div>

        {/* Side Panels Container */}
        <div className="flex flex-col lg:flex-row">
          {/* Chat Panel */}
          {isChatOpen && (
            <ChatPanel
              messages={chatMessages}
              currentUserId={user?.id}
              onSendMessage={handleSendMessage}
              onClose={handleToggleChat}
            />
          )}

          {/* Participants Panel - Hidden on mobile when chat is open */}
          <div className={`${isChatOpen ? 'hidden lg:block' : 'block'}`}>
            <ParticipantsPanel
              participants={participants}
              currentUserId={user?.id}
              hostId={currentMeeting?.organizer?._id || currentMeeting?.organizer}
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      <MeetingControls
        isMuted={isMuted}
        isVideoOn={isVideoOn}
        isScreenSharing={isScreenSharing}
        isChatOpen={isChatOpen}
        onToggleMute={handleToggleMute}
        onToggleVideo={handleToggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onToggleChat={handleToggleChat}
        onLeaveCall={handleLeaveMeeting}
        participantCount={participants.length + 1}
      />

      {/* Password Modal for Private Meetings */}
      <MeetingPasswordModal
        isOpen={showPasswordModal}
        onClose={handlePasswordModalClose}
        onSubmit={handlePasswordSubmit}
        meetingTitle={currentMeeting?.title || 'Meeting'}
        isLoading={false}
      />

      {/* Schedule Notification Modal */}
      <MeetingScheduleNotification
        isOpen={showScheduleNotification}
        onClose={handleScheduleNotificationClose}
        meetingTitle={currentMeeting?.title || 'Meeting'}
        scheduledTime={currentMeeting?.startTime}
        type={scheduleNotificationType}
      />
    </div>
    </>
  );
};

export default MeetingRoom;
