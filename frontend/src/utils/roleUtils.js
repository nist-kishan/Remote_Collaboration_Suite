/**
 * Role-based access control utilities
 */

// Define role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY = {
  owner: 3,
  editor: 2,
  viewer: 1
};

// Define permissions for each role
export const ROLE_PERMISSIONS = {
  owner: {
    canEdit: true,
    canDelete: true,
    canShare: true,
    canView: true,
    canManageCollaborators: true,
    canChangeSettings: true
  },
  editor: {
    canEdit: true,
    canDelete: false,
    canShare: true,
    canView: true,
    canManageCollaborators: true,
    canChangeSettings: true
  },
  viewer: {
    canEdit: false,
    canDelete: false,
    canShare: false,
    canView: true,
    canManageCollaborators: false,
    canChangeSettings: false
  }
};

/**
 * Get user role for a document
 * @param {Object} document - The document object
 * @param {Object} currentUser - The current user object
 * @returns {string} - The user's role (owner, editor, commenter, viewer)
 */
export const getUserRole = (document, currentUser) => {
  if (!document || !currentUser) return 'viewer';
  
  // Check if user is the owner
  if (document.owner && document.owner._id === currentUser._id) {
    return 'owner';
  }
  
  // Check collaborators
  if (document.collaborators && document.collaborators.length > 0) {
    const collaboration = document.collaborators.find(
      collab => collab.user && collab.user._id === currentUser._id
    );
    if (collaboration) {
      return collaboration.role;
    }
  }
  
  // Default to viewer
  return 'viewer';
};

/**
 * Check if user has specific permission
 * @param {string} role - User's role
 * @param {string} permission - Permission to check
 * @returns {boolean} - Whether user has permission
 */
export const hasPermission = (role, permission) => {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions[permission] : false;
};

/**
 * Check if user can perform action on document
 * @param {Object} document - The document object
 * @param {Object} currentUser - The current user object
 * @param {string} action - The action to check (canEdit, canDelete, etc.)
 * @returns {boolean} - Whether user can perform the action
 */
export const canPerformAction = (document, currentUser, action) => {
  const role = getUserRole(document, currentUser);
  return hasPermission(role, action);
};

/**
 * Get role display information
 * @param {string} role - The role
 * @returns {Object} - Role display info
 */
export const getRoleInfo = (role) => {
  const roleInfo = {
    owner: {
      label: 'Owner',
      color: 'purple',
      icon: '👑',
      description: 'Full control over the document'
    },
    editor: {
      label: 'Editor',
      color: 'blue',
      icon: '✏️',
      description: 'Can edit the document'
    },
    viewer: {
      label: 'Viewer',
      color: 'gray',
      icon: '👁️',
      description: 'Can only view the document'
    }
  };
  
  return roleInfo[role] || roleInfo.viewer;
};

/**
 * Get role color classes for UI
 * @param {string} role - The role
 * @returns {string} - Tailwind CSS classes
 */
export const getRoleColorClasses = (role) => {
  const colors = {
    owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-700',
    editor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-700',
    viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600'
  };
  
  return colors[role] || colors.viewer;
};
