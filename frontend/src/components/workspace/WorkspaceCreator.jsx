import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Users, Building } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { workspaceApi } from '../../api/workspaceApi';
import CustomButton from '../ui/CustomButton';
import CustomModal from '../ui/CustomModal';

const CreateWorkspaceModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const createWorkspaceMutation = useMutation({
    mutationFn: workspaceApi.createWorkspace,
    onSuccess: (response) => {
      queryClient.invalidateQueries(['workspaces']);
      toast.success('Workspace created successfully');
      onClose();
      setFormData({ name: '', description: '' });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create workspace');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Workspace name is required');
      return;
    }

    createWorkspaceMutation.mutate(formData);
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!isOpen) return null;

  return (
    <CustomModal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create Workspace
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Start collaborating with your team
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Workspace Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter workspace name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your workspace (optional)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  What's a workspace?
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  A workspace is where you and your team can collaborate on projects, 
                  manage tasks, and organize your work together.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <CustomButton
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={createWorkspaceMutation.isLoading}
            >
              Cancel
            </CustomButton>
            <CustomButton
              type="submit"
              className="flex-1"
              loading={createWorkspaceMutation.isLoading}
            >
              Create Workspace
            </CustomButton>
          </div>
        </form>
      </div>
    </CustomModal>
  );
};

export default CreateWorkspaceModal;
