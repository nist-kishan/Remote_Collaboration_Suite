import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import {
  Plus,
  Clock,
  User,
  MessageSquare,
  CheckCircle2,
  ListTodo,
  PlayCircle,
  Eye,
  CheckCircle,
  XCircle,
  Send,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-hot-toast";
import taskApi from "../../api/taskApi";
import { projectApi } from "../../api/projectApi";
import CustomButton from "../ui/CustomButton";
import CustomCard from "../ui/CustomCard";
import TaskCreateModal from "../task/TaskCreateModal";
import TaskDetailsModal from "../task/TaskDetailsModal";
import { getProjectUserRole } from "../../utils/roleUtils";
import { setSelectedTask, clearSelectedTask } from "../../store/slice/taskSlice";

// Task Card Component
const TaskCard = ({ task, onTaskClick, onRequestReview, currentUserRole }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "review":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "todo":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((date - now) / (1000 * 60 * 60 * 24));

    if (diffInDays < 0) return "Overdue";
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Tomorrow";
    return `${diffInDays}d left`;
  };

  // Determine if task is completed
  const isCompleted = task.status === 'completed';

  return (
    <CustomCard 
      className={`p-4 transition-all duration-200 border ${
        isCompleted 
          ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800' 
          : 'hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 cursor-pointer group border-gray-200 dark:border-gray-700'
      }`}
      onClick={() => !isCompleted && onTaskClick(task)}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
          {task.title}
        </h4>
        <div className="flex items-center gap-2">
          {!task.assignedTo && (
            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
              Unassigned
            </span>
          )}
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
            {task.status === 'completed' ? 'Completed' : 
             task.status === 'in_progress' ? 'In Progress' : 
             task.status === 'review' ? 'Review' : 'Todo'}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}>
            {task.priority || "medium"}
          </span>
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed mb-3">
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {task.assignedTo ? (
            <div className="flex items-center gap-1">
              {task.assignedTo.avatar ? (
                <img 
                  src={task.assignedTo.avatar} 
                  alt={task.assignedTo.name} 
                  className="w-5 h-5 rounded-full"
                />
              ) : (
                <User className="w-3 h-3" />
              )}
              <span className="font-medium">{task.assignedTo.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
              <User className="w-3 h-3" />
              <span className="font-medium">Unassigned</span>
            </div>
          )}

          {task.dueDate && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span className="font-medium">{formatDate(task.dueDate)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {task.comments && task.comments.length > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              <span>{task.comments.length}</span>
            </div>
          )}

          {task.estimatedHours && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{task.estimatedHours}h</span>
            </div>
          )}
        </div>
      </div>

      {/* Request Review Button for In Progress tasks */}
      {task.status === 'in_progress' && onRequestReview && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <CustomButton
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onRequestReview(task);
            }}
            className="w-full text-xs"
          >
            <Send className="w-3 h-3 inline mr-1" />
            Request Review
          </CustomButton>
        </div>
      )}
    </CustomCard>
  );
};

// Status Column Component
const StatusColumn = ({ 
  title, 
  icon, 
  tasks, 
  onTaskClick, 
  onCreateTask, 
  onRequestReview,
  currentUserRole,
  canCreate,
  canReview,
  onAcceptReview,
  onRejectReview
}) => {
  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <span className="bg-indigo-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
            {tasks.length}
          </span>
        </div>
        {canCreate && title === "In Progress" && (
          <CustomButton
            size="sm"
            onClick={() => onCreateTask('todo')}
            className="h-8 w-8 p-0"
          >
            <Plus className="w-4 h-4" />
          </CustomButton>
        )}
      </div>

      <div className="space-y-3">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task._id}>
              <TaskCard
                task={task}
                onTaskClick={onTaskClick}
                onRequestReview={onRequestReview}
                currentUserRole={currentUserRole}
              />
              {/* Review Actions for Review Column */}
              {title === "Review" && canReview && task.status === 'review' && (
                <div className="mt-2 flex gap-2">
                  <CustomButton
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAcceptReview(task);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
                  >
                    <CheckCircle className="w-3 h-3 inline mr-1" />
                    Accept
                  </CustomButton>
                  <CustomButton
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRejectReview(task);
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-xs"
                  >
                    <XCircle className="w-3 h-3 inline mr-1" />
                    Reject
                  </CustomButton>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No tasks</p>
          </div>
        )}
      </div>
    </div>
  );
};

