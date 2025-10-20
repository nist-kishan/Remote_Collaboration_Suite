import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useNavigation } from './useNavigation';
import {
  // API functions
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  updateProjectMemberRole,
  getProjectMembers,
  getProjectTasks,
  createTask,
  updateTask,
  deleteTask,
  getProjectMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting
} from '../api/projectApi';
import {
  // Redux actions
  setActiveTab,
  setViewMode,
  setCurrentProject,
  clearCurrentProject,
  setShowCreateProjectModal,
  setShowAddMemberModal,
  setShowCreateTaskModal,
  setShowCreateMeetingModal,
  setShowTaskDetailsModal,
  setShowMeetingDetailsModal,
  clearError,
  clearAllErrors,
  updateProjectInList,
  removeProjectFromList,
  addProjectToList,
  resetProjectState,
  // Redux selectors
  selectProjects,
  selectCurrentProject,
  selectProjectMembers,
  selectProjectTasks,
  selectProjectMeetings,
  selectUserRole,
  selectIsAdmin,
  selectActiveTab,
  selectViewMode,
  selectProjectLoading,
  selectProjectErrors,
  selectProjectOperations,
  selectProjectPagination,
  selectShowCreateProjectModal,
  selectShowAddMemberModal,
  selectShowCreateTaskModal,
  selectShowCreateMeetingModal,
  selectShowTaskDetailsModal,
  selectShowMeetingDetailsModal
} from '../store/slice/projectSlice';

/**
 * Consolidated Project Hook - All project-related functionality in one place
 * Combines: useProjectBusinessLogic
 */
