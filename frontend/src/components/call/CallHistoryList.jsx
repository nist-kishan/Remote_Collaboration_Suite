import React from "react";
import { useCall } from "../../hook/useCallIntegration";
import {
  FilterButtons,
  EmptyState,
  LoadingState,
  ErrorState,
  CallIcon,
  CallInfo,
  CallActions,
  PaginationInfo,
} from "./CallHistoryComponents";

const CallHistory = ({ onStartCall, onViewCallDetails, className = "" }) => {
  const {
    user,
    filter,
    calls,
    pagination,
    isLoading,
    error,
    setFilter,
    handleDeleteCall,
    handleClearAll,
    refetch,
    formatDuration,
    formatDate,
    getCallIcon,
    getOtherParticipant,
    getCallTitle,
    isDeleting,
    isClearing,
  } = useCall();

  // Show loading if user is not loaded yet
  if (isLoading || !user) {
    return <LoadingState className={className} />;
  }

  // Show error if user is not authenticated
  if (!user?._id) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">User not authenticated</p>
          <p className="text-sm text-gray-500">
            Please log in to view call history
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState className={className} onRetry={() => refetch()} />;
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Filter Buttons */}
      <FilterButtons
        filter={filter}
        setFilter={setFilter}
        calls={calls}
        handleClearAll={handleClearAll}
        isClearing={isClearing}
      />

      {/* Call List */}
      <div className="flex-1 overflow-y-auto">
        {calls.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {calls.map((call) => {
              // Skip rendering if user is not available
              if (!user?._id) return null;

              return (
                <div
                  key={call._id}
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {/* Call Icon */}
                  <div className="flex-shrink-0">
                    <CallIcon
                      call={call}
                      currentUserId={user._id}
                      getCallIcon={getCallIcon}
                    />
                  </div>

                  {/* Call Info */}
                  <CallInfo
                    call={call}
                    currentUserId={user._id}
                    getCallTitle={getCallTitle}
                    getOtherParticipant={getOtherParticipant}
                    formatDuration={formatDuration}
                    formatDate={formatDate}
                  />

                  {/* Action Buttons */}
                  <CallActions
                    call={call}
                    currentUserId={user._id}
                    getOtherParticipant={getOtherParticipant}
                    onViewCallDetails={onViewCallDetails}
                    onStartCall={onStartCall}
                    handleDeleteCall={handleDeleteCall}
                    isDeleting={isDeleting}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Info */}
      <PaginationInfo pagination={pagination} calls={calls} />
    </div>
  );
};

export default CallHistory;
