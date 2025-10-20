import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useNavigation } from './useNavigation';
import { useSocket } from './useSocket';
import { useWhiteboardCanvas } from './useWhiteboardCanvas';
import {
  // API functions
  createWhiteboard,
  getUserWhiteboards,
  getWhiteboardById,
  updateWhiteboard,
  deleteWhiteboard,
  shareWhiteboard,
  updateWhiteboardCollaboratorRole,
  removeWhiteboardCollaborator,
  getWhiteboardCollaborators
} from '../api/whiteboardApi';
import {
  // Redux actions
  setCurrentWhiteboard,
  clearCurrentWhiteboard,
  setShowCreateWhiteboardModal,
  setShowShareWhiteboardModal,
  setActiveTool,
  addDrawingElement,
  updateDrawingElement,
  removeDrawingElement,
  undo,
  redo,
  clearWhiteboardErrors,
  resetWhiteboardState,
  // Redux selectors
  selectWhiteboards,
  selectCurrentWhiteboard,
  selectActiveTool,
  selectDrawingElements,
  selectUndoStack,
  selectRedoStack,
  selectWhiteboardLoading,
  selectWhiteboardErrors,
  selectShowCreateWhiteboardModal,
  selectShowShareWhiteboardModal
} from '../store/slice/whiteboardSlice';

/**
 * Consolidated Whiteboard Hook - All whiteboard-related functionality in one place
 * Combines: useWhiteboardCanvas, useWhiteboardBusinessLogic
 */
