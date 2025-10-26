import { asyncHandle } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Project } from "../models/project.model.js";
import { Workspace } from "../models/workspace.model.js";
import User from "../models/user.model.js";
import { Task } from "../models/task.model.js";
import { Meeting } from "../models/meeting.model.js";
import { uploadOnCloudinary } from "../utils/uploadOnCloudinary.js";
import mongoose from "mongoose";

// Create project in workspace
export const createProject = asyncHandle(async (req, res) => {
  const { workspaceId } = req.params;
  const userId = req.user._id;
  
  const {
    name,
    description,
    startDate,
    endDate,
    budget,
    tags,
    priority
  } = req.body;

  // Validate required fields
  if (!name || !startDate || !endDate) {
    throw new ApiError(400, "Name, start date, and end date are required");
  }

  // Check if workspace exists and user has access
  const workspace = await Workspace.findOne({
    _id: workspaceId,
    $or: [
      { owner: userId },
      { "members.user": userId, "members.status": "active" }
    ],
    isActive: true
  }).populate("members.user", "name email");

  if (!workspace) {
    throw new ApiError(404, "Workspace not found or access denied");
  }

  // Check user role and permissions
  let userRole = 'member';
  
  // Check if user is owner
  if (workspace.owner && workspace.owner.toString() === userId.toString()) {
    userRole = 'owner';
  } else {
    // Check workspace members
    const member = workspace.members.find(
      m => m.user && m.user._id.toString() === userId.toString()
    );
    if (member) {
      userRole = member.role;
    }
  }

  // Check if user has permission to create projects
  // Only owner, admin, member, hr, and mr can create projects
  const allowedRoles = ['owner', 'admin', 'member', 'hr', 'mr'];
  if (!allowedRoles.includes(userRole)) {
    throw new ApiError(403, "You don't have permission to create projects in this workspace");
  }

  // Create project with user as owner
  const project = await Project.create({
    name,
    description,
    workspace: workspaceId,
    projectManager: userId,
    team: [{
      user: userId,
      role: "owner",
      joinedAt: new Date(),
      status: "active"
    }],
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    budget: budget || { allocated: 0, spent: 0, currency: "USD" },
    tags: tags || [],
    priority: priority || "medium"
  });

  await project.populate([
    { path: "projectManager", select: "name email avatar" },
    { path: "team.user", select: "name email avatar" },
    { path: "workspace", select: "name" }
  ]);

  return res.status(201).json(
    new ApiResponse(201, "Project created successfully", { project })
  );
});

// Get projects in workspace
export const getWorkspaceProjects = asyncHandle(async (req, res) => {
  const { workspaceId } = req.params;
  const userId = req.user._id;

  try {
    // Check if workspace exists and user has access
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      $or: [
        { owner: userId },
        { "members.user": userId, "members.status": "active" }
      ],
      isActive: true
    });

    if (!workspace) {
      throw new ApiError(404, "Workspace not found or access denied");
    }

    const { page = 1, limit = 10, status, priority, search } = req.query;

    // Build filter
    const filter = { workspace: workspaceId };

    // Add role-based filtering
    const isOwner = workspace.owner.toString() === userId.toString();
    const userMember = workspace.members.find(member => 
      member.user.toString() === userId.toString() && member.status === "active"
    );

    console.log('🔍 Get Workspace Projects Debug:');
    console.log('  - Workspace ID:', workspaceId);
    console.log('  - User ID:', userId.toString());
    console.log('  - Is Owner:', isOwner);
    console.log('  - User Member:', userMember ? `Role: ${userMember.role}` : 'Not a member');

    // Only regular members (not owner, not admin) see filtered projects
    if (!isOwner && userMember && userMember.role === "member") {
      // Regular members can only see projects they're part of
      filter["team.user"] = userId;
      console.log('  - Filter applied: Only showing projects where user is team member');
    } else {
      console.log('  - Filter: Showing all workspace projects (owner/admin access)');
    }
    // Owner and admin can see all projects in the workspace

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    const projects = await Project.find(filter)
      .populate("projectManager", "name email avatar")
      .populate("team.user", "name email avatar")
      .populate({
        path: "workspace",
        select: "name",
        options: { lean: true }
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Project.countDocuments(filter);

    console.log('  - Projects found:', total);
    console.log('  - Filter used:', JSON.stringify(filter));

    return res.status(200).json(
      new ApiResponse(200, "Projects retrieved successfully", {
        projects,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      })
    );
  } catch (error) {
    throw error;
  }
});

