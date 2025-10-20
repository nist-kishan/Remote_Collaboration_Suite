import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CallHistoryList from '../components/call/CallHistoryList';
import CallHistoryDetailsModal from '../components/call/CallHistoryDetailsModal';
import CustomButton from '../components/ui/CustomButton';

const CallHistoryPage = () => {
  const navigate = useNavigate();
  const [selectedCall, setSelectedCall] = useState(null);
  const [showCallDetails, setShowCallDetails] = useState(false);

  const handleStartCall = (userId) => {
    navigate(`/chat/${userId}`);
  };

  const handleViewCallDetails = (call) => {
    setSelectedCall(call);
    setShowCallDetails(true);
  };

  const handleCloseCallDetails = () => {
    setShowCallDetails(false);
    setSelectedCall(null);
  };

  const handleBack = () => {
    navigate('/chat');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <CustomButton
            onClick={handleBack}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </CustomButton>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
            Call History
          </h1>
        </div>
      </div>

      {/* Call History Content */}
      <div className="flex-1 overflow-hidden">
        <CallHistoryList
          onStartCall={handleStartCall}
          onViewCallDetails={handleViewCallDetails}
          className="h-full"
        />
      </div>

      {/* Call Details Modal */}
      <CallHistoryDetailsModal
        call={selectedCall}
        isVisible={showCallDetails}
        onClose={handleCloseCallDetails}
      />
    </div>
  );
};

export default CallHistoryPage;
