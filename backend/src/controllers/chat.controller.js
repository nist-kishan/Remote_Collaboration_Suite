import Chat from '../models/chat.model.js';
import Message from '../models/Message.model.js';
import User from '../models/user.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandle } from '../utils/asyncHandler.js';

// Get all chats for a user with pagination and filtering
export const getUserChats = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, search, type } = req.query;
  
  // Build query - exclude chats that are hidden or deleted for this user
  let query = {
    'participants.user': userId,
    isArchived: false,
    $or: [
      // Chat is not hidden or deleted for this user
      { [`userVisibility.${userId}.isHidden`]: { $ne: true } },
      { [`userVisibility.${userId}.isDeleted`]: { $ne: true } },
      // Or userVisibility doesn't exist for this user yet (new chats)
      { [`userVisibility.${userId}`]: { $exists: false } }
    ]
  };

  // Add type filter (one-to-one, group, or all)
  if (type && (type === 'one-to-one' || type === 'group')) {
    query.type = type;
  }

  // Add search functionality
  if (search && search.trim()) {
    if (type === 'group') {
      // For group chats, search in name and description
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    } else if (type === 'one-to-one') {
      // For one-to-one chats, search in participant names
      query.$or = [
        { 'participants.user.name': { $regex: search.trim(), $options: 'i' } },
        { 'participants.user.email': { $regex: search.trim(), $options: 'i' } }
      ];
    } else {
      // For all chats, search in both group names and participant names
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { 'participants.user.name': { $regex: search.trim(), $options: 'i' } },
        { 'participants.user.email': { $regex: search.trim(), $options: 'i' } }
      ];
    }
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  try {
    const chats = await Chat.find(query)
      .populate('participants.user', 'name email avatar isOnline lastSeen')
      .populate('lastMessage')
      .populate('createdBy', 'name avatar')
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Chat.countDocuments(query);

    // Filter out chats with null participants (corrupted data)
    const validChats = chats.filter(chat => 
      chat.participants.every(p => p.user !== null && p.user !== undefined)
    );

    // Determine response data structure based on type
    const responseData = type === 'group' 
      ? { groupChats: validChats }
      : type === 'one-to-one'
      ? { oneToOneChats: validChats }
      : { chats: validChats };

    return res.status(200).json(
      new ApiResponse(200, `${type ? type.charAt(0).toUpperCase() + type.slice(1) : 'All'} chats fetched successfully`, { 
        ...responseData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: validChats.length,
          pages: Math.ceil(validChats.length / parseInt(limit))
        }
      })
    );
  } catch (error) {
    throw new ApiError(500, 'Failed to fetch chats: ' + error.message);
  }
});

// Legacy endpoint for backward compatibility
export const getUserGroupChats = asyncHandle(async (req, res) => {
  // Redirect to the main getUserChats with type=group
  req.query.type = 'group';
  return getUserChats(req, res);
});

// Get single chat by ID
export const getChatById = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { chatId } = req.params;

  const chat = await Chat.findOne({
    _id: chatId,
    'participants.user': userId // Ensure user is a participant
  })
    .populate('participants.user', 'name email avatar')
    .populate('lastMessage')
    .populate('createdBy', 'name avatar');

  if (!chat) {
    return res.status(404).json(
      new ApiResponse(404, 'Chat not found or access denied')
    );
  }

  return res.status(200).json(
    new ApiResponse(200, 'Chat fetched successfully', { chat })
  );
});

// Get or create one-to-one chat
export const getOrCreateOneToOneChat = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { otherUserId } = req.params;
  
  // Validate otherUserId
  if (!otherUserId || otherUserId === userId) {
    throw new ApiError(400, 'Invalid user ID provided');
  }
  
  // Check if the other user exists
  const otherUser = await User.findById(otherUserId);
  if (!otherUser) {
    throw new ApiError(404, 'User not found');
  }
  

  // Check if chat already exists
  let chat = await Chat.findOne({
    type: 'one-to-one',
    $and: [
      { 'participants.user': userId },
      { 'participants.user': otherUserId }
    ]
  })
    .populate('participants.user', 'name email avatar')
    .populate('lastMessage');

  if (!chat) {
    
    // Create new one-to-one chat
    try {
      chat = await Chat.create({
        type: 'one-to-one',
        participants: [
          { user: userId, role: 'member' },
          { user: otherUserId, role: 'member' }
        ],
        createdBy: userId
      });

      await chat.populate('participants.user', 'name email avatar');
    } catch (error) {
      throw new ApiError(500, 'Failed to create chat: ' + error.message);
    }
  }

  return res.status(200).json(
    new ApiResponse(200, 'Chat fetched successfully', { chat })
  );
});

