import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import taskApi from '../api/taskApi';
import { 
  setShowCreateTaskModal, 
  setShowTaskDetailsModal,
  setShowTimeLogModal,
  setSelectedTask,
  updateKanbanTask,
  addTaskToKanban,
  removeTaskFromKanban,
  setTaskStats
} from '../store/slice/taskSlice';

export const useTask = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const selectedTask = useSelector(state => state.task.selectedTask);

  // Get all Kanban boards
  const getAllKanbanBoards = (params = {}) => {
    return useQuery({
      queryKey: ['kanban-boards', params],
      queryFn: () => taskApi.getAllKanbanBoards(params),
      staleTime: 30000, // 30 seconds
    });
  };

  // Get project tasks
  const getProjectTasks = (projectId, params = {}) => {
    return useQuery({
      queryKey: ['project-tasks', projectId, params],
      queryFn: () => taskApi.getProjectTasks(projectId, params),
      enabled: !!projectId,
      staleTime: 30000, // 30 seconds
    });
  };

  // Get single task
  const getTask = (taskId) => {
    return useQuery({
      queryKey: ['task', taskId],
      queryFn: () => taskApi.getTask(taskId),
      enabled: !!taskId,
      staleTime: 30000, // 30 seconds
    });
  };

  // Get task statistics
  const getTaskStats = (projectId) => {
    return useQuery({
      queryKey: ['task-stats', projectId],
      queryFn: () => taskApi.getTaskStats(projectId),
      enabled: !!projectId,
      staleTime: 60000, // 1 minute
    });
  };

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: ({ projectId, data }) => taskApi.createTask(projectId, data),
    onSuccess: (response, variables) => {
      const newTask = response.data.data.task;
      
      // Update Kanban data
      dispatch(addTaskToKanban(newTask));
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['project-tasks', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['task-stats', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['kanban-boards'] });
      
      dispatch(setShowCreateTaskModal(false));
      toast.success('Task created successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create task');
    }
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }) => taskApi.updateTask(taskId, data),
    onSuccess: (response, variables) => {
      const updatedTask = response.data.data.task;
      
      // Update Kanban data if status changed
      if (variables.data.status) {
        dispatch(updateKanbanTask({
          taskId: updatedTask._id,
          status: updatedTask.status,
          task: updatedTask
        }));
      }
      
      // Update selected task if it's the same one
      if (selectedTask && selectedTask._id === updatedTask._id) {
        dispatch(setSelectedTask(updatedTask));
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-stats'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-boards'] });
      
      dispatch(setShowTaskDetailsModal(false));
      toast.success('Task updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update task');
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => taskApi.deleteTask(taskId),
    onSuccess: (response, taskId) => {
      // Remove from Kanban
      dispatch(removeTaskFromKanban(taskId));
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-stats'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-boards'] });
      
      dispatch(setShowTaskDetailsModal(false));
      toast.success('Task deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete task');
    }
  });

  // Move task mutation (drag & drop)
  const moveTaskMutation = useMutation({
    mutationFn: ({ taskId, data }) => taskApi.moveTask(taskId, data),
    onSuccess: (response, variables) => {
      const updatedTask = response.data.data.task;
      
      // Update Kanban data
      dispatch(updateKanbanTask({
        taskId: updatedTask._id,
        status: updatedTask.status,
        task: updatedTask
      }));
      
      // Update selected task if it's the same one
      if (selectedTask && selectedTask._id === updatedTask._id) {
        dispatch(setSelectedTask(updatedTask));
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-stats'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-boards'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to move task');
    }
  });

  // Add task comment mutation
  const addTaskCommentMutation = useMutation({
    mutationFn: ({ taskId, data }) => taskApi.addTaskComment(taskId, data),
    onSuccess: (response, variables) => {
      const updatedTask = response.data.data.task;
      
      // Update selected task if it's the same one
      if (selectedTask && selectedTask._id === updatedTask._id) {
        dispatch(setSelectedTask(updatedTask));
      }
      
      // Update Kanban data to reflect new comment
      dispatch(updateKanbanTask({
        taskId: updatedTask._id,
        status: updatedTask.status,
        task: updatedTask
      }));
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-boards'] });
      
      toast.success('Comment added successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    }
  });

  // Log time mutation
  const logTaskTimeMutation = useMutation({
    mutationFn: ({ taskId, data }) => taskApi.logTaskTime(taskId, data),
    onSuccess: (response, variables) => {
      const updatedTask = response.data.data.task;
      
      // Update selected task if it's the same one
      if (selectedTask && selectedTask._id === updatedTask._id) {
        dispatch(setSelectedTask(updatedTask));
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-stats'] });
      
      dispatch(setShowTimeLogModal(false));
      toast.success('Time logged successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to log time');
    }
  });

  // Modal handlers
  const openCreateTaskModal = () => {
    dispatch(setShowCreateTaskModal(true));
  };

  const closeCreateTaskModal = () => {
    dispatch(setShowCreateTaskModal(false));
  };

  const openTaskDetailsModal = (task) => {
    dispatch(setSelectedTask(task));
    dispatch(setShowTaskDetailsModal(true));
  };

  const closeTaskDetailsModal = () => {
    dispatch(setSelectedTask(null));
    dispatch(setShowTaskDetailsModal(false));
  };

  const openTimeLogModal = () => {
    dispatch(setShowTimeLogModal(true));
  };

  const closeTimeLogModal = () => {
    dispatch(setShowTimeLogModal(false));
  };

  return {
    // Queries
    getAllKanbanBoards,
    getProjectTasks,
    getTask,
    getTaskStats,
    
    // Mutations
    createTaskMutation,
    updateTaskMutation,
    deleteTaskMutation,
    moveTaskMutation,
    addTaskCommentMutation,
    logTaskTimeMutation,
    
    // Modal handlers
    openCreateTaskModal,
    closeCreateTaskModal,
    openTaskDetailsModal,
    closeTaskDetailsModal,
    openTimeLogModal,
    closeTimeLogModal,
    
    // State
    selectedTask
  };
};

export default useTask;

