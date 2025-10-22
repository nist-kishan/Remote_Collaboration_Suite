import Call from '../models/call.model.js';
import Chat from '../models/chat.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandle } from '../utils/asyncHandler.js';

export const startCall = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { chatId, type } = req.body;

  let chat;
  let participants = [];

  if (chatId) {
    chat = await Chat.findById(chatId);
    if (!chat) {
      throw new ApiError(404, 'Chat not found');
    }

    // Verify user is participant
    const isParticipant = chat.participants.some(
      p => p.user.toString() === userId.toString()
    );

    if (!isParticipant) {
      throw new ApiError(403, 'You are not a participant in this chat');
    }

    // Get all participants except the caller
    participants = chat.participants
      .filter(p => p.user.toString() !== userId.toString())
      .map(p => ({
        user: p.user,
        status: 'invited'
      }));

    // Add caller as joined
    participants.unshift({
      user: userId,
      status: 'joined',
      joinedAt: new Date()
    });
  } else {
    // Direct call without chat
    const { participantIds } = req.body;
    if (!participantIds || participantIds.length === 0) {
      throw new ApiError(400, 'Participants are required');
    }

    participants = [
      { user: userId, status: 'joined', joinedAt: new Date() },
      ...participantIds.map(id => ({ user: id, status: 'invited' }))
    ];
  }

  const call = await Call.create({
    type: type || 'one-to-one',
    chat: chatId,
    participants,
    startedBy: userId,
    status: 'ringing'
  });

  await call.populate('participants.user', 'name avatar');
  await call.populate('startedBy', 'name avatar');

  return res.status(201).json(
    new ApiResponse(201, 'Call started successfully', { call })
  );
});

// Join a call
export const joinCall = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { callId } = req.params;

  const call = await Call.findById(callId);

  if (!call) {
    throw new ApiError(404, 'Call not found');
  }

  const participant = call.participants.find(
    p => p.user.toString() === userId.toString()
  );

  if (!participant) {
    throw new ApiError(403, 'You are not invited to this call');
  }

  participant.status = 'joined';
  participant.joinedAt = new Date();

  if (call.status === 'ringing') {
    call.status = 'ongoing';
  }

  await call.save();
  await call.populate('participants.user', 'name avatar');

  return res.status(200).json(
    new ApiResponse(200, 'Joined call successfully', { call })
  );
});

// End a call
export const endCall = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { callId } = req.params;

  const call = await Call.findById(callId);

  if (!call) {
    throw new ApiError(404, 'Call not found');
  }

  const participant = call.participants.find(
    p => p.user.toString() === userId.toString()
  );

  if (!participant) {
    throw new ApiError(403, 'You are not a participant in this call');
  }

  // Mark participant as left
  participant.status = 'left';
  participant.leftAt = new Date();

  // Calculate duration for this participant
  if (participant.joinedAt) {
    participant.duration = Math.floor(
      (new Date() - participant.joinedAt) / 1000
    );
  }

  // Check if all participants have left
  const allLeft = call.participants.every(p => p.status === 'left');

  if (allLeft) {
    call.status = 'ended';
    call.endedAt = new Date();

    // Calculate total call duration
    call.duration = Math.floor((call.endedAt - call.startedAt) / 1000);
  }

  await call.save();
  await call.populate('participants.user', 'name avatar');

  return res.status(200).json(
    new ApiResponse(200, 'Call ended successfully', { call })
  );
});

// Get call history
export const getCallHistory = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, filter } = req.query;

  // Build query based on filter
  let query = {
    'participants.user': userId.toString()
  };

  // Add filter logic based on call status and user participation
  if (filter && filter !== 'all') {
    switch (filter) {
      case 'missed':
        query.status = 'missed';
        break;
      case 'outgoing':
        query.startedBy = userId.toString();
        query.status = { $in: ['ended', 'missed', 'rejected', 'ringing', 'ongoing'] };
        break;
      case 'incoming':
        query.startedBy = { $ne: userId.toString() };
        query.status = { $in: ['ended', 'missed', 'rejected', 'ringing', 'ongoing'] };
        break;
    }
  } else {
    // For 'all' filter, include all statuses except maybe some that shouldn't be shown
    query.status = { $in: ['ended', 'missed', 'rejected', 'ringing', 'ongoing'] };
  }


  const calls = await Call.find(query)
    .populate('participants.user', 'name avatar')
    .populate('startedBy', 'name avatar')
    .populate('chat')
    .sort({ startedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);


  const total = await Call.countDocuments(query);

  // Debug: Check what calls exist for this user
  const allUserCalls = await Call.find({ 'participants.user': userId.toString() }).select('status startedBy').limit(10);

  // If no calls found with the current query and filter is 'all', try without status filter
  if (calls.length === 0 && filter === 'all') {
    const fallbackQuery = { 'participants.user': userId.toString() };
    const fallbackCalls = await Call.find(fallbackQuery)
      .populate('participants.user', 'name avatar')
      .populate('startedBy', 'name avatar')
      .populate('chat')
      .sort({ startedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const fallbackTotal = await Call.countDocuments(fallbackQuery);
    
    return res.status(200).json(
      new ApiResponse(200, 'Call history fetched successfully', {
        calls: fallbackCalls,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: fallbackTotal,
          pages: Math.ceil(fallbackTotal / limit)
        }
      })
    );
  }

  return res.status(200).json(
    new ApiResponse(200, 'Call history fetched successfully', {
      calls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })
  );
});