// Get all projects for user (across all workspaces)
export const getAllProjects = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { 
    page = 1, 
    limit = 10, 
    search, 
    sortBy = 'createdAt', 
    sortOrder = 'desc',
    status,
    priority
  } = req.query;

  // Build base filter - user must be part of the project team or workspace owner
  const filter = {
    $or: [
      { "team.user": userId, "team.status": "active" },
      { projectManager: userId }
    ],
    isActive: true
  };

  // Add additional filters
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (search) {
    filter.$and = [
      {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } }
        ]
      }
    ];
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const projects = await Project.find(filter)
    .populate("projectManager", "name email avatar")
    .populate("team.user", "name email avatar")
         .populate({
           path: "workspace",
           select: "name description",
           options: { lean: true }
         })
    .sort(sortOptions)
    .skip(skip)
    .limit(parseInt(limit));

  // Get total count for pagination
  const totalCount = await Project.countDocuments(filter);
  const totalPages = Math.ceil(totalCount / parseInt(limit));

  // Add user role information for each project
  const projectsWithRole = projects.map(project => {
    const projectObj = project.toObject();
    
    // Determine user's role in project
    if (project.projectManager.toString() === userId.toString()) {
      projectObj.userRole = 'manager';
    } else {
      const teamMember = project.team.find(member => 
        member.user.toString() === userId.toString() && member.status === 'active'
      );
      projectObj.userRole = teamMember ? teamMember.role : null;
    }
    
    return projectObj;
  });

  return res.status(200).json(
    new ApiResponse(200, "All projects retrieved successfully", { 
      projects: projectsWithRole,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    })
  );
});

// Get single project
export const getProject = asyncHandle(async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user._id;

  const project = await Project.findById(projectId)
    .populate("projectManager", "name email avatar")
    .populate("team.user", "name email avatar")
    .populate({
      path: "workspace",
      select: "name",
      options: { lean: true }
    });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Check if user has access to this project
  const teamMember = project.team.find(member => 
    member.user.toString() === userId.toString() && member.status === "active"
  );

  // If user is not a direct team member, check if they're a workspace member
  if (!teamMember) {
    const workspace = await Workspace.findById(project.workspace);
    if (!workspace) {
      throw new ApiError(404, "Workspace not found");
    }

    const workspaceMember = workspace.members.find(member => 
      member.user.toString() === userId.toString() && member.status === "active"
    );

    if (!workspaceMember && workspace.owner.toString() !== userId.toString()) {
      throw new ApiError(403, "You don't have access to this project");
    }
  }

  // Get project statistics
  const taskCount = await Task.countDocuments({ project: projectId });
  const completedTaskCount = await Task.countDocuments({ 
    project: projectId, 
    status: "completed" 
  });
  const meetingCount = await Meeting.countDocuments({ project: projectId });

  const projectWithStats = {
    ...project.toObject(),
    taskCount,
    completedTaskCount,
    meetingCount
  };

  // Debug: Log documents
  return res.status(200).json(
    new ApiResponse(200, "Project retrieved successfully", { project: projectWithStats })
  );
});

// Update project
export const updateProject = asyncHandle(async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user._id;

  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Check if user can manage this project
  if (!project.canBeManagedBy(req.user)) {
    throw new ApiError(403, "You don't have permission to update this project");
  }

  const {
    name,
    description,
    startDate,
    endDate,
    budget,
    tags,
    priority,
    status,
    documents
  } = req.body;

  const updateData = {};
  if (name) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (startDate) updateData.startDate = new Date(startDate);
  if (endDate) updateData.endDate = new Date(endDate);
  if (budget) updateData.budget = budget;
  if (tags) updateData.tags = tags;
  if (priority) updateData.priority = priority;
  if (status) updateData.status = status;
  if (documents !== undefined) updateData.documents = documents;

  const updatedProject = await Project.findByIdAndUpdate(
    projectId,
    updateData,
    { new: true, runValidators: true }
  ).populate([
    { path: "projectManager", select: "name email avatar" },
    { path: "team.user", select: "name email avatar" },
    { path: "workspace", select: "name" }
  ]);

  // Debug: Log documents
  return res.status(200).json(
    new ApiResponse(200, "Project updated successfully", { project: updatedProject })
  );
});

// Delete project
export const deleteProject = asyncHandle(async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user._id;

  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Check if user can delete this project
  if (!project.canBeDeletedBy(req.user)) {
    throw new ApiError(403, "You don't have permission to delete this project");
  }

  // Delete related tasks and meetings
  await Promise.all([
    Task.deleteMany({ project: projectId }),
    Meeting.deleteMany({ project: projectId }),
    Project.findByIdAndDelete(projectId)
  ]);

  return res.status(200).json(
    new ApiResponse(200, "Project deleted successfully")
  );
});

