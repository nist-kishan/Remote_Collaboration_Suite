import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/role.middleware.js";
import {
  getCurrentUser,
  getUserRoles,
  updateUserRole,
  getAllUsers,
  searchUsers,
} from "../controllers/user.controller.js";

const userRouter = Router();

// Apply authentication middleware to all routes
userRouter.use(verifyToken);

// User profile routes
userRouter.route("/profile").get(getCurrentUser);
userRouter.route("/roles").get(getUserRoles);

// User search for chat
userRouter.route("/search").get(searchUsers);

// Admin only routes
userRouter.route("/").get(requireAdmin, getAllUsers);
userRouter.route("/:userId/role").put(requireAdmin, updateUserRole);

export { userRouter };
