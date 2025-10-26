import { useCallback, useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useSocket } from './useSocket';
import { useMeetingWebRTC } from './useMeetingWebRTC';
import { meetingApi } from '../api/meetingApi';
import {
  setMeetings,
  addMeeting,
  updateMeetingInList,
  removeMeetingFromList,
  setCurrentMeeting,
  clearCurrentMeeting,
  setLoading,
  setError,
  clearError,
  setInMeeting,
  setParticipants,
  addParticipant,
  removeParticipant,
  clearStreams,
  toggleMute,
  setMuted,
  toggleVideo,
  setVideoOn,
  toggleScreenShare,
  setScreenSharing,
  addChatMessage,
  setChatMessages,
  toggleChat,
  setChatOpen,
  setShowCreateMeetingModal,
  setShowJoinMeetingModal,
  setPagination,
  selectMeetings,
  selectCurrentMeeting,
  selectMeetingLoading,
  selectMeetingError,
  selectIsInMeeting,
  selectParticipants,
  selectIsMuted,
  selectIsVideoOn,
  selectIsScreenSharing,
  selectChatMessages,
  selectIsChatOpen,
  selectShowCreateMeetingModal,
  selectShowJoinMeetingModal,
  selectMeetingPagination
} from '../store/slice/meetingSlice';

/**
 * Consolidated Meeting Hook - All meeting-related functionality
 * Follows the architecture pattern: Redux for state, React Query for API calls, Custom hooks for business logic
 * Integrates with backend meeting controller and WebRTC for many-to-many video streaming
 */
