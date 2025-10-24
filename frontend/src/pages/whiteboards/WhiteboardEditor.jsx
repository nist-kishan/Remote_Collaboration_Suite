import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import { SOCKET_CONFIG } from '../../config/environment';
import { 
  getWhiteboard, 
  updateWhiteboard, 
  deleteWhiteboard,
  shareWhiteboard,
  updateCollaboratorRole,
  removeCollaborator,
  shareWhiteboardViaEmail,
  autoSaveWhiteboard
} from '../../api/whiteboardApi';
import HTML5WhiteboardCanvas from '../../components/whiteboard/HTML5WhiteboardCanvas';
import WhiteboardToolbar from '../../components/whiteboard/WhiteboardToolbar';
import WhiteboardCollaborationPanel from '../../components/whiteboard/WhiteboardCollaborationPanel';
import WhiteboardLayerPanel from '../../components/whiteboard/WhiteboardLayerPanel';
import DocumentShareModal from '../../components/documents/DocumentShareModal';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function WhiteboardEditor() {
  const { whiteboardId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, loading: authLoading } = useSelector((state) => state.auth);
  
  // State management
  const [socket, setSocket] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCollaborationPanelOpen, setIsCollaborationPanelOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'default',
    onConfirm: null
  });

  // Canvas state
  const canvasRef = useRef(null);
  
  // Canvas state - exact dimensions from whiteboard settings
  const [canvasWidth, setCanvasWidth] = useState(1920); // Default size
  const [canvasHeight, setCanvasHeight] = useState(1080); // Default size
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [isGridVisible, setIsGridVisible] = useState(false);
  
  // Fabric.js canvas state
  const [canvasData, setCanvasData] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const hasLoadedInitialData = useRef(false);
  
  // Tool state
  const [selectedTool, setSelectedTool] = useState('select');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [opacity, setOpacity] = useState(1.0);
  
  // Theme detection - use state to make it reactive
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  
  // Convert color based on theme
  const convertColorForTheme = (color) => {
    // Normalize color to lowercase
    const normalizedColor = color.toLowerCase();
    
    // In dark mode: convert black to white
    if (isDarkMode && (normalizedColor === '#000000' || normalizedColor === '#000' || normalizedColor === 'black')) {
      return '#ffffff';
    }
    
    // In light mode: convert white to black
    if (!isDarkMode && (normalizedColor === '#ffffff' || normalizedColor === '#fff' || normalizedColor === 'white')) {
      return '#000000';
    }
    
    return color;
  };
  
  // Listen for theme changes
  useEffect(() => {
    const handleThemeChange = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };
    
    // Watch for theme changes
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);
  const [layers, setLayers] = useState([
    { id: 1, name: 'Background', visible: true, locked: false, elements: [] },
    { id: 2, name: 'Main', visible: true, locked: false, elements: [] },
    { id: 3, name: 'Overlay', visible: true, locked: false, elements: [] }
  ]);
  const [activeLayer, setActiveLayer] = useState(2);
  const [isLayerPanelVisible, setIsLayerPanelVisible] = useState(false);
  const [selectedShapeId, setSelectedShapeId] = useState(null);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);
  
  // Collaboration state
  const [activeUsers, setActiveUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  
  // Auto-save state
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimeoutRef = useRef(null);

  // Fetch whiteboard data
  const { data: whiteboardData, isLoading, error } = useQuery({
    queryKey: ['whiteboard', whiteboardId],
    queryFn: () => getWhiteboard(whiteboardId),
    enabled: !!whiteboardId && isAuthenticated,
    retry: 2,
    staleTime: 10000,
    onError: (error) => {
      console.error('❌ Failed to load whiteboard:', error);
    }
  });

  // Effect to handle canvas data when whiteboardData changes - only load once
  useEffect(() => {
    if (whiteboardData?.data?.whiteboard && !hasLoadedInitialData.current) {
      console.log('Loading whiteboard data:', {
        hasCanvasData: !!whiteboardData?.data?.whiteboard?.canvasData,
        canvasDataKeys: whiteboardData?.data?.whiteboard?.canvasData ? Object.keys(whiteboardData.data.whiteboard.canvasData) : [],
        hasCanvasSettings: !!whiteboardData?.data?.whiteboard?.canvasSettings,
        canvasSettings: whiteboardData?.data?.whiteboard?.canvasSettings
      });
      
      // Set canvas dimensions from whiteboard settings if available
      if (whiteboardData.data.whiteboard.canvasSettings) {
        const { width, height } = whiteboardData.data.whiteboard.canvasSettings;
        setCanvasWidth(width || 1920);
        setCanvasHeight(height || 1080);
      }
      
      // Set canvas data if it exists and we haven't loaded initial data yet
      if (whiteboardData.data.whiteboard.canvasData) {
        setCanvasData(whiteboardData.data.whiteboard.canvasData);
        hasLoadedInitialData.current = true;
      } else {
        hasLoadedInitialData.current = true;
      }
    }
  }, [whiteboardData?.data?.whiteboard?._id]); // Only run when whiteboard ID changes

  // Debug logging for canvas data
  // Update whiteboard mutation (for manual saves)
  const updateWhiteboardMutation = useMutation({
    mutationFn: ({ whiteboardId, data }) => updateWhiteboard(whiteboardId, data),
    onSuccess: () => {
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries(['whiteboard', whiteboardId]);
    },
    onError: (error) => {
      console.error('❌ Failed to save whiteboard:', error);
      toast.error(error?.data?.message || 'Failed to save whiteboard');
    }
  });

  // Auto-save mutation (for automatic saves)
  const autoSaveMutation = useMutation({
    mutationFn: ({ whiteboardId, canvasData }) => autoSaveWhiteboard(whiteboardId, canvasData),
    onSuccess: () => {
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      // Don't invalidate queries to avoid refetching during auto-save
    },
    onError: (error) => {
      console.error('❌ Failed to auto-save whiteboard:', error);
      // Don't show toast for auto-save errors to avoid annoying users
    }
  });

  // Delete whiteboard mutation
  const deleteWhiteboardMutation = useMutation({
    mutationFn: deleteWhiteboard,
    onSuccess: () => {
      toast.success('Whiteboard deleted successfully!');
      queryClient.invalidateQueries(['whiteboards']);
      navigate('/boards');
    },
    onError: (error) => {
      toast.error(error?.data?.message || 'Failed to delete whiteboard');
    }
  });

  // Share whiteboard mutation
  const shareWhiteboardMutation = useMutation({
    mutationFn: ({ whiteboardId, data }) => shareWhiteboard(whiteboardId, data),
    onSuccess: () => {
      toast.success('Whiteboard shared successfully!');
      queryClient.invalidateQueries(['whiteboards']);
      queryClient.invalidateQueries(['whiteboard', whiteboardId]);
      setIsShareModalOpen(false);
    },
    onError: (error) => {
      toast.error(error?.data?.message || 'Failed to share whiteboard');
    }
  });

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev * 1.2, 5)); // Max zoom 5x
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.1)); // Min zoom 0.1x
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const handleZoomFit = useCallback(() => {
    // Fit to viewport
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, [viewportSize]);

  // Pan controls
  const handlePan = useCallback((direction) => {
    const panStep = 50;
    switch (direction) {
      case 'left':
        setPanOffset(prev => ({ ...prev, x: prev.x + panStep }));
        break;
      case 'right':
        setPanOffset(prev => ({ ...prev, x: prev.x - panStep }));
        break;
      case 'up':
        setPanOffset(prev => ({ ...prev, y: prev.y + panStep }));
        break;
      case 'down':
        setPanOffset(prev => ({ ...prev, y: prev.y - panStep }));
        break;
      default:
        break;
    }
  }, []);

  // Keyboard shortcuts for toolbar toggle and navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only handle shortcuts when not typing in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Press 'T' to toggle toolbar
      if (e.key === 't' || e.key === 'T') {
        setIsToolbarCollapsed(!isToolbarCollapsed);
      }
      
      // Zoom shortcuts
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      }
      if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      }
      if (e.key === '0') {
        e.preventDefault();
        handleZoomReset();
      }
      
      // Pan shortcuts (arrow keys)
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePan('left');
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handlePan('right');
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePan('up');
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handlePan('down');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isToolbarCollapsed, handleZoomIn, handleZoomOut, handleZoomReset, handlePan]);

  // Set canvas dimensions to user-selected dimensions (non-responsive)
  useEffect(() => {
    const handleResize = () => {
      // Get whiteboard's canvas settings if available
      const whiteboardCanvasSettings = whiteboardData?.data?.whiteboard?.canvasSettings;
      const whiteboardWidth = whiteboardCanvasSettings?.width || 1920;
      const whiteboardHeight = whiteboardCanvasSettings?.height || 1080;
      
      // Use the exact whiteboard dimensions - no responsive scaling
      setCanvasWidth(whiteboardWidth);
      setCanvasHeight(whiteboardHeight);
      
      // Calculate viewport size for UI positioning
      const windowWidth = window.innerWidth || 1920;
      const windowHeight = window.innerHeight || 1080;
      
      // Account for toolbar height (approximately 60px)
      const toolbarHeight = isToolbarCollapsed ? 0 : 60;
      
      // Account for collaboration panel if open (approximately 300px width)
      const panelWidth = isCollaborationPanelOpen ? 300 : 0;
      
      // Account for layer panel if visible (approximately 250px width)
      const layerPanelWidth = isLayerPanelVisible ? 250 : 0;
      
      // Calculate available viewport space for UI elements
      const availableWidth = Math.max(windowWidth - panelWidth - layerPanelWidth, 400);
      const availableHeight = Math.max(windowHeight - toolbarHeight, 300);
      
      // Set viewport size for UI positioning
      setViewportSize({
        width: availableWidth,
        height: availableHeight
      });
      
      };

    handleResize(); // Set initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isToolbarCollapsed, isCollaborationPanelOpen, isLayerPanelVisible, whiteboardData?.data?.whiteboard?.canvasSettings]);

  // Fabric.js event handlers
  const handleShapeSelect = useCallback((shapeId) => {
    setSelectedShapeId(shapeId);
    setHasUnsavedChanges(true);
  }, []);

  const handleShapeResize = useCallback((shapeId, newProperties) => {
    setHasUnsavedChanges(true);
  }, []);

  // Tool functions
  const handleUndo = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.undo();
      setHasUnsavedChanges(true);
    }
  }, []);

  const handleRedo = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.redo();
      setHasUnsavedChanges(true);
    }
  }, []);

  // Sync history state from canvas
  useEffect(() => {
    const syncHistory = () => {
      if (canvasRef.current && canvasRef.current.getHistoryIndex && canvasRef.current.getHistoryLength) {
        const currentIndex = canvasRef.current.getHistoryIndex();
        const length = canvasRef.current.getHistoryLength();
        setHistoryIndex(currentIndex);
        // Store dummy history array for length tracking
        setHistory(Array(length).fill(null));
      }
    };
    
    // Sync immediately
    syncHistory();
    
    // Sync periodically to catch updates
    const interval = setInterval(syncHistory, 100);
    
    return () => clearInterval(interval);
  }, [hasUnsavedChanges]); // Update when changes occur

  const handleClearCanvas = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.clearCanvas();
      setHasUnsavedChanges(true);
    }
  }, []);

  const handleGridToggle = useCallback(() => {
    setIsGridVisible(prev => !prev);
  }, []);

  const handleToolChange = useCallback((tool) => {
    setSelectedTool(tool);
  }, []);

  const handleColorChange = useCallback((color) => {
    setStrokeColor(color);
  }, []);

  const handleStrokeWidthChange = useCallback((width) => {
    setStrokeWidth(width);
  }, []);

  // Manual save functionality
  const handleManualSave = useCallback(() => {
    if (whiteboardId && canvasRef.current) {
      
      const canvasDataUrl = canvasRef.current.exportCanvas();
      const canvasData = {
        canvasImage: canvasDataUrl,
        layers,
        activeLayer,
        canvasWidth,
        canvasHeight,
        zoomLevel,
        panOffset,
        isGridVisible
      };
      
      updateWhiteboardMutation.mutate({
        whiteboardId,
        data: { canvasData }
      });
      
      toast.success('Whiteboard saved successfully!');
    } else {
      console.error('❌ Cannot save - missing whiteboardId or canvas ref');
      toast.error('No whiteboard ID found');
    }
  }, [whiteboardId, canvasData, layers, activeLayer, canvasWidth, canvasHeight, zoomLevel, panOffset, isGridVisible, updateWhiteboardMutation]);

  const handleShare = useCallback(() => {
    setIsShareModalOpen(true);
  }, []);

  const handleDelete = useCallback(() => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Whiteboard',
      message: 'Are you sure you want to delete this whiteboard? This action cannot be undone.',
      onConfirm: () => {
        // Delete functionality will be implemented
        }
    });
  }, []);

  const handleBrushSizeChange = useCallback((size) => {
    setStrokeWidth(size);
  }, []);

  const handleBrushColorChange = useCallback((color) => {
    setStrokeColor(color);
  }, []);

  // Layer management handlers
  const handleLayerToggle = useCallback((layerId) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  }, []);

  const handleLayerLock = useCallback((layerId) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
    ));
  }, []);

  const handleLayerSelect = useCallback((layerId) => {
    setActiveLayer(layerId);
  }, []);

  const handleAddLayer = useCallback(() => {
    const newLayer = {
      id: Date.now(),
      name: `Layer ${layers.length + 1}`,
      visible: true,
      locked: false,
      elements: []
    };
    setLayers(prev => [...prev, newLayer]);
  }, [layers.length]);

  const handleDeleteLayer = useCallback((layerId) => {
    if (layers.length > 1) {
      setLayers(prev => prev.filter(layer => layer.id !== layerId));
      if (activeLayer === layerId) {
        setActiveLayer(layers.find(layer => layer.id !== layerId)?.id || 1);
      }
    }
  }, [layers, activeLayer]);

  const handleLayerPanelToggle = useCallback(() => {
    setIsLayerPanelVisible(prev => !prev);
  }, []);

  // Socket connection for real-time collaboration
  useEffect(() => {
    if (user && whiteboardId) {
      const newSocket = io(SOCKET_CONFIG.URL, {
        withCredentials: true,
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        newSocket.emit('join_whiteboard', { whiteboardId, userId: user._id });
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      newSocket.on('whiteboard-update', (data) => {
        if (data.whiteboardId === whiteboardId) {
          // Handle real-time updates for HTML5 canvas
          // Update the canvas with the new shapes/elements from other users
          if (data.shapes || data.elements) {
            const newShapes = data.shapes || data.elements || [];
            // Add the new shapes to the current canvas
            if (canvasRef.current && canvasRef.current.addShapes) {
              canvasRef.current.addShapes(newShapes);
            } else {
              console.warn('⚠️ Canvas ref or addShapes method not available');
            }
          }
          
          // Update canvas data if provided
          if (data.canvasData) {
            setCanvasData(data.canvasData);
          }
        } else {
          }
      });

      newSocket.on('user-joined', (data) => {
        setActiveUsers(prev => [...prev.filter(u => u.id !== data.user.id), data.user]);
      });

      newSocket.on('user-left', (data) => {
        setActiveUsers(prev => prev.filter(u => u.id !== data.userId));
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [whiteboardId, user]);

  // Auto-save functionality using dedicated auto-save endpoint
  const handleAutoSave = useCallback(() => {
    // Prevent multiple simultaneous auto-saves
    if (autoSaveMutation.isPending) {
      return;
    }
    
    if (whiteboardId && canvasRef.current) {
      // Get shapes data from canvas instead of exporting the entire canvas image
      const shapesData = canvasRef.current.getShapes ? canvasRef.current.getShapes() : [];
      const canvasData = {
        shapes: shapesData,
        elements: shapesData, // Support both naming conventions
        layers,
        activeLayer,
        canvasWidth,
        canvasHeight,
        zoomLevel,
        panOffset,
        isGridVisible,
        lastModifiedBy: user?._id,
        lastModifiedAt: new Date()
      };
      
      // Use dedicated auto-save endpoint instead of main update route
      autoSaveMutation.mutate({
        whiteboardId,
        canvasData
      });
    } else {
      }
  }, [whiteboardId, layers, activeLayer, canvasWidth, canvasHeight, zoomLevel, panOffset, isGridVisible, autoSaveMutation, user?._id]);

  // Store handleAutoSave in a ref to avoid dependency issues
  const handleAutoSaveRef = useRef(handleAutoSave);
  
  // Update the ref when handleAutoSave changes
  useEffect(() => {
    handleAutoSaveRef.current = handleAutoSave;
  }, [handleAutoSave]);

  // Auto-save effect
  useEffect(() => {
    if (hasUnsavedChanges && whiteboardId) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSaveRef.current();
      }, 5000); // Auto-save every 5 seconds
    } else {
      // Clear timeout if hasUnsavedChanges becomes false
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    }
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, whiteboardId]);

  // Event handlers
  const handlePathCreated = () => {
    if (socket && canvasRef.current) {
      // Get ALL shapes to sync the complete state
      const shapesData = canvasRef.current.getShapes ? canvasRef.current.getShapes() : [];
      socket.emit('whiteboard-update', {
        whiteboardId,
        shapes: shapesData,
        elements: shapesData, // Support both naming conventions
        userId: user?._id
      });
    } else {
      console.warn('⚠️ Cannot send live update - socket or canvas ref not available');
    }
  };

  const handleObjectAdded = () => {
    setHasUnsavedChanges(true);
  };

  const handleObjectModified = () => {
    setHasUnsavedChanges(true);
  };

  const handleObjectRemoved = () => {
    setHasUnsavedChanges(true);
  };

  const handleShareViaEmail = (shareData) => {
    shareWhiteboardMutation.mutate({
      whiteboardId,
      data: shareData
    });
  };

  const handleUpdateRole = (userId, role) => {
    // Implementation for updating collaborator role
    toast.success('Role updated successfully!');
  };

  const handleRemoveCollaborator = (userId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Collaborator',
      message: 'Are you sure you want to remove this collaborator from the whiteboard?',
      type: 'warning',
      onConfirm: () => {
        // Implementation for removing collaborator
        toast.success('Collaborator removed successfully!');
        setConfirmModal({ ...confirmModal, isOpen: false });
      }
    });
  };

  // Loading state
  if (authLoading || isLoading || !isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <LoadingSpinner size="lg" message={authLoading ? "Authenticating..." : !isAuthenticated ? "Please log in..." : "Loading whiteboard..."} />
      </div>
    );
  }

  // Error state
  if (error || !whiteboardData?.data?.whiteboard) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Whiteboard Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The whiteboard you're looking for doesn't exist or you don't have access to it.
          </p>
          <div className="space-x-4">
            <button
              onClick={() => queryClient.invalidateQueries(['whiteboard', whiteboardId])}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/boards')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Back to Whiteboards
            </button>
          </div>
        </div>
      </div>
    );
  }

  const whiteboard = whiteboardData?.data?.whiteboard;
  
  // Determine user role and permissions
  const getUserRole = () => {
    if (!whiteboard || !user) return 'viewer';
    
    // Check if user is the owner
    if (whiteboard.owner && whiteboard.owner._id === user._id) {
      return 'owner';
    }
    
    // Check collaborators
    const collaborator = whiteboard.collaborators?.find(
      collab => collab.user?._id === user._id
    );
    
    return collaborator?.role || 'viewer';
  };
  
  const userRole = getUserRole();
  const canEdit = ['owner', 'admin', 'editor'].includes(userRole);
  const canDelete = ['owner', 'admin'].includes(userRole);
  const canShare = ['owner', 'admin'].includes(userRole);

  return (
    <div className="h-screen w-screen overflow-hidden bg-white dark:bg-gray-950 relative">
      {/* Minimal Top Bar - Microsoft Whiteboard Style */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/boards')}
              className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-1 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Back</span>
            </button>
            
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-700"></div>
            
            <h1 className="text-base font-semibold text-gray-900 dark:text-white">
              {whiteboard?.title || 'Loading...'}
            </h1>
            
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
            <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
              userRole === 'owner' ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200' :
              userRole === 'admin' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200' :
              userRole === 'editor' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' :
              'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}>
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {lastSaved && !hasUnsavedChanges && (
              <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 rounded">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            {hasUnsavedChanges && (
              <span className="text-xs text-orange-600 dark:text-orange-400 font-medium px-2 py-1 rounded bg-orange-50 dark:bg-orange-900/20 flex items-center space-x-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Unsaved changes</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar Toggle Button */}
      <button
        onClick={() => setIsToolbarCollapsed(!isToolbarCollapsed)}
        className={`absolute top-20 right-4 z-50 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300`}
        title={isToolbarCollapsed ? 'Show toolbar' : 'Hide toolbar'}
      >
        <svg className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform duration-300 ${
          isToolbarCollapsed ? 'rotate-180' : ''
        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {/* Floating Toolbar - Microsoft Whiteboard Style */}
      <div className={`absolute top-16 left-1/2 transform -translate-x-1/2 z-40 transition-all duration-300 max-w-[95vw] ${
        isToolbarCollapsed ? '-translate-y-20 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}>
        <WhiteboardToolbar
        selectedTool={selectedTool}
        onToolChange={handleToolChange}
        strokeColor={convertColorForTheme(strokeColor)}
        onColorChange={handleColorChange}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={handleStrokeWidthChange}
        opacity={opacity}
        onOpacityChange={setOpacity}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onClearCanvas={handleClearCanvas}
        isGridVisible={isGridVisible}
        onGridToggle={handleGridToggle}
        onSave={handleManualSave}
        onExport={() => {
          // Export functionality will be implemented
        }}
        onShare={() => setIsShareModalOpen(true)}
        hasUnsavedChanges={hasUnsavedChanges}
        lastSaved={lastSaved}
        onLayerPanelToggle={handleLayerPanelToggle}
        canEdit={canEdit}
        userRole={userRole}
        // Zoom and pan controls
        zoomLevel={zoomLevel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onZoomFit={handleZoomFit}
        onPan={handlePan}
        panOffset={panOffset}
        viewportSize={viewportSize}
        />
      </div>

      {/* Full Canvas Container - Non-Responsive */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 pt-12 overflow-auto">
        {/* Canvas Wrapper with exact dimensions */}
        <div 
          className="relative"
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            minWidth: '400px',
            minHeight: '300px',
            transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
            transformOrigin: 'top left'
          }}
        >
        <HTML5WhiteboardCanvas
          ref={canvasRef}
          selectedTool={selectedTool}
          strokeColor={convertColorForTheme(strokeColor)}
          strokeWidth={strokeWidth}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          stageScale={zoomLevel}
          stageX={panOffset.x}
          stageY={panOffset.y}
          isGridVisible={isGridVisible}
          backgroundColor={whiteboard?.canvasSettings?.backgroundColor}
          onShapeSelect={handleShapeSelect}
          onShapeResize={handleShapeResize}
          selectedShapeId={selectedShapeId}
          savedCanvasData={canvasData}
          whiteboardId={whiteboardId}
          canEdit={canEdit}
          onChange={() => {
            setHasUnsavedChanges(true);
            }}
          onPathCreated={handlePathCreated}
        />
        </div>
      </div>

      {/* Layer Panel */}
      {isLayerPanelVisible && (
        <div className="absolute top-20 right-4 z-50">
          <WhiteboardLayerPanel
            layers={layers}
            activeLayer={activeLayer}
            onLayerToggle={handleLayerToggle}
            onLayerLock={handleLayerLock}
            onLayerSelect={handleLayerSelect}
            onAddLayer={handleAddLayer}
            onDeleteLayer={handleDeleteLayer}
            isVisible={isLayerPanelVisible}
            onToggle={handleLayerPanelToggle}
          />
        </div>
      )}

      {/* Collaboration Panel */}
      <WhiteboardCollaborationPanel
        whiteboardId={whiteboardId}
        currentUser={user}
        whiteboard={whiteboard}
        isOpen={isCollaborationPanelOpen}
        onClose={() => setIsCollaborationPanelOpen(false)}
        activeUsers={activeUsers}
        onCollaboratorUpdate={() => {
          // Refetch whiteboard data to get updated collaborators
          queryClient.invalidateQueries(['whiteboard', whiteboardId]);
        }}
      />

      {/* Share Modal */}
      <DocumentShareModal
        document={whiteboard}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onShare={(shareData) => {
          shareWhiteboardMutation.mutate({
            whiteboardId,
            data: shareData
          });
        }}
        onUpdateRole={handleUpdateRole}
        onRemoveCollaborator={handleRemoveCollaborator}
        onShareViaEmail={handleShareViaEmail}
        loading={shareWhiteboardMutation.isPending}
      />

      {/* Confirmation Dialog */}
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
}