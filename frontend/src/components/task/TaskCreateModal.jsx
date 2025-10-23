import { useState } from 'react';
import { X, Calendar, Clock, Tag, User, AlertCircle } from 'lucide-react';
import CustomModal from '../ui/CustomModal';
import CustomButton from '../ui/CustomButton';
import CustomInput from '../ui/CustomInput';
import CustomTextarea from '../ui/CustomTextarea';
import CustomSelect from '../ui/CustomSelect';

const TaskCreateModal = ({ isOpen, onClose, projectId, projectMembers, onCreateTask }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    type: 'feature',
    estimatedHours: '',
    dueDate: '',
    tags: ''
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (formData.estimatedHours && (formData.estimatedHours < 0 || formData.estimatedHours > 1000)) {
      newErrors.estimatedHours = 'Estimated hours must be between 0 and 1000';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const taskData = {
      title: formData.title,
      description: formData.description || undefined,
      assignedTo: formData.assignedTo || undefined,
      priority: formData.priority,
      type: formData.type,
      estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
      dueDate: formData.dueDate || undefined,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
    };

    onCreateTask(taskData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      assignedTo: '',
      priority: 'medium',
      type: 'feature',
      estimatedHours: '',
      dueDate: '',
      tags: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <CustomModal isOpen={isOpen} onClose={handleClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Create New Task
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <CustomInput
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter task title"
              error={errors.title}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <CustomTextarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter task description"
              rows={4}
            />
          </div>

          {/* Row 1: Assignee & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Assignee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User size={16} className="inline mr-1" />
                Assign To
              </label>
              <CustomSelect
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
              >
                <option value="">Unassigned</option>
                {projectMembers?.map(member => (
                  <option key={member.user._id} value={member.user._id}>
                    {member.user.name}
                  </option>
                ))}
              </CustomSelect>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <AlertCircle size={16} className="inline mr-1" />
                Priority
              </label>
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
            </div>
          </div>

          {/* Row 2: Type & Estimated Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Tag size={16} className="inline mr-1" />
                Type
              </label>
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
            </div>

            {/* Estimated Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock size={16} className="inline mr-1" />
                Estimated Hours
              </label>
              <CustomInput
                name="estimatedHours"
                type="number"
                value={formData.estimatedHours}
                onChange={handleChange}
                placeholder="e.g., 8"
                min="0"
                max="1000"
                error={errors.estimatedHours}
              />
            </div>
          </div>

          {/* Row 3: Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar size={16} className="inline mr-1" />
              Due Date
            </label>
            <CustomInput
              name="dueDate"
              type="datetime-local"
              value={formData.dueDate}
              onChange={handleChange}
            />
          </div>

          {/* Row 4: Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Tag size={16} className="inline mr-1" />
              Tags (comma-separated)
            </label>
            <CustomInput
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g., frontend, bug, urgent"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <CustomButton
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </CustomButton>
            <CustomButton type="submit">
              Create Task
            </CustomButton>
          </div>
        </form>
      </div>
    </CustomModal>
  );
};

export default TaskCreateModal;

