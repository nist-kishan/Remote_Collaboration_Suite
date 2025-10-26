import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Video, Calendar, Users, Lock, Globe, Plus, Search } from 'lucide-react';
import { useMeeting } from '../../hook/useMeeting';
import MeetingCreateModal from '../../components/meeting/MeetingCreateModal';
import MeetingJoinModal from '../../components/meeting/MeetingJoinModal';
import MeetingDetailsModal from '../../components/meeting/MeetingDetailsModal';
import CustomButton from '../../components/ui/CustomButton';
import CustomInput from '../../components/ui/CustomInput';

const MeetingsList = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const {
    meetings,
    isLoading,
    handleCreateInstantMeeting,
    handleCreateScheduledMeeting,
    handleJoinMeeting,
    handleDeleteMeeting,
    handleOpenCreateMeetingModal,
    handleCloseCreateMeetingModal,
    handleOpenJoinMeetingModal,
    handleCloseJoinMeetingModal,
    showCreateMeetingModal,
    showJoinMeetingModal,
    activeTab,
    setActiveTab
  } = useMeeting();

  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  // Filter meetings based on active tab and search
  const filteredMeetings = (meetings || []).filter(meeting => {
    // Filter by type based on active tab
    if (activeTab === 'instant') return meeting.meetingType === 'instant';
    if (activeTab === 'scheduled') return meeting.meetingType === 'scheduled';
    return true;
  }).filter(meeting => {
    // Filter by search query
    const title = meeting.title || 'Meeting';
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleCreateMeeting = async (data, type) => {
    if (type === 'instant') {
      await handleCreateInstantMeeting(data);
    } else {
      await handleCreateScheduledMeeting(data);
    }
    handleCloseCreateMeetingModal();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Check if scheduled meeting can be joined
  const canJoinScheduledMeeting = (meeting) => {
    if (meeting.meetingType !== 'scheduled') return true;
    
    const now = new Date();
    const startTime = new Date(meeting.startTime);
    const endTime = new Date(meeting.endTime);
    
    // Can join 10 minutes before start time
    const tenMinutesBeforeStart = new Date(startTime.getTime() - 10 * 60 * 1000);
    
    return now >= tenMinutesBeforeStart && now <= endTime;
  };

  // Get meeting status label
  const getMeetingStatusLabel = (meeting) => {
    if (meeting.meetingType === 'instant') {
      return meeting.status === 'in_progress' ? 'LIVE' : 'Ended';
    } else {
      const now = new Date();
      const startTime = new Date(meeting.startTime);
      const endTime = new Date(meeting.endTime);
      
      if (now < startTime) return 'Scheduled';
      if (now >= startTime && now <= endTime) return 'LIVE';
      return 'Ended';
    }
  };

  // Get status color
  const getStatusColor = (meeting) => {
    const status = getMeetingStatusLabel(meeting);
    if (status === 'LIVE') return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (status === 'Scheduled') return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Meetings</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your meetings and collaborate with your team
              </p>
            </div>
            <div className="flex gap-2">
              <CustomButton
                onClick={handleOpenJoinMeetingModal}
                variant="outline"
                className="flex items-center gap-2"
              >
                Join Meeting
              </CustomButton>
              <CustomButton
                onClick={handleOpenCreateMeetingModal}
                variant="primary"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Meeting
              </CustomButton>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            
            <CustomInput
              type="text"
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex overflow-x-auto space-x-4 sm:space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('all')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              All Meetings
            </button>
            <button
              onClick={() => setActiveTab('instant')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'instant'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Video className="w-4 h-4" />
              Instant
            </button>
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'scheduled'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Scheduled
            </button>
          </nav>
        </div>

        {/* Meetings List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading meetings...</p>
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="text-center py-12">
            <Video className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No meetings found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Create your first meeting to get started'}
            </p>
            {!searchQuery && (
              <CustomButton onClick={handleOpenCreateMeetingModal} variant="primary">
                Create Meeting
              </CustomButton>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMeetings.map((meeting) => (
              <div
                key={meeting._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {meeting.meetingType === 'instant' ? (
                      <Video className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    ) : (
                      <Calendar className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    )}
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {meeting.title}
                    </h3>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {/* Meeting Status Badge */}
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(meeting)}`}>
                      {getMeetingStatusLabel(meeting)}
                    </span>
                  </div>
                </div>

                {/* Access Type Badge */}
                <div className="flex gap-2 mb-3">
                  {meeting.accessType === 'public' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <Globe className="w-3 h-3" />
                      Public
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                      <Lock className="w-3 h-3" />
                      Private
                    </span>
                  )}
                  {meeting.meetingType === 'instant' && (
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Instant
                    </span>
                  )}
                </div>

                {meeting.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {meeting.description}
                  </p>
                )}

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>{meeting.currentParticipants || 0} / {meeting.maxParticipants} participants</span>
                  </div>
                  {meeting.meetingType === 'scheduled' && (
                    <>
                      <div className="text-gray-600 dark:text-gray-400">
                        <strong>Start:</strong> {formatDate(meeting.startTime)}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        <strong>End:</strong> {formatDate(meeting.endTime)}
                      </div>
                    </>
                  )}
                  <div className="text-gray-600 dark:text-gray-400">
                    <strong>Organizer:</strong> {meeting.organizer?.name || 'Unknown'}
                  </div>
                  {meeting.accessType === 'private' && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Lock className="w-4 h-4" />
                      <span>Password required</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {getMeetingStatusLabel(meeting) !== 'Ended' ? (
                    <CustomButton
                      onClick={() => navigate(`/meeting/${meeting.meetingId}`)}
                      variant="primary"
                      className="flex-1 text-sm"
                      disabled={!canJoinScheduledMeeting(meeting)}
                      title={!canJoinScheduledMeeting(meeting) ? 'Meeting starts in ' + formatDate(meeting.startTime) : 'Join meeting'}
                    >
                      {canJoinScheduledMeeting(meeting) ? 'Join Meeting' : 'Not Started'}
                    </CustomButton>
                  ) : (
                    <CustomButton
                      onClick={() => {
                        setSelectedMeeting(meeting);
                        setShowDetailsModal(true);
                      }}
                      variant="outline"
                      className="flex-1 text-sm"
                    >
                      View Details
                    </CustomButton>
                  )}
                  {meeting.organizer?._id === user?.id && (
                    <CustomButton
                      onClick={() => handleDeleteMeeting(meeting._id)}
                      variant="outline"
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Delete
                    </CustomButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modals */}
        <MeetingCreateModal
          isOpen={showCreateMeetingModal}
          onClose={handleCloseCreateMeetingModal}
          onCreateMeeting={handleCreateMeeting}
        />

        <MeetingJoinModal
          isOpen={showJoinMeetingModal}
          onClose={handleCloseJoinMeetingModal}
          onJoinMeeting={handleJoinMeeting}
        />

        <MeetingDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedMeeting(null);
          }}
          meeting={selectedMeeting}
        />
      </div>
    </div>
  );
};

export default MeetingsList;
