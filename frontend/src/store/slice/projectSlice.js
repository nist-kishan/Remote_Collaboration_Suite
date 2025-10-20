import { createSlice } from '@reduxjs/toolkit';

// Note: API calls are handled by React Query in useProject hook
// This slice only manages UI state and local data

const initialState = {
  // Projects list
  projects: [],
  projectsLoading: false,
  projectsError: null,
  
  // Current project
  currentProject: null,
  projectLoading: false,
  projectError: null,
  
  // Project members
  projectMembers: [],
  membersLoading: false,
  membersError: null,
  userRole: 'member',
  isAdmin: false,
  
  // Project tasks
  projectTasks: [],
  tasksLoading: false,
  tasksError: null,
  
  // Project meetings
  projectMeetings: [],
  meetingsLoading: false,
  meetingsError: null,
  
  // UI state
  activeTab: 'overview', // 'overview', 'tasks', 'meetings', 'members'
  viewMode: 'grid', // 'grid' or 'list'
  
  // Modals
  showCreateProjectModal: false,
  showAddMemberModal: false,
  showCreateTaskModal: false,
  showCreateMeetingModal: false,
  showTaskDetailsModal: false,
  showMeetingDetailsModal: false,
  
  // Operations
  operations: {
    creating: false,
    updating: false,
    deleting: false,
    addingMember: false,
    removingMember: false,
    updatingMemberRole: false,
    creatingTask: false,
    updatingTask: false,
    deletingTask: false,
    creatingMeeting: false,
    updatingMeeting: false,
    deletingMeeting: false
  },
  
  // Pagination
  pagination: {
    projects: { page: 1, limit: 20, total: 0, pages: 0 },
    tasks: { page: 1, limit: 20, total: 0, pages: 0 },
    meetings: { page: 1, limit: 20, total: 0, pages: 0 }
  }
};

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    // UI state management
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },
    
    setCurrentProject: (state, action) => {
      state.currentProject = action.payload;
    },
    
    clearCurrentProject: (state) => {
      state.currentProject = null;
      state.projectError = null;
      state.projectMembers = [];
      state.projectTasks = [];
      state.projectMeetings = [];
    },
    
    // Modal management
    setShowCreateProjectModal: (state, action) => {
      state.showCreateProjectModal = action.payload;
    },
    
    setShowAddMemberModal: (state, action) => {
      state.showAddMemberModal = action.payload;
    },
    
    setShowCreateTaskModal: (state, action) => {
      state.showCreateTaskModal = action.payload;
    },
    
    setShowCreateMeetingModal: (state, action) => {
      state.showCreateMeetingModal = action.payload;
    },
    
    setShowTaskDetailsModal: (state, action) => {
      state.showTaskDetailsModal = action.payload;
    },
    
    setShowMeetingDetailsModal: (state, action) => {
      state.showMeetingDetailsModal = action.payload;
    },
    
    // Error management
    clearError: (state, action) => {
      const errorType = action.payload;
      if (state[errorType]) {
        state[errorType] = null;
      }
    },
    
    clearAllErrors: (state) => {
      state.projectsError = null;
      state.projectError = null;
      state.membersError = null;
      state.tasksError = null;
      state.meetingsError = null;
    },
    
    // Optimistic updates
    updateProjectInList: (state, action) => {
      const updatedProject = action.payload;
      const index = state.projects.findIndex(project => project._id === updatedProject._id);
      if (index !== -1) {
        state.projects[index] = updatedProject;
      }
    },
    
    removeProjectFromList: (state, action) => {
      const projectId = action.payload;
      state.projects = state.projects.filter(project => project._id !== projectId);
    },
    
    addProjectToList: (state, action) => {
      state.projects.unshift(action.payload);
    },
    
    // Reset state
    resetProjectState: (state) => {
      return { ...initialState };
    }
  },
  // No extraReducers needed since we're using React Query for API calls
});

// Export actions
export const {
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
  resetProjectState
} = projectSlice.actions;

// Export selectors
export const selectProjects = (state) => state.project.projects;
export const selectCurrentProject = (state) => state.project.currentProject;
export const selectProjectMembers = (state) => state.project.projectMembers;
export const selectProjectTasks = (state) => state.project.projectTasks;
export const selectProjectMeetings = (state) => state.project.projectMeetings;
export const selectUserRole = (state) => state.project.userRole;
export const selectIsAdmin = (state) => state.project.isAdmin;
export const selectActiveTab = (state) => state.project.activeTab;
export const selectViewMode = (state) => state.project.viewMode;
export const selectProjectLoading = (state) => ({
  projects: state.project.projectsLoading,
  project: state.project.projectLoading,
  members: state.project.membersLoading,
  tasks: state.project.tasksLoading,
  meetings: state.project.meetingsLoading
});
export const selectProjectErrors = (state) => ({
  projects: state.project.projectsError,
  project: state.project.projectError,
  members: state.project.membersError,
  tasks: state.project.tasksError,
  meetings: state.project.meetingsError
});
export const selectProjectOperations = (state) => state.project.operations;
export const selectProjectPagination = (state) => state.project.pagination;

// Modal selectors
export const selectShowCreateProjectModal = (state) => state.project.showCreateProjectModal;
export const selectShowAddMemberModal = (state) => state.project.showAddMemberModal;
export const selectShowCreateTaskModal = (state) => state.project.showCreateTaskModal;
export const selectShowCreateMeetingModal = (state) => state.project.showCreateMeetingModal;
export const selectShowTaskDetailsModal = (state) => state.project.showTaskDetailsModal;
export const selectShowMeetingDetailsModal = (state) => state.project.showMeetingDetailsModal;

export default projectSlice.reducer;
