import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  createWorkspace,
  getUserWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addWorkspaceMember,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
  getWorkspaceMembers,
  getWorkspaceProjects,
  getWorkspaceDocuments,
  getWorkspaceWhiteboards
} from '../../api/workspaceApi';

// Async thunks for API calls
export const createWorkspaceThunk = createAsyncThunk(
  'workspace/createWorkspace',
  async (workspaceData, { rejectWithValue }) => {
    try {
      const response = await createWorkspace(workspaceData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create workspace');
    }
  }
);

export const fetchUserWorkspaces = createAsyncThunk(
  'workspace/fetchUserWorkspaces',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getUserWorkspaces(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch workspaces');
    }
  }
);

export const fetchWorkspace = createAsyncThunk(
  'workspace/fetchWorkspace',
  async (workspaceId, { rejectWithValue }) => {
    try {
      const response = await getWorkspace(workspaceId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch workspace');
    }
  }
);

export const updateWorkspaceThunk = createAsyncThunk(
  'workspace/updateWorkspace',
  async ({ workspaceId, data }, { rejectWithValue }) => {
    try {
      const response = await updateWorkspace(workspaceId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update workspace');
    }
  }
);

export const deleteWorkspaceThunk = createAsyncThunk(
  'workspace/deleteWorkspace',
  async (workspaceId, { rejectWithValue }) => {
    try {
      await deleteWorkspace(workspaceId);
      return workspaceId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete workspace');
    }
  }
);

export const addWorkspaceMemberThunk = createAsyncThunk(
  'workspace/addWorkspaceMember',
  async ({ workspaceId, memberData }, { rejectWithValue }) => {
    try {
      const response = await addWorkspaceMember(workspaceId, memberData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add member');
    }
  }
);

export const removeWorkspaceMemberThunk = createAsyncThunk(
  'workspace/removeWorkspaceMember',
  async ({ workspaceId, memberId }, { rejectWithValue }) => {
    try {
      await removeWorkspaceMember(workspaceId, memberId);
      return { workspaceId, memberId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove member');
    }
  }
);

export const updateWorkspaceMemberRoleThunk = createAsyncThunk(
  'workspace/updateWorkspaceMemberRole',
  async ({ workspaceId, memberId, role }, { rejectWithValue }) => {
    try {
      const response = await updateWorkspaceMemberRole(workspaceId, memberId, role);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update member role');
    }
  }
);

export const fetchWorkspaceMembers = createAsyncThunk(
  'workspace/fetchWorkspaceMembers',
  async (workspaceId, { rejectWithValue }) => {
    try {
      const response = await getWorkspaceMembers(workspaceId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch workspace members');
    }
  }
);

export const fetchWorkspaceProjects = createAsyncThunk(
  'workspace/fetchWorkspaceProjects',
  async ({ workspaceId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await getWorkspaceProjects(workspaceId, params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch workspace projects');
    }
  }
);

export const fetchWorkspaceDocuments = createAsyncThunk(
  'workspace/fetchWorkspaceDocuments',
  async ({ workspaceId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await getWorkspaceDocuments(workspaceId, params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch workspace documents');
    }
  }
);

export const fetchWorkspaceWhiteboards = createAsyncThunk(
  'workspace/fetchWorkspaceWhiteboards',
  async ({ workspaceId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await getWorkspaceWhiteboards(workspaceId, params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch workspace whiteboards');
    }
  }
);

const initialState = {
  // Workspaces list
  workspaces: [],
  workspacesLoading: false,
  workspacesError: null,
  
  // Current workspace
  currentWorkspace: null,
  workspaceLoading: false,
  workspaceError: null,
  
  // Workspace members
  workspaceMembers: [],
  membersLoading: false,
  membersError: null,
  userRole: 'member',
  isAdmin: false,
  
  // Workspace content
  workspaceProjects: [],
  workspaceDocuments: [],
  workspaceWhiteboards: [],
  contentLoading: {
    projects: false,
    documents: false,
    whiteboards: false
  },
  contentErrors: {
    projects: null,
    documents: null,
    whiteboards: null
  },
  
  // UI state
  activeTab: 'overview', // 'overview', 'projects', 'documents', 'whiteboards', 'members'
  viewMode: 'grid', // 'grid' or 'list'
  
  // Modals
  showCreateWorkspaceModal: false,
  showAddMemberModal: false,
  showWorkspaceSettingsModal: false,
  
  // Operations
  operations: {
    creating: false,
    updating: false,
    deleting: false,
    addingMember: false,
    removingMember: false,
    updatingMemberRole: false
  },
  
  // Pagination
  pagination: {
    workspaces: { page: 1, limit: 20, total: 0, pages: 0 },
    projects: { page: 1, limit: 20, total: 0, pages: 0 },
    documents: { page: 1, limit: 20, total: 0, pages: 0 },
    whiteboards: { page: 1, limit: 20, total: 0, pages: 0 }
  }
};

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    // UI state management
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },
    
    setCurrentWorkspace: (state, action) => {
      state.currentWorkspace = action.payload;
    },
    
    clearCurrentWorkspace: (state) => {
      state.currentWorkspace = null;
      state.workspaceError = null;
      state.workspaceMembers = [];
      state.workspaceProjects = [];
      state.workspaceDocuments = [];
      state.workspaceWhiteboards = [];
    },
    
    // Modal management
    setShowCreateWorkspaceModal: (state, action) => {
      state.showCreateWorkspaceModal = action.payload;
    },
    
    setShowAddMemberModal: (state, action) => {
      state.showAddMemberModal = action.payload;
    },
    
    setShowWorkspaceSettingsModal: (state, action) => {
      state.showWorkspaceSettingsModal = action.payload;
    },
    
    // Error management
    clearError: (state, action) => {
      const errorType = action.payload;
      if (state[errorType]) {
        state[errorType] = null;
      }
    },
    
    clearAllErrors: (state) => {
      state.workspacesError = null;
      state.workspaceError = null;
      state.membersError = null;
      state.contentErrors = {
        projects: null,
        documents: null,
        whiteboards: null
      };
    },
    
    // Optimistic updates
    updateWorkspaceInList: (state, action) => {
      const updatedWorkspace = action.payload;
      const index = state.workspaces.findIndex(ws => ws._id === updatedWorkspace._id);
      if (index !== -1) {
        state.workspaces[index] = updatedWorkspace;
      }
    },
    
    removeWorkspaceFromList: (state, action) => {
      const workspaceId = action.payload;
      state.workspaces = state.workspaces.filter(ws => ws._id !== workspaceId);
    },
    
    addWorkspaceToList: (state, action) => {
      state.workspaces.unshift(action.payload);
    },
    
    // Reset state
    resetWorkspaceState: (state) => {
      return { ...initialState };
    }
  },
  extraReducers: (builder) => {
    builder
      // Create workspace
      .addCase(createWorkspaceThunk.pending, (state) => {
        state.operations.creating = true;
      })
      .addCase(createWorkspaceThunk.fulfilled, (state, action) => {
        state.operations.creating = false;
        state.workspaces.unshift(action.payload.workspace);
        state.currentWorkspace = action.payload.workspace;
        state.showCreateWorkspaceModal = false;
      })
      .addCase(createWorkspaceThunk.rejected, (state, action) => {
        state.operations.creating = false;
        state.workspaceError = action.payload;
      })
      
      // Fetch user workspaces
      .addCase(fetchUserWorkspaces.pending, (state) => {
        state.workspacesLoading = true;
        state.workspacesError = null;
      })
      .addCase(fetchUserWorkspaces.fulfilled, (state, action) => {
        state.workspacesLoading = false;
        state.workspaces = action.payload.workspaces || [];
        state.pagination.workspaces = action.payload.pagination || state.pagination.workspaces;
      })
      .addCase(fetchUserWorkspaces.rejected, (state, action) => {
        state.workspacesLoading = false;
        state.workspacesError = action.payload;
      })
      
      // Fetch workspace
      .addCase(fetchWorkspace.pending, (state) => {
        state.workspaceLoading = true;
        state.workspaceError = null;
      })
      .addCase(fetchWorkspace.fulfilled, (state, action) => {
        state.workspaceLoading = false;
        state.currentWorkspace = action.payload.workspace;
        state.userRole = action.payload.userRole || 'member';
        state.isAdmin = action.payload.isAdmin || false;
      })
      .addCase(fetchWorkspace.rejected, (state, action) => {
        state.workspaceLoading = false;
        state.workspaceError = action.payload;
      })
      
      // Update workspace
      .addCase(updateWorkspaceThunk.pending, (state) => {
        state.operations.updating = true;
      })
      .addCase(updateWorkspaceThunk.fulfilled, (state, action) => {
        state.operations.updating = false;
        const updatedWorkspace = action.payload.workspace;
        
        // Update in workspaces list
        const index = state.workspaces.findIndex(ws => ws._id === updatedWorkspace._id);
        if (index !== -1) {
          state.workspaces[index] = updatedWorkspace;
        }
        
        // Update current workspace
        if (state.currentWorkspace?._id === updatedWorkspace._id) {
          state.currentWorkspace = updatedWorkspace;
        }
      })
      .addCase(updateWorkspaceThunk.rejected, (state, action) => {
        state.operations.updating = false;
        state.workspaceError = action.payload;
      })
      
      // Delete workspace
      .addCase(deleteWorkspaceThunk.pending, (state) => {
        state.operations.deleting = true;
      })
      .addCase(deleteWorkspaceThunk.fulfilled, (state, action) => {
        state.operations.deleting = false;
        const workspaceId = action.payload;
        state.workspaces = state.workspaces.filter(ws => ws._id !== workspaceId);
        
        if (state.currentWorkspace?._id === workspaceId) {
          state.currentWorkspace = null;
        }
      })
      .addCase(deleteWorkspaceThunk.rejected, (state, action) => {
        state.operations.deleting = false;
        state.workspaceError = action.payload;
      })
      
      // Add workspace member
      .addCase(addWorkspaceMemberThunk.pending, (state) => {
        state.operations.addingMember = true;
      })
      .addCase(addWorkspaceMemberThunk.fulfilled, (state, action) => {
        state.operations.addingMember = false;
        state.workspaceMembers.push(action.payload.member);
        state.showAddMemberModal = false;
      })
      .addCase(addWorkspaceMemberThunk.rejected, (state, action) => {
        state.operations.addingMember = false;
        state.membersError = action.payload;
      })
      
      // Remove workspace member
      .addCase(removeWorkspaceMemberThunk.pending, (state) => {
        state.operations.removingMember = true;
      })
      .addCase(removeWorkspaceMemberThunk.fulfilled, (state, action) => {
        state.operations.removingMember = false;
        const { memberId } = action.payload;
        state.workspaceMembers = state.workspaceMembers.filter(member => member._id !== memberId);
      })
      .addCase(removeWorkspaceMemberThunk.rejected, (state, action) => {
        state.operations.removingMember = false;
        state.membersError = action.payload;
      })
      
      // Update workspace member role
      .addCase(updateWorkspaceMemberRoleThunk.pending, (state) => {
        state.operations.updatingMemberRole = true;
      })
      .addCase(updateWorkspaceMemberRoleThunk.fulfilled, (state, action) => {
        state.operations.updatingMemberRole = false;
        const updatedMember = action.payload.member;
        const index = state.workspaceMembers.findIndex(member => member._id === updatedMember._id);
        if (index !== -1) {
          state.workspaceMembers[index] = updatedMember;
        }
      })
      .addCase(updateWorkspaceMemberRoleThunk.rejected, (state, action) => {
        state.operations.updatingMemberRole = false;
        state.membersError = action.payload;
      })
      
      // Fetch workspace members
      .addCase(fetchWorkspaceMembers.pending, (state) => {
        state.membersLoading = true;
        state.membersError = null;
      })
      .addCase(fetchWorkspaceMembers.fulfilled, (state, action) => {
        state.membersLoading = false;
        state.workspaceMembers = action.payload.members || [];
        state.userRole = action.payload.userRole || 'member';
        state.isAdmin = action.payload.isAdmin || false;
      })
      .addCase(fetchWorkspaceMembers.rejected, (state, action) => {
        state.membersLoading = false;
        state.membersError = action.payload;
      })
      
      // Fetch workspace projects
      .addCase(fetchWorkspaceProjects.pending, (state) => {
        state.contentLoading.projects = true;
        state.contentErrors.projects = null;
      })
      .addCase(fetchWorkspaceProjects.fulfilled, (state, action) => {
        state.contentLoading.projects = false;
        state.workspaceProjects = action.payload.projects || [];
        state.pagination.projects = action.payload.pagination || state.pagination.projects;
      })
      .addCase(fetchWorkspaceProjects.rejected, (state, action) => {
        state.contentLoading.projects = false;
        state.contentErrors.projects = action.payload;
      })
      
      // Fetch workspace documents
      .addCase(fetchWorkspaceDocuments.pending, (state) => {
        state.contentLoading.documents = true;
        state.contentErrors.documents = null;
      })
      .addCase(fetchWorkspaceDocuments.fulfilled, (state, action) => {
        state.contentLoading.documents = false;
        state.workspaceDocuments = action.payload.documents || [];
        state.pagination.documents = action.payload.pagination || state.pagination.documents;
      })
      .addCase(fetchWorkspaceDocuments.rejected, (state, action) => {
        state.contentLoading.documents = false;
        state.contentErrors.documents = action.payload;
      })
      
      // Fetch workspace whiteboards
      .addCase(fetchWorkspaceWhiteboards.pending, (state) => {
        state.contentLoading.whiteboards = true;
        state.contentErrors.whiteboards = null;
      })
      .addCase(fetchWorkspaceWhiteboards.fulfilled, (state, action) => {
        state.contentLoading.whiteboards = false;
        state.workspaceWhiteboards = action.payload.whiteboards || [];
        state.pagination.whiteboards = action.payload.pagination || state.pagination.whiteboards;
      })
      .addCase(fetchWorkspaceWhiteboards.rejected, (state, action) => {
        state.contentLoading.whiteboards = false;
        state.contentErrors.whiteboards = action.payload;
      });
  }
});

// Export actions
export const {
  setActiveTab,
  setViewMode,
  setCurrentWorkspace,
  clearCurrentWorkspace,
  setShowCreateWorkspaceModal,
  setShowAddMemberModal,
  setShowWorkspaceSettingsModal,
  clearError,
  clearAllErrors,
  updateWorkspaceInList,
  removeWorkspaceFromList,
  addWorkspaceToList,
  resetWorkspaceState
} = workspaceSlice.actions;

// Export selectors
export const selectWorkspaces = (state) => state.workspace.workspaces;
export const selectCurrentWorkspace = (state) => state.workspace.currentWorkspace;
export const selectWorkspaceMembers = (state) => state.workspace.workspaceMembers;
export const selectWorkspaceProjects = (state) => state.workspace.workspaceProjects;
export const selectWorkspaceDocuments = (state) => state.workspace.workspaceDocuments;
export const selectWorkspaceWhiteboards = (state) => state.workspace.workspaceWhiteboards;
export const selectUserRole = (state) => state.workspace.userRole;
export const selectIsAdmin = (state) => state.workspace.isAdmin;
export const selectActiveTab = (state) => state.workspace.activeTab;
export const selectViewMode = (state) => state.workspace.viewMode;
export const selectWorkspaceLoading = (state) => ({
  workspaces: state.workspace.workspacesLoading,
  workspace: state.workspace.workspaceLoading,
  members: state.workspace.membersLoading,
  content: state.workspace.contentLoading
});
export const selectWorkspaceErrors = (state) => ({
  workspaces: state.workspace.workspacesError,
  workspace: state.workspace.workspaceError,
  members: state.workspace.membersError,
  content: state.workspace.contentErrors
});
export const selectWorkspaceOperations = (state) => state.workspace.operations;
export const selectWorkspacePagination = (state) => state.workspace.pagination;

// Modal selectors
export const selectShowCreateWorkspaceModal = (state) => state.workspace.showCreateWorkspaceModal;
export const selectShowAddMemberModal = (state) => state.workspace.showAddMemberModal;
export const selectShowWorkspaceSettingsModal = (state) => state.workspace.showWorkspaceSettingsModal;

export default workspaceSlice.reducer;
