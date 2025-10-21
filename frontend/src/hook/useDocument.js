import { useCallback, useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useSocket } from './useSocket';
import {
  // API functions
  getUserDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  shareDocument,
  updateCollaboratorRole,
  removeCollaborator,
  shareDocumentViaEmail,
  searchDocuments,
  autoSaveDocument,
  enableAutoSave,
  getDocumentComments,
  addComment,
  updateComment,
  deleteComment
} from '../api/documentApi';
import {
  // Redux actions
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
  addDocumentToList,
  // Redux selectors
  selectDocuments,
  selectCurrentDocument,
  selectDocumentsLoading,
  selectDocumentLoading,
  selectOperations,
  selectEditorState,
  selectIsShareModalOpen,
  selectSelectedDocumentForShare,
  selectDocumentsError,
  selectDocumentError,
  selectSearchResults,
  selectSearchLoading,
  selectSearchError,
  selectSearchQuery,
  selectSearchFilters,
  selectActiveTab,
  selectViewMode
} from '../store/slice/documentSlice';

/**
 * Consolidated Document Hook - All document-related functionality in one place
 * Combines: useDocument, useDocumentCollaboration, useAutoSave
 */
export const useDocument = (documentId = null, params = {}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.auth);
  const { socket, isConnected } = useSocket();

  // Redux state selectors
  const documents = useSelector(selectDocuments);
  const currentDocument = useSelector(selectCurrentDocument);
  const documentsLoading = useSelector(selectDocumentsLoading);
  const documentLoading = useSelector(selectDocumentLoading);
  const operations = useSelector(selectOperations);
  const editorState = useSelector(selectEditorState);
  const isShareModalOpen = useSelector(selectIsShareModalOpen);
  const selectedDocumentForShare = useSelector(selectSelectedDocumentForShare);
  const documentsError = useSelector(selectDocumentsError);
  const documentError = useSelector(selectDocumentError);
  const searchResults = useSelector(selectSearchResults);
  const searchLoading = useSelector(selectSearchLoading);
  const searchError = useSelector(selectSearchError);
  const searchQuery = useSelector(selectSearchQuery);
  const searchFilters = useSelector(selectSearchFilters);
  const activeTab = useSelector(selectActiveTab);
  const viewMode = useSelector(selectViewMode);

  // Local state for collaboration and auto-save
  const [activeCollaborators, setActiveCollaborators] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [saveStatus, setSaveStatus] = useState({});
  const [isJoined, setIsJoined] = useState(false);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'
  const [lastSaved, setLastSaved] = useState(null);

  // Refs for collaboration and auto-save
  const typingTimeoutRef = useRef(null);
  const lastCursorPositionRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);
  const lastSavedContentRef = useRef('');

  // Fetch documents with React Query
  const { data: documentsData, isLoading: isLoadingDocuments, error: documentsQueryError, refetch: refetchDocuments } = useQuery({
    queryKey: ['documents', params],
    queryFn: () => getUserDocuments(params),
    enabled: !!user,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const { data: documentData, isLoading: isLoadingDocument, error: documentQueryError } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => getDocumentById(documentId),
    enabled: !!user && !!documentId,
    staleTime: 60000,
  });

  const { data: commentsData, isLoading: isLoadingComments, error: commentsError } = useQuery({
    queryKey: ['documentComments', documentId],
    queryFn: () => getDocumentComments(documentId),
    enabled: !!user && !!documentId,
    staleTime: 30000,
  });

  // Mutations
  const createDocumentMutation = useMutation({
    mutationFn: (documentData) => createDocument(documentData),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['documents']);
      toast.success('Document created successfully!');
      navigate(`/documents/edit/${data.data.document._id}`);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to create document');
    },
  });

  const updateDocumentMutation = useMutation({
    mutationFn: ({ documentId, data }) => updateDocument(documentId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['documents']);
      queryClient.invalidateQueries(['document', variables.documentId]);
      toast.success('Document updated successfully!');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update document');
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId) => deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
      toast.success('Document deleted successfully!');
      navigate('/documents');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete document');
    },
  });

  const shareDocumentMutation = useMutation({
    mutationFn: ({ documentId, data }) => shareDocument(documentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['document', documentId]);
      toast.success('Document shared successfully!');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to share document');
    },
  });

  const shareViaEmailMutation = useMutation({
    mutationFn: ({ documentId, data }) => shareDocumentViaEmail(documentId, data),
    onSuccess: (data) => {
      const { emailsSent, emailsFailed, failedEmails } = data.data;
      toast.success(`Email invitations sent successfully! ${emailsSent} sent, ${emailsFailed} failed.`);
      if (failedEmails.length > 0) {
        toast.error(`Failed to send to: ${failedEmails.join(', ')}`);
      }
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to send email invitations');
    },
  });

  const updateCollaboratorRoleMutation = useMutation({
    mutationFn: ({ documentId, userId, role }) => updateCollaboratorRole(documentId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries(['document', documentId]);
      toast.success('Collaborator role updated successfully!');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update collaborator role');
    },
  });

  const removeCollaboratorMutation = useMutation({
    mutationFn: ({ documentId, userId }) => removeCollaborator(documentId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['document', documentId]);
      toast.success('Collaborator removed successfully!');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to remove collaborator');
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ documentId, data }) => addComment(documentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['documentComments', documentId]);
      toast.success('Comment added successfully!');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to add comment');
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ documentId, commentId, data }) => updateComment(documentId, commentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['documentComments', documentId]);
      toast.success('Comment updated successfully!');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update comment');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: ({ documentId, commentId }) => deleteComment(documentId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['documentComments', documentId]);
      toast.success('Comment deleted successfully!');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete comment');
    },
  });

  // Auto-save functions
  const toggleAutoSave = useCallback(async () => {
    if (!documentId) return;

    try {
      if (isAutoSaveEnabled) {
        setIsAutoSaveEnabled(false);
        toast.success('Auto-save disabled');
      } else {
        await enableAutoSave(documentId);
        setIsAutoSaveEnabled(true);
        toast.success('Auto-save enabled');
      }
    } catch (error) {
      toast.error('Failed to toggle auto-save');
    }
  }, [documentId, isAutoSaveEnabled]);

  const performAutoSave = useCallback(async (contentToSave) => {
    if (!documentId || !isAutoSaveEnabled || !contentToSave) {
      return;
    }

    if (contentToSave === lastSavedContentRef.current) {
      return;
    }

    setAutoSaveStatus('saving');
    
    try {
      await autoSaveDocument(documentId, contentToSave);
      lastSavedContentRef.current = contentToSave;
      setAutoSaveStatus('saved');
      setLastSaved(new Date());
    } catch (error) {
      setAutoSaveStatus('error');
    }
  }, [documentId, isAutoSaveEnabled]);

  const debouncedAutoSave = useCallback((contentToSave, debounceMs = 5000) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      performAutoSave(contentToSave);
    }, debounceMs);
  }, [performAutoSave]);

  const manualSave = useCallback(async (contentToSave) => {
    if (!documentId || !contentToSave) {
      return;
    }

    setAutoSaveStatus('saving');
    
    try {
      await autoSaveDocument(documentId, contentToSave);
      lastSavedContentRef.current = contentToSave;
      setAutoSaveStatus('saved');
      setLastSaved(new Date());
      toast.success('Document saved');
      return true;
    } catch (error) {
      setAutoSaveStatus('error');
      toast.error('Failed to save document');
      return false;
    }
  }, [documentId]);

  // Collaboration functions
  const joinDocument = useCallback(() => {
    if (socket && documentId && isConnected) {
      socket.emit('join_document', { documentId });
      setIsJoined(true);
    }
  }, [socket, documentId, isConnected]);

  const leaveDocument = useCallback(() => {
    if (socket && documentId && isJoined) {
      socket.emit('leave_document', { documentId });
      setIsJoined(false);
      setActiveCollaborators([]);
      setTypingUsers([]);
      setSaveStatus({});
    }
  }, [socket, documentId, isJoined]);

  const sendContentChange = useCallback((changeData) => {
    if (socket && documentId && isJoined) {
      socket.emit('document_content_change', {
        documentId,
        ...changeData,
      });
    }
  }, [socket, documentId, isJoined]);

  const sendCursorMove = useCallback((cursorData) => {
    if (socket && documentId && isJoined) {
      const now = Date.now();
      if (lastCursorPositionRef.current && now - lastCursorPositionRef.current < 100) {
        return;
      }
      lastCursorPositionRef.current = now;

      socket.emit('document_cursor_move', {
        documentId,
        ...cursorData,
      });
    }
  }, [socket, documentId, isJoined]);

  const sendSelectionChange = useCallback((selectionData) => {
    if (socket && documentId && isJoined) {
      socket.emit('document_selection_change', {
        documentId,
        ...selectionData,
      });
    }
  }, [socket, documentId, isJoined]);

  const sendTyping = useCallback((typingData = {}) => {
    if (socket && documentId && isJoined) {
      socket.emit('document_typing', {
        documentId,
        ...typingData,
      });
      
      setIsTyping(true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        sendStopTyping();
      }, 2000);
    }
  }, [socket, documentId, isJoined]);

  const sendStopTyping = useCallback(() => {
    if (socket && documentId && isJoined) {
      socket.emit('document_stop_typing', { documentId });
      setIsTyping(false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  }, [socket, documentId, isJoined]);

  const sendFormatChange = useCallback((formatData) => {
    if (socket && documentId && isJoined) {
      socket.emit('document_format_change', {
        documentId,
        ...formatData,
      });
    }
  }, [socket, documentId, isJoined]);

  const sendStructureChange = useCallback((structureData) => {
    if (socket && documentId && isJoined) {
      socket.emit('document_structure_change', {
        documentId,
        ...structureData,
      });
    }
  }, [socket, documentId, isJoined]);

  const sendTitleChange = useCallback((titleData) => {
    if (socket && documentId && isJoined) {
      socket.emit('document_title_change', {
        documentId,
        ...titleData,
      });
    }
  }, [socket, documentId, isJoined]);

  const sendSaveStatus = useCallback((statusData) => {
    if (socket && documentId && isJoined) {
      socket.emit('document_save_status', {
        documentId,
        ...statusData,
      });
    }
  }, [socket, documentId, isJoined]);

  // Document management functions
  const handleFetchDocuments = useCallback((params = {}) => {
    dispatch(fetchDocuments(params));
  }, [dispatch]);

  const handleFetchDocument = useCallback((id) => {
    dispatch(fetchDocument(id));
  }, [dispatch]);

  const handleCreateDocument = useCallback((documentData) => {
    createDocumentMutation.mutate(documentData);
  }, [createDocumentMutation]);

  const handleUpdateDocument = useCallback((documentId, documentData) => {
    updateDocumentMutation.mutate({ documentId, data: documentData });
  }, [updateDocumentMutation]);

  const handleDeleteDocument = useCallback((documentId) => {
    deleteDocumentMutation.mutate(documentId);
  }, [deleteDocumentMutation]);

  const handleShareDocument = useCallback((document) => {
    dispatch(openShareModal(document));
  }, [dispatch]);

  const handleShareViaEmail = useCallback((documentId, emailData) => {
    shareViaEmailMutation.mutate({ documentId, data: emailData });
  }, [shareViaEmailMutation]);

  const handleUpdateCollaboratorRole = useCallback((documentId, userId, role) => {
    updateCollaboratorRoleMutation.mutate({ documentId, userId, role });
  }, [updateCollaboratorRoleMutation]);

  const handleRemoveCollaborator = useCallback((documentId, userId) => {
    removeCollaboratorMutation.mutate({ documentId, userId });
  }, [removeCollaboratorMutation]);

  const handleAddComment = useCallback((documentId, commentData) => {
    addCommentMutation.mutate({ documentId, data: commentData });
  }, [addCommentMutation]);

  const handleUpdateComment = useCallback((documentId, commentId, commentData) => {
    updateCommentMutation.mutate({ documentId, commentId, data: commentData });
  }, [updateCommentMutation]);

  const handleDeleteComment = useCallback((documentId, commentId) => {
    deleteCommentMutation.mutate({ documentId, commentId });
  }, [deleteCommentMutation]);

  const handleCloseShareModal = useCallback(() => {
    dispatch(closeShareModal());
  }, [dispatch]);

  const handleClearErrors = useCallback(() => {
    dispatch(clearErrors());
  }, [dispatch]);

  // Editor functions
  const handleUpdateEditorField = useCallback((field, value) => {
    dispatch(updateEditorField({ field, value }));
  }, [dispatch]);

  const handleResetEditorState = useCallback(() => {
    dispatch(resetEditorState());
  }, [dispatch]);

  const handleInitializeEditorFromDocument = useCallback((document) => {
    dispatch(initializeEditorFromDocument(document));
  }, [dispatch]);

  // UI functions
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

  const handleSearch = useCallback((params) => {
    dispatch(searchDocumentsThunk(params));
  }, [dispatch]);

  // Document permissions
  const getDocumentPermissions = useCallback((document, currentUser) => {
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
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !documentId) return;

    const handleUserJoined = (data) => {
      setActiveCollaborators(data.activeCollaborators || []);
    };

    const handleUserLeft = (data) => {
      setActiveCollaborators(data.activeCollaborators || []);
    };

    const handleActiveCollaborators = (data) => {
      setActiveCollaborators(data.activeCollaborators || []);
    };

    const handleUserTyping = (data) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(user => user.userId !== data.userId);
        return [...filtered, {
          userId: data.userId,
          userName: data.userName,
          avatar: data.avatar,
          timestamp: Date.now(),
        }];
      });
    };

    const handleUserStopTyping = (data) => {
      setTypingUsers(prev => prev.filter(user => user.userId !== data.userId));
    };

    const handleSaveStatus = (data) => {
      setSaveStatus(prev => ({
        ...prev,
        [data.userId]: {
          status: data.status,
          timestamp: data.timestamp,
          userInfo: data.userInfo,
        },
      }));
    };

    socket.on('user_joined_document', handleUserJoined);
    socket.on('user_left_document', handleUserLeft);
    socket.on('active_collaborators', handleActiveCollaborators);
    socket.on('document_user_typing', handleUserTyping);
    socket.on('document_user_stop_typing', handleUserStopTyping);
    socket.on('document_save_status', handleSaveStatus);

    return () => {
      socket.off('user_joined_document', handleUserJoined);
      socket.off('user_left_document', handleUserLeft);
      socket.off('active_collaborators', handleActiveCollaborators);
      socket.off('document_user_typing', handleUserTyping);
      socket.off('document_user_stop_typing', handleUserStopTyping);
      socket.off('document_save_status', handleSaveStatus);
    };
  }, [socket, documentId]);

  // Auto-join when connected
  useEffect(() => {
    if (isConnected && documentId && !isJoined) {
      joinDocument();
    }
  }, [isConnected, documentId, isJoined, joinDocument]);

  // Enable auto-save if document is saved
  useEffect(() => {
    setIsAutoSaveEnabled(!!documentId);
  }, [documentId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      leaveDocument();
    };
  }, [leaveDocument]);

  // Extract data from API responses
  const apiDocumentsData = documentsData?.data;
  const apiDocumentData = documentData?.data;
  const apiCommentsData = commentsData?.data;

  const documentsList = apiDocumentsData?.data?.documents || [];
  const documentDetails = apiDocumentData?.data?.document;
  const commentsList = apiCommentsData?.data?.comments || [];

  // Return consolidated interface
  return {
    // State
    user,
    documents: documentsList,
    currentDocument: documentDetails || currentDocument,
    comments: commentsList,
    editorState,
    isShareModalOpen,
    selectedDocumentForShare,
    activeTab,
    viewMode,
    
    // Collaboration state
    activeCollaborators,
    isTyping,
    typingUsers,
    saveStatus,
    isJoined,
    isConnected,
    
    // Auto-save state
    isAutoSaveEnabled,
    autoSaveStatus,
    lastSaved,
    
    // Loading states
    documentsLoading,
    documentLoading,
    isLoadingDocuments,
    isLoadingDocument,
    isLoadingComments,
    searchLoading,
    
    // Error states
    documentsError,
    documentError,
    documentsQueryError,
    documentQueryError,
    commentsError,
    searchError,
    
    // Operations state
    isCreating: operations.creating || createDocumentMutation.isPending,
    isUpdating: operations.updating || updateDocumentMutation.isPending,
    isDeleting: operations.deleting || deleteDocumentMutation.isPending,
    isSharing: operations.sharing || shareDocumentMutation.isPending,
    isEmailSharing: operations.emailSharing || shareViaEmailMutation.isPending,
    
    // Search state
    searchResults,
    searchQuery,
    searchFilters,
    
    // Document management actions
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
    handleUpdateComment,
    handleDeleteComment,
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
    handleSearch,
    
    // Auto-save actions
    manualSave,
    toggleAutoSave,
    debouncedAutoSave,
    
    // Collaboration actions
    joinDocument,
    leaveDocument,
    sendContentChange,
    sendCursorMove,
    sendSelectionChange,
    sendTyping,
    sendStopTyping,
    sendFormatChange,
    sendStructureChange,
    sendTitleChange,
    sendSaveStatus,
    
    // Utility functions
    getDocumentPermissions,
    refetchDocuments,
    
    // Mutation states
    isCreatingDocument: createDocumentMutation.isPending,
    isUpdatingDocument: updateDocumentMutation.isPending,
    isDeletingDocument: deleteDocumentMutation.isPending,
    isSharingDocument: shareDocumentMutation.isPending,
    isSharingViaEmail: shareViaEmailMutation.isPending,
    isUpdatingCollaboratorRole: updateCollaboratorRoleMutation.isPending,
    isRemovingCollaborator: removeCollaboratorMutation.isPending,
    isAddingComment: addCommentMutation.isPending,
    isUpdatingComment: updateCommentMutation.isPending,
    isDeletingComment: deleteCommentMutation.isPending,
  };
};