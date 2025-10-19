import mongoose from "mongoose";

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Workspace name is required"],
      trim: true,
      maxlength: [100, "Workspace name cannot exceed 100 characters"]
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"]
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    members: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      role: {
        type: String,
        enum: ["owner", "admin", "member"],
        default: "member"
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
    settings: {
      allowMemberInvites: {
        type: Boolean,
        default: true
      },
      requireApproval: {
        type: Boolean,
        default: false
      },
      maxMembers: {
        type: Number,
        default: 50
      },
      allowPublicProjects: {
        type: Boolean,
        default: false
      }
    },
    subscription: {
      plan: {
        type: String,
        enum: ["free", "pro", "enterprise"],
        default: "free"
      },
      status: {
        type: String,
        enum: ["active", "inactive", "suspended"],
        default: "active"
      },
      expiresAt: Date
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
workspaceSchema.index({ owner: 1 });
workspaceSchema.index({ "members.user": 1 });
workspaceSchema.index({ isActive: 1 });

// Virtual for member count
workspaceSchema.virtual("memberCount").get(function() {
  return this.members && Array.isArray(this.members) ? this.members.filter(member => member.status === "active").length : 0;
});

// Virtual for project count
workspaceSchema.virtual("projectCount", {
  ref: "Project",
  localField: "_id",
  foreignField: "workspace",
  count: true
});

// Ensure virtual fields are serialized
workspaceSchema.set("toJSON", { virtuals: true });
workspaceSchema.set("toObject", { virtuals: true });

// Method to check if user is member
workspaceSchema.methods.isMember = function(userId) {
  return this.members.some(member => 
    member.user.toString() === userId.toString() && member.status === "active"
  );
};

// Method to check if user can manage workspace
workspaceSchema.methods.canBeManagedBy = function(user) {
  // Owner can manage
  if (this.owner.toString() === user._id.toString()) {
    return true;
  }
  
  // Admin can manage
  const member = this.members.find(m => 
    m.user.toString() === user._id.toString() && m.status === "active"
  );
  return member && member.role === "admin";
};

// Method to add member
workspaceSchema.methods.addMember = function(userId, role = "member", invitedBy = null) {
  const existingMember = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  
  if (existingMember) {
    existingMember.status = "active";
    existingMember.role = role;
    return existingMember;
  }
  
  this.members.push({
    user: userId,
    role: role,
    invitedBy: invitedBy,
    joinedAt: new Date(),
    status: "active"
  });
  
  return this.members[this.members.length - 1];
};

// Method to remove member
workspaceSchema.methods.removeMember = function(userId) {
  const memberIndex = this.members.findIndex(member => 
    member.user.toString() === userId.toString()
  );
  
  if (memberIndex === -1) {
    return false;
  }
  
  this.members.splice(memberIndex, 1);
  return true;
};

// Method to update member role
workspaceSchema.methods.updateMemberRole = function(userId, newRole) {
  const member = this.members.find(member => 
    member.user.toString() === userId.toString() && member.status === "active"
  );
  
  if (!member) {
    return false;
  }
  
  member.role = newRole;
  return member;
};

export const Workspace = mongoose.model("Workspace", workspaceSchema);