// Update call settings (video, screen share)
export const updateCallSettings = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { callId } = req.params;
  const { videoEnabled, screenSharing } = req.body;

  const call = await Call.findById(callId);

  if (!call) {
    throw new ApiError(404, 'Call not found');
  }

  const participant = call.participants.find(
    p => p.user.toString() === userId.toString()
  );

  if (!participant) {
    throw new ApiError(403, 'You are not a participant in this call');
  }

  // Update only video and screen sharing settings
  if (videoEnabled !== undefined) participant.videoEnabled = videoEnabled;
  if (screenSharing !== undefined) participant.screenSharing = screenSharing;

  await call.save();

  return res.status(200).json(
    new ApiResponse(200, 'Call settings updated successfully', { call })
  );
});

// Reject call
export const rejectCall = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { callId } = req.params;

  const call = await Call.findById(callId);

  if (!call) {
    throw new ApiError(404, 'Call not found');
  }

  const participant = call.participants.find(
    p => p.user.toString() === userId.toString()
  );

  if (!participant) {
    throw new ApiError(403, 'You are not invited to this call');
  }

  participant.status = 'rejected';

  // For one-to-one calls, end the call when rejected
  if (call.type === 'one-to-one') {
    call.status = 'rejected';
    call.endedAt = new Date();
  }

  await call.save();

  return res.status(200).json(
    new ApiResponse(200, 'Call rejected successfully')
  );
});

// Get single call by ID
export const getCallById = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { callId } = req.params;

  const call = await Call.findById(callId)
    .populate('participants.user', 'name avatar')
    .populate('startedBy', 'name avatar')
    .populate('chat');

  if (!call) {
    throw new ApiError(404, 'Call not found');
  }

  // Check if user is a participant
  const isParticipant = call.participants.some(
    p => p.user._id.toString() === userId.toString()
  );

  if (!isParticipant) {
    throw new ApiError(403, 'You are not a participant in this call');
  }

  return res.status(200).json(
    new ApiResponse(200, 'Call fetched successfully', { call })
  );
});

// Delete single call
export const deleteCall = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { callId } = req.params;

  const call = await Call.findById(callId);

  if (!call) {
    throw new ApiError(404, 'Call not found');
  }

  // Check if user is a participant
  const isParticipant = call.participants.some(
    p => p.user.toString() === userId.toString()
  );

  if (!isParticipant) {
    throw new ApiError(403, 'You are not a participant in this call');
  }

  await Call.findByIdAndDelete(callId);

  return res.status(200).json(
    new ApiResponse(200, 'Call deleted successfully')
  );
});

// Clear all call history
export const clearCallHistory = asyncHandle(async (req, res) => {
  const userId = req.user._id;

  const result = await Call.deleteMany({
    'participants.user': userId
  });

  return res.status(200).json(
    new ApiResponse(200, 'Call history cleared successfully', {
      deletedCount: result.deletedCount
    })
  );
});

// Mark call as missed (for timeout or cleanup)
export const markCallAsMissed = asyncHandle(async (req, res) => {
  const { callId } = req.params;

  const call = await Call.findById(callId);

  if (!call) {
    throw new ApiError(404, 'Call not found');
  }

  // Only mark as missed if still ringing
  if (call.status === 'ringing') {
    call.status = 'missed';
    call.endedAt = new Date();
    
    // Mark all non-joined participants as missed
    call.participants.forEach(participant => {
      if (participant.status === 'invited') {
        participant.status = 'missed';
      }
    });

    await call.save();
    await call.populate('participants.user', 'name avatar');
    await call.populate('startedBy', 'name avatar');

    return res.status(200).json(
      new ApiResponse(200, 'Call marked as missed', { call })
    );
  }

  return res.status(200).json(
    new ApiResponse(200, 'Call status unchanged', { call })
  );
});

// Cleanup old ringing calls (mark as missed)
export const cleanupMissedCalls = asyncHandle(async (req, res) => {
  const timeoutMinutes = 5; // Mark calls as missed after 5 minutes
  const timeoutDate = new Date(Date.now() - timeoutMinutes * 60 * 1000);

  const result = await Call.updateMany(
    {
      status: 'ringing',
      startedAt: { $lt: timeoutDate }
    },
    {
      $set: {
        status: 'missed',
        endedAt: new Date()
      },
      $set: {
        'participants.$[elem].status': 'missed'
      }
    },
    {
      arrayFilters: [{ 'elem.status': 'invited' }]
    }
  );

  return res.status(200).json(
    new ApiResponse(200, { 
      modifiedCount: result.modifiedCount 
    }, `Marked ${result.modifiedCount} calls as missed`)
  );
});
