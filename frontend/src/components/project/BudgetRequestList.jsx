import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, CheckCircle, XCircle, Clock, User, FileText, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { budgetRequestApi } from '../../api/budgetRequestApi';
import CustomButton from '../ui/CustomButton';
import CustomCard from '../ui/CustomCard';
import CustomModal from '../ui/CustomModal';
import BudgetRequestForm from './BudgetRequestForm';
import { getProjectUserRole } from '../../utils/roleUtils';

const BudgetRequestList = ({ project }) => {
  const queryClient = useQueryClient();
  const currentUser = useSelector((state) => state.auth.user);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rejectMessage, setRejectMessage] = useState('');

  const userRole = getProjectUserRole(project, currentUser);
  const canManageBudget = userRole === 'hr' || userRole === 'owner';

  // Fetch budget requests
  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['budget-requests', project._id],
    queryFn: () => budgetRequestApi.getBudgetRequests(project._id)
  });

  const budgetRequests = requestsData?.data?.data?.budgetRequests || [];

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: budgetRequestApi.approveBudgetRequest,
    onSuccess: () => {
      queryClient.invalidateQueries(['budget-requests', project._id]);
      queryClient.invalidateQueries(['project', project._id]);
      toast.success('Budget request approved');
      setSelectedRequest(null);
      setShowApproveModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to approve budget request');
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: (data) => budgetRequestApi.rejectBudgetRequest(selectedRequest?._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['budget-requests', project._id]);
      toast.success('Budget request rejected');
      setSelectedRequest(null);
      setShowRejectModal(false);
      setRejectMessage('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reject budget request');
    }
  });

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setShowApproveModal(true);
  };

  const handleConfirmApprove = () => {
    approveMutation.mutate(selectedRequest._id);
  };

  const handleReject = (request) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  const handleConfirmReject = () => {
    rejectMutation.mutate({ reviewMessage: rejectMessage });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <CustomCard key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </CustomCard>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Budget Requests
          </h3>
          <CustomButton
            size="sm"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Create Request
          </CustomButton>
        </div>

        {budgetRequests.length === 0 ? (
          <CustomCard className="p-12 text-center">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No budget requests
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Budget requests will appear here
            </p>
            <CustomButton onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 inline mr-2" />
              Create Budget Request
            </CustomButton>
          </CustomCard>
        ) : (
          budgetRequests.map((request) => (
            <CustomCard key={request._id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {request.task.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Requested by {request.userName}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      {request.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <User className="w-4 h-4" />
                      <span>{request.userName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <FileText className="w-4 h-4" />
                      <span>{request.message}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                      <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span>{request.currency} {request.amount.toLocaleString()}</span>
                    </div>
                  </div>

                  {request.reviewMessage && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Review:</strong> {request.reviewMessage}
                      </p>
                    </div>
                  )}
                </div>

                {canManageBudget && request.status === 'pending' && (
                  <div className="flex gap-2 ml-4">
                    <CustomButton
                      size="sm"
                      onClick={() => handleApprove(request)}
                      disabled={approveMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      Approve
                    </CustomButton>
                    <CustomButton
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(request)}
                      disabled={rejectMutation.isPending}
                      className="border-red-600 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 inline mr-1" />
                      Reject
                    </CustomButton>
                  </div>
                )}
              </div>
            </CustomCard>
          ))
        )}
      </div>

      {/* Approve Modal */}
      <CustomModal isOpen={showApproveModal} onClose={() => setShowApproveModal(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Approve Budget Request
          </h3>
          <div className="space-y-4">
            {selectedRequest && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Task:</strong> {selectedRequest.task.name}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Requested by:</strong> {selectedRequest.userName}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Amount:</strong> {selectedRequest.currency} {selectedRequest.amount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Message:</strong> {selectedRequest.message}
                </p>
              </div>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to approve this budget request? This will deduct the amount from the project budget.
            </p>
            <div className="flex gap-3">
              <CustomButton
                variant="outline"
                onClick={() => setShowApproveModal(false)}
                className="flex-1"
              >
                Cancel
              </CustomButton>
              <CustomButton
                onClick={handleConfirmApprove}
                disabled={approveMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {approveMutation.isPending ? 'Approving...' : 'Approve'}
              </CustomButton>
            </div>
          </div>
        </div>
      </CustomModal>

      {/* Reject Modal */}
      <CustomModal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Reject Budget Request
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for rejection
              </label>
              <textarea
                value={rejectMessage}
                onChange={(e) => setRejectMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                rows={4}
                placeholder="Enter reason for rejection..."
              />
            </div>
            <div className="flex gap-3">
              <CustomButton
                variant="outline"
                onClick={() => setShowRejectModal(false)}
                className="flex-1"
              >
                Cancel
              </CustomButton>
              <CustomButton
                onClick={handleConfirmReject}
                disabled={rejectMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
              </CustomButton>
            </div>
          </div>
        </div>
      </CustomModal>

      {/* Budget Request Form Modal */}
      <BudgetRequestForm
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        project={project}
      />
    </>
  );
};

export default BudgetRequestList;

