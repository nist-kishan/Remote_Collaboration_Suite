import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { workspaceApi } from '../../api/workspaceApi';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const EditWorkspaceModal = ({ isOpen, onClose, workspace }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    settings: {
      allowMemberInvites: true,
      allowProjectCreation: true,
      requireApprovalForJoining: false
    }
  });

  // Update form data when workspace changes
  useEffect(() => {
    if (workspace) {
      setFormData({
        name: workspace.name || '',
        description: workspace.description || '',
        settings: {
          allowMemberInvites: workspace.settings?.allowMemberInvites ?? true,
          allowProjectCreation: workspace.settings?.allowProjectCreation ?? true,
          requireApprovalForJoining: workspace.settings?.requireApprovalForJoining ?? false
        }
      });
    }
  }, [workspace]);

  const updateWorkspaceMutation = useMutation({
    mutationFn: (data) => workspaceApi.updateWorkspace(workspace._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspaces']);
      toast.success('Workspace updated successfully');
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update workspace');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Workspace name is required');
      return;
    }

    updateWorkspaceMutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('settings.')) {
      const settingName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingName]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  if (!isOpen || !workspace) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit Workspace
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Update workspace settings and information
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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

          {/* Workspace Settings */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Workspace Settings
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="allowMemberInvites" className="text-sm text-gray-700 dark:text-gray-300">
                    Allow member invites
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Members can invite others to the workspace
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="allowMemberInvites"
                  name="settings.allowMemberInvites"
                  checked={formData.settings.allowMemberInvites}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="allowProjectCreation" className="text-sm text-gray-700 dark:text-gray-300">
                    Allow project creation
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Members can create new projects
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="allowProjectCreation"
                  name="settings.allowProjectCreation"
                  checked={formData.settings.allowProjectCreation}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="requireApprovalForJoining" className="text-sm text-gray-700 dark:text-gray-300">
                    Require approval for joining
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    New members need approval to join
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="requireApprovalForJoining"
                  name="settings.requireApprovalForJoining"
                  checked={formData.settings.requireApprovalForJoining}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={updateWorkspaceMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={updateWorkspaceMutation.isLoading}
            >
              Update Workspace
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default EditWorkspaceModal;


