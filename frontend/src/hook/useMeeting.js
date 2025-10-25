import { useCallback, useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useSocket } from './useSocket';
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
  setLocalStream,
  addRemoteStream,
  removeRemoteStream,
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
  selectLocalStream,
  selectRemoteStreams,
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
 */
export const useMeeting = (meetingId = null) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.auth);
  const { socket, isConnected } = useSocket();

  // Redux state selectors
  const meetings = useSelector(selectMeetings);
  const currentMeeting = useSelector(selectCurrentMeeting);
  const meetingLoading = useSelector(selectMeetingLoading);
  const meetingError = useSelector(selectMeetingError);
  const isInMeeting = useSelector(selectIsInMeeting);
  const participants = useSelector(selectParticipants);
  const localStream = useSelector(selectLocalStream);
  const remoteStreams = useSelector(selectRemoteStreams);
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
    queryKey: ['meetings', activeTab],
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
    onSuccess: (data) => {
      const meeting = data.data.meeting;
      queryClient.invalidateQueries(['meetings']);
      dispatch(addMeeting(meeting));
      dispatch(setCurrentMeeting(meeting));
      toast.success('Instant meeting created successfully!');
      // Navigate to meeting room
      navigate(`/meeting/${meeting.meetingId}`);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to create instant meeting');
    },
  });

  const createScheduledMeetingMutation = useMutation({
    mutationFn: (data) => meetingApi.createScheduledMeeting(data),
    onSuccess: (data) => {
      const meeting = data.data.meeting;
      queryClient.invalidateQueries(['meetings']);
      dispatch(addMeeting(meeting));
      toast.success('Scheduled meeting created successfully!');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to create scheduled meeting');
    },
  });

  const joinMeetingMutation = useMutation({
    mutationFn: ({ meetingId, password }) => meetingApi.joinMeeting(meetingId, password),
    onSuccess: (data) => {
      const meeting = data.data.meeting;
      dispatch(setCurrentMeeting(meeting));
      dispatch(setInMeeting(true));
      toast.success('Joined meeting successfully!');
      // Navigate to meeting room
      navigate(`/meeting/${meeting.meetingId}`);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to join meeting');
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

  const handleDeleteMeeting = useCallback(async (meetingId) => {
    try {
      await deleteMeetingMutation.mutateAsync(meetingId);
    } catch (error) {
      // Error handled in mutation
    }
  }, [deleteMeetingMutation]);

  const handleLeaveMeeting = useCallback(() => {
    dispatch(setInMeeting(false));
    dispatch(clearCurrentMeeting());
    dispatch(clearStreams());
    dispatch(setParticipants([]));
    dispatch(setChatMessages([]));
    navigate('/meetings');
    toast.success('Left meeting successfully');
  }, [dispatch, navigate]);

  const handleToggleMute = useCallback(() => {
    dispatch(toggleMute());
  }, [dispatch]);

  const handleToggleVideo = useCallback(() => {
    dispatch(toggleVideo());
  }, [dispatch]);

  const handleToggleScreenShare = useCallback(() => {
    dispatch(toggleScreenShare());
  }, [dispatch]);

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

    console.log('🔌 Setting up meeting socket event listeners...');

    // Handle meeting created event
    const handleMeetingCreated = (data) => {
      console.log('📅 Meeting created:', data.meeting);
      dispatch(addMeeting(data.meeting));
      toast.success('New meeting created');
    };

    // Handle meeting updated event
    const handleMeetingUpdated = (data) => {
      console.log('✏️ Meeting updated:', data.meeting);
      dispatch(updateMeetingInList(data.meeting));
      if (currentMeeting?._id === data.meeting._id) {
        dispatch(setCurrentMeeting(data.meeting));
      }
    };

    // Handle meeting started event
    const handleMeetingStarted = (data) => {
      console.log('▶️ Meeting started:', data.meeting);
      dispatch(updateMeetingInList({ ...data.meeting, status: 'started' }));
      if (currentMeeting?._id === data.meeting._id) {
        dispatch(setCurrentMeeting({ ...data.meeting, status: 'started' }));
      }
    };

    // Handle meeting ended event
    const handleMeetingEnded = (data) => {
      console.log('⏹️ Meeting ended:', data.meeting);
      dispatch(updateMeetingInList({ ...data.meeting, status: 'ended' }));
      if (currentMeeting?._id === data.meeting._id) {
        dispatch(setCurrentMeeting({ ...data.meeting, status: 'ended' }));
        dispatch(setInMeeting(false));
        dispatch(clearStreams());
        dispatch(setParticipants([]));
        toast.info('Meeting has ended');
        navigate('/meetings');
      }
    };

    // Handle participant joined
    const handleParticipantJoined = (data) => {
      console.log('👋 Participant joined:', data.participant);
      if (currentMeeting?._id === data.meetingId) {
        dispatch(addParticipant(data.participant));
        toast.info(`${data.participant.user.name} joined the meeting`);
      }
    };

    // Handle participant left
    const handleParticipantLeft = (data) => {
      console.log('👋 Participant left:', data.userId);
      if (currentMeeting?._id === data.meetingId) {
        dispatch(removeParticipant(data.userId));
        toast.info('A participant left the meeting');
      }
    };

    // Handle meeting room joined
    const handleMeetingRoomJoined = (data) => {
      console.log('✅ Joined meeting room:', data.meetingId);
      dispatch(setInMeeting(true));
    };

    // Handle meeting room left
    const handleMeetingRoomLeft = (data) => {
      console.log('👋 Left meeting room:', data.meetingId);
      dispatch(setInMeeting(false));
      dispatch(clearStreams());
      dispatch(setParticipants([]));
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

    return () => {
      console.log('🔌 Cleaning up meeting socket event listeners...');
      // Cleanup socket event listeners
      socket.off('meeting_created', handleMeetingCreated);
      socket.off('meeting_updated', handleMeetingUpdated);
      socket.off('meeting_started', handleMeetingStarted);
      socket.off('meeting_ended', handleMeetingEnded);
      socket.off('participant_joined', handleParticipantJoined);
      socket.off('participant_left', handleParticipantLeft);
      socket.off('meeting_room_joined', handleMeetingRoomJoined);
      socket.off('meeting_room_left', handleMeetingRoomLeft);
    };
  }, [socket, isConnected, currentMeeting, dispatch, navigate]);

  // Join meeting room when in meeting
  useEffect(() => {
    if (!socket || !isConnected || !currentMeeting) return;

    console.log('🔌 Joining meeting room:', currentMeeting._id);

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
      console.log('🔌 Leaving meeting room:', currentMeeting._id);
      // Leave the meeting room
      socket.emit('leave_meeting_room', { meetingId: currentMeeting._id });
    };
  }, [socket, isConnected, currentMeeting, dispatch]);

  // Update meetings list when data changes
  useEffect(() => {
    if (meetingsData?.data?.meetings) {
      dispatch(setMeetings(meetingsData.data.meetings));
    }
  }, [meetingsData, dispatch]);

  // Update current meeting when data changes
  useEffect(() => {
    if (meetingData?.data?.meeting) {
      dispatch(setCurrentMeeting(meetingData.data.meeting));
    }
  }, [meetingData, dispatch]);

  return {
    // State
    meetings: meetingsData?.data?.meetings || [],
    currentMeeting,
    activeTab,
    isLoading: meetingsLoading || meetingDataLoading,
    error: meetingsError || meetingDataError,
    isInMeeting,
    participants,
    localStream,
    remoteStreams,
    isMuted,
    isVideoOn,
    isScreenSharing,
    chatMessages,
    isChatOpen,
    showCreateMeetingModal,
    showJoinMeetingModal,
    pagination,

    // Actions
    handleCreateInstantMeeting,
    handleCreateScheduledMeeting,
    handleJoinMeeting,
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
    isDeleting: deleteMeetingMutation.isPending
  };
};

export default useMeeting;

