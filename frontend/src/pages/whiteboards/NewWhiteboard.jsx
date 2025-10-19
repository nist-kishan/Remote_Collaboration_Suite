import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Plus, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { createWhiteboard } from '../../api/whiteboardApi';

export default function NewWhiteboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    canvasSettings: {
      width: 1920,
      height: 1080,
      backgroundColor: '#ffffff',
      gridSize: 20,
      showGrid: true,
    }
  });

  // Create whiteboard mutation
  const createWhiteboardMutation = useMutation({
    mutationFn: createWhiteboard,
    onSuccess: (data) => {
      toast.success('Whiteboard created successfully!');
      queryClient.invalidateQueries(['whiteboards']);
      // Navigate to the newly created whiteboard
      navigate(`/boards/${data.data.whiteboard._id}`);
    },
    onError: (error) => {
      toast.error(error?.data?.message || 'Failed to create whiteboard');
    },
  });

  const handleInputChange = (field, value) => {
    if (field.startsWith('canvasSettings.')) {
      const setting = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        canvasSettings: {
          ...prev.canvasSettings,
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Whiteboard title is required');
      return;
    }

    const tagsArray = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    createWhiteboardMutation.mutate({
      title: formData.title.trim(),
      description: formData.description.trim(),
      tags: tagsArray,
      canvasSettings: formData.canvasSettings
    });
  };

  const handleBack = () => {
    navigate('/boards');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      ></div>
      
      {/* Main Content */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Create New Whiteboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Set up your whiteboard and start collaborating
              </p>
            </div>
          </div>

          {/* Form */}
          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Whiteboard Title *
                </label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter whiteboard title"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your whiteboard (optional)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                <Input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="Enter tags separated by commas (e.g., design, brainstorming, project)"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Separate multiple tags with commas
                </p>
              </div>

              {/* Canvas Settings */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Canvas Settings
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Width */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Width (px)
                    </label>
                    <Input
                      type="number"
                      value={formData.canvasSettings.width}
                      onChange={(e) => handleInputChange('canvasSettings.width', parseInt(e.target.value))}
                      min="800"
                      max="4000"
                    />
                  </div>

                  {/* Height */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Height (px)
                    </label>
                    <Input
                      type="number"
                      value={formData.canvasSettings.height}
                      onChange={(e) => handleInputChange('canvasSettings.height', parseInt(e.target.value))}
                      min="600"
                      max="3000"
                    />
                  </div>

                  {/* Background Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Background Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.canvasSettings.backgroundColor}
                        onChange={(e) => handleInputChange('canvasSettings.backgroundColor', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600"
                      />
                      <Input
                        type="text"
                        value={formData.canvasSettings.backgroundColor}
                        onChange={(e) => handleInputChange('canvasSettings.backgroundColor', e.target.value)}
                        placeholder="#ffffff"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Grid Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Grid Size (px)
                    </label>
                    <Input
                      type="number"
                      value={formData.canvasSettings.gridSize}
                      onChange={(e) => handleInputChange('canvasSettings.gridSize', parseInt(e.target.value))}
                      min="10"
                      max="100"
                    />
                  </div>
                </div>

                {/* Show Grid */}
                <div className="mt-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.canvasSettings.showGrid}
                      onChange={(e) => handleInputChange('canvasSettings.showGrid', e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Show grid
                    </span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={createWhiteboardMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Whiteboard
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
