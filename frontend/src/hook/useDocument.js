import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  fetchDocuments,
  fetchDocument,
  createNewDocument,
  updateDocumentThunk,
  deleteDocumentThunk,
  shareDocumentThunk,
  updateCollaboratorRoleThunk,
  removeCollaboratorThunk,
  shareDocumentViaEmailThunk,
  searchDocumentsThunk,
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
} from '../store/slice/documentSlice';

// Custom hook for document management using Redux
export const useDocument = (documentId = null) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const {
    documents,
    currentDocument,
    documentsLoading,
    documentLoading,
    operations,
    editorState,
    isShareModalOpen,
    selectedDocumentForShare,
    documentsError,
    documentError
  } = useSelector((state) => state.documents);

  const { user } = useSelector((state) => state.auth);

  // Document actions
  const handleFetchDocuments = useCallback((params = {}) => {
    dispatch(fetchDocuments(params));
  }, [dispatch]);

  const handleFetchDocument = useCallback((id) => {
    dispatch(fetchDocument(id));
  }, [dispatch]);

  const handleCreateDocument = useCallback((documentData) => {
    dispatch(createNewDocument(documentData)).then((result) => {
      if (result.type.endsWith('/fulfilled')) {
        toast.success('Document created successfully!');
        navigate(`/documents/edit/${result.payload.document._id}`);
      } else {
        toast.error(result.payload || 'Failed to create document');
      }
    });
  }, [dispatch, navigate]);

  const handleUpdateDocument = useCallback((documentId, documentData) => {
    dispatch(updateDocumentThunk({ documentId, data: documentData })).then((result) => {
      if (result.type.endsWith('/fulfilled')) {
        toast.success('Document updated successfully!');
      } else {
        toast.error(result.payload || 'Failed to update document');
      }
    });
  }, [dispatch]);

  const handleDeleteDocument = useCallback((documentId) => {
    dispatch(deleteDocumentThunk(documentId)).then((result) => {
      if (result.type.endsWith('/fulfilled')) {
        toast.success('Document deleted successfully!');
        navigate('/documents');
      } else {
        toast.error(result.payload || 'Failed to delete document');
      }
    });
  }, [dispatch, navigate]);

  const handleShareDocument = useCallback((document) => {
    dispatch(openShareModal(document));
  }, [dispatch]);

  const handleShareViaEmail = useCallback((documentId, emailData) => {
    dispatch(shareDocumentViaEmailThunk({ documentId, data: emailData })).then((result) => {
      if (result.type.endsWith('/fulfilled')) {
        const data = result.payload;
        toast.success(`Email invitations sent successfully! ${data.emailsSent} sent, ${data.emailsFailed} failed.`);
        if (data.failedEmails.length > 0) {
          toast.error(`Failed to send to: ${data.failedEmails.join(', ')}`);
        }
      } else {
        toast.error(result.payload || 'Failed to send email invitations');
      }
    });
  }, [dispatch]);

  const handleUpdateCollaboratorRole = useCallback((documentId, userId, role) => {
    dispatch(updateCollaboratorRoleThunk({ documentId, userId, role })).then((result) => {
      if (result.type.endsWith('/fulfilled')) {
        toast.success('Collaborator role updated successfully!');
      } else {
        toast.error(result.payload || 'Failed to update collaborator role');
      }
    });
  }, [dispatch]);

  const handleRemoveCollaborator = useCallback((documentId, userId) => {
    dispatch(removeCollaboratorThunk({ documentId, userId })).then((result) => {
      if (result.type.endsWith('/fulfilled')) {
        toast.success('Collaborator removed successfully!');
      } else {
        toast.error(result.payload || 'Failed to remove collaborator');
      }
    });
  }, [dispatch]);

  const handleAddComment = useCallback((documentId, commentData) => {
    dispatch(addCommentThunk({ documentId, data: commentData })).then((result) => {
      if (result.type.endsWith('/fulfilled')) {
        toast.success('Comment added successfully!');
      } else {
        toast.error(result.payload || 'Failed to add comment');
      }
    });
  }, [dispatch]);

  const handleFetchComments = useCallback((documentId) => {
    dispatch(fetchDocumentComments(documentId));
  }, [dispatch]);

  const handleCloseShareModal = useCallback(() => {
    dispatch(closeShareModal());
  }, [dispatch]);

  const handleClearErrors = useCallback(() => {
    dispatch(clearErrors());
  }, [dispatch]);

  // Editor actions
  const handleUpdateEditorField = useCallback((field, value) => {
    dispatch(updateEditorField({ field, value }));
  }, [dispatch]);

  const handleResetEditorState = useCallback(() => {
    dispatch(resetEditorState());
  }, [dispatch]);

  const handleInitializeEditorFromDocument = useCallback((document) => {
    dispatch(initializeEditorFromDocument(document));
  }, [dispatch]);

  // UI actions
  const handleSetActiveTab = useCallback((tab) => {
    dispatch(setActiveTab(tab));
  }, [dispatch]);

  const handleSetViewMode = useCallback((mode) => {
    dispatch(setViewMode(mode));
  }, [dispatch]);

  const handleSetSearchQuery = useCallback((query) => {
    dispatch(setSearchQuery(query));
  }, [dispatch]);

  const handleSetSearchFilters = useCallback((filters) => {
    dispatch(setSearchFilters(filters));
  }, [dispatch]);

  const handleClearSearch = useCallback(() => {
    dispatch(clearSearch());
  }, [dispatch]);

  return {
    // Data
    documents,
    currentDocument,
    // Loading states
    documentsLoading,
    documentLoading,
    isCreating: operations.creating,
    isUpdating: operations.updating,
    isDeleting: operations.deleting,
    isSharing: operations.sharing,
    isEmailSharing: operations.emailSharing,
    
    // Error states
    documentsError,
    documentError,
    
    // Editor state
    editorState,
    
    // Modal states
    isShareModalOpen,
    selectedDocumentForShare,
    
    // Actions
    handleFetchDocuments,
    handleFetchDocument,
    handleCreateDocument,
    handleUpdateDocument,
    handleDeleteDocument,
    handleShareDocument,
    handleShareViaEmail,
    handleUpdateCollaboratorRole,
    handleRemoveCollaborator,
    handleAddComment,
    handleFetchComments,
    handleCloseShareModal,
    handleClearErrors,
    
    // Editor actions
    handleUpdateEditorField,
    handleResetEditorState,
    handleInitializeEditorFromDocument,
    
    // UI actions
    handleSetActiveTab,
    handleSetViewMode,
    handleSetSearchQuery,
    handleSetSearchFilters,
    handleClearSearch,
  };
};

