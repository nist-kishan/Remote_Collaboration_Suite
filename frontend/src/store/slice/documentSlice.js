import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  createDocument,
  getUserDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  shareDocument,
  updateCollaboratorRole,
  removeCollaborator,
  shareDocumentViaEmail,
  searchDocuments
} from '../../api/documentApi';

// Async thunks for API calls
export const fetchDocuments = createAsyncThunk(
  'documents/fetchDocuments',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getUserDocuments(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch documents');
    }
  }
);

export const fetchDocument = createAsyncThunk(
  'documents/fetchDocument',
  async (documentId, { rejectWithValue }) => {
    try {
      if (!documentId) {
        throw new Error('Document ID is required');
      }
      const response = await getDocument(documentId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch document');
    }
  }
);

export const createNewDocument = createAsyncThunk(
  'documents/createDocument',
  async (documentData, { rejectWithValue }) => {
    try {
      const response = await createDocument(documentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create document');
    }
  }
);

export const updateDocumentThunk = createAsyncThunk(
  'documents/updateDocument',
  async ({ documentId, data }, { rejectWithValue }) => {
    try {
      const response = await updateDocument(documentId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update document');
    }
  }
);

export const deleteDocumentThunk = createAsyncThunk(
  'documents/deleteDocument',
  async (documentId, { rejectWithValue }) => {
    try {
      await deleteDocument(documentId);
      return documentId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete document');
    }
  }
);

export const shareDocumentThunk = createAsyncThunk(
  'documents/shareDocument',
  async ({ documentId, data }, { rejectWithValue }) => {
    try {
      const response = await shareDocument(documentId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to share document');
    }
  }
);

export const updateCollaboratorRoleThunk = createAsyncThunk(
  'documents/updateCollaboratorRole',
  async ({ documentId, userId, role }, { rejectWithValue }) => {
    try {
      const response = await updateCollaboratorRole(documentId, userId, role);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update collaborator role');
    }
  }
);

export const removeCollaboratorThunk = createAsyncThunk(
  'documents/removeCollaborator',
  async ({ documentId, userId }, { rejectWithValue }) => {
    try {
      await removeCollaborator(documentId, userId);
      return { documentId, userId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove collaborator');
    }
  }
);

export const shareDocumentViaEmailThunk = createAsyncThunk(
  'documents/shareDocumentViaEmail',
  async ({ documentId, data }, { rejectWithValue }) => {
    try {
      const response = await shareDocumentViaEmail(documentId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send email invitations');
    }
  }
);


export const searchDocumentsThunk = createAsyncThunk(
  'documents/searchDocuments',
  async (searchParams, { rejectWithValue }) => {
    try {
      const response = await searchDocuments(searchParams);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search documents');
    }
  }
);

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
  extraReducers: (builder) => {
    builder
      // Fetch Documents
      .addCase(fetchDocuments.pending, (state) => {
        state.documentsLoading = true;
        state.documentsError = null;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.documentsLoading = false;
        state.documents = action.payload.documents || [];
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.documentsLoading = false;
        state.documentsError = action.payload;
      })
      
      // Fetch Single Document
      .addCase(fetchDocument.pending, (state) => {
        state.documentLoading = true;
        state.documentError = null;
      })
      .addCase(fetchDocument.fulfilled, (state, action) => {
        state.documentLoading = false;
        state.currentDocument = action.payload.document;
      })
      .addCase(fetchDocument.rejected, (state, action) => {
        state.documentLoading = false;
        state.documentError = action.payload;
      })
      
      // Create Document
      .addCase(createNewDocument.pending, (state) => {
        state.operations.creating = true;
      })
      .addCase(createNewDocument.fulfilled, (state, action) => {
        state.operations.creating = false;
        state.documents.unshift(action.payload.document);
        state.currentDocument = action.payload.document;
        state.editorState.hasChanges = false;
      })
      .addCase(createNewDocument.rejected, (state, action) => {
        state.operations.creating = false;
        state.documentError = action.payload;
      })
      
      // Update Document
      .addCase(updateDocumentThunk.pending, (state) => {
        state.operations.updating = true;
      })
      .addCase(updateDocumentThunk.fulfilled, (state, action) => {
        state.operations.updating = false;
        const updatedDocument = action.payload.document;
        
        // Update in documents list
        const index = state.documents.findIndex(doc => doc._id === updatedDocument._id);
        if (index !== -1) {
          state.documents[index] = updatedDocument;
        }
        
        // Update current document
        if (state.currentDocument?._id === updatedDocument._id) {
          state.currentDocument = updatedDocument;
        }
        
        state.editorState.hasChanges = false;
      })
      .addCase(updateDocumentThunk.rejected, (state, action) => {
        state.operations.updating = false;
        state.documentError = action.payload;
      })
      
      // Delete Document
      .addCase(deleteDocumentThunk.pending, (state) => {
        state.operations.deleting = true;
      })
      .addCase(deleteDocumentThunk.fulfilled, (state, action) => {
        state.operations.deleting = false;
        const documentId = action.payload;
        state.documents = state.documents.filter(doc => doc._id !== documentId);
        
        if (state.currentDocument?._id === documentId) {
          state.currentDocument = null;
        }
      })
      .addCase(deleteDocumentThunk.rejected, (state, action) => {
        state.operations.deleting = false;
        state.documentError = action.payload;
      })
      
      // Share Document
      .addCase(shareDocumentThunk.pending, (state) => {
        state.operations.sharing = true;
      })
      .addCase(shareDocumentThunk.fulfilled, (state, action) => {
        state.operations.sharing = false;
        state.isShareModalOpen = false;
        state.selectedDocumentForShare = null;
        
        // Update document in list
        const updatedDocument = action.payload.document;
        const index = state.documents.findIndex(doc => doc._id === updatedDocument._id);
        if (index !== -1) {
          state.documents[index] = updatedDocument;
        }
        
        if (state.currentDocument?._id === updatedDocument._id) {
          state.currentDocument = updatedDocument;
        }
      })
      .addCase(shareDocumentThunk.rejected, (state, action) => {
        state.operations.sharing = false;
        state.documentError = action.payload;
      })
      
      // Share via Email
      .addCase(shareDocumentViaEmailThunk.pending, (state) => {
        state.operations.emailSharing = true;
      })
      .addCase(shareDocumentViaEmailThunk.fulfilled, (state, action) => {
        state.operations.emailSharing = false;
        state.isShareModalOpen = false;
        state.selectedDocumentForShare = null;
      })
      .addCase(shareDocumentViaEmailThunk.rejected, (state, action) => {
        state.operations.emailSharing = false;
        state.documentError = action.payload;
      })
      
      
      // Search Documents
      .addCase(searchDocumentsThunk.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchDocumentsThunk.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload.documents || [];
      })
      .addCase(searchDocumentsThunk.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload;
      });
  }
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

export default documentSlice.reducer;
