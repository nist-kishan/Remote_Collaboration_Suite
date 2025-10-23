import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { fabric } from 'fabric';

const FabricWhiteboardCanvas = forwardRef(({
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
  isGridVisible
}, ref) => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getCanvas: () => fabricCanvasRef.current,
    exportCanvas: () => {
      if (fabricCanvasRef.current) {
        return fabricCanvasRef.current.toDataURL({
          format: 'png',
          quality: 1
        });
      }
      return null;
    },
    clearCanvas: () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.clear();
        fabricCanvasRef.current.setBackgroundColor('#ffffff', fabricCanvasRef.current.renderAll.bind(fabricCanvasRef.current));
      }
    },
    addShape: (shapeData) => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.loadFromJSON(shapeData, () => {
          fabricCanvasRef.current.renderAll();
        });
      }
    }
  }));

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: '#ffffff',
      selection: selectedTool === 'select',
      preserveObjectStacking: true
    });

    fabricCanvasRef.current = canvas;

    // Set up drawing modes
    canvas.isDrawingMode = selectedTool === 'pen' || selectedTool === 'highlighter' || selectedTool === 'eraser';
    
    if (canvas.isDrawingMode) {
      canvas.freeDrawingBrush.width = strokeWidth;
      canvas.freeDrawingBrush.color = selectedTool === 'eraser' ? '#ffffff' : strokeColor;
    }

    // Handle object selection
    canvas.on('selection:created', (e) => {
      if (onShapeSelect && e.selected && e.selected[0]) {
        onShapeSelect(e.selected[0].id);
      }
    });

    canvas.on('selection:updated', (e) => {
      if (onShapeSelect && e.selected && e.selected[0]) {
        onShapeSelect(e.selected[0].id);
      }
    });

    canvas.on('selection:cleared', () => {
      if (onShapeSelect) {
        onShapeSelect(null);
      }
    });

    // Handle object modification
    canvas.on('object:modified', (e) => {
      if (onShapeResize && e.target) {
        const newProperties = {
          width: e.target.width * e.target.scaleX,
          height: e.target.height * e.target.scaleY,
          left: e.target.left,
          top: e.target.top,
          angle: e.target.angle
        };
        onShapeResize(e.target.id, newProperties);
      }
    });

    // Add grid if enabled
    if (isGridVisible) {
      addGrid(canvas);
    }

    return () => {
      canvas.dispose();
    };
  }, [canvasWidth, canvasHeight, isGridVisible]);

  // Update drawing mode when tool changes
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const isDrawingTool = selectedTool === 'pen' || selectedTool === 'highlighter' || selectedTool === 'eraser';
    fabricCanvasRef.current.isDrawingMode = isDrawingTool;
    fabricCanvasRef.current.selection = selectedTool === 'select';

    if (isDrawingTool) {
      fabricCanvasRef.current.freeDrawingBrush.width = strokeWidth;
      fabricCanvasRef.current.freeDrawingBrush.color = selectedTool === 'eraser' ? '#ffffff' : strokeColor;
    }
  }, [selectedTool, strokeColor, strokeWidth]);

  // Update canvas size and position
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    fabricCanvasRef.current.setWidth(canvasWidth);
    fabricCanvasRef.current.setHeight(canvasHeight);
    fabricCanvasRef.current.setZoom(stageScale);
    fabricCanvasRef.current.setViewportTransform([stageScale, 0, 0, stageScale, stageX, stageY]);
    fabricCanvasRef.current.renderAll();
  }, [canvasWidth, canvasHeight, stageScale, stageX, stageY]);

  // Add grid function
  const addGrid = (canvas) => {
    const gridSize = 20;
    const gridColor = '#e0e0e0';
    
    // Remove existing grid
    canvas.getObjects().forEach(obj => {
      if (obj.id === 'grid') {
        canvas.remove(obj);
      }
    });

    // Create grid lines
    for (let i = 0; i < canvas.width / gridSize; i++) {
      const line = new fabric.Line([i * gridSize, 0, i * gridSize, canvas.height], {
        stroke: gridColor,
        strokeWidth: 1,
        selectable: false,
        evented: false,
        id: 'grid'
      });
      canvas.add(line);
    }

    for (let i = 0; i < canvas.height / gridSize; i++) {
      const line = new fabric.Line([0, i * gridSize, canvas.width, i * gridSize], {
        stroke: gridColor,
        strokeWidth: 1,
        selectable: false,
        evented: false,
        id: 'grid'
      });
      canvas.add(line);
    }

    canvas.renderAll();
  };

  // Handle tool-specific actions
  const handleMouseDown = (e) => {
    if (!fabricCanvasRef.current) return;

    const pointer = fabricCanvasRef.current.getPointer(e.e);

    switch (selectedTool) {
      case 'rectangle':
        createRectangle(pointer);
        break;
      case 'circle':
        createCircle(pointer);
        break;
      case 'line':
        createLine(pointer);
        break;
      case 'text':
        createText(pointer);
        break;
      case 'image':
        createImage(pointer);
        break;
      default:
        break;
    }
  };

  const createRectangle = (pointer) => {
    const rect = new fabric.Rect({
      left: pointer.x,
      top: pointer.y,
      width: 0,
      height: 0,
      fill: 'transparent',
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      id: Date.now()
    });

    fabricCanvasRef.current.add(rect);
    fabricCanvasRef.current.setActiveObject(rect);
    fabricCanvasRef.current.renderAll();
  };

  const createCircle = (pointer) => {
    const circle = new fabric.Circle({
      left: pointer.x,
      top: pointer.y,
      radius: 0,
      fill: 'transparent',
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      id: Date.now()
    });

    fabricCanvasRef.current.add(circle);
    fabricCanvasRef.current.setActiveObject(circle);
    fabricCanvasRef.current.renderAll();
  };

  const createLine = (pointer) => {
    const line = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      id: Date.now()
    });

    fabricCanvasRef.current.add(line);
    fabricCanvasRef.current.setActiveObject(line);
    fabricCanvasRef.current.renderAll();
  };

  const createText = (pointer) => {
    const text = prompt('Enter text:');
    if (text) {
      const textObj = new fabric.Text(text, {
        left: pointer.x,
        top: pointer.y,
        fontSize: 16,
        fill: strokeColor,
        id: Date.now()
      });

      fabricCanvasRef.current.add(textObj);
      fabricCanvasRef.current.setActiveObject(textObj);
      fabricCanvasRef.current.renderAll();
    }
  };

  const createImage = (pointer) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          fabric.Image.fromURL(e.target.result, (img) => {
            img.set({
              left: pointer.x,
              top: pointer.y,
              id: Date.now()
            });
            fabricCanvasRef.current.add(img);
            fabricCanvasRef.current.setActiveObject(img);
            fabricCanvasRef.current.renderAll();
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="border border-gray-300 rounded-lg"
        onMouseDown={handleMouseDown}
      />
    </div>
  );
});

export default FabricWhiteboardCanvas;
