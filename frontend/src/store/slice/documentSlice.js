import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Documents list
  documents: [],
  documentsLoading: false,
  documentsError: null,
  
  // Current document
  currentDocument: null,
  documentLoading: false,
  documentError: null,

  // Search
  searchResults: [],
  searchLoading: false,
  searchError: null,
  searchQuery: '',
  searchFilters: {
    type: '',
    status: '',
    tags: '',
    dateRange: ''
  },
  
  // UI State
  activeTab: 'all', // 'all', 'own', 'shared'
  viewMode: 'grid', // 'grid' or 'list'
  
  // Modals
  isShareModalOpen: false,
  selectedDocumentForShare: null,
  
  // Document Editor State
  editorState: {
    title: '',
    content: '',
    tags: '',
    status: 'draft',
    visibility: 'private',
    hasChanges: false,
    showSettings: false
  },
  
  // Operations
  operations: {
    creating: false,
    updating: false,
    deleting: false,
    sharing: false,
    emailSharing: false
  }
};

const documentSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    // UI State Management
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },
    
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    
    setSearchFilters: (state, action) => {
      state.searchFilters = { ...state.searchFilters, ...action.payload };
    },
    
    clearSearch: (state) => {
      state.searchQuery = '';
      state.searchFilters = {
        type: '',
        status: '',
        tags: '',
        dateRange: ''
      };
      state.searchResults = [];
      state.searchError = null;
    },
    
    // Modal Management
    openShareModal: (state, action) => {
      state.isShareModalOpen = true;
      state.selectedDocumentForShare = action.payload;
    },
    
    closeShareModal: (state) => {
      state.isShareModalOpen = false;
      state.selectedDocumentForShare = null;
    },
    
    // Editor State Management
    setEditorState: (state, action) => {
      state.editorState = { ...state.editorState, ...action.payload };
    },
    
    updateEditorField: (state, action) => {
      const { field, value } = action.payload;
      state.editorState[field] = value;
      state.editorState.hasChanges = true;
    },
    
    resetEditorState: (state) => {
      state.editorState = {
        title: '',
        content: '',
        tags: '',
        status: 'draft',
        visibility: 'private',
        hasChanges: false,
        showSettings: false
      };
    },
    
    initializeEditorFromDocument: (state, action) => {
      const document = action.payload;
      if (document) {
        state.editorState = {
          title: document.title || '',
          content: document.content || '',
          tags: document.tags?.join(', ') || '',
          status: document.status || 'draft',
          visibility: document.visibility || 'private',
          hasChanges: false,
          showSettings: false
        };
      }
    },
    
    // Document Management
    setCurrentDocument: (state, action) => {
      state.currentDocument = action.payload;
    },
    
    clearCurrentDocument: (state) => {
      state.currentDocument = null;
      state.documentError = null;
    },
    
    // Error Management
    clearErrors: (state) => {
      state.documentsError = null;
      state.documentError = null;
      state.searchError = null;
    },
    
    // Optimistic Updates
    updateDocumentInList: (state, action) => {
      const updatedDocument = action.payload;
      const index = state.documents.findIndex(doc => doc._id === updatedDocument._id);
      if (index !== -1) {
        state.documents[index] = updatedDocument;
      }
    },
    
    removeDocumentFromList: (state, action) => {
      const documentId = action.payload;
      state.documents = state.documents.filter(doc => doc._id !== documentId);
    },
    
    addDocumentToList: (state, action) => {
      state.documents.unshift(action.payload);
    }
  },
});

export const {
  setActiveTab,
  setViewMode,
  setSearchQuery,
  setSearchFilters,
  clearSearch,
  openShareModal,
  closeShareModal,
  setEditorState,
  updateEditorField,
  resetEditorState,
  initializeEditorFromDocument,
  setCurrentDocument,
  clearCurrentDocument,
  clearErrors,
  updateDocumentInList,
  removeDocumentFromList,
  addDocumentToList
} = documentSlice.actions;

// Selectors with safety checks
export const selectDocuments = (state) => state.documents?.documents || [];
export const selectCurrentDocument = (state) => state.documents?.currentDocument || null;
export const selectDocumentsLoading = (state) => state.documents?.documentsLoading || false;
export const selectDocumentLoading = (state) => state.documents?.documentLoading || false;
export const selectOperations = (state) => state.documents?.operations || {
  creating: false,
  updating: false,
  deleting: false,
  sharing: false,
  emailSharing: false
};
export const selectEditorState = (state) => state.documents?.editorState || {
  title: '',
  content: '',
  tags: '',
  status: 'draft',
  visibility: 'private',
  hasChanges: false,
  showSettings: false
};
export const selectIsShareModalOpen = (state) => state.documents?.isShareModalOpen || false;
export const selectSelectedDocumentForShare = (state) => state.documents?.selectedDocumentForShare || null;
export const selectDocumentsError = (state) => state.documents?.documentsError || null;
export const selectDocumentError = (state) => state.documents?.documentError || null;
export const selectSearchResults = (state) => state.documents?.searchResults || [];
export const selectSearchLoading = (state) => state.documents?.searchLoading || false;
export const selectSearchError = (state) => state.documents?.searchError || null;
export const selectSearchQuery = (state) => state.documents?.searchQuery || '';
export const selectSearchFilters = (state) => state.documents?.searchFilters || {
  type: '',
  status: '',
  tags: '',
  dateRange: ''
};
export const selectActiveTab = (state) => state.documents?.activeTab || 'all';
export const selectViewMode = (state) => state.documents?.viewMode || 'grid';

export default documentSlice.reducer;
