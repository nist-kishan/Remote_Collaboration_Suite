import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import DocumentList from '../components/documents/DocumentList';
import DocumentEditorOptimized from '../components/documents/DocumentEditorOptimized';
import DocumentLoading from '../components/documents/DocumentLoading';
import DocumentError from '../components/documents/DocumentError';
import ShareModal from '../components/documents/DocumentShareModal';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { 
  createDocument, 
  getUserDocuments, 
  getDocument, 
  updateDocument, 
  deleteDocument,
  shareDocument,
  updateCollaboratorRole,
  removeCollaborator,
  shareDocumentViaEmail
} from '../api/documentApi';

export default function Document() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state) => state.auth);
  const [currentView, setCurrentView] = useState('list'); // 'list', 'editor', 'viewer'
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'default',
    onConfirm: null
  });
  
  const queryClient = useQueryClient();

  // Handle URL parameter for viewing specific document
  useEffect(() => {
    if (documentId === 'new') {
      // If URL is /documents/new, show editor for creating new document
      setCurrentView('editor');
      setIsCreating(true);
      setSelectedDocument(null);
      setIsShareModalOpen(false); // Close share modal when creating new document
    } else if (documentId) {
      // If there's a documentId in URL, fetch and view that document
      setCurrentView('editor');
      setIsCreating(false);
    }
  }, [documentId]);

  // Fetch documents
  const { data: documentsData, isLoading: documentsLoading, error: documentsError } = useQuery({
    queryKey: ['documents'],
    queryFn: () => getUserDocuments(),
  });

  // Fetch single document when editing
  const { data: documentData, isLoading: documentLoading, error: documentError } = useQuery({
    queryKey: ['document', documentId || selectedDocument?._id],
    queryFn: async () => {
      const id = documentId || selectedDocument?._id;
      if (!id) {
        throw new Error('Document ID is required');
      }
      const data = await getDocument(id);
      return data;
    },
    enabled: !!(documentId || selectedDocument?._id) && currentView === 'editor' && !isCreating,
  });

  // Create document mutation
  const createDocumentMutation = useMutation({
    mutationFn: createDocument,
    onSuccess: (data) => {
      const newDocument = data.data.document;
      toast.success('Document created successfully!');
      queryClient.invalidateQueries(['documents']);
      queryClient.invalidateQueries(['documents', 'all']);
      // Set the selected document with the newly created document
      setSelectedDocument(newDocument);
      // Navigate to the new document's URL
      navigate(`/documents/${newDocument._id}`);
      setCurrentView('editor');
      setIsCreating(false);
      // Refetch the document to ensure it's loaded
      queryClient.refetchQueries(['document', newDocument._id]);
      },
    onError: (error) => {
      console.error('❌ [CREATE DOCUMENT] Failed to create document:', error);
      toast.error(error?.data?.message || 'Failed to create document');
      setIsCreating(false);
    },
  });

  // Update document mutation
  const updateDocumentMutation = useMutation({
    mutationFn: ({ documentId, data }) => {
      return updateDocument(documentId, data);
    },
    onSuccess: (data) => {
      toast.success('Document updated successfully!');
      queryClient.invalidateQueries(['documents']);
      queryClient.invalidateQueries(['documents', 'all']); // Invalidate the specific query key used by DocumentsList
      queryClient.invalidateQueries(['document', selectedDocument._id]);
      // Update selected document with new data
      setSelectedDocument(data.data.document);
    },
    onError: (error) => {
      console.error('Failed to update document:', error);
      toast.error(error?.data?.message || 'Failed to update document');
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      toast.success('Document deleted successfully!');
      queryClient.invalidateQueries(['documents']);
      queryClient.invalidateQueries(['documents', 'all']); // Invalidate the specific query key used by DocumentsList
      setCurrentView('list');
      setSelectedDocument(null);
    },
    onError: (error) => {
      toast.error(error?.data?.message || 'Failed to delete document');
    },
  });

  // Share document mutation
  const shareDocumentMutation = useMutation({
    mutationFn: ({ documentId, data }) => shareDocument(documentId, data),
    onSuccess: () => {
      toast.success('Document shared successfully!');
      queryClient.invalidateQueries(['documents']);
      queryClient.invalidateQueries(['document', selectedDocument._id]);
      setIsShareModalOpen(false);
    },
    onError: (error) => {
      toast.error(error?.data?.message || 'Failed to share document');
    },
  });

  // Update collaborator role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ documentId, userId, role }) => updateCollaboratorRole(documentId, userId, role),
    onSuccess: () => {
      toast.success('Role updated successfully!');
      queryClient.invalidateQueries(['documents']);
      queryClient.invalidateQueries(['document', selectedDocument._id]);
    },
    onError: (error) => {
      toast.error(error?.data?.message || 'Failed to update role');
    },
  });

  // Remove collaborator mutation
  const removeCollaboratorMutation = useMutation({
    mutationFn: ({ documentId, userId }) => removeCollaborator(documentId, userId),
    onSuccess: () => {
      toast.success('Collaborator removed successfully!');
      queryClient.invalidateQueries(['documents']);
      queryClient.invalidateQueries(['document', selectedDocument._id]);
    },
    onError: (error) => {
      toast.error(error?.data?.message || 'Failed to remove collaborator');
    },
  });

  // Share document via email mutation
  const shareViaEmailMutation = useMutation({
    mutationFn: ({ documentId, data }) => shareDocumentViaEmail(documentId, data),
    onSuccess: (data) => {
      const result = data.data;
      toast.success(`Email invitations sent successfully! ${result.emailsSent} sent, ${result.emailsFailed} failed.`);
      if (result.failedEmails.length > 0) {
      }
    },
    onError: (error) => {
      toast.error(error?.data?.message || 'Failed to send email invitations');
    },
  });

  const handleCreateDocument = () => {
    setIsCreating(true);
    setSelectedDocument(null);
    setCurrentView('editor');
    navigate('/documents/new');
  };

  const handleEditDocument = (document) => {
    setSelectedDocument(document);
    setCurrentView('editor');
    navigate(`/documents/${document._id}`);
  };

  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    setCurrentView('viewer');
    navigate(`/documents/preview/${document._id}`);
  };

  const handleShareDocument = (document) => {
    setSelectedDocument(document);
    setIsShareModalOpen(true);
  };

  const handleCollaborateDocument = (document) => {
    setSelectedDocument(document);
    setIsShareModalOpen(true);
    };

  const handleDeleteDocument = (document) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Document',
      message: `Are you sure you want to delete "${document.title}"? This action cannot be undone.`,
      type: 'danger',
      onConfirm: () => {
        deleteDocumentMutation.mutate(document._id);
        setConfirmModal({ ...confirmModal, isOpen: false });
      }
    });
  };

  const handleSaveDocument = (documentData) => {
    if (selectedDocument || documentId) {
      // Update existing document
      const docId = documentId || selectedDocument._id;
      updateDocumentMutation.mutate({
        documentId: docId,
        data: documentData
      });
    } else {
      // Create new document
      createDocumentMutation.mutate(documentData);
    }
  };

  const handleShare = (shareData) => {
    const docId = documentId || selectedDocument?._id;
    if (docId) {
      shareDocumentMutation.mutate({
        documentId: docId,
        data: shareData
      });
    }
  };

  const handleUpdateRole = (userId, role) => {
    const docId = documentId || selectedDocument?._id;
    if (docId) {
      updateRoleMutation.mutate({
        documentId: docId,
        userId,
        role
      });
    }
  };

  const handleRemoveCollaborator = (userId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Collaborator',
      message: 'Are you sure you want to remove this collaborator from the document?',
      type: 'warning',
      onConfirm: () => {
        const docId = documentId || selectedDocument?._id;
        if (docId) {
          removeCollaboratorMutation.mutate({
            documentId: docId,
            userId
          });
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      }
    });
  };

  const handleShareViaEmail = (shareData) => {
    const docId = documentId || selectedDocument?._id;
    if (docId) {
      shareViaEmailMutation.mutate({
        documentId: docId,
        data: shareData
      });
    }
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedDocument(null);
    setIsCreating(false);
    navigate('/documents');
  };

  if (currentView === 'editor') {
    // Show loading state while fetching document
    if (documentId && documentId !== 'new' && !isCreating && documentLoading) {
      return <DocumentLoading message="Loading document..." />;
    }

    // Show error state if document fetch failed
    if (documentId && documentId !== 'new' && !isCreating && documentError) {
      return (
        <DocumentError 
          message="Failed to load document. Please try again." 
          onRetry={() => {
            queryClient.invalidateQueries(['document', documentId]);
            queryClient.invalidateQueries(['documents']);
          }} 
        />
      );
    }

    const currentDocument = isCreating ? null : (documentData?.data?.document || selectedDocument);
    
    return (
      <DocumentEditorOptimized
        document={currentDocument}
        onSave={handleSaveDocument}
        onShare={isCreating ? null : handleShareDocument}
        onBack={handleBackToList}
        loading={createDocumentMutation.isPending || updateDocumentMutation.isPending}
      />
    );
  }

  // Show loading state for document list
  if (documentsLoading) {
    return <DocumentLoading message="Loading documents..." />;
  }

  // Show error state for document list
  if (documentsError) {
    return (
        <DocumentError 
          message="Failed to load documents. Please try again." 
          onRetry={() => {
            queryClient.invalidateQueries(['documents']);
          }} 
        />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      ></div>
      
      {/* Main Content with proper margins */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <DocumentList
            documents={documentsData?.data?.documents || []}
            loading={documentsLoading}
            onCreateDocument={handleCreateDocument}
            onEditDocument={handleEditDocument}
            onShareDocument={handleShareDocument}
            onDeleteDocument={handleDeleteDocument}
            onViewDocument={handleViewDocument}
            onCollaborateDocument={handleCollaborateDocument}
          />
        </div>
      </div>

      <ShareModal
        document={selectedDocument}
        isOpen={isShareModalOpen && !!selectedDocument}
        onClose={() => {
          setIsShareModalOpen(false);
          setSelectedDocument(null);
        }}
        onShare={handleShare}
        onUpdateRole={handleUpdateRole}
        onRemoveCollaborator={handleRemoveCollaborator}
        onShareViaEmail={handleShareViaEmail}
        loading={shareDocumentMutation.isPending || shareViaEmailMutation.isPending}
      />

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />
    </div>
  );
}
