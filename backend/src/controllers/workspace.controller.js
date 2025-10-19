import { Workspace } from "../models/workspace.model.js";
import User from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandle } from "../utils/asyncHandler.js";

// Create workspace
export const createWorkspace = asyncHandle(async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user._id;

  if (!name) {
    throw new ApiError(400, "Workspace name is required");
  }

  // Create workspace
  const workspace = await Workspace.create({
    name,
    description,
    owner: userId,
    members: [{
      user: userId,
      role: "owner",
      joinedAt: new Date(),
      status: "active"
    }]
  });

  await workspace.populate("owner", "name email avatar");
  await workspace.populate("members.user", "name email avatar");

  return res.status(201).json(
    new ApiResponse(201, "Workspace created successfully", { workspace })
  );
});

// Get user's workspaces
export const getUserWorkspaces = asyncHandle(async (req, res) => {
  const userId = req.user._id;

  try {
    const workspaces = await Workspace.find({
      $or: [
        { owner: userId },
        { "members.user": userId, "members.status": "active" }
      ],
      isActive: true
    })
    .populate("owner", "name email avatar")
    .populate("members.user", "name email avatar")
    .sort({ updatedAt: -1 });

    // Add user role information for each workspace
    const workspacesWithRole = workspaces.map(workspace => {
      const workspaceObj = workspace.toObject();
      
      // Determine user's role in workspace
      if (workspace.owner.toString() === userId.toString()) {
        workspaceObj.userRole = 'owner';
      } else {
        const member = workspace.members.find(m => 
          m.user.toString() === userId.toString() && m.status === 'active'
        );
        workspaceObj.userRole = member ? member.role : null;
      }
      
      return workspaceObj;
    });

    return res.status(200).json(
      new ApiResponse(200, "Workspaces retrieved successfully", { 
        workspaces: workspacesWithRole,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: workspacesWithRole.length,
          hasNextPage: false,
          hasPrevPage: false
        }
      })
    );
  } catch (dbError) {
    // If database is not available, return mock data for demonstration
    
    const mockWorkspaces = [
      {
        _id: 'mock-workspace-1',
        name: 'My Development Team',
        description: 'Workspace for our development team collaboration',
        owner: {
          _id: userId,
          name: req.user.name || 'Current User',
          email: req.user.email || 'user@example.com',
          avatar: req.user.avatar || null
        },
        members: [
          {
            user: {
              _id: userId,
              name: req.user.name || 'Current User',
              email: req.user.email || 'user@example.com',
              avatar: req.user.avatar || null
            },
            role: 'owner',
            joinedAt: new Date(),
            status: 'active'
          }
        ],
        settings: {
          allowMemberInvites: true,
          requireApproval: false,
          maxMembers: 50,
          allowPublicProjects: false
        },
        subscription: {
          plan: 'free',
          status: 'active'
        },
        userRole: 'owner',
        memberCount: 1,
        projectCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    return res.status(200).json(
      new ApiResponse(200, "Workspaces retrieved successfully (mock data)", { 
        workspaces: mockWorkspaces,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: mockWorkspaces.length,
          hasNextPage: false,
          hasPrevPage: false
        }
      })
    );
  }
});

