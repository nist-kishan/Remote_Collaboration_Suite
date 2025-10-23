import { useState } from 'react';
import { X, Calendar, Clock, User, AlertCircle, Tag, MessageSquare, Trash2, Save, Edit, FileText } from 'lucide-react';
import { format } from 'date-fns';
import CustomModal from '../ui/CustomModal';
import CustomButton from '../ui/CustomButton';
import CustomInput from '../ui/CustomInput';
import CustomTextarea from '../ui/CustomTextarea';
import CustomSelect from '../ui/CustomSelect';
import { useTask } from '../../hook/useTask';

const TaskDetailsModal = ({ isOpen, onClose, task, onTaskUpdated, onTaskDeleted }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assignedTo: task?.assignedTo?._id || task?.assignedTo || '',
    priority: task?.priority || 'medium',
    type: task?.type || 'feature',
    estimatedHours: task?.estimatedHours || '',
    dueDate: task?.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm") : '',
    tags: task?.tags?.join(', ') || ''
  });

  const {
    updateTaskMutation,
    deleteTaskMutation,
    addTaskCommentMutation,
    logTaskTimeMutation
  } = useTask();

  const [commentText, setCommentText] = useState('');
  const [timeLogData, setTimeLogData] = useState({ hours: '', description: '' });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      title: task?.title || '',
      description: task?.description || '',
      assignedTo: task?.assignedTo?._id || task?.assignedTo || '',
      priority: task?.priority || 'medium',
      type: task?.type || 'feature',
      estimatedHours: task?.estimatedHours || '',
      dueDate: task?.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm") : '',
      tags: task?.tags?.join(', ') || ''
    });
  };

  const handleSave = () => {
    const updatedData = {
      title: formData.title,
      description: formData.description || undefined,
      assignedTo: formData.assignedTo || undefined,
      priority: formData.priority,
      type: formData.type,
      estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
      dueDate: formData.dueDate || undefined,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
    };

    updateTaskMutation.mutate({
      taskId: task._id,
      data: updatedData
    });
  };

  const handleDelete = () => {
    deleteTaskMutation.mutate(task._id);
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    
    addTaskCommentMutation.mutate({
      taskId: task._id,
      data: { content: commentText.trim() }
    });
    
    setCommentText('');
  };

  const handleLogTime = () => {
    if (!timeLogData.hours || parseFloat(timeLogData.hours) <= 0) return;
    
    logTaskTimeMutation.mutate({
      taskId: task._id,
      data: {
        hours: parseFloat(timeLogData.hours),
        description: timeLogData.description || ''
      }
    });
    
    setTimeLogData({ hours: '', description: '' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (!task) return null;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <CustomModal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Task' : 'Task Details'}
          </h2>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <CustomButton
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                >
                  <Edit size={16} className="mr-1" />
                  Edit
                </CustomButton>
                <CustomButton
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 size={16} className="mr-1" />
                  Delete
                </CustomButton>
              </>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            {isEditing ? (
              <CustomInput
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter task title"
              />
            ) : (
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {task.title}
              </h3>
            )}
          </div>

          {/* Description */}
          <div>
            {isEditing ? (
              <CustomTextarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter task description"
                rows={4}
              />
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                {task.description || 'No description provided'}
              </p>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Assignee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User size={16} className="inline mr-1" />
                Assignee
              </label>
              {isEditing ? (
                <CustomSelect
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                >
                  <option value="">Unassigned</option>
                  {/* Add project members here */}
                </CustomSelect>
              ) : (
                <div className="flex items-center gap-2">
                  {task.assignedTo?.avatar ? (
                    <img src={task.assignedTo.avatar} alt={task.assignedTo.name} className="w-8 h-8 rounded-full" />
                  ) : (
                    <User size={16} className="text-gray-400" />
                  )}
                  <span className="text-gray-900 dark:text-white">
                    {task.assignedTo?.name || 'Unassigned'}
                  </span>
                </div>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <AlertCircle size={16} className="inline mr-1" />
                Priority
              </label>
              {isEditing ? (
                <CustomSelect
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </CustomSelect>
              ) : (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              )}
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Tag size={16} className="inline mr-1" />
                Type
              </label>
              {isEditing ? (
                <CustomSelect
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="feature">Feature</option>
                  <option value="bug">Bug</option>
                  <option value="improvement">Improvement</option>
                  <option value="documentation">Documentation</option>
                  <option value="other">Other</option>
                </CustomSelect>
              ) : (
                <span className="text-gray-900 dark:text-white">{task.type}</span>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar size={16} className="inline mr-1" />
                Due Date
              </label>
              {isEditing ? (
                <CustomInput
                  name="dueDate"
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={handleChange}
                />
              ) : (
                <div className={isOverdue ? 'text-red-600 dark:text-red-400' : ''}>
                  {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy h:mm a') : 'No due date'}
                </div>
              )}
            </div>

            {/* Estimated Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock size={16} className="inline mr-1" />
                Estimated Hours
              </label>
              {isEditing ? (
                <CustomInput
                  name="estimatedHours"
                  type="number"
                  value={formData.estimatedHours}
                  onChange={handleChange}
                  min="0"
                />
              ) : (
                <span className="text-gray-900 dark:text-white">
                  {task.estimatedHours || 'Not set'}
                </span>
              )}
            </div>

            {/* Actual Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock size={16} className="inline mr-1" />
                Actual Hours
              </label>
              <span className="text-gray-900 dark:text-white">
                {task.actualHours || 0}
              </span>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Tag size={16} className="inline mr-1" />
              Tags
            </label>
            {isEditing ? (
              <CustomInput
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="Comma-separated tags"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {task.tags && task.tags.length > 0 ? (
                  task.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">No tags</span>
                )}
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <MessageSquare size={16} className="mr-2" />
              Comments ({task.comments?.length || 0})
            </h4>
            
            {/* Add Comment */}
            <div className="mb-4">
              <CustomTextarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
              />
              <CustomButton
                onClick={handleAddComment}
                className="mt-2"
                size="sm"
                disabled={!commentText.trim()}
              >
                Add Comment
              </CustomButton>
            </div>

            {/* Comments List */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {task.comments && task.comments.length > 0 ? (
                task.comments.map((comment, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      {comment.user?.avatar ? (
                        <img src={comment.user.avatar} alt={comment.user.name} className="w-6 h-6 rounded-full" />
                      ) : (
                        <User size={16} className="text-gray-400 mt-1" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-gray-900 dark:text-white">
                            {comment.user?.name || 'Unknown'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No comments yet
                </p>
              )}
            </div>
          </div>

          {/* Time Log Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <Clock size={16} className="mr-2" />
              Time Log
            </h4>
            
            {/* Add Time Log */}
            <div className="mb-4">
              <div className="grid grid-cols-2 gap-2 mb-2">
                <CustomInput
                  type="number"
                  value={timeLogData.hours}
                  onChange={(e) => setTimeLogData({ ...timeLogData, hours: e.target.value })}
                  placeholder="Hours"
                  min="0"
                />
              </div>
              <CustomTextarea
                value={timeLogData.description}
                onChange={(e) => setTimeLogData({ ...timeLogData, description: e.target.value })}
                placeholder="Description (optional)"
                rows={2}
              />
              <CustomButton
                onClick={handleLogTime}
                className="mt-2"
                size="sm"
                disabled={!timeLogData.hours || parseFloat(timeLogData.hours) <= 0}
              >
                Log Time
              </CustomButton>
            </div>

            {/* Time Logs List */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {task.timeLogs && task.timeLogs.length > 0 ? (
                task.timeLogs.map((log, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900 dark:text-white">
                        {log.hours}h
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {format(new Date(log.date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    {log.description && (
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {log.description}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No time logged yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        {isEditing && (
          <div className="sticky bottom-0 bg-white dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
            <CustomButton variant="outline" onClick={handleCancel}>
              Cancel
            </CustomButton>
            <CustomButton onClick={handleSave}>
              <Save size={16} className="mr-1" />
              Save Changes
            </CustomButton>
          </div>
        )}
      </div>
    </CustomModal>
  );
};

export default TaskDetailsModal;

