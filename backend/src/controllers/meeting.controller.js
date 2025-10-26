import { asyncHandle } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Meeting } from "../models/meeting.model.js";
import { Project } from "../models/project.model.js";
import { Notification } from "../models/notification.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";

// Helper function to generate meeting link
const generateMeetingLink = (meetingId) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${baseUrl}/meeting/${meetingId}`;
};

// Create meeting
export const createMeeting = asyncHandle(async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;
    
    const {
      title,
      description,
      startTime,
      endTime,
      location,
      agenda = [],
      type = "team_meeting",
      attendees = [],
      meetingType = "scheduled"
    } = req.body;

    if (!title) {
      throw new ApiError(400, "Title is required");
    }

    // For scheduled meetings, require start and end time
    if (meetingType === "scheduled") {
      if (!startTime || !endTime) {
        throw new ApiError(400, "Start time and end time are required for scheduled meetings");
      }
    }

    // Check if project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    const teamMember = project.team.find(member => 
      member.user.toString() === userId.toString() && member.status === "active"
    );

    if (!teamMember) {
      throw new ApiError(403, "You don't have access to this project");
    }

    // Check if user can create meetings (owner, hr, mr, tr can create, but not employee)
    if (teamMember.role === "employee") {
      throw new ApiError(403, "You don't have permission to create meetings");
    }

    // Validate attendees are project members
    const projectMemberIds = project.team.map(member => member.user.toString());
    const invalidAttendees = attendees.filter(attendeeId => 
      !projectMemberIds.includes(attendeeId)
    );

    if (invalidAttendees.length > 0) {
      throw new ApiError(400, "All attendees must be project members");
    }

    // Create meeting
    const meetingData = {
      title,
      description,
      project: projectId,
      organizer: userId,
      location,
      agenda,
      type,
      meetingType: meetingType || "scheduled",
      accessType: "public", // Default to public for project meetings
      attendees: attendees.map(attendeeId => ({
        user: attendeeId,
        status: "invited"
      }))
    };

    // Add start/end time only for scheduled meetings
    if (meetingType === "scheduled") {
      meetingData.startTime = new Date(startTime);
      meetingData.endTime = new Date(endTime);
    }

    // Generate meeting link
    const meetingLink = generateMeetingLink('temp');
    
    // Add meetingUrl to meetingData
    meetingData.meetingUrl = meetingLink;
    
    const meeting = await Meeting.create(meetingData);

    // Update meetingUrl with actual meeting ID
    meeting.meetingUrl = generateMeetingLink(meeting._id);
    await meeting.save();

    await meeting.populate([
      { path: "organizer", select: "name email avatar" },
      { path: "attendees.user", select: "name email avatar" },
      { path: "project", select: "name" }
    ]);

    // Create notifications for all attendees
    if (attendees.length > 0 && meetingType === "scheduled") {
      const notificationPromises = attendees.map(attendeeId => 
        Notification.createNotification(
          attendeeId,
          "meeting_invite",
          "Meeting Invitation",
          `You have been invited to meeting "${title}" in project ${project.name}`,
          { meetingId: meeting._id, projectId: projectId },
          { 
            priority: "high",
            actionUrl: `/meeting/${meeting._id}`,
            expiresAt: new Date(endTime)
          }
        )
      );
      await Promise.all(notificationPromises);
    }

    return res.status(201).json(
      new ApiResponse(201, "Meeting created successfully", { meeting })
    );
  } catch (error) {
    throw error;
  }
});

// Get project meetings
export const getProjectMeetings = asyncHandle(async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user._id;

  // Check if project exists and user has access
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const teamMember = project.team.find(member => 
    member.user.toString() === userId.toString() && member.status === "active"
  );

  if (!teamMember) {
    throw new ApiError(403, "You don't have access to this project");
  }

  const { status, type, startDate, endDate } = req.query;

  // Build filter
  const filter = { project: projectId };

  if (status) filter.status = status;
  if (type) filter.type = type;
  if (startDate || endDate) {
    filter.startTime = {};
    if (startDate) filter.startTime.$gte = new Date(startDate);
    if (endDate) filter.startTime.$lte = new Date(endDate);
  }

  const meetings = await Meeting.find(filter)
    .populate("organizer", "name email avatar")
    .populate("attendees.user", "name email avatar")
    .populate("project", "name")
    .sort({ startTime: 1 });

  return res.status(200).json(
    new ApiResponse(200, "Meetings retrieved successfully", { meetings })
  );
});

// Get single meeting
export const getMeeting = asyncHandle(async (req, res) => {
  const { meetingId } = req.params;
  const userId = req.user._id;

  console.log('🔍 Get meeting request:', { meetingId, userId: userId.toString() });

  // Try to find by custom meetingId first, then by MongoDB _id
  let meeting = await Meeting.findOne({ meetingId })
    .populate("organizer", "name email avatar")
    .populate("attendees.user", "name email avatar")
    .populate("project", "name");

  if (!meeting) {
    // Try finding by MongoDB _id
    try {
      meeting = await Meeting.findById(meetingId)
        .populate("organizer", "name email avatar")
        .populate("attendees.user", "name email avatar")
        .populate("project", "name");
    } catch (error) {
      // Invalid ObjectId format, ignore
      console.log('⚠️ Invalid MongoDB ObjectId format:', meetingId);
    }
  }

  if (!meeting) {
    console.error('❌ Meeting not found:', meetingId);
    throw new ApiError(404, "Meeting not found");
  }

  console.log('✅ Meeting found:', { 
    _id: meeting._id, 
    meetingId: meeting.meetingId, 
    title: meeting.title,
    accessType: meeting.accessType,
    meetingType: meeting.meetingType,
    hasProject: !!meeting.project
  });

  // Check if user has access to this meeting
  const isOrganizer = meeting.organizer._id.toString() === userId.toString();
  const isAttendee = meeting.attendees.some(attendee => 
    attendee.user._id.toString() === userId.toString()
  );

  console.log('🔐 Access check:', {
    userId: userId.toString(),
    organizerId: meeting.organizer._id.toString(),
    isOrganizer,
    isAttendee,
    accessType: meeting.accessType,
    meetingType: meeting.meetingType
  });

  // For project meetings, check project membership
  if (meeting.project) {
    const project = await Project.findById(meeting.project);
    if (project) {
      const teamMember = project.team.find(member => 
        member.user.toString() === userId.toString() && member.status === "active"
      );
      if (!teamMember && !isOrganizer && !isAttendee) {
        console.error('❌ Access denied: Not a project member, organizer, or attendee');
        throw new ApiError(403, "You don't have access to this meeting");
      }
    }
  } else {
    // For instant/scheduled meetings without project
    const isPublic = meeting.accessType === 'public';
    const isInstant = meeting.meetingType === 'instant';
    
    console.log('🔓 Non-project meeting access check:', {
      isPublic,
      isInstant,
      isOrganizer,
      isAttendee
    });
    
    // Allow access if ANY of these conditions are true:
    // 1. Meeting is public (anyone can view)
    // 2. Meeting is instant (anyone can view, password required to join)
    // 3. User is the organizer
    // 4. User is an attendee
    const hasAccess = isPublic || isInstant || isOrganizer || isAttendee;
    
    if (!hasAccess) {
      console.error('❌ Access denied: Not public, not instant, not organizer, not attendee');
      throw new ApiError(403, "You don't have access to this meeting");
    }
    
    console.log('✅ Access granted');
  }

  return res.status(200).json(
    new ApiResponse(200, "Meeting retrieved successfully", { meeting })
  );
});

// Update meeting
export const updateMeeting = asyncHandle(async (req, res) => {
  const { meetingId } = req.params;
  const userId = req.user._id;

  const meeting = await Meeting.findById(meetingId);
  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }

  // Check if user can manage this meeting
  if (!meeting.canBeManagedBy(req.user)) {
    throw new ApiError(403, "You don't have permission to update this meeting");
  }

  const {
    title,
    description,
    startTime,
    endTime,
    location,
    meetingUrl,
    meetingId: newMeetingId,
    password,
    agenda,
    type,
    status
  } = req.body;

  const updateData = {};
  if (title) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (startTime) updateData.startTime = new Date(startTime);
  if (endTime) updateData.endTime = new Date(endTime);
  if (location !== undefined) updateData.location = location;
  if (meetingUrl !== undefined) updateData.meetingUrl = meetingUrl;
  if (newMeetingId !== undefined) updateData.meetingId = newMeetingId;
  if (password !== undefined) updateData.password = password;
  if (agenda) updateData.agenda = agenda;
  if (type) updateData.type = type;
  if (status) updateData.status = status;

  const updatedMeeting = await Meeting.findByIdAndUpdate(
    meetingId,
    updateData,
    { new: true, runValidators: true }
  ).populate([
    { path: "organizer", select: "name email avatar" },
    { path: "attendees.user", select: "name email avatar" },
    { path: "project", select: "name" }
  ]);

  return res.status(200).json(
    new ApiResponse(200, "Meeting updated successfully", { meeting: updatedMeeting })
  );
});

// Delete meeting
export const deleteMeeting = asyncHandle(async (req, res) => {
  const { meetingId } = req.params;
  const userId = req.user._id;

  const meeting = await Meeting.findById(meetingId).populate('project');
  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }

  // Check if project exists and user is the owner
  const project = await Project.findById(meeting.project);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Only project owner can delete meetings
  const isOwner = project.owner.toString() === userId.toString();
  if (!isOwner) {
    throw new ApiError(403, "Only project owner can delete meetings");
  }

  await Meeting.findByIdAndDelete(meetingId);

  return res.status(200).json(
    new ApiResponse(200, "Meeting deleted successfully")
  );
});

// Invite attendees to meeting
export const inviteAttendees = asyncHandle(async (req, res) => {
  const { meetingId } = req.params;
  const { attendees } = req.body;
  const userId = req.user._id;

  if (!attendees || !Array.isArray(attendees)) {
    throw new ApiError(400, "Attendees array is required");
  }

  const meeting = await Meeting.findById(meetingId);
  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }

  // Check if user can manage this meeting
  if (!meeting.canBeManagedBy(req.user)) {
    throw new ApiError(403, "You don't have permission to invite attendees");
  }

  // Check if project exists and validate attendees
  const project = await Project.findById(meeting.project);
  const projectMemberIds = project.team.map(member => member.user.toString());
  
  const invalidAttendees = attendees.filter(attendeeId => 
    !projectMemberIds.includes(attendeeId)
  );

  if (invalidAttendees.length > 0) {
    throw new ApiError(400, "All attendees must be project members");
  }

  // Add new attendees
  attendees.forEach(attendeeId => {
    const existingAttendee = meeting.attendees.find(attendee => 
      attendee.user.toString() === attendeeId
    );

    if (!existingAttendee) {
      meeting.attendees.push({
        user: attendeeId,
        status: "invited"
      });
    }
  });

  await meeting.save();

  await meeting.populate([
    { path: "organizer", select: "name email avatar" },
    { path: "attendees.user", select: "name email avatar" },
    { path: "project", select: "name" }
  ]);

  return res.status(200).json(
    new ApiResponse(200, "Attendees invited successfully", { meeting })
  );
});

// Accept meeting invite
export const acceptMeeting = asyncHandle(async (req, res) => {
  const { meetingId } = req.params;
  const userId = req.user._id;

  const meeting = await Meeting.findById(meetingId);
  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }

  // Check if user is invited to this meeting
  const attendee = meeting.attendees.find(attendee => 
    attendee.user.toString() === userId.toString()
  );

  if (!attendee) {
    throw new ApiError(403, "You are not invited to this meeting");
  }

  // Update attendee status
  const updatedAttendee = meeting.updateAttendeeStatus(userId, "accepted");
  await meeting.save();

  await meeting.populate([
    { path: "organizer", select: "name email avatar" },
    { path: "attendees.user", select: "name email avatar" },
    { path: "project", select: "name" }
  ]);

  return res.status(200).json(
    new ApiResponse(200, "Meeting accepted successfully", { meeting })
  );
});

// Reject meeting invite
export const rejectMeeting = asyncHandle(async (req, res) => {
  const { meetingId } = req.params;
  const userId = req.user._id;

  const meeting = await Meeting.findById(meetingId);
  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }

  // Check if user is invited to this meeting
  const attendee = meeting.attendees.find(attendee => 
    attendee.user.toString() === userId.toString()
  );

  if (!attendee) {
    throw new ApiError(403, "You are not invited to this meeting");
  }

  // Update attendee status
  const updatedAttendee = meeting.updateAttendeeStatus(userId, "declined");
  await meeting.save();

  await meeting.populate([
    { path: "organizer", select: "name email avatar" },
    { path: "attendees.user", select: "name email avatar" },
    { path: "project", select: "name" }
  ]);

  return res.status(200).json(
    new ApiResponse(200, "Meeting rejected successfully", { meeting })
  );
});

// Start meeting
export const startMeeting = asyncHandle(async (req, res) => {
  const { meetingId } = req.params;
  const userId = req.user._id;

  const meeting = await Meeting.findById(meetingId);
  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }

  // Check if user can manage this meeting
  if (!meeting.canBeManagedBy(req.user)) {
    throw new ApiError(403, "You don't have permission to start this meeting");
  }

  // Start meeting
  meeting.startMeeting();
  await meeting.save();

  await meeting.populate([
    { path: "organizer", select: "name email avatar" },
    { path: "attendees.user", select: "name email avatar" },
    { path: "project", select: "name" }
  ]);

  return res.status(200).json(
    new ApiResponse(200, "Meeting started successfully", { meeting })
  );
});

// End meeting
export const endMeeting = asyncHandle(async (req, res) => {
  const { meetingId } = req.params;
  const userId = req.user._id;

  const meeting = await Meeting.findById(meetingId);
  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }

  // Check if user can manage this meeting
  if (!meeting.canBeManagedBy(req.user)) {
    throw new ApiError(403, "You don't have permission to end this meeting");
  }

  // End meeting
  meeting.endMeeting();
  await meeting.save();

  await meeting.populate([
    { path: "organizer", select: "name email avatar" },
    { path: "attendees.user", select: "name email avatar" },
    { path: "project", select: "name" }
  ]);

  // Schedule automatic deletion after 5 minutes for instant meetings
  // For scheduled meetings, keep them for record purposes
  if (meeting.meetingType === "instant") {
    console.log(`⏰ Scheduling deletion for instant meeting ${meetingId} in 5 minutes`);
    
    // Notify participants that meeting will be deleted
    if (global.io) {
      global.io.to(`meeting_${meetingId}`).emit('meeting_will_be_deleted', {
        meetingId: meeting._id,
        message: 'This instant meeting will be automatically deleted in 5 minutes',
        deleteAt: new Date(Date.now() + 5 * 60 * 1000)
      });
    }
    
    setTimeout(async () => {
      try {
        const meetingToDelete = await Meeting.findById(meetingId);
        if (meetingToDelete && meetingToDelete.status === "completed") {
          // Notify before deletion
          if (global.io) {
            global.io.to(`meeting_${meetingId}`).emit('meeting_deleted', {
              meetingId: meetingId,
              message: 'Meeting has been automatically deleted'
            });
          }
          
          await Meeting.findByIdAndDelete(meetingId);
          console.log(`🗑️ Auto-deleted instant meeting ${meetingId} after completion`);
        }
      } catch (error) {
        console.error(`❌ Error auto-deleting meeting ${meetingId}:`, error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  return res.status(200).json(
    new ApiResponse(200, "Meeting ended successfully", { meeting })
  );
});

// Get user's meetings
export const getUserMeetings = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { status, startDate, endDate } = req.query;

  // Build filter
  const filter = {
    $or: [
      { organizer: userId },
      { "attendees.user": userId }
    ]
  };

  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.startTime = {};
    if (startDate) filter.startTime.$gte = new Date(startDate);
    if (endDate) filter.startTime.$lte = new Date(endDate);
  }

  const meetings = await Meeting.find(filter)
    .populate("organizer", "name email avatar")
    .populate("attendees.user", "name email avatar")
    .populate("project", "name")
    .sort({ startTime: 1 });

  return res.status(200).json(
    new ApiResponse(200, "Meetings retrieved successfully", { meetings })
  );
});

// Create instant meeting
export const createInstantMeeting = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  
  const {
    title,
    description,
    accessType = "private",
    password,
    maxParticipants = 50,
    attendees = [],
    settings = {}
  } = req.body;

  if (!title) {
    throw new ApiError(400, "Meeting title is required");
  }

  // Validate maxParticipants (max 50)
  const validatedMaxParticipants = Math.min(maxParticipants || 50, 50);

  // Generate password if not provided for private meetings
  let meetingPassword = password;
  if (accessType === "private" && !password) {
    meetingPassword = Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  // Create instant meeting
  const meeting = await Meeting.create({
    title,
    description,
    meetingType: "instant",
    accessType,
    organizer: userId,
    password: meetingPassword,
    maxParticipants: validatedMaxParticipants,
    settings: {
      enableChat: settings.enableChat !== undefined ? settings.enableChat : true,
      enableScreenShare: settings.enableScreenShare !== undefined ? settings.enableScreenShare : true,
      enableRecording: settings.enableRecording !== undefined ? settings.enableRecording : false,
      muteOnJoin: settings.muteOnJoin !== undefined ? settings.muteOnJoin : false,
      videoOnJoin: settings.videoOnJoin !== undefined ? settings.videoOnJoin : true
    },
    attendees: attendees.map(attendeeId => ({
      user: attendeeId,
      role: "participant",
      status: "invited"
    }))
  });

  // Generate meeting link
  const meetingLink = generateMeetingLink(meeting._id);
  meeting.meetingUrl = meetingLink;
  await meeting.save();

  await meeting.populate([
    { path: "organizer", select: "name email avatar" },
    { path: "attendees.user", select: "name email avatar" },
    { path: "project", select: "name" }
  ]);

  return res.status(201).json(
    new ApiResponse(201, "Instant meeting created successfully", { meeting })
  );
});

// Create scheduled meeting
export const createScheduledMeeting = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  
  const {
    title,
    description,
    startTime,
    endTime,
    accessType = "private",
    password,
    maxParticipants = 50,
    attendees = [],
    settings = {}
  } = req.body;

  if (!title || !startTime || !endTime) {
    throw new ApiError(400, "Title, start time, and end time are required");
  }

  // Validate times
  const start = new Date(startTime);
  const end = new Date(endTime);
  const now = new Date();

  if (start <= now) {
    throw new ApiError(400, "Start time must be in the future");
  }

  if (end <= start) {
    throw new ApiError(400, "End time must be after start time");
  }

  // Validate meeting duration (max 60 minutes)
  const durationMinutes = (end - start) / (1000 * 60);
  if (durationMinutes > 60) {
    throw new ApiError(400, "Meeting duration cannot exceed 60 minutes");
  }

  // Validate maxParticipants (max 50)
  const validatedMaxParticipants = Math.min(maxParticipants || 50, 50);

  // Generate password if not provided for private meetings
  let meetingPassword = password;
  if (accessType === "private" && !password) {
    meetingPassword = Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  // Create scheduled meeting
  const meeting = await Meeting.create({
    title,
    description,
    meetingType: "scheduled",
    accessType,
    organizer: userId,
    startTime: start,
    endTime: end,
    password: meetingPassword,
    maxParticipants: validatedMaxParticipants,
    settings: {
      enableChat: settings.enableChat !== undefined ? settings.enableChat : true,
      enableScreenShare: settings.enableScreenShare !== undefined ? settings.enableScreenShare : true,
      enableRecording: settings.enableRecording !== undefined ? settings.enableRecording : false,
      muteOnJoin: settings.muteOnJoin !== undefined ? settings.muteOnJoin : false,
      videoOnJoin: settings.videoOnJoin !== undefined ? settings.videoOnJoin : true
    },
    attendees: attendees.map(attendeeId => ({
      user: attendeeId,
      role: "participant",
      status: "invited"
    }))
  });

  // Generate meeting link
  const meetingLink = generateMeetingLink(meeting._id);
  meeting.meetingUrl = meetingLink;
  await meeting.save();

  return res.status(201).json(
    new ApiResponse(201, "Scheduled meeting created successfully", { meeting })
  );
});

// Join meeting
export const joinMeeting = asyncHandle(async (req, res) => {
  const { meetingId } = req.params;
  const userId = req.user._id;
  const { password } = req.body;

  console.log('🚪 Join meeting request:', { meetingId, userId: userId.toString() });

  // Try to find by custom meetingId first, then by MongoDB _id
  let meeting = await Meeting.findOne({ meetingId });
  if (!meeting) {
    // Try finding by MongoDB _id
    meeting = await Meeting.findById(meetingId);
  }
  
  if (!meeting) {
    console.error('❌ Meeting not found:', meetingId);
    throw new ApiError(404, "Meeting not found");
  }

  console.log('✅ Meeting found:', { 
    _id: meeting._id, 
    meetingId: meeting.meetingId, 
    title: meeting.title,
    accessType: meeting.accessType,
    isActive: meeting.isActive
  });

  // Check if meeting is active
  if (!meeting.isActive) {
    throw new ApiError(400, "Meeting is not active");
  }

  // For SCHEDULED meetings, validate time window
  if (meeting.meetingType === "scheduled") {
    const now = new Date();
    const startTime = new Date(meeting.startTime);
    const endTime = new Date(meeting.endTime);
    
    // Calculate time difference in minutes
    const minutesUntilStart = (startTime - now) / (1000 * 60);
    const minutesAfterEnd = (now - endTime) / (1000 * 60);
    
    console.log('⏰ Scheduled meeting time check:', {
      now: now.toISOString(),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      minutesUntilStart: minutesUntilStart.toFixed(2),
      minutesAfterEnd: minutesAfterEnd.toFixed(2)
    });
    
    // Meeting hasn't started yet (more than 10 minutes early)
    if (minutesUntilStart > 10) {
      throw new ApiError(400, `This meeting is scheduled to start at ${startTime.toLocaleString()}. You can join up to 10 minutes before the scheduled time.`);
    }
    
    // Meeting has ended
    if (minutesAfterEnd > 0) {
      throw new ApiError(400, "This meeting has already ended.");
    }
  }

  // Check password for PRIVATE meetings (both instant and scheduled)
  if (meeting.accessType === "private") {
    console.log('🔐 Password check for private meeting');
    if (!password || password !== meeting.password) {
      console.error('❌ Invalid password provided');
      throw new ApiError(403, "Invalid meeting password");
    }
    console.log('✅ Password validated');
  }

  // Check participant limit (max 50)
  const currentJoinedCount = meeting.attendees.filter(a => a.status === "joined").length;
  const maxParticipants = meeting.maxParticipants || 50;
  
  console.log('👥 Participant count check:', {
    currentJoined: currentJoinedCount,
    maxParticipants: maxParticipants
  });
  
  if (currentJoinedCount >= maxParticipants) {
    throw new ApiError(400, `This meeting has reached its maximum capacity of ${maxParticipants} participants.`);
  }

  // Check if user is already an attendee
  const existingAttendee = meeting.attendees.find(attendee => 
    attendee.user.toString() === userId.toString()
  );

  if (existingAttendee) {
    existingAttendee.status = "joined";
    existingAttendee.joinedAt = new Date();
    console.log('✅ Existing attendee rejoined');
  } else {
    // Add user as attendee
    meeting.attendees.push({
      user: userId,
      role: "participant",
      status: "joined",
      joinedAt: new Date()
    });
    console.log('✅ New attendee added');
  }

  // Update participant count
  meeting.currentParticipants = meeting.attendees.filter(a => a.status === "joined").length;
  
  // Check if meeting can start (for scheduled meetings)
  if (meeting.meetingType === "scheduled" && meeting.status === "waiting") {
    const now = new Date();
    if (now >= meeting.startTime && now <= meeting.endTime) {
      meeting.status = "in_progress";
    }
  } else if (meeting.meetingType === "instant" && meeting.status === "waiting") {
    meeting.status = "in_progress";
  }

  await meeting.save();

  await meeting.populate([
    { path: "organizer", select: "name email avatar" },
    { path: "attendees.user", select: "name email avatar" },
    { path: "project", select: "name" }
  ]);

  return res.status(200).json(
    new ApiResponse(200, "Successfully joined meeting", { meeting })
  );
});

// Get meeting participants
export const getMeetingParticipants = asyncHandle(async (req, res) => {
  const { meetingId } = req.params;
  const userId = req.user._id;

  // Try to find by custom meetingId first, then by MongoDB _id
  let meeting = await Meeting.findOne({ meetingId })
    .populate("attendees.user", "name email avatar")
    .populate("organizer", "name email avatar");
  
  if (!meeting) {
    meeting = await Meeting.findById(meetingId)
      .populate("attendees.user", "name email avatar")
      .populate("organizer", "name email avatar");
  }

  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }

  // Check if user is authorized (organizer or attendee)
  const isOrganizer = meeting.organizer._id.toString() === userId.toString();
  const userAttendee = meeting.attendees.find(attendee => 
    attendee.user._id.toString() === userId.toString()
  );

  // Allow access if ANY of these conditions are true:
  // 1. User is organizer
  // 2. User is attendee
  // 3. Meeting is public (anyone can view participants)
  // 4. Meeting is instant (anyone can view participants)
  const isPublic = meeting.accessType === 'public';
  const isInstant = meeting.meetingType === 'instant';
  const hasAccess = isOrganizer || userAttendee || isPublic || isInstant;
  
  if (!hasAccess) {
    console.error('❌ Access denied to meeting participants:', {
      userId: userId.toString(),
      isOrganizer,
      isAttendee: !!userAttendee,
      isPublic,
      isInstant
    });
    throw new ApiError(403, "You are not authorized to view this meeting");
  }
  
  console.log('✅ Access granted to meeting participants');

  const participants = meeting.attendees.filter(a => a.status === "joined");

  return res.status(200).json(
    new ApiResponse(200, "Participants retrieved successfully", { 
      participants,
      meetingId: meeting._id,
      meetingTitle: meeting.title
    })
  );
});

// Update participant status
export const updateParticipantStatus = asyncHandle(async (req, res) => {
  const { meetingId } = req.params;
  const userId = req.user._id;
  const { isMuted, isVideoOn } = req.body;

  // Try to find by custom meetingId first, then by MongoDB _id
  let meeting = await Meeting.findOne({ meetingId });
  if (!meeting) {
    meeting = await Meeting.findById(meetingId);
  }
  
  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }

  const attendee = meeting.attendees.find(attendee => 
    attendee.user.toString() === userId.toString()
  );

  if (!attendee) {
    throw new ApiError(403, "You are not a participant in this meeting");
  }

  // Update participant metadata
  attendee.isMuted = isMuted !== undefined ? isMuted : attendee.isMuted;
  attendee.isVideoOn = isVideoOn !== undefined ? isVideoOn : attendee.isVideoOn;

  await meeting.save();

  return res.status(200).json(
    new ApiResponse(200, "Participant status updated successfully", { attendee })
  );
});