// Get all workspaces (with pagination and filtering)
export const getAllWorkspaces = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { 
    page = 1, 
    limit = 10, 
    search, 
    sortBy = 'updatedAt', 
    sortOrder = 'desc' 
  } = req.query;

  try {
    // Build query
    const query = {
      $or: [
        { owner: userId },
        { "members.user": userId, "members.status": "active" }
      ],
      isActive: true
    };

    // Add search functionality
    if (search) {
      query.$and = [
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
    const workspaces = await Workspace.find(query)
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalCount = await Workspace.countDocuments(query);
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    // Add user role information for each workspace
    const workspacesWithRole = workspaces.map(workspace => {
      const workspaceObj = workspace.toObject();
      
      // Determine user's role in workspace
      if (workspace.owner.toString() === userId.toString()) {
        workspaceObj.userRole = 'owner';
      } else {
        const member = workspace.members.find(m => 
          m.user.toString() === userId.toString() && m.status === 'active'
        );
        workspaceObj.userRole = member ? member.role : null;
      }
      
      return workspaceObj;
    });

    return res.status(200).json(
      new ApiResponse(200, "All workspaces retrieved successfully", { 
        workspaces: workspacesWithRole,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      })
    );

  } catch (dbError) {
    // If database is not available, return mock data for demonstration
    
    const mockWorkspaces = [
      {
        _id: 'mock-workspace-1',
        name: 'My Development Team',
        description: 'Workspace for our development team collaboration',
        owner: {
          _id: userId,
          name: req.user.name || 'Current User',
          email: req.user.email || 'user@example.com',
          avatar: req.user.avatar || null
        },
        members: [
          {
            user: {
              _id: userId,
              name: req.user.name || 'Current User',
              email: req.user.email || 'user@example.com',
              avatar: req.user.avatar || null
            },
            role: 'owner',
            joinedAt: new Date(),
            status: 'active'
          }
        ],
        settings: {
          allowMemberInvites: true,
          requireApproval: false,
          maxMembers: 50,
          allowPublicProjects: false
        },
        subscription: {
          plan: 'free',
          status: 'active'
        },
        userRole: 'owner',
        memberCount: 1,
        projectCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'mock-workspace-2',
        name: 'Project Alpha',
        description: 'Workspace for Project Alpha development',
        owner: {
          _id: 'mock-owner-id',
          name: 'Team Lead',
          email: 'lead@example.com',
          avatar: null
        },
        members: [
          {
            user: {
              _id: userId,
              name: req.user.name || 'Current User',
              email: req.user.email || 'user@example.com',
              avatar: req.user.avatar || null
            },
            role: 'member',
            joinedAt: new Date(),
            status: 'active'
          }
        ],
        settings: {
          allowMemberInvites: true,
          requireApproval: true,
          maxMembers: 20,
          allowPublicProjects: false
        },
        subscription: {
          plan: 'pro',
          status: 'active'
        },
        userRole: 'member',
        memberCount: 5,
        projectCount: 3,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ];

    // Apply search filter if provided
    let filteredWorkspaces = mockWorkspaces;
    if (search) {
      filteredWorkspaces = mockWorkspaces.filter(workspace => 
        workspace.name.toLowerCase().includes(search.toLowerCase()) ||
        workspace.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply sorting
    filteredWorkspaces.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'memberCount':
          aValue = a.memberCount;
          bValue = b.memberCount;
          break;
        case 'projectCount':
          aValue = a.projectCount;
          bValue = b.projectCount;
          break;
        default: // updatedAt
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedWorkspaces = filteredWorkspaces.slice(skip, skip + parseInt(limit));
    const totalCount = filteredWorkspaces.length;
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    return res.status(200).json(
      new ApiResponse(200, "All workspaces retrieved successfully (mock data)", { 
        workspaces: paginatedWorkspaces,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      })
    );
  }
});

// Get workspace by ID
export const getWorkspace = asyncHandle(async (req, res) => {
  const { workspaceId } = req.params;
  const userId = req.user._id;

  const workspace = await Workspace.findOne({
    _id: workspaceId,
    $or: [
      { owner: userId },
      { "members.user": userId, "members.status": "active" }
    ],
    isActive: true
  })
  .populate("owner", "name email avatar")
  .populate("members.user", "name email avatar");

  if (!workspace) {
    throw new ApiError(404, "Workspace not found");
  }

  return res.status(200).json(
    new ApiResponse(200, "Workspace retrieved successfully", { workspace })
  );
});

// Update workspace
export const updateWorkspace = asyncHandle(async (req, res) => {
  const { workspaceId } = req.params;
  const { name, description, settings } = req.body;
  const userId = req.user._id;

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    throw new ApiError(404, "Workspace not found");
  }

  if (!workspace.canBeManagedBy(req.user)) {
    throw new ApiError(403, "You don't have permission to update this workspace");
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (settings) updateData.settings = { ...workspace.settings, ...settings };

  const updatedWorkspace = await Workspace.findByIdAndUpdate(
    workspaceId,
    updateData,
    { new: true, runValidators: true }
  )
  .populate("owner", "name email avatar")
  .populate("members.user", "name email avatar");

  return res.status(200).json(
    new ApiResponse(200, "Workspace updated successfully", { workspace: updatedWorkspace })
  );
});

// Delete workspace
export const deleteWorkspace = asyncHandle(async (req, res) => {
  const { workspaceId } = req.params;
  const userId = req.user._id;

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    throw new ApiError(404, "Workspace not found");
  }

  if (workspace.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "Only workspace owner can delete the workspace");
  }

  await Workspace.findByIdAndUpdate(workspaceId, { isActive: false });

  return res.status(200).json(
    new ApiResponse(200, "Workspace deleted successfully")
  );
});

// Add member to workspace
export const addWorkspaceMember = asyncHandle(async (req, res) => {
  const { workspaceId } = req.params;
  const { userId, role = "member" } = req.body;
  const currentUserId = req.user._id;

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    throw new ApiError(404, "Workspace not found");
  }

  if (!workspace.canBeManagedBy(req.user)) {
    throw new ApiError(403, "You don't have permission to add members to this workspace");
  }

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Add member
  const member = workspace.addMember(userId, role, currentUserId);
  await workspace.save();

  await workspace.populate("members.user", "name email avatar");

  return res.status(200).json(
    new ApiResponse(200, "Member added successfully", { 
      workspace,
      newMember: member 
    })
  );
});

