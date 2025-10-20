import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import WhiteboardDrawingCanvas from '../../components/whiteboard/WhiteboardDrawingCanvas';
import WhiteboardLoadingSpinner from '../../components/whiteboard/WhiteboardLoadingSpinner';
import WhiteboardErrorDisplay from '../../components/whiteboard/WhiteboardErrorDisplay';
import DocumentShareModal from '../../components/documents/DocumentShareModal';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import { 
  getWhiteboard, 
  updateWhiteboard, 
  deleteWhiteboard,
  shareWhiteboard,
  updateCollaboratorRole,
  removeCollaborator,
  shareWhiteboardViaEmail
} from '../../api/whiteboardApi';

export default function WhiteboardEditor() {
  const { whiteboardId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.auth);
  const [socket, setSocket] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'default',
    onConfirm: null
  });

  // Fetch whiteboard
  const { data: whiteboardData, isLoading, error } = useQuery({
    queryKey: ['whiteboard', whiteboardId],
    queryFn: () => getWhiteboard(whiteboardId),
    enabled: !!whiteboardId,
  });

  // Update whiteboard mutation
  const updateWhiteboardMutation = useMutation({
    mutationFn: ({ whiteboardId, data }) => updateWhiteboard(whiteboardId, data),
    onSuccess: () => {
      toast.success('Whiteboard saved successfully!');
      queryClient.invalidateQueries(['whiteboards']);
      queryClient.invalidateQueries(['whiteboard', whiteboardId]);
    },
    onError: (error) => {
      toast.error(error?.data?.message || 'Failed to save whiteboard');
    },
  });

  // Delete whiteboard mutation
  const deleteWhiteboardMutation = useMutation({
    mutationFn: deleteWhiteboard,
    onSuccess: () => {
      toast.success('Whiteboard deleted successfully!');
      queryClient.invalidateQueries(['whiteboards']);
      navigate('/boards');
    },
    onError: (error) => {
      toast.error(error?.data?.message || 'Failed to delete whiteboard');
    },
  });

  // Share whiteboard mutation
  const shareWhiteboardMutation = useMutation({
    mutationFn: ({ whiteboardId, data }) => shareWhiteboard(whiteboardId, data),
    onSuccess: () => {
      toast.success('Whiteboard shared successfully!');
      queryClient.invalidateQueries(['whiteboards']);
      queryClient.invalidateQueries(['whiteboard', whiteboardId]);
      setIsShareModalOpen(false);
    },
    onError: (error) => {
      toast.error(error?.data?.message || 'Failed to share whiteboard');
    },
  });

  // Update collaborator role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ whiteboardId, userId, role }) => updateCollaboratorRole(whiteboardId, userId, role),
    onSuccess: () => {
      toast.success('Role updated successfully!');
      queryClient.invalidateQueries(['whiteboards']);
      queryClient.invalidateQueries(['whiteboard', whiteboardId]);
    },
    onError: (error) => {
      toast.error(error?.data?.message || 'Failed to update role');
    },
  });

  // Remove collaborator mutation
  const removeCollaboratorMutation = useMutation({
    mutationFn: ({ whiteboardId, userId }) => removeCollaborator(whiteboardId, userId),
    onSuccess: () => {
      toast.success('Collaborator removed successfully!');
      queryClient.invalidateQueries(['whiteboards']);
      queryClient.invalidateQueries(['whiteboard', whiteboardId]);
    },
    onError: (error) => {
      toast.error(error?.data?.message || 'Failed to remove collaborator');
    },
  });

  // Share whiteboard via email mutation
  const shareViaEmailMutation = useMutation({
    mutationFn: ({ whiteboardId, data }) => shareWhiteboardViaEmail(whiteboardId, data),
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

  // Initialize Socket.IO connection
  useEffect(() => {
    if (user && whiteboardId) {
      const newSocket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
        withCredentials: true,
      });

      newSocket.on('connect', () => {
      });

      newSocket.on('disconnect', () => {
      });

      newSocket.on('error', (error) => {
        toast.error('Connection error. Please refresh the page.');
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [whiteboardId, user]);

  const handleSave = (canvasData) => {
    updateWhiteboardMutation.mutate({
      whiteboardId,
      data: canvasData
    });
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleDelete = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Whiteboard',
      message: `Are you sure you want to delete "${whiteboardData?.data?.whiteboard?.title}"? This action cannot be undone.`,
      type: 'danger',
      onConfirm: () => {
        deleteWhiteboardMutation.mutate(whiteboardId);
        setConfirmModal({ ...confirmModal, isOpen: false });
      }
    });
  };

  const handleShareViaEmail = (shareData) => {
    shareViaEmailMutation.mutate({
      whiteboardId,
      data: shareData
    });
  };

  const handleUpdateRole = (userId, role) => {
    updateRoleMutation.mutate({
      whiteboardId,
      userId,
      role
    });
  };

  const handleRemoveCollaborator = (userId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Collaborator',
      message: 'Are you sure you want to remove this collaborator from the whiteboard?',
      type: 'warning',
      onConfirm: () => {
        removeCollaboratorMutation.mutate({
          whiteboardId,
          userId
        });
        setConfirmModal({ ...confirmModal, isOpen: false });
      }
    });
  };

  if (isLoading) {
    return <WhiteboardLoadingSpinner message="Loading whiteboard..." />;
  }

  if (error) {
    return (
      <WhiteboardErrorDisplay 
        message="Failed to load whiteboard. You may not have access to this whiteboard." 
        onRetry={() => {
          queryClient.invalidateQueries(['whiteboard', whiteboardId]);
        }} 
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <WhiteboardDrawingCanvas
        whiteboard={whiteboardData?.data?.whiteboard}
        onSave={handleSave}
        onShare={handleShare}
        onDelete={handleDelete}
        socket={socket}
        loading={updateWhiteboardMutation.isPending}
      />

      <DocumentShareModal
        document={whiteboardData?.data?.whiteboard}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onShare={(shareData) => {
          shareWhiteboardMutation.mutate({
            whiteboardId,
            data: shareData
          });
        }}
        onUpdateRole={handleUpdateRole}
        onRemoveCollaborator={handleRemoveCollaborator}
        onShareViaEmail={handleShareViaEmail}
        loading={shareWhiteboardMutation.isPending || shareViaEmailMutation.isPending}
      />

      <ConfirmationDialog
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
