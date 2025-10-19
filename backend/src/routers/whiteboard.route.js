import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  createWhiteboard,
  getUserWhiteboards,
  getWhiteboard,
  updateWhiteboard,
  deleteWhiteboard,
  shareWhiteboard,
  updateCollaboratorRole,
  removeCollaborator,
  shareWhiteboardViaEmail,
  getWhiteboardPreview,
  searchWhiteboards,
} from "../controllers/whiteboard.controller.js";

const whiteboardRouter = Router();

// Apply authentication middleware to all routes
whiteboardRouter.use(verifyToken);

// Whiteboard CRUD routes
whiteboardRouter.route("/").post(createWhiteboard);
whiteboardRouter.route("/").get(getUserWhiteboards);
whiteboardRouter.route("/:whiteboardId").get(getWhiteboard);
whiteboardRouter.route("/:whiteboardId").put(updateWhiteboard);
whiteboardRouter.route("/:whiteboardId").delete(deleteWhiteboard);

// Sharing routes
whiteboardRouter.route("/:whiteboardId/share").post(shareWhiteboard);
whiteboardRouter.route("/:whiteboardId/collaborators/:userId/role").put(updateCollaboratorRole);
whiteboardRouter.route("/:whiteboardId/collaborators/:userId").delete(removeCollaborator);

// Email sharing route
whiteboardRouter.route("/:whiteboardId/share-email").post(shareWhiteboardViaEmail);

// Search route
whiteboardRouter.route("/search").get(searchWhiteboards);

export { whiteboardRouter };

// Public routes (no authentication required)
const publicWhiteboardRouter = Router();

// Whiteboard preview route (public access for shared whiteboards)
publicWhiteboardRouter.route("/:whiteboardId/preview").get(getWhiteboardPreview);

export { publicWhiteboardRouter };
