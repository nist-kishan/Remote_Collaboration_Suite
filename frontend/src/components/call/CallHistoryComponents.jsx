import React from 'react';
import { Phone, Video, VideoOff, Clock, Users, Trash2, Eye } from 'lucide-react';
import UserAvatar from '../ui/UserAvatar';
import Button from '../ui/Button';

// Call Icon Component
export const CallIcon = ({ call, currentUserId, getCallIcon }) => {
  const iconType = getCallIcon(call, currentUserId);
  
  if (iconType === 'missed') {
    return <VideoOff className="w-5 h-5 text-red-500" />;
  }
  
  return <Video className="w-5 h-5 text-green-500" />;
};

// Call Info Component
export const CallInfo = ({ call, currentUserId, getCallTitle, getOtherParticipant, formatDuration, formatDate }) => {
  const otherParticipant = getOtherParticipant(call, currentUserId);
  
  return (
    <div className="flex-1 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-1">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {getCallTitle(call, currentUserId)}
        </h3>
        <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Clock className="w-3 h-3 flex-shrink-0" />
          <span className="whitespace-nowrap">{formatDuration(call.duration)}</span>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {otherParticipant.isGroup ? (
            <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
          ) : (
            <UserAvatar user={otherParticipant} size="xs" />
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {call.type === 'group' ? `${call.participants.length} participants` : otherParticipant.name}
          </span>
        </div>
        
        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {formatDate(call.startedAt)}
        </span>
      </div>
    </div>
  );
};

// Action Buttons Component
export const CallActions = ({ 
  call, 
  currentUserId, 
  getOtherParticipant, 
  onViewCallDetails, 
  onStartCall, 
  handleDeleteCall, 
  isDeleting 
}) => {
  const otherParticipant = getOtherParticipant(call, currentUserId);
  
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      {/* View Details */}
      {onViewCallDetails && (
        <Button
          onClick={() => onViewCallDetails(call)}
          size="sm"
          variant="ghost"
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          title="View call details"
        >
          <Eye className="w-4 h-4" />
        </Button>
      )}
      
      {/* Start New Call */}
      {!otherParticipant.isGroup && onStartCall && (
        <Button
          onClick={() => onStartCall(otherParticipant._id)}
          size="sm"
          variant="outline"
          title="Start new call"
        >
          <Video className="w-4 h-4" />
        </Button>
      )}
      
      {/* Delete Call */}
      <Button
        onClick={() => handleDeleteCall(call._id)}
        size="sm"
        variant="ghost"
        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
        title="Delete call"
        disabled={isDeleting}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
};

// Filter Buttons Component
export const FilterButtons = ({ filter, setFilter, calls, handleClearAll, isClearing }) => {
  const filterOptions = [
    { key: 'all', label: 'All' },
    { key: 'missed', label: 'Missed' },
    { key: 'outgoing', label: 'Outgoing' },
    { key: 'incoming', label: 'Incoming' }
  ];

  return (
    <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {filterOptions.map(({ key, label }) => (
            <Button
              key={key}
              onClick={() => setFilter(key)}
              variant={filter === key ? 'primary' : 'outline'}
              size="sm"
              className="text-xs flex-shrink-0"
            >
              {label}
            </Button>
          ))}
        </div>
        
        {/* Clear All Button */}
        {calls.length > 0 && (
          <Button
            onClick={handleClearAll}
            variant="outline"
            size="sm"
            className="text-xs text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
            disabled={isClearing}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>
    </div>
  );
};

// Empty State Component
export const EmptyState = ({ filter }) => (
  <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-8">
    <Phone className="w-12 h-12 mb-4 opacity-50" />
    <p className="text-lg font-semibold mb-2">No calls yet</p>
    <p className="text-sm text-center">
      {filter === 'all' 
        ? 'Your call history will appear here' 
        : `No ${filter} calls found`
      }
    </p>
  </div>
);

// Loading State Component
export const LoadingState = ({ className }) => (
  <div className={`p-4 ${className}`}>
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <span className="ml-2 text-gray-600 dark:text-gray-400">Loading call history...</span>
    </div>
  </div>
);

// Error State Component
export const ErrorState = ({ className, onRetry }) => (
  <div className={`p-4 ${className}`}>
    <div className="text-center py-8">
      <p className="text-red-500 mb-4">Failed to load call history</p>
      <Button onClick={onRetry} variant="outline" size="sm">
        Retry
      </Button>
    </div>
  </div>
);

// Pagination Info Component
export const PaginationInfo = ({ pagination, calls }) => {
  if (!pagination || pagination.total <= 0) return null;
  
  return (
    <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-center">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Showing {calls.length} of {pagination.total} calls
      </p>
    </div>
  );
};
