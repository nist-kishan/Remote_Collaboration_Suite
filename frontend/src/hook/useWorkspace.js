import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useNavigation } from './useNavigation';
import {
  // API functions
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  addWorkspaceMember,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
  getWorkspaceMembers,
  getWorkspaceProjects,
  getWorkspaceDocuments,
  getWorkspaceWhiteboards
} from '../api/workspaceApi';
import {
  // Redux actions
  setCurrentWorkspace,
  clearCurrentWorkspace,
  setShowCreateWorkspaceModal,
  setShowEditWorkspaceModal,
  setShowAddMemberModal,
  clearWorkspaceErrors,
  resetWorkspaceState,
  // Redux selectors
  selectWorkspaces,
  selectCurrentWorkspace,
  selectWorkspaceLoading,
  selectWorkspaceErrors,
  selectShowCreateWorkspaceModal,
  selectShowEditWorkspaceModal,
  selectShowAddMemberModal
} from '../store/slice/workspaceSlice';

/**
 * Consolidated Workspace Hook - All workspace-related functionality in one place
 * Combines: useWorkspaceBusinessLogic
 */
export const useWorkspace = (workspaceId = null, params = {}) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.auth);
  const { navigateTo } = useNavigation();

  // Redux state selectors
  const workspaces = useSelector(selectWorkspaces);
  const currentWorkspace = useSelector(selectCurrentWorkspace);
  const loading = useSelector(selectWorkspaceLoading);
  const errors = useSelector(selectWorkspaceErrors);
  const showCreateWorkspaceModal = useSelector(selectShowCreateWorkspaceModal);
  const showEditWorkspaceModal = useSelector(selectShowEditWorkspaceModal);
  const showAddMemberModal = useSelector(selectShowAddMemberModal);

  // Fetch workspaces with React Query
  const { data: workspacesData, isLoading: isLoadingWorkspaces, error: workspacesError, refetch: refetchWorkspaces } = useQuery({
    queryKey: ['workspaces', params],
    queryFn: () => getUserWorkspaces(params),
    enabled: !!user,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const { data: workspaceData, isLoading: isLoadingWorkspace, error: workspaceError } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => getWorkspaceById(workspaceId),
    enabled: !!user && !!workspaceId,
    staleTime: 60000,
  });

  const { data: membersData, isLoading: isLoadingMembers, error: membersError } = useQuery({
    queryKey: ['workspaceMembers', workspaceId],
    queryFn: () => getWorkspaceMembers(workspaceId),
    enabled: !!user && !!workspaceId,
    staleTime: 30000,
  });

  const { data: projectsData, isLoading: isLoadingProjects, error: projectsError } = useQuery({
    queryKey: ['workspaceProjects', workspaceId, params],
    queryFn: () => getWorkspaceProjects(workspaceId, params),
    enabled: !!user && !!workspaceId,
    staleTime: 30000,
  });

  const { data: documentsData, isLoading: isLoadingDocuments, error: documentsError } = useQuery({
    queryKey: ['workspaceDocuments', workspaceId, params],
    queryFn: () => getWorkspaceDocuments(workspaceId, params),
    enabled: !!user && !!workspaceId,
    staleTime: 30000,
  });

  const { data: whiteboardsData, isLoading: isLoadingWhiteboards, error: whiteboardsError } = useQuery({
    queryKey: ['workspaceWhiteboards', workspaceId, params],
    queryFn: () => getWorkspaceWhiteboards(workspaceId, params),
    enabled: !!user && !!workspaceId,
    staleTime: 30000,
  });

  // Mutations
  const createWorkspaceMutation = useMutation({
    mutationFn: (workspaceData) => createWorkspace(workspaceData),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['workspaces']);
      toast.success('Workspace created successfully');
      navigateTo(`/workspaces/${data.data.workspace._id}`);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to create workspace');
    },
  });

  const updateWorkspaceMutation = useMutation({
    mutationFn: ({ workspaceId, data }) => updateWorkspace(workspaceId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['workspaces']);
      queryClient.invalidateQueries(['workspace', variables.workspaceId]);
      toast.success('Workspace updated successfully');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update workspace');
    },
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: (workspaceId) => deleteWorkspace(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspaces']);
      toast.success('Workspace deleted successfully');
      navigateTo('/workspaces');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete workspace');
    },
  });

  const addWorkspaceMemberMutation = useMutation({
    mutationFn: ({ workspaceId, memberData }) => addWorkspaceMember(workspaceId, memberData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['workspaceMembers', variables.workspaceId]);
      queryClient.invalidateQueries(['workspace', variables.workspaceId]);
      toast.success('Member added successfully');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to add member');
    },
  });

  const removeWorkspaceMemberMutation = useMutation({
    mutationFn: ({ workspaceId, memberId }) => removeWorkspaceMember(workspaceId, memberId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['workspaceMembers', variables.workspaceId]);
      queryClient.invalidateQueries(['workspace', variables.workspaceId]);
      toast.success('Member removed successfully');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to remove member');
    },
  });

  const updateWorkspaceMemberRoleMutation = useMutation({
    mutationFn: ({ workspaceId, memberId, role }) => updateWorkspaceMemberRole(workspaceId, memberId, role),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['workspaceMembers', variables.workspaceId]);
      queryClient.invalidateQueries(['workspace', variables.workspaceId]);
      toast.success('Member role updated successfully');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update member role');
    },
  });

  // Workspace management functions
  const handleCreateWorkspace = useCallback((workspaceData) => {
    createWorkspaceMutation.mutate(workspaceData);
  }, [createWorkspaceMutation]);

  const handleUpdateWorkspace = useCallback((workspaceId, data) => {
    updateWorkspaceMutation.mutate({ workspaceId, data });
  }, [updateWorkspaceMutation]);

  const handleDeleteWorkspace = useCallback((workspaceId) => {
    deleteWorkspaceMutation.mutate(workspaceId);
  }, [deleteWorkspaceMutation]);

  const handleFetchWorkspaces = useCallback((params = {}) => {
    refetchWorkspaces();
  }, [refetchWorkspaces]);

  const handleFetchWorkspace = useCallback((id) => {
    queryClient.invalidateQueries(['workspace', id]);
  }, [queryClient]);

  // Member management functions
  const handleAddWorkspaceMember = useCallback((workspaceId, memberData) => {
    addWorkspaceMemberMutation.mutate({ workspaceId, memberData });
  }, [addWorkspaceMemberMutation]);

  const handleRemoveWorkspaceMember = useCallback((workspaceId, memberId) => {
    removeWorkspaceMemberMutation.mutate({ workspaceId, memberId });
  }, [removeWorkspaceMemberMutation]);

  const handleUpdateWorkspaceMemberRole = useCallback((workspaceId, memberId, role) => {
    updateWorkspaceMemberRoleMutation.mutate({ workspaceId, memberId, role });
  }, [updateWorkspaceMemberRoleMutation]);

  const handleFetchWorkspaceMembers = useCallback((workspaceId) => {
    queryClient.invalidateQueries(['workspaceMembers', workspaceId]);
  }, [queryClient]);

  // Content management functions
  const handleFetchWorkspaceProjects = useCallback((workspaceId, params = {}) => {
    queryClient.invalidateQueries(['workspaceProjects', workspaceId, params]);
  }, [queryClient]);

  const handleFetchWorkspaceDocuments = useCallback((workspaceId, params = {}) => {
    queryClient.invalidateQueries(['workspaceDocuments', workspaceId, params]);
  }, [queryClient]);

  const handleFetchWorkspaceWhiteboards = useCallback((workspaceId, params = {}) => {
    queryClient.invalidateQueries(['workspaceWhiteboards', workspaceId, params]);
  }, [queryClient]);

  // UI state management functions
  const handleSetCurrentWorkspace = useCallback((workspace) => {
    dispatch(setCurrentWorkspace(workspace));
  }, [dispatch]);

  const handleClearCurrentWorkspace = useCallback(() => {
    dispatch(clearCurrentWorkspace());
  }, [dispatch]);

  // Modal management functions
  const handleOpenCreateWorkspaceModal = useCallback(() => {
    dispatch(setShowCreateWorkspaceModal(true));
  }, [dispatch]);

  const handleCloseCreateWorkspaceModal = useCallback(() => {
    dispatch(setShowCreateWorkspaceModal(false));
  }, [dispatch]);

  const handleOpenEditWorkspaceModal = useCallback(() => {
    dispatch(setShowEditWorkspaceModal(true));
  }, [dispatch]);

  const handleCloseEditWorkspaceModal = useCallback(() => {
    dispatch(setShowEditWorkspaceModal(false));
  }, [dispatch]);

  const handleOpenAddMemberModal = useCallback(() => {
    dispatch(setShowAddMemberModal(true));
  }, [dispatch]);

  const handleCloseAddMemberModal = useCallback(() => {
    dispatch(setShowAddMemberModal(false));
  }, [dispatch]);

  // Error management functions
  const handleClearWorkspaceError = useCallback((errorType) => {
    dispatch(clearWorkspaceErrors());
  }, [dispatch]);

  const handleResetWorkspaceState = useCallback(() => {
    dispatch(resetWorkspaceState());
  }, [dispatch]);

  // Utility functions
  const getWorkspacePermissions = useCallback((workspace, currentUser) => {
    if (!workspace || !currentUser) {
      return {
        canEdit: false,
        canDelete: false,
        canManageMembers: false,
        canCreateProjects: false,
        canCreateDocuments: false,
        canCreateWhiteboards: false,
        userRole: null,
      };
    }

    const isOwner = workspace.owner?._id === currentUser._id;
    const userMember = workspace.members?.find(
      member => member.user._id === currentUser._id
    );

    const canEdit = isOwner || userMember?.role === 'admin' || userMember?.role === 'editor';
    const canDelete = isOwner;
    const canManageMembers = isOwner || userMember?.role === 'admin';
    const canCreateProjects = isOwner || userMember?.role === 'admin' || userMember?.role === 'editor';
    const canCreateDocuments = isOwner || userMember?.role === 'admin' || userMember?.role === 'editor';
    const canCreateWhiteboards = isOwner || userMember?.role === 'admin' || userMember?.role === 'editor';

    return {
      canEdit,
      canDelete,
      canManageMembers,
      canCreateProjects,
      canCreateDocuments,
      canCreateWhiteboards,
      userRole: userMember?.role || (isOwner ? 'owner' : null),
      isOwner,
    };
  }, []);

  const formatWorkspaceStatus = useCallback((status) => {
    const statusMap = {
      active: 'Active',
      archived: 'Archived',
      suspended: 'Suspended',
    };
    return statusMap[status] || status;
  }, []);

  const getMemberRoleColor = useCallback((role) => {
    const colorMap = {
      owner: 'text-purple-600',
      admin: 'text-red-600',
      editor: 'text-blue-600',
      viewer: 'text-green-600',
    };
    return colorMap[role] || 'text-gray-600';
  }, []);

  const getWorkspaceStats = useCallback((workspace) => {
    if (!workspace) return { projects: 0, documents: 0, whiteboards: 0, members: 0 };
    
    return {
      projects: workspace.projects?.length || 0,
      documents: workspace.documents?.length || 0,
      whiteboards: workspace.whiteboards?.length || 0,
      members: workspace.members?.length || 0,
    };
  }, []);

  const formatWorkspaceType = useCallback((type) => {
    const typeMap = {
      personal: 'Personal',
      team: 'Team',
      organization: 'Organization',
      public: 'Public',
    };
    return typeMap[type] || type;
  }, []);

  // Extract data from API responses
  const apiWorkspacesData = workspacesData?.data;
  const apiWorkspaceData = workspaceData?.data;
  const apiMembersData = membersData?.data;
  const apiProjectsData = projectsData?.data;
  const apiDocumentsData = documentsData?.data;
  const apiWhiteboardsData = whiteboardsData?.data;

  const workspacesList = apiWorkspacesData?.data?.workspaces || [];
  const workspaceDetails = apiWorkspaceData?.data?.workspace;
  const membersList = apiMembersData?.data?.members || [];
  const projectsList = apiProjectsData?.data?.projects || [];
  const documentsList = apiDocumentsData?.data?.documents || [];
  const whiteboardsList = apiWhiteboardsData?.data?.whiteboards || [];

  // Return consolidated interface
  return {
    // State
    user,
    workspaces: workspacesList,
    currentWorkspace: workspaceDetails || currentWorkspace,
    members: membersList,
    projects: projectsList,
    documents: documentsList,
    whiteboards: whiteboardsList,
    loading,
    errors,
    showCreateWorkspaceModal,
    showEditWorkspaceModal,
    showAddMemberModal,
    
    // Loading states
    isLoadingWorkspaces,
    isLoadingWorkspace,
    isLoadingMembers,
    isLoadingProjects,
    isLoadingDocuments,
    isLoadingWhiteboards,
    
    // Error states
    workspacesError,
    workspaceError,
    membersError,
    projectsError,
    documentsError,
    whiteboardsError,
    
    // Workspace management actions
    createWorkspace: handleCreateWorkspace,
    fetchWorkspaces: handleFetchWorkspaces,
    fetchWorkspace: handleFetchWorkspace,
    updateWorkspace: handleUpdateWorkspace,
    deleteWorkspace: handleDeleteWorkspace,
    
    // Member management actions
    addWorkspaceMember: handleAddWorkspaceMember,
    removeWorkspaceMember: handleRemoveWorkspaceMember,
    updateWorkspaceMemberRole: handleUpdateWorkspaceMemberRole,
    fetchWorkspaceMembers: handleFetchWorkspaceMembers,
    
    // Content management actions
    fetchWorkspaceProjects: handleFetchWorkspaceProjects,
    fetchWorkspaceDocuments: handleFetchWorkspaceDocuments,
    fetchWorkspaceWhiteboards: handleFetchWorkspaceWhiteboards,
    
    // UI actions
    setCurrentWorkspace: handleSetCurrentWorkspace,
    clearCurrentWorkspace: handleClearCurrentWorkspace,
    
    // Modal actions
    openCreateWorkspaceModal: handleOpenCreateWorkspaceModal,
    closeCreateWorkspaceModal: handleCloseCreateWorkspaceModal,
    openEditWorkspaceModal: handleOpenEditWorkspaceModal,
    closeEditWorkspaceModal: handleCloseEditWorkspaceModal,
    openAddMemberModal: handleOpenAddMemberModal,
    closeAddMemberModal: handleCloseAddMemberModal,
    
    // Error actions
    clearError: handleClearWorkspaceError,
    resetState: handleResetWorkspaceState,
    
    // Utility functions
    getWorkspacePermissions,
    formatWorkspaceStatus,
    getMemberRoleColor,
    getWorkspaceStats,
    formatWorkspaceType,
    refetchWorkspaces,
    
    // Mutation states
    isCreatingWorkspace: createWorkspaceMutation.isPending,
    isUpdatingWorkspace: updateWorkspaceMutation.isPending,
    isDeletingWorkspace: deleteWorkspaceMutation.isPending,
    isAddingMember: addWorkspaceMemberMutation.isPending,
    isRemovingMember: removeWorkspaceMemberMutation.isPending,
    isUpdatingMemberRole: updateWorkspaceMemberRoleMutation.isPending,
  };
};
