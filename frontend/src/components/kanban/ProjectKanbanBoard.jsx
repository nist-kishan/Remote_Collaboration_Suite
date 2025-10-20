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
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { taskApi } from "../../api/taskApi";
import CustomButton from "../ui/CustomButton";
import CustomCard from "../ui/CustomCard";

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onTaskClick(task)}
      className="cursor-pointer"
    >
      <CustomCard className="p-4 mb-3 hover:shadow-md transition-shadow">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
              {task.title}
            </h4>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                task.priority
              )}`}
            >
              {task.priority}
            </span>
          </div>

          {task.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-3">
              {task.assignedTo && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{task.assignedTo.name}</span>
                </div>
              )}

              {task.dueDate && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(task.dueDate)}</span>
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

              {task.tags && task.tags.length > 0 && (
                <div className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span>{task.tags.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CustomCard>
    </div>
  );
};

// Column Component
const KanbanColumn = ({ title, tasks, status, onTaskClick, onCreateTask }) => {
  return (
    <div className="flex-1 min-w-0">
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>

        <div className="space-y-2 min-h-[200px]">
          {tasks.map((task) => (
            <div
              key={task._id}
              onClick={() => onTaskClick(task)}
              className="cursor-pointer"
            >
              <CustomCard className="p-4 mb-3 hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      {task.title}
                    </h4>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {task.priority || "medium"}
                    </span>
                  </div>

                  {task.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-3">
                      {task.assignedTo && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{task.assignedTo.name}</span>
                        </div>
                      )}

                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CustomCard>
            </div>
          ))}
        </div>

        <CustomButton
          onClick={() => onCreateTask(status)}
          variant="outline"
          size="sm"
          className="w-full mt-4 flex items-center gap-2"
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
  const [setSelectedTask] = useState(null);
  const [setSelectedColumn] = useState("todo");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState(null);


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
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to move task");
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

        {/* Debug Info Panel */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Debug Info:
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Loading: {isLoading ? "Yes" : "No"} | Error: {error ? "Yes" : "No"}{" "}
            | Kanban Boards Count: {kanbanBoards.length}
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
    <div className="p-6">
      {/* Debug Info Panel */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          KanbanBoard Debug Info:
        </h4>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Loading: {isLoading ? "Yes" : "No"} | Error: {error ? "Yes" : "No"} |
          Kanban Boards Count: {kanbanBoards.length} | Selected Board:{" "}
          {selectedBoard?.name || "None"} | Total Tasks: {tasks.length}
        </p>
        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
          <strong>Raw kanbanData:</strong>
          <pre className="whitespace-pre-wrap overflow-auto max-h-32">
            {JSON.stringify(kanbanData, null, 2)}
          </pre>
        </div>
        <div className="mt-2 space-y-2">
          <CustomButton
            onClick={() => {
              refetch();
            }}
            variant="outline"
            size="sm"
          >
            Force Refetch
          </CustomButton>
        </div>
      </div>

      {/* Header with Board Selection and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Kanban Board
            </h2>
            {selectedBoard && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedBoard.name} - {selectedBoard.description}
              </p>
            )}
          </div>
          <CustomButton
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
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

      {/* Kanban Board */}
      {selectedBoard && (
        <div className="flex gap-6 overflow-x-auto">
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
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          projectId={projectId}
          onTaskCreated={(newTask) => {
            refetch();
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
    </div>
  );
};

export default KanbanBoard;
