import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, TrendingUp, PieChart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { projectApi } from '../../api/projectApi';
import CustomButton from '../ui/CustomButton';
import CustomCard from '../ui/CustomCard';

const ProjectBudget = ({ project }) => {
  const queryClient = useQueryClient();
  const [spentAmount, setSpentAmount] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const budget = project?.budget || { allocated: 0, spent: 0, currency: 'USD' };
  const remaining = budget.allocated - budget.spent;
  const spentPercentage = budget.allocated > 0 ? (budget.spent / budget.allocated) * 100 : 0;

  const updateBudgetMutation = useMutation({
    mutationFn: (data) => projectApi.updateProject(project._id, { budget: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(['project', project._id]);
      toast.success('Budget updated successfully');
      setIsEditing(false);
      setSpentAmount('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update budget');
    }
  });

  const handleUpdateSpent = () => {
    const newSpent = parseFloat(spentAmount);
    if (isNaN(newSpent) || newSpent < 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (newSpent > budget.allocated) {
      toast.error('Spent amount cannot exceed allocated budget');
      return;
    }

    updateBudgetMutation.mutate({
      ...budget,
      spent: newSpent
    });
  };

  const getSpentColor = (percentage) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <CustomCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Budget Management
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Track project spending
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Budget Overview */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Allocated</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {budget.currency} {budget.allocated.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Spent</p>
            <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
              {budget.currency} {budget.spent.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Remaining</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {budget.currency} {remaining.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Budget Usage
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {spentPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700">
            <div
              className={`${getSpentColor(spentPercentage)} h-4 rounded-full transition-all duration-300 flex items-center justify-end pr-2`}
              style={{ width: `${Math.min(spentPercentage, 100)}%` }}
            >
              {spentPercentage > 10 && (
                <PieChart className="w-3 h-3 text-white" />
              )}
            </div>
          </div>
        </div>

        {/* Update Spent Amount */}
        {!isEditing ? (
          <CustomButton
            variant="outline"
            className="w-full"
            onClick={() => setIsEditing(true)}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Update Spent Amount
          </CustomButton>
        ) : (
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Spent Amount ({budget.currency})
              </label>
              <input
                type="number"
                value={spentAmount}
                onChange={(e) => setSpentAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter spent amount"
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex gap-2">
              <CustomButton
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setSpentAmount('');
                }}
                className="flex-1"
              >
                Cancel
              </CustomButton>
              <CustomButton
                onClick={handleUpdateSpent}
                className="flex-1"
                disabled={updateBudgetMutation.isPending}
              >
                {updateBudgetMutation.isPending ? 'Updating...' : 'Update'}
              </CustomButton>
            </div>
          </div>
        )}
      </div>
    </CustomCard>
  );
};

export default ProjectBudget;

