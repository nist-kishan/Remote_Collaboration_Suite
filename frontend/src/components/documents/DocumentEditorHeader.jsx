import React from "react";
import { 
  Save, 
  Share, 
  Eye,
  Settings,
  ArrowLeft,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import Button from "../ui/Button";
import Container from "../ui/Container";
import AutoSaveIndicator from "./AutoSaveIndicator";

const DocumentHeader = ({
  document,
  hasChanges,
  loading,
  onBack,
  onSave,
  onShare,
  onPreview,
  onSettings,
  title = "Document Editor",
  userRole = "viewer",
  canEdit = false,
  canShare = false,
  canChangeSettings = false,
  autoSaveStatus = 'idle',
  lastSaved = null,
  isAutoSaveEnabled = false,
  onToggleAutoSave = null,
  filename = "newDocument",
  onFilenameChange = null
}) => {
  // Debug logging
  console.log('=== DOCUMENT HEADER DEBUG ===');
  console.log('DocumentHeader rendered at:', new Date().toLocaleTimeString());
  console.log('DocumentHeader props:', {
    document,
    hasDocument: !!document,
    documentStatus: document?.status,
    canEdit,
    onToggleAutoSave: !!onToggleAutoSave,
    isAutoSaveEnabled,
    autoSaveStatus
  });
  console.log('=== END HEADER DEBUG ===');

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 shadow-sm transition-colors duration-200 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 sm:py-4">
          {/* Left Section - Back Button & Title */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 rounded-md transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            
            <div className="hidden sm:block">
              {canEdit && onFilenameChange ? (
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => onFilenameChange(e.target.value)}
                  className="text-lg font-medium text-gray-900 dark:text-gray-100 bg-transparent border-none outline-none focus:outline-none px-0 py-0 min-w-0 w-auto max-w-xs"
                  placeholder="newDocument"
                />
              ) : (
                <h1 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {filename || title}
                </h1>
              )}
              <div className="flex items-center gap-2 mt-1">
                {isAutoSaveEnabled ? (
                  <AutoSaveIndicator 
                    status={autoSaveStatus}
                    lastSaved={lastSaved}
                    isAutoSaveEnabled={isAutoSaveEnabled}
                  />
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {document ? "All changes saved" : "New document"}
                  </p>
                )}
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Section - Action Buttons */}
          <div className="flex items-center gap-2">
            {document && (
              <>
                {canShare && (
                  <Button
                    variant="outline"
                    onClick={onShare}
                    className="flex items-center gap-2 hidden sm:flex px-3 py-2 rounded-md border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Share className="w-4 h-4" />
                    <span className="hidden md:inline">Share</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={onPreview}
                  className="flex items-center gap-2 hidden sm:flex px-3 py-2 rounded-md border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden md:inline">Preview</span>
                </Button>
              </>
            )}
            
            {/* Auto-save Toggle Button - Show for all saved documents (not drafts) */}
            {(() => {
              // Debug logging
              console.log('Auto-save button debug:', {
                hasDocument: !!document,
                documentStatus: document?.status,
                canEdit,
                hasToggleFunction: !!onToggleAutoSave,
                shouldShow: !!(document && document.status !== 'draft' && canEdit && onToggleAutoSave)
              });
              // Don't return null, let the actual button render below
            })()}
            
            {/* Auto-save toggle button - Only show for published documents (not drafts) */}
            {document && document.status !== 'draft' && canEdit && onToggleAutoSave && (
              <Button
                variant="outline"
                onClick={onToggleAutoSave}
                className={`flex items-center gap-2 px-3 py-2 rounded-md border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  isAutoSaveEnabled 
                    ? 'bg-green-50 border-green-300 text-green-700 dark:bg-green-900 dark:border-green-600 dark:text-green-300' 
                    : 'bg-gray-50 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                }`}
                title={isAutoSaveEnabled ? 'Disable auto-save' : 'Enable auto-save'}
              >
                {isAutoSaveEnabled ? (
                  <ToggleRight className="w-4 h-4" />
                ) : (
                  <ToggleLeft className="w-4 h-4" />
                )}
                <span className="hidden md:inline">
                  Auto-save {isAutoSaveEnabled ? 'ON' : 'OFF'}
                </span>
              </Button>
            )}
            
            {canChangeSettings && (
              <Button
                variant="outline"
                onClick={onSettings}
                className="flex items-center gap-2 hidden sm:flex px-3 py-2 rounded-md border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden md:inline">Settings</span>
              </Button>
            )}
            
            {canEdit && (
              <Button
                onClick={onSave}
                loading={loading}
                disabled={loading}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors shadow-sm ${
                  hasChanges 
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-600' 
                    : 'bg-green-600 hover:bg-green-700 text-white border border-green-600'
                } disabled:bg-gray-400 disabled:cursor-not-allowed disabled:border-gray-400`}
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {hasChanges ? "Save Changes" : "Saved"}
                </span>
                <span className="sm:hidden">
                  {hasChanges ? "Save" : "✓"}
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Title */}
        <div className="sm:hidden pb-3 px-4">
          {canEdit && onFilenameChange ? (
            <input
              type="text"
              value={filename}
              onChange={(e) => onFilenameChange(e.target.value)}
              className="text-base font-medium text-gray-900 dark:text-gray-100 bg-transparent border-none outline-none focus:outline-none px-0 py-0 min-w-0 w-auto max-w-xs"
              placeholder="newDocument"
            />
          ) : (
            <h1 className="text-base font-medium text-gray-900 dark:text-gray-100">
              {filename || title}
            </h1>
          )}
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {document ? "All changes saved" : "New document"}
            </p>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentHeader;
