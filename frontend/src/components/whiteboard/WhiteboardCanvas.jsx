import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Line, Rect, Text, Circle, Image, Group } from 'react-konva';

const WhiteboardCanvas = React.forwardRef(({
  selectedTool,
  strokeColor,
  strokeWidth,
  isDrawing,
  lines,
  shapes,
  textElements,
  tempShape,
  images,
  stickyNotes,
  polygonPoints,
  laserPointer,
  isLaserActive,
  layers,
  activeLayer,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel,
  stageScale,
  stageX,
  stageY,
  canvasWidth,
  canvasHeight,
  isGridVisible,
  gridSize = 20,
  onShapeSelect,
  onShapeResize,
  selectedShapeId,
}, ref) => {
  const stageRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showCursorIndicator, setShowCursorIndicator] = useState(false);
  const [selectedShape, setSelectedShape] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);

  // Expose stageRef to parent component if needed
  React.useImperativeHandle(ref, () => stageRef.current);

  // Get cursor style based on selected tool
  const getCursorStyle = useCallback(() => {
    switch (selectedTool) {
      case 'pen':
        return 'crosshair';
      case 'brush':
        return 'crosshair';
      case 'highlighter':
        return 'crosshair';
      case 'eraser':
        return 'grab';
      case 'line':
      case 'arrow':
        return 'crosshair';
      case 'rectangle':
      case 'circle':
      case 'polygon':
        return 'crosshair';
      case 'text':
        return 'text';
      case 'sticky':
        return 'pointer';
      case 'image':
        return 'pointer';
      case 'laser':
        return 'crosshair';
      case 'fill':
        return 'pointer';
      default:
        return 'default';
    }
  }, [selectedTool]);

  // Apply cursor style to the stage container
  useEffect(() => {
    if (stageRef.current) {
      const stageContainer = stageRef.current.getStage().container();
      
      // Apply cursor styles based on tool and interaction state
      if (selectedTool === 'eraser') {
        stageContainer.style.cursor = isDrawing ? 'grabbing' : 'grab';
      } else if (selectedTool === 'text') {
        stageContainer.style.cursor = 'text';
      } else if (selectedTool === 'image') {
        stageContainer.style.cursor = 'pointer';
      } else if (['pen', 'highlighter', 'line', 'rectangle', 'circle'].includes(selectedTool)) {
        stageContainer.style.cursor = isDrawing ? 'crosshair' : 'crosshair';
      } else {
        stageContainer.style.cursor = 'default';
      }
    }
  }, [selectedTool, isDrawing]);

  // Handle mouse events
  const handleMouseDown = useCallback((e) => {
    if (onMouseDown) {
      onMouseDown(e);
    }
  }, [onMouseDown]);

  const handleMouseMove = useCallback((e) => {
    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    if (pointerPosition) {
      setMousePosition(pointerPosition);
      
      // Show cursor indicator for drawing tools
      const drawingTools = ['pen', 'highlighter', 'eraser'];
      setShowCursorIndicator(drawingTools.includes(selectedTool) && !isDrawing);
    }
    
    if (onMouseMove) {
      onMouseMove(e);
    }
  }, [onMouseMove, selectedTool, isDrawing]);

  const handleMouseUp = useCallback((e) => {
    if (onMouseUp) {
      onMouseUp(e);
    }
  }, [onMouseUp]);

  const handleWheel = useCallback((e) => {
    if (onWheel) {
      onWheel(e);
    }
  }, [onWheel]);

  const handleMouseEnter = useCallback(() => {
    const drawingTools = ['pen', 'highlighter', 'eraser'];
    setShowCursorIndicator(drawingTools.includes(selectedTool));
  }, [selectedTool]);

  const handleMouseLeave = useCallback(() => {
    setShowCursorIndicator(false);
  }, []);

  return (
    <Stage
      width={canvasWidth}
      height={canvasHeight}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={stageRef}
      scaleX={stageScale}
      scaleY={stageScale}
      x={stageX}
      y={stageY}
    >
      <Layer>
        {/* Grid */}
        {isGridVisible && (
          <>
            {/* Render vertical grid lines */}
            {[...Array(Math.floor(canvasWidth / gridSize)).keys()].map((i) => (
              <Line
                key={`v-grid-${i}`}
                points={[i * gridSize, 0, i * gridSize, canvasHeight]}
                stroke="#eee"
                strokeWidth={1}
              />
            ))}
            {/* Render horizontal grid lines */}
            {[...Array(Math.floor(canvasHeight / gridSize)).keys()].map((i) => (
              <Line
                key={`h-grid-${i}`}
                points={[0, i * gridSize, canvasWidth, i * gridSize]}
                stroke="#eee"
                strokeWidth={1}
              />
            ))}
          </>
        )}

        {/* Lines */}
        {lines.map((line, i) => (
          <Line
            key={i}
            points={line.points}
            stroke={line.color}
            strokeWidth={line.strokeWidth}
            tension={0.5}
            lineCap="round"
            globalCompositeOperation={
              line.tool === 'eraser' ? 'destination-out' : 'source-over'
            }
          />
        ))}

        {/* Shapes with selection and resize handles */}
        {shapes.map((shape, i) => {
          const isSelected = selectedShapeId === shape.id;
          
          if (shape.type === 'rectangle') {
            return (
              <Group key={shape.id || i}>
                <Rect
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  stroke={shape.color}
                  strokeWidth={shape.strokeWidth}
                  fill={shape.fill}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    onShapeSelect && onShapeSelect(shape.id);
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true;
                    onShapeSelect && onShapeSelect(shape.id);
                  }}
                />
                {/* Selection outline */}
                {isSelected && (
                  <Rect
                    x={shape.x - 2}
                    y={shape.y - 2}
                    width={shape.width + 4}
                    height={shape.height + 4}
                    stroke="#007ACC"
                    strokeWidth={2}
                    fill="transparent"
                    dash={[5, 5]}
                  />
                )}
                {/* Resize handles */}
                {isSelected && (
                  <>
                    {/* Corner handles */}
                    <Rect
                      x={shape.x - 5}
                      y={shape.y - 5}
                      width={10}
                      height={10}
                      fill="#007ACC"
                      stroke="#ffffff"
                      strokeWidth={2}
                      draggable
                      onDragMove={(e) => {
                        const newWidth = shape.width - e.target.x() + shape.x;
                        const newHeight = shape.height - e.target.y() + shape.y;
                        onShapeResize && onShapeResize(shape.id, {
                          x: e.target.x() + shape.x,
                          y: e.target.y() + shape.y,
                          width: Math.max(10, newWidth),
                          height: Math.max(10, newHeight)
                        });
                      }}
                    />
                    <Rect
                      x={shape.x + shape.width - 5}
                      y={shape.y - 5}
                      width={10}
                      height={10}
                      fill="#007ACC"
                      stroke="#ffffff"
                      strokeWidth={2}
                      draggable
                      onDragMove={(e) => {
                        const newWidth = e.target.x() - shape.x + 5;
                        const newHeight = shape.height - e.target.y() + shape.y;
                        onShapeResize && onShapeResize(shape.id, {
                          width: Math.max(10, newWidth),
                          height: Math.max(10, newHeight),
                          y: e.target.y() + shape.y
                        });
                      }}
                    />
                    <Rect
                      x={shape.x - 5}
                      y={shape.y + shape.height - 5}
                      width={10}
                      height={10}
                      fill="#007ACC"
                      stroke="#ffffff"
                      strokeWidth={2}
                      draggable
                      onDragMove={(e) => {
                        const newWidth = shape.width - e.target.x() + shape.x;
                        const newHeight = e.target.y() - shape.y + 5;
                        onShapeResize && onShapeResize(shape.id, {
                          x: e.target.x() + shape.x,
                          width: Math.max(10, newWidth),
                          height: Math.max(10, newHeight)
                        });
                      }}
                    />
                    <Rect
                      x={shape.x + shape.width - 5}
                      y={shape.y + shape.height - 5}
                      width={10}
                      height={10}
                      fill="#007ACC"
                      stroke="#ffffff"
                      strokeWidth={2}
                      draggable
                      onDragMove={(e) => {
                        const newWidth = e.target.x() - shape.x + 5;
                        const newHeight = e.target.y() - shape.y + 5;
                        onShapeResize && onShapeResize(shape.id, {
                          width: Math.max(10, newWidth),
                          height: Math.max(10, newHeight)
                        });
                      }}
                    />
                  </>
                )}
              </Group>
            );
          } else if (shape.type === 'circle') {
            return (
              <Group key={shape.id || i}>
                <Circle
                  x={shape.x + shape.width / 2}
                  y={shape.y + shape.height / 2}
                  radius={shape.radius}
                  stroke={shape.color}
                  strokeWidth={shape.strokeWidth}
                  fill={shape.fill}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    onShapeSelect && onShapeSelect(shape.id);
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true;
                    onShapeSelect && onShapeSelect(shape.id);
                  }}
                />
                {/* Selection outline */}
                {isSelected && (
                  <Circle
                    x={shape.x + shape.width / 2}
                    y={shape.y + shape.height / 2}
                    radius={shape.radius + 2}
                    stroke="#007ACC"
                    strokeWidth={2}
                    fill="transparent"
                    dash={[5, 5]}
                  />
                )}
                {/* Resize handles */}
                {isSelected && (
                  <>
                    {/* Corner handles */}
                    <Circle
                      x={shape.x + shape.width / 2 - shape.radius}
                      y={shape.y + shape.height / 2 - shape.radius}
                      radius={5}
                      fill="#007ACC"
                      stroke="#ffffff"
                      strokeWidth={2}
                      draggable
                      onDragMove={(e) => {
                        const centerX = shape.x + shape.width / 2;
                        const centerY = shape.y + shape.height / 2;
                        const newRadius = Math.sqrt(
                          Math.pow(e.target.x() - centerX, 2) + 
                          Math.pow(e.target.y() - centerY, 2)
                        );
                        onShapeResize && onShapeResize(shape.id, {
                          radius: Math.max(5, newRadius)
                        });
                      }}
                    />
                  </>
                )}
              </Group>
            );
          }
          return null;
        })}

        {/* Temporary Shape (while drawing) with preview */}
        {tempShape && }
        {tempShape && (
          <>
            {tempShape.type === 'rectangle' && (
              <>
                <Rect
                  x={tempShape.x}
                  y={tempShape.y}
                  width={tempShape.width}
                  height={tempShape.height}
                  stroke={tempShape.color}
                  strokeWidth={tempShape.strokeWidth + 1}
                  fill="transparent"
                  dash={[8, 8]}
                  opacity={0.8}
                />
                {/* Dimension preview for rectangle */}
                <Text
                  x={tempShape.x + tempShape.width / 2}
                  y={tempShape.y - 20}
                  text={`${Math.round(tempShape.width)} × ${Math.round(tempShape.height)}`}
                  fontSize={14}
                  fill="#000000"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  align="center"
                  offsetX={30}
                  offsetY={7}
                  fontStyle="bold"
                />
              </>
            )}
            {tempShape.type === 'circle' && (
              <>
                <Circle
                  x={tempShape.x + tempShape.width / 2}
                  y={tempShape.y + tempShape.height / 2}
                  radius={tempShape.radius}
                  stroke={tempShape.color}
                  strokeWidth={tempShape.strokeWidth + 1}
                  fill="transparent"
                  dash={[8, 8]}
                  opacity={0.8}
                />
                {/* Dimension preview for circle */}
                <Text
                  x={tempShape.x + tempShape.width / 2}
                  y={tempShape.y - 20}
                  text={`${Math.round(tempShape.radius * 2)} × ${Math.round(tempShape.radius * 2)}`}
                  fontSize={14}
                  fill="#000000"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  align="center"
                  offsetX={30}
                  offsetY={7}
                  fontStyle="bold"
                />
              </>
            )}
            {tempShape.type === 'line' && (
              <>
                <Line
                  points={[tempShape.x, tempShape.y, tempShape.x + tempShape.width, tempShape.y + tempShape.height]}
                  stroke={tempShape.color}
                  strokeWidth={tempShape.strokeWidth + 1}
                  dash={[8, 8]}
                  opacity={0.8}
                />
                {/* Dimension preview for line */}
                <Text
                  x={(tempShape.x + tempShape.x + tempShape.width) / 2}
                  y={(tempShape.y + tempShape.y + tempShape.height) / 2}
                  text={`${Math.round(Math.sqrt(tempShape.width * tempShape.width + tempShape.height * tempShape.height))}px`}
                  fontSize={14}
                  fill="#000000"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  align="center"
                  offsetX={20}
                  offsetY={7}
                  fontStyle="bold"
                />
              </>
            )}
          </>
        )}

        {/* Text Elements */}
        {textElements.map((textEl, i) => (
          <Text
            key={i}
            x={textEl.x}
            y={textEl.y}
            text={textEl.text}
            fontSize={textEl.fontSize}
            fill={textEl.color}
            fontFamily={textEl.fontFamily}
            opacity={textEl.opacity || 1}
          />
        ))}

        {/* Images */}
        {images.map((image, i) => (
          <Image
            key={i}
            x={image.x}
            y={image.y}
            width={image.width}
            height={image.height}
            image={image.imageElement}
            opacity={image.opacity || 1}
          />
        ))}

        {/* Sticky Notes */}
        {stickyNotes.map((sticky, i) => (
          <Group key={i}>
            <Rect
              x={sticky.x}
              y={sticky.y}
              width={200}
              height={100}
              fill={sticky.backgroundColor}
              stroke={sticky.color}
              strokeWidth={2}
              opacity={sticky.opacity || 1}
            />
            <Text
              x={sticky.x + 10}
              y={sticky.y + 10}
              text={sticky.text}
              fontSize={14}
              fill={sticky.color}
              width={180}
              height={80}
            />
          </Group>
        ))}

        {/* Laser Pointer */}
        {isLaserActive && laserPointer && (
          <Circle
            x={laserPointer.x}
            y={laserPointer.y}
            radius={8}
            fill="#FF0000"
            stroke="#FFFFFF"
            strokeWidth={2}
            opacity={0.8}
            shadowColor="#FF0000"
            shadowBlur={10}
            shadowOpacity={0.5}
          />
        )}

        {/* Polygon Points (for polygon tool) */}
        {polygonPoints.map((point, i) => (
          <Circle
            key={i}
            x={point.x}
            y={point.y}
            radius={4}
            fill={strokeColor}
            stroke="#000"
            strokeWidth={1}
          />
        ))}

        {/* Cursor Indicator for Drawing Tools */}
        {showCursorIndicator && ['pen', 'highlighter', 'eraser'].includes(selectedTool) && (
          <Circle
            x={mousePosition.x}
            y={mousePosition.y}
            radius={selectedTool === 'eraser' ? strokeWidth : strokeWidth / 2}
            stroke={selectedTool === 'eraser' ? '#ff0000' : strokeColor}
            strokeWidth={2}
            fill="transparent"
            opacity={0.7}
            listening={false}
            globalCompositeOperation="source-over"
          />
        )}
      </Layer>
    </Stage>
  );
});

export default WhiteboardCanvas;