// Add project member
export const addProjectMember = asyncHandle(async (req, res) => {
  const { projectId } = req.params;
  const { userId: memberId, role = "employee" } = req.body;
  const currentUserId = req.user._id;

  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Check if user can manage this project
  if (!project.canBeManagedBy(req.user)) {
    throw new ApiError(403, "You don't have permission to add members to this project");
  }

  // Check if user exists and is in the same workspace
  const workspace = await Workspace.findById(project.workspace);
  const isWorkspaceMember = workspace.members.some(member => 
    member.user.toString() === memberId && member.status === "active"
  );

  if (!isWorkspaceMember) {
    throw new ApiError(400, "User must be a member of the workspace to join the project");
  }

  // Add team member
  const member = project.addTeamMember(memberId, role, currentUserId);
  await project.save();

  await project.populate([
    { path: "projectManager", select: "name email avatar" },
    { path: "team.user", select: "name email avatar" },
    { path: "workspace", select: "name" }
  ]);

  return res.status(200).json(
    new ApiResponse(200, "Member added successfully", { project, newMember: member })
  );
});

// Remove project member
export const removeProjectMember = asyncHandle(async (req, res) => {
  const { projectId, userId } = req.params;
  const currentUserId = req.user._id;

  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Check if user can manage this project
  if (!project.canBeManagedBy(req.user)) {
    throw new ApiError(403, "You don't have permission to remove members from this project");
  }

  // Check if user can remove members (only Owner and HR)
  if (!project.canRemoveMembers(req.user)) {
    throw new ApiError(403, "Only project owner and HR can remove members");
  }

  // Can't remove owner
  const teamMember = project.team.find(member => 
    member.user.toString() === userId && member.status === "active"
  );

  if (teamMember && teamMember.role === "owner") {
    throw new ApiError(400, "Cannot remove project owner");
  }

  const success = project.removeTeamMember(userId);
  if (!success) {
    throw new ApiError(404, "Member not found in project");
  }

  await project.save();

  return res.status(200).json(
    new ApiResponse(200, "Member removed successfully")
  );
});

// Update member role
export const updateMemberRole = asyncHandle(async (req, res) => {
  const { projectId, userId } = req.params;
  const { role } = req.body;
  const currentUserId = req.user._id;

  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Check if user can manage this project
  if (!project.canBeManagedBy(req.user)) {
    throw new ApiError(403, "You don't have permission to update member roles");
  }

  // Can't change owner role
  const teamMember = project.team.find(member => 
    member.user.toString() === userId && member.status === "active"
  );

  if (teamMember && teamMember.role === "owner") {
    throw new ApiError(400, "Cannot change project owner role");
  }

  // Update role
  if (teamMember) {
    teamMember.role = role;
    await project.save();
  } else {
    throw new ApiError(404, "Member not found in project");
  }

  return res.status(200).json(
    new ApiResponse(200, "Member role updated successfully", { member: teamMember })
  );
});

// Search workspace members for project
export const searchWorkspaceMembers = asyncHandle(async (req, res) => {
  const { projectId } = req.params;
  const { q } = req.query;

  if (!q || q.length < 2) {
    throw new ApiError(400, "Search query must be at least 2 characters");
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Get workspace members
  const workspace = await Workspace.findById(project.workspace)
    .populate("members.user", "name email avatar");

  if (!workspace) {
    throw new ApiError(404, "Workspace not found");
  }

  // Get existing project member IDs
  const existingMemberIds = project.team.map(member => member.user.toString());

  // Filter workspace members not already in project
  const availableMembers = workspace.members
    .filter(member => 
      member.status === "active" && 
      !existingMemberIds.includes(member.user._id.toString()) &&
      (member.user.name.toLowerCase().includes(q.toLowerCase()) ||
       member.user.email.toLowerCase().includes(q.toLowerCase()))
    )
    .map(member => member.user)
    .slice(0, 10);

  return res.status(200).json(
    new ApiResponse(200, "Members found successfully", { members: availableMembers })
  );
});

// Upload document to project
export const uploadDocument = asyncHandle(async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user._id;

  if (!req.file) {
    throw new ApiError(400, "File is required");
  }

  // Check if project exists and user has access
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Check if user is a team member
  const teamMember = project.team.find(member => 
    member.user.toString() === userId.toString() && member.status === "active"
  );

  if (!teamMember) {
    throw new ApiError(403, "You don't have access to this project");
  }

  try {
    // Upload file to Cloudinary
    const fileLocalPath = req.file.path;
    const cloudinaryResponse = await uploadOnCloudinary(fileLocalPath);

    if (!cloudinaryResponse) {
      throw new ApiError(500, "Failed to upload file");
    }

    // Return the document URL
    return res.status(200).json(
      new ApiResponse(200, "File uploaded successfully", {
        documentUrl: cloudinaryResponse.url
      })
    );
  } catch (error) {
    throw new ApiError(500, "Failed to upload file: " + error.message);
  }
});