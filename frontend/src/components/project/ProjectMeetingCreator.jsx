import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Calendar, Clock, Users, MapPin, Video, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { meetingApi } from '../../api/meetingApi';
import { projectApi } from '../../api/projectApi';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const CreateMeetingModal = ({ isOpen, onClose, projectId }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    meetingUrl: '',
    meetingId: '',
    password: '',
    type: 'team_meeting',
    attendees: []
  });
  const [agendaItems, setAgendaItems] = useState(['']);

  // Fetch project members
  const { data: projectData } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectApi.getProject(projectId),
    enabled: !!projectId
  });

  const createMeetingMutation = useMutation({
    mutationFn: (data) => meetingApi.createMeeting(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['project-meetings', projectId]);
      toast.success('Meeting created successfully');
      onClose();
      setFormData({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        location: '',
        meetingUrl: '',
        meetingId: '',
        password: '',
        type: 'team_meeting',
        attendees: []
      });
      setAgendaItems(['']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create meeting');
    }
  });

  const project = projectData?.data?.project;
  const teamMembers = project?.team || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Meeting title is required');
      return;
    }

    if (!formData.startTime || !formData.endTime) {
      toast.error('Start time and end time are required');
      return;
    }

    if (new Date(formData.endTime) <= new Date(formData.startTime)) {
      toast.error('End time must be after start time');
      return;
    }

    const meetingData = {
      ...formData,
      agenda: agendaItems.filter(item => item.trim()).map(item => ({ item: item.trim() }))
    };

    createMeetingMutation.mutate(meetingData);
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleAgendaChange = (index, value) => {
    const newAgendaItems = [...agendaItems];
    newAgendaItems[index] = value;
    setAgendaItems(newAgendaItems);
  };

  const addAgendaItem = () => {
    setAgendaItems([...agendaItems, '']);
  };

  const removeAgendaItem = (index) => {
    if (agendaItems.length > 1) {
      setAgendaItems(agendaItems.filter((_, i) => i !== index));
    }
  };

  const handleAttendeeToggle = (userId) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.includes(userId)
        ? prev.attendees.filter(id => id !== userId)
        : [...prev.attendees, userId]
    }));
  };

  const typeOptions = [
    { value: 'team_meeting', label: 'Team Meeting' },
    { value: 'client_meeting', label: 'Client Meeting' },
    { value: 'review', label: 'Review' },
    { value: 'planning', label: 'Planning' },
    { value: 'standup', label: 'Standup' },
    { value: 'other', label: 'Other' }
  ];

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Schedule Meeting
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create a new meeting for your project
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meeting Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter meeting title"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the meeting (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Start Time *
              </label>
              <input
                type="datetime-local"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                End Time *
              </label>
              <input
                type="datetime-local"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meeting Type
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Meeting location (optional)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="meetingUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Video className="w-4 h-4 inline mr-1" />
                Meeting URL
              </label>
              <input
                type="url"
                id="meetingUrl"
                name="meetingUrl"
                value={formData.meetingUrl}
                onChange={handleChange}
                placeholder="https://zoom.us/j/..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="meetingId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meeting ID
              </label>
              <input
                type="text"
                id="meetingId"
                name="meetingId"
                value={formData.meetingId}
                onChange={handleChange}
                placeholder="Meeting ID (optional)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meeting Password
              </label>
              <input
                type="text"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Meeting password (optional)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Agenda */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <FileText className="w-4 h-4 inline mr-1" />
                Agenda
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAgendaItem}
              >
                Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {agendaItems.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleAgendaChange(index, e.target.value)}
                    placeholder={`Agenda item ${index + 1}`}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {agendaItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAgendaItem(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Attendees */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <Users className="w-4 h-4 inline mr-1" />
              Attendees
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {teamMembers.map((member) => (
                <label key={member.user._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.attendees.includes(member.user._id)}
                    onChange={() => handleAttendeeToggle(member.user._id)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                      {member.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {member.user.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {member.role}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={createMeetingMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={createMeetingMutation.isLoading}
            >
              Schedule Meeting
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CreateMeetingModal;
