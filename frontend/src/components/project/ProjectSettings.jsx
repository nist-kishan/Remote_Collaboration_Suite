import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Bell, UserCheck, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { projectApi } from '../../api/projectApi';
import CustomButton from '../ui/CustomButton';
import CustomCard from '../ui/CustomCard';

const ProjectSettings = ({ project, canChangeSettings = true }) => {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    allowSelfAssignment: false,
    requireApproval: true,
    notifications: true
  });

  useEffect(() => {
    if (project?.settings) {
      setSettings({
        allowSelfAssignment: project.settings.allowSelfAssignment || false,
        requireApproval: project.settings.requireApproval !== false,
        notifications: project.settings.notifications !== false
      });
    }
  }, [project]);

  const updateSettingsMutation = useMutation({
    mutationFn: (data) => projectApi.updateProject(project._id, { settings: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(['project', project._id]);
      toast.success('Settings updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    }
  });

  const handleToggle = (setting) => {
    if (!canChangeSettings) {
      toast.error('You don\'t have permission to change settings');
      return;
    }
    const newSettings = { ...settings, [setting]: !settings[setting] };
    setSettings(newSettings);
    updateSettingsMutation.mutate(newSettings);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Project Settings
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage project behavior and preferences
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Allow Self Assignment */}
        <CustomCard className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Self Assignment
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Allow members to assign tasks to themselves
                  </p>
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowSelfAssignment}
                onChange={() => handleToggle('allowSelfAssignment')}
                className="sr-only peer"
                disabled={updateSettingsMutation.isPending || !canChangeSettings}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </CustomCard>

        {/* Require Approval */}
        <CustomCard className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Require Approval
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Require approval for task completion
                  </p>
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireApproval}
                onChange={() => handleToggle('requireApproval')}
                className="sr-only peer"
                disabled={updateSettingsMutation.isPending || !canChangeSettings}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </CustomCard>

        {/* Notifications */}
        <CustomCard className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Notifications
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Enable project notifications
                  </p>
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={() => handleToggle('notifications')}
                className="sr-only peer"
                disabled={updateSettingsMutation.isPending || !canChangeSettings}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </CustomCard>

        {/* Project Status */}
        <CustomCard className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                Project Status
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {project?.status || 'planning'}
              </p>
            </div>
          </div>
        </CustomCard>
      </div>
    </div>
  );
};

export default ProjectSettings;

