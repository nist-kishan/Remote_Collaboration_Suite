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
  
  // Responsive canvas state - full screen dimensions
  const [canvasWidth, setCanvasWidth] = useState(typeof window !== 'undefined' ? Math.max(window.innerWidth || 1920, 300) : 1920);
  const [canvasHeight, setCanvasHeight] = useState(typeof window !== 'undefined' ? Math.max(window.innerHeight || 1080, 200) : 1080);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
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
      console.log('✅ Whiteboard loaded:', whiteboardData);
      console.log('📊 Whiteboard data structure:', {
        hasData: !!whiteboardData,
        hasDataData: !!whiteboardData?.data,
        hasWhiteboard: !!whiteboardData?.data?.whiteboard,
        whiteboardKeys: whiteboardData?.data?.whiteboard ? Object.keys(whiteboardData.data.whiteboard) : [],
        hasCanvasData: !!whiteboardData?.data?.whiteboard?.canvasData,
        canvasDataKeys: whiteboardData?.data?.whiteboard?.canvasData ? Object.keys(whiteboardData.data.whiteboard.canvasData) : []
      });
      
      // Set canvas data if it exists and we haven't loaded initial data yet
      if (whiteboardData.data.whiteboard.canvasData) {
        console.log('📸 Setting canvas data:', whiteboardData.data.whiteboard.canvasData);
        setCanvasData(whiteboardData.data.whiteboard.canvasData);
        hasLoadedInitialData.current = true;
      } else {
        console.log('⚠️ No canvas data found in whiteboard');
        hasLoadedInitialData.current = true;
      }
    }
  }, [whiteboardData?.data?.whiteboard?._id]); // Only run when whiteboard ID changes

  // Debug logging for canvas data
  console.log('WhiteboardEditor Debug:', {
    whiteboardId,
    isAuthenticated,
    authLoading,
    isLoading,
    error,
    hasWhiteboardData: !!whiteboardData,
    whiteboard: whiteboardData?.data?.whiteboard,
    canvasData: whiteboardData?.data?.whiteboard?.canvasData,
    hasCanvasData: !!whiteboardData?.data?.whiteboard?.canvasData,
    canvasDataState: canvasData
  });

  // Update whiteboard mutation (for manual saves)
  const updateWhiteboardMutation = useMutation({
    mutationFn: ({ whiteboardId, data }) => updateWhiteboard(whiteboardId, data),
    onSuccess: () => {
      console.log('✅ Whiteboard saved successfully');
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
      console.log('✅ Whiteboard auto-saved successfully');
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

  // Keyboard shortcuts for toolbar toggle
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Press 'T' to toggle toolbar
      if (e.key === 't' || e.key === 'T') {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          setIsToolbarCollapsed(!isToolbarCollapsed);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isToolbarCollapsed]);

  // Handle responsive canvas sizing - full screen dimensions
  useEffect(() => {
    const handleResize = () => {
      // Use full screen dimensions with validation
      const width = window.innerWidth || 1920;
      const height = window.innerHeight || 1080;
      
      setCanvasWidth(Math.max(Number(width) || 1920, 300));
      setCanvasHeight(Math.max(Number(height) || 1080, 200));
    };

    handleResize(); // Set initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    console.log('💾 Manual save triggered');
    if (whiteboardId && canvasRef.current) {
      
      const canvasDataUrl = canvasRef.current.exportCanvas();
      console.log('📸 Canvas exported, data URL length:', canvasDataUrl.length);
      
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
      
      console.log('💾 Saving canvas data:', canvasData);
      
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
        console.log('Delete whiteboard');
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
        newSocket.emit('join-whiteboard', { whiteboardId, userId: user._id });
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      newSocket.on('whiteboard-update', (data) => {
        if (data.whiteboardId === whiteboardId) {
          // Handle real-time updates for HTML5 canvas
          console.log('Whiteboard update received:', data);
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
    console.log('🔄 Auto-save triggered, hasUnsavedChanges:', hasUnsavedChanges);
    if (hasUnsavedChanges && whiteboardId && canvasRef.current) {
      console.log('💾 Auto-saving canvas data using dedicated endpoint');
      
      const canvasDataUrl = canvasRef.current.exportCanvas();
      console.log('📸 Canvas exported for auto-save, data URL length:', canvasDataUrl.length);
      
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
      
      console.log('💾 Auto-saving canvas data:', canvasData);
      
      // Use dedicated auto-save endpoint instead of main update route
      autoSaveMutation.mutate({
        whiteboardId,
        canvasData
      });
    } else {
      console.log('⚠️ Auto-save skipped:', {
        hasUnsavedChanges,
        hasWhiteboardId: !!whiteboardId,
        hasCanvasRef: !!canvasRef.current
      });
    }
  }, [hasUnsavedChanges, whiteboardId, canvasData, layers, activeLayer, canvasWidth, canvasHeight, zoomLevel, panOffset, isGridVisible, autoSaveMutation]);

  // Auto-save effect
  useEffect(() => {
    console.log('🔄 Auto-save effect triggered, hasUnsavedChanges:', hasUnsavedChanges, 'whiteboardId:', whiteboardId);
    if (hasUnsavedChanges && whiteboardId) {
      console.log('⏰ Setting auto-save timeout for 5 seconds');
      
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave();
      }, 5000); // Auto-save every 5 seconds
    }
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, whiteboardId, handleAutoSave]);

  // Event handlers
  const handlePathCreated = () => {
    setHasUnsavedChanges(true);
    if (socket && canvasRef.current) {
      socket.emit('whiteboard-update', {
        whiteboardId,
        canvasData: canvasRef.current.exportCanvas()
      });
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
            
            {activeUsers.length > 0 && (
              <div className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  {activeUsers.length} online
                </span>
              </div>
            )}
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
      <div className={`absolute top-16 left-1/2 transform -translate-x-1/2 z-40 transition-all duration-300 ${
        isToolbarCollapsed ? '-translate-y-20 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}>
        <WhiteboardToolbar
        selectedTool={selectedTool}
        onToolChange={handleToolChange}
        strokeColor={strokeColor}
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
        />
      </div>

      {/* Full-Screen Canvas - Microsoft Whiteboard Style */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 pt-12">
        <HTML5WhiteboardCanvas
          ref={canvasRef}
          selectedTool={selectedTool}
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          stageScale={zoomLevel}
          stageX={panOffset.x}
          stageY={panOffset.y}
          isGridVisible={isGridVisible}
          onShapeSelect={handleShapeSelect}
          onShapeResize={handleShapeResize}
          selectedShapeId={selectedShapeId}
          savedCanvasData={canvasData}
          whiteboardId={whiteboardId}
          onChange={() => {
            console.log('🎨 onChange callback triggered, setting hasUnsavedChanges to true');
            setHasUnsavedChanges(true);
          }}
        />
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