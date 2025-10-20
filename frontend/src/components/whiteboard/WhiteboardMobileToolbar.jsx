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
  Settings,
  Users,
  MessageSquare
} from 'lucide-react';
import Button from '../ui/Button';
import WhiteboardBrushSettings from './WhiteboardBrushSettings';

const WhiteboardMobileMenu = ({
  whiteboard,
  currentTool,
  brushSize,
  brushColor,
  brushOpacity,
  smoothing,
  textColor,
  fillColor,
  showBrushSettings,
  canEdit,
  loading,
  onToolChange,
  onShapeCreation,
  onTextCreation,
  onUndo,
  onRedo,
  onDeleteSelected,
  onSave,
  onShare,
  onChatToggle,
  onBrushSettingsToggle,
  onBrushSizeChange,
  onBrushColorChange,
  onBrushOpacityChange,
  onSmoothingChange,
  onTextColorChange,
  onFillColorChange,
  onMobileMenuClose,
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
    <div className="sm:hidden mt-2 border-t border-gray-200 dark:border-gray-700 pt-2 px-3 max-h-[60vh] overflow-y-auto">
      {/* Drawing Tools Group */}
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Drawing</div>
        <div className="flex items-center gap-2 flex-wrap">
          {drawingTools.map((tool) => (
            <Button
              key={tool.id}
              variant={currentTool === tool.id ? "default" : "outline"}
              size="sm"
              onClick={() => {
                onToolChange(tool.id);
                onMobileMenuClose();
              }}
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
      </div>

      {/* Shape Tools Group */}
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Shapes</div>
        <div className="flex items-center gap-2 flex-wrap">
          {shapeTools.map((tool) => (
            <Button
              key={tool.id}
              variant={currentTool === tool.id ? "default" : "outline"}
              size="sm"
              onClick={() => {
                onShapeCreation(tool.id);
                onMobileMenuClose();
              }}
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
      </div>

      {/* Text Tool Group */}
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Text</div>
        <div className="flex items-center gap-2 flex-wrap">
          {textTool.map((tool) => (
            <Button
              key={tool.id}
              variant={currentTool === tool.id ? "default" : "outline"}
              size="sm"
              onClick={() => {
                onTextCreation();
                onMobileMenuClose();
              }}
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
      </div>

      {/* Editing Tools Group */}
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Editing</div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onUndo();
              onMobileMenuClose();
            }}
            disabled={!canEdit}
            title="Undo"
            className="p-2 bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onRedo();
              onMobileMenuClose();
            }}
            disabled={!canEdit}
            title="Redo"
            className="p-2 bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
          >
            <Redo className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onDeleteSelected();
              onMobileMenuClose();
            }}
            disabled={!canEdit}
            title="Delete Selected"
            className="p-2 bg-white text-red-600 hover:text-red-700 hover:bg-red-50 dark:bg-gray-700 dark:text-red-400 dark:hover:bg-red-900/20 border-gray-300 dark:border-gray-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Actions Group */}
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Actions</div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Share Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onShare();
              onMobileMenuClose();
            }}
            className="flex items-center gap-2 bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
            title="Share Whiteboard"
          >
            <div className="relative">
              <Users className="w-4 h-4" />
              {(whiteboard?.collaborators?.length || 0) > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center border border-white dark:border-gray-700">
                  {(whiteboard?.collaborators?.length || 0) > 9 ? '9+' : whiteboard?.collaborators?.length || 0}
                </div>
              )}
            </div>
            <span>Share</span>
          </Button>

          {/* Chat Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onChatToggle();
              onMobileMenuClose();
            }}
            className="flex items-center gap-2 bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
            title="Chat"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat</span>
          </Button>

          {/* Brush Settings Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={onBrushSettingsToggle}
            className="flex items-center gap-2 bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
            title="Brush Settings"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </Button>

          {/* Save Button */}
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onSave();
                onMobileMenuClose();
              }}
              disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white"
              title="Save"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </Button>
          )}
        </div>
      </div>

      {/* Brush Settings Panel */}
      {showBrushSettings && canEdit && (
        <WhiteboardBrushSettings
          brushSize={brushSize}
          brushColor={brushColor}
          brushOpacity={brushOpacity}
          smoothing={smoothing}
          textColor={textColor}
          fillColor={fillColor}
          onBrushSizeChange={onBrushSizeChange}
          onBrushColorChange={onBrushColorChange}
          onBrushOpacityChange={onBrushOpacityChange}
          onSmoothingChange={onSmoothingChange}
          onTextColorChange={onTextColorChange}
          onFillColorChange={onFillColorChange}
        />
      )}
    </div>
  );
};

export default WhiteboardMobileMenu;

