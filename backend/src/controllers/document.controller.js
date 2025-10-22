import { asyncHandle } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Document from "../models/document.model.js";
import User from "../models/user.model.js";
import { sendMail } from "../utils/sendMail.js";
import { documentShareTemplate } from "../utils/mailTemplates.js";
import { getDocumentUrl } from "../config/url.config.js";

// Create a new document
export const createDocument = asyncHandle(async (req, res) => {
  const { title, content = "", tags = [] } = req.body;
  const userId = req.user._id;

  if (!title || title.trim() === "") {
    throw new ApiError(400, "Document title is required");
  }

  const document = new Document({
    title: title.trim(),
    content,
    owner: userId,
    lastModifiedBy: userId,
    tags: Array.isArray(tags) ? tags : [],
    status: "draft", // New documents start as draft
  });

  // Add owner as collaborator with owner role
  document.collaborators.push({
    user: userId,
    role: "owner",
    addedBy: userId,
  });

  const savedDocument = await document.save();

  // Populate owner details
  await savedDocument.populate("owner", "name email username avatar");

  return res.status(201).json(
    new ApiResponse(201, "Document created successfully", {
      document: savedDocument,
    })
  );
});

// Get user's documents with filtering
export const getUserDocuments = asyncHandle(async (req, res) => {
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

  // Filter by document type
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
      { content: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search, "i")] } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const documents = await Document.find(query)
    .populate("owner", "name email username avatar")
    .populate("lastModifiedBy", "name email username avatar")
    .populate("collaborators.user", "name email username avatar")
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Document.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, "Documents fetched successfully", {
      documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    })
  );
});

// Get a single document
export const getDocument = asyncHandle(async (req, res) => {
  const { documentId } = req.params;
  const userId = req.user._id;


  const document = await Document.findOne({
    _id: documentId,
    isDeleted: false,
  })
    .populate("owner", "name email username avatar")
    .populate("lastModifiedBy", "name email username avatar")
    .populate("collaborators.user", "name email username avatar");


  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  // Check if user has access to this document
  const userRole = document.getUserRole(userId);

  if (!userRole) {
    throw new ApiError(403, "You don't have access to this document");
  }


  return res.status(200).json(
    new ApiResponse(200, "Document fetched successfully", {
      document,
      userRole,
    })
  );
});

// Update document
export const updateDocument = asyncHandle(async (req, res) => {
  const { documentId } = req.params;
  const { title, content, tags, status, visibility } = req.body;
  const userId = req.user._id;

  const document = await Document.findOne({
    _id: documentId,
    isDeleted: false,
  });

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  // Check permissions
  if (!document.hasPermission(userId, "editor")) {
    throw new ApiError(403, "You don't have permission to edit this document");
  }

  // Update fields
  if (title !== undefined) {
    document.title = title.trim();
  }
  if (content !== undefined) {
    document.content = content;
  }
  if (tags !== undefined) {
    document.tags = Array.isArray(tags) ? tags : [];
  }
  if (status !== undefined) {
    document.status = status;
  }
  if (visibility !== undefined) {
    document.visibility = visibility;
  }

  document.lastModifiedBy = userId;

  const updatedDocument = await document.save();

  // Populate fields
  await updatedDocument.populate("owner", "name email username avatar");
  await updatedDocument.populate("lastModifiedBy", "name email username avatar");
  await updatedDocument.populate("collaborators.user", "name email username avatar");

  return res.status(200).json(
    new ApiResponse(200, "Document updated successfully", {
      document: updatedDocument,
    })
  );
});

// Auto-save document
export const autoSaveDocument = asyncHandle(async (req, res) => {
  const { documentId } = req.params;
  const { content } = req.body;
  const userId = req.user._id;

  if (!content) {
    throw new ApiError(400, "Content is required for auto-save");
  }

  const document = await Document.findOne({
    _id: documentId,
    isDeleted: false,
  });

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  // Check permissions
  if (!document.hasPermission(userId, "editor")) {
    throw new ApiError(403, "You don't have permission to edit this document");
  }

  // Check if document is not a draft
  if (document.status === "draft") {
    throw new ApiError(400, "Auto-save is not available for draft documents");
  }

  // Perform auto-save
  await document.autoSave(content, userId);

  return res.status(200).json(
    new ApiResponse(200, "Document auto-saved successfully", {
      document: {
        _id: document._id,
        autoSavedAt: document.autoSavedAt,
        isAutoSaveEnabled: document.isAutoSaveEnabled,
      },
    })
  );
});

// Enable auto-save for document
export const enableAutoSave = asyncHandle(async (req, res) => {
  const { documentId } = req.params;
  const userId = req.user._id;

  const document = await Document.findOne({
    _id: documentId,
    isDeleted: false,
  });

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  // Check permissions
  if (!document.hasPermission(userId, "editor")) {
    throw new ApiError(403, "You don't have permission to edit this document");
  }

  // Check if document is not a draft
  if (document.status === "draft") {
    throw new ApiError(400, "Auto-save cannot be enabled for draft documents");
  }

  // Enable auto-save
  await document.enableAutoSave();

  return res.status(200).json(
    new ApiResponse(200, "Auto-save enabled successfully", {
      document: {
        _id: document._id,
        isAutoSaveEnabled: document.isAutoSaveEnabled,
      },
    })
  );
});

