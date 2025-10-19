import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationStats,
  createNotification,
  createBulkNotifications
} from "../controllers/notification.controller.js";

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Notification CRUD routes
router.route("/")
  .get(getUserNotifications)
  .post(createNotification);

router.route("/bulk")
  .post(createBulkNotifications);

router.route("/stats")
  .get(getNotificationStats);

router.route("/mark-all-read")
  .put(markAllNotificationsAsRead);

router.route("/:notificationId")
  .delete(deleteNotification);

router.route("/:notificationId/mark-read")
  .put(markNotificationAsRead);

export { router as notificationRouter };
