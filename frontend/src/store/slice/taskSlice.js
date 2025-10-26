import { createSlice } from '@reduxjs/toolkit';

// Note: API calls are handled by React Query in useTask hook
// This slice only manages UI state and local data

const initialState = {
  // Current task
  currentTask: null,
  taskLoading: false,
  taskError: null,
  
  // Task list
  tasks: [],
  tasksLoading: false,
  tasksError: null,
  
  // Kanban data
  kanbanData: {
    todo: [],
    in_progress: [],
    review: [],
    completed: []
  },
  
  // Task statistics
  taskStats: null,
  statsLoading: false,
  statsError: null,
  
  // Task filters
  filters: {
    status: '',
    priority: '',
    type: '',
    assignedTo: '',
    search: ''
  },
  
  // UI state
  selectedTask: null,
  viewMode: 'kanban', // 'kanban' or 'list'
  
  // Modals
  showCreateTaskModal: false,
  showTaskDetailsModal: false,
  showTimeLogModal: false,
  
  // Operations
  operations: {
    creating: false,
    updating: false,
    deleting: false,
    moving: false,
    addingComment: false,
    loggingTime: false
  }
};

const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {
    // UI state management
    setCurrentTask: (state, action) => {
      state.currentTask = action.payload;
    },
    
    clearCurrentTask: (state) => {
      state.currentTask = null;
      state.taskError = null;
    },
    
    setSelectedTask: (state, action) => {
      state.selectedTask = action.payload;
    },
    
    clearSelectedTask: (state) => {
      state.selectedTask = null;
    },
    
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },
    
    // Task list management
    setTasks: (state, action) => {
      state.tasks = action.payload;
    },
    
    updateTaskInList: (state, action) => {
      const updatedTask = action.payload;
      const index = state.tasks.findIndex(task => task._id === updatedTask._id);
      if (index !== -1) {
        state.tasks[index] = updatedTask;
      }
    },
    
    removeTaskFromList: (state, action) => {
      const taskId = action.payload;
      state.tasks = state.tasks.filter(task => task._id !== taskId);
    },
    
    addTaskToList: (state, action) => {
      state.tasks.unshift(action.payload);
    },
    
    // Kanban data management
    setKanbanData: (state, action) => {
      state.kanbanData = action.payload;
    },
    
    updateKanbanTask: (state, action) => {
      const { taskId, status, task } = action.payload;
      
      // Remove task from old status
      Object.keys(state.kanbanData).forEach(key => {
        state.kanbanData[key] = state.kanbanData[key].filter(t => t._id !== taskId);
      });
      
      // Add task to new status
      if (state.kanbanData[status]) {
        state.kanbanData[status].push(task);
      }
    },
    
    addTaskToKanban: (state, action) => {
      const task = action.payload;
      const status = task.status || 'todo';
      if (state.kanbanData[status]) {
        state.kanbanData[status].push(task);
      }
    },
    
    removeTaskFromKanban: (state, action) => {
      const taskId = action.payload;
      Object.keys(state.kanbanData).forEach(key => {
        state.kanbanData[key] = state.kanbanData[key].filter(t => t._id !== taskId);
      });
    },
    
    // Task statistics
    setTaskStats: (state, action) => {
      state.taskStats = action.payload;
    },
    
    // Filters
    setFilter: (state, action) => {
      const { key, value } = action.payload;
      state.filters[key] = value;
    },
    
    clearFilters: (state) => {
      state.filters = {
        status: '',
        priority: '',
        type: '',
        assignedTo: '',
        search: ''
      };
    },
    
    // Modal management
    setShowCreateTaskModal: (state, action) => {
      state.showCreateTaskModal = action.payload;
    },
    
    setShowTaskDetailsModal: (state, action) => {
      state.showTaskDetailsModal = action.payload;
    },
    
    setShowTimeLogModal: (state, action) => {
      state.showTimeLogModal = action.payload;
    },
    
    // Error management
    clearError: (state, action) => {
      const errorType = action.payload;
      if (state[errorType]) {
        state[errorType] = null;
      }
    },
    
    clearAllErrors: (state) => {
      state.taskError = null;
      state.tasksError = null;
      state.statsError = null;
    },
    
    // Reset state
    resetTaskState: (state) => {
      return { ...initialState };
    }
  }
});

// Export actions
export const {
  setCurrentTask,
  clearCurrentTask,
  setSelectedTask,
  clearSelectedTask,
  setViewMode,
  setTasks,
  updateTaskInList,
  removeTaskFromList,
  addTaskToList,
  setKanbanData,
  updateKanbanTask,
  addTaskToKanban,
  removeTaskFromKanban,
  setTaskStats,
  setFilter,
  clearFilters,
  setShowCreateTaskModal,
  setShowTaskDetailsModal,
  setShowTimeLogModal,
  clearError,
  clearAllErrors,
  resetTaskState
} = taskSlice.actions;

// Export selectors
export const selectCurrentTask = (state) => state.task.currentTask;
export const selectTasks = (state) => state.task.tasks;
export const selectKanbanData = (state) => state.task.kanbanData;
export const selectTaskStats = (state) => state.task.taskStats;
export const selectTaskFilters = (state) => state.task.filters;
export const selectSelectedTask = (state) => state.task.selectedTask;
export const selectTaskViewMode = (state) => state.task.viewMode;
export const selectTaskLoading = (state) => ({
  task: state.task.taskLoading,
  tasks: state.task.tasksLoading,
  stats: state.task.statsLoading
});
export const selectTaskErrors = (state) => ({
  task: state.task.taskError,
  tasks: state.task.tasksError,
  stats: state.task.statsError
});
export const selectTaskOperations = (state) => state.task.operations;

// Modal selectors
export const selectShowCreateTaskModal = (state) => state.task.showCreateTaskModal;
export const selectShowTaskDetailsModal = (state) => state.task.showTaskDetailsModal;
export const selectShowTimeLogModal = (state) => state.task.showTimeLogModal;

export default taskSlice.reducer;

