import React from "react";
import { 
  Save,
  Share, 
  Eye,
  Settings,
  ArrowLeft,
  Clock
} from "lucide-react";
import Button from "../ui/Button";
import Container from "../ui/CustomContainer";
import AutoSaveIndicator from "./DocumentAutoSaveIndicator";

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
  onFilenameChange = null,
  activeUsers = [],
  isConnected = false,
}) => {
  
  // Debug logging
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
            
            <div>
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
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <AutoSaveIndicator 
                  status={document ? autoSaveStatus : 'idle'}
                  lastSaved={lastSaved}
                  isAutoSaveEnabled={true}
                />
                {!document && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    (Click Save to enable auto-save)
                  </span>
                )}
                
                {/* Connection Status */}
                <div className="flex items-center space-x-2 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                
                {/* Active Users Indicator */}
                {activeUsers.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <div className="flex -space-x-2">
                      {activeUsers.slice(0, 3).map((user, index) => (
                        <div
                          key={index}
                          className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-xs font-semibold"
                          title={user.name}
                        >
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      ))}
                    </div>
                    {activeUsers.length > 3 && (
                      <span className="text-xs text-gray-600 dark:text-gray-400">+{activeUsers.length - 3}</span>
                    )}
                  </div>
                )}
                
                {/* Role Badge */}
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  userRole === 'owner' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                  userRole === 'admin' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  userRole === 'editor' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                }`}>
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Section - Action Buttons */}
          <div className="flex items-center gap-2">
            {/* View Only Badge */}
            {!canEdit && (
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                View Only
              </span>
            )}
            
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
            
            {/* Save button - only show for new documents that need initial save */}
            {canEdit && !document && (
              <Button
                onClick={onSave}
                loading={loading}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-600 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:border-gray-400"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save Document</span>
                <span className="sm:hidden">Save</span>
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
            {document ? (
              <AutoSaveIndicator 
                status={autoSaveStatus}
                lastSaved={lastSaved}
                isAutoSaveEnabled={true}
              />
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <p className="text-gray-500 dark:text-gray-400">
                  Auto-save after initial save
                </p>
              </div>
            )}
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
