import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      maxlength: [100, "Project name cannot exceed 100 characters"]
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"]
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true
    },
    projectManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    team: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      role: {
        type: String,
        enum: ["owner", "hr", "mr", "tr", "employee"],
        default: "employee"
      },
      joinedAt: {
        type: Date,
        default: Date.now
      },
      invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      status: {
        type: String,
        enum: ["active", "pending", "suspended"],
        default: "active"
      }
    }],
    status: {
      type: String,
      enum: ["planning", "active", "on_hold", "completed", "cancelled"],
      default: "planning"
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium"
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function(value) {
          return value > this.startDate;
        },
        message: "End date must be after start date"
      }
    },
    budget: {
      allocated: {
        type: Number,
        min: 0
      },
      spent: {
        type: Number,
        default: 0,
        min: 0
      },
      currency: {
        type: String,
        default: "USD"
      }
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    tags: [{
      type: String,
      trim: true
    }],
    documents: [{
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
    settings: {
      allowSelfAssignment: {
        type: Boolean,
        default: false
      },
      requireApproval: {
        type: Boolean,
        default: true
      },
      notifications: {
        type: Boolean,
        default: true
      }
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
projectSchema.index({ workspace: 1 });
projectSchema.index({ projectManager: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ startDate: 1, endDate: 1 });
projectSchema.index({ "team.user": 1 });

// Virtual for task count
projectSchema.virtual("taskCount", {
  ref: "Task",
  localField: "_id",
  foreignField: "project",
  count: true
});

// Virtual for completed task count
projectSchema.virtual("completedTaskCount", {
  ref: "Task",
  localField: "_id",
  foreignField: "project",
  count: true,
  match: { status: "completed" }
});

// Virtual for meeting count
projectSchema.virtual("meetingCount", {
  ref: "Meeting",
  localField: "_id",
  foreignField: "project",
  count: true
});

// Ensure virtual fields are serialized
projectSchema.set("toJSON", { virtuals: true });
projectSchema.set("toObject", { virtuals: true });

// Pre-save middleware to validate dates
projectSchema.pre("save", function(next) {
  if (this.endDate <= this.startDate) {
    return next(new Error("End date must be after start date"));
  }
  next();
});

// Method to check if user is part of project team
projectSchema.methods.isTeamMember = function(userId) {
  return this.team.some(member => member.user.toString() === userId.toString());
};

// Method to check if user can manage project
projectSchema.methods.canBeManagedBy = function(user) {
  // Check if user is in project team
  const teamMember = this.team.find(member => 
    member.user.toString() === user._id.toString() && member.status === "active"
  );
  
  if (!teamMember) {
    return false;
  }
  
  // Owner has full access
  if (teamMember.role === "owner") {
    return true;
  }
  
  // HR can manage everything except delete project
  if (teamMember.role === "hr") {
    return true;
  }
  
  // MR can manage tasks and assign users
  if (teamMember.role === "mr") {
    return true;
  }
  
  return false;
};

// Method to check if user can delete project
projectSchema.methods.canBeDeletedBy = function(user) {
  const teamMember = this.team.find(member => 
    member.user.toString() === user._id.toString() && member.status === "active"
  );
  
  if (!teamMember) {
    return false;
  }
  
  // Only owner can delete project
  return teamMember.role === "owner";
};

// Method to add team member
projectSchema.methods.addTeamMember = function(userId, role = "employee", invitedBy = null) {
  const existingMember = this.team.find(member => member.user.toString() === userId.toString());
  if (existingMember) {
    existingMember.status = "active";
    existingMember.role = role;
    return existingMember;
  }
  
  this.team.push({
    user: userId,
    role: role,
    invitedBy: invitedBy,
    joinedAt: new Date(),
    status: "active"
  });
  
  return this.team[this.team.length - 1];
};

// Method to remove team member
projectSchema.methods.removeTeamMember = function(userId) {
  const memberIndex = this.team.findIndex(member => member.user.toString() === userId.toString());
  if (memberIndex === -1) {
    return false; // Not a member
  }
  
  this.team.splice(memberIndex, 1);
  return true;
};

export const Project = mongoose.model("Project", projectSchema);
