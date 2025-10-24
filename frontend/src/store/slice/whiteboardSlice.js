import { createSlice, createSelector } from '@reduxjs/toolkit';

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
    panY: 0,
    undoStack: [],
    redoStack: []
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
  showCreateWhiteboardModal: false,
  showShareWhiteboardModal: false,
  
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
        panY: 0,
        undoStack: [],
        redoStack: []
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
        panY: 0,
        undoStack: [],
        redoStack: []
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
    },
    
    // Additional actions for compatibility
    setShowCreateWhiteboardModal: (state, action) => {
      state.showCreateWhiteboardModal = action.payload;
    },
    
    setShowShareWhiteboardModal: (state, action) => {
      state.showShareWhiteboardModal = action.payload;
    },
    
    setActiveTool: (state, action) => {
      state.editorState.tool = action.payload;
    },
    
    addDrawingElement: (state, action) => {
      state.editorState.elements.push(action.payload);
      state.editorState.hasChanges = true;
    },
    
    updateDrawingElement: (state, action) => {
      const { elementId, updates } = action.payload;
      const element = state.editorState.elements.find(el => el.id === elementId);
      if (element) {
        Object.assign(element, updates);
        state.editorState.hasChanges = true;
      }
    },
    
    removeDrawingElement: (state, action) => {
      const elementId = action.payload;
      state.editorState.elements = state.editorState.elements.filter(el => el.id !== elementId);
      state.editorState.hasChanges = true;
    },
    
    undo: (state) => {
      },
    
    redo: (state) => {
      },
    
    clearWhiteboardErrors: (state) => {
      state.whiteboardsError = null;
      state.whiteboardError = null;
    }
  },
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
  resetWhiteboardState,
  setShowCreateWhiteboardModal,
  setShowShareWhiteboardModal,
  setActiveTool,
  addDrawingElement,
  updateDrawingElement,
  removeDrawingElement,
  undo,
  redo,
  clearWhiteboardErrors
} = whiteboardSlice.actions;

// Export selectors with safety checks
export const selectWhiteboards = (state) => state.whiteboard?.whiteboards || [];
export const selectCurrentWhiteboard = (state) => state.whiteboard?.currentWhiteboard || null;
export const selectEditorState = (state) => state.whiteboard?.editorState || {
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
  panY: 0,
  undoStack: [],
  redoStack: []
};
export const selectCollaborators = (state) => state.whiteboard?.collaborators || [];
export const selectCursors = (state) => state.whiteboard?.cursors || {};
export const selectIsCollaborating = (state) => state.whiteboard?.isCollaborating || false;
export const selectActiveTab = (state) => state.whiteboard?.activeTab || 'all';
export const selectViewMode = (state) => state.whiteboard?.viewMode || 'grid';
export const selectWhiteboardLoading = createSelector(
  [(state) => state.whiteboard?.whiteboardsLoading, (state) => state.whiteboard?.whiteboardLoading],
  (whiteboardsLoading, whiteboardLoading) => ({
    whiteboards: whiteboardsLoading || false,
    whiteboard: whiteboardLoading || false
  })
);
export const selectWhiteboardErrors = createSelector(
  [(state) => state.whiteboard?.whiteboardsError, (state) => state.whiteboard?.whiteboardError],
  (whiteboardsError, whiteboardError) => ({
    whiteboards: whiteboardsError || null,
    whiteboard: whiteboardError || null
  })
);
export const selectWhiteboardOperations = (state) => state.whiteboard?.operations || {
  creating: false,
  updating: false,
  deleting: false,
  sharing: false,
  emailSharing: false
};
export const selectWhiteboardPagination = (state) => state.whiteboard?.pagination || {
  whiteboards: { page: 1, limit: 20, total: 0, pages: 0 }
};

// Modal selectors with safety checks
export const selectIsShareModalOpen = (state) => state.whiteboard?.isShareModalOpen || false;
export const selectSelectedWhiteboardForShare = (state) => state.whiteboard?.selectedWhiteboardForShare || null;

// Additional selectors for useWhiteboard.js compatibility with safety checks
export const selectActiveTool = (state) => state.whiteboard?.editorState?.tool || 'select';
export const selectDrawingElements = (state) => state.whiteboard?.editorState?.elements || [];
export const selectUndoStack = (state) => state.whiteboard?.editorState?.undoStack || [];
export const selectRedoStack = (state) => state.whiteboard?.editorState?.redoStack || [];
export const selectShowCreateWhiteboardModal = (state) => state.whiteboard?.showCreateWhiteboardModal || false;
export const selectShowShareWhiteboardModal = (state) => state.whiteboard?.showShareWhiteboardModal || false;

// Computed selectors with safety checks
export const selectSelectedElement = (state) => {
  const editorState = selectEditorState(state);
  return editorState.elements?.find(el => el.id === editorState.selectedElement) || null;
};

export const selectElementsByType = (state, type) => {
  const editorState = selectEditorState(state);
  return editorState.elements?.filter(el => el.type === type) || [];
};

export const selectCollaboratorCursors = (state) => {
  const cursors = selectCursors(state);
  const collaborators = selectCollaborators(state);
  
  return Object.entries(cursors || {}).map(([collaboratorId, cursor]) => {
    const collaborator = collaborators?.find(c => c.id === collaboratorId);
    return {
      ...cursor,
      collaborator: collaborator || { id: collaboratorId, name: 'Unknown' }
    };
  });
};

export default whiteboardSlice.reducer;
