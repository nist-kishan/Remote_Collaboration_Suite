import { useRef, useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { getUserRole, canPerformAction } from '../utils/roleUtils';

export const useWhiteboardCanvas = ({ whiteboard, onSave, socket }) => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const { user: currentUser } = useSelector((state) => state.auth);
  
  // Canvas state
  const [currentTool, setCurrentTool] = useState('pencil');
  const [brushSize, setBrushSize] = useState(3);
  const [brushColor, setBrushColor] = useState('#000000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [brushCap, setBrushCap] = useState('round');
  const [smoothing, setSmoothing] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [textColor, setTextColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('#transparent');
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showFillColorPicker, setShowFillColorPicker] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showBrushSettings, setShowBrushSettings] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [fabricLoaded, setFabricLoaded] = useState(false);
  const [fabric, setFabric] = useState(null);

  // Get user permissions
  const userRole = whiteboard ? getUserRole(whiteboard, currentUser) : 'owner';
  const canEdit = whiteboard ? canPerformAction(whiteboard, currentUser, 'canEdit') : true;
  const canView = whiteboard ? canPerformAction(whiteboard, currentUser, 'canView') : true;

  // Load Fabric.js dynamically
  useEffect(() => {
    const loadFabric = async () => {
      try {
        const fabricModule = await import('fabric');
        setFabric(fabricModule.fabric || fabricModule);
        setFabricLoaded(true);
      } catch (error) {
      }
    };
    
    loadFabric();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) {
        e.preventDefault();
        handleRedo();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        const canvas = fabricCanvasRef.current;
        if (canvas && canvas.getActiveObject()) {
          canvas.remove(canvas.getActiveObject());
          canvas.renderAll();
        }
      }
      if (e.key >= '1' && e.key <= '9') {
        const size = parseInt(e.key);
        setBrushSize(size);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Close color pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showTextColorPicker && !e.target.closest('[data-text-color-picker]')) {
        setShowTextColorPicker(false);
      }
      if (showFillColorPicker && !e.target.closest('[data-fill-color-picker]')) {
        setShowFillColorPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTextColorPicker, showFillColorPicker]);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || !fabricLoaded || !fabric) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: whiteboard?.canvasSettings?.width || 1200,
      height: whiteboard?.canvasSettings?.height || 800,
      backgroundColor: whiteboard?.canvasSettings?.backgroundColor || '#ffffff',
      isDrawingMode: currentTool === 'pencil' || currentTool === 'eraser',
    });

    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.width = brushSize;
    canvas.freeDrawingBrush.color = brushColor;
    canvas.freeDrawingBrush.opacity = brushOpacity;
    
    if (smoothing) {
      canvas.freeDrawingBrush.decimate = 2;
    }

    fabricCanvasRef.current = canvas;

    if (whiteboard?.canvasData && Object.keys(whiteboard.canvasData).length > 0) {
      canvas.loadFromJSON(whiteboard.canvasData, () => {
        canvas.renderAll();
      });
    }

    setupCanvasEvents(canvas);

    return () => {
      canvas.dispose();
    };
  }, [whiteboard?._id, fabricLoaded, fabric]);

  // Update brush settings
  useEffect(() => {
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      
      canvas.isDrawingMode = currentTool === 'pencil' || currentTool === 'eraser';
      
      if (currentTool === 'eraser') {
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.width = brushSize;
        canvas.freeDrawingBrush.color = '#ffffff';
        canvas.freeDrawingBrush.opacity = 1;
      } else if (currentTool === 'pencil') {
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.width = brushSize;
        canvas.freeDrawingBrush.color = brushColor;
        canvas.freeDrawingBrush.opacity = brushOpacity;
        
        if (smoothing) {
          canvas.freeDrawingBrush.decimate = 2;
        }
      }
    }
  }, [brushSize, brushColor, currentTool, brushOpacity, smoothing]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !whiteboard || !currentUser) return;

    const handleDrawing = (data) => {
      if (data.userId === currentUser._id) return;
      
      const canvas = fabricCanvasRef.current;
      if (canvas && data.path) {
        const path = new fabric.Path(data.path, {
          stroke: data.color,
          strokeWidth: data.width,
          fill: '',
        });
        canvas.add(path);
      }
    };

    const handleShapeCreated = (data) => {
      if (data.userId === currentUser._id) return;
      
      const canvas = fabricCanvasRef.current;
      if (canvas) {
        const shape = fabric.util.enlivenObjects([data.shape], (objects) => {
          objects.forEach(obj => canvas.add(obj));
        });
      }
    };

    const handleObjectModified = (data) => {
      if (data.userId === currentUser._id) return;
      
      const canvas = fabricCanvasRef.current;
      if (canvas) {
        const obj = canvas.getObjects().find(o => o.id === data.objectId);
        if (obj) {
          obj.set(data.properties);
          canvas.renderAll();
        }
      }
    };

    const handleObjectDeleted = (data) => {
      if (data.userId === currentUser._id) return;
      
      const canvas = fabricCanvasRef.current;
      if (canvas) {
        const obj = canvas.getObjects().find(o => o.id === data.objectId);
        if (obj) {
          canvas.remove(obj);
        }
      }
    };

    const handleActiveUsers = (data) => {
      setActiveUsers(data.activeUsers);
    };

    const handleUserJoined = (data) => {
      setActiveUsers(data.activeUsers);
    };

    const handleUserLeft = (data) => {
      setActiveUsers(data.activeUsers);
    };

    const handleChatMessage = (data) => {
      setChatMessages(prev => [...prev, data]);
    };

    if (whiteboard && currentUser) {
      socket.emit('join_whiteboard', { 
        whiteboardId: whiteboard._id,
        userId: currentUser._id,
        userName: currentUser.name || currentUser.username
      });
    }

    socket.on('drawing', handleDrawing);
    socket.on('shape_created', handleShapeCreated);
    socket.on('object_modified', handleObjectModified);
    socket.on('object_deleted', handleObjectDeleted);
    socket.on('active_users', handleActiveUsers);
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);
    socket.on('chat_message', handleChatMessage);

    return () => {
      socket.off('drawing', handleDrawing);
      socket.off('shape_created', handleShapeCreated);
      socket.off('object_modified', handleObjectModified);
      socket.off('object_deleted', handleObjectDeleted);
      socket.off('active_users', handleActiveUsers);
      socket.off('user_joined', handleUserJoined);
      socket.off('user_left', handleUserLeft);
      socket.off('chat_message', handleChatMessage);
    };
  }, [socket, whiteboard?._id, currentUser?._id]);

  const setupCanvasEvents = (canvas) => {
    canvas.on('path:created', (e) => {
      if (socket && canEdit) {
        const path = e.path;
        socket.emit('drawing', {
          path: path.path,
          color: path.stroke,
          width: path.strokeWidth,
        });
      }
    });

    canvas.on('object:added', (e) => {
      if (socket && canEdit && e.target.id) {
        socket.emit('shape_created', {
          shape: e.target.toObject(),
        });
      }
    });

    canvas.on('object:modified', (e) => {
      if (socket && canEdit) {
        socket.emit('object_modified', {
          objectId: e.target.id,
          properties: e.target.toObject(),
        });
      }
    });

    canvas.on('object:removed', (e) => {
      if (socket && canEdit) {
        socket.emit('object_deleted', {
          objectId: e.target.id,
        });
      }
    });
  };

  const handleToolChange = (tool) => {
    if (!canEdit) return;
    
    setCurrentTool(tool);
    
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      canvas.off('mouse:down');
      canvas.off('mouse:move');
      canvas.off('mouse:up');
      
      canvas.isDrawingMode = tool === 'pencil' || tool === 'eraser';
      
      if (tool === 'eraser') {
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.width = brushSize;
        canvas.freeDrawingBrush.color = '#ffffff';
        canvas.freeDrawingBrush.opacity = 1;
      } else if (tool === 'pencil') {
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.width = brushSize;
        canvas.freeDrawingBrush.color = brushColor;
        canvas.freeDrawingBrush.opacity = brushOpacity;
      } else {
        canvas.isDrawingMode = false;
      }
    }
  };

  const handleShapeCreation = (shapeType) => {
    if (!canEdit) return;
    
    setCurrentTool(shapeType);
    
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = false;

    canvas.off('mouse:down');
    canvas.off('mouse:move');
    canvas.off('mouse:up');

    let isDrawing = false;
    let startX, startY;
    let shape = null;

    const onMouseDown = (e) => {
      const pointer = canvas.getPointer(e.e);
      isDrawing = true;
      startX = pointer.x;
      startY = pointer.y;

      const id = `shape_${Date.now()}`;

      switch (shapeType) {
        case 'rectangle':
          shape = new fabric.Rect({
            left: startX,
            top: startY,
            width: 0,
            height: 0,
            fill: fillColor === '#transparent' ? 'transparent' : fillColor,
            stroke: brushColor,
            strokeWidth: brushSize,
            id,
          });
          break;
        case 'circle':
          shape = new fabric.Circle({
            left: startX,
            top: startY,
            radius: 0,
            fill: fillColor === '#transparent' ? 'transparent' : fillColor,
            stroke: brushColor,
            strokeWidth: brushSize,
            id,
          });
          break;
        case 'line':
          shape = new fabric.Line([startX, startY, startX, startY], {
            stroke: brushColor,
            strokeWidth: brushSize,
            id,
          });
          break;
        case 'arrow':
          shape = new fabric.Path(`M ${startX} ${startY} L ${startX} ${startY}`, {
            stroke: brushColor,
            strokeWidth: brushSize,
            fill: '',
            id,
          });
          break;
        default:
          return;
      }

      canvas.add(shape);
      canvas.renderAll();
    };

    const onMouseMove = (e) => {
      if (!isDrawing || !shape) return;

      const pointer = canvas.getPointer(e.e);
      const width = pointer.x - startX;
      const height = pointer.y - startY;

      switch (shapeType) {
        case 'rectangle':
          shape.set({
            width: Math.abs(width),
            height: Math.abs(height),
            left: width < 0 ? pointer.x : startX,
            top: height < 0 ? pointer.y : startY,
          });
          break;
        case 'circle':
          const radius = Math.sqrt(width * width + height * height) / 2;
          shape.set({
            radius: radius,
            left: startX - radius,
            top: startY - radius,
          });
          break;
        case 'line':
          shape.set({
            x2: pointer.x,
            y2: pointer.y,
          });
          break;
        case 'arrow':
          const angle = Math.atan2(height, width);
          const arrowLength = Math.sqrt(width * width + height * height);
          const arrowHeadSize = 20;
          const arrowHeadAngle = Math.PI / 6;
          
          const x2 = startX + arrowLength * Math.cos(angle);
          const y2 = startY + arrowLength * Math.sin(angle);
          
          const x3 = x2 - arrowHeadSize * Math.cos(angle - arrowHeadAngle);
          const y3 = y2 - arrowHeadSize * Math.sin(angle - arrowHeadAngle);
          
          const x4 = x2 - arrowHeadSize * Math.cos(angle + arrowHeadAngle);
          const y4 = y2 - arrowHeadSize * Math.sin(angle + arrowHeadAngle);
          
          shape.set({
            path: `M ${startX} ${startY} L ${x2} ${y2} M ${x2} ${y2} L ${x3} ${y3} M ${x2} ${y2} L ${x4} ${y4}`,
          });
          break;
      }

      canvas.renderAll();
    };

    const onMouseUp = () => {
      if (isDrawing && shape) {
        canvas.setActiveObject(shape);
        canvas.renderAll();
        
        if (socket && canEdit) {
          socket.emit('shape_created', {
            shape: shape.toObject(),
            whiteboardId: whiteboard._id,
          });
        }
      }
      
      isDrawing = false;
      shape = null;
      
      canvas.off('mouse:down', onMouseDown);
      canvas.off('mouse:move', onMouseMove);
      canvas.off('mouse:up', onMouseUp);
    };

    canvas.on('mouse:down', onMouseDown);
    canvas.on('mouse:move', onMouseMove);
    canvas.on('mouse:up', onMouseUp);
  };

  const handleTextCreation = () => {
    if (!canEdit) return;
    
    setCurrentTool('text');
    
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = false;

    const onMouseDown = (e) => {
      const pointer = canvas.getPointer(e.e);
      
      const text = new fabric.IText('Double click to edit', {
        left: pointer.x,
        top: pointer.y,
        fontSize: 20,
        fill: textColor,
        fontFamily: 'Arial',
        id: `text_${Date.now()}`,
      });

      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
      
      if (socket && canEdit) {
        socket.emit('shape_created', {
          shape: text.toObject(),
          whiteboardId: whiteboard._id,
        });
      }
      
      canvas.off('mouse:down', onMouseDown);
    };

    canvas.on('mouse:down', onMouseDown);
  };

  const handleUndo = () => {
    if (!canEdit) return;
    
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      try {
        canvas.undo();
        canvas.renderAll();
        
        if (socket && canEdit) {
          socket.emit('canvas_state', {
            canvasData: canvas.toJSON(),
            whiteboardId: whiteboard._id,
          });
        }
      } catch (error) {
        throw error;
      }
    }
  };

  const handleRedo = () => {
    if (!canEdit) return;
    
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      try {
        canvas.redo();
        canvas.renderAll();
        
        if (socket && canEdit) {
          socket.emit('canvas_state', {
            canvasData: canvas.toJSON(),
            whiteboardId: whiteboard._id,
          });
        }
      } catch (error) {
        throw error;
      }
    }
  };

  const handleDeleteSelected = () => {
    if (!canEdit) return;
    
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        canvas.remove(activeObject);
        canvas.renderAll();
        
        if (socket && canEdit) {
          socket.emit('object_deleted', {
            objectId: activeObject.id,
            whiteboardId: whiteboard._id,
          });
        }
      }
    }
  };

  const handleSave = () => {
    if (!canEdit) return;
    
    const canvas = fabricCanvasRef.current;
    if (canvas && onSave) {
      const canvasData = canvas.toJSON();
      onSave({
        canvasData,
        version: whiteboard.version + 1,
      });
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket) return;
    
    socket.emit('chat_message', {
      message: newMessage.trim(),
      whiteboardId: whiteboard._id,
    });
    
    setNewMessage('');
  };

  return {
    // Refs
    canvasRef,
    fabricCanvasRef,
    
    // State
    currentTool,
    brushSize,
    brushColor,
    isDrawing,
    activeUsers,
    brushOpacity,
    brushCap,
    smoothing,
    showChat,
    textColor,
    fillColor,
    showTextColorPicker,
    showFillColorPicker,
    chatMessages,
    showMobileMenu,
    showBrushSettings,
    newMessage,
    fabricLoaded,
    
    // Permissions
    userRole,
    canEdit,
    canView,
    
    // Setters
    setBrushSize,
    setBrushColor,
    setBrushOpacity,
    setSmoothing,
    setShowChat,
    setTextColor,
    setFillColor,
    setShowTextColorPicker,
    setShowFillColorPicker,
    setShowMobileMenu,
    setShowBrushSettings,
    setNewMessage,
    
    // Handlers
    handleToolChange,
    handleShapeCreation,
    handleTextCreation,
    handleUndo,
    handleRedo,
    handleDeleteSelected,
    handleSave,
    handleSendMessage,
  };
};

