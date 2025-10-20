import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import DocumentEditorHeader from "./DocumentEditorHeader";
import DocumentEditorToolbar from "./DocumentEditorToolbar";
import DocumentTitleHeader from "./DocumentTitleHeader";
import DocumentSettingsPanel from "./DocumentSettingsPanel";
import CustomContainer from "../ui/CustomContainer";
import ConfirmationDialog from "../ui/ConfirmationDialog";
import { getUserRole, canPerformAction } from "../../utils/roleUtils";

const DocumentEditorOptimizedV2 = ({ 
  document = null, 
  onSave, 
  onShare, 
  onDelete,
  onBack,
  loading = false,
  showDeleteButton = true,
  title: pageTitle,
  className = "" 
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useSelector((state) => state.auth);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("draft");
  const [visibility, setVisibility] = useState("private");
  const [hasChanges, setHasChanges] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'default',
    onConfirm: null
  });
  
  // Dynamic loading states
  const [richTextEditorLoaded, setRichTextEditorLoaded] = useState(false);
  const [RichTextEditor, setRichTextEditor] = useState(null);

  // Load RichTextEditor dynamically
  useEffect(() => {
    const loadRichTextEditor = async () => {
      try {
        const module = await import("../editor/RichTextEditor");
        setRichTextEditor(() => module.default);
        setRichTextEditorLoaded(true);
      } catch (error) {
        setRichTextEditorLoaded(true); // Set to true even on error to show error state
      }
    };
    
    loadRichTextEditor();
  }, []);

  // Initialize form data from document
  useEffect(() => {
    if (document) {
      setTitle(document.title || "");
      setContent(document.content || "");
      setTags(document.tags ? document.tags.join(", ") : "");
      setStatus(document.status || "draft");
      setVisibility(document.visibility || "private");
    } else {
      // New document defaults
      setTitle("");
      setContent("");
      setTags("");
      setStatus("draft");
      setVisibility("private");
    }
  }, [document]);

  // Get user permissions
  // For new documents (document is null), user is always the owner/editor
  const userRole = document ? getUserRole(document, currentUser) : 'owner';
  const canEdit = document ? canPerformAction(document, currentUser, 'canEdit') : true;
  const canShare = document ? canPerformAction(document, currentUser, 'canShare') : true;
  const canChangeSettings = document ? canPerformAction(document, currentUser, 'canChangeSettings') : true;

  const handleTitleChange = useCallback((e) => {
    setTitle(e.target.value);
    setHasChanges(true);
  }, []);

  const handleContentChange = useCallback((newContent) => {
    setContent(newContent);
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!onSave) return;
    
    const tagsArray = tags
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const documentData = {
      title: title.trim(),
      content,
      tags: tagsArray,
      status,
      visibility,
    };

    onSave(documentData);
    setHasChanges(false);
  }, [title, content, tags, status, visibility, onSave]);

  const handleShare = useCallback(() => {
    if (onShare) {
      onShare(document);
    }
  }, [onShare, document]);

  const handleDelete = useCallback(() => {
    if (!onDelete) return;
    
    setConfirmModal({
      isOpen: true,
      title: 'Delete Document',
      message: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      type: 'danger',
      onConfirm: () => {
        onDelete(document);
        setConfirmModal({ ...confirmModal, isOpen: false });
      }
    });
  }, [onDelete, document, title, confirmModal]);

  const handleBack = useCallback(() => {
    if (hasChanges) {
      setConfirmModal({
        isOpen: true,
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Are you sure you want to leave?',
        type: 'warning',
        onConfirm: () => {
          if (onBack) onBack();
          setConfirmModal({ ...confirmModal, isOpen: false });
        }
      });
    } else {
      if (onBack) onBack();
    }
  }, [hasChanges, onBack, confirmModal]);

  const handlePreview = useCallback(() => {
    if (document) {
      // For preview, we'll navigate to the preview page
      // The preview page can handle opening in new tab if needed
      navigate(`/documents/${document._id}/preview`);
    }
  }, [document, navigate]);

  const handleSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const handleSettingsClose = useCallback(() => {
    setShowSettings(false);
  }, []);

  const handleStatusChange = useCallback((newStatus) => {
    setStatus(newStatus);
    setHasChanges(true);
  }, []);

  const handleVisibilityChange = useCallback((newVisibility) => {
    setVisibility(newVisibility);
    setHasChanges(true);
  }, []);

  const handleTagsChange = useCallback((newTags) => {
    setTags(newTags);
    setHasChanges(true);
  }, []);

  // Show loading state while RichTextEditor is loading
  if (!richTextEditorLoaded) {
    return (
      <div className={`min-h-screen bg-white dark:bg-gray-900 flex flex-col ${className}`}>
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                <span className="text-gray-600 dark:text-gray-400">Loading document editor...</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Initializing document editor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-white dark:bg-gray-900 flex flex-col ${className}`}>
      {/* Header - Google Docs Style */}
      <DocumentHeader
        document={document}
        hasChanges={hasChanges}
        loading={loading}
        onBack={handleBack}
        onSave={handleSave}
        onShare={handleShare}
        onPreview={handlePreview}
        onSettings={handleSettings}
        title={pageTitle || (document ? "Edit Document" : "New Document")}
        userRole={userRole}
        canEdit={canEdit}
        canShare={canShare}
        canChangeSettings={canChangeSettings}
      />

      {/* Document Title Bar */}
          <DocumentTitleHeader
        title={title}
        onTitleChange={handleTitleChange}
        placeholder="Untitled document"
        canEdit={canEdit}
      />

      {/* Editor Container - Google Docs Style */}
      <div className="flex-1 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
          <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg min-h-[600px]">
            {!richTextEditorLoaded ? (
              <div className="flex items-center justify-center h-[600px] bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-950 rounded-lg">
                <div className="text-center space-y-4">
                  <div className="relative mx-auto w-16 h-16">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 opacity-20 animate-pulse"></div>
                    <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-white dark:bg-gray-800 shadow-lg">
                      <div className="animate-spin rounded-full h-10 w-10 border-3 border-indigo-200 dark:border-indigo-900"></div>
                      <div className="animate-spin rounded-full h-10 w-10 border-t-3 border-indigo-600 absolute"></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-700 dark:text-gray-300 font-semibold">Loading Editor</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Preparing your workspace...</p>
                  </div>
                </div>
              </div>
            ) : RichTextEditor ? (
              <RichTextEditor
                value={content}
                onChange={handleContentChange}
                placeholder="Start writing your document..."
                height="600px"
                className="h-full rounded-lg"
                readOnly={!canEdit}
              />
            ) : (
              <div className="flex items-center justify-center h-[600px] bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-red-950 rounded-lg">
                <div className="text-center space-y-4">
                  <div className="relative mx-auto w-16 h-16">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 to-orange-500 opacity-20 animate-pulse"></div>
                    <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-white dark:bg-gray-800 shadow-lg">
                      <svg className="w-8 h-8 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-red-600 dark:text-red-400 font-semibold">Failed to Load Editor</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Please try reloading the page</p>
                  </div>
                  <button
                    onClick={() => {
                      // Retry by invalidating queries instead of reloading the page
                      queryClient.invalidateQueries();
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
                  >
                    Reload Page
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <DocumentSettingsPanel
        isOpen={showSettings}
        onClose={handleSettingsClose}
        document={document}
        status={status}
        visibility={visibility}
        tags={tags}
        onStatusChange={handleStatusChange}
        onVisibilityChange={handleVisibilityChange}
        onTagsChange={handleTagsChange}
      />

      {/* Confirmation Modal */}
      <ConfirmationDialog
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />
    </div>
  );
};

export default DocumentEditorOptimizedV2;