// Delete document (soft delete)
export const deleteDocument = asyncHandle(async (req, res) => {
  const { documentId } = req.params;
  const userId = req.user._id;

  const document = await Document.findOne({
    _id: documentId,
    isDeleted: false,
  });

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  // Check permissions (only owner can delete)
  if (!document.hasPermission(userId, "owner")) {
    throw new ApiError(403, "You don't have permission to delete this document");
  }

  // Soft delete
  document.isDeleted = true;
  document.deletedAt = new Date();
  document.deletedBy = userId;

  await document.save();

  return res.status(200).json(
    new ApiResponse(200, "Document deleted successfully")
  );
});

// Share document with users
export const shareDocument = asyncHandle(async (req, res) => {
  const { documentId } = req.params;
  const { userIds, role = "viewer" } = req.body;
  const currentUserId = req.user._id;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new ApiError(400, "User IDs are required");
  }

  const validRoles = ["editor", "viewer"];
  if (!validRoles.includes(role)) {
    throw new ApiError(400, "Invalid role specified");
  }

  const document = await Document.findOne({
    _id: documentId,
    isDeleted: false,
  });

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  // Check permissions (only owner and editors can share)
  if (!document.hasPermission(currentUserId, "editor")) {
    throw new ApiError(403, "You don't have permission to share this document");
  }

  // Verify users exist and get their details
  const users = await User.find({ _id: { $in: userIds } });
  const foundUserIds = users.map(user => user._id.toString());
  const notFoundUserIds = userIds.filter(userId => !foundUserIds.includes(userId));

  if (notFoundUserIds.length > 0) {
    throw new ApiError(400, `Users not found: ${notFoundUserIds.join(', ')}`);
  }

  // Check if any of the users are trying to share with themselves
  const selfShareAttempts = userIds.filter(userId => userId === currentUserId.toString());
  if (selfShareAttempts.length > 0) {
    throw new ApiError(400, "You cannot share a document with yourself");
  }

  // Add collaborators
  const newCollaborators = [];
  const alreadyCollaborators = [];
  
  for (const userId of userIds) {
    // Check if user is already a collaborator
    const existingCollaborator = document.collaborators.find(
      (col) => col.user.toString() === userId
    );

    if (!existingCollaborator) {
      document.collaborators.push({
        user: userId,
        role,
        addedBy: currentUserId,
        addedAt: new Date()
      });
      newCollaborators.push(userId);
    } else {
      alreadyCollaborators.push(userId);
    }
  }

  // If no new collaborators were added, return appropriate message
  if (newCollaborators.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, "All specified users are already collaborators", {
        document,
        newCollaborators: [],
        alreadyCollaborators,
        message: "No new collaborators were added"
      })
    );
  }

  // Update visibility to shared if not already
  if (document.visibility === "private") {
    document.visibility = "shared";
  }

  await document.save();

  // Populate the updated document
  await document.populate("collaborators.user", "name email username avatar");

  return res.status(200).json(
    new ApiResponse(200, "Document shared successfully", {
      document,
      newCollaborators,
      alreadyCollaborators,
      message: `${newCollaborators.length} new collaborator(s) added successfully`
    })
  );
});

// Update collaborator role
export const updateCollaboratorRole = asyncHandle(async (req, res) => {
  const { documentId, userId } = req.params;
  const { role } = req.body;
  const currentUserId = req.user._id;

  const validRoles = ["editor", "viewer"];
  if (!validRoles.includes(role)) {
    throw new ApiError(400, "Invalid role specified");
  }

  const document = await Document.findOne({
    _id: documentId,
    isDeleted: false,
  });

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  // Check permissions (only owner can change roles)
  if (!document.hasPermission(currentUserId, "owner")) {
    throw new ApiError(403, "You don't have permission to change roles");
  }

  // Find and update collaborator
  const collaborator = document.collaborators.find(
    (col) => col.user.toString() === userId
  );

  if (!collaborator) {
    throw new ApiError(404, "Collaborator not found");
  }

  collaborator.role = role;

  await document.save();

  return res.status(200).json(
    new ApiResponse(200, "Collaborator role updated successfully")
  );
});

// Remove collaborator
export const removeCollaborator = asyncHandle(async (req, res) => {
  const { documentId, userId } = req.params;
  const currentUserId = req.user._id;

  const document = await Document.findOne({
    _id: documentId,
    isDeleted: false,
  });

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  // Check permissions (only owner can remove collaborators)
  if (!document.hasPermission(currentUserId, "owner")) {
    throw new ApiError(403, "You don't have permission to remove collaborators");
  }

  // Remove collaborator
  document.collaborators = document.collaborators.filter(
    (col) => col.user.toString() !== userId
  );

  await document.save();

  return res.status(200).json(
    new ApiResponse(200, "Collaborator removed successfully")
  );
});

