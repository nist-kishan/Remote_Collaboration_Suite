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
  getDocumentById,
  getDocumentComments,
  addComment,
  updateComment,
  deleteComment,
  updateDocumentCollaborationSettings,
  getDocumentCollaborationSettings,
  getAllDocuments,
  downloadDocument,
} from "../controllers/document.controller.js";

const documentRouter = Router();

// Apply authentication middleware to all routes
documentRouter.use(verifyToken);

// Document CRUD routes
documentRouter.route("/").post(createDocument);
documentRouter.route("/").get(getUserDocuments);
documentRouter.route("/all").get(getAllDocuments);
documentRouter.route("/:documentId").get(getDocument);
documentRouter.route("/:documentId").put(updateDocument);
documentRouter.route("/:documentId").delete(deleteDocument);

// Download route
documentRouter.route("/:documentId/download").get(downloadDocument);

// Collaboration settings routes
documentRouter.route("/:documentId/collaboration-settings").get(getDocumentCollaborationSettings);
documentRouter.route("/:documentId/collaboration-settings").put(updateDocumentCollaborationSettings);

// Auto-save routes
documentRouter.route("/:documentId/autosave").post(autoSaveDocument);
documentRouter.route("/:documentId/enable-autosave").post(enableAutoSave);

// Comment routes
documentRouter.route("/:documentId/comments").get(getDocumentComments);
documentRouter.route("/:documentId/comments").post(addComment);
documentRouter.route("/:documentId/comments/:commentId").put(updateComment);
documentRouter.route("/:documentId/comments/:commentId").delete(deleteComment);

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
