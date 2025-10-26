/**
 * Role-based access control utilities
 */

// Define role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY = {
  owner: 3,
  admin: 2,
  member: 1,
  employee: 1,
  hr: 2,
  mr: 2,
  tr: 1,
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
    canChangeSettings: true,
    canManageMembers: true,
    canCreateProjects: true
  },
  admin: {
    canEdit: false,
    canDelete: false,
    canShare: true,
    canView: true,
    canManageCollaborators: true,
    canChangeSettings: false,
    canManageMembers: true,
    canCreateProjects: true
  },
  member: {
    canEdit: false,
    canDelete: false,
    canShare: false,
    canView: true,
    canManageCollaborators: false,
    canChangeSettings: false,
    canManageMembers: false,
    canCreateProjects: true
  },
  employee: {
    canEdit: false,
    canDelete: false,
    canShare: false,
    canView: true,
    canManageCollaborators: false,
    canChangeSettings: false,
    canManageMembers: false,
    canCreateProjects: false
  },
  hr: {
    canEdit: false,
    canDelete: false,
    canShare: true,
    canView: true,
    canManageCollaborators: true,
    canChangeSettings: false,
    canManageMembers: true,
    canCreateProjects: true
  },
  mr: {
    canEdit: false,
    canDelete: false,
    canShare: true,
    canView: true,
    canManageCollaborators: true,
    canChangeSettings: false,
    canManageMembers: true,
    canCreateProjects: true
  },
  tr: {
    canEdit: false,
    canDelete: false,
    canShare: false,
    canView: true,
    canManageCollaborators: false,
    canChangeSettings: false,
    canManageMembers: false,
    canCreateProjects: false
  },
  viewer: {
    canEdit: false,
    canDelete: false,
    canShare: false,
    canView: true,
    canManageCollaborators: false,
    canChangeSettings: false,
    canManageMembers: false,
    canCreateProjects: false
  }
};

/**
 * Get user role for a workspace
 * @param {Object} workspace - The workspace object
 * @param {Object} currentUser - The current user object
 * @returns {string} - The user's role (owner, admin, member)
 */
export const getWorkspaceUserRole = (workspace, currentUser) => {
  if (!workspace || !currentUser) return 'member';
  
  // Check if user is the owner
  if (workspace.owner && workspace.owner._id === currentUser._id) {
    return 'owner';
  }
  
  // Check workspace members
  if (workspace.members && workspace.members.length > 0) {
    const member = workspace.members.find(
      m => m.user && m.user._id === currentUser._id
    );
    if (member) {
      return member.role;
    }
  }
  
  // Default to member
  return 'member';
};

/**
 * Get user role for a project
 * @param {Object} project - The project object
 * @param {Object} currentUser - The current user object
 * @returns {string} - The user's role (owner, admin, member, etc.)
 */
export const getProjectUserRole = (project, currentUser) => {
  if (!project || !currentUser) return 'member';
  
  // Check project team
  if (project.team && project.team.length > 0) {
    const teamMember = project.team.find(
      m => m.user && m.user._id === currentUser._id
    );
    if (teamMember) {
      return teamMember.role;
    }
  }
  
  // Default to member
  return 'member';
};

/**
 * Get user role for a document
 * @param {Object} document - The document object
 * @param {Object} currentUser - The current user object
 * @returns {string} - The user's role (owner, editor, viewer)
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
 * Check if user can perform action on workspace
 * @param {Object} workspace - The workspace object
 * @param {Object} currentUser - The current user object
 * @param {string} action - The action to check
 * @returns {boolean} - Whether user can perform the action
 */
export const canPerformWorkspaceAction = (workspace, currentUser, action) => {
  const role = getWorkspaceUserRole(workspace, currentUser);
  return hasPermission(role, action);
};

/**
 * Check if user can perform action on project
 * @param {Object} project - The project object
 * @param {Object} currentUser - The current user object
 * @param {string} action - The action to check
 * @returns {boolean} - Whether user can perform the action
 */
export const canPerformProjectAction = (project, currentUser, action) => {
  const role = getProjectUserRole(project, currentUser);
  return hasPermission(role, action);
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
      description: 'Full control'
    },
    admin: {
      label: 'Admin',
      color: 'blue',
      icon: '🛡️',
      description: 'Administrative access'
    },
    member: {
      label: 'Member',
      color: 'green',
      icon: '👤',
      description: 'Standard member'
    },
    employee: {
      label: 'Employee',
      color: 'gray',
      icon: '👔',
      description: 'Employee access'
    },
    hr: {
      label: 'HR',
      color: 'purple',
      icon: '👥',
      description: 'HR access'
    },
    mr: {
      label: 'Manager',
      color: 'blue',
      icon: '💼',
      description: 'Manager access'
    },
    tr: {
      label: 'Team Rep',
      color: 'green',
      icon: '👤',
      description: 'Team representative'
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
      description: 'Can only view'
    }
  };
  
  return roleInfo[role] || roleInfo.member;
};

/**
 * Get role color classes for UI
 * @param {string} role - The role
 * @returns {string} - Tailwind CSS classes
 */
export const getRoleColorClasses = (role) => {
  const colors = {
    owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-700',
    admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-700',
    member: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-700',
    employee: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600',
    hr: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-700',
    mr: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-700',
    tr: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-700',
    editor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-700',
    viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600'
  };
  
  return colors[role] || colors.member;
};
