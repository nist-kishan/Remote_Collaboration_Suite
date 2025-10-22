import mongoose from "mongoose";

const whiteboardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    canvasData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "active",
    },
    visibility: {
      type: String,
      enum: ["private", "shared"],
      default: "private",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    version: {
      type: Number,
      default: 1,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    collaborators: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["owner", "editor", "viewer"],
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Canvas settings
    canvasSettings: {
      width: {
        type: Number,
        default: 1920,
      },
      height: {
        type: Number,
        default: 1080,
      },
      backgroundColor: {
        type: String,
        default: "#ffffff",
      },
      gridSize: {
        type: Number,
        default: 20,
      },
      showGrid: {
        type: Boolean,
        default: true,
      },
    },
    // Collaboration settings
    collaborationSettings: {
      allowAnonymousView: {
        type: Boolean,
        default: false,
      },
      maxCollaborators: {
        type: Number,
        default: 50,
      },
      autoSave: {
        type: Boolean,
        default: true,
      },
      autoSaveInterval: {
        type: Number,
        default: parseInt(process.env.CALL_TIMEOUT_MS) || 30000, // 30 seconds
      },
    },
  },
  { timestamps: true }
);

// Indexes for better performance
whiteboardSchema.index({ owner: 1, isDeleted: 1 });
whiteboardSchema.index({ "collaborators.user": 1, isDeleted: 1 });
whiteboardSchema.index({ status: 1, visibility: 1 });
whiteboardSchema.index({ title: "text", description: "text" });

// Virtual for whiteboard type
whiteboardSchema.virtual("whiteboardType").get(function () {
  if (this.visibility === "private") {
    return "own";
  } else if (this.visibility === "shared") {
    return "shared";
  }
  return "draft";
});

// Method to check if user has permission
whiteboardSchema.methods.hasPermission = function (userId, requiredRole) {
  // Owner always has all permissions
  const ownerId = this.owner?._id ? this.owner._id.toString() : this.owner.toString();
  const userIdStr = userId?._id ? userId._id.toString() : userId.toString();
  
  if (ownerId === userIdStr) {
    return true;
  }

  const collaborator = this.collaborators.find(
    (col) => {
      const colUserId = col.user?._id ? col.user._id.toString() : col.user.toString();
      return colUserId === userIdStr;
    }
  );

  if (!collaborator) {
    return false;
  }

  const roleHierarchy = {
    viewer: 1,
    editor: 2,
    owner: 3,
  };

  const userRoleLevel = roleHierarchy[collaborator.role] || 0;
  const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

  return userRoleLevel >= requiredRoleLevel;
};

// Method to get user's role in whiteboard
whiteboardSchema.methods.getUserRole = function (userId) {
  // Check if user is the owner
  const ownerId = this.owner?._id ? this.owner._id.toString() : this.owner.toString();
  const userIdStr = userId?._id ? userId._id.toString() : userId.toString();
  
  if (ownerId === userIdStr) {
    return "owner";
  }

  // Check if user is a collaborator
  const collaborator = this.collaborators.find(
    (col) => {
      const colUserId = col.user?._id ? col.user._id.toString() : col.user.toString();
      return colUserId === userIdStr;
    }
  );

  return collaborator ? collaborator.role : null;
};

// Method to check if user can edit
whiteboardSchema.methods.canEdit = function (userId) {
  return this.hasPermission(userId, "editor");
};

// Method to check if user can view
whiteboardSchema.methods.canView = function (userId) {
  return this.hasPermission(userId, "viewer");
};

// Method to check if user can share
whiteboardSchema.methods.canShare = function (userId) {
  return this.hasPermission(userId, "owner");
};

// Pre-save middleware to update version
whiteboardSchema.pre("save", function (next) {
  if (this.isModified("canvasData") && !this.isNew) {
    this.version += 1;
  }
  next();
});

// Method to get active collaborators count
whiteboardSchema.methods.getActiveCollaboratorsCount = function () {
  return this.collaborators.length + 1; // +1 for owner
};

// Method to check if whiteboard is full
whiteboardSchema.methods.isFull = function () {
  return this.getActiveCollaboratorsCount() >= this.collaborationSettings.maxCollaborators;
};

const Whiteboard = mongoose.model("Whiteboard", whiteboardSchema);

export default Whiteboard;
