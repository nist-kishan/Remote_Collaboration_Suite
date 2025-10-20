import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, User, Calendar, Clock, Tag, MessageSquare, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { taskApi } from '../../api/taskApi';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const TaskDetailsModal = ({ isOpen, onClose, task, projectId }) => {
  const queryClient = useQueryClient();
  const [showAddComment, setShowAddComment] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showTimeLog, setShowTimeLog] = useState(false);
  const [timeLog, setTimeLog] = useState({ hours: '', description: '' });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: (data) => taskApi.addTaskComment(task._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['project-tasks', projectId]);
      toast.success('Comment added successfully');
      setNewComment('');
      setShowAddComment(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    }
  });

  // Log time mutation
  const logTimeMutation = useMutation({
    mutationFn: (data) => taskApi.logTaskTime(task._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['project-tasks', projectId]);
      toast.success('Time logged successfully');
      setTimeLog({ hours: '', description: '' });
      setShowTimeLog(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to log time');
    }
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    addCommentMutation.mutate({ content: newComment.trim() });
  };

  const handleLogTime = (e) => {
    e.preventDefault();
    if (!timeLog.hours || parseFloat(timeLog.hours) <= 0) {
      toast.error('Please enter valid hours');
      return;
    }
    logTimeMutation.mutate({
      hours: parseFloat(timeLog.hours),
      description: timeLog.description
    });
  };

  if (!isOpen || !task) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
              <Tag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Task Details
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View and manage task information
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Task Header */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {task.title}
              </h3>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                  {task.status.replace('_', ' ').toUpperCase()}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority.toUpperCase()}
                </span>
              </div>
            </div>

            {task.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {task.description}
              </p>
            )}
          </div>

          {/* Task Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Assigned to</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {task.assignedTo?.name || 'Unassigned'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Created by</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {task.createdBy?.name}
                </p>
              </div>
            </div>

            {task.dueDate && (
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Due date</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {task.estimatedHours && (
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Estimated hours</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {task.estimatedHours}h
                  </p>
                </div>
              </div>
            )}

            {task.actualHours > 0 && (
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Actual hours</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {task.actualHours}h
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Comments ({task.comments?.length || 0})
              </h4>
              <Button
                size="sm"
                onClick={() => setShowAddComment(true)}
                className="flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add Comment
              </Button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {task.comments?.map((comment, index) => (
                <div key={index} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                      {comment.user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {comment.user?.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}

              {(!task.comments || task.comments.length === 0) && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No comments yet
                </p>
              )}
            </div>
          </div>

          {/* Time Logs */}
          {task.timeLogs && task.timeLogs.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Time Logs ({task.timeLogs.length})
                </h4>
                <Button
                  size="sm"
                  onClick={() => setShowTimeLog(true)}
                  className="flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Log Time
                </Button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {task.timeLogs.map((log, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {log.hours}h - {log.user?.name}
                      </p>
                      {log.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {log.description}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(log.date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Comment Form */}
          {showAddComment && (
            <form onSubmit={handleAddComment} className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  size="sm"
                  loading={addCommentMutation.isLoading}
                >
                  Add Comment
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddComment(false);
                    setNewComment('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Log Time Form */}
          {showTimeLog && (
            <form onSubmit={handleLogTime} className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={timeLog.hours}
                    onChange={(e) => setTimeLog(prev => ({ ...prev, hours: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={timeLog.description}
                    onChange={(e) => setTimeLog(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="What did you work on?"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  size="sm"
                  loading={logTimeMutation.isLoading}
                >
                  Log Time
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowTimeLog(false);
                    setTimeLog({ hours: '', description: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default TaskDetailsModal;
