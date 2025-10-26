import React, { useEffect, useRef, forwardRef, useImperativeHandle, useCallback, useState } from 'react';

const HTML5WhiteboardCanvas = forwardRef(({
  selectedTool,
  strokeColor,
  strokeWidth,
  onShapeSelect,
  onShapeResize,
  selectedShapeId,
  canvasWidth,
  canvasHeight,
  stageScale,
  stageX,
  stageY,
  isGridVisible,
  backgroundColor,
  savedCanvasData,
  onChange,
  onPathCreated,
  whiteboardId,
  canEdit = true,
}, ref) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawingRef = useRef(false);
  const startPosRef = useRef(null);
  const currentShapeRef = useRef(null);
  const shapesRef = useRef([]);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const backgroundImageRef = useRef(null); // Store the loaded background image
  const selectedShapeIndexRef = useRef(-1); // Track selected shape
  const isDraggingRef = useRef(false); // Track if dragging shape
  const isResizingRef = useRef(false); // Track if resizing shape
  const resizeHandleRef = useRef(null); // Track which resize handle
  const initialShapeDataRef = useRef(null); // Store initial shape data for resize
  const selectionRectRef = useRef(null); // Store selection rectangle for area eraser
  const isSelectingAreaRef = useRef(false); // Track if selecting area for eraser
  const [isLoading, setIsLoading] = useState(true); // Track loading state
  const lastChangeTimeRef = useRef(0); // Track last change time for throttling
  
  // Convert color based on theme
  const convertColorForTheme = (color) => {
    const isDarkMode = document.documentElement.classList.contains('dark');
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
  
  // Get converted color
  const convertedColor = convertColorForTheme(strokeColor);

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    exportCanvas: () => {
      if (canvasRef.current && ctxRef.current) {
        // Temporarily deselect shape before exporting
        const tempSelectedIndex = selectedShapeIndexRef.current;
        selectedShapeIndexRef.current = -1;
        
        // Redraw canvas without selection rectangle
        redrawCanvas();
        
        // Export the canvas
        const dataUrl = canvasRef.current.toDataURL('image/png');
        
        // Restore selection
        selectedShapeIndexRef.current = tempSelectedIndex;
        
        // Redraw canvas with selection restored
        redrawCanvas();
        
        return dataUrl;
      }
      return null;
    },
    clearCanvas: () => {
      if (ctxRef.current && canvasRef.current) {
        const ctx = ctxRef.current;
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        // Set background color - use provided backgroundColor or theme-aware default
        const isDarkMode = document.documentElement.classList.contains('dark');
        let bgColor = backgroundColor || (isDarkMode ? '#111827' : '#ffffff');
        
        // Normalize color format
        if (bgColor && !bgColor.startsWith('#')) {
          bgColor = `#${bgColor}`;
        }
        
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        shapesRef.current = [];
        backgroundImageRef.current = null; // Clear background image too
        drawGrid();
      }
    },
    addShape: (shapeData) => {
      if (shapeData && shapesRef.current) {
        shapesRef.current.push(shapeData);
        redrawCanvas();
      }
    },
    addShapes: (newShapes) => {
      if (Array.isArray(newShapes) && newShapes.length > 0) {
        // Track which shapes were actually added
        let addedCount = 0;
        
        // Add new shapes to the existing shapes array
        newShapes.forEach(shape => {
          // Create a unique identifier for the shape to check for duplicates
          const shapeId = shape.id || `${shape.type}-${JSON.stringify(shape.points || [shape.x, shape.y, shape.width, shape.height])}`;
          
          // Check if shape already exists by comparing multiple properties
          const existingShape = shapesRef.current.find(existingShape => {
            // If both have IDs, compare them
            if (existingShape.id && shape.id && existingShape.id === shape.id) {
              return true;
            }
            
            // Compare by type and key properties
            if (existingShape.type === shape.type) {
              if (shape.type === 'path' && shape.points && existingShape.points) {
                return JSON.stringify(existingShape.points) === JSON.stringify(shape.points);
              } else if (['rectangle', 'circle', 'line'].includes(shape.type)) {
                return existingShape.x === shape.x && 
                       existingShape.y === shape.y && 
                       existingShape.width === shape.width && 
                       existingShape.height === shape.height;
              }
            }
            return false;
          });
          
          if (!existingShape) {
            shapesRef.current.push(shape);
            addedCount++;
          }
        });
        
        // Redraw the canvas with the new shapes
        redrawCanvas();
        }
    },
    undo: () => {
      if (historyIndexRef.current > 0) {
        historyIndexRef.current--;
        const previousState = historyRef.current[historyIndexRef.current];
        shapesRef.current = [...previousState];
        redrawCanvas();
      } else {
        }
    },
    redo: () => {
      if (historyIndexRef.current < historyRef.current.length - 1) {
        historyIndexRef.current++;
        const nextState = historyRef.current[historyIndexRef.current];
        shapesRef.current = [...nextState];
        redrawCanvas();
      } else {
        }
    },
    getShapes: () => {
      return shapesRef.current;
    },
    getHistoryIndex: () => {
      return historyIndexRef.current;
    },
    getHistoryLength: () => {
      return historyRef.current.length;
    }
  }));

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctxRef.current = ctx;
      
      // Use a timeout to ensure container is properly sized
      setTimeout(() => {
        // Get container dimensions
        const container = canvas.parentElement;
        const containerWidth = container?.clientWidth || window.innerWidth;
        const containerHeight = container?.clientHeight || window.innerHeight;
        
        // Use full container dimensions instead of square
        const width = Math.max(Number(containerWidth) || 1920, 300);
        const height = Math.max(Number(containerHeight) || 1080, 200);
        
        // Final NaN check
        if (isNaN(width) || isNaN(height)) {
          console.warn('Invalid canvas dimensions detected, using defaults');
          canvas.width = 1920;
          canvas.height = 1080;
        } else {
          canvas.width = width;
          canvas.height = height;
        }
        
        // Set drawing styles
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Set background color - use provided backgroundColor or theme-aware default
        const isDarkMode = document.documentElement.classList.contains('dark');
        let bgColor = backgroundColor || (isDarkMode ? '#111827' : '#ffffff');
        
        // Normalize color format
        if (bgColor && !bgColor.startsWith('#')) {
          bgColor = `#${bgColor}`;
        }
        
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw initial grid
        if (isGridVisible) {
          drawGrid();
        }
      }, 100);
    }
  }, [canvasWidth, canvasHeight, isGridVisible, backgroundColor]);

  // Load saved canvas data - only load once
  const hasLoadedInitialCanvasData = useRef(false);
  
  useEffect(() => {
    // Check if there's actually any canvas data to load (either image or shapes)
    const hasCanvasImage = savedCanvasData && savedCanvasData.canvasImage && savedCanvasData.canvasImage.length > 0;
    const hasShapes = savedCanvasData && ((savedCanvasData.shapes && savedCanvasData.shapes.length > 0) || (savedCanvasData.elements && savedCanvasData.elements.length > 0));
    const hasCanvasData = hasCanvasImage || hasShapes;
    
    // If no canvas data exists, immediately hide loading and return
    if (!hasCanvasData) {
      console.log('No canvas data found, skipping load');
      hasLoadedInitialCanvasData.current = true;
      setIsLoading(false); // No saved data, not loading
      return;
    }
    
    // Set loading state when checking for saved data (only if there's actual data)
    if (hasCanvasData && !hasLoadedInitialCanvasData.current) {
      setIsLoading(true);
      
      // Add a delay to ensure canvas is fully initialized
      const loadCanvasData = () => {
        if (canvasRef.current && ctxRef.current) {
          // Load shapes data first
          if (hasShapes) {
            if (savedCanvasData.shapes && savedCanvasData.shapes.length > 0) {
              shapesRef.current = [...savedCanvasData.shapes];
            } else if (savedCanvasData.elements && savedCanvasData.elements.length > 0) {
              shapesRef.current = [...savedCanvasData.elements];
            }
            }
          
          // Load canvas image if available
          if (hasCanvasImage) {
            const img = new Image();
            img.onload = () => {
              const canvas = canvasRef.current;
              const ctx = ctxRef.current;
              
              // Store the background image for redrawing
              backgroundImageRef.current = img;
              
              // Clear canvas and draw saved image
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0);
              
              hasLoadedInitialCanvasData.current = true;
              setIsLoading(false); // Clear loading state
              
              // Redraw canvas with shapes
              setTimeout(() => {
                redrawCanvas();
              }, 100);
              
              // Immediately save to history so we can track changes
              if (historyRef.current.length === 0) {
                historyRef.current.push([...shapesRef.current]);
                historyIndexRef.current = 0;
              }
            };
            
            img.onerror = (error) => {
              console.error('❌ Failed to load canvas image:', error);
              hasLoadedInitialCanvasData.current = true;
              setIsLoading(false); // Clear loading state even on error
              
              // Still redraw with shapes even if image failed
              setTimeout(() => {
                redrawCanvas();
              }, 100);
            };
            
            img.src = savedCanvasData.canvasImage;
          } else {
            // No image, just load shapes
            hasLoadedInitialCanvasData.current = true;
            setIsLoading(false);
            
            // Redraw canvas with shapes
            setTimeout(() => {
              redrawCanvas();
            }, 100);
            
            // Save to history
            if (historyRef.current.length === 0) {
              historyRef.current.push([...shapesRef.current]);
              historyIndexRef.current = 0;
            }
          }
        } else {
          setTimeout(loadCanvasData, 500);
        }
      };
      
      // Start loading after a short delay
      setTimeout(loadCanvasData, 200);
    }
  }, [savedCanvasData]);

  // Reset the loaded flag and background image when whiteboard changes
  useEffect(() => {
    hasLoadedInitialCanvasData.current = false;
    backgroundImageRef.current = null;
    // Don't set loading to true here - let the savedCanvasData effect handle it
    setIsLoading(false);
  }, [whiteboardId]);

  // Set canvas dimensions to exact props values (non-responsive)
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && ctxRef.current) {
        const canvas = canvasRef.current;
        
        // Use exact canvas dimensions from props
        const width = Math.max(Number(canvasWidth) || 1920, 300);
        const height = Math.max(Number(canvasHeight) || 1080, 200);
        
        // Set canvas dimensions to exact values
        canvas.width = width;
        canvas.height = height;
        
        // Redraw everything to preserve drawings
        const ctx = ctxRef.current;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Fill background color
        const isDarkMode = document.documentElement.classList.contains('dark');
        let bgColor = backgroundColor || (isDarkMode ? '#111827' : '#ffffff');
        if (bgColor && !bgColor.startsWith('#')) {
          bgColor = `#${bgColor}`;
        }
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Redraw background image if it exists
        if (backgroundImageRef.current) {
          ctx.drawImage(backgroundImageRef.current, 0, 0, canvas.width, canvas.height);
        }
        
        // Redraw grid if visible
        if (isGridVisible) {
          // Define grid drawing inline to avoid dependency issues
          const gridSize = 20;
          const w = canvas.width || window.innerWidth;
          const h = canvas.height || window.innerHeight;
          ctx.save();
          ctx.strokeStyle = '#e0e0e0';
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let x = 0; x <= w; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
          }
          for (let y = 0; y <= h; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
          }
          ctx.stroke();
          ctx.restore();
        }
        
        // Redraw all shapes
        if (shapesRef.current && shapesRef.current.length > 0) {
          shapesRef.current.forEach((shape) => {
            // Simple shape redraw without using drawShape function
            ctx.save();
            ctx.strokeStyle = shape.color || '#000000';
            ctx.fillStyle = shape.fillColor || 'transparent';
            ctx.lineWidth = shape.strokeWidth || 2;
            ctx.setLineDash([]);
            
            if (shape.type === 'path') {
              ctx.beginPath();
              if (shape.points && shape.points.length > 0) {
                ctx.moveTo(shape.points[0].x, shape.points[0].y);
                for (let i = 1; i < shape.points.length; i++) {
                  ctx.lineTo(shape.points[i].x, shape.points[i].y);
                }
                ctx.stroke();
                if (shape.fillColor && shape.fillColor !== 'transparent') {
                  ctx.fill();
                }
              }
            }
            ctx.restore();
          });
        }
        
        }
    };

    handleResize(); // Set initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [canvasWidth, canvasHeight, isGridVisible, backgroundColor]);

  // Update canvas size and scale
  useEffect(() => {
    if (canvasRef.current && ctxRef.current) {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      
      // Get container dimensions
      const container = canvas.parentElement;
      const containerWidth = container?.clientWidth || window.innerWidth;
      const containerHeight = container?.clientHeight || window.innerHeight;
      
      // Use the smaller dimension to create a square canvas
      const size = Math.min(containerWidth, containerHeight);
      
      // Ensure valid dimensions - check for NaN and undefined
      const validSize = Math.max(Number(size) || 800, 300);
      const validScale = Math.max(stageScale || 1, 0.1);
      const validX = stageX || 0;
      const validY = stageY || 0;
      
      // Additional NaN check
      if (isNaN(validSize)) {
        console.warn('Invalid canvas dimensions detected, using defaults');
        canvas.width = 800;
        canvas.height = 800;
        return;
      }
      
      canvas.width = validSize;
      canvas.height = validSize;
      
      // Apply scale and translation
      ctx.save();
      ctx.scale(validScale, validScale);
      ctx.translate(validX / validScale, validY / validScale);
      
      // Redraw everything after a short delay
      setTimeout(() => {
        if (redrawCanvas) {
          redrawCanvas();
        }
      }, 0);
      
      ctx.restore();
    }
  }, [canvasWidth, canvasHeight, stageScale, stageX, stageY]);

  const drawGrid = useCallback(() => {
    if (!ctxRef.current || !isGridVisible || !canvasRef.current) return;
    
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    const gridSize = 20;
    
    // Use actual canvas dimensions
    const width = canvas.width || window.innerWidth;
    const height = canvas.height || window.innerHeight;
    
    ctx.save();
    
    // Theme-aware grid color
    const isDarkMode = document.documentElement.classList.contains('dark');
    ctx.strokeStyle = isDarkMode ? '#374151' : '#e0e0e0'; // Dark mode: gray-700, Light mode: gray-300
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    ctx.restore();
  }, [isGridVisible]);

  // Helper function to get shape bounds
  const getShapeBounds = useCallback((shape) => {
    switch (shape.type) {
      case 'rectangle':
        return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
      case 'circle':
        return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
      case 'line':
        return { 
          x: Math.min(shape.x, shape.x + shape.width), 
          y: Math.min(shape.y, shape.y + shape.height),
          width: Math.abs(shape.width),
          height: Math.abs(shape.height)
        };
      case 'path':
        if (!shape.points || shape.points.length < 2) return null;
        let minX = shape.points[0];
        let minY = shape.points[1];
        let maxX = shape.points[0];
        let maxY = shape.points[1];
        for (let i = 2; i < shape.points.length; i += 2) {
          minX = Math.min(minX, shape.points[i]);
          minY = Math.min(minY, shape.points[i + 1]);
          maxX = Math.max(maxX, shape.points[i]);
          maxY = Math.max(maxY, shape.points[i + 1]);
        }
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
      default:
        return null;
    }
  }, []);

  // Helper function to check if point is inside shape
  const isPointInShape = useCallback((shape, x, y) => {
    const bounds = getShapeBounds(shape);
    if (!bounds) return false;
    
    if (shape.type === 'rectangle' || shape.type === 'circle') {
      return x >= bounds.x && x <= bounds.x + bounds.width &&
             y >= bounds.y && y <= bounds.y + bounds.height;
    } else if (shape.type === 'line') {
      // Check if point is near the line
      const dist = Math.abs((shape.y - (shape.y + shape.height)) * x - 
                           (shape.x - (shape.x + shape.width)) * y + 
                           (shape.x + shape.width) * shape.y - 
                           shape.y * (shape.x + shape.width)) / 
                   Math.sqrt(Math.pow(shape.y - (shape.y + shape.height), 2) + 
                            Math.pow(shape.x - (shape.x + shape.width), 2));
      return dist < 10; // 10px tolerance
    } else if (shape.type === 'path') {
      // Check if point is near the path
      for (let i = 0; i < shape.points.length - 2; i += 2) {
        const px = shape.points[i];
        const py = shape.points[i + 1];
        const nx = shape.points[i + 2];
        const ny = shape.points[i + 3];
        const dist = Math.abs((py - ny) * x - (px - nx) * y + nx * py - px * ny) / 
                     Math.sqrt(Math.pow(py - ny, 2) + Math.pow(px - nx, 2));
        if (dist < 10) return true;
      }
    }
    return false;
  }, [getShapeBounds]);

  // Draw resize handles
  const drawResizeHandles = useCallback((bounds) => {
    if (!ctxRef.current || !bounds) return;
    
    const ctx = ctxRef.current;
    const handleSize = 8;
    
    ctx.save();
    ctx.strokeStyle = '#4A90E2';
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    // Corner handles
    const handles = [
      { x: bounds.x, y: bounds.y }, // Top-left
      { x: bounds.x + bounds.width, y: bounds.y }, // Top-right
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height }, // Bottom-right
      { x: bounds.x, y: bounds.y + bounds.height }, // Bottom-left
      { x: bounds.x + bounds.width / 2, y: bounds.y }, // Top-center
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 }, // Right-center
      { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height }, // Bottom-center
      { x: bounds.x, y: bounds.y + bounds.height / 2 } // Left-center
    ];
    
    handles.forEach((handle) => {
      ctx.beginPath();
      ctx.rect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
      ctx.fill();
      ctx.stroke();
    });
    
    ctx.restore();
  }, []);

  // Helper function to check if shape intersects with rectangle
  const shapeIntersectsRect = useCallback((shape, rect) => {
    const shapeBounds = getShapeBounds(shape);
    if (!shapeBounds) return false;
    
    // Ensure rectangle has valid dimensions
    if (rect.width <= 0 || rect.height <= 0) {
      return false;
    }
    
    // Check if shape bounds intersect with selection rectangle
    const intersects = !(shapeBounds.x + shapeBounds.width < rect.x ||
                         shapeBounds.x > rect.x + rect.width ||
                         shapeBounds.y + shapeBounds.height < rect.y ||
                         shapeBounds.y > rect.y + rect.height);
    
    return intersects;
  }, [getShapeBounds]);

  const drawShape = useCallback((shape, isPreview = false, isSelected = false) => {
    if (!ctxRef.current) return;
    
    const ctx = ctxRef.current;
    
    ctx.save();
    
    // Always use solid lines - no dashed lines
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    
    // DON'T use destination-out composite operation for eraser anymore
    // We'll handle erasing by removing shapes instead
    ctx.globalCompositeOperation = 'source-over';
    
    // For eraser preview, show semi-transparent red line
    if (shape.isEraser || shape.type === 'eraser') {
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.lineWidth = shape.strokeWidth || strokeWidth;
    } else {
      ctx.strokeStyle = shape.color || convertedColor;
      ctx.lineWidth = shape.strokeWidth || strokeWidth;
    }
    
    ctx.fillStyle = shape.fill || 'transparent';
    
    switch (shape.type) {
      case 'rectangle':
        ctx.beginPath();
        ctx.rect(shape.x, shape.y, shape.width, shape.height);
        if (shape.fill && shape.fill !== 'transparent') {
          ctx.fill();
        }
        ctx.stroke();
        break;
        
      case 'circle':
        ctx.beginPath();
        const circleRadius = shape.radius || Math.max(Math.abs(shape.width), Math.abs(shape.height)) / 2;
        ctx.arc(shape.x + shape.width / 2, shape.y + shape.height / 2, circleRadius, 0, 2 * Math.PI);
        if (shape.fill && shape.fill !== 'transparent') {
          ctx.fill();
        }
        ctx.stroke();
        break;
        
      case 'line':
        ctx.beginPath();
        ctx.moveTo(shape.x, shape.y);
        ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
        ctx.stroke();
        break;
        
      case 'path':
        if (shape.points && shape.points.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(shape.points[0], shape.points[1]);
          for (let i = 2; i < shape.points.length; i += 2) {
            ctx.lineTo(shape.points[i], shape.points[i + 1]);
          }
          ctx.stroke();
        }
        break;
        
      case 'eraser':
        // Draw eraser preview as semi-transparent red path
        if (shape.points && shape.points.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(shape.points[0], shape.points[1]);
          for (let i = 2; i < shape.points.length; i += 2) {
            ctx.lineTo(shape.points[i], shape.points[i + 1]);
          }
          ctx.stroke();
        }
        break;
    }
    
    ctx.restore(); // Restore context after drawing shape
    
    // Draw selection rectangle and handles if selected (separate from shape drawing)
    // IMPORTANT: Only draw selection if explicitly selected AND not a preview
    if (isSelected && !isPreview && selectedShapeIndexRef.current !== -1) {
      const bounds = getShapeBounds(shape);
      if (bounds) {
        ctx.save(); // Save context before drawing selection rectangle
        ctx.setLineDash([]); // Solid line for selection
        ctx.strokeStyle = '#4A90E2';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.rect(bounds.x - 2, bounds.y - 2, bounds.width + 4, bounds.height + 4);
        ctx.stroke();
        ctx.restore(); // Restore context
        
        // Draw resize handles
        drawResizeHandles(bounds);
      }
    }
  }, [convertedColor, strokeWidth, getShapeBounds, drawResizeHandles]);

  const redrawCanvas = useCallback(() => {
    if (!ctxRef.current || !canvasRef.current) return;
    
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    
    // Use actual canvas dimensions
    const width = canvas.width || window.innerWidth;
    const height = canvas.height || window.innerHeight;
    
    // Clear canvas and set theme-aware background
    ctx.clearRect(0, 0, width, height);
    
    // Set background color - use provided backgroundColor or theme-aware default
    const isDarkMode = document.documentElement.classList.contains('dark');
    let bgColor = backgroundColor || (isDarkMode ? '#111827' : '#ffffff');
    
    // Normalize color format
    if (bgColor && !bgColor.startsWith('#')) {
      bgColor = `#${bgColor}`;
    }
    
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    
    // Draw background image first (preserves previous drawings)
    if (backgroundImageRef.current) {
      ctx.drawImage(backgroundImageRef.current, 0, 0);
    }
    
    // Draw grid
    if (isGridVisible) {
      drawGrid();
    }
    
    // Redraw all shapes
    shapesRef.current.forEach((shape, index) => {
      const isSelected = selectedShapeIndexRef.current === index;
      drawShape(shape, false, isSelected);
    });
    
    // Draw current shape if drawing
    if (currentShapeRef.current) {
      drawShape(currentShapeRef.current, true);
    }
    
    // Draw selection rectangle for area eraser
    if (selectionRectRef.current && isSelectingAreaRef.current) {
      ctx.save();
      ctx.setLineDash([]); // Solid line for area selection
      ctx.strokeStyle = '#ff0000';
      ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(
        selectionRectRef.current.x,
        selectionRectRef.current.y,
        selectionRectRef.current.width,
        selectionRectRef.current.height
      );
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }, [isGridVisible, drawGrid, drawShape, backgroundColor]);

  // Note: Redraw is now handled in the main loading effect above to prevent premature rendering

  const getMousePos = useCallback((e) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Ensure valid dimensions
    const canvasWidth = canvas.width || 800;
    const canvasHeight = canvas.height || 600;
    const rectWidth = rect.width || 800;
    const rectHeight = rect.height || 600;
    
    const scaleX = canvasWidth / rectWidth;
    const scaleY = canvasHeight / rectHeight;
    
    // Get mouse position relative to canvas
    let x = (e.clientX - rect.left) * scaleX;
    let y = (e.clientY - rect.top) * scaleY;
    
    // Apply inverse transform for zoom and pan
    const currentScale = stageScale || 1;
    const currentX = stageX || 0;
    const currentY = stageY || 0;
    
    // Transform coordinates based on zoom and pan
    x = (x - currentX) / currentScale;
    y = (y - currentY) / currentScale;
    
    return {
      x: Math.max(0, Math.min(x, canvasWidth)),
      y: Math.max(0, Math.min(y, canvasHeight))
    };
  }, [stageScale, stageX, stageY]);

  const handleMouseDown = useCallback((e) => {
    if (!canEdit) return; // Disable drawing for viewers
    
    const pos = getMousePos(e);
    startPosRef.current = pos;
    
    // If using eraser tool, check for area selection mode
    if (selectedTool === 'eraser') {
      // Check if holding Ctrl/Cmd for area selection
      if (e.ctrlKey || e.metaKey) {
        isSelectingAreaRef.current = true;
        selectionRectRef.current = {
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0
        };
        return;
      }
    }
    
    // If using area eraser tool
    if (selectedTool === 'areaEraser') {
      isSelectingAreaRef.current = true;
      selectionRectRef.current = {
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0
      };
      return;
    }
    
    // If using select tool, check for shape selection or resize handles
    if (selectedTool === 'select') {
      // Check if clicking on a resize handle
      if (selectedShapeIndexRef.current >= 0) {
        const shape = shapesRef.current[selectedShapeIndexRef.current];
        const bounds = getShapeBounds(shape);
        if (bounds) {
          const handleSize = 8;
          const handles = [
            { x: bounds.x, y: bounds.y, handle: 'nw' },
            { x: bounds.x + bounds.width, y: bounds.y, handle: 'ne' },
            { x: bounds.x + bounds.width, y: bounds.y + bounds.height, handle: 'se' },
            { x: bounds.x, y: bounds.y + bounds.height, handle: 'sw' },
          ];
          
          for (const handle of handles) {
            if (Math.abs(pos.x - handle.x) < handleSize && Math.abs(pos.y - handle.y) < handleSize) {
              isResizingRef.current = true;
              resizeHandleRef.current = handle.handle;
              initialShapeDataRef.current = { ...shape };
              return;
            }
          }
        }
      }
      
      // Check if clicking on a shape
      for (let i = shapesRef.current.length - 1; i >= 0; i--) {
        if (isPointInShape(shapesRef.current[i], pos.x, pos.y)) {
          selectedShapeIndexRef.current = i;
          isDraggingRef.current = true;
          initialShapeDataRef.current = { ...shapesRef.current[i] };
          redrawCanvas();
          return;
        }
      }
      
      // Clicked on empty space, deselect
      selectedShapeIndexRef.current = -1;
      redrawCanvas();
      return;
    }
    
    // Drawing mode
    isDrawingRef.current = true;
    
    if (selectedTool === 'pen' || selectedTool === 'highlighter') {
      currentShapeRef.current = {
        type: 'path',
        points: [pos.x, pos.y],
        color: convertedColor,
        strokeWidth: selectedTool === 'highlighter' ? strokeWidth * 3 : strokeWidth
      };
    } else if (selectedTool === 'eraser') {
      // Eraser mode - don't create a shape, erase existing shapes instead
      currentShapeRef.current = {
        type: 'eraser',
        points: [pos.x, pos.y],
        strokeWidth: strokeWidth * 2,
        isEraser: true
      };
    } else if (['rectangle', 'circle', 'line'].includes(selectedTool)) {
      currentShapeRef.current = {
        type: selectedTool,
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        radius: 0,
        color: convertedColor,
        strokeWidth: strokeWidth,
        fill: 'transparent'
      };
      }
  }, [selectedTool, convertedColor, strokeWidth, canEdit, getMousePos, getShapeBounds, isPointInShape, redrawCanvas, shapeIntersectsRect]);

  const handleMouseMove = useCallback((e) => {
    const pos = getMousePos(e);
    
    // Handle area selection for eraser
    if (isSelectingAreaRef.current && selectionRectRef.current) {
      const width = pos.x - startPosRef.current.x;
      const height = pos.y - startPosRef.current.y;
      
      selectionRectRef.current.width = Math.abs(width);
      selectionRectRef.current.height = Math.abs(height);
      selectionRectRef.current.x = width < 0 ? pos.x : startPosRef.current.x;
      selectionRectRef.current.y = height < 0 ? pos.y : startPosRef.current.y;
      
      redrawCanvas();
      return;
    }
    
    // Handle resizing
    if (isResizingRef.current && selectedShapeIndexRef.current >= 0 && initialShapeDataRef.current) {
      const shape = shapesRef.current[selectedShapeIndexRef.current];
      const initial = initialShapeDataRef.current;
      const deltaX = pos.x - startPosRef.current.x;
      const deltaY = pos.y - startPosRef.current.y;
      
      switch (resizeHandleRef.current) {
        case 'nw':
          shape.x = initial.x + deltaX;
          shape.y = initial.y + deltaY;
          shape.width = initial.width - deltaX;
          shape.height = initial.height - deltaY;
          break;
        case 'ne':
          shape.y = initial.y + deltaY;
          shape.width = initial.width + deltaX;
          shape.height = initial.height - deltaY;
          break;
        case 'sw':
          shape.x = initial.x + deltaX;
          shape.width = initial.width - deltaX;
          shape.height = initial.height + deltaY;
          break;
        case 'se':
          shape.width = initial.width + deltaX;
          shape.height = initial.height + deltaY;
          break;
      }
      
      // Update radius for circles
      if (shape.type === 'circle') {
        shape.radius = Math.max(Math.abs(shape.width), Math.abs(shape.height)) / 2;
      }
      
      redrawCanvas();
      return;
    }
    
    // Handle dragging
    if (isDraggingRef.current && selectedShapeIndexRef.current >= 0 && initialShapeDataRef.current) {
      const shape = shapesRef.current[selectedShapeIndexRef.current];
      const deltaX = pos.x - startPosRef.current.x;
      const deltaY = pos.y - startPosRef.current.y;
      
      shape.x = initialShapeDataRef.current.x + deltaX;
      shape.y = initialShapeDataRef.current.y + deltaY;
      redrawCanvas();
      return;
    }
    
    // Handle drawing
    if (!isDrawingRef.current || !startPosRef.current) return;
    
    if (selectedTool === 'pen' || selectedTool === 'highlighter' || selectedTool === 'eraser') {
      if (currentShapeRef.current) {
        currentShapeRef.current.points.push(pos.x, pos.y);
      }
    } else if (['rectangle', 'circle', 'line'].includes(selectedTool)) {
      if (currentShapeRef.current) {
        const width = pos.x - startPosRef.current.x;
        const height = pos.y - startPosRef.current.y;
        
        currentShapeRef.current.width = Math.abs(width);
        currentShapeRef.current.height = Math.abs(height);
        currentShapeRef.current.x = width < 0 ? pos.x : startPosRef.current.x;
        currentShapeRef.current.y = height < 0 ? pos.y : startPosRef.current.y;
        
        if (selectedTool === 'circle') {
          currentShapeRef.current.radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
        }
        
        }
    }
    
    redrawCanvas();
    
    // Trigger onChange during drawing to enable autosave (throttled to once per second)
    if (isDrawingRef.current && onChange) {
      const now = Date.now();
      if (now - lastChangeTimeRef.current > 1000) {
        lastChangeTimeRef.current = now;
        onChange();
      }
    }
  }, [selectedTool, getMousePos, redrawCanvas, onChange]);

  const saveToHistory = useCallback(() => {
    const newHistory = [...shapesRef.current];
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(newHistory);
    historyIndexRef.current = historyRef.current.length - 1;
    
    // Notify parent component that changes have been made
    if (onChange) {
      onChange();
    } else {
      console.warn('⚠️ onChange callback not provided');
    }
  }, [onChange]);

  const handleMouseUp = useCallback(() => {
    // Handle area selection end for eraser
    if (isSelectingAreaRef.current && selectionRectRef.current) {
      // Erase all shapes that intersect with the selection rectangle
      const rect = selectionRectRef.current;
      const beforeCount = shapesRef.current.length;
      
      // Check if rect has valid dimensions
      if (rect.width <= 0 || rect.height <= 0) {
        isSelectingAreaRef.current = false;
        selectionRectRef.current = null;
        redrawCanvas();
        return;
      }
      
      shapesRef.current = shapesRef.current.filter(shape => {
        const intersects = shapeIntersectsRect(shape, rect);
        if (intersects) {
          }
        return !intersects;
      });
      
      const afterCount = shapesRef.current.length;
      isSelectingAreaRef.current = false;
      selectionRectRef.current = null;
      redrawCanvas(); // Redraw canvas after deletion
      saveToHistory();
      if (onChange) {
        onChange(); // Trigger autosave
      }
      return;
    }
    
    // Handle resizing end
    if (isResizingRef.current) {
      isResizingRef.current = false;
      resizeHandleRef.current = null;
      initialShapeDataRef.current = null;
      saveToHistory();
      if (onChange) {
        onChange(); // Trigger autosave
      }
      return;
    }
    
    // Handle dragging end
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      initialShapeDataRef.current = null;
      saveToHistory();
      if (onChange) {
        onChange(); // Trigger autosave
      }
      return;
    }
    
    // Handle drawing end
    if (!isDrawingRef.current) return;
    
    isDrawingRef.current = false;
    
    if (currentShapeRef.current) {
      // Special handling for eraser tool
      if (selectedTool === 'eraser' && currentShapeRef.current.type === 'eraser') {
        // Create a helper function to check if a point is near a line segment
        const isPointNearLine = (px, py, x1, y1, x2, y2, threshold) => {
          const A = px - x1;
          const B = py - y1;
          const C = x2 - x1;
          const D = y2 - y1;
          
          const dot = A * C + B * D;
          const lenSq = C * C + D * D;
          let param = -1;
          
          if (lenSq !== 0) param = dot / lenSq;
          
          let xx, yy;
          
          if (param < 0) {
            xx = x1;
            yy = y1;
          } else if (param > 1) {
            xx = x2;
            yy = y2;
          } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
          }
          
          const dx = px - xx;
          const dy = py - yy;
          return Math.sqrt(dx * dx + dy * dy) < threshold;
        };
        
        // Get eraser path points
        const eraserPoints = currentShapeRef.current.points || [];
        const eraserWidth = currentShapeRef.current.strokeWidth || strokeWidth;
        const threshold = eraserWidth / 2 + 5; // Add some tolerance
        
        // Filter out shapes that intersect with the eraser path
        const beforeCount = shapesRef.current.length;
        shapesRef.current = shapesRef.current.filter(shape => {
          // Skip the eraser shape itself
          if (shape.type === 'eraser' || shape.isEraser) {
            return false;
          }
          
          // Check if any eraser path point is near this shape
          const shapeBounds = getShapeBounds(shape);
          if (!shapeBounds) return true;
          
          // For path shapes, check each point
          if (shape.type === 'path' && shape.points) {
            for (let i = 0; i < shape.points.length - 2; i += 2) {
              const px = shape.points[i];
              const py = shape.points[i + 1];
              
              // Check if this point is near any eraser path segment
              for (let j = 0; j < eraserPoints.length - 2; j += 2) {
                if (isPointNearLine(px, py, eraserPoints[j], eraserPoints[j + 1], 
                    eraserPoints[j + 2], eraserPoints[j + 3], threshold)) {
                  return false;
                }
              }
            }
          } else {
            // For other shapes, check if eraser path intersects with shape bounds
            for (let j = 0; j < eraserPoints.length - 2; j += 2) {
              const ex = eraserPoints[j];
              const ey = eraserPoints[j + 1];
              
              if (ex >= shapeBounds.x && ex <= shapeBounds.x + shapeBounds.width &&
                  ey >= shapeBounds.y && ey <= shapeBounds.y + shapeBounds.height) {
                return false;
              }
            }
          }
          
          return true;
        });
        
        const afterCount = shapesRef.current.length;
        currentShapeRef.current = null;
        saveToHistory();
        
        if (onChange) {
          onChange();
        }
        
        // Trigger onPathCreated for live collaboration
        if (onPathCreated) {
          onPathCreated();
        }
      } else {
        // Normal drawing - add shape to canvas
        const shapeWithId = {
          ...currentShapeRef.current,
          id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        
        shapesRef.current.push(shapeWithId);
        saveToHistory();
        currentShapeRef.current = null;
        
        if (onShapeSelect) {
          onShapeSelect(shapesRef.current.length - 1);
        }
        
        // Trigger onChange after drawing completes
        if (onChange) {
          onChange();
        }
        
        // Trigger onPathCreated for live collaboration
        if (onPathCreated) {
          onPathCreated();
        }
      }
    }
    
    startPosRef.current = null;
  }, [onShapeSelect, saveToHistory, redrawCanvas, shapeIntersectsRect, onChange, onPathCreated, selectedTool, strokeWidth, getShapeBounds]);

  return (
    <div className="w-full h-full relative overflow-hidden" style={{ touchAction: 'none' }}>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white dark:bg-gray-900 bg-opacity-80 dark:bg-opacity-80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Loading drawings...</p>
          </div>
        </div>
      )}
      
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full border border-gray-300 rounded-lg"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
          });
          handleMouseDown(mouseEvent);
        }}
        onTouchMove={(e) => {
          const touch = e.touches[0];
          const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
          });
          handleMouseMove(mouseEvent);
        }}
        onTouchEnd={(e) => {
          handleMouseUp();
        }}
        style={{ 
          width: '100%',
          height: '100%',
          cursor: selectedTool === 'pen' || selectedTool === 'highlighter' ? 'crosshair' :
                  selectedTool === 'eraser' ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%23000\' d=\'M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l11.17-11.22c.79-.78 2.05-.78 2.83 0zM7.24 18l3.76-3.76 3.76 3.76-3.76 3.76-3.76-3.76z\'/%3E%3C/svg%3E") 12 12, auto' :
                  ['rectangle', 'circle', 'line'].includes(selectedTool) ? 'crosshair' :
                  selectedTool === 'text' ? 'text' : 'default'
        }}
      />
    </div>
  );
});

export default HTML5WhiteboardCanvas;
