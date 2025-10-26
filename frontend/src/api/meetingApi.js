import ApiClient from './ApiClient';

/**
 * Meeting API - Integrated with backend meeting controller
 * Uses /meetings endpoints from backend
 */
export const meetingApi = {
  // Create instant meeting
  createInstantMeeting: (data) => {
    return ApiClient.post('/meetings/instant', data);
  },

  // Create scheduled meeting
  createScheduledMeeting: (data) => {
    return ApiClient.post('/meetings/scheduled', data);
  },

  // Join meeting
  joinMeeting: (meetingId, password) => {
    return ApiClient.post(`/meetings/${meetingId}/join`, { password });
  },

  // Get meeting participants
  getMeetingParticipants: (meetingId) => {
    return ApiClient.get(`/meetings/${meetingId}/participants`);
  },

  // Update participant status
  updateParticipantStatus: (meetingId, userId, data) => {
    return ApiClient.put(`/meetings/${meetingId}/participants/${userId}`, data);
  },

  // Create meeting
  createMeeting: (projectId, data) => {
    return ApiClient.post(`/projects/${projectId}/meetings`, data);
  },

  // Get project meetings
  getProjectMeetings: (projectId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return ApiClient.get(`/projects/${projectId}/meetings${queryString ? `?${queryString}` : ''}`);
  },

  // Get single meeting
  getMeeting: (meetingId) => {
    return ApiClient.get(`/meetings/${meetingId}`);
  },

  // Update meeting
  updateMeeting: (meetingId, data) => {
    return ApiClient.put(`/meetings/${meetingId}`, data);
  },

  // Delete meeting
  deleteMeeting: (meetingId) => {
    return ApiClient.delete(`/meetings/${meetingId}`);
  },

  // Invite attendees
  inviteAttendees: (meetingId, data) => {
    return ApiClient.post(`/meetings/${meetingId}/invite`, data);
  },

  // Accept meeting
  acceptMeeting: (meetingId) => {
    return ApiClient.post(`/meetings/${meetingId}/accept`);
  },

  // Reject meeting
  rejectMeeting: (meetingId) => {
    return ApiClient.post(`/meetings/${meetingId}/reject`);
  },

  // Start meeting
  startMeeting: (meetingId) => {
    return ApiClient.post(`/meetings/${meetingId}/start`);
  },

  // End meeting
  endMeeting: (meetingId) => {
    return ApiClient.post(`/meetings/${meetingId}/end`);
  },

  // Get user meetings
  getUserMeetings: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return ApiClient.get(`/meetings${queryString ? `?${queryString}` : ''}`);
  }
};
