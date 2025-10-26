import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  createMeeting,
  getProjectMeetings,
  getMeeting,
  updateMeeting,
  deleteMeeting,
  inviteAttendees,
  acceptMeeting,
  rejectMeeting,
  startMeeting,
  endMeeting,
  getUserMeetings,
  createInstantMeeting,
  createScheduledMeeting,
  joinMeeting,
  getMeetingParticipants,
  updateParticipantStatus
} from "../controllers/meeting.controller.js";

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Create instant or scheduled meetings
router.route("/meetings/instant")
  .post(createInstantMeeting);

router.route("/meetings/scheduled")
  .post(createScheduledMeeting);

// Join meeting
router.route("/meetings/:meetingId/join")
  .post(joinMeeting);

// Get meeting participants
router.route("/meetings/:meetingId/participants")
  .get(getMeetingParticipants);

// Update participant status
router.route("/meetings/:meetingId/participants/:userId")
  .put(updateParticipantStatus);

// Project meeting routes
router.route("/projects/:projectId/meetings")
  .post(createMeeting)
  .get(getProjectMeetings);

// Meeting CRUD routes
router.route("/meetings/:meetingId")
  .get(getMeeting)
  .put(updateMeeting)
  .delete(deleteMeeting);

// Meeting management routes
router.route("/meetings/:meetingId/invite")
  .post(inviteAttendees);

router.route("/meetings/:meetingId/accept")
  .post(acceptMeeting);

router.route("/meetings/:meetingId/reject")
  .post(rejectMeeting);

router.route("/meetings/:meetingId/start")
  .post(startMeeting);

router.route("/meetings/:meetingId/end")
  .post(endMeeting);

// User meetings
router.route("/meetings")
  .get(getUserMeetings);

export { router as meetingRouter };