// Custom hook for document search using Redux
export const useDocumentSearch = (searchParams = {}) => {
  const dispatch = useDispatch();
  
  const {
    searchResults,
    searchLoading,
    searchError,
    searchQuery,
    searchFilters
  } = useSelector((state) => state.documents);

  const handleSearch = useCallback((params) => {
    dispatch(searchDocumentsThunk(params));
  }, [dispatch]);

  const handleSetSearchQuery = useCallback((query) => {
    dispatch(setSearchQuery(query));
  }, [dispatch]);

  const handleSetSearchFilters = useCallback((filters) => {
    dispatch(setSearchFilters(filters));
  }, [dispatch]);

  const handleClearSearch = useCallback(() => {
    dispatch(clearSearch());
  }, [dispatch]);

  return {
    searchResults,
    searchLoading,
    searchError,
    searchQuery,
    searchFilters,
    handleSearch,
    handleSetSearchQuery,
    handleSetSearchFilters,
    handleClearSearch,
  };
};

// Custom hook for document permissions
export const useDocumentPermissions = (document, currentUser) => {
  if (!document || !currentUser) {
    return {
      canEdit: false,
      canDelete: false,
      canShare: false,
      canComment: false,
      canChangeSettings: false,
      userRole: null,
    };
  }

  const isOwner = document.owner?._id === currentUser._id;
  const userCollaborator = document.collaborators?.find(
    collab => collab.user._id === currentUser._id
  );

  const canEdit = isOwner || userCollaborator?.role === 'editor';
  const canDelete = isOwner;
  const canShare = isOwner || userCollaborator?.role === 'editor';
  const canComment = isOwner || userCollaborator?.role === 'editor' || userCollaborator?.role === 'viewer';
  const canChangeSettings = isOwner;

  return {
    canEdit,
    canDelete,
    canShare,
    canComment,
    canChangeSettings,
    userRole: userCollaborator?.role || (isOwner ? 'owner' : null),
    isOwner,
  };
};
