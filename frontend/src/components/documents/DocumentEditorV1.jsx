import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import DocumentEditorHeader from "./DocumentEditorHeader";
import DocumentToolbar from "./DocumentToolbar";
import DocumentTitleBar from "./DocumentTitleBar";
import DocumentSettingsModal from "./DocumentSettingsModal";
import RichTextEditor from "../editor/RichTextEditor";
import AutoSaveIndicator from "./AutoSaveIndicator";
import Container from "../ui/Container";
import ConfirmationModal from "../ui/ConfirmationModal";
import { getUserRole, canPerformAction } from "../../utils/roleUtils";
import { useDocument } from "../../hook/useDocument";

const DocumentEditorOptimized = ({ 
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

  // Determine if document is saved (not draft)
  const isDocumentSaved = document && document.status !== 'draft';

  // Auto-save hook
  const { manualSave, isAutoSaveEnabled, toggleAutoSave, autoSaveStatus, lastSaved } = useAutoSave(
    document?._id,
    content,
    isDocumentSaved,
    5000 // 5 second debounce
  );

  // Debug logging
  console.log('=== DOCUMENT EDITOR DEBUG ===');
  console.log('Component loaded at:', new Date().toLocaleTimeString());
  
  // Test if console is working
  console.log('🔍 Testing console - if you see this, console is working!');
  console.log('Full document object:', document);
  console.log('DocumentEditorOptimized debug:', {
    hasDocument: !!document,
    documentId: document?._id,
    documentStatus: document?.status,
    isDocumentSaved,
    isAutoSaveEnabled,
    hasToggleFunction: !!toggleAutoSave,
    canEdit,
    isPreExistingDocument: !!document && !!document._id,
    isNewDocument: !document || !document._id,
    documentTitle: document?.title,
    documentOwner: document?.owner,
    statusCheck: document?.status !== 'draft',
    shouldShowAutoSave: !!(document && canEdit && toggleAutoSave),
    autoSaveStatus,
    lastSaved
  });
  console.log('=== END DEBUG ===');

  // Get user role and permissions for this document
  // For new documents (document is null), user is always the owner/editor
  const userRole = document ? getUserRole(document, currentUser) : 'owner';
  const canEdit = document ? canPerformAction(document, currentUser, 'canEdit') : true;
  const canShare = document ? canPerformAction(document, currentUser, 'canShare') : true;
  const canChangeSettings = document ? canPerformAction(document, currentUser, 'canChangeSettings') : true;

  // Initialize form data when document changes
  useEffect(() => {
    if (document) {
      setTitle(document.title || "");
      setContent(document.content || "");
      setTags(document.tags?.join(", ") || "");
      setStatus(document.status || "draft");
      setVisibility(document.visibility || "private");
      setHasChanges(false);
      
      // Log status for debugging
      console.log('Document loaded with status:', document.status);
    } else {
      // Reset form for new document
      setTitle("");
      setContent("");
      setTags("");
      setStatus("draft");
      setVisibility("private");
      setHasChanges(false);
      
      // Log status for debugging
      console.log('New document created with draft status');
    }
  }, [document]);

  // Update local status when document is updated (after save)
  useEffect(() => {
    if (document && document.status) {
      setStatus(document.status);
      console.log('Document status updated to:', document.status);
    }
  }, [document?.status]);

  // Handle title change
  const handleTitleChange = useCallback((e) => {
    setTitle(e.target.value);
    setHasChanges(true);
  }, []);

  // Handle content change
  const handleContentChange = useCallback((value) => {
    setContent(value);
    setHasChanges(true);
  }, []);

  // Handle tags change
  const handleTagsChange = useCallback((e) => {
    setTags(e.target.value);
    setHasChanges(true);
  }, []);

  // Handle status change
  const handleStatusChange = useCallback((e) => {
    setStatus(e.target.value);
    setHasChanges(true);
  }, []);

  // Handle visibility change
  const handleVisibilityChange = useCallback((e) => {
    setVisibility(e.target.value);
    setHasChanges(true);
  }, []);

  // Handle manual save
  const handleManualSave = useCallback(async () => {
    if (!canEdit) {
      return;
    }

    // If document is saved and auto-save is enabled, use manual save from auto-save hook
    if (isDocumentSaved && isAutoSaveEnabled) {
      const success = await manualSave(content);
      if (success) {
        setHasChanges(false);
      }
      return;
    }

    // Otherwise, use regular save for new documents or draft documents
    // If document is draft, change status to published when saving
    const documentData = {
      title: title.trim(),
      content,
      tags: tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0),
      status: status === 'draft' ? 'published' : status, // Change draft to published when saving
      visibility,
    };

    console.log('Saving document with data:', documentData);
    console.log('Current status:', status, 'New status:', documentData.status);
    
    onSave(documentData);
    setHasChanges(false);
  }, [title, content, tags, status, visibility, onSave, canEdit, isDocumentSaved, isAutoSaveEnabled, manualSave]);

  // Handle save (legacy function for backward compatibility)
  const handleSave = useCallback(() => {
    handleManualSave();
  }, [handleManualSave]);

  // Handle share
  const handleShare = useCallback(() => {
    if (canShare && onShare) {
      onShare(document);
    }
  }, [onShare, document, canShare]);

  // Handle preview
  const handlePreview = useCallback(() => {
    if (document) {
      navigate(`/documents/preview/${document._id}`);
    }
  }, [document, navigate]);

  // Handle settings
  const handleSettings = useCallback(() => {
    if (canChangeSettings) {
      setShowSettings(true);
    }
  }, [canChangeSettings]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (hasChanges) {
      setConfirmModal({
        isOpen: true,
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Are you sure you want to leave?',
        type: 'warning',
        onConfirm: () => {
          if (onBack) {
            onBack();
          } else {
            navigate(-1);
          }
          setConfirmModal({ ...confirmModal, isOpen: false });
        }
      });
      return;
    }
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  }, [hasChanges, onBack, navigate, confirmModal]);

  // Handle settings modal close
  const handleSettingsClose = useCallback(() => {
    setShowSettings(false);
  }, []);

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
        autoSaveStatus={autoSaveStatus}
        lastSaved={lastSaved}
        isAutoSaveEnabled={isAutoSaveEnabled}
        onToggleAutoSave={toggleAutoSave}
      />

      {/* Main Content - Google Docs Layout */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
        {/* Toolbar - Google Docs Style */}
        <DocumentToolbar 
          onSettings={handleSettings}
          onShare={handleShare}
          canEdit={canEdit}
          canShare={canShare}
          canChangeSettings={canChangeSettings}
        />

        {/* Title Bar - Google Docs Style */}
        <DocumentTitleBar
          title={title}
          onTitleChange={handleTitleChange}
          placeholder="Untitled document"
          canEdit={canEdit}
        />

        {/* Editor Container - Google Docs Style */}
        <div className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 lg:py-8">
            <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg min-h-[600px] transition-all duration-300">
              <RichTextEditor
                value={content}
                onChange={handleContentChange}
                placeholder="Start writing your document..."
                height="600px"
                className="h-full rounded-lg"
                readOnly={!canEdit}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <DocumentSettingsModal
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
      <ConfirmationModal
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

export default DocumentEditorOptimized;