// Share document via email
export const shareDocumentViaEmail = asyncHandle(async (req, res) => {
  const { documentId } = req.params;
  const { emails, role = "viewer", message = "" } = req.body;
  const currentUserId = req.user._id;

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    throw new ApiError(400, "Email addresses are required");
  }

  const validRoles = ["editor", "viewer"];
  if (!validRoles.includes(role)) {
    throw new ApiError(400, "Invalid role specified");
  }

  const document = await Document.findOne({
    _id: documentId,
    isDeleted: false,
  })
    .populate("owner", "name email username avatar")
    .populate("lastModifiedBy", "name email username avatar");

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  // Check permissions (only owner and editors can share)
  if (!document.hasPermission(currentUserId, "editor")) {
    throw new ApiError(403, "You don't have permission to share this document");
  }

  const currentUser = await User.findById(currentUserId);
  
  // Generate document URL using config helper
  const documentUrl = getDocumentUrl(documentId);
  
  // Check which emails correspond to existing users
  const existingUsers = await User.find({ email: { $in: emails } });
  const existingUserEmails = existingUsers.map(user => user.email);
  const newUserEmails = emails.filter(email => !existingUserEmails.includes(email));
  
  // Add existing users as collaborators
  const newCollaborators = [];
  const alreadyCollaborators = [];
  
  for (const user of existingUsers) {
    // Check if user is already a collaborator
    const existingCollaborator = document.collaborators.find(
      (col) => col.user.toString() === user._id.toString()
    );

    if (!existingCollaborator) {
      document.collaborators.push({
        user: user._id,
        role,
        addedBy: currentUserId,
        addedAt: new Date()
      });
      newCollaborators.push(user._id);
    } else {
      alreadyCollaborators.push(user._id);
    }
  }

  // Update visibility to shared if not already
  if (document.visibility === "private") {
    document.visibility = "shared";
  }

  // Save document if there were changes
  if (newCollaborators.length > 0) {
    await document.save();
  }
  
  // Send emails to each recipient
  const emailPromises = emails.map(async (email) => {
    const emailSubject = `📄 ${currentUser.name} shared "${document.title}" with you`;
    const emailHtml = documentShareTemplate(
      currentUser.name,
      document.title,
      documentUrl,
      role,
      message
    );

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
    new ApiResponse(200, "Document sharing emails sent", {
      document: {
        _id: document._id,
        title: document.title,
        url: documentUrl,
      },
      emailsSent: successfulEmails.length,
      emailsFailed: failedEmails.length,
      successfulEmails: successfulEmails.map(r => r.email),
      failedEmails: failedEmails.map(r => ({ email: r.email, error: r.error })),
      collaboratorsAdded: newCollaborators.length,
      alreadyCollaborators: alreadyCollaborators.length,
      existingUserEmails: existingUserEmails,
      newUserEmails: newUserEmails,
      message: `${newCollaborators.length} existing users added as collaborators, ${newUserEmails.length} new users invited via email`
    })
  );
});

// Get document preview (public access for shared documents)
export const getDocumentPreview = asyncHandle(async (req, res) => {
  const { documentId } = req.params;

  const document = await Document.findOne({
    _id: documentId,
    isDeleted: false,
    visibility: "shared",
  })
    .populate("owner", "name email username avatar")
    .select("title content owner createdAt updatedAt version tags");

  if (!document) {
    throw new ApiError(404, "Document not found or not publicly accessible");
  }

  return res.status(200).json(
    new ApiResponse(200, "Document preview fetched successfully", {
      document: {
        _id: document._id,
        title: document.title,
        content: document.content,
        owner: document.owner,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        version: document.version,
        tags: document.tags,
        isPreview: true,
      },
    })
  );
});

// Search documents
export const searchDocuments = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { q: searchQuery, type, status, page = 1, limit = 10 } = req.query;

  if (!searchQuery || searchQuery.trim() === "") {
    throw new ApiError(400, "Search query is required");
  }

  // Build base query conditions
  const conditions = [];
  
  // User access condition
  conditions.push({
    $or: [
      { owner: userId },
      { "collaborators.user": userId },
    ],
  });

  // Search condition
  conditions.push({
    $or: [
      { title: { $regex: searchQuery, $options: "i" } },
      { content: { $regex: searchQuery, $options: "i" } },
      { tags: { $in: [new RegExp(searchQuery, "i")] } },
    ],
  });

  // Filter by document type
  if (type && type.trim() !== "") {
    if (type === "own") {
      conditions.push({ owner: userId, visibility: "private" });
    } else if (type === "shared") {
      conditions.push({ visibility: "shared" });
    } else if (type === "draft") {
      conditions.push({ status: "draft" });
    }
  }

  // Filter by status
  if (status && status.trim() !== "") {
    conditions.push({ status: status });
  }

  // Build final query
  const query = {
    $and: conditions,
    isDeleted: false,
  };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const documents = await Document.find(query)
    .populate("owner", "name email username avatar")
    .populate("lastModifiedBy", "name email username avatar")
    .populate("collaborators.user", "name email username avatar")
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Document.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, "Search results fetched successfully", {
      documents,
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