// Create group chat
export const createGroupChat = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { name, description, participantIds } = req.body;

  if (!name || !participantIds || participantIds.length < 2) {
    throw new ApiError(400, 'Group name and at least 2 participants are required');
  }

  // Add creator to participants
  const participants = [
    { user: userId, role: 'owner' },
    ...participantIds.map(id => ({ user: id, role: 'member' }))
  ];

  const chat = await Chat.create({
    type: 'group',
    name,
    description,
    participants,
    createdBy: userId
  });

  await chat.populate('participants.user', 'name email avatar');
  await chat.populate('createdBy', 'name avatar');

  return res.status(201).json(
    new ApiResponse(201, 'Group chat created successfully', { chat })
  );
});

// Update group chat
export const updateGroupChat = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { chatId } = req.params;
  const { name, description, avatar } = req.body;

  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw new ApiError(404, 'Chat not found');
  }

  // Check if user is owner or admin
  const participant = chat.participants.find(
    p => p.user.toString() === userId.toString()
  );

  if (!participant || !['owner', 'admin'].includes(participant.role)) {
    throw new ApiError(403, 'Only owner or admin can update group');
  }

  if (name) chat.name = name;
  if (description) chat.description = description;
  if (avatar) chat.avatar = avatar;

  await chat.save();
  await chat.populate('participants.user', 'name email avatar');

  return res.status(200).json(
    new ApiResponse(200, 'Group chat updated successfully', { chat })
  );
});

// Archive chat
export const archiveChat = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw new ApiError(404, 'Chat not found');
  }

  chat.isArchived = true;
  await chat.save();

  return res.status(200).json(
    new ApiResponse(200, 'Chat archived successfully', { chat })
  );
});

// Unarchive chat
export const unarchiveChat = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw new ApiError(404, 'Chat not found');
  }

  chat.isArchived = false;
  await chat.save();

  return res.status(200).json(
    new ApiResponse(200, 'Chat unarchived successfully', { chat })
  );
});

// Get group members with their roles
export const getGroupMembers = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { chatId } = req.params;

  const chat = await Chat.findOne({
    _id: chatId,
    type: 'group',
    'participants.user': userId
  })
    .populate('participants.user', 'name email avatar')
    .populate('createdBy', 'name avatar');

  if (!chat) {
    throw new ApiError(404, 'Group chat not found or access denied');
  }

  // Check if user is admin or owner
  const userParticipant = chat.participants.find(p => p.user._id.toString() === userId.toString());
  const isAdmin = userParticipant?.role === 'admin' || userParticipant?.role === 'owner';

  return res.status(200).json(
    new ApiResponse(200, 'Group members fetched successfully', {
      members: chat.participants,
      createdBy: chat.createdBy,
      isAdmin,
      userRole: userParticipant?.role
    })
  );
});

// Add members to group (admin/owner only)
export const addGroupMembers = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { chatId } = req.params;
  const { memberIds } = req.body;

  if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
    throw new ApiError(400, 'Member IDs are required');
  }

  const chat = await Chat.findOne({
    _id: chatId,
    type: 'group',
    'participants.user': userId
  });

  if (!chat) {
    throw new ApiError(404, 'Group chat not found or access denied');
  }

  // Check if user is admin or owner
  const userParticipant = chat.participants.find(p => p.user._id.toString() === userId.toString());
  if (userParticipant?.role !== 'admin' && userParticipant?.role !== 'owner') {
    throw new ApiError(403, 'Only group admins can add members');
  }

  // Check if members already exist
  const existingMemberIds = chat.participants.map(p => p.user.toString());
  const newMemberIds = memberIds.filter(id => !existingMemberIds.includes(id));

  if (newMemberIds.length === 0) {
    throw new ApiError(400, 'All selected users are already members');
  }

  // Add new members
  const newMembers = newMemberIds.map(id => ({
    user: id,
    role: 'member',
    joinedAt: new Date(),
    lastSeen: new Date()
  }));

  chat.participants.push(...newMembers);
  await chat.save();

  // Populate the updated chat
  await chat.populate('participants.user', 'name email avatar');

  return res.status(200).json(
    new ApiResponse(200, 'Members added successfully', {
      chat,
      addedCount: newMembers.length
    })
  );
});

