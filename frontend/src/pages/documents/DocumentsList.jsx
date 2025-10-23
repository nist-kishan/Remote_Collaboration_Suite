import React, { useState, useEffect } from 'react';
import { Plus, FileText } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import DocumentList from '../../components/documents/DocumentList';
import DocumentErrorBoundary from '../../components/documents/DocumentErrorBoundary';
import DocumentUploadModal from '../../components/documents/DocumentUploadModal';
import DocumentExportModal from '../../components/documents/DocumentExportModal';
import CustomButton from '../../components/ui/CustomButton';
import CustomCard from '../../components/ui/CustomCard';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import { useDocument } from '../../hook/useDocument';

export default function DocumentsList() {
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, document: null });
  const [uploadModal, setUploadModal] = useState({ isOpen: false, document: null });
  const [exportModal, setExportModal] = useState({ isOpen: false, document: null });
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
            You need to be logged in to view your documents.
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
  
  // Use the consolidated document hook
  const {
    documents,
    activeTab,
    isLoading,
    error,
    isDeleting,
    handleSetActiveTab,
    handleCreateDocument,
    handleEditDocument,
    handleViewDocument,
    handleDeleteDocument,
    handleOpenShareModal,
    handleUploadFile,
    handleExportDocument,
    clearErrors,
    refetchDocuments,
    // All documents functionality
    allDocuments,
    allDocumentsLoading,
    allDocumentsError,
    fetchAllDocuments
  } = useDocument();

  // Fetch all documents when component mounts or activeTab changes
  useEffect(() => {
    if (isAuthenticated && user?._id) {
      console.log('🔄 Fetching all documents for tab:', activeTab);
      fetchAllDocuments();
    }
  }, [isAuthenticated, user?._id, activeTab, fetchAllDocuments]);

  // Debug logging
  console.log('DocumentsList Debug:', {
    allDocuments,
    allDocumentsLength: allDocuments?.length,
    allDocumentsLoading,
    allDocumentsError,
    user: user?._id,
    activeTab
  });

  // Additional debugging for document rendering
  if (allDocuments && allDocuments.length > 0) {
    console.log('📄 All Documents to render:', allDocuments.map(doc => ({
      id: doc._id,
      title: doc.title,
      status: doc.status,
      owner: doc.owner?._id,
      visibility: doc.visibility
    })));
  } else {
    console.log('❌ No all documents to render - allDocuments array:', allDocuments);
  }

  const handleCreateDocumentClick = () => {
    navigate('/documents/new');
  };

  const handleShareDocumentClick = (document) => {
    handleOpenShareModal(document);
  };

  const handleDeleteDocumentClick = (document) => {
    setDeleteModal({ isOpen: true, document });
  };

  const handleUploadDocumentClick = (document) => {
    setUploadModal({ isOpen: true, document });
  };

  const handleExportDocumentClick = (document) => {
    setExportModal({ isOpen: true, document });
  };

  const handleUploadFileToDocument = async (documentId, file) => {
    try {
      await handleUploadFile(documentId, file);
      setUploadModal({ isOpen: false, document: null });
    } catch (error) {
      // Error handled in the hook
    }
  };

  const handleExportDocumentWithOptions = async (documentId, format, options = {}) => {
    try {
      await handleExportDocument(documentId, format);
      setExportModal({ isOpen: false, document: null });
    } catch (error) {
      // Error handled in the hook
    }
  };

  const confirmDeleteDocument = () => {
    if (deleteModal.document) {
      handleDeleteDocument(deleteModal.document._id);
      setDeleteModal({ isOpen: false, document: null });
    }
  };

  // Calculate tab counts
  const tabs = [
    { 
      id: 'all', 
      label: 'All Documents', 
      count: allDocuments?.length || 0
    },
    { 
      id: 'own', 
      label: 'My Documents', 
      count: allDocuments?.filter(doc => doc.owner?._id === user?._id).length || 0
    },
    { 
      id: 'shared', 
      label: 'Shared with Me', 
      count: allDocuments?.filter(doc => doc.visibility === 'shared' && doc.owner?._id !== user?._id).length || 0
    },
    { 
      id: 'draft', 
      label: 'Drafts', 
      count: allDocuments?.filter(doc => doc.status === 'draft').length || 0
    }
  ];

  if (allDocumentsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (allDocumentsError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Documents
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {allDocumentsError?.message || 'Failed to load documents. Please try again.'}
          </p>
          <button
            onClick={fetchAllDocuments}
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
          <h2 className="text-xl font-semibold mb-2">Failed to Load Documents</h2>
          <p className="text-gray-600 mb-4">{error?.message || 'An error occurred while loading documents.'}</p>
          <CustomButton onClick={() => refetchDocuments()} variant="primary">
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Documents</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                Create, edit, and collaborate on your documents
              </p>
            </div>
            <CustomButton
              onClick={handleCreateDocumentClick}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Document</span>
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


        {/* Documents List */}
        <DocumentErrorBoundary>
          <DocumentList
            documents={allDocuments || []}
            onCreateDocument={handleCreateDocumentClick}
            onEditDocument={handleEditDocument}
            onViewDocument={handleViewDocument}
            onShareDocument={handleShareDocumentClick}
            onDeleteDocument={handleDeleteDocumentClick}
            onUploadDocument={handleUploadDocumentClick}
            onExportDocument={handleExportDocumentClick}
            loading={allDocumentsLoading}
          />
        </DocumentErrorBoundary>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, document: null })}
        onConfirm={confirmDeleteDocument}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteModal.document?.title}"? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        type="danger"
      />

      {/* Upload Modal */}
      <DocumentUploadModal
        document={uploadModal.document}
        isOpen={uploadModal.isOpen}
        onClose={() => setUploadModal({ isOpen: false, document: null })}
        onUpload={handleUploadFileToDocument}
        loading={false}
      />

      {/* Export Modal */}
      <DocumentExportModal
        document={exportModal.document}
        isOpen={exportModal.isOpen}
        onClose={() => setExportModal({ isOpen: false, document: null })}
        onExport={handleExportDocumentWithOptions}
        loading={false}
      />
      </div>
  );
}