export const useProject = (projectId = null, params = {}) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.auth);
  const { navigateTo } = useNavigation();

  // Redux state selectors
  const projects = useSelector(selectProjects);
  const currentProject = useSelector(selectCurrentProject);
  const projectMembers = useSelector(selectProjectMembers);
  const projectTasks = useSelector(selectProjectTasks);
  const projectMeetings = useSelector(selectProjectMeetings);
  const userRole = useSelector(selectUserRole);
  const isAdmin = useSelector(selectIsAdmin);
  const activeTab = useSelector(selectActiveTab);
  const viewMode = useSelector(selectViewMode);
  const loading = useSelector(selectProjectLoading);
  const errors = useSelector(selectProjectErrors);
  const operations = useSelector(selectProjectOperations);
  const pagination = useSelector(selectProjectPagination);
  const showCreateProjectModal = useSelector(selectShowCreateProjectModal);
  const showAddMemberModal = useSelector(selectShowAddMemberModal);
  const showCreateTaskModal = useSelector(selectShowCreateTaskModal);
  const showCreateMeetingModal = useSelector(selectShowCreateMeetingModal);
  const showTaskDetailsModal = useSelector(selectShowTaskDetailsModal);
  const showMeetingDetailsModal = useSelector(selectShowMeetingDetailsModal);

  // Fetch projects with React Query
  const { data: projectsData, isLoading: isLoadingProjects, error: projectsError, refetch: refetchProjects } = useQuery({
    queryKey: ['projects', params],
    queryFn: () => projectApi.getAllProjects(params),
    enabled: !!user,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const { data: projectData, isLoading: isLoadingProject, error: projectError } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectApi.getProject(projectId),
    enabled: !!user && !!projectId,
    staleTime: 60000,
  });

  // Note: These queries are commented out until corresponding API functions are added to projectApi.js
  // const { data: membersData, isLoading: isLoadingMembers, error: membersError } = useQuery({
  //   queryKey: ['projectMembers', projectId],
  //   queryFn: () => projectApi.getProjectMembers(projectId),
  //   enabled: !!user && !!projectId,
  //   staleTime: 30000,
  // });

  // const { data: tasksData, isLoading: isLoadingTasks, error: tasksError } = useQuery({
  //   queryKey: ['projectTasks', projectId, params],
  //   queryFn: () => projectApi.getProjectTasks(projectId, params),
  //   enabled: !!user && !!projectId,
  //   staleTime: 30000,
  // });

  // const { data: meetingsData, isLoading: isLoadingMeetings, error: meetingsError } = useQuery({
  //   queryKey: ['projectMeetings', projectId, params],
  //   queryFn: () => projectApi.getProjectMeetings(projectId, params),
  //   enabled: !!user && !!projectId,
  //   staleTime: 30000,
  // });

  // Mutations
  const createProjectMutation = useMutation({
    mutationFn: ({ workspaceId, projectData }) => projectApi.createProject(workspaceId, projectData),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['projects']);
      toast.success('Project created successfully');
      navigateTo(`/projects/${data.data.project._id}`);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to create project');
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ projectId, data }) => projectApi.updateProject(projectId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['projects']);
      queryClient.invalidateQueries(['project', variables.projectId]);
      toast.success('Project updated successfully');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update project');
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (projectId) => projectApi.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      toast.success('Project deleted successfully');
      navigateTo('/projects');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete project');
    },
  });

  const addProjectMemberMutation = useMutation({
    mutationFn: ({ projectId, memberData }) => projectApi.addProjectMember(projectId, memberData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['projectMembers', variables.projectId]);
      queryClient.invalidateQueries(['project', variables.projectId]);
      toast.success('Member added successfully');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to add member');
    },
  });

  const removeProjectMemberMutation = useMutation({
    mutationFn: ({ projectId, memberId }) => projectApi.removeProjectMember(projectId, memberId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['projectMembers', variables.projectId]);
      queryClient.invalidateQueries(['project', variables.projectId]);
      toast.success('Member removed successfully');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to remove member');
    },
  });

  const updateProjectMemberRoleMutation = useMutation({
    mutationFn: ({ projectId, memberId, role }) => projectApi.updateMemberRole(projectId, memberId, { role }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['projectMembers', variables.projectId]);
      queryClient.invalidateQueries(['project', variables.projectId]);
      toast.success('Member role updated successfully');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update member role');
    },
  });

  // Note: These mutations are commented out until corresponding API functions are added to projectApi.js
  // const createProjectTaskMutation = useMutation({
  //   mutationFn: ({ projectId, taskData }) => projectApi.createProjectTask(projectId, taskData),
  //   onSuccess: (data, variables) => {
  //     queryClient.invalidateQueries(['projectTasks', variables.projectId]);
  //     toast.success('Task created successfully');
  //   },
  //   onError: (error) => {
  //     toast.error(error?.response?.data?.message || 'Failed to create task');
  //   },
  // });

  // const updateProjectTaskMutation = useMutation({
  //   mutationFn: ({ projectId, taskId, taskData }) => projectApi.updateProjectTask(projectId, taskId, taskData),
  //   onSuccess: (data, variables) => {
  //     queryClient.invalidateQueries(['projectTasks', variables.projectId]);
  //     toast.success('Task updated successfully');
  //   },
  //   onError: (error) => {
  //     toast.error(error?.response?.data?.message || 'Failed to update task');
  //   },
  // });

  // const deleteProjectTaskMutation = useMutation({
  //   mutationFn: ({ projectId, taskId }) => projectApi.deleteProjectTask(projectId, taskId),
  //   onSuccess: (data, variables) => {
  //     queryClient.invalidateQueries(['projectTasks', variables.projectId]);
  //     toast.success('Task deleted successfully');
  //   },
  //   onError: (error) => {
  //     toast.error(error?.response?.data?.message || 'Failed to delete task');
  //   },
  // });

  // const createProjectMeetingMutation = useMutation({
  //   mutationFn: ({ projectId, meetingData }) => projectApi.createProjectMeeting(projectId, meetingData),
  //   onSuccess: (data, variables) => {
  //     queryClient.invalidateQueries(['projectMeetings', variables.projectId]);
  //     toast.success('Meeting created successfully');
  //   },
  //   onError: (error) => {
  //     toast.error(error?.response?.data?.message || 'Failed to create meeting');
  //   },
  // });

  // const updateProjectMeetingMutation = useMutation({
  //   mutationFn: ({ projectId, meetingId, meetingData }) => projectApi.updateProjectMeeting(projectId, meetingId, meetingData),
  //   onSuccess: (data, variables) => {
  //     queryClient.invalidateQueries(['projectMeetings', variables.projectId]);
  //     toast.success('Meeting updated successfully');
  //   },
  //   onError: (error) => {
  //     toast.error(error?.response?.data?.message || 'Failed to update meeting');
  //   },
  // });

  // const deleteProjectMeetingMutation = useMutation({
  //   mutationFn: ({ projectId, meetingId }) => projectApi.deleteProjectMeeting(projectId, meetingId),
  //   onSuccess: (data, variables) => {
  //     queryClient.invalidateQueries(['projectMeetings', variables.projectId]);
  //     toast.success('Meeting deleted successfully');
  //   },
  //   onError: (error) => {
  //     toast.error(error?.response?.data?.message || 'Failed to delete meeting');
  //   },
  // });

  // Project management functions
  const handleCreateProject = useCallback(({ workspaceId, projectData }) => {
    createProjectMutation.mutate({ workspaceId, projectData });
  }, [createProjectMutation]);

  const handleUpdateProject = useCallback((projectId, data) => {
    updateProjectMutation.mutate({ projectId, data });
  }, [updateProjectMutation]);

  const handleDeleteProject = useCallback((projectId) => {
    deleteProjectMutation.mutate(projectId);
  }, [deleteProjectMutation]);

  const handleFetchProjects = useCallback((params = {}) => {
    refetchProjects();
  }, [refetchProjects]);

  const handleFetchProject = useCallback((id) => {
    queryClient.invalidateQueries(['project', id]);
  }, [queryClient]);

  // Member management functions
  const handleAddProjectMember = useCallback((projectId, memberData) => {
    addProjectMemberMutation.mutate({ projectId, memberData });
  }, [addProjectMemberMutation]);

  const handleRemoveProjectMember = useCallback((projectId, memberId) => {
    removeProjectMemberMutation.mutate({ projectId, memberId });
  }, [removeProjectMemberMutation]);

  const handleUpdateProjectMemberRole = useCallback((projectId, memberId, role) => {
    updateProjectMemberRoleMutation.mutate({ projectId, memberId, role });
  }, [updateProjectMemberRoleMutation]);

  const handleFetchProjectMembers = useCallback((projectId) => {
    queryClient.invalidateQueries(['projectMembers', projectId]);
  }, [queryClient]);

  // Note: These task and meeting functions are commented out until corresponding API functions are added
  // // Task management functions
  // const handleCreateProjectTask = useCallback((projectId, taskData) => {
  //   createProjectTaskMutation.mutate({ projectId, taskData });
  // }, [createProjectTaskMutation]);

  // const handleUpdateProjectTask = useCallback((projectId, taskId, taskData) => {
  //   updateProjectTaskMutation.mutate({ projectId, taskId, taskData });
  // }, [updateProjectTaskMutation]);

  // const handleDeleteProjectTask = useCallback((projectId, taskId) => {
  //   deleteProjectTaskMutation.mutate({ projectId, taskId });
  // }, [deleteProjectTaskMutation]);

  // const handleFetchProjectTasks = useCallback((projectId, params = {}) => {
  //   queryClient.invalidateQueries(['projectTasks', projectId, params]);
  // }, [queryClient]);

  // // Meeting management functions
  // const handleCreateProjectMeeting = useCallback((projectId, meetingData) => {
  //   createProjectMeetingMutation.mutate({ projectId, meetingData });
  // }, [createProjectMeetingMutation]);

  // const handleUpdateProjectMeeting = useCallback((projectId, meetingId, meetingData) => {
  //   updateProjectMeetingMutation.mutate({ projectId, meetingId, meetingData });
  // }, [updateProjectMeetingMutation]);

  // const handleDeleteProjectMeeting = useCallback((projectId, meetingId) => {
  //   deleteProjectMeetingMutation.mutate({ projectId, meetingId });
  // }, [deleteProjectMeetingMutation]);

  // const handleFetchProjectMeetings = useCallback((projectId, params = {}) => {
  //   queryClient.invalidateQueries(['projectMeetings', projectId, params]);
  // }, [queryClient]);

  // UI state management functions
  const handleSetActiveTab = useCallback((tab) => {
    dispatch(setActiveTab(tab));
  }, [dispatch]);

  const handleSetViewMode = useCallback((mode) => {
    dispatch(setViewMode(mode));
  }, [dispatch]);

  const handleSetCurrentProject = useCallback((project) => {
    dispatch(setCurrentProject(project));
  }, [dispatch]);

  const handleClearCurrentProject = useCallback(() => {
    dispatch(clearCurrentProject());
  }, [dispatch]);

  // Modal management functions
  const handleOpenCreateProjectModal = useCallback(() => {
    dispatch(setShowCreateProjectModal(true));
  }, [dispatch]);

  const handleCloseCreateProjectModal = useCallback(() => {
    dispatch(setShowCreateProjectModal(false));
  }, [dispatch]);

  const handleOpenAddMemberModal = useCallback(() => {
    dispatch(setShowAddMemberModal(true));
  }, [dispatch]);

  const handleCloseAddMemberModal = useCallback(() => {
    dispatch(setShowAddMemberModal(false));
  }, [dispatch]);

  const handleOpenCreateTaskModal = useCallback(() => {
    dispatch(setShowCreateTaskModal(true));
  }, [dispatch]);

  const handleCloseCreateTaskModal = useCallback(() => {
    dispatch(setShowCreateTaskModal(false));
  }, [dispatch]);

  const handleOpenCreateMeetingModal = useCallback(() => {
    dispatch(setShowCreateMeetingModal(true));
  }, [dispatch]);

  const handleCloseCreateMeetingModal = useCallback(() => {
    dispatch(setShowCreateMeetingModal(false));
  }, [dispatch]);

  const handleOpenTaskDetailsModal = useCallback(() => {
    dispatch(setShowTaskDetailsModal(true));
  }, [dispatch]);

  const handleCloseTaskDetailsModal = useCallback(() => {
    dispatch(setShowTaskDetailsModal(false));
  }, [dispatch]);

  const handleOpenMeetingDetailsModal = useCallback(() => {
    dispatch(setShowMeetingDetailsModal(true));
  }, [dispatch]);

  const handleCloseMeetingDetailsModal = useCallback(() => {
    dispatch(setShowMeetingDetailsModal(false));
  }, [dispatch]);

  // Error management functions
  const handleClearProjectError = useCallback((errorType) => {
    dispatch(clearError(errorType));
  }, [dispatch]);

  const handleClearAllProjectErrors = useCallback(() => {
    dispatch(clearAllErrors());
  }, [dispatch]);

  const handleResetProjectState = useCallback(() => {
    dispatch(resetProjectState());
  }, [dispatch]);

  // Utility functions
  const getProjectPermissions = useCallback((project, currentUser) => {
    if (!project || !currentUser) {
      return {
        canEdit: false,
        canDelete: false,
        canManageMembers: false,
        canCreateTasks: false,
        canCreateMeetings: false,
        userRole: null,
      };
    }

    const isOwner = project.owner?._id === currentUser._id;
    const userMember = project.members?.find(
      member => member.user._id === currentUser._id
    );

    const canEdit = isOwner || userMember?.role === 'admin' || userMember?.role === 'editor';
    const canDelete = isOwner;
    const canManageMembers = isOwner || userMember?.role === 'admin';
    const canCreateTasks = isOwner || userMember?.role === 'admin' || userMember?.role === 'editor';
    const canCreateMeetings = isOwner || userMember?.role === 'admin' || userMember?.role === 'editor';

    return {
      canEdit,
      canDelete,
      canManageMembers,
      canCreateTasks,
      canCreateMeetings,
      userRole: userMember?.role || (isOwner ? 'owner' : null),
      isOwner,
    };
  }, []);

  const formatProjectStatus = useCallback((status) => {
    const statusMap = {
      active: 'Active',
      completed: 'Completed',
      on_hold: 'On Hold',
      cancelled: 'Cancelled',
    };
    return statusMap[status] || status;
  }, []);

  const formatTaskStatus = useCallback((status) => {
    const statusMap = {
      todo: 'To Do',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return statusMap[status] || status;
  }, []);

  const formatTaskPriority = useCallback((priority) => {
    const priorityMap = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      urgent: 'Urgent',
    };
    return priorityMap[priority] || priority;
  }, []);

  const formatMeetingStatus = useCallback((status) => {
    const statusMap = {
      scheduled: 'Scheduled',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return statusMap[status] || status;
  }, []);

  // Extract data from API responses
  const apiProjectsData = projectsData?.data;
  const apiProjectData = projectData?.data;
  // const apiMembersData = membersData?.data;
  // const apiTasksData = tasksData?.data;
  // const apiMeetingsData = meetingsData?.data;

  const projectsList = apiProjectsData?.data?.projects || [];
  const projectDetails = apiProjectData?.data?.project;
  // const membersList = apiMembersData?.data?.members || [];
  // const tasksList = apiTasksData?.data?.tasks || [];
  // const meetingsList = apiMeetingsData?.data?.meetings || [];

  // Return consolidated interface
  return {
    // State
    user,
    projects: projectsList,
    currentProject: projectDetails || currentProject,
    projectMembers: [], // membersList, // Commented out until API function is available
    projectTasks: [], // tasksList, // Commented out until API function is available
    projectMeetings: [], // meetingsList, // Commented out until API function is available
    userRole,
    isAdmin,
    activeTab,
    viewMode,
    loading,
    errors,
    operations,
    pagination,
    showCreateProjectModal,
    showAddMemberModal,
    showCreateTaskModal,
    showCreateMeetingModal,
    showTaskDetailsModal,
    showMeetingDetailsModal,
    
    // Loading states
    isLoadingProjects,
    isLoadingProject,
    isLoadingMembers: false, // isLoadingMembers, // Commented out until API function is available
    isLoadingTasks: false, // isLoadingTasks, // Commented out until API function is available
    isLoadingMeetings: false, // isLoadingMeetings, // Commented out until API function is available
    
    // Error states
    projectsError,
    projectError,
    membersError: null, // membersError, // Commented out until API function is available
    tasksError: null, // tasksError, // Commented out until API function is available
    meetingsError: null, // meetingsError, // Commented out until API function is available
    
    // Project management actions
    createProject: handleCreateProject,
    fetchProjects: handleFetchProjects,
    fetchProject: handleFetchProject,
    updateProject: handleUpdateProject,
    deleteProject: handleDeleteProject,
    
    // Member management actions
    addProjectMember: handleAddProjectMember,
    removeProjectMember: handleRemoveProjectMember,
    updateProjectMemberRole: handleUpdateProjectMemberRole,
    fetchProjectMembers: handleFetchProjectMembers,
    
    // Task management actions (commented out until API functions are available)
    // fetchProjectTasks: handleFetchProjectTasks,
    // createProjectTask: handleCreateProjectTask,
    // updateProjectTask: handleUpdateProjectTask,
    // deleteProjectTask: handleDeleteProjectTask,
    
    // Meeting management actions (commented out until API functions are available)
    // fetchProjectMeetings: handleFetchProjectMeetings,
    // createProjectMeeting: handleCreateProjectMeeting,
    // updateProjectMeeting: handleUpdateProjectMeeting,
    // deleteProjectMeeting: handleDeleteProjectMeeting,
    
    // UI actions
    setActiveTab: handleSetActiveTab,
    setViewMode: handleSetViewMode,
    setCurrentProject: handleSetCurrentProject,
    clearCurrentProject: handleClearCurrentProject,
    
    // Modal actions
    openCreateProjectModal: handleOpenCreateProjectModal,
    closeCreateProjectModal: handleCloseCreateProjectModal,
    openAddMemberModal: handleOpenAddMemberModal,
    closeAddMemberModal: handleCloseAddMemberModal,
    openCreateTaskModal: handleOpenCreateTaskModal,
    closeCreateTaskModal: handleCloseCreateTaskModal,
    openCreateMeetingModal: handleOpenCreateMeetingModal,
    closeCreateMeetingModal: handleCloseCreateMeetingModal,
    openTaskDetailsModal: handleOpenTaskDetailsModal,
    closeTaskDetailsModal: handleCloseTaskDetailsModal,
    openMeetingDetailsModal: handleOpenMeetingDetailsModal,
    closeMeetingDetailsModal: handleCloseMeetingDetailsModal,
    
    // Error actions
    clearError: handleClearProjectError,
    clearAllErrors: handleClearAllProjectErrors,
    resetState: handleResetProjectState,
    
    // Utility functions
    getProjectPermissions,
    formatProjectStatus,
    formatTaskStatus,
    formatTaskPriority,
    formatMeetingStatus,
    refetchProjects,
    
    // Mutation states
    isCreatingProject: createProjectMutation.isPending,
    isUpdatingProject: updateProjectMutation.isPending,
    isDeletingProject: deleteProjectMutation.isPending,
    isAddingMember: addProjectMemberMutation.isPending,
    isRemovingMember: removeProjectMemberMutation.isPending,
    isUpdatingMemberRole: updateProjectMemberRoleMutation.isPending,
    // Task and meeting mutation states (commented out until API functions are available)
    // isCreatingTask: createProjectTaskMutation.isPending,
    // isUpdatingTask: updateProjectTaskMutation.isPending,
    // isDeletingTask: deleteProjectTaskMutation.isPending,
    // isCreatingMeeting: createProjectMeetingMutation.isPending,
    // isUpdatingMeeting: updateProjectMeetingMutation.isPending,
    // isDeletingMeeting: deleteProjectMeetingMutation.isPending,
  };
};
