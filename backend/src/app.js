import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { 
  securityHeaders, 
  apiLimiter, 
  authLimiter, 
  uploadLimiter,
  sanitizeMongo, 
  preventHPP, 
  xssProtection, 
  corsOptions, 
  securityErrorHandler,
  securityLogger 
} from "./middleware/security.middleware.js";
import { authRouter } from "./routers/auth.route.js";
import { documentRouter, publicDocumentRouter } from "./routers/document.route.js";
import { whiteboardRouter, publicWhiteboardRouter } from "./routers/whiteboard.route.js";
import { userRouter } from "./routers/user.route.js";
import { chatRouter } from "./routers/chat.route.js";
import { callRouter } from "./routers/call.route.js";
import { projectRouter } from "./routers/project.route.js";
import workspaceRouter from "./routers/workspace.route.js";
import { taskRouter } from "./routers/task.route.js";
import { meetingRouter } from "./routers/meeting.route.js";
import { notificationRouter } from "./routers/notification.route.js";

const app = express();

// Trust proxy for production deployment (Render, Heroku, etc.)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security middleware (order matters!)
app.use(securityHeaders);
app.use(securityLogger);
app.use(compression());
app.use(cors(corsOptions)); // CORS middleware must be before other middleware
app.use(sanitizeMongo);
app.use(preventHPP);
app.use(xssProtection);

// Body parsing middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiting middleware
app.use('/api/', apiLimiter);
app.use('/api/v1/auth/', authLimiter);
app.use('/api/v1/documents/upload', uploadLimiter);
app.use('/api/v1/whiteboards/upload', uploadLimiter);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    message: "Api connection is running",
  });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/documents", documentRouter);
app.use("/api/v1/public/documents", publicDocumentRouter);
app.use("/api/v1/whiteboards", whiteboardRouter);
app.use("/api/v1/public/whiteboards", publicWhiteboardRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/chat", chatRouter);
app.use("/api/v1/call", callRouter);
app.use("/api/v1/workspaces", workspaceRouter);
app.use("/api/v1/projects", projectRouter);
app.use("/api/v1", taskRouter);
app.use("/api/v1", meetingRouter);
app.use("/api/v1/notifications", notificationRouter);

// Security error handling (must be before main error middleware)
app.use(securityErrorHandler);

// Main error handling middleware (must be last)
app.use(errorMiddleware);

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

export default app;
