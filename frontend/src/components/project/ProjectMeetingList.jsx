import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar, Clock, Users, Video, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { meetingApi } from '../../api/meetingApi';
import CustomButton from '../ui/CustomButton';
import CustomCard from '../ui/CustomCard';
import CustomModal from '../ui/CustomModal';
import ProjectMeetingCreator from './ProjectMeetingCreator';

const ProjectMeetings = ({ project }) => {
  const queryClient = useQueryClient();
  const [showCreateMeeting, setShowCreateMeeting] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  // Fetch project meetings
  const { data: meetingsData, isLoading } = useQuery({
    queryKey: ['project-meetings', project._id],
    queryFn: () => meetingApi.getProjectMeetings(project._id)
  });

  // Delete meeting mutation
  const deleteMeetingMutation = useMutation({
    mutationFn: meetingApi.deleteMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries(['project-meetings', project._id]);
      toast.success('Meeting deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete meeting');
    }
  });

  const meetings = meetingsData?.data?.meetings || [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in_progress':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'postponed':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'team_meeting':
        return <Users className="w-4 h-4" />;
      case 'client_meeting':
        return <Users className="w-4 h-4" />;
      case 'review':
        return <Video className="w-4 h-4" />;
      case 'planning':
        return <Calendar className="w-4 h-4" />;
      case 'standup':
        return <Clock className="w-4 h-4" />;
      default:
        return <Video className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUpcoming = (meeting) => {
    return new Date(meeting.startTime) > new Date();
  };

  const handleDeleteMeeting = (meeting) => {
    deleteMeetingMutation.mutate(meeting._id);
  };

  const handleJoinMeeting = (meeting) => {
    if (meeting.meetingUrl) {
      window.open(meeting.meetingUrl, '_blank');
    } else {
      toast.error('Meeting URL not available');
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Project Meetings ({meetings.length})
        </h3>
        <CustomButton onClick={() => setShowCreateMeeting(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Schedule Meeting
        </CustomButton>
      </div>

      {meetings.length === 0 ? (
        <CustomCard className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No meetings scheduled
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Schedule your first meeting to get started
          </p>
          <CustomButton onClick={() => setShowCreateMeeting(true)}>
            Schedule Meeting
          </CustomButton>
        </CustomCard>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <CustomCard key={meeting._id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getTypeIcon(meeting.type)}
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {meeting.title}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>
                      {meeting.status.replace('_', ' ')}
                    </span>
                  </div>

                  {meeting.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {meeting.description}
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(meeting.startTime)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{meeting.duration} minutes</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{meeting.attendees?.length || 0} attendees</span>
                    </div>

                    {meeting.location && (
                      <div className="flex items-center gap-2">
                        <span>📍</span>
                        <span>{meeting.location}</span>
                      </div>
                    )}
                  </div>

                  {meeting.agenda && meeting.agenda.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Agenda:
                      </h5>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {meeting.agenda.slice(0, 3).map((item, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                            {item.item}
                          </li>
                        ))}
                        {meeting.agenda.length > 3 && (
                          <li className="text-xs text-gray-500">
                            +{meeting.agenda.length - 3} more items
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {isUpcoming(meeting) && meeting.meetingUrl && (
                    <CustomButton
                      size="sm"
                      onClick={() => handleJoinMeeting(meeting)}
                      className="flex items-center gap-1"
                    >
                      <Video className="w-3 h-3" />
                      Join
                    </CustomButton>
                  )}
                  
                  <div className="relative">
                    <button
                      onClick={() => setSelectedMeeting(selectedMeeting === meeting ? null : meeting)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {selectedMeeting === meeting && (
                      <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10 min-w-32">
                        <button
                          onClick={() => {
                            setSelectedMeeting(null);
                            // Handle edit meeting
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMeeting(null);
                            handleDeleteMeeting(meeting);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CustomCard>
          ))}
        </div>
      )}

      {/* Create Meeting Modal */}
      <ProjectMeetingCreator
        isOpen={showCreateMeeting}
        onClose={() => setShowCreateMeeting(false)}
        projectId={project._id}
      />
    </div>
  );
};

export default ProjectMeetings;
