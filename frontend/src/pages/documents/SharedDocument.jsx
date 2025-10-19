import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import DocumentEditorOptimizedV2 from '../../components/documents/DocumentEditorOptimizedV2';
import DocumentLoading from '../../components/documents/DocumentLoading';
import DocumentError from '../../components/documents/DocumentError';
import ShareModal from '../../components/documents/ShareModal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { 
  getDocument, 
  updateDocument,
  shareDocument,
  updateCollaboratorRole,
  removeCollaborator,
  shareDocumentViaEmail
} from '../../api/documentApi';

export default function SharedDocument() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'default',
    onConfirm: null
  });

  // Fetch document
  const { data: documentData, isLoading, error } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => {
      if (!documentId) {
        throw new Error('Document ID is required');
      }
      return getDocument(documentId);
    },
    enabled: !!documentId,
  });

  // Update document mutation
  const updateDocumentMutation = useMutation({
    mutationFn: ({ documentId, data }) => updateDocument(documentId, data),
    onSuccess: () => {
      toast.success('Document updated successfully!');
      queryClient.invalidateQueries(['documents']);
      queryClient.invalidateQueries(['document', documentId]);
    },
    onError: (error) => {
      toast.error(error?.data?.message || 'Failed to update document');
    },
  });

  // Share document mutation
  const shareDocumentMutation = useMutation({
    mutationFn: ({ documentId, data }) => shareDocument(documentId, data),
    onSuccess: () => {
      toast.success('Document shared successfully!');
      queryClient.invalidateQueries(['documents']);
      queryClient.invalidateQueries(['document', documentId]);
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
      queryClient.invalidateQueries(['document', documentId]);
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
      queryClient.invalidateQueries(['document', documentId]);
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

  const handleSaveDocument = (documentData) => {
    updateDocumentMutation.mutate({
      documentId,
      data: documentData
    });
  };

  const handleShareDocument = () => {
    setIsShareModalOpen(true);
  };

  const handleShare = (shareData) => {
    shareDocumentMutation.mutate({
      documentId,
      data: shareData
    });
  };

  const handleUpdateRole = (userId, role) => {
    updateRoleMutation.mutate({
      documentId,
      userId,
      role
    });
  };

  const handleRemoveCollaborator = (userId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Collaborator',
      message: 'Are you sure you want to remove this collaborator from the document?',
      type: 'warning',
      onConfirm: () => {
        removeCollaboratorMutation.mutate({
          documentId,
          userId
        });
        setConfirmModal({ ...confirmModal, isOpen: false });
      }
    });
  };

  const handleShareViaEmail = (shareData) => {
    shareViaEmailMutation.mutate({
      documentId,
      data: shareData
    });
  };

  const handleBack = () => {
    navigate('/documents/shared');
  };

  if (isLoading) {
    return <DocumentLoading message="Loading shared document..." />;
  }

  if (error) {
    return (
      <DocumentError 
        message="Failed to load shared document. You may not have access to this document." 
        onRetry={() => window.location.reload()} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900">
      <DocumentEditorOptimizedV2
        document={documentData?.data?.document}
        onSave={handleSaveDocument}
        onShare={handleShareDocument}
        onBack={handleBack}
        loading={updateDocumentMutation.isPending}
        title="Shared Document"
        showDeleteButton={false} // Don't show delete button for shared documents
      />

      <ShareModal
        document={documentData?.data?.document}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
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
