import React from "react";
import { 
  FileText, 
  Users, 
  Eye, 
  Edit, 
  MessageSquare, 
  MoreVertical,
  Share,
  Trash2,
  Calendar,
  User,
  Crown,
  Upload,
  Download
} from "lucide-react";
import Button from "../ui/CustomButton";
import Card from "../ui/CustomCard";
import { getUserRole, getRoleColorClasses, canPerformAction } from "../../utils/roleUtils";

const DocumentCard = (props) => {
  // Handle null props object
  if (!props) {
    return null;
  }

  const { 
    document, 
    currentUser,
    onEdit, 
    onShare, 
    onDelete, 
    onView,
    onUpload,
    onExport,
    className = "" 
  } = props;

  // Handle null or undefined document or currentUser
  if (!document || !currentUser) {
    return null;
  }

  // Get user role for this document
  const userRole = getUserRole(document, currentUser);
  
  // Determine which action icons to show based on role
  const getVisibleActions = () => {
    switch (userRole) {
      case 'viewer':
        return ['view']; // Only view button
      case 'editor':
        return ['edit', 'download']; // Only edit and download buttons
      case 'owner':
        return ['edit', 'download', 'share', 'delete']; // 4 buttons: edit, download, share, delete
      default:
        return ['view']; // Default to view only
    }
  };
  
  const visibleActions = getVisibleActions();
  
  const getStatusColor = (status) => {
    switch (status) {
      case "published":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      case "draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getCollaboratorCount = () => {
    return document.collaborators?.length || 0;
  };

  const getSharerInfo = () => {
    if (document.owner) {
      return {
        name: document.owner.name || 'Unknown User',
        isOwner: true
      };
    }
    // If no owner info, return first collaborator or default
    const firstCollaborator = document.collaborators?.[0];
    if (firstCollaborator?.user) {
      return {
        name: firstCollaborator.user.name || 'Unknown User',
        isOwner: false
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
                <div className="w-10 h-10 bg-blue-500 dark:bg-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-base">
                  {document.title}
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
              <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(document.status)}`}>
                {document.status}
              </span>
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Calendar className="w-3 h-3" />
                <span>{new Date(document.updatedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                {/* View Button - Only for viewers */}
                {visibleActions.includes('view') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(document)}
                    title="View Document"
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
                    onClick={() => onEdit(document)}
                    title="Edit Document"
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                
                {/* Download Button - For editors and owners */}
                {visibleActions.includes('download') && onExport && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onExport(document)}
                    title="Download Document"
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
                
                {/* Share Button - For editors and owners */}
                {visibleActions.includes('share') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onShare(document)}
                    title="Share Document"
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Share className="w-4 h-4" />
                  </Button>
                )}
                
                {/* Delete Button - For editors and owners */}
                {visibleActions.includes('delete') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(document)}
                    title="Delete Document"
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
            <div className="flex flex-col h-full">
              {/* Header - Document Icon and Title */}
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 dark:bg-blue-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-base sm:text-lg leading-tight">
                    {document.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      by {sharerInfo.name}
                    </span>
                    {sharerInfo.isOwner && (
                      <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Role and Status Badges */}
              <div className="flex items-center justify-between mb-4">
                <span className={`px-2 py-1 text-xs font-medium rounded ${getRoleColorClasses(userRole)}`}>
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(document.status)}`}>
                  {document.status}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700 mt-auto">
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="w-3 h-3" />
                  <span className="hidden sm:inline">{formatDate(document.updatedAt)}</span>
                  <span className="sm:hidden">{new Date(document.updatedAt).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-1">
                  {/* View Button - Only for viewers */}
                  {visibleActions.includes('view') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(document)}
                      title="View Document"
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
                      onClick={() => onEdit(document)}
                      title="Edit Document"
                      className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  
                  {/* Download Button - For editors and owners */}
                  {visibleActions.includes('download') && onExport && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onExport(document)}
                      title="Download Document"
                      className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                  
                  {/* Share Button - For editors and owners */}
                  {visibleActions.includes('share') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onShare(document)}
                      title="Share Document"
                      className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Share className="w-4 h-4" />
                    </Button>
                  )}
                  
                  {/* Delete Button - For editors and owners */}
                  {visibleActions.includes('delete') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(document)}
                      title="Delete Document"
                      className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default DocumentCard;
