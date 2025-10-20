import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  Clock, 
  MoreVertical, 
  FolderOpen,
  CheckCircle,
  AlertCircle,
  Pause
} from 'lucide-react';
import CustomCard from '../ui/CustomCard';

const ProjectList = ({ projects, isLoading, workspaceId }) => {
  const navigate = useNavigate();

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'planning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'on_hold':
        return <Pause className="w-4 h-4 text-orange-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <FolderOpen className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'planning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'on_hold':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const handleProjectClick = (project) => {
    navigate(`/workspace/${workspaceId}/projects/${project._id}`);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <CustomCard key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
            <div className="flex justify-between">
              <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </CustomCard>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <FolderOpen className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No projects yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Create your first project to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <CustomCard 
          key={project._id} 
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer group"
          onClick={() => handleProjectClick(project)}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(project.status)}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {project.name}
                </h3>
              </div>
              {project.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {project.description}
                </p>
              )}
            </div>
            <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
              {project.status.replace('_', ' ')}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
              {project.priority}
            </span>
          </div>

          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{project.team?.length || 0} members</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{project.progress || 0}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(project.startDate).toLocaleDateString()}
                </span>
              </div>
              <span>
                Due {new Date(project.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          {project.projectManager && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    {project.projectManager.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Managed by {project.projectManager.name}
                </span>
              </div>
            </div>
          )}
        </CustomCard>
      ))}
    </div>
  );
};

export default ProjectList;
