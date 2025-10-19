import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Plus, Users, Settings, Trash2, Edit, Search, ChevronLeft, ChevronRight, Filter, SortAsc, SortDesc } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { workspaceApi } from '../../api/workspaceApi';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import CreateWorkspaceModal from './CreateWorkspaceModal';
import EditWorkspaceModal from './EditWorkspaceModal';

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
        <Button onClick={() => navigate('/login')}>
          Go to Login
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </Card>
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
          <Button onClick={() => refetch()} variant="outline">
            Retry
          </Button>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Workspaces
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your workspaces and collaborate with your team
          </p>
        </div>
        <Button onClick={handleCreateWorkspace} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Workspace
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search workspaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Order
                </label>
                <div className="flex gap-2">
                  <Button
                    variant={sortOrder === 'asc' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setSortOrder('asc');
                      setCurrentPage(1);
                    }}
                    className="flex items-center gap-1"
                  >
                    <SortAsc className="w-3 h-3" />
                    Asc
                  </Button>
                  <Button
                    variant={sortOrder === 'desc' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setSortOrder('desc');
                      setCurrentPage(1);
                    }}
                    className="flex items-center gap-1"
                  >
                    <SortDesc className="w-3 h-3" />
                    Desc
                  </Button>
                </div>
              </div>

              {/* Items Per Page */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Items Per Page
                </label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value={6}>6</option>
                  <option value={9}>9</option>
                  <option value={12}>12</option>
                  <option value={18}>18</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Info */}
      {!isLoading && (
        <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
          <span>
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, pagination.totalCount || 0)} of {pagination.totalCount || 0} workspaces
          </span>
          {pagination.totalCount > 0 && (
            <span>
              Page {currentPage} of {pagination.totalPages || 1}
            </span>
          )}
        </div>
      )}

      {/* Workspaces Grid */}
      {workspaces.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchQuery ? 'No workspaces found' : 'No workspaces yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchQuery 
              ? 'Try adjusting your search terms or filters'
              : 'Create your first workspace to get started'
            }
          </p>
          {!searchQuery && (
            <Button onClick={handleCreateWorkspace}>
              Create Workspace
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((workspace) => (
            <Card 
              key={workspace._id} 
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => handleWorkspaceClick(workspace)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {workspace.name}
                  </h3>
                  {workspace.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {workspace.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditWorkspace(workspace);
                    }}
                    className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {workspace.owner._id === workspace.owner._id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWorkspace(workspace);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{workspace.memberCount || 0} members</span>
                </div>
                <div className="flex items-center gap-1">
                  <Settings className="w-4 h-4" />
                  <span>{workspace.projectCount || 0} projects</span>
                </div>
              </div>

              {/* User Role Badge */}
              {workspace.userRole && (
                <div className="mt-3">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    workspace.userRole === 'owner' 
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      : workspace.userRole === 'admin'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                  }`}>
                    {workspace.userRole}
                  </span>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Created {new Date(workspace.createdAt).toLocaleDateString()}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    workspace.subscription?.plan === 'enterprise' 
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      : workspace.subscription?.plan === 'pro'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                  }`}>
                    {workspace.subscription?.plan || 'free'}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
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
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="min-w-[40px]"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === (pagination.totalPages || 1)}
            className="flex items-center gap-1"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Modals */}
      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <EditWorkspaceModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        workspace={selectedWorkspace}
      />
    </div>
  );
};

export default WorkspaceList;
