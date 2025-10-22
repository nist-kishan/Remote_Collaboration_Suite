import { asyncHandle } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Whiteboard from "../models/whiteboard.model.js";
import User from "../models/user.model.js";
import { sendMail } from "../utils/sendMail.js";
import { getWhiteboardUrl } from "../config/url.config.js";

// Create a new whiteboard
export const createWhiteboard = asyncHandle(async (req, res) => {
  const { title, description = "", tags = [], canvasSettings = {} } = req.body;
  const userId = req.user._id;

  if (!title || title.trim() === "") {
    throw new ApiError(400, "Whiteboard title is required");
  }

  const whiteboard = new Whiteboard({
    title: title.trim(),
    description,
    owner: userId,
    lastModifiedBy: userId,
    tags: Array.isArray(tags) ? tags : [],
    canvasSettings: {
      width: canvasSettings.width || 1920,
      height: canvasSettings.height || 1080,
      backgroundColor: canvasSettings.backgroundColor || "#ffffff",
      gridSize: canvasSettings.gridSize || 20,
      showGrid: canvasSettings.showGrid !== undefined ? canvasSettings.showGrid : true,
    },
  });

  // Add owner as collaborator with owner role
  whiteboard.collaborators.push({
    user: userId,
    role: "owner",
    addedBy: userId,
  });

  const savedWhiteboard = await whiteboard.save();

  // Populate owner details
  await savedWhiteboard.populate("owner", "name email username avatar");

  return res.status(201).json(
    new ApiResponse(201, "Whiteboard created successfully", {
      whiteboard: savedWhiteboard,
    })
  );
});

// Get user's whiteboards with filtering
export const getUserWhiteboards = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { type, status, search, page = 1, limit = 10 } = req.query;

  // Build query
  let query = {
    $or: [
      { owner: userId },
      { "collaborators.user": userId },
    ],
    isDeleted: false,
  };

  // Filter by whiteboard type
  if (type === "own") {
    query = { ...query, owner: userId, visibility: "private" };
  } else if (type === "shared") {
    query = { ...query, visibility: "shared" };
  } else if (type === "draft") {
    query = { ...query, status: "draft" };
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Search functionality
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search, "i")] } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const whiteboards = await Whiteboard.find(query)
    .populate("owner", "name email username avatar")
    .populate("lastModifiedBy", "name email username avatar")
    .populate("collaborators.user", "name email username avatar")
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Whiteboard.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, "Whiteboards fetched successfully", {
      whiteboards,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    })
  );
});

// Get a single whiteboard
export const getWhiteboard = asyncHandle(async (req, res) => {
  const { whiteboardId } = req.params;
  const userId = req.user._id;

  const whiteboard = await Whiteboard.findOne({
    _id: whiteboardId,
    isDeleted: false,
  })
    .populate("owner", "name email username avatar")
    .populate("lastModifiedBy", "name email username avatar")
    .populate("collaborators.user", "name email username avatar");

  if (!whiteboard) {
    throw new ApiError(404, "Whiteboard not found");
  }

  // Check if user has access to this whiteboard
  const userRole = whiteboard.getUserRole(userId);
  
  if (!userRole) {
    throw new ApiError(403, "You don't have access to this whiteboard");
  }

  return res.status(200).json(
    new ApiResponse(200, "Whiteboard fetched successfully", {
      whiteboard,
      userRole,
    })
  );
});

// Update whiteboard
export const updateWhiteboard = asyncHandle(async (req, res) => {
  const { whiteboardId } = req.params;
  const { title, description, tags, status, visibility, canvasData, canvasSettings } = req.body;
  const userId = req.user._id;

  const whiteboard = await Whiteboard.findOne({
    _id: whiteboardId,
    isDeleted: false,
  });

  if (!whiteboard) {
    throw new ApiError(404, "Whiteboard not found");
  }

  // Check permissions
  if (!whiteboard.hasPermission(userId, "editor")) {
    throw new ApiError(403, "You don't have permission to edit this whiteboard");
  }

  // Update fields
  if (title !== undefined) {
    whiteboard.title = title.trim();
  }
  if (description !== undefined) {
    whiteboard.description = description;
  }
  if (tags !== undefined) {
    whiteboard.tags = Array.isArray(tags) ? tags : [];
  }
  if (status !== undefined) {
    whiteboard.status = status;
  }
  if (visibility !== undefined) {
    whiteboard.visibility = visibility;
  }
  if (canvasData !== undefined) {
    whiteboard.canvasData = canvasData;
  }
  if (canvasSettings !== undefined) {
    whiteboard.canvasSettings = { ...whiteboard.canvasSettings, ...canvasSettings };
  }

  whiteboard.lastModifiedBy = userId;

  const updatedWhiteboard = await whiteboard.save();

  // Populate fields
  await updatedWhiteboard.populate("owner", "name email username avatar");
  await updatedWhiteboard.populate("lastModifiedBy", "name email username avatar");
  await updatedWhiteboard.populate("collaborators.user", "name email username avatar");

  return res.status(200).json(
    new ApiResponse(200, "Whiteboard updated successfully", {
      whiteboard: updatedWhiteboard,
    })
  );
});

