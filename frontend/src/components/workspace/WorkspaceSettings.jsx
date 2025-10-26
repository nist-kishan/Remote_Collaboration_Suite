import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Settings as SettingsIcon, Users, Shield, FileText, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { workspaceApi } from '../../api/workspaceApi';
import CustomButton from '../ui/CustomButton';
import CustomCard from '../ui/CustomCard';
import { useSelector } from 'react-redux';

const WorkspaceSettings = ({ workspace, canManageSettings }) => {
  const queryClient = useQueryClient();
  const currentUser = useSelector((state) => state.auth.user);
  
  // Check if current user is the owner
  const isOwner = workspace?.owner?._id === currentUser?._id;
  
  const [settings, setSettings] = useState({
    allowMemberInvites: workspace?.settings?.allowMemberInvites ?? true,
    requireApproval: workspace?.settings?.requireApproval ?? false,
    maxMembers: workspace?.settings?.maxMembers ?? 50,
    allowPublicProjects: workspace?.settings?.allowPublicProjects ?? false
  });

  const [workspaceInfo, setWorkspaceInfo] = useState({
    name: workspace?.name || '',
    description: workspace?.description || ''
  });

  // Update workspace mutation
  const updateWorkspaceMutation = useMutation({
    mutationFn: (data) => workspaceApi.updateWorkspace(workspace._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspace', workspace._id]);
      toast.success('Workspace settings updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!isOwner) {
      toast.error('Only the workspace owner can change settings');
      return;
    }

    updateWorkspaceMutation.mutate({
      name: workspaceInfo.name,
      description: workspaceInfo.description,
      settings: settings
    });
  };

  const handleSettingChange = (key, value) => {
    if (!isOwner) {
      toast.error('Only the workspace owner can change settings');
      return;
    }
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleInfoChange = (key, value) => {
    if (!isOwner) {
      toast.error('Only the workspace owner can change settings');
      return;
    }
    setWorkspaceInfo(prev => ({ ...prev, [key]: value }));
  };

  if (!isOwner) {
    return (
      <div className="space-y-6">
        <CustomCard className="p-6">
          <div className="text-center py-8">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Settings Restricted
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Only the workspace owner can change workspace settings
            </p>
          </div>
        </CustomCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workspace Information */}
      <CustomCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Workspace Information
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Workspace Name
            </label>
            <input
              type="text"
              value={workspaceInfo.name}
              onChange={(e) => handleInfoChange('name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={workspaceInfo.description}
              onChange={(e) => handleInfoChange('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter workspace description..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <CustomButton
              type="submit"
              disabled={updateWorkspaceMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {updateWorkspaceMutation.isPending ? 'Saving...' : 'Save Changes'}
            </CustomButton>
          </div>
        </form>
      </CustomCard>

      {/* Member Settings */}
      <CustomCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Member Settings
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Allow Member Invites
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Let members invite other users to the workspace
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowMemberInvites}
                onChange={(e) => handleSettingChange('allowMemberInvites', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Require Approval
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Require approval before adding new members
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireApproval}
                onChange={(e) => handleSettingChange('requireApproval', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Maximum Members
            </label>
            <input
              type="number"
              value={settings.maxMembers}
              onChange={(e) => handleSettingChange('maxMembers', parseInt(e.target.value))}
              min={1}
              max={1000}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Set the maximum number of members allowed in this workspace
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <CustomButton
              type="submit"
              disabled={updateWorkspaceMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {updateWorkspaceMutation.isPending ? 'Saving...' : 'Save Changes'}
            </CustomButton>
          </div>
        </form>
      </CustomCard>

      {/* Project Settings */}
      <CustomCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Project Settings
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Allow Public Projects
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Allow members to create public projects
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowPublicProjects}
                onChange={(e) => handleSettingChange('allowPublicProjects', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <CustomButton
              type="submit"
              disabled={updateWorkspaceMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {updateWorkspaceMutation.isPending ? 'Saving...' : 'Save Changes'}
            </CustomButton>
          </div>
        </form>
      </CustomCard>
    </div>
  );
};

export default WorkspaceSettings;

