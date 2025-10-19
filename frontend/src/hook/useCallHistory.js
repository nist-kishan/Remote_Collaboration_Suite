import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getCallHistory, deleteCallHistory, clearCallHistory } from '../api/callApi';
import { toast } from 'react-hot-toast';

export const useCallHistory = () => {
  const { user } = useSelector((state) => state.auth);
  const queryClient = useQueryClient();
  
  // Local state
  const [filter, setFilter] = useState('all'); // all, missed, outgoing, incoming
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [selectedCallId, setSelectedCallId] = useState(null);

  // Fetch call history
  const { data: callHistoryData, isLoading, error } = useQuery({
    queryKey: ['callHistory', filter],
    queryFn: () => getCallHistory({ filter }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user?._id, // Only run query when user is available
  });

  // Extract data from axios response structure
  // axiosResponse.data = { success, statusCode, message: 'Call history fetched successfully', data: { calls, pagination } }
  const apiData = callHistoryData?.data;
  const calls = apiData?.data?.calls || [];
  const pagination = apiData?.data?.pagination;


  // Delete single call mutation
  const deleteCallMutation = useMutation({
    mutationFn: deleteCallHistory,
    onSuccess: () => {
      toast.success('Call deleted successfully');
      queryClient.invalidateQueries(['callHistory']);
    },
    onError: (error) => {
      toast.error(error?.data?.message || 'Failed to delete call');
    }
  });

  // Clear all calls mutation
  const clearAllMutation = useMutation({
    mutationFn: clearCallHistory,
    onSuccess: (response) => {
      const deletedCount = response.data?.data?.deletedCount || response.data?.deletedCount || 0;
      toast.success(`Cleared ${deletedCount} calls from history`);
      queryClient.invalidateQueries(['callHistory']);
      setShowClearConfirm(false);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to clear call history');
    }
  });

  // Business logic functions
  const handleDeleteCall = (callId) => {
    deleteCallMutation.mutate(callId);
  };

  const handleClearAll = () => {
    clearAllMutation.mutate();
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date) => {
    const callDate = new Date(date);
    const now = new Date();
    const diffInDays = Math.floor((now - callDate) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return `Today, ${callDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays === 1) {
      return `Yesterday, ${callDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays < 7) {
      return callDate.toLocaleDateString([], { weekday: 'long', hour: '2-digit', minute: '2-digit' });
    } else {
      return callDate.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const getCallStatus = (call, currentUserId) => {
    if (!call || !currentUserId) return 'unknown';
    
    const participant = call.participants?.find(p => p.user?._id === currentUserId);
    const isIncoming = call.startedBy?._id !== currentUserId;
    
    if (call.status === 'missed') return 'missed';
    if (call.status === 'rejected') return 'rejected';
    if (isIncoming) return 'incoming';
    return 'outgoing';
  };

  const getCallIcon = (call, currentUserId) => {
    const status = getCallStatus(call, currentUserId);
    
    if (status === 'missed' || status === 'rejected') {
      return 'missed';
    }
    
    return 'success';
  };

  const getOtherParticipant = (call, currentUserId) => {
    if (!call || !currentUserId) return { name: 'Unknown User', isGroup: false };
    
    if (call.type === 'group') {
      return { name: call.chat?.name || 'Group Call', isGroup: true };
    }
    
    const otherParticipant = call.participants?.find(p => p.user?._id !== currentUserId);
    return otherParticipant?.user || { name: 'Unknown User', isGroup: false };
  };

  const getCallTitle = (call, currentUserId) => {
    const otherParticipant = getOtherParticipant(call, currentUserId);
    const status = getCallStatus(call, currentUserId);
    
    if (otherParticipant.isGroup) {
      return otherParticipant.name;
    }
    
    const statusText = {
      missed: 'Missed call',
      rejected: 'Rejected call',
      incoming: 'Incoming call',
      outgoing: 'Outgoing call'
    };
    
    return `${statusText[status]} with ${otherParticipant.name}`;
  };

  return {
    // State
    user,
    filter,
    calls,
    pagination,
    isLoading,
    error,
    showClearConfirm,
    selectedCallId,
    
    // Actions
    setFilter,
    setShowClearConfirm,
    setSelectedCallId,
    handleDeleteCall,
    handleClearAll,
    
    // Computed values
    formatDuration,
    formatDate,
    getCallStatus,
    getCallIcon,
    getOtherParticipant,
    getCallTitle,
    
    // Mutation states
    isDeleting: deleteCallMutation.isPending,
    isClearing: clearAllMutation.isPending,
  };
};
