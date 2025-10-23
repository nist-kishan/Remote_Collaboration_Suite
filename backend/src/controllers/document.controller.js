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
  const { 
    title, 
    content = "", 
    tags = [], 
    collaborationSettings = {},
    visibility = "private",
    status = "draft",
    invitedUsers = []
  } = req.body;
  const userId = req.user._id;

  console.log('🔄 Backend createDocument called:', {
    userId,
    title,
    content: content ? content.substring(0, 100) + '...' : content,
    tags,
    collaborationSettings,
    visibility,
    status,
    invitedUsersCount: invitedUsers.length
  });

  if (!title || title.trim() === "") {
    console.error('❌ Create failed: No title provided');
    throw new ApiError(400, "Document title is required");
  }

  // Default collaboration settings
  const defaultCollaborationSettings = {
    autoSave: true,
    autoSaveInterval: 30000,
    allowAnonymousView: false,
    maxCollaborators: 50,
    allowComments: true,
    allowReactions: true,
    requireApprovalForJoin: false,
    ...collaborationSettings
  };

  const document = new Document({
    title: title.trim(),
    content,
    owner: userId,
    lastModifiedBy: userId,
    tags: Array.isArray(tags) ? tags : [],
    status,
    visibility,
    collaborationSettings: defaultCollaborationSettings,
  });

  // Add owner as collaborator with owner role
  document.collaborators.push({
    user: userId,
    role: "owner",
    addedBy: userId,
  });

  // Add invited users as collaborators
  if (invitedUsers && Array.isArray(invitedUsers)) {
    for (const invitedUser of invitedUsers) {
      if (invitedUser.email) {
        // Find user by email
        const user = await User.findOne({ email: invitedUser.email });
        if (user && user._id.toString() !== userId.toString()) {
          document.collaborators.push({
            user: user._id,
            role: invitedUser.role || "viewer",
            addedBy: userId,
          });
        }
      }
    }
  }

  console.log('💾 Saving new document to database...');
  const savedDocument = await document.save();
  console.log('✅ Document created successfully:', {
    id: savedDocument._id,
    title: savedDocument.title,
    status: savedDocument.status,
    visibility: savedDocument.visibility,
    collaboratorsCount: savedDocument.collaborators.length
  });

  // Populate owner details
  await savedDocument.populate("owner", "name email username avatar");

  console.log('📤 Sending response to client');
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

  console.log('🔍 Backend getUserDocuments called with:', {
    userId,
    type,
    status,
    search,
    page,
    limit
  });

  // Build query
  let query = {
    $or: [
      { owner: userId },
      { "collaborators.user": userId },
    ],
    isDeleted: false,
  };

  console.log('🔧 Base query:', query);

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

  console.log('🔧 Final query:', query);

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

  console.log('📊 Query Results:', {
    documentsFound: documents.length,
    totalCount: total,
    documents: documents.map(doc => ({
      id: doc._id,
      title: doc.title,
      owner: doc.owner?._id,
      status: doc.status,
      visibility: doc.visibility,
      isDeleted: doc.isDeleted
    }))
  });

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

  console.log('🔄 Backend updateDocument called:', {
    documentId,
    userId,
    title,
    content: content ? content.substring(0, 100) + '...' : content,
    tags,
    status,
    visibility
  });

  const document = await Document.findOne({
    _id: documentId,
    isDeleted: false,
  });

  if (!document) {
    console.error('❌ Document not found:', documentId);
    throw new ApiError(404, "Document not found");
  }

  console.log('📄 Found document:', {
    id: document._id,
    title: document.title,
    owner: document.owner,
    status: document.status
  });

  // Check permissions
  if (!document.hasPermission(userId, "editor")) {
    console.error('❌ Permission denied for user:', userId);
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

  console.log('💾 Saving document to database...');
  const updatedDocument = await document.save();
  console.log('✅ Document saved successfully:', {
    id: updatedDocument._id,
    title: updatedDocument.title,
    status: updatedDocument.status
  });

  // Populate fields
  await updatedDocument.populate("owner", "name email username avatar");
  await updatedDocument.populate("lastModifiedBy", "name email username avatar");
  await updatedDocument.populate("collaborators.user", "name email username avatar");

  console.log('📤 Sending response to client');
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

// Get document by ID (alias for getDocument)
export const getDocumentById = getDocument;

// Get document comments
export const getDocumentComments = asyncHandle(async (req, res) => {
  const { documentId } = req.params;
  const userId = req.user._id;

  const document = await Document.findOne({
    _id: documentId,
    isDeleted: false,
  });

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  // Check if user has access to this document
  const userRole = document.getUserRole(userId);
  if (!userRole) {
    throw new ApiError(403, "You don't have access to this document");
  }

  // For now, return empty comments array
  // TODO: Implement comments functionality
  return res.status(200).json(
    new ApiResponse(200, "Document comments fetched successfully", {
      comments: [],
    })
  );
});

// Add comment to document
export const addComment = asyncHandle(async (req, res) => {
  const { documentId } = req.params;
  const { content, parentCommentId } = req.body;
  const userId = req.user._id;

  const document = await Document.findOne({
    _id: documentId,
    isDeleted: false,
  });

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  // Check if user has access to this document
  const userRole = document.getUserRole(userId);
  if (!userRole) {
    throw new ApiError(403, "You don't have access to this document");
  }

  // For now, return success without actually adding comment
  // TODO: Implement comments functionality
  return res.status(201).json(
    new ApiResponse(201, "Comment added successfully", {
      comment: {
        _id: "temp_id",
        content,
        author: userId,
        createdAt: new Date(),
      },
    })
  );
});

// Update comment
export const updateComment = asyncHandle(async (req, res) => {
  const { documentId, commentId } = req.params;
  const { content } = req.body;
  const userId = req.user._id;

  const document = await Document.findOne({
    _id: documentId,
    isDeleted: false,
  });

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  // Check if user has access to this document
  const userRole = document.getUserRole(userId);
  if (!userRole) {
    throw new ApiError(403, "You don't have access to this document");
  }

  // For now, return success without actually updating comment
  // TODO: Implement comments functionality
  return res.status(200).json(
    new ApiResponse(200, "Comment updated successfully", {
      comment: {
        _id: commentId,
        content,
        author: userId,
        updatedAt: new Date(),
      },
    })
  );
});

// Delete comment
export const deleteComment = asyncHandle(async (req, res) => {
  const { documentId, commentId } = req.params;
  const userId = req.user._id;

  const document = await Document.findOne({
    _id: documentId,
    isDeleted: false,
  });

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  // Check if user has access to this document
  const userRole = document.getUserRole(userId);
  if (!userRole) {
    throw new ApiError(403, "You don't have access to this document");
  }

  // For now, return success without actually deleting comment
  // TODO: Implement comments functionality
  return res.status(200).json(
    new ApiResponse(200, "Comment deleted successfully", {
      commentId,
    })
  );
});

// Update document collaboration settings
export const updateDocumentCollaborationSettings = asyncHandle(async (req, res) => {
  const { documentId } = req.params;
  const { collaborationSettings } = req.body;
  const userId = req.user._id;

  console.log('🔄 Backend updateDocumentCollaborationSettings called:', {
    documentId,
    userId,
    collaborationSettings
  });

  const document = await Document.findOne({
    _id: documentId,
    isDeleted: false,
  });

  if (!document) {
    console.error('❌ Document not found:', documentId);
    throw new ApiError(404, "Document not found");
  }

  // Check permissions (only owner can change collaboration settings)
  if (!document.hasPermission(userId, "owner")) {
    console.error('❌ Permission denied for user:', userId);
    throw new ApiError(403, "You don't have permission to modify collaboration settings");
  }

  // Update collaboration settings
  if (collaborationSettings) {
    document.collaborationSettings = {
      ...document.collaborationSettings,
      ...collaborationSettings
    };
  }

  document.lastModifiedBy = userId;

  console.log('💾 Saving collaboration settings...');
  const updatedDocument = await document.save();
  console.log('✅ Collaboration settings updated successfully');

  return res.status(200).json(
    new ApiResponse(200, "Collaboration settings updated successfully", {
      document: {
        _id: updatedDocument._id,
        collaborationSettings: updatedDocument.collaborationSettings
      },
    })
  );
});

// Get document collaboration settings
export const getDocumentCollaborationSettings = asyncHandle(async (req, res) => {
  const { documentId } = req.params;
  const userId = req.user._id;

  console.log('🔍 Backend getDocumentCollaborationSettings called:', {
    documentId,
    userId
  });

  const document = await Document.findOne({
    _id: documentId,
    isDeleted: false,
  });

  if (!document) {
    console.error('❌ Document not found:', documentId);
    throw new ApiError(404, "Document not found");
  }

  // Check permissions
  if (!document.hasPermission(userId, "viewer")) {
    console.error('❌ Permission denied for user:', userId);
    throw new ApiError(403, "You don't have permission to view this document");
  }

  return res.status(200).json(
    new ApiResponse(200, "Collaboration settings fetched successfully", {
      document: {
        _id: document._id,
        title: document.title,
        collaborationSettings: document.collaborationSettings,
        collaborators: document.collaborators.length,
        maxCollaborators: document.collaborationSettings.maxCollaborators
      },
    })
  );
});

// Get all documents (for admin or public access)
export const getAllDocuments = asyncHandle(async (req, res) => {
  const { type, status, search, owner, page = 1, limit = 10 } = req.query;
  const currentUserId = req.user._id;

  console.log('🔍 Backend getAllDocuments called with:', {
    currentUserId,
    type,
    status,
    search,
    owner,
    page,
    limit
  });

  // Build query - only show documents the user has access to
  let query = {
    isDeleted: false,
    $or: [
      // User is the owner
      { owner: currentUserId },
      // Document is shared and user is a collaborator
      { 
        visibility: "shared",
        "collaborators.user": currentUserId
      },
      // Document is public (if allowAnonymousView is true)
      { 
        visibility: "shared", 
        "collaborationSettings.allowAnonymousView": true 
      }
    ]
  };

  // Filter by document type
  if (type === "own") {
    query = { 
      ...query, 
      $and: [
        { owner: currentUserId }
      ]
    };
  } else if (type === "shared") {
    query = { 
      ...query, 
      $and: [
        { visibility: "shared" },
        { "collaborators.user": currentUserId }
      ]
    };
  } else if (type === "draft") {
    query = { 
      ...query, 
      $and: [
        { status: "draft" },
        { owner: currentUserId } // Only show user's own drafts
      ]
    };
  } else if (type === "public") {
    query = { 
      ...query, 
      $and: [
        { visibility: "shared" }, 
        { "collaborationSettings.allowAnonymousView": true }
      ]
    };
  }

  // Filter by specific owner
  if (owner) {
    query.owner = owner;
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

  console.log('🔧 Final query:', query);

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const documents = await Document.find(query)
    .populate("owner", "name email username avatar")
    .populate("lastModifiedBy", "name email username avatar")
    .populate("collaborators.user", "name email username avatar")
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Document.countDocuments(query);

  console.log('📊 Query Results:', {
    documentsFound: documents.length,
    totalCount: total,
    documents: documents.map(doc => ({
      id: doc._id,
      title: doc.title,
      owner: doc.owner?._id,
      status: doc.status,
      visibility: doc.visibility,
      isDeleted: doc.isDeleted
    }))
  });

  return res.status(200).json(
    new ApiResponse(200, "All documents fetched successfully", {
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

// Download document in different formats
export const downloadDocument = asyncHandle(async (req, res) => {
  const { documentId } = req.params;
  const { format = 'pdf' } = req.query;
  const userId = req.user._id;

  console.log('🔄 Backend downloadDocument called:', {
    documentId,
    format,
    userId
  });

  const document = await Document.findOne({
    _id: documentId,
    isDeleted: false,
  });

  if (!document) {
    console.error('❌ Document not found:', documentId);
    throw new ApiError(404, "Document not found");
  }

  // Check permissions
  if (!document.hasPermission(userId, "viewer")) {
    console.error('❌ Permission denied for user:', userId);
    throw new ApiError(403, "You don't have permission to download this document");
  }

  try {
    let fileContent;
    let contentType;
    let fileName;

    switch (format.toLowerCase()) {
      case 'pdf':
        // For PDF, you would typically use a library like puppeteer or jsPDF
        // For now, we'll return the content as HTML that can be converted to PDF
        fileContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>${document.title}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                h1 { color: #333; border-bottom: 2px solid #333; }
                .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
                .content { line-height: 1.6; }
              </style>
            </head>
            <body>
              <h1>${document.title}</h1>
              <div class="meta">
                Created: ${new Date(document.createdAt).toLocaleDateString()}<br>
                Last Modified: ${new Date(document.updatedAt).toLocaleDateString()}<br>
                Status: ${document.status}
              </div>
              <div class="content">
                ${document.content || 'No content available'}
              </div>
            </body>
          </html>
        `;
        contentType = 'text/html';
        fileName = `${document.title.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
        break;

      case 'txt':
        fileContent = `Title: ${document.title}\n\n${document.content || 'No content available'}`;
        contentType = 'text/plain';
        fileName = `${document.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
        break;

      case 'md':
        fileContent = `# ${document.title}\n\n${document.content || 'No content available'}`;
        contentType = 'text/markdown';
        fileName = `${document.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
        break;

      case 'html':
        fileContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>${document.title}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                h1 { color: #333; }
                .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
                .content { line-height: 1.6; }
              </style>
            </head>
            <body>
              <h1>${document.title}</h1>
              <div class="meta">
                Created: ${new Date(document.createdAt).toLocaleDateString()}<br>
                Last Modified: ${new Date(document.updatedAt).toLocaleDateString()}<br>
                Status: ${document.status}
              </div>
              <div class="content">
                ${document.content || 'No content available'}
              </div>
            </body>
          </html>
        `;
        contentType = 'text/html';
        fileName = `${document.title.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
        break;

      default:
        throw new ApiError(400, "Unsupported format. Supported formats: pdf, txt, md, html");
    }

    console.log('✅ Document download prepared:', {
      format,
      fileName,
      contentType,
      contentLength: fileContent.length
    });

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(fileContent);

  } catch (error) {
    console.error('❌ Download failed:', error);
    throw new ApiError(500, "Failed to generate download file");
  }
});
