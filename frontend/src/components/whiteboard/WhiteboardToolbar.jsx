import React from 'react';
import { 
  Pencil, 
  Square, 
  Circle, 
  Minus, 
  ArrowRight, 
  Type, 
  Eraser,
  Undo,
  Redo,
  Trash2,
  Save,
  Users,
  MessageSquare,
  Menu,
  X,
  Palette,
  Droplet,
  Type as TypeIcon,
  Layers,
  Sparkles,
  Eye,
  CircleDot,
  MinusSquare
} from 'lucide-react';
import Button from '../ui/Button';

const WhiteboardToolbar = ({
  whiteboard,
  currentTool,
  brushSize,
  brushColor,
  brushOpacity,
  smoothing,
  textColor,
  fillColor,
  showTextColorPicker,
  showFillColorPicker,
  canEdit,
  loading,
  showMobileMenu,
  onToolChange,
  onShapeCreation,
  onTextCreation,
  onUndo,
  onRedo,
  onDeleteSelected,
  onSave,
  onShare,
  onChatToggle,
  onBrushSizeChange,
  onBrushColorChange,
  onBrushOpacityChange,
  onSmoothingChange,
  onTextColorChange,
  onFillColorChange,
  onTextColorPickerToggle,
  onFillColorPickerToggle,
  onMobileMenuToggle,
}) => {
  const drawingTools = [
    { id: 'pencil', icon: Pencil, label: 'Pencil' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
  ];

  const shapeTools = [
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'arrow', icon: ArrowRight, label: 'Arrow' },
  ];

  const textTool = [
    { id: 'text', icon: Type, label: 'Text' },
  ];

  return (
    <div className="bg-gradient-to-r from-white via-indigo-50/30 to-purple-50/30 dark:from-gray-800 dark:via-indigo-950/30 dark:to-purple-950/30 border-b border-gray-200 dark:border-gray-700 px-3 py-2 sm:px-4 sm:py-4 sticky top-0 z-50 shadow-lg backdrop-blur-sm flex-shrink-0">
      {/* Mobile Header */}
      <div className="flex items-center justify-between mb-2 sm:hidden">
        <h2 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent truncate pr-2">
          {whiteboard?.title || 'Whiteboard'}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onMobileMenuToggle}
            className="p-2"
          >
            {showMobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Tool Groups */}
      {showMobileMenu && (
        <div className="sm:hidden space-y-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          {/* Drawing Tools Group */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2">
              Drawing
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {drawingTools.map((tool) => (
                <Button
                  key={tool.id}
                  variant={currentTool === tool.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => onToolChange(tool.id)}
                  disabled={!canEdit}
                  title={tool.label}
                  className={`flex items-center gap-2 ${
                    currentTool === tool.id 
                      ? 'bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <tool.icon className="w-4 h-4" />
                  <span className="text-xs">{tool.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Shape Tools Group */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2">
              Shapes
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {shapeTools.map((tool) => (
                <Button
                  key={tool.id}
                  variant={currentTool === tool.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => onShapeCreation(tool.id)}
                  disabled={!canEdit}
                  title={tool.label}
                  className={`flex items-center gap-2 ${
                    currentTool === tool.id 
                      ? 'bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <tool.icon className="w-4 h-4" />
                  <span className="text-xs">{tool.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Text Tool Group */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2">
              Text
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {textTool.map((tool) => (
                <Button
                  key={tool.id}
                  variant={currentTool === tool.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => onTextCreation()}
                  disabled={!canEdit}
                  title={tool.label}
                  className={`flex items-center gap-2 ${
                    currentTool === tool.id 
                      ? 'bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <tool.icon className="w-4 h-4" />
                  <span className="text-xs">{tool.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Editing Tools Group */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2">
              Editing
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={onUndo}
                disabled={!canEdit}
                title="Undo"
                className="flex items-center gap-2 bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
              >
                <Undo className="w-4 h-4" />
                <span className="text-xs">Undo</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onRedo}
                disabled={!canEdit}
                title="Redo"
                className="flex items-center gap-2 bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
              >
                <Redo className="w-4 h-4" />
                <span className="text-xs">Redo</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onDeleteSelected}
                disabled={!canEdit}
                title="Delete Selected"
                className="flex items-center gap-2 bg-white text-red-600 hover:text-red-700 hover:bg-red-50 dark:bg-gray-700 dark:text-red-400 dark:hover:bg-red-900/20 border-gray-300 dark:border-gray-600"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-xs">Delete</span>
              </Button>
            </div>
          </div>

          {/* Brush Settings Group */}
          {canEdit && (
            <div className="mb-3">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2">
                Settings
              </div>
              <div className="flex items-center gap-2 flex-wrap px-2">
                {/* Brush Size */}
                <div className="flex items-center gap-2 bg-white dark:bg-gray-700 px-3 py-2 rounded border border-gray-300 dark:border-gray-600">
                  <MinusSquare className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{brushSize}</span>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={brushSize}
                    onChange={(e) => onBrushSizeChange(parseInt(e.target.value))}
                    className="w-20"
                    title={`Brush Size: ${brushSize}`}
                  />
                </div>

                {/* Brush Color */}
                <div className="flex items-center gap-2 bg-white dark:bg-gray-700 px-3 py-2 rounded border border-gray-300 dark:border-gray-600">
                  <Palette className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => onBrushColorChange(e.target.value)}
                    className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                    title="Brush Color"
                  />
                </div>

                {/* Opacity */}
                <div className="flex items-center gap-2 bg-white dark:bg-gray-700 px-3 py-2 rounded border border-gray-300 dark:border-gray-600">
                  <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{Math.round(brushOpacity * 100)}%</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={brushOpacity}
                    onChange={(e) => onBrushOpacityChange(parseFloat(e.target.value))}
                    className="w-20"
                    title={`Opacity: ${Math.round(brushOpacity * 100)}%`}
                  />
                </div>

                {/* Smoothing Toggle */}
                <button
                  onClick={() => onSmoothingChange(!smoothing)}
                  className={`flex items-center gap-2 px-3 py-2 rounded border transition-colors ${
                    smoothing
                      ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
                      : 'bg-white text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
                  }`}
                  title={smoothing ? 'Smoothing: On' : 'Smoothing: Off'}
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs">Smooth</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Drawing Tools Group */}
          <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
            {drawingTools.map((tool) => (
              <Button
                key={tool.id}
                variant={currentTool === tool.id ? "default" : "outline"}
                size="sm"
                onClick={() => onToolChange(tool.id)}
                disabled={!canEdit}
                title={tool.label}
                className={`p-2 ${
                  currentTool === tool.id 
                    ? 'bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600'
                }`}
              >
                <tool.icon className="w-4 h-4" />
              </Button>
            ))}
          </div>

          {/* Shape Tools Group */}
          <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
            {shapeTools.map((tool) => (
              <Button
                key={tool.id}
                variant={currentTool === tool.id ? "default" : "outline"}
                size="sm"
                onClick={() => onShapeCreation(tool.id)}
                disabled={!canEdit}
                title={tool.label}
                className={`p-2 ${
                  currentTool === tool.id 
                    ? 'bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600'
                }`}
              >
                <tool.icon className="w-4 h-4" />
              </Button>
            ))}
          </div>

          {/* Text Tool Group */}
          <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
            {textTool.map((tool) => (
              <Button
                key={tool.id}
                variant={currentTool === tool.id ? "default" : "outline"}
                size="sm"
                onClick={() => onTextCreation()}
                disabled={!canEdit}
                title={tool.label}
                className={`p-2 ${
                  currentTool === tool.id 
                    ? 'bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600'
                }`}
              >
                <tool.icon className="w-4 h-4" />
              </Button>
            ))}
          </div>

          {/* Editing Tools Group */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onUndo}
              disabled={!canEdit}
              title="Undo"
              className="p-2 bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRedo}
              disabled={!canEdit}
              title="Redo"
              className="p-2 bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
            >
              <Redo className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDeleteSelected}
              disabled={!canEdit}
              title="Delete Selected"
              className="p-2 bg-white text-red-600 hover:text-red-700 hover:bg-red-50 dark:bg-gray-700 dark:text-red-400 dark:hover:bg-red-900/20 border-gray-300 dark:border-gray-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

          {/* Brush Settings */}
          {canEdit && (
            <>
              {/* Brush Size */}
              <div className="flex items-center gap-1 relative group">
                <div className="flex items-center gap-1 px-1">
                  <MinusSquare className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{brushSize}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={brushSize}
                  onChange={(e) => onBrushSizeChange(parseInt(e.target.value))}
                  className="w-14"
                  title={`Brush Size: ${brushSize}`}
                />
              </div>

              {/* Brush Color */}
              <div className="relative group">
                <div className="flex items-center gap-1">
                  <Palette className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => onBrushColorChange(e.target.value)}
                    className="w-7 h-7 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                    title="Brush Color"
                  />
                </div>
              </div>

              {/* Opacity */}
              <div className="flex items-center gap-1 relative group">
                <div className="flex items-center gap-1 px-1">
                  <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{Math.round(brushOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={brushOpacity}
                  onChange={(e) => onBrushOpacityChange(parseFloat(e.target.value))}
                  className="w-14"
                  title={`Opacity: ${Math.round(brushOpacity * 100)}%`}
                />
              </div>

              {/* Smoothing Toggle */}
              <div className="relative group">
                <button
                  onClick={() => onSmoothingChange(!smoothing)}
                  className={`p-2 rounded border transition-colors ${
                    smoothing
                      ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
                      : 'bg-white text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
                  }`}
                  title={smoothing ? 'Smoothing: On' : 'Smoothing: Off'}
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>

              {/* Text Color Picker */}
              <div className="relative group" data-text-color-picker>
                <button
                  onClick={onTextColorPickerToggle}
                  className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 hover:border-indigo-500 transition-colors flex items-center justify-center"
                  style={{ backgroundColor: textColor }}
                  title="Text Color"
                >
                  <TypeIcon className="w-4 h-4 text-white drop-shadow" />
                </button>
                {showTextColorPicker && (
                  <div className="absolute top-10 left-0 z-50 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => onTextColorChange(e.target.value)}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                    <div className="mt-2 flex gap-1">
                      {['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'].map(color => (
                        <button
                          key={color}
                          onClick={() => onTextColorChange(color)}
                          className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 hover:border-indigo-500 transition-colors"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Fill Color Picker */}
              <div className="relative group" data-fill-color-picker>
                <button
                  onClick={onFillColorPickerToggle}
                  className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 hover:border-indigo-500 transition-colors flex items-center justify-center"
                  style={{ backgroundColor: fillColor === '#transparent' ? 'transparent' : fillColor }}
                  title="Fill Color"
                >
                  <Layers className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                {showFillColorPicker && (
                  <div className="absolute top-10 left-0 z-50 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <input
                      type="color"
                      value={fillColor === '#transparent' ? '#ffffff' : fillColor}
                      onChange={(e) => onFillColorChange(e.target.value)}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                    <div className="mt-2 flex gap-1">
                      {['transparent', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#ff8800'].map(color => (
                        <button
                          key={color}
                          onClick={() => onFillColorChange(color === 'transparent' ? '#transparent' : color)}
                          className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 hover:border-indigo-500 transition-colors"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Share Button with Collaborator Count */}
          <Button
            variant="outline"
            size="sm"
            onClick={onShare}
            className="flex items-center gap-2 bg-white hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
            title="Share Whiteboard"
          >
            <div className="relative">
              <Users className="w-4 h-4" />
              {/* Collaborator Count Badge */}
              {(whiteboard?.collaborators?.length || 0) > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center border border-white dark:border-gray-700">
                  {(whiteboard?.collaborators?.length || 0) > 9 ? '9+' : whiteboard?.collaborators?.length || 0}
                </div>
              )}
            </div>
            <span className="hidden lg:inline">Share</span>
          </Button>

          {/* Chat Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={onChatToggle}
            className="p-2 bg-white hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
            title="Chat"
          >
            <MessageSquare className="w-4 h-4" />
          </Button>

          {/* Save Button */}
          {canEdit && (
            <Button
              onClick={onSave}
              disabled={loading}
              loading={loading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white"
              title="Save Whiteboard"
            >
              <Save className="w-4 h-4" />
              <span className="hidden lg:inline">Save</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhiteboardToolbar;

