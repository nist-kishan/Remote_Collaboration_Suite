import React from "react";
import { motion } from "framer-motion";
import { 
  Grid, 
  Users, 
  Eye, 
  Edit, 
  MoreVertical,
  Share,
  Trash2,
  Calendar,
  User,
  Crown,
  PenTool
} from "lucide-react";
import Button from "../ui/CustomButton";
import Card from "../ui/CustomCard";
import { getUserRole, getRoleColorClasses, canPerformAction } from "../../utils/roleUtils";

const WhiteboardCard = (props) => {
  // Handle null props object
  if (!props) {
    return null;
  }

  const { 
    whiteboard, 
    currentUser,
    onEdit, 
    onShare, 
    onDelete, 
    onView,
    onCollaborate,
    className = "" 
  } = props;

  // Handle null or undefined whiteboard or currentUser
  if (!whiteboard || !currentUser) {
    return null;
  }

  // Get user role for this whiteboard
  const userRole = getUserRole(whiteboard, currentUser);
  
  // Determine which action icons to show based on role
  const getVisibleActions = () => {
    switch (userRole) {
      case 'viewer':
        return ['view']; // Only view button
      case 'editor':
        return ['edit', 'collaborate']; // Only edit and collaborate buttons
      case 'owner':
        return ['edit', 'collaborate', 'delete']; // 3 buttons: edit, collaborate, delete
      default:
        return ['view']; // Default to view only
    }
  };
  
  const visibleActions = getVisibleActions();
  
  const getStatusColor = (status) => {
    return status === "active" 
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
      : status === "draft"
      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getSharerInfo = () => {
    if (whiteboard.owner) {
      return {
        name: whiteboard.owner.name || whiteboard.owner.username || 'Unknown User',
        isOwner: whiteboard.owner._id === currentUser._id
      };
    }
    return {
      name: 'Unknown User',
      isOwner: false
    };
  };

  const sharerInfo = getSharerInfo();

  return (
    <div className={`group ${className}`}>
      <Card className={`h-full transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 hover:shadow-md dark:hover:shadow-lg ${
        className.includes('flex-row') ? 'flex flex-row items-center p-4' : 'flex flex-col p-4 sm:p-6'
      }`}>
        {className.includes('flex-row') ? (
          // List View Layout
          <>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-indigo-500 dark:bg-indigo-600 rounded-lg flex items-center justify-center">
                  <PenTool className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-base">
                  {whiteboard.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    by {sharerInfo.name}
                  </span>
                  {sharerInfo.isOwner && (
                    <Crown className="w-3 h-3 text-yellow-500" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className={`px-2 py-1 text-xs font-medium rounded ${getRoleColorClasses(userRole)}`}>
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(whiteboard.status)}`}>
                {whiteboard.status}
              </span>
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Calendar className="w-3 h-3" />
                <span>{new Date(whiteboard.updatedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                {/* View Button - Only for viewers */}
                {visibleActions.includes('view') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(whiteboard)}
                    title="View Whiteboard"
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
                
                {/* Edit Button - For editors and owners */}
                {visibleActions.includes('edit') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(whiteboard)}
                    title="Edit Whiteboard"
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                
                {/* Collaborate Button - For editors and owners */}
                {visibleActions.includes('collaborate') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (onCollaborate) {
                        onCollaborate(whiteboard);
                      } else {
                        console.warn('⚠️ onCollaborate handler not provided, falling back to onShare');
                        onShare(whiteboard);
                      }
                    }}
                    title="Manage Collaboration"
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Users className="w-4 h-4" />
                  </Button>
                )}
                
                {/* Delete Button - For editors and owners */}
                {visibleActions.includes('delete') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(whiteboard)}
                    title="Delete Whiteboard"
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : (
          // Grid View Layout
          <>
            {/* Card Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <PenTool className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {whiteboard.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {whiteboard.description || "No description"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Users className="w-3 h-3" />
                  <span>{whiteboard.collaborators?.length + 1 || 1}</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            {whiteboard.tags && whiteboard.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {whiteboard.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {whiteboard.tags.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                    +{whiteboard.tags.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Role Badge */}
            <div className="flex items-center justify-between mb-4">
              <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getRoleColorClasses(userRole)}`}>
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(whiteboard.status)}`}>
                {whiteboard.status}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(whiteboard.updatedAt)}</span>
              </div>

              <div className="flex items-center gap-2">
                {/* View Button - Only for viewers */}
                {visibleActions.includes('view') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(whiteboard)}
                    title="View Whiteboard"
                    className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
                
                {/* Edit Button - For editors and owners */}
                {visibleActions.includes('edit') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(whiteboard)}
                    title="Edit Whiteboard"
                    className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                
                {/* Collaborate Button - For editors and owners */}
                {visibleActions.includes('collaborate') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (onCollaborate) {
                        onCollaborate(whiteboard);
                      } else {
                        console.warn('⚠️ onCollaborate handler not provided, falling back to onShare');
                        onShare(whiteboard);
                      }
                    }}
                    title="Manage Collaboration"
                    className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Users className="w-4 h-4" />
                  </Button>
                )}
                
                {/* Delete Button - For editors and owners */}
                {visibleActions.includes('delete') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(whiteboard)}
                    title="Delete Whiteboard"
                    className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default WhiteboardCard;
