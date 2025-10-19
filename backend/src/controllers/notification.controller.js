import { asyncHandle } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Notification } from "../models/notification.model.js";
import mongoose from "mongoose";

// Get user notifications
export const getUserNotifications = asyncHandle(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, unreadOnly = false, type } = req.query;

  // Build filter
  const filter = { user: userId, isActive: true };

  if (unreadOnly === "true") {
    filter.read = false;
  }

  if (type) {
    filter.type = type;
  }

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Notification.countDocuments(filter);
  const unreadCount = await Notification.countDocuments({
    user: userId,
    read: false,
    isActive: true
  });

  return res.status(200).json(
    new ApiResponse(200, "Notifications retrieved successfully", {
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    })
  );
});

// Mark notification as read
export const markNotificationAsRead = asyncHandle(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user._id;

  const notification = await Notification.findOne({
    _id: notificationId,
    user: userId
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  notification.read = true;
  notification.readAt = new Date();
  await notification.save();

  return res.status(200).json(
    new ApiResponse(200, "Notification marked as read", { notification })
  );
});

// Mark all notifications as read
export const markAllNotificationsAsRead = asyncHandle(async (req, res) => {
  const userId = req.user._id;

  const result = await Notification.updateMany(
    { user: userId, read: false, isActive: true },
    { read: true, readAt: new Date() }
  );

  return res.status(200).json(
    new ApiResponse(200, "All notifications marked as read", { 
      updatedCount: result.modifiedCount 
    })
  );
});

// Delete notification
export const deleteNotification = asyncHandle(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user._id;

  const notification = await Notification.findOne({
    _id: notificationId,
    user: userId
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  notification.isActive = false;
  await notification.save();

  return res.status(200).json(
    new ApiResponse(200, "Notification deleted successfully")
  );
});

// Get notification statistics
export const getNotificationStats = asyncHandle(async (req, res) => {
  const userId = req.user._id;

  const stats = await Notification.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), isActive: true } },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
        unreadCount: {
          $sum: { $cond: [{ $eq: ["$read", false] }, 1, 0] }
        }
      }
    }
  ]);

  const totalNotifications = await Notification.countDocuments({
    user: userId,
    isActive: true
  });

  const totalUnread = await Notification.countDocuments({
    user: userId,
    read: false,
    isActive: true
  });

  const statsObject = {
    total: totalNotifications,
    unread: totalUnread,
    byType: {}
  };

  stats.forEach(stat => {
    statsObject.byType[stat._id] = {
      total: stat.count,
      unread: stat.unreadCount
    };
  });

  return res.status(200).json(
    new ApiResponse(200, "Notification statistics retrieved successfully", { stats: statsObject })
  );
});

// Create notification (for internal use)
export const createNotification = asyncHandle(async (req, res) => {
  const { userId, type, title, message, data, priority, actionUrl, expiresAt } = req.body;

  if (!userId || !type || !title || !message) {
    throw new ApiError(400, "User ID, type, title, and message are required");
  }

  const notification = await Notification.create({
    user: userId,
    type,
    title,
    message,
    data,
    priority,
    actionUrl,
    expiresAt
  });

  return res.status(201).json(
    new ApiResponse(201, "Notification created successfully", { notification })
  );
});

// Bulk create notifications
export const createBulkNotifications = asyncHandle(async (req, res) => {
  const { notifications } = req.body;

  if (!notifications || !Array.isArray(notifications)) {
    throw new ApiError(400, "Notifications array is required");
  }

  const createdNotifications = await Notification.insertMany(notifications);

  return res.status(201).json(
    new ApiResponse(201, "Notifications created successfully", { 
      notifications: createdNotifications,
      count: createdNotifications.length
    })
  );
});
