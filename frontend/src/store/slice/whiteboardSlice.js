import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  createWhiteboard,
  getUserWhiteboards,
  getWhiteboard,
  updateWhiteboard,
  deleteWhiteboard,
  shareWhiteboard,
  updateCollaboratorRole,
  removeCollaborator as removeCollaboratorApi,
  shareWhiteboardViaEmail
} from '../../api/whiteboardApi';

// Async thunks for API calls
export const createWhiteboardThunk = createAsyncThunk(
  'whiteboard/createWhiteboard',
  async (whiteboardData, { rejectWithValue }) => {
    try {
      const response = await createWhiteboard(whiteboardData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create whiteboard');
    }
  }
);

export const fetchUserWhiteboards = createAsyncThunk(
  'whiteboard/fetchUserWhiteboards',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getUserWhiteboards(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch whiteboards');
    }
  }
);

export const fetchWhiteboard = createAsyncThunk(
  'whiteboard/fetchWhiteboard',
  async (whiteboardId, { rejectWithValue }) => {
    try {
      const response = await getWhiteboard(whiteboardId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch whiteboard');
    }
  }
);

export const updateWhiteboardThunk = createAsyncThunk(
  'whiteboard/updateWhiteboard',
  async ({ whiteboardId, data }, { rejectWithValue }) => {
    try {
      const response = await updateWhiteboard(whiteboardId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update whiteboard');
    }
  }
);

export const deleteWhiteboardThunk = createAsyncThunk(
  'whiteboard/deleteWhiteboard',
  async (whiteboardId, { rejectWithValue }) => {
    try {
      await deleteWhiteboard(whiteboardId);
      return whiteboardId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete whiteboard');
    }
  }
);

export const shareWhiteboardThunk = createAsyncThunk(
  'whiteboard/shareWhiteboard',
  async ({ whiteboardId, data }, { rejectWithValue }) => {
    try {
      const response = await shareWhiteboard(whiteboardId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to share whiteboard');
    }
  }
);

export const updateCollaboratorRoleThunk = createAsyncThunk(
  'whiteboard/updateCollaboratorRole',
  async ({ whiteboardId, userId, role }, { rejectWithValue }) => {
    try {
      const response = await updateCollaboratorRole(whiteboardId, userId, role);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update collaborator role');
    }
  }
);

export const removeCollaboratorThunk = createAsyncThunk(
  'whiteboard/removeCollaborator',
  async ({ whiteboardId, userId }, { rejectWithValue }) => {
    try {
      await removeCollaboratorApi(whiteboardId, userId);
      return { whiteboardId, userId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove collaborator');
    }
  }
);

export const shareWhiteboardViaEmailThunk = createAsyncThunk(
  'whiteboard/shareWhiteboardViaEmail',
  async ({ whiteboardId, data }, { rejectWithValue }) => {
    try {
      const response = await shareWhiteboardViaEmail(whiteboardId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send email invitations');
    }
  }
);

const initialState = {
  // Whiteboards list
  whiteboards: [],
  whiteboardsLoading: false,
  whiteboardsError: null,
  
  // Current whiteboard
  currentWhiteboard: null,
  whiteboardLoading: false,
  whiteboardError: null,
  
  // Whiteboard editor state
  editorState: {
    elements: [],
    selectedElement: null,
    tool: 'select', // 'select', 'pen', 'rectangle', 'circle', 'text', 'eraser'
    color: '#000000',
    strokeWidth: 2,
    fontSize: 16,
    fontFamily: 'Arial',
    isDrawing: false,
    hasChanges: false,
    zoom: 1,
    panX: 0,
    panY: 0
  },
  
  // Collaboration state
  collaborators: [],
  cursors: {},
  isCollaborating: false,
  
  // UI state
  activeTab: 'all', // 'all', 'own', 'shared'
  viewMode: 'grid', // 'grid' or 'list'
  
  // Modals
  isShareModalOpen: false,
  selectedWhiteboardForShare: null,
  
  // Operations
  operations: {
    creating: false,
    updating: false,
    deleting: false,
    sharing: false,
    emailSharing: false
  },
  
  // Pagination
  pagination: {
    whiteboards: { page: 1, limit: 20, total: 0, pages: 0 }
  }
};

const whiteboardSlice = createSlice({
  name: 'whiteboard',
  initialState,
  reducers: {
    // UI state management
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },
    
    setCurrentWhiteboard: (state, action) => {
      state.currentWhiteboard = action.payload;
    },
    
    clearCurrentWhiteboard: (state) => {
      state.currentWhiteboard = null;
      state.whiteboardError = null;
      state.editorState = {
        elements: [],
        selectedElement: null,
        tool: 'select',
        color: '#000000',
        strokeWidth: 2,
        fontSize: 16,
        fontFamily: 'Arial',
        isDrawing: false,
        hasChanges: false,
        zoom: 1,
        panX: 0,
        panY: 0
      };
      state.collaborators = [];
      state.cursors = {};
      state.isCollaborating = false;
    },
    
    // Editor state management
    setEditorState: (state, action) => {
      state.editorState = { ...state.editorState, ...action.payload };
    },
    
    setTool: (state, action) => {
      state.editorState.tool = action.payload;
    },
    
    setColor: (state, action) => {
      state.editorState.color = action.payload;
    },
    
    setStrokeWidth: (state, action) => {
      state.editorState.strokeWidth = action.payload;
    },
    
    setFontSize: (state, action) => {
      state.editorState.fontSize = action.payload;
    },
    
    setFontFamily: (state, action) => {
      state.editorState.fontFamily = action.payload;
    },
    
    setZoom: (state, action) => {
      state.editorState.zoom = action.payload;
    },
    
    setPan: (state, action) => {
      const { x, y } = action.payload;
      state.editorState.panX = x;
      state.editorState.panY = y;
    },
    
    addElement: (state, action) => {
      state.editorState.elements.push(action.payload);
      state.editorState.hasChanges = true;
    },
    
    updateElement: (state, action) => {
      const { elementId, updates } = action.payload;
      const element = state.editorState.elements.find(el => el.id === elementId);
      if (element) {
        Object.assign(element, updates);
        state.editorState.hasChanges = true;
      }
    },
    
    removeElement: (state, action) => {
      const elementId = action.payload;
      state.editorState.elements = state.editorState.elements.filter(el => el.id !== elementId);
      state.editorState.hasChanges = true;
    },
    
    selectElement: (state, action) => {
      state.editorState.selectedElement = action.payload;
    },
    
    clearSelection: (state) => {
      state.editorState.selectedElement = null;
    },
    
    setIsDrawing: (state, action) => {
      state.editorState.isDrawing = action.payload;
    },
    
    resetEditorState: (state) => {
      state.editorState = {
        elements: [],
        selectedElement: null,
        tool: 'select',
        color: '#000000',
        strokeWidth: 2,
        fontSize: 16,
        fontFamily: 'Arial',
        isDrawing: false,
        hasChanges: false,
        zoom: 1,
        panX: 0,
        panY: 0
      };
    },
    
    // Collaboration state management
    setCollaborators: (state, action) => {
      state.collaborators = action.payload;
    },
    
    addCollaborator: (state, action) => {
      const collaborator = action.payload;
      const exists = state.collaborators.find(c => c.id === collaborator.id);
      if (!exists) {
        state.collaborators.push(collaborator);
      }
    },
    
    removeCollaborator: (state, action) => {
      const collaboratorId = action.payload;
      state.collaborators = state.collaborators.filter(c => c.id !== collaboratorId);
      delete state.cursors[collaboratorId];
    },
    
    updateCollaborator: (state, action) => {
      const { collaboratorId, updates } = action.payload;
      const collaborator = state.collaborators.find(c => c.id === collaboratorId);
      if (collaborator) {
        Object.assign(collaborator, updates);
      }
    },
    
    setCursor: (state, action) => {
      const { collaboratorId, cursor } = action.payload;
      state.cursors[collaboratorId] = cursor;
    },
    
    removeCursor: (state, action) => {
      const collaboratorId = action.payload;
      delete state.cursors[collaboratorId];
    },
    
    setIsCollaborating: (state, action) => {
      state.isCollaborating = action.payload;
    },
    
    // Modal management
    openShareModal: (state, action) => {
      state.isShareModalOpen = true;
      state.selectedWhiteboardForShare = action.payload;
    },
    
    closeShareModal: (state) => {
      state.isShareModalOpen = false;
      state.selectedWhiteboardForShare = null;
    },
    
    // Error management
    clearError: (state, action) => {
      const errorType = action.payload;
      if (state[errorType]) {
        state[errorType] = null;
      }
    },
    
    clearAllErrors: (state) => {
      state.whiteboardsError = null;
      state.whiteboardError = null;
    },
    
    // Optimistic updates
    updateWhiteboardInList: (state, action) => {
      const updatedWhiteboard = action.payload;
      const index = state.whiteboards.findIndex(wb => wb._id === updatedWhiteboard._id);
      if (index !== -1) {
        state.whiteboards[index] = updatedWhiteboard;
      }
    },
    
    removeWhiteboardFromList: (state, action) => {
      const whiteboardId = action.payload;
      state.whiteboards = state.whiteboards.filter(wb => wb._id !== whiteboardId);
    },
    
    addWhiteboardToList: (state, action) => {
      state.whiteboards.unshift(action.payload);
    },
    
    // Reset state
    resetWhiteboardState: (state) => {
      return { ...initialState };
    }
  },
  extraReducers: (builder) => {
    builder
      // Create whiteboard
      .addCase(createWhiteboardThunk.pending, (state) => {
        state.operations.creating = true;
      })
      .addCase(createWhiteboardThunk.fulfilled, (state, action) => {
        state.operations.creating = false;
        state.whiteboards.unshift(action.payload.whiteboard);
        state.currentWhiteboard = action.payload.whiteboard;
        state.editorState.hasChanges = false;
      })
      .addCase(createWhiteboardThunk.rejected, (state, action) => {
        state.operations.creating = false;
        state.whiteboardError = action.payload;
      })
      
      // Fetch user whiteboards
      .addCase(fetchUserWhiteboards.pending, (state) => {
        state.whiteboardsLoading = true;
        state.whiteboardsError = null;
      })
      .addCase(fetchUserWhiteboards.fulfilled, (state, action) => {
        state.whiteboardsLoading = false;
        state.whiteboards = action.payload.whiteboards || [];
        state.pagination.whiteboards = action.payload.pagination || state.pagination.whiteboards;
      })
      .addCase(fetchUserWhiteboards.rejected, (state, action) => {
        state.whiteboardsLoading = false;
        state.whiteboardsError = action.payload;
      })
      
      // Fetch whiteboard
      .addCase(fetchWhiteboard.pending, (state) => {
        state.whiteboardLoading = true;
        state.whiteboardError = null;
      })
      .addCase(fetchWhiteboard.fulfilled, (state, action) => {
        state.whiteboardLoading = false;
        state.currentWhiteboard = action.payload.whiteboard;
        state.editorState.elements = action.payload.whiteboard.elements || [];
        state.collaborators = action.payload.whiteboard.collaborators || [];
      })
      .addCase(fetchWhiteboard.rejected, (state, action) => {
        state.whiteboardLoading = false;
        state.whiteboardError = action.payload;
      })
      
      // Update whiteboard
      .addCase(updateWhiteboardThunk.pending, (state) => {
        state.operations.updating = true;
      })
      .addCase(updateWhiteboardThunk.fulfilled, (state, action) => {
        state.operations.updating = false;
        const updatedWhiteboard = action.payload.whiteboard;
        
        // Update in whiteboards list
        const index = state.whiteboards.findIndex(wb => wb._id === updatedWhiteboard._id);
        if (index !== -1) {
          state.whiteboards[index] = updatedWhiteboard;
        }
        
        // Update current whiteboard
        if (state.currentWhiteboard?._id === updatedWhiteboard._id) {
          state.currentWhiteboard = updatedWhiteboard;
        }
        
        state.editorState.hasChanges = false;
      })
      .addCase(updateWhiteboardThunk.rejected, (state, action) => {
        state.operations.updating = false;
        state.whiteboardError = action.payload;
      })
      
      // Delete whiteboard
      .addCase(deleteWhiteboardThunk.pending, (state) => {
        state.operations.deleting = true;
      })
      .addCase(deleteWhiteboardThunk.fulfilled, (state, action) => {
        state.operations.deleting = false;
        const whiteboardId = action.payload;
        state.whiteboards = state.whiteboards.filter(wb => wb._id !== whiteboardId);
        
        if (state.currentWhiteboard?._id === whiteboardId) {
          state.currentWhiteboard = null;
        }
      })
      .addCase(deleteWhiteboardThunk.rejected, (state, action) => {
        state.operations.deleting = false;
        state.whiteboardError = action.payload;
      })
      
      // Share whiteboard
      .addCase(shareWhiteboardThunk.pending, (state) => {
        state.operations.sharing = true;
      })
      .addCase(shareWhiteboardThunk.fulfilled, (state, action) => {
        state.operations.sharing = false;
        state.isShareModalOpen = false;
        state.selectedWhiteboardForShare = null;
        
        // Update whiteboard in list
        const updatedWhiteboard = action.payload.whiteboard;
        const index = state.whiteboards.findIndex(wb => wb._id === updatedWhiteboard._id);
        if (index !== -1) {
          state.whiteboards[index] = updatedWhiteboard;
        }
        
        if (state.currentWhiteboard?._id === updatedWhiteboard._id) {
          state.currentWhiteboard = updatedWhiteboard;
        }
      })
      .addCase(shareWhiteboardThunk.rejected, (state, action) => {
        state.operations.sharing = false;
        state.whiteboardError = action.payload;
      })
      
      // Share via email
      .addCase(shareWhiteboardViaEmailThunk.pending, (state) => {
        state.operations.emailSharing = true;
      })
      .addCase(shareWhiteboardViaEmailThunk.fulfilled, (state, action) => {
        state.operations.emailSharing = false;
        state.isShareModalOpen = false;
        state.selectedWhiteboardForShare = null;
      })
      .addCase(shareWhiteboardViaEmailThunk.rejected, (state, action) => {
        state.operations.emailSharing = false;
        state.whiteboardError = action.payload;
      });
  }
});

// Export actions
export const {
  setActiveTab,
  setViewMode,
  setCurrentWhiteboard,
  clearCurrentWhiteboard,
  setEditorState,
  setTool,
  setColor,
  setStrokeWidth,
  setFontSize,
  setFontFamily,
  setZoom,
  setPan,
  addElement,
  updateElement,
  removeElement,
  selectElement,
  clearSelection,
  setIsDrawing,
  resetEditorState,
  setCollaborators,
  addCollaborator,
  removeCollaborator,
  updateCollaborator,
  setCursor,
  removeCursor,
  setIsCollaborating,
  openShareModal,
  closeShareModal,
  clearError,
  clearAllErrors,
  updateWhiteboardInList,
  removeWhiteboardFromList,
  addWhiteboardToList,
  resetWhiteboardState
} = whiteboardSlice.actions;

// Export selectors
export const selectWhiteboards = (state) => state.whiteboard.whiteboards;
export const selectCurrentWhiteboard = (state) => state.whiteboard.currentWhiteboard;
export const selectEditorState = (state) => state.whiteboard.editorState;
export const selectCollaborators = (state) => state.whiteboard.collaborators;
export const selectCursors = (state) => state.whiteboard.cursors;
export const selectIsCollaborating = (state) => state.whiteboard.isCollaborating;
export const selectActiveTab = (state) => state.whiteboard.activeTab;
export const selectViewMode = (state) => state.whiteboard.viewMode;
export const selectWhiteboardLoading = (state) => ({
  whiteboards: state.whiteboard.whiteboardsLoading,
  whiteboard: state.whiteboard.whiteboardLoading
});
export const selectWhiteboardErrors = (state) => ({
  whiteboards: state.whiteboard.whiteboardsError,
  whiteboard: state.whiteboard.whiteboardError
});
export const selectWhiteboardOperations = (state) => state.whiteboard.operations;
export const selectWhiteboardPagination = (state) => state.whiteboard.pagination;

// Modal selectors
export const selectIsShareModalOpen = (state) => state.whiteboard.isShareModalOpen;
export const selectSelectedWhiteboardForShare = (state) => state.whiteboard.selectedWhiteboardForShare;

// Computed selectors
export const selectSelectedElement = (state) => {
  const editorState = selectEditorState(state);
  return editorState.elements.find(el => el.id === editorState.selectedElement);
};

export const selectElementsByType = (state, type) => {
  const editorState = selectEditorState(state);
  return editorState.elements.filter(el => el.type === type);
};

export const selectCollaboratorCursors = (state) => {
  const cursors = selectCursors(state);
  const collaborators = selectCollaborators(state);
  
  return Object.entries(cursors).map(([collaboratorId, cursor]) => {
    const collaborator = collaborators.find(c => c.id === collaboratorId);
    return {
      ...cursor,
      collaborator: collaborator || { id: collaboratorId, name: 'Unknown' }
    };
  });
};

export default whiteboardSlice.reducer;
