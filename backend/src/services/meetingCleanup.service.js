import { Meeting } from "../models/meeting.model.js";

/**
 * Meeting Cleanup Service
 * Automatically deletes completed instant meetings after a specified duration
 */

// Delete instant meetings that have been completed for more than 5 minutes
export const cleanupCompletedInstantMeetings = async () => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const result = await Meeting.deleteMany({
      meetingType: "instant",
      status: "completed",
      updatedAt: { $lt: fiveMinutesAgo }
    });

    if (result.deletedCount > 0) {
      console.log(`🗑️ Auto-deleted ${result.deletedCount} completed instant meeting(s)`);
    }

    return result;
  } catch (error) {
    console.error("❌ Error cleaning up instant meetings:", error);
    throw error;
  }
};

// Delete scheduled meetings that have passed their end time
export const cleanupExpiredScheduledMeetings = async () => {
  try {
    const now = new Date();
    
    const result = await Meeting.deleteMany({
      meetingType: "scheduled",
      endTime: { $lt: now },
      status: { $in: ["waiting", "in_progress"] }
    });

    if (result.deletedCount > 0) {
      console.log(`🗑️ Auto-deleted ${result.deletedCount} expired scheduled meeting(s)`);
    }

    return result;
  } catch (error) {
    console.error("❌ Error cleaning up expired scheduled meetings:", error);
    throw error;
  }
};

// Delete scheduled meetings that have been completed for more than 24 hours (optional)
export const cleanupOldScheduledMeetings = async () => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const result = await Meeting.deleteMany({
      meetingType: "scheduled",
      status: "completed",
      updatedAt: { $lt: oneDayAgo }
    });

    if (result.deletedCount > 0) {
      console.log(`🗑️ Auto-deleted ${result.deletedCount} old scheduled meeting(s)`);
    }

    return result;
  } catch (error) {
    console.error("❌ Error cleaning up scheduled meetings:", error);
    throw error;
  }
};

// Delete cancelled meetings older than 7 days
export const cleanupCancelledMeetings = async () => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const result = await Meeting.deleteMany({
      status: "cancelled",
      updatedAt: { $lt: sevenDaysAgo }
    });

    if (result.deletedCount > 0) {
      console.log(`🗑️ Auto-deleted ${result.deletedCount} cancelled meeting(s)`);
    }

    return result;
  } catch (error) {
    console.error("❌ Error cleaning up cancelled meetings:", error);
    throw error;
  }
};

// Run all cleanup tasks
export const runMeetingCleanup = async () => {
  console.log("🧹 Running meeting cleanup tasks...");
  
  try {
    await cleanupCompletedInstantMeetings();
    await cleanupExpiredScheduledMeetings(); // Auto-delete expired scheduled meetings
    // Uncomment if you want to auto-delete old scheduled meetings
    // await cleanupOldScheduledMeetings();
    await cleanupCancelledMeetings();
    
    console.log("✅ Meeting cleanup completed");
  } catch (error) {
    console.error("❌ Meeting cleanup failed:", error);
  }
};

// Schedule cleanup to run every 5 minutes
export const startMeetingCleanupScheduler = () => {
  console.log("⏰ Starting meeting cleanup scheduler (runs every 5 minutes)");
  
  // Run immediately on startup
  runMeetingCleanup();
  
  // Then run every 5 minutes
  setInterval(runMeetingCleanup, 5 * 60 * 1000);
};
