import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      default: "",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
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
    // Auto-save fields
    autoSavedAt: {
      type: Date,
    },
    isAutoSaveEnabled: {
      type: Boolean,
      default: false,
    },
    lastAutoSaveContent: {
      type: String,
      default: "",
    },
    // Collaboration settings
    collaborationSettings: {
      autoSave: {
        type: Boolean,
        default: true,
      },
      autoSaveInterval: {
        type: Number,
        default: 30000, // 30 seconds
      },
      allowAnonymousView: {
        type: Boolean,
        default: false,
      },
      maxCollaborators: {
        type: Number,
        default: 50,
      },
      allowComments: {
        type: Boolean,
        default: true,
      },
      allowReactions: {
        type: Boolean,
        default: true,
      },
      requireApprovalForJoin: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true }
);

// Indexes for better performance
documentSchema.index({ owner: 1, isDeleted: 1 });
documentSchema.index({ "collaborators.user": 1, isDeleted: 1 });
documentSchema.index({ status: 1, visibility: 1 });
documentSchema.index({ title: "text", content: "text" });

// Virtual for document type
documentSchema.virtual("documentType").get(function () {
  if (this.visibility === "private") {
    return "own";
  } else if (this.visibility === "shared") {
    return "shared";
  }
  return "draft";
});

// Method to check if user has permission
documentSchema.methods.hasPermission = function (userId, requiredRole) {
  // Handle both populated and unpopulated owner fields
  const ownerId = this.owner._id ? this.owner._id.toString() : this.owner.toString();
  
  // Owner always has all permissions
  if (ownerId === userId.toString()) {
    return true;
  }

  const collaborator = this.collaborators.find(
    (col) => {
      const collaboratorId = col.user._id ? col.user._id.toString() : col.user.toString();
      return collaboratorId === userId.toString();
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

// Method to get user's role in document
documentSchema.methods.getUserRole = function (userId) {
  // Handle both populated and unpopulated owner fields
  const ownerId = this.owner._id ? this.owner._id.toString() : this.owner.toString();

  if (ownerId === userId.toString()) {
    return "owner";
  }

  const collaborator = this.collaborators.find(
    (col) => {
      const collaboratorId = col.user._id ? col.user._id.toString() : col.user.toString();
      return collaboratorId === userId.toString();
    }
  );

  return collaborator ? collaborator.role : null;
};

// Method to enable auto-save for saved documents
documentSchema.methods.enableAutoSave = function () {
  // Only enable auto-save for documents that are not in draft status
  if (this.status !== "draft") {
    this.isAutoSaveEnabled = true;
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to perform auto-save
documentSchema.methods.autoSave = function (newContent, userId) {
  // Only auto-save if enabled and document is not a draft
  if (this.isAutoSaveEnabled && this.status !== "draft") {
    this.content = newContent;
    this.lastAutoSaveContent = newContent;
    this.autoSavedAt = new Date();
    this.lastModifiedBy = userId;
    // Don't increment version for auto-save
    return this.save();
  }
  return Promise.resolve(this);
};

// Pre-save middleware to update version
documentSchema.pre("save", function (next) {
  if (this.isModified("content") && !this.isNew) {
    this.version += 1;
  }
  next();
});

const Document = mongoose.model("Document", documentSchema);

export default Document;
