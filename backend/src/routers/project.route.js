import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import {
  getAllProjects,
  getProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  updateMemberRole,
  searchWorkspaceMembers,
  uploadDocument
} from "../controllers/project.controller.js";

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Get all projects route
router.route("/all")
  .get(getAllProjects);

// Project CRUD routes
router.route("/:projectId")
  .get(getProject)
  .put(updateProject)
  .delete(deleteProject);

// Upload document route
router.route("/:projectId/documents/upload")
  .post(upload.single('file'), uploadDocument);

// Project member management routes
router.route("/:projectId/members")
  .post(addProjectMember);

router.route("/:projectId/members/:userId")
  .delete(removeProjectMember)
  .put(updateMemberRole);

// Search routes
router.route("/:projectId/search-members")
  .get(searchWorkspaceMembers);

export { router as projectRouter };