// Remove member from group (admin/owner only)
export const removeGroupMember = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { chatId, memberId } = req.params;

  const chat = await Chat.findOne({
    _id: chatId,
    type: 'group',
    'participants.user': userId
  });

  if (!chat) {
    throw new ApiError(404, 'Group chat not found or access denied');
  }

  // Check if user is admin or owner
  const userParticipant = chat.participants.find(p => p.user._id.toString() === userId.toString());
  if (userParticipant?.role !== 'admin' && userParticipant?.role !== 'owner') {
    throw new ApiError(403, 'Only group admins can remove members');
  }

  // Check if trying to remove owner
  const memberToRemove = chat.participants.find(p => p.user.toString() === memberId);
  if (memberToRemove?.role === 'owner') {
    throw new ApiError(400, 'Cannot remove group owner');
  }

  // Check if trying to remove yourself (only if you're not owner)
  if (memberId === userId.toString() && userParticipant?.role !== 'owner') {
    throw new ApiError(400, 'Use leave group instead of remove member');
  }

  // Remove member
  chat.participants = chat.participants.filter(p => p.user.toString() !== memberId);
  await chat.save();

  // Populate the updated chat
  await chat.populate('participants.user', 'name email avatar');

  return res.status(200).json(
    new ApiResponse(200, 'Member removed successfully', { chat })
  );
});

// Update member role (owner only)
export const updateMemberRole = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { chatId, memberId } = req.params;
  const { role } = req.body;

  if (!role || !['member', 'admin'].includes(role)) {
    throw new ApiError(400, 'Valid role (member or admin) is required');
  }

  const chat = await Chat.findOne({
    _id: chatId,
    type: 'group',
    'participants.user': userId
  });

  if (!chat) {
    throw new ApiError(404, 'Group chat not found or access denied');
  }

  // Check if user is owner
  const userParticipant = chat.participants.find(p => p.user._id.toString() === userId.toString());
  if (userParticipant?.role !== 'owner') {
    throw new ApiError(403, 'Only group owner can change member roles');
  }

  // Check if trying to change owner's role
  if (memberId === userId.toString()) {
    throw new ApiError(400, 'Cannot change owner role');
  }

  // Update member role
  const memberToUpdate = chat.participants.find(p => p.user.toString() === memberId);
  if (!memberToUpdate) {
    throw new ApiError(404, 'Member not found in group');
  }

  memberToUpdate.role = role;
  await chat.save();

  // Populate the updated chat
  await chat.populate('participants.user', 'name email avatar');

  return res.status(200).json(
    new ApiResponse(200, 'Member role updated successfully', { chat })
  );
});

// Leave group
export const leaveGroup = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { chatId } = req.params;

  const chat = await Chat.findOne({
    _id: chatId,
    type: 'group',
    'participants.user': userId
  });

  if (!chat) {
    throw new ApiError(404, 'Group chat not found or access denied');
  }

  // Check if user is owner
  const userParticipant = chat.participants.find(p => p.user._id.toString() === userId.toString());
  if (userParticipant?.role === 'owner') {
    throw new ApiError(400, 'Group owner cannot leave. Transfer ownership or delete group instead.');
  }

  // Remove user from participants
  chat.participants = chat.participants.filter(p => p.user.toString() !== userId.toString());
  await chat.save();

  return res.status(200).json(
    new ApiResponse(200, 'Left group successfully', { chat })
  );
});