// Delete whiteboard (soft delete)
export const deleteWhiteboard = asyncHandle(async (req, res) => {
  const { whiteboardId } = req.params;
  const userId = req.user._id;

  const whiteboard = await Whiteboard.findOne({
    _id: whiteboardId,
    isDeleted: false,
  });

  if (!whiteboard) {
    throw new ApiError(404, "Whiteboard not found");
  }

  // Check permissions (only owner can delete)
  if (!whiteboard.hasPermission(userId, "owner")) {
    throw new ApiError(403, "You don't have permission to delete this whiteboard");
  }

  // Soft delete
  whiteboard.isDeleted = true;
  whiteboard.deletedAt = new Date();
  whiteboard.deletedBy = userId;

  await whiteboard.save();

  return res.status(200).json(
    new ApiResponse(200, "Whiteboard deleted successfully")
  );
});

// Share whiteboard with users
export const shareWhiteboard = asyncHandle(async (req, res) => {
  const { whiteboardId } = req.params;
  const { userIds, role = "viewer" } = req.body;
  const currentUserId = req.user._id;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new ApiError(400, "User IDs are required");
  }

  const validRoles = ["editor", "viewer"];
  if (!validRoles.includes(role)) {
    throw new ApiError(400, "Invalid role specified");
  }

  const whiteboard = await Whiteboard.findOne({
    _id: whiteboardId,
    isDeleted: false,
  });

  if (!whiteboard) {
    throw new ApiError(404, "Whiteboard not found");
  }

  // Check permissions (only owner can share)
  if (!whiteboard.hasPermission(currentUserId, "owner")) {
    throw new ApiError(403, "You don't have permission to share this whiteboard");
  }

  // Check if whiteboard is full
  if (whiteboard.isFull()) {
    throw new ApiError(400, "Whiteboard has reached maximum collaborators limit");
  }

  // Verify users exist
  const users = await User.find({ _id: { $in: userIds } });
  if (users.length !== userIds.length) {
    throw new ApiError(400, "Some users not found");
  }

  // Add collaborators
  const newCollaborators = [];
  for (const userId of userIds) {
    // Check if user is already a collaborator
    const existingCollaborator = whiteboard.collaborators.find(
      (col) => col.user.toString() === userId
    );

    if (!existingCollaborator) {
      whiteboard.collaborators.push({
        user: userId,
        role,
        addedBy: currentUserId,
      });
      newCollaborators.push(userId);
    }
  }

  // Update visibility to shared if not already
  if (whiteboard.visibility === "private") {
    whiteboard.visibility = "shared";
  }

  await whiteboard.save();

  // Populate the updated whiteboard
  await whiteboard.populate("collaborators.user", "name email username avatar");

  return res.status(200).json(
    new ApiResponse(200, "Whiteboard shared successfully", {
      whiteboard,
      newCollaborators,
    })
  );
});

// Update collaborator role
export const updateCollaboratorRole = asyncHandle(async (req, res) => {
  const { whiteboardId, userId } = req.params;
  const { role } = req.body;
  const currentUserId = req.user._id;

  const validRoles = ["editor", "viewer"];
  if (!validRoles.includes(role)) {
    throw new ApiError(400, "Invalid role specified");
  }

  const whiteboard = await Whiteboard.findOne({
    _id: whiteboardId,
    isDeleted: false,
  });

  if (!whiteboard) {
    throw new ApiError(404, "Whiteboard not found");
  }

  // Check permissions (only owner can change roles)
  if (!whiteboard.hasPermission(currentUserId, "owner")) {
    throw new ApiError(403, "You don't have permission to change roles");
  }

  // Find and update collaborator
  const collaborator = whiteboard.collaborators.find(
    (col) => col.user.toString() === userId
  );

  if (!collaborator) {
    throw new ApiError(404, "Collaborator not found");
  }

  collaborator.role = role;

  await whiteboard.save();

  return res.status(200).json(
    new ApiResponse(200, "Collaborator role updated successfully")
  );
});

// Remove collaborator
export const removeCollaborator = asyncHandle(async (req, res) => {
  const { whiteboardId, userId } = req.params;
  const currentUserId = req.user._id;

  const whiteboard = await Whiteboard.findOne({
    _id: whiteboardId,
    isDeleted: false,
  });

  if (!whiteboard) {
    throw new ApiError(404, "Whiteboard not found");
  }

  // Check permissions (only owner can remove collaborators)
  if (!whiteboard.hasPermission(currentUserId, "owner")) {
    throw new ApiError(403, "You don't have permission to remove collaborators");
  }

  // Remove collaborator
  whiteboard.collaborators = whiteboard.collaborators.filter(
    (col) => col.user.toString() !== userId
  );

  await whiteboard.save();

  return res.status(200).json(
    new ApiResponse(200, "Collaborator removed successfully")
  );
});

