import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText, Users, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';
import DocumentList from '../../components/documents/DocumentList';
import DocumentErrorBoundary from '../../components/documents/DocumentErrorBoundary';
import CustomButton from '../../components/ui/CustomButton';
import CustomCard from '../../components/ui/CustomCard';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import { getUserDocuments, deleteDocument } from '../../api/documentApi';
import { useSelector } from 'react-redux';

export default function DocumentsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'own', 'shared'
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, document: null });

  // Fetch all documents first to get accurate counts
  const { data: allDocumentsData, isLoading, error, refetch } = useQuery({
    queryKey: ['documents', 'all'],
    queryFn: () => getUserDocuments({}),
  });

  const allDocuments = allDocumentsData?.data?.documents || [];
  const documentsLoading = isLoading;
  const documentsError = error?.response?.data?.message || error?.message;

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      toast.success('Document deleted successfully!');
      queryClient.invalidateQueries(['documents']);
      queryClient.invalidateQueries(['documents', 'all']);
      setDeleteModal({ isOpen: false, document: null });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete document');
    },
  });

  // Filter documents based on active tab
  const documents = allDocuments.filter(doc => {
    if (activeTab === 'own') {
      return doc.owner?._id === user?._id;
    }
    if (activeTab === 'shared') {
      return doc.visibility === 'shared';
    }
    return true; // 'all' tab shows all documents
  });

  const handleCreateDocument = () => {
    navigate('/documents/new');
  };

  const handleEditDocument = (document) => {
    if (!document || !document._id) {
      toast.error('Invalid document selected');
      return;
    }
    navigate(`/documents/edit/${document._id}`);
  };

  const handleViewDocument = (document) => {
    if (!document || !document._id) {
      toast.error('Invalid document selected');
      return;
    }
    
    // Navigate to preview view for all documents
    navigate(`/documents/preview/${document._id}`);
  };

  const handleShareDocument = (document) => {
    toast('Share functionality will be available in the document editor');
  };

  const handleShareDocumentClick = (document) => {
    if (!document || !document._id) {
      toast.error('Invalid document selected');
      return;
    }
    handleShareDocument(document);
  };

  const handleDeleteDocumentClick = (document) => {
    if (!document || !document._id) {
      toast.error('Invalid document selected');
      return;
    }
    setDeleteModal({ isOpen: true, document });
  };

  const handleDeleteDocument = (document) => {
    if (!document || !document._id) {
      toast.error('Invalid document selected');
      return;
    }
    deleteDocumentMutation.mutate(document._id);
  };

  const confirmDeleteDocument = () => {
    if (deleteModal.document) {
      deleteDocumentMutation.mutate(deleteModal.document._id);
    }
  };

  // Calculate tab counts based on all documents
  const tabs = [
    { id: 'all', label: 'All Documents', count: allDocumentsData?.data?.pagination?.total || 0 },
    { id: 'own', label: 'My Documents', count: allDocuments.filter(doc => doc.owner?._id === user?._id).length },
    { id: 'shared', label: 'Shared with Me', count: allDocuments.filter(doc => doc.visibility === 'shared').length }
  ];

  if (documentsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (documentsError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <CustomCard className="p-8 text-center max-w-md">
          <div className="text-red-500 mb-4">
            <FileText className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Failed to Load Documents</h2>
          <p className="text-gray-600 mb-4">{documentsError || 'An error occurred while loading documents.'}</p>
          <CustomButton onClick={() => refetch()} variant="primary">
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
              onClick={handleCreateDocument}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Document</span>
            </CustomButton>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 font-medium text-sm transition-all duration-200 cursor-pointer outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-none ${
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
                    <span>{tab.label}</span>
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
            documents={documents}
            onCreateDocument={handleCreateDocument}
            onEditDocument={handleEditDocument}
            onViewDocument={handleViewDocument}
            onShareDocument={handleShareDocumentClick}
            onDeleteDocument={handleDeleteDocumentClick}
            loading={documentsLoading}
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
        confirmText={deleteDocumentMutation.isPending ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        type="danger"
      />
      </div>
  );
}
