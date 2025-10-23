import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, FileText, Settings, Sparkles, CheckCircle, AlertCircle, Palette, Users, Share2, Save, Clock, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import CustomButton from '../../components/ui/CustomButton';
import CustomInput from '../../components/ui/CustomInput';
import CustomCard from '../../components/ui/CustomCard';
import { useDocument } from '../../hook/useDocument';

export default function NewDocument() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    content: '',
    settings: {
      visibility: 'private',
      status: 'draft',
      autoSave: true,
      fontSize: 16,
      fontFamily: 'Inter',
    },
    collaborationSettings: {
      autoSave: true,
      autoSaveInterval: 30000, // 30 seconds
      allowAnonymousView: false,
      maxCollaborators: 50,
      allowComments: true,
      allowReactions: true,
      requireApprovalForJoin: false,
    },
    visibility: 'private',
    status: 'draft',
    invitedUsers: [],
    defaultRole: 'viewer'
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use the document hook with navigation enabled
  const { handleCreateDocument, isCreating } = useDocument(null, { shouldNavigateAfterCreate: true });

  const handleInputChange = (field, value) => {
    if (field.startsWith('settings.')) {
      const setting = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [setting]: value
        }
      }));
    } else if (field.startsWith('collaborationSettings.')) {
      const setting = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        collaborationSettings: {
          ...prev.collaborationSettings,
          [setting]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Collaboration functions
  const addInvitedUser = (email, role = 'viewer') => {
    if (!email.trim()) return;
    
    const userExists = formData.invitedUsers.find(user => user.email === email.trim());
    if (userExists) {
      toast.error('User already invited');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      invitedUsers: [...prev.invitedUsers, { email: email.trim(), role }]
    }));
  };

  const removeInvitedUser = (email) => {
    setFormData(prev => ({
      ...prev,
      invitedUsers: prev.invitedUsers.filter(user => user.email !== email)
    }));
  };

  const updateInvitedUserRole = (email, newRole) => {
    setFormData(prev => ({
      ...prev,
      invitedUsers: prev.invitedUsers.map(user => 
        user.email === email ? { ...user, role: newRole } : user
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate form
      if (!formData.title.trim()) {
        toast.error('Document title is required');
        return;
      }

      if (formData.title.trim().length < 3) {
        toast.error('Title must be at least 3 characters long');
        return;
      }

      if (formData.title.trim().length > 100) {
        toast.error('Title must be less than 100 characters');
        return;
      }

      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await handleCreateDocument({
        title: formData.title.trim(),
        content: formData.content,
        tags: tagsArray,
        status: formData.status,
        visibility: formData.visibility,
        collaborationSettings: formData.collaborationSettings,
        invitedUsers: formData.invitedUsers
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/documents');
  };

  const documentTemplates = [
    { name: 'Blank', icon: '📄', description: 'Start with a clean slate' },
    { name: 'Meeting Notes', icon: '📝', description: 'Structured meeting documentation' },
    { name: 'Project Plan', icon: '📋', description: 'Project planning template' },
    { name: 'Report', icon: '📊', description: 'Professional report format' },
  ];

  const fontFamilies = [
    { name: 'Inter', value: 'Inter' },
    { name: 'Roboto', value: 'Roboto' },
    { name: 'Open Sans', value: 'Open Sans' },
    { name: 'Lato', value: 'Lato' },
    { name: 'Poppins', value: 'Poppins' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Simple Background Pattern */}
      <div className="absolute inset-0 opacity-30 dark:opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239ca3af' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-indigo-600 dark:bg-indigo-500 rounded-2xl shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">
                Create Document
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Create your perfect document with custom settings and professional templates
            </p>
          </div>

          {/* Back Button */}
          <div className="mb-6">
            <CustomButton
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-600 dark:text-gray-300 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </CustomButton>
          </div>

          {/* Main Form Card */}
          <CustomCard className="p-6 sm:p-8 shadow-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 mb-8">
              <button
                onClick={() => setActiveTab('basic')}
                className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                  activeTab === 'basic'
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border dark:border-indigo-700'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
              >
                <CheckCircle className="w-4 h-4 inline mr-1" />
                Basic
              </button>
              <button
                onClick={() => setActiveTab('template')}
                className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                  activeTab === 'template'
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border dark:border-indigo-700'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-1" />
                Template
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                  activeTab === 'settings'
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border dark:border-indigo-700'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-1" />
                Settings
              </button>
              <button
                onClick={() => setActiveTab('collaboration')}
                className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                  activeTab === 'collaboration'
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border dark:border-indigo-700'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
              >
                <Users className="w-4 h-4 inline mr-1" />
                Collaboration
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Title */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Document Title *
                    </label>
                    <CustomInput
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Enter a descriptive title for your document"
                      className="text-lg py-3 px-4 border-2 border-gray-200 dark:border-gray-600 focus:border-indigo-500 transition-colors"
                      required
                    />
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <AlertCircle className="w-3 h-3" />
                      <span>{formData.title.length}/100 characters</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe what this document will contain..."
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-colors"
                    />
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Tags
                    </label>
                    <CustomInput
                      type="text"
                      value={formData.tags}
                      onChange={(e) => handleInputChange('tags', e.target.value)}
                      placeholder="documentation, project, meeting, report..."
                      className="py-3 px-4 border-2 border-gray-200 dark:border-gray-600 focus:border-indigo-500 transition-colors"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Separate multiple tags with commas
                    </p>
                  </div>

                  {/* Initial Content */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Initial Content
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => handleInputChange('content', e.target.value)}
                      placeholder="Start writing your document content here..."
                      rows={6}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Template Tab */}
              {activeTab === 'template' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Choose a Template
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {documentTemplates.map((template) => (
                        <button
                          key={template.name}
                          type="button"
                          onClick={() => {
                            // Set template-specific content
                            if (template.name === 'Meeting Notes') {
                              setFormData(prev => ({
                                ...prev,
                                content: '# Meeting Notes\n\n**Date:** \n**Attendees:** \n\n## Agenda\n\n## Discussion Points\n\n## Action Items\n\n## Next Steps'
                              }));
                            } else if (template.name === 'Project Plan') {
                              setFormData(prev => ({
                                ...prev,
                                content: '# Project Plan\n\n## Overview\n\n## Objectives\n\n## Timeline\n\n## Resources\n\n## Risks\n\n## Success Metrics'
                              }));
                            } else if (template.name === 'Report') {
                              setFormData(prev => ({
                                ...prev,
                                content: '# Report\n\n## Executive Summary\n\n## Introduction\n\n## Methodology\n\n## Findings\n\n## Conclusion\n\n## Recommendations'
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                content: ''
                              }));
                            }
                          }}
                          className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all duration-200 text-left"
                        >
                          <div className="text-2xl mb-2">{template.icon}</div>
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{template.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{template.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Visibility */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Visibility
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="visibility"
                          value="private"
                          checked={formData.settings.visibility === 'private'}
                          onChange={(e) => handleInputChange('settings.visibility', e.target.value)}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Private</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="visibility"
                          value="shared"
                          checked={formData.settings.visibility === 'shared'}
                          onChange={(e) => handleInputChange('settings.visibility', e.target.value)}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Shared</span>
                      </label>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Initial Status
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="status"
                          value="draft"
                          checked={formData.settings.status === 'draft'}
                          onChange={(e) => handleInputChange('settings.status', e.target.value)}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Draft</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="status"
                          value="published"
                          checked={formData.settings.status === 'published'}
                          onChange={(e) => handleInputChange('settings.status', e.target.value)}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Published</span>
                      </label>
                    </div>
                  </div>

                  {/* Auto Save */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-700 dark:text-gray-300">Auto Save</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Automatically save changes as you type</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.settings.autoSave}
                        onChange={(e) => handleInputChange('settings.autoSave', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* Collaboration Tab */}
              {activeTab === 'collaboration' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Visibility Settings */}
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Visibility & Access
                    </label>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Document Visibility
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                            <input
                              type="radio"
                              name="visibility"
                              value="private"
                              checked={formData.visibility === 'private'}
                              onChange={(e) => handleInputChange('visibility', e.target.value)}
                              className="mr-3"
                            />
                            <div>
                              <div className="font-medium text-gray-700 dark:text-gray-300">Private</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Only you can access</div>
                            </div>
                          </label>
                          <label className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                            <input
                              type="radio"
                              name="visibility"
                              value="shared"
                              checked={formData.visibility === 'shared'}
                              onChange={(e) => handleInputChange('visibility', e.target.value)}
                              className="mr-3"
                            />
                            <div>
                              <div className="font-medium text-gray-700 dark:text-gray-300">Shared</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Collaborators can access</div>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Initial Status
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                            <input
                              type="radio"
                              name="status"
                              value="draft"
                              checked={formData.status === 'draft'}
                              onChange={(e) => handleInputChange('status', e.target.value)}
                              className="mr-3"
                            />
                            <div>
                              <div className="font-medium text-gray-700 dark:text-gray-300">Draft</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Work in progress</div>
                            </div>
                          </label>
                          <label className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                            <input
                              type="radio"
                              name="status"
                              value="published"
                              checked={formData.status === 'published'}
                              onChange={(e) => handleInputChange('status', e.target.value)}
                              className="mr-3"
                            />
                            <div>
                              <div className="font-medium text-gray-700 dark:text-gray-300">Published</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Ready for collaboration</div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Auto-save Settings */}
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Auto-save Settings
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-700 dark:text-gray-300">Enable Auto-save</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Automatically save changes</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.collaborationSettings.autoSave}
                            onChange={(e) => handleInputChange('collaborationSettings.autoSave', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                      
                      {formData.collaborationSettings.autoSave && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Auto-save Interval (seconds)
                          </label>
                          <CustomInput
                            type="number"
                            value={formData.collaborationSettings.autoSaveInterval / 1000}
                            onChange={(e) => handleInputChange('collaborationSettings.autoSaveInterval', parseInt(e.target.value) * 1000)}
                            min="5"
                            max="300"
                            className="py-3 px-4 border-2 border-gray-200 dark:border-gray-600 focus:border-indigo-500 transition-colors"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Collaboration Features */}
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Collaboration Features
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-700 dark:text-gray-300">Allow Comments</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Users can add comments</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.collaborationSettings.allowComments}
                            onChange={(e) => handleInputChange('collaborationSettings.allowComments', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-700 dark:text-gray-300">Allow Reactions</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Users can react to content</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.collaborationSettings.allowReactions}
                            onChange={(e) => handleInputChange('collaborationSettings.allowReactions', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-700 dark:text-gray-300">Require Approval</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Approve new collaborators</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.collaborationSettings.requireApprovalForJoin}
                            onChange={(e) => handleInputChange('collaborationSettings.requireApprovalForJoin', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Maximum Collaborators
                        </label>
                        <CustomInput
                          type="number"
                          value={formData.collaborationSettings.maxCollaborators}
                          onChange={(e) => handleInputChange('collaborationSettings.maxCollaborators', parseInt(e.target.value))}
                          min="1"
                          max="100"
                          className="py-3 px-4 border-2 border-gray-200 dark:border-gray-600 focus:border-indigo-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Invite Users */}
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Invite Collaborators
                    </label>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <CustomInput
                          type="email"
                          placeholder="Enter email address"
                          className="flex-1 py-3 px-4 border-2 border-gray-200 dark:border-gray-600 focus:border-indigo-500 transition-colors"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addInvitedUser(e.target.value, formData.defaultRole);
                              e.target.value = '';
                            }
                          }}
                        />
                        <select
                          value={formData.defaultRole}
                          onChange={(e) => handleInputChange('defaultRole', e.target.value)}
                          className="px-3 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-indigo-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                        </select>
                        <CustomButton
                          type="button"
                          onClick={() => {
                            const input = document.querySelector('input[type="email"]');
                            if (input) {
                              addInvitedUser(input.value, formData.defaultRole);
                              input.value = '';
                            }
                          }}
                          className="px-4 py-3 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </CustomButton>
                      </div>

                      {formData.invitedUsers.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Invited Users ({formData.invitedUsers.length})
                          </div>
                          <div className="space-y-2">
                            {formData.invitedUsers.map((user, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
                                    <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-700 dark:text-gray-300">{user.email}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user.role}</div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <select
                                    value={user.role}
                                    onChange={(e) => updateInvitedUserRole(user.email, e.target.value)}
                                    className="px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded focus:border-indigo-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                  >
                                    <option value="viewer">Viewer</option>
                                    <option value="editor">Editor</option>
                                  </select>
                                  <button
                                    onClick={() => removeInvitedUser(user.email)}
                                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                  >
                                    <AlertCircle className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {formData.title ? `Creating "${formData.title}"` : 'Ready to create your document'}
                </div>
                <div className="flex items-center gap-3">
                  <CustomButton
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="px-6 py-3"
                  >
                    Cancel
                  </CustomButton>
                  <CustomButton
                    type="submit"
                    loading={isCreating || isSubmitting}
                    disabled={!formData.title.trim() || isCreating || isSubmitting}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    {isCreating || isSubmitting ? 'Creating...' : 'Create'}
                  </CustomButton>
                </div>
              </div>
            </form>
          </CustomCard>
        </div>
      </div>
    </div>
  );
}
