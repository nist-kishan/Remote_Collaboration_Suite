import React from 'react';
import { Users, Circle } from 'lucide-react';

const DocumentCollaborators = ({ activeCollaborators, typingUsers, saveStatus }) => {
  if (!activeCollaborators || activeCollaborators.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 max-w-xs">
      <div className="flex items-center gap-2 mb-2">
        <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Collaborators ({activeCollaborators.length})
        </span>
      </div>
      
      <div className="space-y-2">
        {activeCollaborators.map((collaborator) => (
          <div key={collaborator.id} className="flex items-center gap-2">
            <div className="relative">
              {collaborator.avatar ? (
                <img
                  src={collaborator.avatar}
                  alt={collaborator.name}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {collaborator.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              )}
              <Circle className="w-2 h-2 text-green-500 absolute -bottom-0.5 -right-0.5 fill-current" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                  {collaborator.name}
                </span>
                <span className="text-xs px-1 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded">
                  {collaborator.role}
                </span>
              </div>
              
              {/* Typing indicator */}
              {typingUsers.some(user => user.userId === collaborator.id) && (
                <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                  typing...
                </div>
              )}
              
              {/* Save status */}
              {saveStatus[collaborator.id] && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {saveStatus[collaborator.id].status === 'saving' && 'Saving...'}
                  {saveStatus[collaborator.id].status === 'saved' && 'Saved'}
                  {saveStatus[collaborator.id].status === 'error' && 'Save failed'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Typing users summary */}
      {typingUsers.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {typingUsers.length === 1 
              ? `${typingUsers[0].userName} is typing...`
              : `${typingUsers.length} people are typing...`
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentCollaborators;
