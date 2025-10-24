import { useCallback, useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useSocket } from './useSocket';
import { getUserRole } from '../utils/roleUtils';
import {
  // API functions
  getUserWhiteboards,
  getAllWhiteboards,
  getWhiteboardById,
  createWhiteboard,
  updateWhiteboard,
  deleteWhiteboard,
  shareWhiteboard,
  updateCollaboratorRole,
  removeCollaborator,
  shareWhiteboardViaEmail,
  getWhiteboardCollaborators,
  autoSaveWhiteboard,
  enableAutoSave
} from '../api/whiteboardApi';
import {
  // Redux actions
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
  removeCollaborator as removeCollaboratorState,
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
  // Additional actions for compatibility
  setShowCreateWhiteboardModal,
  setShowShareWhiteboardModal,
  setActiveTool,
  addDrawingElement,
  updateDrawingElement,
  removeDrawingElement,
  undo,
  redo,
  clearWhiteboardErrors,
  // Redux selectors
  selectWhiteboards,
  selectCurrentWhiteboard,
  selectEditorState,
  selectCollaborators,
  selectCursors,
  selectIsCollaborating,
  selectActiveTab,
  selectViewMode,
  selectWhiteboardLoading,
  selectWhiteboardErrors,
  selectWhiteboardOperations,
  selectWhiteboardPagination,
  selectIsShareModalOpen,
  selectSelectedWhiteboardForShare,
  selectActiveTool,
  selectDrawingElements,
  selectUndoStack,
  selectRedoStack,
  selectShowCreateWhiteboardModal,
  selectShowShareWhiteboardModal
} from '../store/slice/whiteboardSlice';

/**
 * Consolidated Whiteboard Hook - All whiteboard-related functionality in one place
 * Follows the architecture pattern: Redux for state, React Query for API calls, Custom hooks for business logic
 */
