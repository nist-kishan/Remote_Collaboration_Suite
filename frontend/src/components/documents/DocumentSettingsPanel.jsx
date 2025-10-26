import React from "react";
import { X, Users } from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/CustomInput";

const DocumentSettingsModal = ({
  isOpen,
  onClose,
  document,
  status,
  visibility,
  tags,
  onStatusChange,
  onVisibilityChange,
  onTagsChange
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Document Settings
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Status
            </label>
            <select
              value={status}
              onChange={onStatusChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Visibility
            </label>
            <select
              value={visibility}
              onChange={onVisibilityChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              <option value="private">Private</option>
              <option value="shared">Shared</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Tags
            </label>
            <Input
              placeholder="Enter tags separated by commas"
              value={tags}
              onChange={onTagsChange}
              className="w-full"
            />
          </div>

          {/* Collaborators */}
          {document && document.collaborators && document.collaborators.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Collaborators ({document.collaborators.length})
              </label>
              <div className="space-y-3 max-h-32 overflow-y-auto">
                {document.collaborators.map((collaborator, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {collaborator.user?.name?.charAt(0) || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                        {collaborator.user?.name || "Unknown User"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {collaborator.role}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State for Collaborators */}
          {(!document || !document.collaborators || document.collaborators.length === 0) && (
            <div className="text-center py-6">
              <Users className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No collaborators yet
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6 py-2"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DocumentSettingsModal;
