import React, { useState, useEffect } from 'react';
import { Plus, FileText } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import WhiteboardList from '../../components/whiteboard/WhiteboardList';
import WhiteboardErrorBoundary from '../../components/whiteboard/WhiteboardErrorBoundary';
import CustomButton from '../../components/ui/CustomButton';
import CustomCard from '../../components/ui/CustomCard';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import { useWhiteboard } from '../../hook/useWhiteboard';

export default function WhiteboardsList() {
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, whiteboard: null });
  const { user, isAuthenticated, loading: authLoading } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  
  // Debug authentication state
  console.log('🔐 Auth Debug:', {
    user: user ? { id: user._id, email: user.email, name: user.name } : null,
    isAuthenticated,
    authLoading,
    hasUserId: !!user?._id
  });
  
  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show error if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to be logged in to view your whiteboards.
          </p>
          <button
            onClick={() => navigate('/auth/signin')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }
  
  // Use the consolidated whiteboard hook
  const {
    whiteboards,
    activeTab,
    isLoading,
    error,
    isDeleting,
    handleSetActiveTab,
    handleCreateWhiteboard,
    handleEditWhiteboard,
    handleViewWhiteboard,
    handleDeleteWhiteboard,
    handleOpenShareModal,
    clearErrors,
    refetchWhiteboards,
    // All whiteboards functionality
    allWhiteboards,
    allWhiteboardsLoading,
    allWhiteboardsError,
    fetchAllWhiteboards
  } = useWhiteboard();

  // Fetch all whiteboards when component mounts or activeTab changes
  useEffect(() => {
    if (isAuthenticated && user?._id) {
      console.log('🔄 Fetching all whiteboards for tab:', activeTab);
      fetchAllWhiteboards();
    }
  }, [isAuthenticated, user?._id, activeTab, fetchAllWhiteboards]);

  // Debug whiteboard data
  if (allWhiteboards && allWhiteboards.length > 0) {
    console.log('📄 All Whiteboards to render:', allWhiteboards.map(wb => ({
      id: wb._id,
      title: wb.title,
      status: wb.status,
      owner: wb.owner?._id,
      visibility: wb.visibility
    })));
  } else {
    console.log('❌ No all whiteboards to render - allWhiteboards array:', allWhiteboards);
  }

  const handleCreateWhiteboardClick = () => {
    navigate('/boards/new');
  };

  const handleShareWhiteboardClick = (whiteboard) => {
    handleOpenShareModal(whiteboard);
  };

  const handleDeleteWhiteboardClick = (whiteboard) => {
    setDeleteModal({ isOpen: true, whiteboard });
  };

  const confirmDeleteWhiteboard = () => {
    if (deleteModal.whiteboard) {
      handleDeleteWhiteboard(deleteModal.whiteboard._id);
      setDeleteModal({ isOpen: false, whiteboard: null });
    }
  };

  // Calculate tab counts
  const tabs = [
    { 
      id: 'all', 
      label: 'All Whiteboards', 
      count: allWhiteboards?.length || 0
    },
    { 
      id: 'own', 
      label: 'My Whiteboards', 
      count: allWhiteboards?.filter(wb => wb.owner?._id === user?._id).length || 0
    },
    { 
      id: 'shared', 
      label: 'Shared with Me', 
      count: allWhiteboards?.filter(wb => wb.visibility === 'shared' && wb.owner?._id !== user?._id).length || 0
    },
    { 
      id: 'draft', 
      label: 'Drafts', 
      count: allWhiteboards?.filter(wb => wb.status === 'draft').length || 0
    }
  ];

  if (allWhiteboardsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading whiteboards...</p>
        </div>
      </div>
    );
  }

  if (allWhiteboardsError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Whiteboards
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {allWhiteboardsError?.message || 'Failed to load whiteboards. Please try again.'}
          </p>
          <button
            onClick={fetchAllWhiteboards}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <CustomCard className="p-8 text-center max-w-md">
          <div className="text-red-500 mb-4">
            <FileText className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Failed to Load Whiteboards</h2>
          <p className="text-gray-600 mb-4">{error?.message || 'An error occurred while loading whiteboards.'}</p>
          <CustomButton onClick={() => refetchWhiteboards()} variant="primary">
            Try Again
          </CustomButton>
        </CustomCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Whiteboards</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                Create, edit, and collaborate on your whiteboards
              </p>
            </div>
            <CustomButton
              onClick={handleCreateWhiteboardClick}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Whiteboard</span>
            </CustomButton>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-8 overflow-x-auto">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleSetActiveTab(tab.id)}
                  className={`py-4 px-1 font-medium text-sm transition-all duration-200 cursor-pointer outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-none whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                  style={{ 
                    outline: 'none', 
                    boxShadow: 'none',
                    borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent'
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm">{tab.label}</span>
                    {tab.count > 0 && (
                      <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full text-xs">
                        {tab.count}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Whiteboards List */}
        <WhiteboardErrorBoundary>
          <WhiteboardList
            whiteboards={allWhiteboards || []}
            onCreateWhiteboard={handleCreateWhiteboardClick}
            onEditWhiteboard={handleEditWhiteboard}
            onViewWhiteboard={handleViewWhiteboard}
            onShareWhiteboard={handleShareWhiteboardClick}
            onDeleteWhiteboard={handleDeleteWhiteboardClick}
            loading={allWhiteboardsLoading}
          />
        </WhiteboardErrorBoundary>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, whiteboard: null })}
        onConfirm={confirmDeleteWhiteboard}
        title="Delete Whiteboard"
        message={`Are you sure you want to delete "${deleteModal.whiteboard?.title}"? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}