export const useWhiteboard = (whiteboardId = null, params = {}) => {
  const { shouldNavigateAfterCreate = false } = params;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.auth);
  const { socket, isConnected } = useSocket();

  // Redux state selectors
  const whiteboards = useSelector(selectWhiteboards);
  const currentWhiteboard = useSelector(selectCurrentWhiteboard);
  const whiteboardLoading = useSelector(selectWhiteboardLoading);
  const whiteboardErrors = useSelector(selectWhiteboardErrors);
  const operations = useSelector(selectWhiteboardOperations);
  const editorState = useSelector(selectEditorState);
  const collaborators = useSelector(selectCollaborators);
  const cursors = useSelector(selectCursors);
  const isCollaborating = useSelector(selectIsCollaborating);
  const activeTab = useSelector(selectActiveTab);
  const viewMode = useSelector(selectViewMode);
  const pagination = useSelector(selectWhiteboardPagination);
  const isShareModalOpen = useSelector(selectIsShareModalOpen);
  const selectedWhiteboardForShare = useSelector(selectSelectedWhiteboardForShare);
  const showCreateWhiteboardModal = useSelector(selectShowCreateWhiteboardModal);
  const showShareWhiteboardModal = useSelector(selectShowShareWhiteboardModal);

  // Local state for UI-specific concerns
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedElements, setSelectedElements] = useState([]);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const autoSaveTimeoutRef = useRef(null);

  // React Query for API calls
  const {
    data: whiteboardsData,
    isLoading: whiteboardsLoading,
    error: whiteboardsError,
    refetch: refetchWhiteboards
  } = useQuery({
    queryKey: ['whiteboards', activeTab, searchQuery],
    queryFn: () => {
      const params = { 
        type: activeTab === 'all' ? undefined : activeTab,
        search: searchQuery || undefined
      };
      return getUserWhiteboards(params);
    },
    staleTime: 30000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
    onSuccess: (data) => {
      },
    onError: (error) => {
      console.error('❌ Whiteboard API Error - getUserWhiteboards failed:', error);
    }
  });

  // React Query for all whiteboards (admin function)
  const {
    data: allWhiteboardsData,
    isLoading: allWhiteboardsLoading,
    error: allWhiteboardsError,
    refetch: refetchAllWhiteboards
  } = useQuery({
    queryKey: ['allWhiteboards', activeTab, searchQuery],
    queryFn: () => {
      const params = { 
        type: activeTab === 'all' ? undefined : activeTab,
        search: searchQuery || undefined
      };
      return getAllWhiteboards(params);
    },
    staleTime: 30000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
    enabled: false, // Only fetch when explicitly called
    onSuccess: (data) => {
      },
    onError: (error) => {
      console.error('❌ All Whiteboards API Error - getAllWhiteboards failed:', error);
    }
  });

  const {
    data: whiteboardData,
    isLoading: whiteboardDataLoading,
    error: whiteboardDataError,
    refetch: refetchWhiteboard
  } = useQuery({
    queryKey: ['whiteboard', whiteboardId],
    queryFn: () => getWhiteboardById(whiteboardId),
    enabled: !!whiteboardId,
    staleTime: 10000, // 10 seconds for real-time collaboration
    cacheTime: 2 * 60 * 1000, // 2 minutes
  });

  // Mutations with toast handling
  const createWhiteboardMutation = useMutation({
    mutationFn: createWhiteboard,
    onSuccess: (data) => {
      const whiteboard = data?.data?.whiteboard || data?.whiteboard;
      
      if (!whiteboard || !whiteboard._id) {
        console.error('❌ Invalid whiteboard data received:', data);
        toast.error('Failed to create whiteboard: Invalid response');
        return;
      }
      
      queryClient.invalidateQueries(['whiteboards']);
      queryClient.invalidateQueries(['allWhiteboards']);
      queryClient.invalidateQueries(['getAllWhiteboards']);
      dispatch(addWhiteboardToList(whiteboard));
      dispatch(setCurrentWhiteboard(whiteboard));
      toast.success('Whiteboard created successfully!');
      // Navigate only if shouldNavigateAfterCreate is true (for /boards/new route)
      if (shouldNavigateAfterCreate) {
        const targetPath = `/boards/${whiteboard._id}`;
        navigate(targetPath);
      }
    },
    onError: (error) => {
      console.error('❌ Failed to create whiteboard:', error);
      toast.error(error?.response?.data?.message || 'Failed to create whiteboard');
    },
  });

  const updateWhiteboardMutation = useMutation({
    mutationFn: ({ whiteboardId, data }) => updateWhiteboard(whiteboardId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['whiteboard', variables.whiteboardId]);
      queryClient.invalidateQueries(['whiteboards']);
      queryClient.invalidateQueries(['allWhiteboards']);
      queryClient.invalidateQueries(['getAllWhiteboards']);
      dispatch(updateWhiteboardInList(data.data.whiteboard));
      if (currentWhiteboard?._id === variables.whiteboardId) {
        dispatch(setCurrentWhiteboard(data.data.whiteboard));
      }
      toast.success('Whiteboard updated successfully!');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update whiteboard');
    },
  });

  const deleteWhiteboardMutation = useMutation({
    mutationFn: deleteWhiteboard,
    onSuccess: (data, whiteboardId) => {
      queryClient.invalidateQueries(['whiteboards']);
      queryClient.invalidateQueries(['allWhiteboards']);
      queryClient.invalidateQueries(['getAllWhiteboards']);
      dispatch(removeWhiteboardFromList(whiteboardId));
      if (currentWhiteboard?._id === whiteboardId) {
        dispatch(clearCurrentWhiteboard());
        navigate('/boards');
      }
      toast.success('Whiteboard deleted successfully!');
      // Force refetch to update UI immediately
      refetchAllWhiteboards();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete whiteboard');
    },
  });

  const shareWhiteboardMutation = useMutation({
    mutationFn: ({ whiteboardId, data }) => shareWhiteboard(whiteboardId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['whiteboard', variables.whiteboardId]);
      queryClient.invalidateQueries(['whiteboards']);
      dispatch(updateWhiteboardInList(data.data.whiteboard));
      dispatch(closeShareModal());
      toast.success('Whiteboard shared successfully!');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to share whiteboard');
    },
  });

  // Auto-save mutations
  const autoSaveMutation = useMutation({
    mutationFn: ({ whiteboardId, canvasData }) => autoSaveWhiteboard(whiteboardId, canvasData),
    onSuccess: (data, variables) => {
      // Update the whiteboard version in Redux state
      if (currentWhiteboard?._id === variables.whiteboardId) {
        dispatch(setCurrentWhiteboard({
          ...currentWhiteboard,
          version: data.data.whiteboard.version,
          lastModifiedBy: data.data.whiteboard.lastModifiedBy,
          updatedAt: data.data.whiteboard.updatedAt
        }));
      }
    },
    onError: (error) => {
      console.error('❌ Auto-save failed:', error);
      toast.error('Auto-save failed. Please save manually.');
    },
  });

  const enableAutoSaveMutation = useMutation({
    mutationFn: ({ whiteboardId, enabled }) => enableAutoSave(whiteboardId, enabled),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['whiteboard', variables.whiteboardId]);
      toast.success(`Auto-save ${variables.enabled ? 'enabled' : 'disabled'} successfully!`);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update auto-save settings');
    },
  });

  // Business logic functions
  const handleCreateWhiteboard = useCallback(async (whiteboardData) => {
    try {
      await createWhiteboardMutation.mutateAsync(whiteboardData);
    } catch (error) {
      // Error handled in mutation
    }
  }, [createWhiteboardMutation]);

  const handleUpdateWhiteboard = useCallback(async (whiteboardId, data) => {
    try {
      await updateWhiteboardMutation.mutateAsync({ whiteboardId, data });
    } catch (error) {
      // Error handled in mutation
    }
  }, [updateWhiteboardMutation]);

  const handleDeleteWhiteboard = useCallback(async (whiteboardId) => {
    try {
      await deleteWhiteboardMutation.mutateAsync(whiteboardId);
    } catch (error) {
      // Error handled in mutation
    }
  }, [deleteWhiteboardMutation]);

  const handleShareWhiteboard = useCallback(async (whiteboardId, shareData) => {
    try {
      await shareWhiteboardMutation.mutateAsync({ whiteboardId, data: shareData });
    } catch (error) {
      // Error handled in mutation
    }
  }, [shareWhiteboardMutation]);

  // Auto-save handlers
  const handleAutoSave = useCallback(async (whiteboardId, canvasData) => {
    try {
      await autoSaveMutation.mutateAsync({ whiteboardId, canvasData });
    } catch (error) {
      // Error handled in mutation
    }
  }, [autoSaveMutation]);

  const handleEnableAutoSave = useCallback(async (whiteboardId, enabled = true) => {
    try {
      await enableAutoSaveMutation.mutateAsync({ whiteboardId, enabled });
    } catch (error) {
      // Error handled in mutation
    }
  }, [enableAutoSaveMutation]);

  const handleEditWhiteboard = useCallback((whiteboard) => {
    if (!whiteboard || !whiteboard._id) {
      toast.error('Invalid whiteboard selected');
      return;
    }
    
    // Check if user has edit permissions
    const userRole = getUserRole(whiteboard, user);
    if (userRole === 'viewer') {
      toast.error('You only have view access to this whiteboard');
      return;
    }
    
    dispatch(setCurrentWhiteboard(whiteboard));
    
    // Navigate to the whiteboard editor
    const targetPath = whiteboard.visibility === 'shared' 
      ? `/boards/shared/${whiteboard._id}`
      : `/boards/${whiteboard._id}`;
    
    navigate(targetPath);
  }, [dispatch, navigate, user]);

  const handleViewWhiteboard = useCallback((whiteboard) => {
    if (!whiteboard || !whiteboard._id) {
      toast.error('Invalid whiteboard selected');
      return;
    }
    
    dispatch(setCurrentWhiteboard(whiteboard));
    if (whiteboard.visibility === 'shared') {
      navigate(`/boards/shared/${whiteboard._id}`);
    } else {
      navigate(`/boards/${whiteboard._id}`);
    }
  }, [dispatch, navigate]);

  // Editor functions
  const handleSetTool = useCallback((tool) => {
    dispatch(setTool(tool));
  }, [dispatch]);

  const handleSetColor = useCallback((color) => {
    dispatch(setColor(color));
  }, [dispatch]);

  const handleSetStrokeWidth = useCallback((width) => {
    dispatch(setStrokeWidth(width));
  }, [dispatch]);

  const handleAddElement = useCallback((element) => {
    dispatch(addElement(element));
  }, [dispatch]);

  const handleUpdateElement = useCallback((elementId, updates) => {
    dispatch(updateElement({ elementId, updates }));
  }, [dispatch]);

  const handleRemoveElement = useCallback((elementId) => {
    dispatch(removeElement(elementId));
  }, [dispatch]);

  const handleSelectElement = useCallback((elementId) => {
    dispatch(selectElement(elementId));
  }, [dispatch]);

  const handleClearSelection = useCallback(() => {
    dispatch(clearSelection());
  }, [dispatch]);

  // Socket event handlers for real-time collaboration
  useEffect(() => {
    if (!socket || !isConnected || !currentWhiteboard) return;

    const handleElementAdded = (data) => {
      if (data.whiteboardId === currentWhiteboard._id) {
        dispatch(addElement(data.element));
      }
    };

    const handleElementUpdated = (data) => {
      if (data.whiteboardId === currentWhiteboard._id) {
        dispatch(updateElement({ elementId: data.elementId, updates: data.updates }));
      }
    };

    const handleElementRemoved = (data) => {
      if (data.whiteboardId === currentWhiteboard._id) {
        dispatch(removeElement(data.elementId));
      }
    };

    const handleCollaboratorJoined = (data) => {
      if (data.whiteboardId === currentWhiteboard._id) {
        dispatch(addCollaborator(data.collaborator));
      }
    };

    const handleCollaboratorLeft = (data) => {
      if (data.whiteboardId === currentWhiteboard._id) {
        dispatch(removeCollaboratorState(data.collaboratorId));
      }
    };

    const handleCursorMoved = (data) => {
      if (data.whiteboardId === currentWhiteboard._id) {
        dispatch(setCursor({ collaboratorId: data.collaboratorId, cursor: data.cursor }));
      }
    };

    socket.on('whiteboard:element_added', handleElementAdded);
    socket.on('whiteboard:element_updated', handleElementUpdated);
    socket.on('whiteboard:element_removed', handleElementRemoved);
    socket.on('whiteboard:collaborator_joined', handleCollaboratorJoined);
    socket.on('whiteboard:collaborator_left', handleCollaboratorLeft);
    socket.on('whiteboard:cursor_moved', handleCursorMoved);

    return () => {
      socket.off('whiteboard:element_added', handleElementAdded);
      socket.off('whiteboard:element_updated', handleElementUpdated);
      socket.off('whiteboard:element_removed', handleElementRemoved);
      socket.off('whiteboard:collaborator_joined', handleCollaboratorJoined);
      socket.off('whiteboard:collaborator_left', handleCollaboratorLeft);
      socket.off('whiteboard:cursor_moved', handleCursorMoved);
    };
  }, [socket, isConnected, currentWhiteboard, dispatch]);

  // Emit socket events for real-time collaboration
  const emitElementAdded = useCallback((element) => {
    if (socket && currentWhiteboard) {
      socket.emit('whiteboard:element_added', {
        whiteboardId: currentWhiteboard._id,
        element
      });
    }
  }, [socket, currentWhiteboard]);

  const emitElementUpdated = useCallback((elementId, updates) => {
    if (socket && currentWhiteboard) {
      socket.emit('whiteboard:element_updated', {
        whiteboardId: currentWhiteboard._id,
        elementId,
        updates
      });
    }
  }, [socket, currentWhiteboard]);

  const emitElementRemoved = useCallback((elementId) => {
    if (socket && currentWhiteboard) {
      socket.emit('whiteboard:element_removed', {
        whiteboardId: currentWhiteboard._id,
        elementId
      });
    }
  }, [socket, currentWhiteboard]);

  const emitCursorMoved = useCallback((cursor) => {
    if (socket && currentWhiteboard) {
      socket.emit('whiteboard:cursor_moved', {
        whiteboardId: currentWhiteboard._id,
        collaboratorId: user?._id,
        cursor
      });
    }
  }, [socket, currentWhiteboard, user]);

  // UI state management
  const handleSetActiveTab = useCallback((tab) => {
    dispatch(setActiveTab(tab));
  }, [dispatch]);

  const handleSetViewMode = useCallback((mode) => {
    dispatch(setViewMode(mode));
  }, [dispatch]);

  const handleOpenShareModal = useCallback((whiteboard) => {
    dispatch(openShareModal(whiteboard));
  }, [dispatch]);

  const handleCloseShareModal = useCallback(() => {
    dispatch(closeShareModal());
  }, [dispatch]);

  const handleSetSearchQuery = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  // Computed values
  const apiWhiteboards = whiteboardsData?.data?.data?.whiteboards || whiteboardsData?.data?.whiteboards || [];
  const filteredWhiteboards = apiWhiteboards.filter(wb => {
    if (!wb) return false;
    
    const matchesSearch = searchQuery === '' || 
      wb.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wb.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'all' ||
      (activeTab === 'own' && wb.owner?._id === user?._id) ||
      (activeTab === 'shared' && wb.visibility === 'shared');
    
    return matchesSearch && matchesTab;
  });

  const isLoading = whiteboardsLoading || whiteboardDataLoading;
  const error = whiteboardsError || whiteboardDataError;

  return {
    // Data
    whiteboards: filteredWhiteboards,
    currentWhiteboard,
    editorState,
    collaborators,
    cursors,
    isCollaborating,
    activeTab,
    viewMode,
    pagination,
    searchQuery,
    selectedElements,
    
    // Loading states
    isLoading,
    whiteboardsLoading,
    whiteboardDataLoading,
    operations,
    
    // Error states
    error,
    whiteboardsError,
    whiteboardDataError,
    
    // Modal states
    isShareModalOpen,
    selectedWhiteboardForShare,
    showCreateWhiteboardModal,
    showShareWhiteboardModal,
    
    // Actions
    handleCreateWhiteboard,
    handleUpdateWhiteboard,
    handleDeleteWhiteboard,
    handleShareWhiteboard,
    handleEditWhiteboard,
    handleViewWhiteboard,
    
    // Editor actions
    handleSetTool,
    handleSetColor,
    handleSetStrokeWidth,
    handleAddElement,
    handleUpdateElement,
    handleRemoveElement,
    handleSelectElement,
    handleClearSelection,
    
    // UI actions
    handleSetActiveTab,
    handleSetViewMode,
    handleOpenShareModal,
    handleCloseShareModal,
    handleSetSearchQuery,
    
    // Socket actions
    emitElementAdded,
    emitElementUpdated,
    emitElementRemoved,
    emitCursorMoved,
    
    // Utility functions
    refetchWhiteboards,
    refetchWhiteboard,
    refetchAllWhiteboards,
    clearErrors: () => dispatch(clearAllErrors()),
    resetState: () => dispatch(resetWhiteboardState()),
    
    // Auto-save functions
    handleAutoSave,
    handleEnableAutoSave,
    isAutoSaving: autoSaveMutation.isPending,
    autoSaveError: autoSaveMutation.error,
    
    // All whiteboards functions
    allWhiteboards: allWhiteboardsData?.data?.whiteboards || allWhiteboardsData?.data?.data?.whiteboards || [],
    allWhiteboardsLoading,
    allWhiteboardsError,
    fetchAllWhiteboards: refetchAllWhiteboards,
    
    // Operation states
    isDeleting: deleteWhiteboardMutation.isPending,
    isCreating: createWhiteboardMutation.isPending,
    isUpdating: updateWhiteboardMutation.isPending,
    isSharing: shareWhiteboardMutation.isPending
  };
};

export default useWhiteboard;