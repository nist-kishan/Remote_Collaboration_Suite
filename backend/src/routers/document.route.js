import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  createDocument,
  getUserDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  shareDocument,
  updateCollaboratorRole,
  removeCollaborator,
  shareDocumentViaEmail,
  getDocumentPreview,
  searchDocuments,
  autoSaveDocument,
  enableAutoSave,
} from "../controllers/document.controller.js";

const documentRouter = Router();

// Apply authentication middleware to all routes
documentRouter.use(verifyToken);

// Document CRUD routes
documentRouter.route("/").post(createDocument);
documentRouter.route("/").get(getUserDocuments);
documentRouter.route("/:documentId").get(getDocument);
documentRouter.route("/:documentId").put(updateDocument);
documentRouter.route("/:documentId").delete(deleteDocument);

// Auto-save routes
documentRouter.route("/:documentId/autosave").post(autoSaveDocument);
documentRouter.route("/:documentId/enable-autosave").post(enableAutoSave);

// Sharing routes
documentRouter.route("/:documentId/share").post(shareDocument);
documentRouter.route("/:documentId/collaborators/:userId/role").put(updateCollaboratorRole);
documentRouter.route("/:documentId/collaborators/:userId").delete(removeCollaborator);


// Email sharing route
documentRouter.route("/:documentId/share-email").post(shareDocumentViaEmail);

// Search route
documentRouter.route("/search").get(searchDocuments);

export { documentRouter };

// Public routes (no authentication required)
const publicDocumentRouter = Router();

// Document preview route (public access for shared documents)
publicDocumentRouter.route("/:documentId/preview").get(getDocumentPreview);

export { publicDocumentRouter };
