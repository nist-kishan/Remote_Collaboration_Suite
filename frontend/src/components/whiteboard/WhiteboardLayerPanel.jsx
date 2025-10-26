import React from 'react';

const WhiteboardLayerPanel = ({
  layers,
  activeLayer,
  onLayerToggle,
  onLayerLock,
  onLayerSelect,
  onAddLayer,
  onDeleteLayer,
  isVisible,
  onToggle
}) => {
  if (!isVisible) return null;

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-64">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Layers</h3>
        <button
          onClick={onToggle}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 mb-4">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`flex items-center justify-between p-2 rounded border ${
              activeLayer === layer.id ? 'bg-blue-100 border-blue-300' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onLayerSelect(layer.id)}
                className={`w-4 h-4 rounded border ${
                  activeLayer === layer.id ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                }`}
              />
              <span className="text-sm font-medium text-gray-700">{layer.name}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onLayerToggle(layer.id)}
                className={`w-6 h-6 rounded flex items-center justify-center ${
                  layer.visible ? 'text-green-600' : 'text-gray-400'
                }`}
                title={layer.visible ? 'Hide layer' : 'Show layer'}
              >
                {layer.visible ? '👁️' : '🚫'}
              </button>
              
              <button
                onClick={() => onLayerLock(layer.id)}
                className={`w-6 h-6 rounded flex items-center justify-center ${
                  layer.locked ? 'text-red-600' : 'text-gray-400'
                }`}
                title={layer.locked ? 'Unlock layer' : 'Lock layer'}
              >
                {layer.locked ? '🔒' : '🔓'}
              </button>
              
              {layers.length > 1 && (
                <button
                  onClick={() => onDeleteLayer(layer.id)}
                  className="w-6 h-6 rounded flex items-center justify-center text-red-500 hover:text-red-700"
                  title="Delete layer"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onAddLayer}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
      >
        + Add Layer
      </button>
    </div>
  );
};

export default WhiteboardLayerPanel;
