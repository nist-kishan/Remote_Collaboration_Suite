import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Plus, Users, Settings, Trash2, Edit, Search, ChevronLeft, ChevronRight, Filter, SortAsc, SortDesc } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { workspaceApi } from '../../api/workspaceApi';
import CustomButton from '../ui/CustomButton';
import CustomCard from '../ui/CustomCard';
import CustomModal from '../ui/CustomModal';
import WorkspaceCreator from './WorkspaceCreator';
import WorkspaceEditor from './WorkspaceEditor';

const WorkspaceList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.auth);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch workspaces with pagination and filtering
  const { data: workspacesData, isLoading, error, refetch } = useQuery({
    queryKey: ['workspaces', currentPage, itemsPerPage, searchQuery, sortBy, sortOrder],
    queryFn: async () => {
      if (!user) {
        return { data: { workspaces: [], pagination: {} } };
      }
      
      try {
        // Try the new getAllWorkspaces API first
        const response = await workspaceApi.getAllWorkspaces({
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery,
          sortBy,
          sortOrder
        });
        
        return response;
      } catch (error) {
        // Fallback to getUserWorkspaces if getAllWorkspaces fails
        try {
          const fallbackResponse = await workspaceApi.getUserWorkspaces();
          
          // Transform the response to match the expected format
          return {
            data: {
              success: true,
              statusCode: 200,
              message: "Workspaces retrieved successfully (fallback)",
              data: {
                workspaces: fallbackResponse.data?.data?.workspaces || fallbackResponse.data?.workspaces || fallbackResponse.data || [],
                pagination: fallbackResponse.data?.data?.pagination || {
                  currentPage: 1,
                  totalPages: 1,
                  totalCount: (fallbackResponse.data?.data?.workspaces || fallbackResponse.data?.workspaces || fallbackResponse.data || []).length,
                  hasNextPage: false,
                  hasPrevPage: false
                }
              }
            }
          };
        } catch (fallbackError) {
          throw error; // Throw the original error
        }
      }
    },
    retry: 1,
    staleTime: 0,
    enabled: !!user,
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });

  // Delete workspace mutation
  const deleteWorkspaceMutation = useMutation({
    mutationFn: workspaceApi.deleteWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries(['workspaces']);
      toast.success('Workspace deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete workspace');
    }
  });

  // Extract workspaces and pagination data
  const workspaces = workspacesData?.data?.data?.workspaces || [];
  const pagination = workspacesData?.data?.data?.pagination || {};

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleCreateWorkspace = () => {
    setShowCreateModal(true);
  };

  const handleEditWorkspace = (workspace) => {
    setSelectedWorkspace(workspace);
    setShowEditModal(true);
  };

  const handleDeleteWorkspace = async (workspace) => {
    deleteWorkspaceMutation.mutate(workspace._id);
  };

  const handleWorkspaceClick = (workspace) => {
    navigate(`/workspace/${workspace._id}`);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'updatedAt', label: 'Last Updated' },
    { value: 'memberCount', label: 'Members' },
    { value: 'projectCount', label: 'Projects' }
  ];

  // Check if user is authenticated
  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Please log in to view workspaces
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You need to be logged in to access your workspaces
        </p>
        <CustomButton onClick={() => navigate('/login')}>
          Go to Login
        </CustomButton>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <CustomCard key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </CustomCard>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <Settings className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Failed to load workspaces
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
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Workspaces
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Manage your workspaces and collaborate with your team
            </p>
          </div>
          <CustomButton 
            onClick={handleCreateWorkspace} 
            className="flex items-center gap-2 px-6 py-3 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            <Plus className="w-5 h-5" />
            Create Workspace
          </CustomButton>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search workspaces..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                />
              </div>

              {/* Filter Toggle */}
              <CustomButton
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-6 py-3 text-base font-medium"
              >
                <Filter className="w-5 h-5" />
                Filters
              </CustomButton>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl space-y-6 border-t border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filter Options</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Sort By */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort Order */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Order
                    </label>
                    <div className="flex gap-2">
                      <CustomButton
                        variant={sortOrder === 'asc' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setSortOrder('asc');
                          setCurrentPage(1);
                        }}
                        className="flex items-center gap-2 px-4 py-2"
                      >
                        <SortAsc className="w-4 h-4" />
                        Ascending
                      </CustomButton>
                      <CustomButton
                        variant={sortOrder === 'desc' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setSortOrder('desc');
                          setCurrentPage(1);
                        }}
                        className="flex items-center gap-2 px-4 py-2"
                      >
                        <SortDesc className="w-4 h-4" />
                        Descending
                      </CustomButton>
                    </div>
                  </div>

                  {/* Items Per Page */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Items Per Page
                    </label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                    >
                      <option value={6}>6 per page</option>
                      <option value={9}>9 per page</option>
                      <option value={12}>12 per page</option>
                      <option value={18}>18 per page</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Info */}
        {!isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, pagination.totalCount || 0)} of {pagination.totalCount || 0} workspaces
              </span>
              {pagination.totalCount > 0 && (
                <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                  Page {currentPage} of {pagination.totalPages || 1}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Workspaces Grid */}
        {workspaces.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              {searchQuery ? 'No workspaces found' : 'No workspaces yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
              {searchQuery 
                ? 'Try adjusting your search terms or filters'
                : 'Create your first workspace to get started'
              }
            </p>
            {!searchQuery && (
              <CustomButton 
                onClick={handleCreateWorkspace}
                className="px-8 py-3 text-base font-medium"
                size="lg"
              >
                Create Workspace
              </CustomButton>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {workspaces.map((workspace) => (
              <CustomCard 
                key={workspace._id} 
                className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600"
                onClick={() => handleWorkspaceClick(workspace)}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2">
                      {workspace.name}
                    </h3>
                    {workspace.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {workspace.description}
                      </p>
                    )}
                  </div>
                  {workspace.userRole === 'owner' && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditWorkspace(workspace);
                        }}
                        className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                        title="Edit workspace"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWorkspace(workspace);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Delete workspace"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="font-medium">{workspace.memberCount || 0} members</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                        <Settings className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="font-medium">{workspace.projectCount || 0} projects</span>
                    </div>
                  </div>

                  {/* User Role Badge */}
                  {workspace.userRole && (
                    <div className="flex justify-between items-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        workspace.userRole === 'owner' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : workspace.userRole === 'admin'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}>
                        {workspace.userRole}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        workspace.subscription?.plan === 'enterprise' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : workspace.subscription?.plan === 'pro'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}>
                        {workspace.subscription?.plan || 'free'}
                      </span>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Created {new Date(workspace.createdAt).toLocaleDateString()}</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                        View Details →
                      </span>
                    </div>
                  </div>
                </div>
            </CustomCard>
          ))}
        </div>
      )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <CustomButton
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-6 py-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </CustomButton>

              {/* Page Numbers */}
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, pagination.totalPages || 1) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= (pagination.totalPages || 1) - 2) {
                    pageNum = (pagination.totalPages || 1) - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <CustomButton
                      key={pageNum}
                      variant={currentPage === pageNum ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="min-w-[44px] h-10"
                    >
                      {pageNum}
                    </CustomButton>
                  );
                })}
              </div>

              <CustomButton
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === (pagination.totalPages || 1)}
                className="flex items-center gap-2 px-6 py-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </CustomButton>
            </div>
          </div>
        )}
      </div>
    </div>

      {/* Modals */}
      <WorkspaceCreator
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <WorkspaceEditor
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        workspace={selectedWorkspace}
      />
    </>
  );
};

export default WorkspaceList;
