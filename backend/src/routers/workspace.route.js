import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  createWorkspace,
  getUserWorkspaces,
  getAllWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addWorkspaceMember,
  removeWorkspaceMember,
  updateMemberRole,
  searchUsersForWorkspace
} from "../controllers/workspace.controller.js";
import {
  createProject,
  getWorkspaceProjects
} from "../controllers/project.controller.js";

const workspaceRouter = Router();

// Apply authentication middleware to all routes
workspaceRouter.use(verifyToken);

// Workspace CRUD routes
workspaceRouter.route("/")
  .post(createWorkspace)
  .get(getUserWorkspaces);

// Get all workspaces with pagination and filtering
workspaceRouter.route("/all")
  .get(getAllWorkspaces);

workspaceRouter.route("/:workspaceId")
  .get(getWorkspace)
  .put(updateWorkspace)
  .delete(deleteWorkspace);

// Project routes
workspaceRouter.route("/:workspaceId/projects")
  .post(createProject)
  .get(getWorkspaceProjects);

// Member management routes
workspaceRouter.route("/:workspaceId/members")
  .post(addWorkspaceMember);

workspaceRouter.route("/:workspaceId/members/:userId")
  .delete(removeWorkspaceMember)
  .put(updateMemberRole);

// Search routes
workspaceRouter.route("/:workspaceId/search-users")
  .get(searchUsersForWorkspace);

export default workspaceRouter;
