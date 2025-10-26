import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux'; // Redux selector hook
import { 
  Save, 
  Share, 
  Eye,
  ArrowLeft,
  Settings,
  X,
  File,
  Trash2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Undo,
  Redo,
  Type,
  Image,
  Link,
  Table,
  MoreHorizontal,
  Home,
  Plus,
  Grid3X3,
  CheckSquare,
  View as ViewIcon,
  HelpCircle,
  Palette,
  Paintbrush,
  ZoomIn,
  ZoomOut,
  FileText,
  Printer,
  Monitor,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd,
  Minus,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import CustomButton from '../ui/CustomButton';
import CustomInput from '../ui/CustomInput';
import CustomCard from '../ui/CustomCard';
import CustomContainer from '../ui/CustomContainer';
import DocumentShareModal from './DocumentShareModal';
import ConfirmationDialog from '../ui/ConfirmationDialog';
import DocumentAutoSaveIndicator from './DocumentAutoSaveIndicator';
import RichTextEditor from '../editor/RichTextEditor';
import { useDocument } from '../../hook/useDocument';
import DocumentCollaborationPanel from './DocumentCollaborationPanel';
import DocumentLiveCursors from './DocumentLiveCursors';

const DocumentEditor = ({ 
  documentId = null,
  isNew = false,
  onBack = null,
  className = "" 
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.auth);
  const [editorZoom, setEditorZoom] = useState(1);

  // Ribbon tab state
  const [activeTab, setActiveTab] = useState('Home');
  
  // Editor reference for formatting commands
  const editorRef = useRef(null);
  
  // Active formatting state
  const [activeFormatting, setActiveFormatting] = useState({
    bold: false,
    italic: false,
    underline: false
  });
  
  // Modal states
  const [showColorModal, setShowColorModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {}
  });
  
  // Modal data
  const [modalData, setModalData] = useState({
    linkUrl: '',
    imageUrl: '',
    selectedColor: '#000000',
    backgroundColor: '#ffffff',
    tableRows: 3,
    tableCols: 3,
    imageFile: null,
    googleSearchQuery: ''
  });
  
  // Formatting functions that connect to RichTextEditor
  const executeCommand = useCallback((command, value = null) => {
    if (editorRef.current) {
      editorRef.current.executeCommand(command, value);
      // Update active formatting state after command
      updateActiveFormatting();
    }
  }, []);
  
  // Apply zoom to editor
  useEffect(() => {
    if (editorRef.current) {
      const editor = editorRef.current.getEditorElement();
      if (editor) {
        editor.style.transform = `scale(${editorZoom})`;
      }
    }
  }, [editorZoom]);

  // Function to check and update active formatting state
  const updateActiveFormatting = useCallback(() => {
    if (editorRef.current) {
      const editor = editorRef.current.getEditorElement();
      if (editor) {
        // Check if formatting is active by querying the command state
        const boldActive = document.queryCommandState('bold');
        const italicActive = document.queryCommandState('italic');
        const underlineActive = document.queryCommandState('underline');
        
        setActiveFormatting({
          bold: boldActive,
          italic: italicActive,
          underline: underlineActive
        });
      }
    }
  }, []);

  const handleBold = () => executeCommand('bold');
  const handleItalic = () => executeCommand('italic');
  const handleUnderline = () => executeCommand('underline');
  const handleAlignLeft = () => executeCommand('justifyLeft');
  const handleAlignCenter = () => executeCommand('justifyCenter');
  const handleAlignRight = () => executeCommand('justifyRight');
  const handleAlignJustify = () => executeCommand('justifyFull');
  const handleUnorderedList = () => editorRef.current?.insertUnorderedList();
  const handleOrderedList = () => editorRef.current?.insertOrderedList();
  const handleInsertLink = () => {
    setShowLinkModal(true);
  };
  
  const handleInsertImage = () => {
    setShowImageModal(true);
  };
  
  const applyLink = () => {
    if (modalData.linkUrl) {
      editorRef.current?.insertLink(modalData.linkUrl);
    }
    setShowLinkModal(false);
    setModalData(prev => ({ ...prev, linkUrl: '' }));
  };
  
  const applyImage = () => {
    if (modalData.imageFile) {
      // Handle local file upload
      const reader = new FileReader();
      reader.onload = (e) => {
        editorRef.current?.insertImage(e.target.result);
      };
      reader.readAsDataURL(modalData.imageFile);
    } else if (modalData.imageUrl) {
      // Handle URL image
      editorRef.current?.insertImage(modalData.imageUrl);
    }
    setShowImageModal(false);
    setModalData(prev => ({ ...prev, imageUrl: '', imageFile: null, googleSearchQuery: '' }));
  };
  
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setModalData(prev => ({ ...prev, imageFile: file, imageUrl: '' }));
    } else {
      toast.error('Please select a valid image file');
    }
  };
  
  const searchGoogleImages = async () => {
    if (!modalData.googleSearchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }
    
    try {
      // For demo purposes, we'll use a placeholder image service
      // In a real implementation, you'd use Google Custom Search API
      const searchQuery = encodeURIComponent(modalData.googleSearchQuery);
      const placeholderUrl = `https://via.placeholder.com/400x300/4CAF50/FFFFFF?text=${searchQuery}`;
      
      setModalData(prev => ({ ...prev, imageUrl: placeholderUrl }));
      toast.success('Image found! Click "Insert Image" to add it to your document.');
    } catch (error) {
      toast.error('Failed to search for images');
    }
  };
  
  const handleInsertTable = () => {
    setShowTableModal(true);
  };
  
  const applyTable = () => {
    if (modalData.tableRows && modalData.tableCols) {
      editorRef.current?.insertTable(modalData.tableRows, modalData.tableCols);
    }
    setShowTableModal(false);
  };
  const handleUndo = () => executeCommand('undo');
  const handleRedo = () => executeCommand('redo');
  const handleFontSize = (size) => executeCommand('fontSize', size);
  const handleFontFamily = (family) => executeCommand('fontName', family);
  
  // Text color and background color
  const handleTextColor = () => {
    setShowColorModal(true);
  };
  
  const handleBackgroundColor = () => {
    setShowColorModal(true);
  };
  
  const applyColor = (color, isBackground = false) => {
    if (color) {
      executeCommand(isBackground ? 'backColor' : 'foreColor', color);
    }
    setShowColorModal(false);
  };
  
  // Line spacing
  const handleLineSpacing = (spacing) => {
    // This is a simplified implementation
    if (spacing === 'Single') {
      executeCommand('formatBlock', 'div');
    } else if (spacing === 'Double') {
      executeCommand('formatBlock', 'div');
      // Add extra line spacing via CSS
    }
  };

  const {
    currentDocument,
    documentLoading,
    isCreating,
    isUpdating,
    isDeleting,
    documentError,
    editorState,
    isShareModalOpen,
    selectedDocumentForShare,
    handleFetchDocument,
    handleCreateDocument,
    handleUpdateDocument,
    handleDeleteDocument,
    handleShareDocument,
    handleShareViaEmail,
    handleUpdateCollaboratorRole,
    handleRemoveCollaborator,
    handleCloseShareModal,
    handleUpdateEditorField,
    handleInitializeEditorFromDocument,
    handleResetEditorState
  } = useDocument(documentId, { shouldNavigateAfterCreate: isNew });

  // Permissions function based on collaborator roles
  const getDocumentPermissions = (document, currentUser) => {
    if (!document || !currentUser) {
      return {
        canEdit: false,
        canShare: false,
        canDelete: false,
        canChangeSettings: false,
        userRole: 'viewer'
      };
    }

    // Check if user is the owner
    const isOwner = document.owner === currentUser._id || document.createdBy === currentUser._id;
    
    if (isOwner) {
      return {
        canEdit: true,
        canShare: true,
        canDelete: true,
        canChangeSettings: true,
        userRole: 'owner'
      };
    }

    // Check collaborator role
    const collaborator = document.collaborators?.find(c => c.user === currentUser._id || c.user?._id === currentUser._id);
    const userRole = collaborator?.role || 'viewer';
    
    return {
      canEdit: userRole === 'editor' || userRole === 'owner',
      canShare: userRole === 'editor' || userRole === 'owner',
      canDelete: false, // Only owner can delete
      canChangeSettings: userRole === 'owner',
      userRole: userRole
    };
  };

  const permissions = getDocumentPermissions(currentDocument, user);

  // For new documents, user should always be able to edit
  const canEditTitle = isNew || permissions.canEdit;

  // Auto-save functionality - only available for saved documents (not drafts)
  const isDocumentSaved = currentDocument && currentDocument.status !== 'draft';
  
  // Debug auto-save initialization
  console.log('Auto-save initialized at:', new Date().toLocaleTimeString());
  
  // Simple auto-save implementation for now
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'
  const [lastSaved, setLastSaved] = useState(null);
  
  const toggleAutoSave = useCallback(() => {
    setIsAutoSaveEnabled(prev => !prev);
  }, []);

  const manualSave = useCallback(async () => {
    if (!isDocumentSaved) return;
    
    setAutoSaveStatus('saving');
    try {
      await handleUpdateDocument();
      setAutoSaveStatus('saved');
      setLastSaved(new Date());
    } catch (error) {
      setAutoSaveStatus('error');
      console.error('Manual save failed:', error);
    }
  }, [isDocumentSaved, handleUpdateDocument]);

  // Simple collaboration implementation for now
  const [activeCollaborators, setActiveCollaborators] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [saveStatus, setSaveStatus] = useState({});
  const [isJoined, setIsJoined] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // Simple stub functions for collaboration
  const sendContentChange = useCallback(() => {}, []);
  const sendCursorMove = useCallback(() => {}, []);
  const sendSelectionChange = useCallback(() => {}, []);
  const sendTyping = useCallback(() => {}, []);
  const sendStopTyping = useCallback(() => {}, []);
  const sendFormatChange = useCallback(() => {}, []);
  const sendStructureChange = useCallback(() => {}, []);
  const sendTitleChange = useCallback(() => {}, []);
  const sendSaveStatus = useCallback(() => {}, []);

  // Initialize editor when document changes
  useEffect(() => {
    if (currentDocument && !isNew) {
      console.log('Document loaded:', {
        content: currentDocument.content || 'empty',
        updatedAt: currentDocument.updatedAt
      });
      
      handleInitializeEditorFromDocument(currentDocument);
      // Enable auto-save for existing documents
      setIsAutoSaveEnabled(true);
      // Set last saved time from document's updatedAt
      if (currentDocument.updatedAt) {
        setLastSaved(new Date(currentDocument.updatedAt));
        setAutoSaveStatus('saved');
      }
    } else if (isNew) {
      handleResetEditorState();
      // Set initial state for new documents
      handleUpdateEditorField('title', '');
      handleUpdateEditorField('status', 'draft');
      handleUpdateEditorField('visibility', 'private');
      // Auto-save disabled for new documents until first save
      setIsAutoSaveEnabled(false);
      }
  }, [currentDocument, isNew, handleInitializeEditorFromDocument, handleResetEditorState, handleUpdateEditorField]);

  // Add event listener to update formatting state when editor content changes
  useEffect(() => {
    const editor = editorRef.current?.getEditorElement();
    if (editor) {
      const handleSelectionChange = () => {
        updateActiveFormatting();
      };
      
      // Listen for selection changes
      document.addEventListener('selectionchange', handleSelectionChange);
      
      return () => {
        document.removeEventListener('selectionchange', handleSelectionChange);
      };
    }
  }, [updateActiveFormatting]);

  // Fetch document when component mounts
  useEffect(() => {
    if (documentId && !isNew) {
      handleFetchDocument(documentId);
    }
  }, [documentId, isNew, handleFetchDocument]);

  // Auto-save effect - triggers when content changes
  const autoSaveTimeoutRef = useRef(null);
  const previousContentRef = useRef(null);
  const isSavingRef = useRef(false);
  
  useEffect(() => {
    // Skip if already saving
    if (isSavingRef.current) {
      return;
    }
    
    // Only auto-save if enabled and document is saved
    if (!isAutoSaveEnabled || !isDocumentSaved || !documentId || !editorState?.content) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
      return;
    }

    // Check if content actually changed
    const currentContent = editorState.content;
    if (previousContentRef.current === currentContent) {
      return; // No change, skip
    }
    
    previousContentRef.current = currentContent;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save (5 seconds)
    autoSaveTimeoutRef.current = setTimeout(async () => {
      // Skip if already saving
      if (isSavingRef.current) {
        return;
      }
      
      isSavingRef.current = true;
      setAutoSaveStatus('saving');
      
      try {
        const { autoSaveDocument } = await import('../../api/documentApi');
        await autoSaveDocument(documentId, editorState.content);
        
        setAutoSaveStatus('saved');
        setLastSaved(new Date());
      } catch (error) {
        console.error('❌ [AUTO-SAVE] Auto-save failed:', error);
        setAutoSaveStatus('error');
      } finally {
        isSavingRef.current = false;
      }
    }, 5000);

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [isAutoSaveEnabled, isDocumentSaved, documentId, editorState?.content]);

  // Handle title change
  const handleTitleChange = useCallback((e) => {
    handleUpdateEditorField('title', e.target.value);
  }, [handleUpdateEditorField]);

  // Log editorState changes
  useEffect(() => {
    console.log('Editor state changed:', {
      content: editorState?.content || 'empty',
      status: editorState?.status,
      visibility: editorState?.visibility,
      tags: editorState?.tags,
      hasChanges: editorState?.hasChanges
    });
  }, [editorState]);

  // Handle content change
  const handleContentChange = useCallback((value) => {
    console.log('Content changed at:', new Date().toLocaleTimeString(), {
      isAutoSaveEnabled,
      documentStatus: currentDocument?.status,
      isDocumentSaved
    });
    handleUpdateEditorField('content', value);
  }, [handleUpdateEditorField, isAutoSaveEnabled, currentDocument?.status, isDocumentSaved]);

  // Handle tags change
  const handleTagsChange = useCallback((e) => {
    handleUpdateEditorField('tags', e.target.value);
  }, [handleUpdateEditorField]);

  // Handle status change
  const handleStatusChange = useCallback((e) => {
    handleUpdateEditorField('status', e.target.value);
  }, [handleUpdateEditorField]);

  // Handle visibility change
  const handleVisibilityChange = useCallback((e) => {
    handleUpdateEditorField('visibility', e.target.value);
  }, [handleUpdateEditorField]);

  // Handle save
  const handleSave = useCallback(() => {
    console.log('Saving document:', {
      content: editorState.content + '...',
      tags: editorState.tags,
      visibility: editorState.visibility
    });
    
    console.log('Save parameters:', {
      isNew,
      documentId,
      isUpdating,
      isCreating
    });

    if (!canEditTitle) {
      console.error('❌ Save failed: No edit permission');
      toast.error('You do not have permission to edit this document');
      return;
    }
    
    // Validate title
    if (!editorState.title || editorState.title.trim() === '') {
      console.error('❌ Save failed: No title');
      toast.error('Please enter a document title');
      return;
    }
    
    const documentData = {
      title: editorState.title.trim(),
      content: editorState.content,
      tags: editorState.tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0),
      status: 'published', // Always save as published when manually saving
      visibility: editorState.visibility,
    };

    if (isNew) {
      handleCreateDocument(documentData);
    } else {
      handleUpdateDocument(documentId, documentData);
    }
  }, [editorState, canEditTitle, isNew, documentId, handleCreateDocument, handleUpdateDocument]);

  // Handle share
  const handleShare = useCallback(() => {
    if (permissions.canShare && currentDocument) {
      handleShareDocument(currentDocument);
    }
  }, [permissions.canShare, currentDocument, handleShareDocument]);

  // Handle delete
  const handleDelete = useCallback(() => {
    if (!permissions.canDelete) {
      toast.error('You do not have permission to delete this document');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Delete Document',
      message: `Are you sure you want to delete "${editorState.title}"? This action cannot be undone.`,
      type: 'danger',
      onConfirm: () => {
        handleDeleteDocument(documentId);
        setConfirmModal({ ...confirmModal, isOpen: false });
      }
    });
  }, [permissions.canDelete, editorState.title, documentId, handleDeleteDocument]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      navigate('/documents');
    }
  }, [onBack, navigate]);

  // Show loading state
  if (documentLoading && !isNew) {
    return (
      <CustomContainer className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </CustomContainer>
    );
  }

  // Show error state
  if (documentError && !isNew) {
    return (
      <CustomContainer className="min-h-screen flex items-center justify-center">
        <CustomCard className="p-8 text-center max-w-md">
          <div className="text-red-500 mb-4">
            <File className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Failed to Load Document</h2>
          <p className="text-gray-600 mb-4">
            {documentError.includes('No token') || documentError.includes('Unauthorized') 
              ? 'Please log in to view this document.'
              : documentError || 'An error occurred while loading the document.'
            }
          </p>
          <div className="flex gap-3 justify-center">
            <CustomButton 
              onClick={() => {
                if (documentError.includes('No token') || documentError.includes('Unauthorized')) {
                  navigate('/login');
                } else {
                  // Retry by invalidating queries instead of reloading the page
                  queryClient.invalidateQueries(['document', documentId]);
                }
              }} 
              variant="primary"
            >
              {documentError.includes('No token') || documentError.includes('Unauthorized') 
                ? 'Go to Login' 
                : 'Try Again'
              }
            </CustomButton>
            <CustomButton 
              onClick={() => navigate('/documents')} 
              variant="outline"
            >
              Back to Documents
            </CustomButton>
          </div>
        </CustomCard>
      </CustomContainer>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-100 dark:bg-gray-900 ${className}`}>
      {/* MS Word Style Title Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600 sticky top-0 z-50 document-title-bar">
        <div className="flex items-center justify-between px-2 sm:px-4 py-2 h-10">
          {/* Left Section - Back Button & Filename */}
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1 max-w-[calc(100%-200px)] sm:max-w-none">
                <CustomButton
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm hidden xs:inline">Back</span>
            </CustomButton>
            
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <File className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <div className="flex items-center gap-2 min-w-0 w-full">
                {canEditTitle ? (
                  <input
                    type="text"
                    value={editorState.title || ''}
                    onChange={handleTitleChange}
                    className="bg-transparent text-sm font-medium text-gray-800 dark:text-gray-200 border-none outline-none focus:outline-none focus:bg-transparent hover:bg-transparent px-1 py-0 min-w-0 flex-1 max-w-[120px] sm:max-w-xs md:max-w-sm lg:max-w-md document-title-input"
                    placeholder="Enter document name..."
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-[120px] sm:max-w-xs md:max-w-sm lg:max-w-md document-title-input">
                    {editorState.title || 'Document'}
                  </span>
                )}
                
                {/* Auto-save Status Indicator - Always Visible */}
                {isAutoSaveEnabled && (
                  <div className="flex-shrink-0">
                    <DocumentAutoSaveIndicator 
                      status={autoSaveStatus}
                      lastSaved={lastSaved}
                      isAutoSaveEnabled={isAutoSaveEnabled}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Section - Action Buttons */}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 document-action-buttons">
            {/* Auto-save Toggle - Only show for saved documents */}
            {currentDocument && currentDocument.status !== 'draft' && permissions.canEdit && toggleAutoSave && (
              <CustomButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('Auto-save toggled at:', new Date().toLocaleTimeString());
                  toggleAutoSave();
                }}
                className={`flex items-center space-x-1 px-1 sm:px-2 py-1 text-xs ${
                  isAutoSaveEnabled 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
                title={isAutoSaveEnabled ? 'Auto-save enabled' : 'Auto-save disabled'}
              >
                <div className={`w-2 h-2 rounded-full ${isAutoSaveEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="hidden sm:inline">Auto-save</span>
              </CustomButton>
            )}

                <CustomButton
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={!editorState.hasChanges || !canEditTitle || isUpdating || isCreating || !editorState.title?.trim()}
              className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-1 sm:px-2 md:px-3 py-1"
            >
              <Save className="h-4 w-4" />
              <span className="text-sm hidden sm:inline">{isUpdating || isCreating ? 'Saving...' : 'Save'}</span>
            </CustomButton>

            {permissions.canShare && (
              <CustomButton
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-1 sm:px-2 md:px-3"
              >
                <Share className="h-4 w-4" />
                <span className="text-sm hidden sm:inline">Share</span>
              </CustomButton>
            )}

            {permissions.canChangeSettings && (
              <CustomButton
                variant="ghost"
                size="sm"
                onClick={() => handleUpdateEditorField('showSettings', !editorState.showSettings)}
                className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-1 sm:px-2 md:px-3"
              >
                <Settings className="h-4 w-4" />
                <span className="text-sm hidden sm:inline">Settings</span>
              </CustomButton>
            )}
          </div>
        </div>
      </div>

      {/* MS Word Style Ribbon - Only show if user can edit */}
      {permissions.canEdit && (
      <div className="bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600 sticky top-10 z-40">
        {/* Tab Navigation */}
        <div className="flex items-center px-2 sm:px-4 py-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('Home')}
            className={`px-2 sm:px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'Home' 
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' 
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <Home className="h-4 w-4 inline mr-1" />
            <span className="hidden xs:inline">Home</span>
          </button>
          <button 
            onClick={() => setActiveTab('Insert')}
            className={`px-2 sm:px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'Insert' 
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' 
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <Plus className="h-4 w-4 inline mr-1" />
            <span className="hidden xs:inline">Insert</span>
          </button>
          <button 
            onClick={() => setActiveTab('View')}
            className={`px-2 sm:px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'View' 
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' 
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <ViewIcon className="h-4 w-4 inline mr-1" />
            <span className="hidden xs:inline">View</span>
          </button>
        </div>

        {/* Ribbon Content */}
        <div className="px-2 sm:px-4 py-3">
          {activeTab === 'Home' && (
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 lg:space-x-6 overflow-x-auto scrollbar-hide">
              {/* Clipboard Group */}
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                <CustomButton
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Undo"
                  onClick={handleUndo}
                >
                  <Undo className="h-4 w-4" />
                </CustomButton>
                <CustomButton
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Redo"
                  onClick={handleRedo}
                >
                  <Redo className="h-4 w-4" />
                </CustomButton>
              </div>

              {/* Font Group */}
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                <select 
                  className="text-sm border-none outline-none focus:outline-none bg-transparent text-gray-900 dark:text-gray-100 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  onChange={(e) => handleFontFamily(e.target.value)}
                >
                  <option value="Calibri">Calibri</option>
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Georgia">Georgia</option>
                </select>
                <select 
                  className="text-sm border-none outline-none focus:outline-none bg-transparent text-gray-900 dark:text-gray-100 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  onChange={(e) => handleFontSize(e.target.value)}
                >
                  <option value="3">8pt</option>
                  <option value="4">10pt</option>
                  <option value="5">12pt</option>
                  <option value="6">14pt</option>
                  <option value="7">18pt</option>
                  <option value="8">24pt</option>
                </select>
                <div className="border-l border-gray-300 dark:border-gray-600 h-6 mx-2"></div>
                <CustomButton
                  variant="ghost"
                  size="sm"
                  className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    activeFormatting.bold 
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                      : ''
                  }`}
                  title="Bold"
                  onClick={handleBold}
                >
                  <Bold className="h-4 w-4" />
                </CustomButton>
                <CustomButton
                  variant="ghost"
                  size="sm"
                  className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    activeFormatting.italic 
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                      : ''
                  }`}
                  title="Italic"
                  onClick={handleItalic}
                >
                  <Italic className="h-4 w-4" />
                </CustomButton>
                <CustomButton
                  variant="ghost"
                  size="sm"
                  className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    activeFormatting.underline 
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                      : ''
                  }`}
                  title="Underline"
                  onClick={handleUnderline}
                >
                  <Underline className="h-4 w-4" />
                </CustomButton>
                <div className="border-l border-gray-300 dark:border-gray-600 h-6 mx-2"></div>
                <CustomButton
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Text Color"
                  onClick={handleTextColor}
                >
                  <Palette className="h-4 w-4" />
                </CustomButton>
                <CustomButton
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Background Color"
                  onClick={handleBackgroundColor}
                >
                  <Paintbrush className="h-4 w-4" />
                </CustomButton>
              </div>

              {/* Paragraph Group */}
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                <CustomButton
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Align Left"
                  onClick={handleAlignLeft}
                >
                  <AlignLeft className="h-4 w-4" />
                </CustomButton>
                <CustomButton
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Align Center"
                  onClick={handleAlignCenter}
                >
                  <AlignCenter className="h-4 w-4" />
                </CustomButton>
                <CustomButton
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Align Right"
                  onClick={handleAlignRight}
                >
                  <AlignRight className="h-4 w-4" />
                </CustomButton>
                <CustomButton
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Justify"
                  onClick={handleAlignJustify}
                >
                  <AlignJustify className="h-4 w-4" />
                </CustomButton>
                <div className="border-l border-gray-300 dark:border-gray-600 h-6 mx-2"></div>
                <CustomButton
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Bullet List"
                  onClick={handleUnorderedList}
                >
                  <List className="h-4 w-4" />
                </CustomButton>
                <CustomButton
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Numbered List"
                  onClick={handleOrderedList}
                >
                  <ListOrdered className="h-4 w-4" />
                </CustomButton>
              </div>
            </div>
          )}

          {activeTab === 'Insert' && (
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 lg:space-x-6 overflow-x-auto scrollbar-hide">
              {/* Insert Group */}
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                <CustomButton
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Insert Link"
                  onClick={handleInsertLink}
                >
                  <Link className="h-4 w-4" />
                </CustomButton>
                <CustomButton
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Insert Image"
                  onClick={handleInsertImage}
                >
                  <Image className="h-4 w-4" />
                </CustomButton>
                <CustomButton
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Insert Table"
                  onClick={handleInsertTable}
                >
                  <Table className="h-4 w-4" />
                </CustomButton>
              </div>

            </div>
          )}

          {activeTab === 'View' && (
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 lg:space-x-6 overflow-x-auto scrollbar-hide">
              {/* View Modes Group */}
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                <CustomButton
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Read Mode"
                  onClick={() => {
                    if (editorRef.current) {
                      const editor = editorRef.current.getEditorElement();
                      if (editor) {
                        editor.contentEditable = 'false';
                        // Visual feedback instead of alert
                        toast.success('Read Mode activated');
                      }
                    }
                  }}
                >
                  <Eye className="h-4 w-4" />
                </CustomButton>
                <CustomButton
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Print Layout"
                  onClick={() => {
                    window.print();
                  }}
                >
                  <Printer className="h-4 w-4" />
                </CustomButton>
                <CustomButton
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Web Layout"
                  onClick={() => {
                    if (editorRef.current) {
                      const editor = editorRef.current.getEditorElement();
                      if (editor) {
                        editor.contentEditable = 'true';
                        toast.success('Web Layout mode activated');
                      }
                    }
                  }}
                >
                  <Monitor className="h-4 w-4" />
                </CustomButton>
              </div>

              {/* Zoom Group */}
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                <CustomButton
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Zoom In"
                  onClick={() => {
                    setEditorZoom(prev => Math.min(prev + 0.1, 2));
                  }}
                >
                  <ZoomIn className="h-4 w-4" />
                </CustomButton>
                <select 
                  className="text-sm border-none outline-none focus:outline-none bg-transparent text-gray-900 dark:text-gray-100 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  onChange={(e) => {
                    const zoom = e.target.value;
                    if (zoom === 'Fit to Page') {
                      setEditorZoom(0.8);
                    } else {
                      const zoomValue = parseInt(zoom) / 100;
                      setEditorZoom(zoomValue);
                    }
                  }}
                >
                  <option value="100">100%</option>
                  <option value="75">75%</option>
                  <option value="50">50%</option>
                  <option value="Fit to Page">Fit to Page</option>
                </select>
                <CustomButton
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Zoom Out"
                  onClick={() => {
                    setEditorZoom(prev => Math.max(prev - 0.1, 0.5));
                  }}
                >
                  <ZoomOut className="h-4 w-4" />
                </CustomButton>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Main Content Area - Properly Aligned */}
      <div className="flex-1 bg-gray-100 dark:bg-gray-900 overflow-auto">
        {/* View-Only Banner for Viewers */}
        {!permissions.canEdit && currentDocument && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 py-2">
            <div className="max-w-4xl mx-auto flex items-center gap-2 text-sm text-blue-800 dark:text-blue-300">
              <Eye className="w-4 h-4" />
              <span className="font-medium">View-only mode:</span>
              <span>You have view-only access to this document</span>
            </div>
          </div>
        )}
        
        <div className="min-h-full flex justify-center items-start py-4 sm:py-6 md:py-8 px-2 sm:px-4">
          {/* Document Container */}
          <div className="w-full max-w-4xl">
            {/* Document Page - Properly Centered */}
            <div className="bg-white dark:bg-gray-800 shadow-xl border border-gray-300 dark:border-gray-600 min-h-[600px] sm:min-h-[700px] md:min-h-[800px] relative mx-auto">
              {/* Document Content */}
              <div className="p-4 sm:p-6 md:p-8 min-h-[600px] sm:min-h-[700px] md:min-h-[800px]">
                <RichTextEditor
                  ref={editorRef}
                  value={editorState.content}
                  onChange={handleContentChange}
                  placeholder="Start writing your document..."
                  readOnly={!permissions.canEdit}
                  className="min-h-[400px] sm:min-h-[500px] md:min-h-[600px] focus:outline-none w-full"
                />
              </div>

              {/* Document Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                  <span>Page 1 of 1</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      {editorState.showSettings && (
        <div className="w-full sm:w-80 bg-white dark:bg-gray-800 border-l border-gray-300 dark:border-gray-600 fixed sm:relative top-0 right-0 h-full sm:h-auto z-50 sm:z-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Document Properties</h3>
              <CustomButton
                variant="ghost"
                size="sm"
                onClick={() => handleUpdateEditorField('showSettings', false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </CustomButton>
            </div>
            
            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={editorState.status}
                  onChange={handleStatusChange}
                  disabled={!permissions.canEdit}
                  className="w-full p-2 border-none outline-none focus:outline-none bg-transparent text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Visibility
                </label>
                <select
                  value={editorState.visibility}
                  onChange={handleVisibilityChange}
                  disabled={!permissions.canEdit}
                  className="w-full p-2 border-none outline-none focus:outline-none bg-transparent text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <option value="private">Private</option>
                  <option value="shared">Shared</option>
                  <option value="public">Public</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                <CustomInput
                  value={editorState.tags}
                  onChange={handleTagsChange}
                  placeholder="Enter tags separated by commas"
                  disabled={!permissions.canEdit}
                />
              </div>

              {/* Document Info */}
              {currentDocument && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Document Info</h4>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span>{new Date(currentDocument.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Modified:</span>
                      <span>{new Date(currentDocument.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Owner:</span>
                      <span>{currentDocument.owner?.name || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MS Word Style Status Bar */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-300 dark:border-gray-600 sticky bottom-0 z-30 document-status-bar">
        <div className="flex items-center justify-between px-2 sm:px-4 py-1 sm:py-2 h-6 sm:h-8">
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 overflow-x-auto scrollbar-hide status-bar-content">
            <span className="flex-shrink-0 status-bar-item">Ready</span>
            <span className="hidden sm:inline">•</span>
            <span className="flex-shrink-0 status-bar-item">Page 1 of 1</span>
            <span className="hidden sm:inline">•</span>
            <span className="flex-shrink-0 hidden xs:inline status-bar-item">Words: {editorState.content?.split(' ').length || 0}</span>
            <span className="hidden sm:inline">•</span>
            <span className="flex-shrink-0 hidden sm:inline status-bar-item">{editorState.visibility || 'Private'}</span>
            {/* Auto-save Status - Removed from status bar since it's now in header */}
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:inline status-bar-item">
              {permissions.userRole?.charAt(0).toUpperCase() + permissions.userRole?.slice(1) || 'Viewer'}
            </span>
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full flex-shrink-0"></div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <DocumentShareModal
        document={selectedDocumentForShare}
        isOpen={isShareModalOpen}
        onClose={handleCloseShareModal}
        onShare={(data) => {
          // Handle sharing logic - add collaborators to document
          if (data.userIds && data.userIds.length > 0) {
            // Call the shareDocument API
            shareDocument(documentId, data)
              .then(() => {
                toast.success('Document shared successfully!');
                handleCloseShareModal();
                // Refresh document data
                handleFetchDocument();
              })
              .catch((error) => {
                toast.error('Failed to share document');
                console.error('Share error:', error);
              });
          }
        }}
        onUpdateRole={(userId, role) => handleUpdateCollaboratorRole(documentId, userId, role)}
        onRemoveCollaborator={(userId) => handleRemoveCollaborator(documentId, userId)}
        onShareViaEmail={(data) => handleShareViaEmail(documentId, data)}
        loading={isUpdating}
      />

      {/* Confirmation Modal */}
      <ConfirmationDialog
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />

      {/* Color Picker Modal */}
      {showColorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Choose Color</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Text Color</label>
                <input
                  type="color"
                  value={modalData.selectedColor}
                  onChange={(e) => setModalData(prev => ({ ...prev, selectedColor: e.target.value }))}
                  className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Background Color</label>
                <input
                  type="color"
                  value={modalData.backgroundColor}
                  onChange={(e) => setModalData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                  className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowColorModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => applyColor(modalData.selectedColor, false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Apply Text Color
              </button>
              <button
                onClick={() => applyColor(modalData.backgroundColor, true)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Apply Background
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Insert Link</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL</label>
                <input
                  type="url"
                  value={modalData.linkUrl}
                  onChange={(e) => setModalData(prev => ({ ...prev, linkUrl: e.target.value }))}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={applyLink}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Insert Image</h3>
            <div className="space-y-4">
              {/* File Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload from Device</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {modalData.imageFile && (
                  <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                    ✓ {modalData.imageFile.name} selected
                  </div>
                )}
              </div>
              
              {/* Divider */}
              <div className="border-t border-gray-300 dark:border-gray-600 my-4"></div>
              
              {/* Google Search Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Google Images</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={modalData.googleSearchQuery}
                    onChange={(e) => setModalData(prev => ({ ...prev, googleSearchQuery: e.target.value }))}
                    placeholder="Search for images..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <button
                    onClick={searchGoogleImages}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Search
                  </button>
                </div>
              </div>
              
              {/* Divider */}
              <div className="border-t border-gray-300 dark:border-gray-600 my-4"></div>
              
              {/* URL Input Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Or Enter Image URL</label>
                <input
                  type="url"
                  value={modalData.imageUrl}
                  onChange={(e) => setModalData(prev => ({ ...prev, imageUrl: e.target.value, imageFile: null }))}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              {/* Preview */}
              {(modalData.imageUrl || modalData.imageFile) && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview</label>
                  <div className="border border-gray-300 dark:border-gray-600 rounded p-2 bg-gray-50 dark:bg-gray-700">
                    <img
                      src={modalData.imageFile ? URL.createObjectURL(modalData.imageFile) : modalData.imageUrl}
                      alt="Preview"
                      className="max-w-full h-32 object-contain mx-auto"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const nextSibling = e.target.nextSibling;
                        if (nextSibling) {
                          nextSibling.style.display = 'block';
                        }
                      }}
                    />
                    <div className="text-center text-gray-500 dark:text-gray-400" style={{display: 'none'}}>
                      Preview not available
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowImageModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={applyImage}
                disabled={!modalData.imageUrl && !modalData.imageFile}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Insert Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Modal */}
      {showTableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Insert Table</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rows</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={modalData.tableRows}
                    onChange={(e) => setModalData(prev => ({ ...prev, tableRows: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Columns</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={modalData.tableCols}
                    onChange={(e) => setModalData(prev => ({ ...prev, tableCols: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowTableModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={applyTable}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Insert Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Collaboration Components */}
      <DocumentCollaborationPanel 
        activeCollaborators={activeCollaborators}
        typingUsers={typingUsers}
        saveStatus={saveStatus}
      />
      
      <DocumentLiveCursors 
        activeCollaborators={activeCollaborators}
        editorRef={editorRef}
      />

    </div>
  );
};

export default DocumentEditor;
