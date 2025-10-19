import React from 'react';
import Button from '../ui/Button';

const WhiteboardToolGroup = ({
  title,
  tools,
  currentTool,
  canEdit,
  onToolClick,
  className = "",
}) => {
  return (
    <div className={className}>
      {title && (
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 px-2">
          {title}
        </div>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Button
              key={tool.id}
              variant={currentTool === tool.id ? "default" : "outline"}
              size="sm"
              onClick={() => onToolClick(tool.id)}
              disabled={!canEdit}
              title={tool.label}
              className={`p-2 ${
                currentTool === tool.id 
                  ? 'bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600'
              }`}
            >
              <Icon className="w-4 h-4" />
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default WhiteboardToolGroup;

