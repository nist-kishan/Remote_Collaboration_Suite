import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [200, "Task title cannot exceed 200 characters"]
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"]
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["todo", "in_progress", "review", "completed", "cancelled"],
      default: "todo"
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium"
    },
    type: {
      type: String,
      enum: ["feature", "bug", "improvement", "documentation", "other"],
      default: "feature"
    },
    estimatedHours: {
      type: Number,
      min: 0
    },
    actualHours: {
      type: Number,
      default: 0,
      min: 0
    },
    startDate: {
      type: Date
    },
    dueDate: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    tags: [{
      type: String,
      trim: true
    }],
    attachments: [{
      name: String,
      url: String,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    comments: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      content: {
        type: String,
        required: true,
        maxlength: [1000, "Comment cannot exceed 1000 characters"]
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    dependencies: [{
      task: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task"
      },
      type: {
        type: String,
        enum: ["blocks", "depends_on"],
        default: "depends_on"
      }
    }],
    timeLogs: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      hours: {
        type: Number,
        required: true,
        min: 0
      },
      description: String,
      date: {
        type: Date,
        default: Date.now
      }
    }],
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
taskSchema.index({ project: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ dueDate: 1 });

// Virtual for completion percentage
taskSchema.virtual("completionPercentage").get(function() {
  if (this.status === "completed") return 100;
  if (this.status === "cancelled") return 0;
  if (this.status === "review") return 90;
  if (this.status === "in_progress") return 50;
  return 0;
});

// Virtual for overdue status
taskSchema.virtual("isOverdue").get(function() {
  if (!this.dueDate || this.status === "completed" || this.status === "cancelled") {
    return false;
  }
  return new Date() > this.dueDate;
});

// Ensure virtual fields are serialized
taskSchema.set("toJSON", { virtuals: true });
taskSchema.set("toObject", { virtuals: true });

// Pre-save middleware
taskSchema.pre("save", function(next) {
  // Set completedAt when status changes to completed
  if (this.isModified("status") && this.status === "completed" && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  // Clear completedAt when status changes from completed
  if (this.isModified("status") && this.status !== "completed" && this.completedAt) {
    this.completedAt = undefined;
  }
  
  next();
});

// Method to check if user can manage task
taskSchema.methods.canBeManagedBy = function(user) {
  // Admin can manage all tasks
  if (user.role === "admin") {
    return true;
  }
  
  // HR can manage all tasks
  if (user.role === "hr") {
    return true;
  }
  
  // Project manager can manage tasks in their projects
  if (user.role === "project_manager") {
    return this.project.projectManager.toString() === user._id.toString();
  }
  
  // Users can manage their own tasks
  if (this.assignedTo.toString() === user._id.toString()) {
    return true;
  }
  
  return false;
};

// Method to add comment
taskSchema.methods.addComment = function(userId, content) {
  this.comments.push({
    user: userId,
    content: content,
    createdAt: new Date()
  });
  return this.comments[this.comments.length - 1];
};

// Method to log time
taskSchema.methods.logTime = function(userId, hours, description = "") {
  this.timeLogs.push({
    user: userId,
    hours: hours,
    description: description,
    date: new Date()
  });
  
  // Update actual hours
  this.actualHours = this.timeLogs.reduce((total, log) => total + log.hours, 0);
  
  return this.timeLogs[this.timeLogs.length - 1];
};

// Method to update status
taskSchema.methods.updateStatus = function(newStatus, userId) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Add comment about status change
  this.addComment(userId, `Status changed from ${oldStatus} to ${newStatus}`);
  
  return this;
};

export const Task = mongoose.model("Task", taskSchema);
