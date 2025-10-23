import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  MoreVertical,
  Clock,
  User,
  Tag,
  MessageSquare,
  Search,
  Filter,
  Edit,
  Trash2,
  GripVertical,
  AlertCircle,
  CheckCircle2,
  ListTodo,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay,
  useDndContext
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import taskApi from "../../api/taskApi";
import CustomButton from "../ui/CustomButton";
import CustomCard from "../ui/CustomCard";
import TaskCreateModal from "../task/TaskCreateModal";
import TaskDetailsModal from "../task/TaskDetailsModal";

const SortableTaskItem = ({ task, onTaskClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="mb-3"
    >
      <CustomCard className="p-4 hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 cursor-pointer group">
        {/* Drag Handle */}
        <div className="flex items-start gap-2 mb-2">
          <div 
            {...listeners}
            className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex-1" onClick={() => onTaskClick(task)}>
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
                {task.title}
              </h4>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                {task.priority || "medium"}
              </span>
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
                {task.assignedTo && (
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
                )}

                {task.dueDate && (
                  <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 dark:text-red-400' : ''}`}>
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
          </div>
        </div>
      </CustomCard>
    </div>
  );
};

// Column Component
const KanbanColumn = ({ title, tasks, status, onTaskClick, onCreateTask }) => {
  const getColumnColor = (status) => {
    switch (status) {
      case 'todo':
        return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20';
      case 'in_progress':
        return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20';
      case 'review':
        return 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20';
      case 'completed':
        return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20';
      default:
        return 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800';
    }
  };

  const getColumnIcon = (status) => {
    switch (status) {
      case 'todo':
        return <ListTodo className="w-5 h-5" />;
      case 'in_progress':
        return <Loader2 className="w-5 h-5 animate-spin" />;
      case 'review':
        return <AlertCircle className="w-5 h-5" />;
      case 'completed':
        return <CheckCircle2 className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const taskIds = tasks.map(task => task._id);

  return (
    <div className="flex-1 min-w-[280px] max-w-[320px]">
      <div className={`rounded-xl border-2 p-4 h-full ${getColumnColor(status)}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {getColumnIcon(status)}
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">
              {title}
            </h3>
          </div>
          <span className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm px-3 py-1 rounded-full font-semibold shadow-sm">
            {tasks.length}
          </span>
        </div>

        <div className="space-y-3 min-h-[300px]" id={status}>
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <SortableTaskItem key={task._id} task={task} onTaskClick={onTaskClick} />
            ))}
          </SortableContext>
        </div>

        <CustomButton
          onClick={() => onCreateTask(status)}
          variant="outline"
          size="sm"
          className="w-full mt-6 flex items-center gap-2 py-3 text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </CustomButton>
      </div>
    </div>
  );
};

const KanbanBoard = ({ projectId, selectedBoardId }) => {

  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState("todo");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [activeId, setActiveId] = useState(null);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );


  // Fetch all Kanban boards
  const {
    data: kanbanData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["allKanbanBoards", searchQuery, statusFilter, priorityFilter],
    queryFn: async () => {

      try {
        const response = await taskApi.getAllKanbanBoards({
          search: searchQuery,
          status: statusFilter,
          priority: priorityFilter,
        });

        return response;
      } catch (err) {
        console.error('❌ Error fetching kanban boards:', err);
        console.error('Error response:', err.response?.data);
        throw err;
      }
    },
    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const kanbanBoards = kanbanData?.data?.kanbanBoards || [];

  // Debug logging

  // Set the selected board when data is loaded
  useEffect(() => {

    if (kanbanBoards.length > 0) {
      if (selectedBoardId) {
        const board = kanbanBoards.find(
          (board) => board._id === selectedBoardId
        );
        setSelectedBoard(board || kanbanBoards[0]);
      } else {
        setSelectedBoard(kanbanBoards[0]);
      }
    }
  }, [kanbanBoards, selectedBoardId]);

  // Move task mutation
  const moveTaskMutation = useMutation({
    mutationFn: ({ taskId, status }) => taskApi.moveTask(taskId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(["allKanbanBoards"]);
      toast.success("Task moved successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to move task");
    },
  });

  // Handle drag end
  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id;

    // Find the task
    const task = selectedBoard?.columns?.todo?.find(t => t._id === taskId) ||
                 selectedBoard?.columns?.in_progress?.find(t => t._id === taskId) ||
                 selectedBoard?.columns?.review?.find(t => t._id === taskId) ||
                 selectedBoard?.columns?.completed?.find(t => t._id === taskId);

    if (!task) return;

    // Don't do anything if status hasn't changed
    if (task.status === newStatus) return;

    // Update task status
    moveTaskMutation.mutate({ taskId, status: newStatus });
  };

  // Handle drag start
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: ({ projectId, data }) => taskApi.createTask(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["allKanbanBoards"]);
      toast.success("Task created successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create task");
    },
  });

  // Get tasks from the selected board
  const tasks = selectedBoard
    ? [
        ...(selectedBoard.columns?.todo || []),
        ...(selectedBoard.columns?.in_progress || []),
        ...(selectedBoard.columns?.review || []),
        ...(selectedBoard.columns?.completed || []),
      ]
    : [];

  // Group tasks by status
  const tasksByStatus = {
    todo: selectedBoard?.columns?.todo || [],
    in_progress: selectedBoard?.columns?.in_progress || [],
    review: selectedBoard?.columns?.review || [],
    completed: selectedBoard?.columns?.completed || [],
  };

  // Debug selected board and tasks

  const columns = [
    { id: "todo", title: "To Do", status: "todo" },
    { id: "in_progress", title: "In Progress", status: "in_progress" },
    { id: "review", title: "Review", status: "review" },
    { id: "completed", title: "Done", status: "completed" },
  ];


  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  const handleCreateTask = (status) => {
    setSelectedColumn(status);
    setShowCreateModal(true);
  };

  const handleBoardSelect = (boardId) => {
    const board = kanbanBoards.find((board) => board._id === boardId);
    setSelectedBoard(board);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Reset search when query changes
      if (searchQuery || statusFilter || priorityFilter) {
        // Search/filter changed, could trigger refetch here if needed
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, statusFilter, priorityFilter]);

  if (isLoading) {
    return (
      <div className="flex gap-6 p-6">
        {columns.map((column) => (
          <div key={column.id} className="flex-1">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-96 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-20 bg-gray-200 dark:bg-gray-700 rounded"
                  ></div>
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
        <p className="text-red-600 dark:text-red-400">
          Error loading Kanban boards: {error.message}
        </p>
        <CustomButton onClick={() => refetch()} className="mt-4">
          Retry
        </CustomButton>
      </div>
    );
  }

  if (kanbanBoards.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            📋 No Kanban Boards Found
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            You don't have any projects with tasks yet. Create a project and add
            some tasks to see them here.
          </p>
        </div>

        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No tasks to display
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Start by creating a project and adding some tasks.
          </p>
          <CustomButton onClick={() => refetch()} className="mt-4">
            Refresh Data
          </CustomButton>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header with Board Selection and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Kanban Board
                </h2>
                {selectedBoard && (
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    {selectedBoard.name} - {selectedBoard.description}
                  </p>
                )}
              </div>
              <CustomButton
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-6 py-3 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                size="lg"
              >
                <Plus className="w-5 h-5" />
                Create Task
              </CustomButton>
            </div>

              {/* Board Selector */}
              {kanbanBoards.length > 1 && (
                <div className="flex gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select Board:
                  </label>
                  <select
                    value={selectedBoard?._id || ""}
                    onChange={(e) => handleBoardSelect(e.target.value)}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    {kanbanBoards.map((board) => (
                      <option key={board._id} value={board._id}>
                        {board.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full"
                  />
                </div>
                <CustomButton
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </CustomButton>
              </div>

              {/* Filters Panel */}
              {showFilters && (
                <CustomCard className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Task Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">All</option>
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Task Priority
                    </label>
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">All</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </CustomCard>
              )}
            </div>
          </div>

          {/* Kanban Board */}
          {selectedBoard && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="flex gap-6 overflow-x-auto pb-4">
                  {columns.map((column) => (
                    <KanbanColumn
                      key={column.id}
                      title={column.title}
                      tasks={tasksByStatus[column.status]}
                      status={column.status}
                      onTaskClick={handleTaskClick}
                      onCreateTask={handleCreateTask}
                    />
                  ))}
                </div>
                <DragOverlay>
                  {activeId ? (
                    <div className="transform rotate-3 opacity-90">
                      <CustomCard className="p-4 border-2 border-indigo-500 shadow-2xl">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-4 h-4 bg-indigo-500 rounded"></div>
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                            {tasks.find(t => t._id === activeId)?.title || 'Task'}
                          </h4>
                        </div>
                      </CustomCard>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          )}
        </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <TaskCreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          projectId={projectId || selectedBoard?._id}
          projectMembers={[]}
          onCreateTask={(taskData) => {
            createTaskMutation.mutate({
              projectId: projectId || selectedBoard?._id,
              data: taskData
            });
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Task Details Modal */}
      {showTaskDetails && selectedTask && (
        <TaskDetailsModal
          isOpen={showTaskDetails}
          onClose={() => {
            setShowTaskDetails(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
          onTaskUpdated={() => {
            refetch();
            setShowTaskDetails(false);
            setSelectedTask(null);
          }}
          onTaskDeleted={() => {
            refetch();
            setShowTaskDetails(false);
            setSelectedTask(null);
          }}
        />
      )}
    </>
  );
};

export default KanbanBoard;
