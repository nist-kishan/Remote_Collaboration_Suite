import React from 'react';
import { Calendar, Clock, DollarSign, Tag, Users, CheckCircle } from 'lucide-react';
import CustomCard from '../ui/CustomCard';

const ProjectOverview = ({ project }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateProgress = () => {
    const total = project.taskCount || 0;
    const completed = project.completedTaskCount || 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getDaysRemaining = () => {
    const endDate = new Date(project.endDate);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const progress = calculateProgress();
  const daysRemaining = getDaysRemaining();

  return (
    <div className="space-y-6">
      {/* Project Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CustomCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Project Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {project.description || 'No description provided'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Start Date
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {formatDate(project.startDate)}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    End Date
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {formatDate(project.endDate)}
                  </p>
                </div>
              </div>

              {project.budget && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Budget
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {project.budget.currency} {project.budget.allocated?.toLocaleString() || '0'}
                    {project.budget.spent > 0 && (
                      <span className="text-sm text-gray-500 ml-2">
                        (Spent: {project.budget.currency} {project.budget.spent.toLocaleString()})
                      </span>
                    )}
                  </p>
                </div>
              )}

              {project.tags && project.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag, index) => (
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
            </div>
          </CustomCard>
        </div>

        <div>
          <CustomCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Progress
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Overall Progress
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tasks Completed</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {project.completedTaskCount || 0} / {project.taskCount || 0}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Days Remaining</span>
                  <span className={`font-medium ${daysRemaining < 0 ? 'text-red-600' : daysRemaining < 7 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days`}
                  </span>
                </div>
              </div>
            </div>
          </CustomCard>

          <CustomCard className="p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Team Members
            </h3>
            
            <div className="space-y-3">
              {project.team?.slice(0, 5).map((member) => (
                <div key={member.user._id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                      {member.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {member.user.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {member.role}
                    </p>
                  </div>
                </div>
              ))}
              
              {project.team?.length > 5 && (
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  +{project.team.length - 5} more members
                </p>
              )}
            </div>
          </CustomCard>
        </div>
      </div>

      {/* Recent Activity */}
      <CustomCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900 dark:text-white">
                Project created
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {formatDate(project.createdAt)}
              </p>
            </div>
          </div>

          {project.updatedAt !== project.createdAt && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-white">
                  Project updated
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {formatDate(project.updatedAt)}
                </p>
              </div>
            </div>
          )}
        </div>
      </CustomCard>
    </div>
  );
};

export default ProjectOverview;
