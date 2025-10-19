import React from 'react';
import { 
  Minus, 
  Palette, 
  Eye, 
  Sparkles, 
  Type, 
  Layers 
} from 'lucide-react';

const WhiteboardBrushSettings = ({
  brushSize,
  brushColor,
  brushOpacity,
  smoothing,
  textColor,
  fillColor,
  onBrushSizeChange,
  onBrushColorChange,
  onBrushOpacityChange,
  onSmoothingChange,
  onTextColorChange,
  onFillColorChange,
  isMobile = false,
}) => {
  return (
    <div className={`${isMobile ? 'mt-2 pt-2 border-t border-gray-200 dark:border-gray-700' : ''} space-y-2`}>
      {/* Brush Size */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Minus className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-gray-600 dark:text-gray-400`} />
          <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400`}>{brushSize}</span>
        </div>
        <input
          type="range"
          min="1"
          max="20"
          value={brushSize}
          onChange={(e) => onBrushSizeChange(parseInt(e.target.value))}
          className={isMobile ? "flex-1" : "w-20"}
          title="Brush Size"
        />
      </div>

      {/* Brush Color */}
      <div className="flex items-center gap-2">
        <Palette className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-gray-600 dark:text-gray-400`} />
        <input
          type="color"
          value={brushColor}
          onChange={(e) => onBrushColorChange(e.target.value)}
          className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          title="Brush Color"
        />
      </div>

      {/* Opacity */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Eye className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-gray-600 dark:text-gray-400`} />
          <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400`}>{Math.round(brushOpacity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={brushOpacity}
          onChange={(e) => onBrushOpacityChange(parseFloat(e.target.value))}
          className={isMobile ? "flex-1" : "w-20"}
          title="Opacity"
        />
      </div>

      {/* Smoothing Toggle */}
      <div className="flex items-center gap-2">
        <Sparkles className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-gray-600 dark:text-gray-400`} />
        <button
          onClick={() => onSmoothingChange(!smoothing)}
          className={`flex-1 px-3 py-1 rounded border transition-colors text-sm ${
            smoothing
              ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
              : 'bg-white text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
          }`}
          title={smoothing ? 'Smoothing: On' : 'Smoothing: Off'}
        >
          {smoothing ? 'On' : 'Off'}
        </button>
      </div>

      {/* Text Color */}
      <div className="flex items-center gap-2">
        <Type className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-gray-600 dark:text-gray-400`} />
        <input
          type="color"
          value={textColor}
          onChange={(e) => onTextColorChange(e.target.value)}
          className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          title="Text Color"
        />
      </div>

      {/* Fill Color */}
      <div className="flex items-center gap-2">
        <Layers className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-gray-600 dark:text-gray-400`} />
        <input
          type="color"
          value={fillColor === '#transparent' ? '#ffffff' : fillColor}
          onChange={(e) => onFillColorChange(e.target.value)}
          className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          title="Fill Color"
        />
        <button
          onClick={() => onFillColorChange('#transparent')}
          className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Transparent"
        >
          None
        </button>
      </div>
    </div>
  );
};

export default WhiteboardBrushSettings;
