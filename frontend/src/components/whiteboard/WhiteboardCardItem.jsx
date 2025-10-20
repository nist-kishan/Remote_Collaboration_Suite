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
import CustomButton from "../ui/CustomButton";
import { getUserRole, getRoleColorClasses, canPerformAction } from "../../utils/roleUtils";

const WhiteboardCard = ({ 
  whiteboard, 
  currentUser,
  onEdit, 
  onShare, 
  onDelete, 
  onView,
  className = "" 
}) => {
  // Get user role for this whiteboard
  const userRole = getUserRole(whiteboard, currentUser);
  
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

  const handleCardClick = () => {
    if (canPerformAction(whiteboard, currentUser, 'canEdit')) {
      onEdit(whiteboard);
    } else if (canPerformAction(whiteboard, currentUser, 'canView')) {
      onView(whiteboard);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 cursor-pointer ${className}`}
      onClick={handleCardClick}
    >
      {/* Card Header */}
      <div className="p-6 pb-4">
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

        {/* Actions - Always visible but with role-based permissions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(whiteboard.updatedAt)}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* View - Always available */}
            <CustomButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onView(whiteboard);
              }}
              title="View Whiteboard"
              className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/20"
            >
              <Eye className="w-4 h-4" />
            </CustomButton>
            
            {/* Edit - Only for editors and owners */}
            {canPerformAction(whiteboard, currentUser, 'canEdit') && (
              <CustomButton
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(whiteboard);
                }}
                title="Edit Whiteboard"
                className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/20"
              >
                <Edit className="w-4 h-4" />
              </CustomButton>
            )}
            
            {/* Share - Only for owners */}
            {canPerformAction(whiteboard, currentUser, 'canShare') && (
              <CustomButton
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(whiteboard);
                }}
                title="Share Whiteboard"
                className="p-2 hover:bg-green-100 dark:hover:bg-green-900/20"
              >
                <Share className="w-4 h-4" />
              </CustomButton>
            )}

            {/* Delete - Only for owners */}
            {canPerformAction(whiteboard, currentUser, 'canDelete') && (
              <CustomButton
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(whiteboard);
                }}
                title="Delete Whiteboard"
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </CustomButton>
            )}
          </div>
        </div>
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  );
};

export default WhiteboardCard;
