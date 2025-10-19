import { asyncHandle } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import User from "../models/user.model.js";

// Middleware to check if user has required role
export const requireRole = (roles) => {
  return asyncHandle(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      throw new ApiError(401, "User not found");
    }

    const userRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!userRoles.includes(user.role)) {
      throw new ApiError(403, "Insufficient permissions. Required role: " + userRoles.join(" or "));
    }

    req.userRole = user.role;
    req.userPermissions = user.permissions;
    next();
  });
};

// Middleware to check if user has required permission
export const requirePermission = (permissions) => {
  return asyncHandle(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      throw new ApiError(401, "User not found");
    }

    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
    
    // Check if user has any of the required permissions
    const hasPermission = requiredPermissions.some(permission => user.hasPermission(permission));
    
    if (!hasPermission) {
      throw new ApiError(403, "Insufficient permissions. Required permission: " + requiredPermissions.join(" or "));
    }

    req.userRole = user.role;
    req.userPermissions = user.permissions;
    next();
  });
};

// Middleware to check if user is admin
export const requireAdmin = requireRole("admin");

// Middleware to check if user is moderator or admin
export const requireModerator = requireRole(["admin", "moderator"]);

// Middleware to check document ownership or collaboration
export const requireDocumentAccess = (requiredRole = "viewer") => {
  return asyncHandle(async (req, res, next) => {
    const { documentId } = req.params;
    const userId = req.user._id;
    
    // Import Document model here to avoid circular dependency
    const Document = (await import("../models/document.model.js")).default;
    
    const document = await Document.findById(documentId);
    
    if (!document) {
      throw new ApiError(404, "Document not found");
    }

    // Check if user has access to this document
    const userRole = document.getUserRole(userId);
    
    if (!userRole) {
      throw new ApiError(403, "You don't have access to this document");
    }

    // Check if user has required role level
    if (!document.hasPermission(userId, requiredRole)) {
      throw new ApiError(403, `You need ${requiredRole} role or higher to perform this action`);
    }

    req.document = document;
    req.userDocumentRole = userRole;
    next();
  });
};