const KanbanBoard = ({ projectId, selectedBoardId }) => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);
  const selectedTask = useSelector((state) => state.task.selectedTask);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const limit = 50;

  // Fetch project members
  const { data: projectData } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      return projectApi.getProject(projectId);
    },
    enabled: !!projectId,
  });

  // Extract project members from projectData
  const projectMembers = projectData?.data?.data?.project?.team || [];
  const project = projectData?.data?.data?.project;

  // Get current user's role in the project
  const currentUserRole = projectData?.data?.data?.project?.team?.find(
    member => member.user?._id === currentUser?._id
  )?.role || 'employee';

  // Role-based permissions
  const canCreateTask = ['owner', 'hr', 'mr', 'tr'].includes(currentUserRole);
  const canReview = ['owner', 'hr', 'mr'].includes(currentUserRole);

  // Fetch tasks with pagination
  const {
    data: tasksData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["project-tasks", projectId, currentPage, activeTab],
    queryFn: async () => {
      if (!projectId) return null;
      const params = { page: currentPage, limit };
      // Add status filter based on active tab
      if (activeTab !== 'all') {
        params.status = activeTab;
      }
      return taskApi.getProjectTasks(projectId, params);
    },
    enabled: !!projectId,
  });

  const allTasks = tasksData?.data?.data?.tasks || [];
  const pagination = tasksData?.data?.data?.pagination || {};

  // Filter tasks based on role
  const getFilteredTasks = (tasks, status) => {
    if (currentUserRole === 'employee') {
      // Employees can only see their own tasks
      return tasks.filter(task => 
        task.status === status && 
        task.assignedTo && 
        task.assignedTo._id === currentUser._id
      );
    }
    // Others can see all tasks
    return tasks.filter(task => task.status === status);
  };

  const tasksByStatus = {
    todo: getFilteredTasks(allTasks, 'todo'),
    in_progress: getFilteredTasks(allTasks, 'in_progress'),
    review: getFilteredTasks(allTasks, 'review'),
    completed: getFilteredTasks(allTasks, 'completed'),
  };

  // Request review mutation
  const requestReviewMutation = useMutation({
    mutationFn: (taskId) => taskApi.updateTask(taskId, { status: 'review' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['project-tasks', projectId]);
      toast.success('Review requested successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to request review');
    }
  });

  // Accept review mutation
  const acceptReviewMutation = useMutation({
    mutationFn: (taskId) => taskApi.updateTask(taskId, { status: 'completed' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['project-tasks', projectId]);
      toast.success('Task approved and marked as completed');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to accept review');
    }
  });

  // Reject review mutation
  const rejectReviewMutation = useMutation({
    mutationFn: (taskId) => taskApi.updateTask(taskId, { status: 'in_progress' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['project-tasks', projectId]);
      toast.success('Review rejected, task moved back to in progress');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reject review');
    }
  });

  const handleTaskClick = (task) => {
    // Don't open modal if task is completed
    if (task.status === 'completed') {
      return;
    }
    dispatch(setSelectedTask(task));
    setShowTaskDetails(true);
  };

  const handleRequestReview = (task) => {
    requestReviewMutation.mutate(task._id);
  };

  const handleAcceptReview = (task) => {
    acceptReviewMutation.mutate(task._id);
  };

  const handleRejectReview = (task) => {
    rejectReviewMutation.mutate(task._id);
  };

  const handleCreateTask = (status) => {
    setShowCreateModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 p-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex-1">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-96 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 dark:text-red-400">Error loading tasks: {error.message}</p>
        <CustomButton onClick={() => refetch()} className="mt-4">
          Retry
        </CustomButton>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Kanban Board
            </h2>
            {canCreateTask && (
              <CustomButton onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 inline mr-2" />
                Create Task
              </CustomButton>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              {[
                { id: 'all', label: 'All Tasks', icon: CheckCircle2 },
                { id: 'todo', label: 'Task', icon: ListTodo },
                { id: 'in_progress', label: 'In Progress', icon: PlayCircle },
                { id: 'review', label: 'Review', icon: Eye },
                { id: 'completed', label: 'Completed', icon: CheckCircle2 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`
                    flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors
                    ${activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tasks List */}
          <div className="p-6">
            {allTasks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No tasks found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allTasks.map((task) => (
                  <div key={task._id}>
                    <TaskCard
                      task={task}
                      onTaskClick={handleTaskClick}
                      onRequestReview={handleRequestReview}
                      currentUserRole={currentUserRole}
                    />
                    {/* Review Actions */}
                    {activeTab === 'review' && canReview && task.status === 'review' && (
                      <div className="mt-2 flex gap-2">
                        <CustomButton
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptReview(task);
                          }}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
                        >
                          <CheckCircle className="w-3 h-3 inline mr-1" />
                          Accept
                        </CustomButton>
                        <CustomButton
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRejectReview(task);
                          }}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-xs"
                        >
                          <XCircle className="w-3 h-3 inline mr-1" />
                          Reject
                        </CustomButton>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing page {pagination.currentPage} of {pagination.totalPages} 
                ({pagination.totalCount} total tasks)
              </div>
              <div className="flex items-center gap-2">
                <CustomButton
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={!pagination.hasPrevPage || isLoading}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </CustomButton>
                
                <div className="flex gap-1">
                  {[...Array(pagination.totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    // Show first page, last page, current page, and pages around current
                    if (
                      pageNum === 1 ||
                      pageNum === pagination.totalPages ||
                      (pageNum >= pagination.currentPage - 1 && pageNum <= pagination.currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          disabled={isLoading}
                          className={`px-3 py-1 text-sm rounded ${
                            pageNum === pagination.currentPage
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (
                      pageNum === pagination.currentPage - 2 ||
                      pageNum === pagination.currentPage + 2
                    ) {
                      return <span key={pageNum} className="px-2 text-gray-500">...</span>;
                    }
                    return null;
                  })}
                </div>

                <CustomButton
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={!pagination.hasNextPage || isLoading}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </CustomButton>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <TaskCreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          projectId={projectId}
          projectMembers={projectMembers.map(member => ({
            user: member.user
          }))}
          onCreateTask={(taskData) => {
            taskApi.createTask(projectId, taskData).then(() => {
              queryClient.invalidateQueries(['project-tasks', projectId]);
              setShowCreateModal(false);
              toast.success("Task created successfully");
            }).catch((error) => {
              toast.error(error.response?.data?.message || 'Failed to create task');
            });
          }}
        />
      )}

      {/* Task Details Modal */}
      {showTaskDetails && selectedTask && (
        <TaskDetailsModal
          isOpen={showTaskDetails}
          onClose={() => {
            setShowTaskDetails(false);
            dispatch(clearSelectedTask());
          }}
          task={selectedTask}
          project={project}
          onTaskUpdated={() => {
            refetch();
            setShowTaskDetails(false);
            dispatch(clearSelectedTask());
          }}
          onTaskDeleted={() => {
            refetch();
            setShowTaskDetails(false);
            dispatch(clearSelectedTask());
          }}
        />
      )}
    </>
  );
};

export default KanbanBoard;