// Get all users the current user has chatted with
export const getChattedUsers = asyncHandle(async (req, res) => {
  try {
    const userId = req.user?._id;
    const { page = 1, limit = 50, search } = req.query;

    // Validate user
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        data: null
      });
    }

    // Get all chats where the user is a participant
    const chats = await Chat.find({
      'participants.user': userId,
      isArchived: false
    })
    .populate('participants.user', 'name email avatar isOnline lastSeen')
    .populate('lastMessage')
    .select('participants type name lastMessageAt updatedAt lastMessage')
    .sort({ updatedAt: -1 });

    // Separate one-to-one chats and group chats
    const oneToOneChats = chats.filter(chat => chat.type === 'one-to-one');
    const groupChats = chats.filter(chat => chat.type === 'group');

    // Extract unique users from one-to-one chats
    const chattedUsers = new Map();
    
    oneToOneChats.forEach(chat => {
      if (chat.participants && Array.isArray(chat.participants)) {
        chat.participants.forEach(participant => {
          const user = participant.user;
          if (user && user._id.toString() !== userId.toString()) {
            const userIdStr = user._id.toString();
            
            if (!chattedUsers.has(userIdStr)) {
              chattedUsers.set(userIdStr, {
                user: user,
                lastChatAt: chat.updatedAt || chat.lastMessageAt,
                chatCount: 0,
                lastMessage: chat.lastMessage,
                type: 'one-to-one'
              });
            }
            
            const existing = chattedUsers.get(userIdStr);
            existing.chatCount += 1;
            
            // Update last chat time if this chat is more recent
            if (chat.updatedAt && (!existing.lastChatAt || chat.updatedAt > existing.lastChatAt)) {
              existing.lastChatAt = chat.updatedAt;
            }
            if (chat.lastMessageAt && (!existing.lastChatAt || chat.lastMessageAt > existing.lastChatAt)) {
              existing.lastChatAt = chat.lastMessageAt;
            }
          }
        });
      }
    });

    // Convert group chats to the same format
    const groupChatsFormatted = groupChats.map(chat => ({
      group: {
        _id: chat._id,
        name: chat.name,
        type: 'group',
        participants: chat.participants,
        memberCount: chat.participants.length
      },
      lastChatAt: chat.updatedAt || chat.lastMessageAt,
      chatCount: 1,
      lastMessage: chat.lastMessage,
      type: 'group'
    }));

    // Combine users and groups
    const usersArray = Array.from(chattedUsers.values());
    const allItems = [...usersArray, ...groupChatsFormatted]
      .sort((a, b) => new Date(b.lastChatAt) - new Date(a.lastChatAt));

    // Apply search filter if provided
    let filteredItems = allItems;
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      filteredItems = allItems.filter(item => {
        if (item.type === 'one-to-one') {
          return item.user.name?.toLowerCase().includes(searchTerm) ||
                 item.user.email?.toLowerCase().includes(searchTerm);
        } else if (item.type === 'group') {
          return item.group.name?.toLowerCase().includes(searchTerm);
        }
        return false;
      });
    }

    // Apply pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedItems = filteredItems.slice(skip, skip + parseInt(limit));

    const response = {
      items: paginatedItems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredItems.length,
        pages: Math.ceil(filteredItems.length / parseInt(limit))
      }
    };

    return res.status(200).json(
      new ApiResponse(200, 'Chatted users and groups fetched successfully', response)
    );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch chatted users and groups: ' + error.message,
      data: null
    });
  }
});

// Soft archive chat for a specific user (user-specific archive)
export const archiveChatForUser = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw new ApiError(404, 'Chat not found');
  }

  // Check if user is a participant in the chat
  const isParticipant = chat.participants.some(
    p => p.user && p.user._id.toString() === userId.toString()
  );

  if (!isParticipant) {
    throw new ApiError(403, 'You are not a participant in this chat');
  }

  // Set user-specific archive status
  if (!chat.userVisibility) {
    chat.userVisibility = new Map();
  }
  
  chat.userVisibility.set(userId.toString(), {
    ...chat.userVisibility.get(userId.toString()) || {},
    isArchived: true,
    archivedAt: new Date()
  });

  await chat.save();

  return res.status(200).json(
    new ApiResponse(200, 'Chat archived successfully', { chatId })
  );
});

// Soft unarchive chat for a specific user
export const unarchiveChatForUser = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw new ApiError(404, 'Chat not found');
  }

  // Check if user is a participant in the chat
  const isParticipant = chat.participants.some(
    p => p.user && p.user._id.toString() === userId.toString()
  );

  if (!isParticipant) {
    throw new ApiError(403, 'You are not a participant in this chat');
  }

  // Remove user-specific archive status
  if (chat.userVisibility && chat.userVisibility.has(userId.toString())) {
    const userVisibility = chat.userVisibility.get(userId.toString());
    userVisibility.isArchived = false;
    userVisibility.archivedAt = undefined;
    chat.userVisibility.set(userId.toString(), userVisibility);
  }

  await chat.save();

  return res.status(200).json(
    new ApiResponse(200, 'Chat unarchived successfully', { chatId })
  );
});

