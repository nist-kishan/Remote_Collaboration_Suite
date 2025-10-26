import { Clock, Calendar, User, AlertCircle, Tag } from 'lucide-react';
import { format } from 'date-fns';

const TaskCard = ({ task, onClick, onDragStart }) => {
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

  const getTypeColor = (type) => {
    switch (type) {
      case 'bug':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'feature':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'improvement':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'documentation':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onClick={() => onClick(task)}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 cursor-move hover:shadow-md transition-shadow"
    >
      {/* Title */}
      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
        {task.title}
      </h3>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <Tag size={12} className="mr-1" />
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}>
          <AlertCircle size={12} className="mr-1" />
          {task.priority}
        </span>
        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${getTypeColor(task.type)}`}>
          {task.type}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
        {/* Assignee */}
        <div className="flex items-center">
          {task.assignedTo?.avatar ? (
            <img
              src={task.assignedTo.avatar}
              alt={task.assignedTo.name}
              className="w-5 h-5 rounded-full mr-1"
            />
          ) : (
            <User size={12} className="mr-1" />
          )}
          <span className="truncate max-w-[80px]">
            {task.assignedTo?.name || 'Unassigned'}
          </span>
        </div>

        {/* Due Date */}
        {task.dueDate && (
          <div className={`flex items-center ${isOverdue ? 'text-red-600 dark:text-red-400' : ''}`}>
            <Calendar size={12} className="mr-1" />
            {format(new Date(task.dueDate), 'MMM d')}
          </div>
        )}
      </div>

      {/* Estimated Hours */}
      {task.estimatedHours && (
        <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
          <Clock size={12} className="mr-1" />
          {task.estimatedHours}h
        </div>
      )}
    </div>
  );
};

export default TaskCard;

