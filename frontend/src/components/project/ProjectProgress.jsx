import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TrendingUp, Target } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { projectApi } from '../../api/projectApi';
import CustomButton from '../ui/CustomButton';
import CustomCard from '../ui/CustomCard';

const ProjectProgress = ({ project }) => {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(project?.progress || 0);
  const [isEditing, setIsEditing] = useState(false);

  const updateProgressMutation = useMutation({
    mutationFn: (data) => projectApi.updateProject(project._id, { progress: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(['project', project._id]);
      toast.success('Progress updated successfully');
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update progress');
    }
  });

  const handleProgressChange = (e) => {
    const value = parseInt(e.target.value);
    if (value >= 0 && value <= 100) {
      setProgress(value);
    }
  };

  const handleSave = () => {
    updateProgressMutation.mutate(progress);
  };

  const handleCancel = () => {
    setProgress(project?.progress || 0);
    setIsEditing(false);
  };

  const getProgressColor = (value) => {
    if (value < 30) return 'bg-red-500';
    if (value < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <CustomCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Project Progress
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Track and update project completion
            </p>
          </div>
        </div>
        {!isEditing && (
          <CustomButton
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </CustomButton>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Progress: {progress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleProgressChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
          <div className="flex gap-2">
            <CustomButton
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </CustomButton>
            <CustomButton
              onClick={handleSave}
              className="flex-1"
              disabled={updateProgressMutation.isPending}
            >
              {updateProgressMutation.isPending ? 'Saving...' : 'Save'}
            </CustomButton>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Completion
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700">
              <div
                className={`${getProgressColor(progress)} h-4 rounded-full transition-all duration-300 flex items-center justify-end pr-2`}
                style={{ width: `${progress}%` }}
              >
                {progress > 10 && (
                  <Target className="w-3 h-3 text-white" />
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tasks</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {project?.taskCount || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {project?.completedTaskCount || 0}
              </p>
            </div>
          </div>
        </div>
      )}
    </CustomCard>
  );
};

export default ProjectProgress;