export const useMeeting = (meetingId = null) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.auth);
  const { socket, isConnected } = useSocket();
  
  // WebRTC hook for meeting video streaming (separate from regular calls)
  const webRTC = useMeetingWebRTC(meetingId, user?.id);

  // Redux state selectors
  const meetings = useSelector(selectMeetings);
  const currentMeeting = useSelector(selectCurrentMeeting);
  const meetingLoading = useSelector(selectMeetingLoading);
  const meetingError = useSelector(selectMeetingError);
  const isInMeeting = useSelector(selectIsInMeeting);
  const participants = useSelector(selectParticipants);
  const isMuted = useSelector(selectIsMuted);
  const isVideoOn = useSelector(selectIsVideoOn);
  const isScreenSharing = useSelector(selectIsScreenSharing);
  const chatMessages = useSelector(selectChatMessages);
  const isChatOpen = useSelector(selectIsChatOpen);
  const showCreateMeetingModal = useSelector(selectShowCreateMeetingModal);
  const showJoinMeetingModal = useSelector(selectShowJoinMeetingModal);
  const pagination = useSelector(selectMeetingPagination);

  // Local state
  const [activeTab, setActiveTab] = useState('all');
  const peerConnectionsRef = useRef({});

  // React Query for API calls
  const {
    data: meetingsData,
    isLoading: meetingsLoading,
    error: meetingsError,
    refetch: refetchMeetings
  } = useQuery({
    queryKey: ['meetings'],
    queryFn: () => meetingApi.getUserMeetings(),
    staleTime: 30000, // 30 seconds
  });

  const {
    data: meetingData,
    isLoading: meetingDataLoading,
    error: meetingDataError,
    refetch: refetchMeeting
  } = useQuery({
    queryKey: ['meeting', meetingId],
    queryFn: () => meetingApi.getMeeting(meetingId),
    enabled: !!meetingId,
    staleTime: 10000,
  });

  // Mutations
  const createInstantMeetingMutation = useMutation({
    mutationFn: (data) => meetingApi.createInstantMeeting(data),
    onSuccess: async (response) => {
      // Backend returns: { success, statusCode, message, data: { meeting } }
      // Axios wraps it in response.data
      const meeting = response.data?.data?.meeting || response.data?.meeting;
      
      if (!meeting) {
        toast.error('Meeting created but data structure is unexpected');
        return;
      }
      
      queryClient.invalidateQueries(['meetings']);
      dispatch(setCurrentMeeting(meeting));
      dispatch(setInMeeting(true));
      toast.success('Meeting created successfully!');
      
      // Initialize WebRTC
      try {
        await webRTC.initializeLocalStream();
        webRTC.joinCallRoom();
      } catch (error) {
        console.error('Failed to initialize media:', error);
      }
      
      // Navigate to meeting room
      navigate(`/meeting/${meeting.meetingId}`);
    },
    onError: (error) => {
      console.error('❌ Instant meeting creation error:', error);
      console.error('❌ Error response:', error?.response);
      toast.error(error?.response?.data?.message || 'Failed to create meeting');
    },
  });

  const createScheduledMeetingMutation = useMutation({
    mutationFn: (data) => meetingApi.createScheduledMeeting(data),
    onSuccess: (response) => {
      // Backend returns: { success, statusCode, message, data: { meeting } }
      // Axios wraps it in response.data
      const meeting = response.data?.data?.meeting || response.data?.meeting;
      
      if (meeting) {
        queryClient.invalidateQueries(['meetings']);
        dispatch(addMeeting(meeting));
        toast.success('Scheduled meeting created successfully!');
      } else {
        console.error('❌ Meeting data not found in response');
        toast.error('Meeting created but data structure is unexpected');
      }
    },
    onError: (error) => {
      console.error('❌ Scheduled meeting creation error:', error);
      console.error('❌ Error response:', error?.response);
      toast.error(error?.response?.data?.message || 'Failed to create scheduled meeting');
    },
  });

  const joinMeetingMutation = useMutation({
    mutationFn: ({ meetingId, password }) => meetingApi.joinMeeting(meetingId, password),
    onSuccess: async (response) => {
      // Backend returns: { success, statusCode, message, data: { meeting } }
      // Axios wraps it in response.data
      const meeting = response.data?.data?.meeting || response.data?.meeting;
      
      if (!meeting) {
        toast.error('Failed to join meeting - invalid response');
        return;
      }

      // Validate scheduled meeting time
      if (meeting.meetingType === 'scheduled' && meeting.startTime) {
        const scheduledTime = new Date(meeting.startTime);
        const now = new Date();
        const timeDiff = scheduledTime - now;
        const minutesDiff = timeDiff / (1000 * 60);

        // Meeting hasn't started yet (more than 10 minutes early)
        if (minutesDiff > 10) {
          toast.error(`This meeting is scheduled for ${scheduledTime.toLocaleString()}. Please join closer to the start time.`);
          return;
        }

        // Meeting ended (more than meeting duration after scheduled time)
        const meetingDuration = meeting.duration || 60; // default 60 minutes
        if (minutesDiff < -meetingDuration) {
          toast.error('This meeting has already ended.');
          return;
        }
      }

      // Check participant limit for public meetings
      if (meeting.accessType === 'public' && meeting.maxParticipants) {
        const currentParticipants = meeting.attendees?.filter(a => a.status === 'accepted' || a.status === 'joined').length || 0;
        if (currentParticipants >= meeting.maxParticipants) {
          toast.error(`This meeting has reached its maximum capacity of ${meeting.maxParticipants} participants.`);
          return;
        }
      }
      
      dispatch(setCurrentMeeting(meeting));
      dispatch(setInMeeting(true));
      // Don't show toast - meeting UI shows you've joined
      
      // Initialize WebRTC
      try {
        await webRTC.initializeLocalStream();
        webRTC.joinCallRoom();
      } catch (error) {
        console.error('Failed to initialize media:', error);
      }
      
      // Navigate to meeting room
      navigate(`/meeting/${meeting.meetingId}`);
    },
    onError: (error) => {
      console.error('❌ Join meeting error:', error);
      console.error('❌ Error response:', error?.response);
      const errorMessage = error?.response?.data?.message || 'Failed to join meeting';
      
      // Handle specific error cases
      if (error?.response?.status === 401) {
        toast.error('Invalid password. Please try again.');
      } else if (error?.response?.status === 403) {
        toast.error('You do not have permission to join this meeting.');
      } else if (error?.response?.status === 404) {
        toast.error('Meeting not found.');
      } else {
        toast.error(errorMessage);
      }
    },
  });

  const endMeetingMutation = useMutation({
    mutationFn: (meetingId) => meetingApi.endMeeting(meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries(['meetings']);
      webRTC.cleanup();
      dispatch(setInMeeting(false));
      dispatch(clearCurrentMeeting());
      dispatch(clearStreams());
      dispatch(setParticipants([]));
      toast.success('Meeting ended successfully!');
      navigate('/meetings');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to end meeting');
    },
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: (meetingId) => meetingApi.deleteMeeting(meetingId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['meetings']);
      dispatch(removeMeetingFromList(variables));
      if (currentMeeting?._id === variables) {
        dispatch(clearCurrentMeeting());
      }
      toast.success('Meeting deleted successfully!');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete meeting');
    },
  });

  // Business logic functions
  const handleCreateInstantMeeting = useCallback(async (meetingData) => {
    try {
      await createInstantMeetingMutation.mutateAsync(meetingData);
    } catch (error) {
      // Error handled in mutation
    }
  }, [createInstantMeetingMutation]);

  const handleCreateScheduledMeeting = useCallback(async (meetingData) => {
    try {
      await createScheduledMeetingMutation.mutateAsync(meetingData);
    } catch (error) {
      // Error handled in mutation
    }
  }, [createScheduledMeetingMutation]);

  const handleJoinMeeting = useCallback(async (meetingId, password) => {
    try {
      await joinMeetingMutation.mutateAsync({ meetingId, password });
    } catch (error) {
      // Error handled in mutation
    }
  }, [joinMeetingMutation]);

  const handleEndMeeting = useCallback(async (meetingId) => {
    try {
      await endMeetingMutation.mutateAsync(meetingId);
    } catch (error) {
      // Error handled in mutation
    }
  }, [endMeetingMutation]);

  const handleDeleteMeeting = useCallback(async (meetingId) => {
    try {
      await deleteMeetingMutation.mutateAsync(meetingId);
    } catch (error) {
      // Error handled in mutation
    }
  }, [deleteMeetingMutation]);

  const handleLeaveMeeting = useCallback(() => {
    webRTC.leaveCallRoom();
    webRTC.cleanup();
    dispatch(setInMeeting(false));
    dispatch(clearCurrentMeeting());
    dispatch(clearStreams());
    dispatch(setParticipants([]));
    dispatch(setChatMessages([]));
    navigate('/meetings');
    toast.success('Left meeting successfully');
  }, [dispatch, navigate, webRTC]);

  const handleToggleMute = useCallback(() => {
    const newMutedState = !isMuted;
    dispatch(toggleMute());
    webRTC.toggleAudio(!newMutedState);
  }, [dispatch, isMuted, webRTC]);

  const handleToggleVideo = useCallback(() => {
    const newVideoState = !isVideoOn;
    dispatch(toggleVideo());
    webRTC.toggleVideo(newVideoState);
  }, [dispatch, isVideoOn, webRTC]);

  const handleToggleScreenShare = useCallback(async () => {
    try {
      if (!isScreenSharing) {
        await webRTC.startScreenShare();
        dispatch(setScreenSharing(true));
        toast.success('Screen sharing started');
      } else {
        webRTC.stopScreenShare();
        dispatch(setScreenSharing(false));
        toast.success('Screen sharing stopped');
      }
    } catch (error) {
      console.error('Failed to toggle screen share:', error);
    }
  }, [dispatch, isScreenSharing, webRTC]);

  const handleToggleChat = useCallback(() => {
    dispatch(toggleChat());
  }, [dispatch]);

  const handleOpenCreateMeetingModal = useCallback(() => {
    dispatch(setShowCreateMeetingModal(true));
  }, [dispatch]);

  const handleCloseCreateMeetingModal = useCallback(() => {
    dispatch(setShowCreateMeetingModal(false));
  }, [dispatch]);

  const handleOpenJoinMeetingModal = useCallback(() => {
    dispatch(setShowJoinMeetingModal(true));
  }, [dispatch]);

  const handleCloseJoinMeetingModal = useCallback(() => {
    dispatch(setShowJoinMeetingModal(false));
  }, [dispatch]);

  // Socket event handlers for meeting room connection and participant management
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Handle meeting created event
    const handleMeetingCreated = (data) => {
      dispatch(addMeeting(data.meeting));
      toast.success('New meeting created');
    };

    // Handle meeting updated event
    const handleMeetingUpdated = (data) => {
      dispatch(updateMeetingInList(data.meeting));
      if (currentMeeting?._id === data.meeting._id) {
        dispatch(setCurrentMeeting(data.meeting));
      }
    };

    // Handle meeting started event
    const handleMeetingStarted = (data) => {
      dispatch(updateMeetingInList({ ...data.meeting, status: 'started' }));
      if (currentMeeting?._id === data.meeting._id) {
        dispatch(setCurrentMeeting({ ...data.meeting, status: 'started' }));
      }
    };

    // Handle meeting ended event
    const handleMeetingEnded = (data) => {
      dispatch(updateMeetingInList({ ...data.meeting, status: 'ended' }));
      if (currentMeeting?._id === data.meeting._id) {
        dispatch(setCurrentMeeting({ ...data.meeting, status: 'ended' }));
        dispatch(setInMeeting(false));
        dispatch(clearStreams());
        dispatch(setParticipants([]));
        toast('Meeting has ended', { icon: 'ℹ️' });
        navigate('/meetings');
      }
    };

    // Handle participant joined
    const handleParticipantJoined = (data) => {
      if (currentMeeting?._id === data.meetingId) {
        dispatch(addParticipant(data.participant));
        toast(`${data.participant.user.name} joined the meeting`, { icon: '👋' });
      }
    };

    // Handle participant left
    const handleParticipantLeft = (data) => {
      if (currentMeeting?._id === data.meetingId) {
        dispatch(removeParticipant(data.userId));
        toast('A participant left the meeting', { icon: '👋' });
      }
    };

    // Handle meeting room joined
    const handleMeetingRoomJoined = (data) => {
      dispatch(setInMeeting(true));
    };

    // Handle meeting room left
    const handleMeetingRoomLeft = (data) => {
      dispatch(setInMeeting(false));
      dispatch(clearStreams());
      dispatch(setParticipants([]));
    };

    // Handle meeting will be deleted notification
    const handleMeetingWillBeDeleted = (data) => {
      toast(`This meeting will be automatically deleted in 5 minutes`, {
        duration: 10000,
        icon: '⏰'
      });
    };

    // Handle meeting deleted notification
    const handleMeetingDeleted = (data) => {
      if (currentMeeting?._id === data.meetingId) {
        toast('This meeting has been automatically deleted', { icon: '🗑️' });
        dispatch(removeMeetingFromList(data.meetingId));
        dispatch(clearCurrentMeeting());
        dispatch(setInMeeting(false));
        navigate('/meetings');
      }
    };

    // Handle meeting chat message
    const handleMeetingChatMessage = (data) => {
      dispatch(addChatMessage(data));
    };

    // Register socket event listeners
    socket.on('meeting_created', handleMeetingCreated);
    socket.on('meeting_updated', handleMeetingUpdated);
    socket.on('meeting_started', handleMeetingStarted);
    socket.on('meeting_ended', handleMeetingEnded);
    socket.on('participant_joined', handleParticipantJoined);
    socket.on('participant_left', handleParticipantLeft);
    socket.on('meeting_room_joined', handleMeetingRoomJoined);
    socket.on('meeting_room_left', handleMeetingRoomLeft);
    socket.on('meeting_will_be_deleted', handleMeetingWillBeDeleted);
    socket.on('meeting_deleted', handleMeetingDeleted);
    socket.on('meeting_chat_message', handleMeetingChatMessage);

    return () => {
      // Cleanup socket event listeners
      socket.off('meeting_created', handleMeetingCreated);
      socket.off('meeting_updated', handleMeetingUpdated);
      socket.off('meeting_started', handleMeetingStarted);
      socket.off('meeting_ended', handleMeetingEnded);
      socket.off('participant_joined', handleParticipantJoined);
      socket.off('participant_left', handleParticipantLeft);
      socket.off('meeting_room_joined', handleMeetingRoomJoined);
      socket.off('meeting_room_left', handleMeetingRoomLeft);
      socket.off('meeting_will_be_deleted', handleMeetingWillBeDeleted);
      socket.off('meeting_deleted', handleMeetingDeleted);
      socket.off('meeting_chat_message', handleMeetingChatMessage);
    };
  }, [socket, isConnected, currentMeeting, dispatch, navigate]);

  // Join meeting room when in meeting
  useEffect(() => {
    if (!socket || !isConnected || !currentMeeting) return;

    // Join the meeting room
    socket.emit('join_meeting_room', { meetingId: currentMeeting._id });

    // Setup participant management
    const setupParticipantManagement = async () => {
      try {
        // Get current participants
        const participantsResponse = await meetingApi.getMeetingParticipants(currentMeeting._id);
        if (participantsResponse?.data?.participants) {
          dispatch(setParticipants(participantsResponse.data.participants));
        }
      } catch (error) {
        console.error('❌ Error fetching meeting participants:', error);
      }
    };

    setupParticipantManagement();

    return () => {
      // Leave the meeting room
      socket.emit('leave_meeting_room', { meetingId: currentMeeting._id });
    };
  }, [socket, isConnected, currentMeeting, dispatch]);

  // Update meetings list when data changes
  useEffect(() => {
    // Backend returns: { success, statusCode, message, data: { meetings } }
    // Axios wraps it in response.data
    const meetings = meetingsData?.data?.data?.meetings || meetingsData?.data?.meetings;
    
    if (meetings) {
      dispatch(setMeetings(meetings));
    }
  }, [meetingsData, dispatch]);

  // Update current meeting when data changes
  useEffect(() => {
    // Backend returns: { success, statusCode, message, data: { meeting } }
    // Axios wraps it in response.data
    const meeting = meetingData?.data?.data?.meeting || meetingData?.data?.meeting;
    
    if (meeting) {
      dispatch(setCurrentMeeting(meeting));
      // Set participants from meeting data
      if (meeting.attendees) {
        dispatch(setParticipants(meeting.attendees));
      }
    }
  }, [meetingData, dispatch]);

  // Initialize WebRTC when entering a meeting
  useEffect(() => {
    if (meetingId && isInMeeting && !webRTC.isInitialized) {
      const initMedia = async () => {
        try {
          await webRTC.initializeLocalStream();
          webRTC.joinCallRoom();
        } catch (error) {
          console.error('Failed to initialize media:', error);
          toast.error('Failed to access camera/microphone');
        }
      };
      initMedia();
    }
  }, [meetingId, isInMeeting, webRTC]);

  return {
    // State
    meetings: meetingsData?.data?.data?.meetings || meetingsData?.data?.meetings || [],
    currentMeeting,
    activeTab,
    isLoading: meetingsLoading || meetingDataLoading,
    error: meetingsError || meetingDataError,
    isInMeeting,
    participants,
    localStream: webRTC.localStream,
    remoteStreams: webRTC.remoteStreams,
    isMuted,
    isVideoOn,
    isScreenSharing,
    chatMessages,
    isChatOpen,
    showCreateMeetingModal,
    showJoinMeetingModal,
    pagination,
    connectionStatus: webRTC.connectionStatus,

    // Actions
    handleCreateInstantMeeting,
    handleCreateScheduledMeeting,
    handleJoinMeeting,
    handleEndMeeting,
    handleDeleteMeeting,
    handleLeaveMeeting,
    handleToggleMute,
    handleToggleVideo,
    handleToggleScreenShare,
    handleToggleChat,
    handleOpenCreateMeetingModal,
    handleCloseCreateMeetingModal,
    handleOpenJoinMeetingModal,
    handleCloseJoinMeetingModal,
    setActiveTab,
    
    // Utility functions
    refetchMeetings,
    refetchMeeting,
    clearErrors: () => dispatch(clearError()),

    // Operation states
    isCreating: createInstantMeetingMutation.isPending || createScheduledMeetingMutation.isPending,
    isJoining: joinMeetingMutation.isPending,
    isEnding: endMeetingMutation.isPending,
    isDeleting: deleteMeetingMutation.isPending,
    
    // WebRTC functions
    webRTC
  };
};

export default useMeeting;

