import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { 
  Plus, 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Users,
  FolderOpen,
  Clock,
  AlertCircle,
  CheckCircle,
  PauseCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { projectApi } from '../../api/projectApi';
import CustomButton from '../ui/CustomButton';
import CustomCard from '../ui/CustomCard';

const AllProjectsList = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const { data: projectsData, isLoading, error, refetch } = useQuery({
    queryKey: ['all-projects', currentPage, itemsPerPage, searchQuery, sortBy, sortOrder, statusFilter, priorityFilter],
    queryFn: async () => {
      if (!user) {
        return { data: { projects: [], pagination: {} } };
      }
      
      return await projectApi.getAllProjects({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
        sortBy,
        sortOrder,
        status: statusFilter,
        priority: priorityFilter
      });
    },
    retry: 1,
    staleTime: 0,
    enabled: !!user,
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });

  const projects = projectsData?.data?.data?.projects || [];
  const pagination = projectsData?.data?.data?.pagination || {};
  
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, statusFilter, priorityFilter]);

  const handleProjectClick = (project) => {
    navigate(`/workspace/${project.workspace}/projects/${project._id}`);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'on-hold':
        return <PauseCircle className="w-4 h-4 text-yellow-500" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'manager':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'member':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <FolderOpen className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Please log in to view projects
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You need to be logged in to access your projects
        </p>
        <CustomButton onClick={() => navigate('/login')}>
          Go to Login
        </CustomButton>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[...Array(itemsPerPage)].map((_, i) => (
          <CustomCard key={i} className="p-6 h-64 bg-gray-100 dark:bg-gray-800"></CustomCard>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Failed to load projects
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error.response?.data?.message || error.message || 'An unexpected error occurred'}
        </p>
        <div className="flex gap-2 justify-center">
          <CustomButton onClick={() => refetch()} variant="outline">
            Retry
          </CustomButton>
          <CustomButton onClick={() => refetch()}>
            Reload Page
          </CustomButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              All Projects
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              View and manage all your projects across workspaces
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full text-base"
                />
              </div>
              <CustomButton
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="flex items-center gap-2 w-full sm:w-auto px-6 py-3 text-base font-medium"
              >
                <Filter className="w-5 h-5" />
                Filters
              </CustomButton>
            </div>

            {showFilters && (
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl space-y-6 border-t border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filter Options</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Sort By
                    </label>
                    <select
                      id="sortBy"
                      value={sortBy}
                      onChange={(e) => handleSort(e.target.value)}
                      className="block w-full pl-4 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-xl dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    >
                      <option value="name">Name</option>
                      <option value="createdAt">Created Date</option>
                      <option value="updatedAt">Last Updated</option>
                      <option value="startDate">Start Date</option>
                      <option value="endDate">End Date</option>
                      <option value="priority">Priority</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Sort Order
                    </label>
                    <select
                      id="sortOrder"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="block w-full pl-4 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-xl dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    >
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Status
                    </label>
                    <select
                      id="statusFilter"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="block w-full pl-4 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-xl dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">All Status</option>
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="on-hold">On Hold</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="itemsPerPage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Items per page
                    </label>
                    <select
                      id="itemsPerPage"
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(parseInt(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="block w-full pl-4 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-xl dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    >
                      <option value="3">3 per page</option>
                      <option value="6">6 per page</option>
                      <option value="9">9 per page</option>
                      <option value="12">12 per page</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <FolderOpen className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              No projects found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
              {searchQuery || statusFilter || priorityFilter 
                ? 'Try adjusting your search criteria or filters.'
                : 'You don\'t have any projects yet. Create one in a workspace to get started.'
              }
            </p>
            <CustomButton onClick={() => navigate('/dashboard')} size="lg" className="px-8 py-3">
              Go to Dashboard
            </CustomButton>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
              <CustomCard
                key={project._id}
                className="p-6 flex flex-col justify-between cursor-pointer hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 group"
                onClick={() => handleProjectClick(project)}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FolderOpen className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(project.status)}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1 mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {project.name}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {project.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center gap-2 mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(project.priority)}`}>
                      {project.priority}
                    </span>
                    {project.userRole && (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(project.userRole)}`}>
                        {project.userRole}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                        <FolderOpen className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="font-medium">{project.workspace?.name || 'Unknown Workspace'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                        <Users className="w-3 h-3 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="font-medium">{project.team?.length || 0} Members</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">{new Date(project.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">{new Date(project.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                      View Project →
                    </span>
                  </div>
                </div>
              </CustomCard>
            ))}
          </div>
          
          {pagination.totalPages > 1 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <CustomButton
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  variant="outline"
                  className="flex items-center gap-2 px-6 py-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </CustomButton>
                <span className="text-gray-700 dark:text-gray-300 font-medium bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-full">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <CustomButton
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  variant="outline"
                  className="flex items-center gap-2 px-6 py-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </CustomButton>
              </div>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
};

export default AllProjectsList;