// Soft delete chat for a specific user (user-specific delete)
export const deleteChatForUser = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw new ApiError(404, 'Chat not found');
  }

  // Check if user is a participant in the chat
  const isParticipant = chat.participants.some(
    p => p.user && p.user._id.toString() === userId.toString()
  );

  if (!isParticipant) {
    throw new ApiError(403, 'You are not a participant in this chat');
  }

  // Set user-specific delete status
  if (!chat.userVisibility) {
    chat.userVisibility = new Map();
  }
  
  chat.userVisibility.set(userId.toString(), {
    ...chat.userVisibility.get(userId.toString()) || {},
    isDeleted: true,
    deletedAt: new Date()
  });

  await chat.save();

  return res.status(200).json(
    new ApiResponse(200, 'Chat deleted successfully', { chatId })
  );
});

// Restore chat for a specific user (undo soft delete)
export const restoreChatForUser = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw new ApiError(404, 'Chat not found');
  }

  // Check if user is a participant in the chat
  const isParticipant = chat.participants.some(
    p => p.user && p.user._id.toString() === userId.toString()
  );

  if (!isParticipant) {
    throw new ApiError(403, 'You are not a participant in this chat');
  }

  // Remove user-specific delete status
  if (chat.userVisibility && chat.userVisibility.has(userId.toString())) {
    const userVisibility = chat.userVisibility.get(userId.toString());
    userVisibility.isDeleted = false;
    userVisibility.deletedAt = undefined;
    chat.userVisibility.set(userId.toString(), userVisibility);
  }

  await chat.save();

  return res.status(200).json(
    new ApiResponse(200, 'Chat restored successfully', { chatId })
  );
});

// Get archived chats for a specific user
export const getArchivedChatsForUser = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20 } = req.query;

  // Build query for archived chats for this user
  let query = {
    'participants.user': userId,
    [`userVisibility.${userId}.isArchived`]: true
  };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const chats = await Chat.find(query)
    .populate('participants.user', 'name email avatar isOnline')
    .populate('lastMessage')
    .sort({ [`userVisibility.${userId}.archivedAt`]: -1 })
    .limit(parseInt(limit))
    .skip(skip);

  const total = await Chat.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, 'Archived chats fetched successfully', {
      chats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  );
});

// Get deleted chats for a specific user (for potential restore functionality)
export const getDeletedChatsForUser = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20 } = req.query;

  // Build query for deleted chats for this user
  let query = {
    'participants.user': userId,
    [`userVisibility.${userId}.isDeleted`]: true
  };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const chats = await Chat.find(query)
    .populate('participants.user', 'name email avatar isOnline')
    .populate('lastMessage')
    .sort({ [`userVisibility.${userId}.deletedAt`]: -1 })
    .limit(parseInt(limit))
    .skip(skip);

  const total = await Chat.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, 'Deleted chats fetched successfully', {
      chats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  );
});

// Hard delete chat (permanent deletion - only for group owners or admins)
export const deleteChat = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw new ApiError(404, 'Chat not found');
  }

  // Check if user is a participant in the chat
  const isParticipant = chat.participants.some(
    p => p.user && p.user._id.toString() === userId.toString()
  );

  if (!isParticipant) {
    throw new ApiError(403, 'You are not a participant in this chat');
  }

  // For group chats, only owner can delete
  if (chat.type === 'group') {
    const participant = chat.participants.find(
      p => p.user && p.user._id.toString() === userId.toString()
    );
    
    if (!participant || participant.role !== 'owner') {
      throw new ApiError(403, 'Only group owner can delete the chat');
    }
  }

  // Delete all messages associated with this chat
  await Message.deleteMany({ chatId: chat._id });

  // Delete the chat
  await Chat.findByIdAndDelete(chatId);

  return res.status(200).json(
    new ApiResponse(200, 'Chat deleted successfully', { chatId })
  );
});

