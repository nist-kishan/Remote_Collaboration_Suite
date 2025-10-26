import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    type: {
      type: String,
      enum: [
        "task_created",
        "task_updated",
        "task_assigned",
        "task_completed",
        "meeting_invite",
        "meeting_scheduled",
        "meeting_reminder",
        "project_invite",
        "workspace_invite",
        "budget_allocated",
        "budget_updated",
        "budget_request",
        "budget_approved",
        "budget_rejected",
        "role_changed",
        "comment_added",
        "mention"
      ],
      required: true
    },
    title: {
      type: String,
      required: true,
      maxlength: [200, "Title cannot exceed 200 characters"]
    },
    message: {
      type: String,
      required: true,
      maxlength: [500, "Message cannot exceed 500 characters"]
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    read: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium"
    },
    actionUrl: {
      type: String
    },
    expiresAt: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this;
};

// Method to mark as unread
notificationSchema.methods.markAsUnread = function() {
  this.read = false;
  this.readAt = undefined;
  return this;
};

// Static method to create notification
notificationSchema.statics.createNotification = function(userId, type, title, message, data = {}, options = {}) {
  return this.create({
    user: userId,
    type,
    title,
    message,
    data,
    priority: options.priority || "medium",
    actionUrl: options.actionUrl,
    expiresAt: options.expiresAt
  });
};

// Static method to create task notification
notificationSchema.statics.createTaskNotification = function(userId, task, type, options = {}) {
  const notifications = {
    task_created: {
      title: "New Task Created",
      message: `A new task "${task.title}" has been created in project ${task.project?.name || "Unknown"}`
    },
    task_updated: {
      title: "Task Updated",
      message: `Task "${task.title}" has been updated`
    },
    task_assigned: {
      title: "Task Assigned",
      message: `You have been assigned to task "${task.title}"`
    },
    task_completed: {
      title: "Task Completed",
      message: `Task "${task.title}" has been completed`
    }
  };

  const notification = notifications[type];
  if (!notification) return null;

  return this.createNotification(
    userId,
    type,
    notification.title,
    notification.message,
    { taskId: task._id, projectId: task.project },
    options
  );
};

// Static method to create meeting notification
notificationSchema.statics.createMeetingNotification = function(userId, meeting, type, options = {}) {
  const notifications = {
    meeting_invite: {
      title: "Meeting Invitation",
      message: `You have been invited to meeting "${meeting.title}"`
    },
    meeting_scheduled: {
      title: "Meeting Scheduled",
      message: `A new meeting "${meeting.title}" has been scheduled in project ${meeting.project?.name || "Unknown"}`
    },
    meeting_reminder: {
      title: "Meeting Reminder",
      message: `Meeting "${meeting.title}" starts in 15 minutes`
    }
  };

  const notification = notifications[type];
  if (!notification) return null;

  return this.createNotification(
    userId,
    type,
    notification.title,
    notification.message,
    { meetingId: meeting._id, projectId: meeting.project },
    options
  );
};

// Static method to create project notification
notificationSchema.statics.createProjectNotification = function(userId, project, type, details = {}) {
  const notifications = {
    budget_allocated: {
      title: "Budget Allocated",
      message: `Budget has been allocated for project "${project.name}"`
    },
    budget_updated: {
      title: "Budget Updated",
      message: `Budget has been updated for project "${project.name}"`
    },
    task_completed: {
      title: "Task Completed",
      message: details.taskTitle ? `Task "${details.taskTitle}" has been completed in project "${project.name}"` : `A task has been completed in project "${project.name}"`
    }
  };

  const notification = notifications[type];
  if (!notification) return null;

  return this.createNotification(
    userId,
    type,
    notification.title,
    notification.message,
    { projectId: project._id, ...details },
    { priority: "medium" }
  );
};

export const Notification = mongoose.model("Notification", notificationSchema);
