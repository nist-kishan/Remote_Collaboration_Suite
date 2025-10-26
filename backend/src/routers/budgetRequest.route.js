import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  createBudgetRequest,
  getBudgetRequests,
  approveBudgetRequest,
  rejectBudgetRequest,
  getUserBudgetRequests
} from "../controllers/budgetRequest.controller.js";

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Project budget request routes
router.route("/projects/:projectId/budget-requests")
  .post(createBudgetRequest)
  .get(getBudgetRequests);

// Budget request actions
router.route("/budget-requests/:requestId/approve")
  .post(approveBudgetRequest);

router.route("/budget-requests/:requestId/reject")
  .post(rejectBudgetRequest);

// User budget requests
router.route("/budget-requests/user")
  .get(getUserBudgetRequests);

export { router as budgetRequestRouter };