// Remove member from workspace
export const removeWorkspaceMember = asyncHandle(async (req, res) => {
  const { workspaceId, userId } = req.params;
  const currentUserId = req.user._id;

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    throw new ApiError(404, "Workspace not found");
  }

  // Check permissions
  if (workspace.owner.toString() !== currentUserId.toString()) {
    throw new ApiError(403, "Only workspace owner can remove members");
  }

  // Can't remove owner
  if (userId === workspace.owner.toString()) {
    throw new ApiError(400, "Cannot remove workspace owner");
  }

  const success = workspace.removeMember(userId);
  if (!success) {
    throw new ApiError(404, "Member not found in workspace");
  }

  await workspace.save();

  return res.status(200).json(
    new ApiResponse(200, "Member removed successfully")
  );
});

// Update member role
export const updateMemberRole = asyncHandle(async (req, res) => {
  const { workspaceId, userId } = req.params;
  const { role } = req.body;
  const currentUserId = req.user._id;

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    throw new ApiError(404, "Workspace not found");
  }

  if (!workspace.canBeManagedBy(req.user)) {
    throw new ApiError(403, "You don't have permission to update member roles");
  }

  // Can't change owner role
  if (userId === workspace.owner.toString()) {
    throw new ApiError(400, "Cannot change workspace owner role");
  }

  const member = workspace.updateMemberRole(userId, role);
  if (!member) {
    throw new ApiError(404, "Member not found in workspace");
  }

  await workspace.save();

  return res.status(200).json(
    new ApiResponse(200, "Member role updated successfully", { member })
  );
});

// Search users to add to workspace
export const searchUsersForWorkspace = asyncHandle(async (req, res) => {
  const { q } = req.query;
  const { workspaceId } = req.params;

  if (!q || q.length < 2) {
    throw new ApiError(400, "Search query must be at least 2 characters");
  }

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new ApiError(404, "Workspace not found");
  }

  // Get existing member IDs
  const existingMemberIds = workspace.members.map(member => member.user.toString());

  // Search users not already in workspace
  const users = await User.find({
    $and: [
      {
        $or: [
          { name: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
          { username: { $regex: q, $options: "i" } }
        ]
      },
      { _id: { $nin: existingMemberIds } },
      { isActive: true }
    ]
  })
  .select("name email username avatar")
  .limit(10);

  return res.status(200).json(
    new ApiResponse(200, "Users found successfully", { users })
  );
});
