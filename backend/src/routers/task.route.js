import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  createTask,
  getProjectTasks,
  getTask,
  updateTask,
  moveTask,
  deleteTask,
  addTaskComment,
  logTaskTime,
  getTaskStats,
  getAllKanbanBoards
} from "../controllers/task.controller.js";

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Get all Kanban boards route
router.route("/kanban-boards")
  .get(getAllKanbanBoards);

// Task CRUD routes
router.route("/projects/:projectId/tasks")
  .post(createTask)
  .get(getProjectTasks);

router.route("/tasks/:taskId")
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

// Task management routes
router.route("/tasks/:taskId/move")
  .patch(moveTask);

router.route("/tasks/:taskId/comments")
  .post(addTaskComment);

router.route("/tasks/:taskId/time-log")
  .post(logTaskTime);

// Statistics
router.route("/projects/:projectId/task-stats")
  .get(getTaskStats);

export { router as taskRouter };
