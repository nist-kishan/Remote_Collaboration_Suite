import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  startCall,
  endCall,
  getCallHistory,
  getCallById
} from '../../api/callApi';

// Async thunks for API calls
export const startCallThunk = createAsyncThunk(
  'call/startCall',
  async (callData, { rejectWithValue }) => {
    try {
      const response = await startCall(callData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start call');
    }
  }
);

export const endCallThunk = createAsyncThunk(
  'call/endCall',
  async (callId, { rejectWithValue }) => {
    try {
      const response = await endCall(callId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to end call');
    }
  }
);

export const fetchCallHistory = createAsyncThunk(
  'call/fetchCallHistory',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getCallHistory(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch call history');
    }
  }
);

export const fetchCallById = createAsyncThunk(
  'call/fetchCallById',
  async (callId, { rejectWithValue }) => {
    try {
      const response = await getCallById(callId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch call');
    }
  }
);

const initialState = {
  // Call state
  activeCall: null,
  outgoingCall: null,
  incomingCall: null,
  callHistory: [],
  
  // WebRTC state
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isVideoEnabled: true,
  isScreenSharing: false,
  
  // Call participants
  participants: [],
  localParticipant: null,
  
  // UI state
  showIncomingCallModal: false,
  showOutgoingCallModal: false,
  showCallWindow: false,
  
  // Loading states
  loading: {
    startingCall: false,
    endingCall: false,
    fetchingHistory: false,
    fetchingCall: false
  },
  
  // Error states
  errors: {
    startingCall: null,
    endingCall: null,
    fetchingHistory: null,
    fetchingCall: null
  },
  
  // Pagination
  pagination: {
    history: { page: 1, limit: 20, total: 0, pages: 0 }
  }
};

const callSlice = createSlice({
  name: 'call',
  initialState,
  reducers: {
    // Call state management
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
    
    clearCall: (state) => {
      state.activeCall = null;
      state.outgoingCall = null;
      state.incomingCall = null;
      state.showIncomingCallModal = false;
      state.showOutgoingCallModal = false;
      state.showCallWindow = false;
    },
    
    // WebRTC state management
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
    
    // Participants management
    setParticipants: (state, action) => {
      state.participants = action.payload;
    },
    
    addParticipant: (state, action) => {
      const participant = action.payload;
      const exists = state.participants.find(p => p.id === participant.id);
      if (!exists) {
        state.participants.push(participant);
      }
    },
    
    removeParticipant: (state, action) => {
      const participantId = action.payload;
      state.participants = state.participants.filter(p => p.id !== participantId);
    },
    
    updateParticipant: (state, action) => {
      const { participantId, updates } = action.payload;
      const participant = state.participants.find(p => p.id === participantId);
      if (participant) {
        Object.assign(participant, updates);
      }
    },
    
    // Modal management
    setShowIncomingCallModal: (state, action) => {
      state.showIncomingCallModal = action.payload;
    },
    
    setShowOutgoingCallModal: (state, action) => {
      state.showOutgoingCallModal = action.payload;
    },
    
    setShowCallWindow: (state, action) => {
      state.showCallWindow = action.payload;
    },
    
    // Error management
    clearError: (state, action) => {
      const errorType = action.payload;
      if (state.errors[errorType]) {
        state.errors[errorType] = null;
      }
    },
    
    clearAllErrors: (state) => {
      Object.keys(state.errors).forEach(key => {
        state.errors[key] = null;
      });
    },
    
    // Reset state
    resetCallState: (state) => {
      return { ...initialState };
    }
  },
  extraReducers: (builder) => {
    builder
      // Start call
      .addCase(startCallThunk.pending, (state) => {
        state.loading.startingCall = true;
        state.errors.startingCall = null;
      })
      .addCase(startCallThunk.fulfilled, (state, action) => {
        state.loading.startingCall = false;
        state.activeCall = action.payload.call;
        state.showCallWindow = true;
      })
      .addCase(startCallThunk.rejected, (state, action) => {
        state.loading.startingCall = false;
        state.errors.startingCall = action.payload;
      })
      
      // End call
      .addCase(endCallThunk.pending, (state) => {
        state.loading.endingCall = true;
        state.errors.endingCall = null;
      })
      .addCase(endCallThunk.fulfilled, (state, action) => {
        state.loading.endingCall = false;
        state.activeCall = null;
        state.showCallWindow = false;
        state.localStream = null;
        state.remoteStream = null;
        state.participants = [];
      })
      .addCase(endCallThunk.rejected, (state, action) => {
        state.loading.endingCall = false;
        state.errors.endingCall = action.payload;
      })
      
      // Fetch call history
      .addCase(fetchCallHistory.pending, (state) => {
        state.loading.fetchingHistory = true;
        state.errors.fetchingHistory = null;
      })
      .addCase(fetchCallHistory.fulfilled, (state, action) => {
        state.loading.fetchingHistory = false;
        state.callHistory = action.payload.calls || [];
        state.pagination.history = action.payload.pagination || state.pagination.history;
      })
      .addCase(fetchCallHistory.rejected, (state, action) => {
        state.loading.fetchingHistory = false;
        state.errors.fetchingHistory = action.payload;
      })
      
      // Fetch call by ID
      .addCase(fetchCallById.pending, (state) => {
        state.loading.fetchingCall = true;
        state.errors.fetchingCall = null;
      })
      .addCase(fetchCallById.fulfilled, (state, action) => {
        state.loading.fetchingCall = false;
        state.activeCall = action.payload.call;
      })
      .addCase(fetchCallById.rejected, (state, action) => {
        state.loading.fetchingCall = false;
        state.errors.fetchingCall = action.payload;
      });
  }
});

// Export actions
export const {
  setActiveCall,
  setOutgoingCall,
  setIncomingCall,
  clearCall,
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
  clearError,
  clearAllErrors,
  resetCallState
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
export const selectCallLoading = (state) => state.call.loading;
export const selectCallErrors = (state) => state.call.errors;
export const selectCallPagination = (state) => state.call.pagination;

// Modal selectors
export const selectShowIncomingCallModal = (state) => state.call.showIncomingCallModal;
export const selectShowOutgoingCallModal = (state) => state.call.showOutgoingCallModal;
export const selectShowCallWindow = (state) => state.call.showCallWindow;

export default callSlice.reducer;
