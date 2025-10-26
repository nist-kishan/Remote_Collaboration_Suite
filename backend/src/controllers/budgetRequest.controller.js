import { asyncHandle } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { BudgetRequest } from "../models/budgetRequest.model.js";
import { Project } from "../models/project.model.js";
import { Notification } from "../models/notification.model.js";

// Create budget request
export const createBudgetRequest = asyncHandle(async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user._id;
  
  const {
    taskName,
    taskId,
    userName,
    amount,
    message
  } = req.body;

  if (!taskName || !userName || !amount || !message) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if project exists and user has access
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const teamMember = project.team.find(member => 
    member.user.toString() === userId.toString() && member.status === "active"
  );

  if (!teamMember) {
    throw new ApiError(403, "You don't have access to this project");
  }

  // Create budget request
  const budgetRequest = await BudgetRequest.create({
    project: projectId,
    task: {
      name: taskName,
      ...(taskId && taskId.trim() !== '' ? { _id: taskId } : {})
    },
    requestedBy: userId,
    userName,
    amount,
    currency: project.budget?.currency || "USD",
    message
  });

  await budgetRequest.populate([
    { path: "requestedBy", select: "name email avatar" },
    { path: "project", select: "name" }
  ]);

  // Notify HR and Owner
  const hrAndOwners = project.team.filter(member => 
    member.role === "hr" || member.role === "owner"
  );

  const notificationPromises = hrAndOwners.map(member =>
    Notification.createNotification(
      member.user,
      "budget_request",
      "Budget Request",
      `${userName} requested ${project.budget?.currency || "USD"} ${amount} for task "${taskName}"`,
      { budgetRequestId: budgetRequest._id, projectId: projectId },
      { 
        priority: "high"
      }
    )
  );

  await Promise.all(notificationPromises);

  return res.status(201).json(
    new ApiResponse(201, "Budget request created successfully", { budgetRequest })
  );
});

// Get budget requests for a project
export const getBudgetRequests = asyncHandle(async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user._id;

  // Check if project exists and user has access
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const teamMember = project.team.find(member => 
    member.user.toString() === userId.toString() && member.status === "active"
  );

  if (!teamMember) {
    throw new ApiError(403, "You don't have access to this project");
  }

  const { status } = req.query;

  const filter = { project: projectId };
  if (status) filter.status = status;

  const budgetRequests = await BudgetRequest.find(filter)
    .populate("requestedBy", "name email avatar")
    .populate("reviewedBy", "name email avatar")
    .populate("project", "name")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, "Budget requests retrieved successfully", { budgetRequests })
  );
});

// Approve budget request
export const approveBudgetRequest = asyncHandle(async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user._id;

  const budgetRequest = await BudgetRequest.findById(requestId).populate('project');
  if (!budgetRequest) {
    throw new ApiError(404, "Budget request not found");
  }

  const project = budgetRequest.project;

  // Check if user is HR or Owner
  const teamMember = project.team.find(member => 
    member.user.toString() === userId.toString() && member.status === "active"
  );

  if (!teamMember || (teamMember.role !== "hr" && teamMember.role !== "owner")) {
    throw new ApiError(403, "Only HR and Owner can approve budget requests");
  }

  // Check if already reviewed
  if (budgetRequest.status !== "pending") {
    throw new ApiError(400, "Budget request has already been reviewed");
  }

  // Approve the request
  budgetRequest.status = "approved";
  budgetRequest.reviewedBy = userId;
  budgetRequest.reviewedAt = new Date();
  await budgetRequest.save();

  // Update project budget
  project.budget.spent = (project.budget.spent || 0) + budgetRequest.amount;
  await project.save();

  // Notify the requester
  await Notification.createNotification(
    budgetRequest.requestedBy,
    "budget_approved",
    "Budget Approved",
    `Your budget request of ${budgetRequest.currency} ${budgetRequest.amount} for task "${budgetRequest.task.name}" has been approved`,
    { budgetRequestId: budgetRequest._id, projectId: project._id },
    { 
      priority: "high"
    }
  );

  return res.status(200).json(
    new ApiResponse(200, "Budget request approved successfully", { budgetRequest })
  );
});

// Reject budget request
export const rejectBudgetRequest = asyncHandle(async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user._id;
  const { reviewMessage } = req.body;

  const budgetRequest = await BudgetRequest.findById(requestId).populate('project');
  if (!budgetRequest) {
    throw new ApiError(404, "Budget request not found");
  }

  const project = budgetRequest.project;

  // Check if user is HR or Owner
  const teamMember = project.team.find(member => 
    member.user.toString() === userId.toString() && member.status === "active"
  );

  if (!teamMember || (teamMember.role !== "hr" && teamMember.role !== "owner")) {
    throw new ApiError(403, "Only HR and Owner can reject budget requests");
  }

  // Check if already reviewed
  if (budgetRequest.status !== "pending") {
    throw new ApiError(400, "Budget request has already been reviewed");
  }

  // Reject the request
  budgetRequest.status = "rejected";
  budgetRequest.reviewedBy = userId;
  budgetRequest.reviewMessage = reviewMessage;
  budgetRequest.reviewedAt = new Date();
  await budgetRequest.save();

  // Notify the requester
  await Notification.createNotification(
    budgetRequest.requestedBy,
    "budget_rejected",
    "Budget Rejected",
    `Your budget request of ${budgetRequest.currency} ${budgetRequest.amount} for task "${budgetRequest.task.name}" has been rejected${reviewMessage ? `: ${reviewMessage}` : ''}`,
    { budgetRequestId: budgetRequest._id, projectId: project._id },
    { 
      priority: "high"
    }
  );

  return res.status(200).json(
    new ApiResponse(200, "Budget request rejected successfully", { budgetRequest })
  );
});

// Get user's budget requests
export const getUserBudgetRequests = asyncHandle(async (req, res) => {
  const userId = req.user._id;

  const budgetRequests = await BudgetRequest.find({ requestedBy: userId })
    .populate("project", "name")
    .populate("reviewedBy", "name email avatar")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, "Budget requests retrieved successfully", { budgetRequests })
  );
});

