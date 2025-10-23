import React, { useState } from 'react';

// SVG Icon Components
const PenIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const BrushIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
  </svg>
);

const HighlighterIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const LineIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20h16" />
  </svg>
);

const ArrowIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const SelectIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
  </svg>
);

const RectangleIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
  </svg>
);

const CircleIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const PolygonIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
  </svg>
);

const TextIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
  </svg>
);

const StickyIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ImageIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21,15 16,10 5,21" />
  </svg>
);

const LaserIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
  </svg>
);

const FillIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21v-5a2 2 0 012-2h4a2 2 0 012 2v5" />
  </svg>
);

const EraserIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const AreaEraserIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeDasharray="4 4" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const UndoIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
  </svg>
);

const RedoIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
  </svg>
);

const TrashIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const GridIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const LayerIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polygon points="12,2 2,7 12,12 22,7 12,2" />
    <polyline points="2,17 12,22 22,17" />
    <polyline points="2,12 12,17 22,12" />
  </svg>
);

const SaveIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

const ExportIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ShareIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
  </svg>
);


const WhiteboardToolbar = ({
  selectedTool,
  onToolChange,
  strokeColor,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
  opacity,
  onOpacityChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onClearCanvas,
  isGridVisible,
  onGridToggle,
  onSave,
  onExport,
  onShare,
  hasUnsavedChanges,
  lastSaved,
  onLayerPanelToggle,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showStrokeWidth, setShowStrokeWidth] = useState(false);

  // Organize tools by function
  const selectionTools = [
    { id: 'select', name: 'Select', icon: SelectIcon, category: 'selection' },
  ];

  const drawingTools = [
    { id: 'pen', name: 'Pen', icon: PenIcon, category: 'drawing' },
    { id: 'highlighter', name: 'Highlighter', icon: HighlighterIcon, category: 'drawing' },
    { id: 'eraser', name: 'Eraser', icon: EraserIcon, category: 'drawing' },
    { id: 'areaEraser', name: 'Area Eraser', icon: AreaEraserIcon, category: 'drawing' },
  ];

  const shapeTools = [
    { id: 'line', name: 'Line', icon: LineIcon, category: 'shapes' },
    { id: 'rectangle', name: 'Rectangle', icon: RectangleIcon, category: 'shapes' },
    { id: 'circle', name: 'Circle', icon: CircleIcon, category: 'shapes' },
  ];

  const allTools = [...selectionTools, ...drawingTools, ...shapeTools];

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#FFA500', '#800080', '#008000', '#FFC0CB', '#A52A2A', '#808080', '#FFFFFF',
    '#FFD700', '#FF69B4', '#32CD32', '#1E90FF', '#FF4500', '#8A2BE2', '#00CED1'
  ];

  const highlighterColors = [
    '#FFFF00', '#FFD700', '#FFA500', '#FF69B4', '#32CD32', '#1E90FF', '#FF4500', '#8A2BE2'
  ];

  const strokeWidths = [1, 2, 3, 5, 8, 10, 12, 15, 20, 25, 30, 40, 50];
  const opacityLevels = [0.3, 0.5, 0.7, 1.0];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 px-2 sm:px-4 py-2 sm:py-3 flex items-center space-x-1 sm:space-x-3 backdrop-blur-xl bg-opacity-95 dark:bg-opacity-95 overflow-x-auto">
      {/* Selection Tool */}
      <div className="flex items-center space-x-1 sm:space-x-2">
        {selectionTools.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl transition-all duration-200 flex-shrink-0 group ${
                selectedTool === tool.id
                  ? 'bg-blue-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 hover:shadow-md hover:scale-105'
              }`}
              title={tool.name}
            >
              <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="h-6 sm:h-8 w-px bg-gray-300 dark:bg-gray-600"></div>

      {/* Drawing Tools */}
      <div className="flex items-center space-x-1 sm:space-x-2">
        {drawingTools.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl transition-all duration-200 flex-shrink-0 group ${
                selectedTool === tool.id
                  ? 'bg-blue-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 hover:shadow-md hover:scale-105'
              }`}
              title={tool.name}
            >
              <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          );
        })}
      </div>

      {/* Shape Tools */}
      <div className="h-6 sm:h-8 w-px bg-gray-300 dark:bg-gray-600"></div>
      
      <div className="flex items-center space-x-1 sm:space-x-2">
        {shapeTools.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl transition-all duration-200 flex-shrink-0 group ${
                selectedTool === tool.id
                  ? 'bg-blue-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 hover:shadow-md hover:scale-105'
              }`}
              title={tool.name}
            >
              <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="h-6 sm:h-8 w-px bg-gray-300 dark:bg-gray-600"></div>

      {/* Color Picker */}
      <div className="flex items-center space-x-1 sm:space-x-2">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:shadow-md"
          title="Color"
        >
          <div 
            className="w-4 h-4 sm:w-6 sm:h-6 rounded border border-gray-300 dark:border-gray-600 shadow-sm"
            style={{ backgroundColor: strokeColor }}
          />
        </button>
        
        {showColorPicker && (
          <div className="absolute top-14 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl p-2 sm:p-3 shadow-xl z-50">
              <div className="mb-2">
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {selectedTool === 'highlighter' ? 'Highlighter Colors' : 'Colors'}
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {(selectedTool === 'highlighter' ? highlighterColors : colors).map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      onColorChange(color);
                      setShowColorPicker(false);
                    }}
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded border border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform duration-150 ${
                      strokeColor === color ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
                    }`}
                    style={{ 
                      backgroundColor: color,
                      opacity: selectedTool === 'highlighter' ? 0.7 : 1
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

      {/* Divider */}
      <div className="h-6 sm:h-8 w-px bg-gray-300 dark:bg-gray-600"></div>

      {/* Stroke Width */}
      <div className="flex items-center space-x-1 sm:space-x-2">
        <button
          onClick={() => setShowStrokeWidth(!showStrokeWidth)}
          className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:shadow-md"
          title="Stroke Width"
        >
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center">
              <div 
                className="rounded-full shadow-sm"
                style={{ 
                  width: Math.min((Number(strokeWidth) || 2) * 2, 16), 
                  height: Math.min((Number(strokeWidth) || 2) * 2, 16),
                  backgroundColor: strokeColor 
                }}
              />
            </div>
          </div>
        </button>
        
        {showStrokeWidth && (
          <div className="absolute top-14 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl p-2 sm:p-3 shadow-xl z-50 max-h-60 overflow-y-auto">
            <div className="space-y-1 sm:space-y-2">
              {strokeWidths.map((width) => (
                <button
                  key={width}
                  onClick={() => {
                    onStrokeWidthChange(width);
                    setShowStrokeWidth(false);
                  }}
                  className={`w-full flex items-center space-x-2 p-1 sm:p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    strokeWidth === width ? 'bg-blue-100 dark:bg-blue-900' : ''
                  }`}
                >
                  <div 
                    className="rounded-full shadow-sm"
                    style={{ 
                      width: Math.min(width * 2, 16), 
                      height: Math.min(width * 2, 16),
                      backgroundColor: strokeColor 
                    }}
                  />
                  <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{width}px</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="h-6 sm:h-8 w-px bg-gray-300 dark:bg-gray-600"></div>
      
      <div className="flex items-center space-x-1 sm:space-x-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl transition-all duration-200 ${
            canUndo 
              ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 hover:shadow-md' 
              : 'bg-gray-50 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
          }`}
          title="Undo"
        >
          <UndoIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl transition-all duration-200 ${
            canRedo 
              ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 hover:shadow-md' 
              : 'bg-gray-50 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
          }`}
          title="Redo"
        >
          <RedoIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
};

export default WhiteboardToolbar;