export const useWhiteboard = (whiteboardId = null, params = {}) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.auth);
  const { navigateTo } = useNavigation();
  const { socket } = useSocket();

  // Redux state selectors
  const whiteboards = useSelector(selectWhiteboards);
  const currentWhiteboard = useSelector(selectCurrentWhiteboard);
  const activeTool = useSelector(selectActiveTool);
  const drawingElements = useSelector(selectDrawingElements);
  const undoStack = useSelector(selectUndoStack);
  const redoStack = useSelector(selectRedoStack);
  const loading = useSelector(selectWhiteboardLoading);
  const errors = useSelector(selectWhiteboardErrors);
  const showCreateWhiteboardModal = useSelector(selectShowCreateWhiteboardModal);
  const showShareWhiteboardModal = useSelector(selectShowShareWhiteboardModal);

  // Fetch whiteboards with React Query
  const { data: whiteboardsData, isLoading: isLoadingWhiteboards, error: whiteboardsError, refetch: refetchWhiteboards } = useQuery({
    queryKey: ['whiteboards', params],
    queryFn: () => getUserWhiteboards(params),
    enabled: !!user,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const { data: whiteboardData, isLoading: isLoadingWhiteboard, error: whiteboardError } = useQuery({
    queryKey: ['whiteboard', whiteboardId],
    queryFn: () => getWhiteboardById(whiteboardId),
    enabled: !!user && !!whiteboardId,
    staleTime: 60000,
  });

  const { data: collaboratorsData, isLoading: isLoadingCollaborators, error: collaboratorsError } = useQuery({
    queryKey: ['whiteboardCollaborators', whiteboardId],
    queryFn: () => getWhiteboardCollaborators(whiteboardId),
    enabled: !!user && !!whiteboardId,
    staleTime: 30000,
  });

  // Mutations
  const createWhiteboardMutation = useMutation({
    mutationFn: (whiteboardData) => createWhiteboard(whiteboardData),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['whiteboards']);
      toast.success('Whiteboard created successfully');
      navigateTo(`/whiteboards/${data.data.whiteboard._id}`);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to create whiteboard');
    },
  });

  const updateWhiteboardMutation = useMutation({
    mutationFn: ({ whiteboardId, data }) => updateWhiteboard(whiteboardId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['whiteboards']);
      queryClient.invalidateQueries(['whiteboard', variables.whiteboardId]);
      toast.success('Whiteboard updated successfully');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update whiteboard');
    },
  });

  const deleteWhiteboardMutation = useMutation({
    mutationFn: (whiteboardId) => deleteWhiteboard(whiteboardId),
    onSuccess: () => {
      queryClient.invalidateQueries(['whiteboards']);
      toast.success('Whiteboard deleted successfully');
      navigateTo('/whiteboards');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete whiteboard');
    },
  });

  const shareWhiteboardMutation = useMutation({
    mutationFn: ({ whiteboardId, shareData }) => shareWhiteboard(whiteboardId, shareData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['whiteboard', variables.whiteboardId]);
      queryClient.invalidateQueries(['whiteboardCollaborators', variables.whiteboardId]);
      toast.success('Whiteboard shared successfully');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to share whiteboard');
    },
  });

  const updateCollaboratorRoleMutation = useMutation({
    mutationFn: ({ whiteboardId, userId, role }) => updateWhiteboardCollaboratorRole(whiteboardId, userId, role),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['whiteboard', variables.whiteboardId]);
      queryClient.invalidateQueries(['whiteboardCollaborators', variables.whiteboardId]);
      toast.success('Collaborator role updated successfully');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update collaborator role');
    },
  });

  const removeCollaboratorMutation = useMutation({
    mutationFn: ({ whiteboardId, userId }) => removeWhiteboardCollaborator(whiteboardId, userId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['whiteboard', variables.whiteboardId]);
      queryClient.invalidateQueries(['whiteboardCollaborators', variables.whiteboardId]);
      toast.success('Collaborator removed successfully');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to remove collaborator');
    },
  });

  // Whiteboard management functions
  const handleCreateWhiteboard = useCallback((whiteboardData) => {
    createWhiteboardMutation.mutate(whiteboardData);
  }, [createWhiteboardMutation]);

  const handleUpdateWhiteboard = useCallback((whiteboardId, data) => {
    updateWhiteboardMutation.mutate({ whiteboardId, data });
  }, [updateWhiteboardMutation]);

  const handleDeleteWhiteboard = useCallback((whiteboardId) => {
    deleteWhiteboardMutation.mutate(whiteboardId);
  }, [deleteWhiteboardMutation]);

  const handleFetchWhiteboards = useCallback((params = {}) => {
    refetchWhiteboards();
  }, [refetchWhiteboards]);

  const handleFetchWhiteboard = useCallback((id) => {
    queryClient.invalidateQueries(['whiteboard', id]);
  }, [queryClient]);

  // Collaboration functions
  const handleShareWhiteboard = useCallback((whiteboardId, shareData) => {
    shareWhiteboardMutation.mutate({ whiteboardId, shareData });
  }, [shareWhiteboardMutation]);

  const handleUpdateCollaboratorRole = useCallback((whiteboardId, userId, role) => {
    updateCollaboratorRoleMutation.mutate({ whiteboardId, userId, role });
  }, [updateCollaboratorRoleMutation]);

  const handleRemoveCollaborator = useCallback((whiteboardId, userId) => {
    removeCollaboratorMutation.mutate({ whiteboardId, userId });
  }, [removeCollaboratorMutation]);

  const handleFetchCollaborators = useCallback((whiteboardId) => {
    queryClient.invalidateQueries(['whiteboardCollaborators', whiteboardId]);
  }, [queryClient]);

  // Canvas management functions
  const handleSetCurrentWhiteboard = useCallback((whiteboard) => {
    dispatch(setCurrentWhiteboard(whiteboard));
  }, [dispatch]);

  const handleClearCurrentWhiteboard = useCallback(() => {
    dispatch(clearCurrentWhiteboard());
  }, [dispatch]);

  const handleSetActiveTool = useCallback((tool) => {
    dispatch(setActiveTool(tool));
  }, [dispatch]);

  const handleAddDrawingElement = useCallback((element) => {
    dispatch(addDrawingElement(element));
  }, [dispatch]);

  const handleUpdateDrawingElement = useCallback((id, updates) => {
    dispatch(updateDrawingElement({ id, updates }));
  }, [dispatch]);

  const handleRemoveDrawingElement = useCallback((id) => {
    dispatch(removeDrawingElement(id));
  }, [dispatch]);

  const handleUndo = useCallback(() => {
    dispatch(undo());
  }, [dispatch]);

  const handleRedo = useCallback(() => {
    dispatch(redo());
  }, [dispatch]);

  // Modal management functions
  const handleOpenCreateWhiteboardModal = useCallback(() => {
    dispatch(setShowCreateWhiteboardModal(true));
  }, [dispatch]);

  const handleCloseCreateWhiteboardModal = useCallback(() => {
    dispatch(setShowCreateWhiteboardModal(false));
  }, [dispatch]);

  const handleOpenShareWhiteboardModal = useCallback(() => {
    dispatch(setShowShareWhiteboardModal(true));
  }, [dispatch]);

  const handleCloseShareWhiteboardModal = useCallback(() => {
    dispatch(setShowShareWhiteboardModal(false));
  }, [dispatch]);

  // Error management functions
  const handleClearWhiteboardError = useCallback((errorType) => {
    dispatch(clearWhiteboardErrors());
  }, [dispatch]);

  const handleResetWhiteboardState = useCallback(() => {
    dispatch(resetWhiteboardState());
  }, [dispatch]);

  // Canvas hook integration
  const canvasHook = useWhiteboardCanvas({
    whiteboard: whiteboardData?.data?.whiteboard || currentWhiteboard,
    onSave: (data) => {
      if (whiteboardId) {
        handleUpdateWhiteboard(whiteboardId, data);
      }
    },
    socket
  });

  // Utility functions
  const getWhiteboardPermissions = useCallback((whiteboard, currentUser) => {
    if (!whiteboard || !currentUser) {
      return {
        canEdit: false,
        canDelete: false,
        canShare: false,
        canManageCollaborators: false,
        userRole: null,
      };
    }

    const isOwner = whiteboard.owner?._id === currentUser._id;
    const userCollaborator = whiteboard.collaborators?.find(
      collaborator => collaborator.user._id === currentUser._id
    );

    const canEdit = isOwner || userCollaborator?.role === 'editor' || userCollaborator?.role === 'admin';
    const canDelete = isOwner;
    const canShare = isOwner || userCollaborator?.role === 'admin';
    const canManageCollaborators = isOwner || userCollaborator?.role === 'admin';

    return {
      canEdit,
      canDelete,
      canShare,
      canManageCollaborators,
      userRole: userCollaborator?.role || (isOwner ? 'owner' : null),
      isOwner,
    };
  }, []);

  const formatWhiteboardStatus = useCallback((status) => {
    const statusMap = {
      active: 'Active',
      archived: 'Archived',
      shared: 'Shared',
      private: 'Private',
    };
    return statusMap[status] || status;
  }, []);

  const getCollaboratorRoleColor = useCallback((role) => {
    const colorMap = {
      owner: 'text-purple-600',
      admin: 'text-red-600',
      editor: 'text-blue-600',
      viewer: 'text-green-600',
    };
    return colorMap[role] || 'text-gray-600';
  }, []);

  const getToolIcon = useCallback((tool) => {
    const iconMap = {
      select: '🖱️',
      pencil: '✏️',
      eraser: '🧽',
      text: '📝',
      rectangle: '⬜',
      circle: '⭕',
      line: '📏',
      arrow: '➡️',
    };
    return iconMap[tool] || '🖱️';
  }, []);

  // Extract data from API responses
  const apiWhiteboardsData = whiteboardsData?.data;
  const apiWhiteboardData = whiteboardData?.data;
  const apiCollaboratorsData = collaboratorsData?.data;

  const whiteboardsList = apiWhiteboardsData?.data?.whiteboards || [];
  const whiteboardDetails = apiWhiteboardData?.data?.whiteboard;
  const collaboratorsList = apiCollaboratorsData?.data?.collaborators || [];

  // Return consolidated interface
  return {
    // State
    user,
    whiteboards: whiteboardsList,
    currentWhiteboard: whiteboardDetails || currentWhiteboard,
    collaborators: collaboratorsList,
    activeTool,
    drawingElements,
    undoStack,
    redoStack,
    loading,
    errors,
    showCreateWhiteboardModal,
    showShareWhiteboardModal,
    
    // Loading states
    isLoadingWhiteboards,
    isLoadingWhiteboard,
    isLoadingCollaborators,
    
    // Error states
    whiteboardsError,
    whiteboardError,
    collaboratorsError,
    
    // Whiteboard management actions
    createWhiteboard: handleCreateWhiteboard,
    fetchWhiteboards: handleFetchWhiteboards,
    fetchWhiteboard: handleFetchWhiteboard,
    updateWhiteboard: handleUpdateWhiteboard,
    deleteWhiteboard: handleDeleteWhiteboard,
    
    // Collaboration actions
    shareWhiteboard: handleShareWhiteboard,
    updateCollaboratorRole: handleUpdateCollaboratorRole,
    removeCollaborator: handleRemoveCollaborator,
    fetchCollaborators: handleFetchCollaborators,
    
    // Canvas actions
    setCurrentWhiteboard: handleSetCurrentWhiteboard,
    clearCurrentWhiteboard: handleClearCurrentWhiteboard,
    setActiveTool: handleSetActiveTool,
    addDrawingElement: handleAddDrawingElement,
    updateDrawingElement: handleUpdateDrawingElement,
    removeDrawingElement: handleRemoveDrawingElement,
    undo: handleUndo,
    redo: handleRedo,
    
    // Modal actions
    openCreateWhiteboardModal: handleOpenCreateWhiteboardModal,
    closeCreateWhiteboardModal: handleCloseCreateWhiteboardModal,
    openShareWhiteboardModal: handleOpenShareWhiteboardModal,
    closeShareWhiteboardModal: handleCloseShareWhiteboardModal,
    
    // Error actions
    clearError: handleClearWhiteboardError,
    resetState: handleResetWhiteboardState,
    
    // Utility functions
    getWhiteboardPermissions,
    formatWhiteboardStatus,
    getCollaboratorRoleColor,
    getToolIcon,
    refetchWhiteboards,
    
    // Canvas hook integration
    ...canvasHook,
    
    // Mutation states
    isCreatingWhiteboard: createWhiteboardMutation.isPending,
    isUpdatingWhiteboard: updateWhiteboardMutation.isPending,
    isDeletingWhiteboard: deleteWhiteboardMutation.isPending,
    isSharingWhiteboard: shareWhiteboardMutation.isPending,
    isUpdatingCollaboratorRole: updateCollaboratorRoleMutation.isPending,
    isRemovingCollaborator: removeCollaboratorMutation.isPending,
  };
};
