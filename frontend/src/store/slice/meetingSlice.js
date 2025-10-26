import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Current meeting
  currentMeeting: null,
  
  // Meeting list
  meetings: [],
  
  // UI state
  isLoading: false,
  error: null,
  
  // Meeting room state
  isInMeeting: false,
  participants: [],
  
  // Meeting settings
  isMuted: false,
  isVideoOn: true,
  isScreenSharing: false,
  
  // Chat
  chatMessages: [],
  isChatOpen: false,
  
  // Modals
  showCreateMeetingModal: false,
  showJoinMeetingModal: false,
  
  // Minimized meeting (picture-in-picture)
  isMinimized: false,
  minimizedMeetingId: null,
  
  // Pagination
  pagination: {
    page: 1,
    limit: 10,
    total: 0
  }
};

const meetingSlice = createSlice({
  name: 'meeting',
  initialState,
  reducers: {
    // Meeting list actions
    setMeetings: (state, action) => {
      state.meetings = action.payload;
    },
    
    addMeeting: (state, action) => {
      state.meetings.unshift(action.payload);
    },
    
    updateMeetingInList: (state, action) => {
      const index = state.meetings.findIndex(m => m._id === action.payload._id);
      if (index !== -1) {
        state.meetings[index] = action.payload;
      }
    },
    
    removeMeetingFromList: (state, action) => {
      state.meetings = state.meetings.filter(m => m._id !== action.payload);
    },
    
    // Current meeting actions
    setCurrentMeeting: (state, action) => {
      state.currentMeeting = action.payload;
    },
    
    clearCurrentMeeting: (state) => {
      state.currentMeeting = null;
    },
    
    // UI state actions
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    
    setError: (state, action) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    // Meeting room actions
    setInMeeting: (state, action) => {
      state.isInMeeting = action.payload;
    },
    
    setParticipants: (state, action) => {
      state.participants = action.payload;
    },
    
    addParticipant: (state, action) => {
      const existingIndex = state.participants.findIndex(
        p => p.user._id === action.payload.user._id
      );
      if (existingIndex === -1) {
        state.participants.push(action.payload);
      }
    },
    
    removeParticipant: (state, action) => {
      state.participants = state.participants.filter(
        p => p.user._id !== action.payload
      );
    },
    
    // Note: Streams are managed in useWebRTC hook refs, not in Redux
    // This is because MediaStream objects are not serializable
    clearStreams: (state) => {
      // Placeholder for cleanup actions if needed
    },
    
    // Meeting controls
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
    },
    
    setMuted: (state, action) => {
      state.isMuted = action.payload;
    },
    
    toggleVideo: (state) => {
      state.isVideoOn = !state.isVideoOn;
    },
    
    setVideoOn: (state, action) => {
      state.isVideoOn = action.payload;
    },
    
    toggleScreenShare: (state) => {
      state.isScreenSharing = !state.isScreenSharing;
    },
    
    setScreenSharing: (state, action) => {
      state.isScreenSharing = action.payload;
    },
    
    // Chat actions
    addChatMessage: (state, action) => {
      state.chatMessages.push(action.payload);
    },
    
    setChatMessages: (state, action) => {
      state.chatMessages = action.payload;
    },
    
    toggleChat: (state) => {
      state.isChatOpen = !state.isChatOpen;
    },
    
    setChatOpen: (state, action) => {
      state.isChatOpen = action.payload;
    },
    
    // Modal actions
    setShowCreateMeetingModal: (state, action) => {
      state.showCreateMeetingModal = action.payload;
    },
    
    setShowJoinMeetingModal: (state, action) => {
      state.showJoinMeetingModal = action.payload;
    },
    
    // Minimized meeting actions
    setMinimized: (state, action) => {
      state.isMinimized = action.payload;
    },
    
    setMinimizedMeetingId: (state, action) => {
      state.minimizedMeetingId = action.payload;
    },
    
    minimizeMeeting: (state, action) => {
      state.isMinimized = true;
      state.minimizedMeetingId = action.payload;
    },
    
    restoreMeeting: (state) => {
      state.isMinimized = false;
    },
    
    // Pagination
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    }
  }
});

export const {
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
  setMinimized,
  setMinimizedMeetingId,
  minimizeMeeting,
  restoreMeeting,
  setPagination
} = meetingSlice.actions;

// Selectors
export const selectMeetings = (state) => state.meeting.meetings;
export const selectCurrentMeeting = (state) => state.meeting.currentMeeting;
export const selectMeetingLoading = (state) => state.meeting.isLoading;
export const selectMeetingError = (state) => state.meeting.error;
export const selectIsInMeeting = (state) => state.meeting.isInMeeting;
export const selectParticipants = (state) => state.meeting.participants;
export const selectIsMuted = (state) => state.meeting.isMuted;
export const selectIsVideoOn = (state) => state.meeting.isVideoOn;
export const selectIsScreenSharing = (state) => state.meeting.isScreenSharing;
export const selectChatMessages = (state) => state.meeting.chatMessages;
export const selectIsChatOpen = (state) => state.meeting.isChatOpen;
export const selectShowCreateMeetingModal = (state) => state.meeting.showCreateMeetingModal;
export const selectShowJoinMeetingModal = (state) => state.meeting.showJoinMeetingModal;
export const selectIsMinimized = (state) => state.meeting.isMinimized;
export const selectMinimizedMeetingId = (state) => state.meeting.minimizedMeetingId;
export const selectMeetingPagination = (state) => state.meeting.pagination;

export default meetingSlice.reducer;

