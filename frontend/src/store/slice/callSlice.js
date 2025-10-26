import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  activeCall: null,
  outgoingCall: null,
  incomingCall: null,
  callHistory: [],

  localStream: null,
  remoteStream: null,

  isMuted: false,
  isVideoEnabled: true,
  isScreenSharing: false,

  participants: [],

  showIncomingCallModal: false,
  showOutgoingCallModal: false,
  showCallWindow: false,

  callStatus: "idle", // idle | incoming | outgoing | connecting | connected | ended
  ringingType: null, // null | incoming | outgoing
  minimized: false,
  minimizedFromRoute: null,
  lastCallMeta: null,

  // Error handling
  errors: [],
};

const callSlice = createSlice({
  name: "call",
  initialState,
  reducers: {
    setActiveCall: (state, action) => {
      state.activeCall = action.payload;
      state.showCallWindow = !!action.payload;
    },

    setOutgoingCall: (state, action) => {
      state.outgoingCall = action.payload;
      state.showOutgoingCallModal = !!action.payload;
    },

    setIncomingCall: (state, action) => {
      state.incomingCall = action.payload;
      state.showIncomingCallModal = !!action.payload;
    },

    setLocalStream: (state, action) => {
      state.localStream = action.payload;
    },

    setRemoteStream: (state, action) => {
      state.remoteStream = action.payload;
    },

    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
    },

    toggleVideo: (state) => {
      state.isVideoEnabled = !state.isVideoEnabled;
    },

    toggleScreenShare: (state) => {
      state.isScreenSharing = !state.isScreenSharing;
    },

    setParticipants: (state, action) => {
      state.participants = action.payload;
    },

    addParticipant: (state, action) => {
      const participant = action.payload;
      const existingIndex = state.participants.findIndex(
        (p) => p.userId === participant.userId
      );

      if (existingIndex >= 0) {
        state.participants[existingIndex] = participant;
      } else {
        state.participants.push(participant);
      }
    },

    removeParticipant: (state, action) => {
      state.participants = state.participants.filter(
        (p) => p.userId !== action.payload
      );
    },

    updateParticipant: (state, action) => {
      const { userId, updates } = action.payload;
      const participantIndex = state.participants.findIndex(
        (p) => p.userId === userId
      );

      if (participantIndex >= 0) {
        state.participants[participantIndex] = {
          ...state.participants[participantIndex],
          ...updates,
        };
      }
    },

    setShowIncomingCallModal: (state, action) => {
      state.showIncomingCallModal = action.payload;
    },

    setShowOutgoingCallModal: (state, action) => {
      state.showOutgoingCallModal = action.payload;
    },

    setShowCallWindow: (state, action) => {
      state.showCallWindow = action.payload;
    },

    setCallStatus: (state, action) => {
      state.callStatus = action.payload || "idle";
    },

    setRingingState: (state, action) => {
      const { type = null, isRinging = false } = action.payload || {};
      state.ringingType = isRinging ? type : null;
    },

    setMinimizedCall: (state, action) => {
      const { minimized = false, fromRoute = null } = action.payload || {};
      state.minimized = minimized;
      state.minimizedFromRoute = minimized ? fromRoute : null;
    },

    setLastCallMeta: (state, action) => {
      state.lastCallMeta = action.payload || null;
    },

    addError: (state, action) => {
      state.errors.push({
        id: Date.now(),
        message: action.payload,
        timestamp: new Date().toISOString(),
      });
    },

    clearError: (state, action) => {
      state.errors = state.errors.filter(
        (error) => error.id !== action.payload
      );
    },

    clearAllErrors: (state) => {
      state.errors = [];
    },

    resetCallState: () => {
      return { ...initialState };
    },
  },
});

// Export actions
export const {
  setActiveCall,
  setOutgoingCall,
  setIncomingCall,
  setLocalStream,
  setRemoteStream,
  toggleMute,
  toggleVideo,
  toggleScreenShare,
  setParticipants,
  addParticipant,
  removeParticipant,
  updateParticipant,
  setShowIncomingCallModal,
  setShowOutgoingCallModal,
  setShowCallWindow,
  setCallStatus,
  setRingingState,
  setMinimizedCall,
  setLastCallMeta,
  addError,
  clearError,
  clearAllErrors,
  resetCallState,
} = callSlice.actions;

// Export selectors
export const selectActiveCall = (state) => state.call.activeCall;
export const selectOutgoingCall = (state) => state.call.outgoingCall;
export const selectIncomingCall = (state) => state.call.incomingCall;
export const selectCallHistory = (state) => state.call.callHistory;
export const selectLocalStream = (state) => state.call.localStream;
export const selectRemoteStream = (state) => state.call.remoteStream;
export const selectIsMuted = (state) => state.call.isMuted;
export const selectIsVideoEnabled = (state) => state.call.isVideoEnabled;
export const selectIsScreenSharing = (state) => state.call.isScreenSharing;
export const selectParticipants = (state) => state.call.participants;
export const selectShowIncomingCallModal = (state) =>
  state.call.showIncomingCallModal;
export const selectShowOutgoingCallModal = (state) =>
  state.call.showOutgoingCallModal;
export const selectShowCallWindow = (state) => state.call.showCallWindow;
export const selectCallStatus = (state) => state.call.callStatus;
export const selectRingingType = (state) => state.call.ringingType;
export const selectIsCallMinimized = (state) => state.call.minimized;
export const selectCallMinimizedFromRoute = (state) =>
  state.call.minimizedFromRoute;
export const selectLastCallMeta = (state) => state.call.lastCallMeta;
export const selectCallErrors = (state) => state.call.errors;

export default callSlice.reducer;
