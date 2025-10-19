import { asyncHandle } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import User from "../models/user.model.js";

// Get current user profile
export const getCurrentUser = asyncHandle(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -refreshToken -otp -optExpire");
  
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(
    new ApiResponse(200, "User profile fetched successfully", {
      user,
    })
  );
});

// Get user roles and permissions
export const getUserRoles = asyncHandle(async (req, res) => {
  const user = await User.findById(req.user._id).select("role permissions");
  
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(
    new ApiResponse(200, "User roles fetched successfully", {
      role: user.role,
      permissions: user.permissions,
      isAdmin: user.isAdmin(),
      isModerator: user.isModerator(),
    })
  );
});

// Update user role (admin only)
export const updateUserRole = asyncHandle(async (req, res) => {
  const { userId } = req.params;
  const { role, permissions } = req.body;
  const currentUserId = req.user._id;

  // Check if current user is admin
  const currentUser = await User.findById(currentUserId);
  if (!currentUser.isAdmin()) {
    throw new ApiError(403, "Only admins can update user roles");
  }

  const validRoles = ["user", "admin", "moderator"];
  if (role && !validRoles.includes(role)) {
    throw new ApiError(400, "Invalid role specified");
  }

  const validPermissions = [
    "create_documents", 
    "edit_all_documents", 
    "delete_all_documents", 
    "manage_users", 
    "view_analytics"
  ];
  
  if (permissions && !Array.isArray(permissions)) {
    throw new ApiError(400, "Permissions must be an array");
  }

  if (permissions && permissions.some(perm => !validPermissions.includes(perm))) {
    throw new ApiError(400, "Invalid permission specified");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Update role and permissions
  if (role) {
    user.role = role;
  }
  
  if (permissions !== undefined) {
    user.permissions = permissions;
  }

  await user.save();

  return res.status(200).json(
    new ApiResponse(200, "User role updated successfully", {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      },
    })
  );
});

// Search users for chat (all authenticated users)
export const searchUsers = asyncHandle(async (req, res) => {
  const currentUserId = req.user._id;
  const { q: searchTerm, limit = 20 } = req.query;

  if (!searchTerm || searchTerm.trim().length < 2) {
    throw new ApiError(400, "Search term must be at least 2 characters");
  }

  // Build search query
  const searchRegex = { $regex: searchTerm.trim(), $options: "i" };
  const query = {
    _id: { $ne: currentUserId }, // Exclude current user
    $or: [
      { name: searchRegex },
      { email: searchRegex },
      { username: searchRegex },
      { phone: searchRegex }
    ]
  };

  const users = await User.find(query)
    .select("name email username phone avatar")
    .limit(parseInt(limit))
    .sort({ name: 1 })
    .lean(); // Use lean() for better performance

  return res.status(200).json(
    new ApiResponse(200, "Users found successfully", {
      users,
      searchTerm: searchTerm.trim()
    })
  );
});

// Get all users (admin only)
export const getAllUsers = asyncHandle(async (req, res) => {
  const currentUserId = req.user._id;
  const { page = 1, limit = 10, search } = req.query;

  // Check if current user is admin
  const currentUser = await User.findById(currentUserId);
  if (!currentUser.isAdmin()) {
    throw new ApiError(403, "Only admins can view all users");
  }

  // Build query
  let query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { username: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const users = await User.find(query)
    .select("-password -refreshToken -otp -optExpire")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, "Users fetched successfully", {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    })
  );
});
