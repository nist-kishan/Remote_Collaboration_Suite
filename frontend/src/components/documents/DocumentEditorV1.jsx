import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import DocumentEditorHeader from "./DocumentEditorHeader";
import DocumentToolbar from "./DocumentToolbar";
import DocumentTitleBar from "./DocumentTitleHeader";
import DocumentSettingsModal from "./DocumentSettingsModal";
import RichTextEditor from "../editor/RichTextEditor";
import AutoSaveIndicator from "./DocumentAutoSaveIndicator";
import Container from "../ui/CustomContainer";
import ConfirmationModal from "../ui/ConfirmationDialog";
import { getUserRole, canPerformAction } from "../../utils/roleUtils";
import { useDocument } from "../../hook/useDocument";
import { autoSaveDocument } from "../../api/documentApi";

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
  const queryClient = useQueryClient();
  const { user: currentUser } = useSelector((state) => state.auth);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("draft");
  const [visibility, setVisibility] = useState("private");
  const [hasChanges, setHasChanges] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'
  const [lastSaved, setLastSaved] = useState(null);
  const autoSaveTimeoutRef = useRef(null);
  const previousDocumentIdRef = useRef(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'default',
    onConfirm: null
  });

  // Determine if document is saved (not draft)
  const isDocumentSaved = document && document.status !== 'draft';

  // Auto-save mutation
  const autoSaveMutation = useMutation({
    mutationFn: ({ documentId, content: contentToSave }) => {
      || 'empty',
        timestamp: new Date().toISOString()
      });
      return autoSaveDocument(documentId, contentToSave);
    },
    onSuccess: (data, variables) => {
      .toISOString()
      });
      
      setLastSaved(new Date());
      setAutoSaveStatus('saved');
      setHasChanges(false);
      
      // Invalidate queries to refresh document data - use variables.documentId
      if (variables.documentId) {
        queryClient.invalidateQueries(['document', variables.documentId]);
        
        // Also refetch to ensure data is up to date
        queryClient.refetchQueries(['document', variables.documentId]).then(() => {
          });
      }
    },
    onError: (error) => {
      console.error('❌ [AUTO-SAVE MUTATION] Auto-save error:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        timestamp: new Date().toISOString()
      });
      setAutoSaveStatus('error');
      setHasChanges(true); // Keep hasChanges true on error so user knows to save manually
    }
  });

  // Get user role and permissions for this document
  // For new documents (document is null), user is always the owner/editor
  const userRole = document ? getUserRole(document, currentUser) : 'owner';
  const canEdit = document ? canPerformAction(document, currentUser, 'canEdit') : true;
  const canShare = document ? canPerformAction(document, currentUser, 'canShare') : true;
  const canChangeSettings = document ? canPerformAction(document, currentUser, 'canChangeSettings') : true;

  // Initialize form data when document changes
  useEffect(() => {
    if (document) {
      // Only update if the document ID changed
      const documentChanged = document._id !== previousDocumentIdRef.current;
      
      if (documentChanged) {
        setTitle(document.title || "");
        setContent(document.content || "");
        setTags(document.tags?.join(", ") || "");
        setStatus(document.status || "draft");
        setVisibility(document.visibility || "private");
        setHasChanges(false);
        
        // Set last saved time from document's updatedAt
        if (document.updatedAt) {
          setLastSaved(new Date(document.updatedAt));
          setAutoSaveStatus('saved');
        }
        
        // Update the ref to track this document
        previousDocumentIdRef.current = document._id;
        
        }
    } else {
      // Reset form for new document
      if (previousDocumentIdRef.current !== null) {
        setTitle("");
        setContent("");
        setTags("");
        setStatus("draft");
        setVisibility("private");
        setHasChanges(false);
        setLastSaved(null);
        setAutoSaveStatus('idle');
        previousDocumentIdRef.current = null;
      }
    }
  }, [document]);

  // Update local status when document is updated (after save)
  useEffect(() => {
    if (document && document.status) {
      setStatus(document.status);
      }
  }, [document?.status]);

  // Log when document prop changes to debug auto-save issues
  useEffect(() => {
    }, [document]);

  // Handle title change
  const handleTitleChange = useCallback((e) => {
    setTitle(e.target.value);
    setHasChanges(true);
  }, []);

  // Auto-save handler
  const handleAutoSave = useCallback(() => {
    .toISOString()
    });
    
    // Prevent multiple simultaneous auto-saves
    if (autoSaveMutation.isPending) {
      return;
    }
    
    if (document?._id && content) {
      setAutoSaveStatus('saving');
      
      autoSaveMutation.mutate({
        documentId: document._id,
        content
      });
    } else {
      }
  }, [document?._id, content, autoSaveMutation]);

  // Store handleAutoSave in a ref to avoid dependency issues
  const handleAutoSaveRef = useRef(handleAutoSave);
  
  // Update the ref when handleAutoSave changes
  useEffect(() => {
    handleAutoSaveRef.current = handleAutoSave;
  }, [handleAutoSave]);

  // Auto-save effect
  useEffect(() => {
    .toISOString()
    });
    
    if (hasChanges && document?._id && content) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSaveRef.current();
      }, 5000); // Auto-save every 5 seconds
    } else {
      // Clear timeout if hasChanges becomes false
      if (autoSaveTimeoutRef.current) {
        ');
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    }
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [hasChanges, document?._id, content]);

  // Save before page unload - warn user about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges && document?._id && content) {
        // Show warning about unsaved changes
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasChanges, document?._id, content]);

  // Handle content change
  const handleContentChange = useCallback((value) => {
    .toISOString()
    });
    setContent(value);
    setHasChanges(true);
  }, [content]);

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

  // Handle manual save (for new documents or drafts)
  const handleManualSave = useCallback(async () => {
    if (!canEdit) {
      return;
    }

    // For existing documents, trigger immediate auto-save
    if (document?._id && content) {
      handleAutoSave();
      return;
    }

    // For new documents, use the onSave callback
    const documentData = {
      title: title.trim(),
      content,
      tags: tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0),
      status: status === 'draft' ? 'published' : status,
      visibility,
    };

    if (onSave) {
      await onSave(documentData);
      // Keep hasChanges as true for now - it will be set to false once the document prop updates
    }
  }, [title, content, tags, status, visibility, onSave, canEdit, document?._id, handleAutoSave]);

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
        filename={title || (document?.title || "Untitled Document")}
        onFilenameChange={handleTitleChange}
        userRole={userRole}
        canEdit={canEdit}
        canShare={canShare}
        canChangeSettings={canChangeSettings}
        autoSaveStatus={autoSaveStatus}
        lastSaved={lastSaved}
        isAutoSaveEnabled={true}
        onToggleAutoSave={null}
        activeUsers={document?.collaborators?.filter(c => c.user)?.map(c => ({
          name: c.user.name || c.user.email,
          role: c.role
        })) || []}
        isConnected={true}
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