// Share whiteboard via email
export const shareWhiteboardViaEmail = asyncHandle(async (req, res) => {
  const { whiteboardId } = req.params;
  const { emails, role = "viewer", message = "" } = req.body;
  const currentUserId = req.user._id;

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    throw new ApiError(400, "Email addresses are required");
  }

  const validRoles = ["editor", "viewer"];
  if (!validRoles.includes(role)) {
    throw new ApiError(400, "Invalid role specified");
  }

  const whiteboard = await Whiteboard.findOne({
    _id: whiteboardId,
    isDeleted: false,
  })
    .populate("owner", "name email username avatar")
    .populate("lastModifiedBy", "name email username avatar");

  if (!whiteboard) {
    throw new ApiError(404, "Whiteboard not found");
  }

  // Check permissions (only owner can share)
  if (!whiteboard.hasPermission(currentUserId, "owner")) {
    throw new ApiError(403, "You don't have permission to share this whiteboard");
  }

  const currentUser = await User.findById(currentUserId);
  
  // Generate whiteboard URL using config helper
  const whiteboardUrl = getWhiteboardUrl(whiteboardId);
  
  // Send emails to each recipient
  const emailPromises = emails.map(async (email) => {
    const emailSubject = `${currentUser.name} shared a whiteboard with you: ${whiteboard.title}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Whiteboard Shared</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello!</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            <strong>${currentUser.name}</strong> has shared a whiteboard with you:
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
            <h3 style="color: #333; margin: 0 0 10px 0;">${whiteboard.title}</h3>
            <p style="color: #666; margin: 0; font-size: 14px;">
              <strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}<br>
              <strong>Last modified:</strong> ${new Date(whiteboard.updatedAt).toLocaleDateString()}
            </p>
          </div>
          
          ${message ? `
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #1976d2; margin: 0; font-style: italic;">"${message}"</p>
            </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${whiteboardUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 12px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      display: inline-block; 
                      font-weight: bold;">
              Open Whiteboard
            </a>
          </div>
          
          <p style="color: #888; font-size: 12px; margin-top: 30px;">
            If you don't have an account, you'll be prompted to create one to access the whiteboard.
          </p>
        </div>
        
        <div style="background: #f1f3f4; padding: 20px; text-align: center;">
          <p style="color: #666; margin: 0; font-size: 12px;">
            This email was sent from Remote Work Collaboration Suite
          </p>
        </div>
      </div>
    `;

    try {
      await sendMail({
        to: email,
        subject: emailSubject,
        html: emailHtml,
      });
      return { email, status: 'sent' };
    } catch (error) {
      // Failed to send email
      return { email, status: 'failed', error: error.message };
    }
  });

  const emailResults = await Promise.all(emailPromises);
  const successfulEmails = emailResults.filter(result => result.status === 'sent');
  const failedEmails = emailResults.filter(result => result.status === 'failed');

  return res.status(200).json(
    new ApiResponse(200, "Whiteboard sharing emails sent", {
      whiteboard: {
        _id: whiteboard._id,
        title: whiteboard.title,
        url: whiteboardUrl,
      },
      emailsSent: successfulEmails.length,
      emailsFailed: failedEmails.length,
      successfulEmails: successfulEmails.map(r => r.email),
      failedEmails: failedEmails.map(r => ({ email: r.email, error: r.error })),
    })
  );
});

// Get whiteboard preview (public access for shared whiteboards)
export const getWhiteboardPreview = asyncHandle(async (req, res) => {
  const { whiteboardId } = req.params;

  const whiteboard = await Whiteboard.findOne({
    _id: whiteboardId,
    isDeleted: false,
    visibility: "shared",
  })
    .populate("owner", "name email username avatar")
    .select("title description owner createdAt updatedAt version tags canvasSettings");

  if (!whiteboard) {
    throw new ApiError(404, "Whiteboard not found or not publicly accessible");
  }

  return res.status(200).json(
    new ApiResponse(200, "Whiteboard preview fetched successfully", {
      whiteboard: {
        _id: whiteboard._id,
        title: whiteboard.title,
        description: whiteboard.description,
        owner: whiteboard.owner,
        createdAt: whiteboard.createdAt,
        updatedAt: whiteboard.updatedAt,
        version: whiteboard.version,
        tags: whiteboard.tags,
        canvasSettings: whiteboard.canvasSettings,
        isPreview: true,
      },
    })
  );
});

// Search whiteboards
export const searchWhiteboards = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { q: searchQuery, type, status, page = 1, limit = 10 } = req.query;

  if (!searchQuery || searchQuery.trim() === "") {
    throw new ApiError(400, "Search query is required");
  }

  // Build search query
  let query = {
    $or: [
      { owner: userId },
      { "collaborators.user": userId },
    ],
    isDeleted: false,
    $text: { $search: searchQuery },
  };

  // Filter by whiteboard type
  if (type === "own") {
    query = { ...query, owner: userId, visibility: "private" };
  } else if (type === "shared") {
    query = { ...query, visibility: "shared" };
  } else if (type === "draft") {
    query = { ...query, status: "draft" };
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const whiteboards = await Whiteboard.find(query)
    .populate("owner", "name email username avatar")
    .populate("lastModifiedBy", "name email username avatar")
    .sort({ score: { $meta: "textScore" }, updatedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Whiteboard.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, "Search results fetched successfully", {
      whiteboards,
      searchQuery,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    })
  );
});
