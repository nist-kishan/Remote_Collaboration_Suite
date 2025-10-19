import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    countrycode: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      minlength: 9,
      maxlength: 12,
      unique: true,
    },
    otp: {
      type: Number,
    },
    optExpire: {
      type: Date,
    },
    isVerify: {
      type: Boolean,
      default: false,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    avatar: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    theme: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    refreshToken: {
      type: String,
    },
    role: {
      type: String,
      enum: ["admin", "hr", "project_manager", "employee"],
      default: "employee"
    },
    department: {
      type: String,
      trim: true,
      maxlength: [50, "Department name cannot exceed 50 characters"]
    },
    position: {
      type: String,
      trim: true,
      maxlength: [100, "Position cannot exceed 100 characters"]
    },
    employeeId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true // Allows multiple null values
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    permissions: [{
      type: String,
      enum: [
        "create_projects", "edit_all_projects", "delete_projects",
        "manage_users", "assign_roles", "view_analytics",
        "manage_teams", "create_meetings"
      ],
    }],
    // Profile information
    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"]
    },
    skills: [{
      type: String,
      trim: true
    }],
    joinDate: {
      type: Date,
      default: Date.now
    },
    lastActive: {
      type: Date,
      default: Date.now
    },
  },
  { timestamps: true }
);

UserSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();
  const salt = bcrypt.genSaltSync(10);
  this.password = bcrypt.hashSync(this.password, salt);
  next();
})

UserSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password,this.password)
}

UserSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
}

UserSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

// Role-based access control methods
UserSchema.methods.hasRole = function (role) {
  return this.role === role;
};

UserSchema.methods.hasPermission = function (permission) {
  // Admin has all permissions
  if (this.role === "admin") {
    return true;
  }
  
  // Check specific permissions
  return this.permissions.includes(permission);
};

UserSchema.methods.isAdmin = function () {
  return this.role === "admin";
};

UserSchema.methods.isHR = function () {
  return this.role === "hr" || this.role === "admin";
};

UserSchema.methods.isProjectManager = function () {
  return this.role === "project_manager" || this.role === "hr" || this.role === "admin";
};

UserSchema.methods.isEmployee = function () {
  return this.role === "employee";
};

UserSchema.methods.canManageUsers = function () {
  return this.role === "admin" || this.role === "hr";
};

UserSchema.methods.canManageProjects = function () {
  return this.role === "admin" || this.role === "hr" || this.role === "project_manager";
};

UserSchema.methods.canAssignRoles = function () {
  return this.role === "admin";
};

// Get role hierarchy level (higher number = more permissions)
UserSchema.methods.getRoleLevel = function () {
  const roleLevels = {
    employee: 1,
    project_manager: 2,
    hr: 3,
    admin: 4
  };
  return roleLevels[this.role] || 0;
};

// Check if user can manage another user
UserSchema.methods.canManageUser = function (targetUser) {
  // Admin can manage everyone
  if (this.role === "admin") {
    return true;
  }
  
  // HR can manage project managers and employees
  if (this.role === "hr") {
    return targetUser.role === "project_manager" || targetUser.role === "employee";
  }
  
  // Project managers can manage employees
  if (this.role === "project_manager") {
    return targetUser.role === "employee";
  }
  
  return false;
};

const User = mongoose.model("User", UserSchema);

export default User;
