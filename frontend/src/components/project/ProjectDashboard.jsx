import React from 'react';
import { Calendar, Clock, DollarSign, Tag, Users, CheckCircle, BarChart3 } from 'lucide-react';
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
          <CustomCard className="p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Project Details
              </h3>
            </div>
            
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </h4>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {project.description || 'No description provided'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Start Date
                  </h4>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {formatDate(project.startDate)}
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    End Date
                  </h4>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {formatDate(project.endDate)}
                  </p>
                </div>
              </div>

              {project.budget && (
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                    Budget
                  </h4>
                  <p className="text-gray-900 dark:text-white font-medium text-lg">
                    {project.budget.currency} {project.budget.allocated?.toLocaleString() || '0'}
                    {project.budget.spent > 0 && (
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                        (Spent: {project.budget.currency} {project.budget.spent.toLocaleString()})
                      </span>
                    )}
                  </p>
                </div>
              )}

              {project.tags && project.tags.length > 0 && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium"
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
          <CustomCard className="p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-md">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Progress
              </h3>
            </div>
            
            <div className="space-y-6">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Overall Progress
                  </span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 shadow-inner">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500 shadow-lg"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Tasks Completed</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {project.completedTaskCount || 0} / {project.taskCount || 0}
                  </span>
                </div>
                
                <div className={`flex justify-between items-center p-3 rounded-lg ${
                  daysRemaining < 0 ? 'bg-red-50 dark:bg-red-900/20' : 
                  daysRemaining < 7 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 
                  'bg-green-50 dark:bg-green-900/20'
                }`}>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Days Remaining</span>
                  <span className={`font-bold ${
                    daysRemaining < 0 ? 'text-red-600 dark:text-red-400' : 
                    daysRemaining < 7 ? 'text-yellow-600 dark:text-yellow-400' : 
                    'text-green-600 dark:text-green-400'
                  }`}>
                    {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days`}
                  </span>
                </div>
              </div>
            </div>
          </CustomCard>

          <CustomCard className="p-6 mt-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Team Members
              </h3>
            </div>
            
            <div className="space-y-3">
              {project.team?.filter(member => 
                ['hr', 'owner', 'mr'].includes(member.role.toLowerCase())
              ).slice(0, 5).map((member) => (
                <div key={member.user._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  {member.user.avatar ? (
                    <img 
                      src={member.user.avatar} 
                      alt={member.user.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-sm font-semibold text-white">
                        {member.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {member.user.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                      {member.role}
                    </p>
                  </div>
                </div>
              ))}
              
              {project.team?.filter(member => 
                ['hr', 'owner', 'mr'].includes(member.role.toLowerCase())
              ).length > 5 && (
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center pt-2">
                  +{project.team.filter(member => 
                    ['hr', 'owner', 'mr'].includes(member.role.toLowerCase())
                  ).length - 5} more members
                </p>
              )}
            </div>
          </CustomCard>
        </div>
      </div>

      {/* Recent Activity */}
      <CustomCard className="p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Recent Activity
          </h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-md">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Project created
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {formatDate(project.createdAt)}
              </p>
            </div>
          </div>

          {project.updatedAt !== project.createdAt && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Project updated
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
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
