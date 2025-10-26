import dotenv from "dotenv";
import { createServer } from "http";
import app from "./app.js";
import SocketServer from "./socket/socketServer.js";
import { DbConnection } from "./config/db.config.js";
import { validateEnvironment } from "./constraint/validateEnvironment.constraint.js";
import { setDefaults } from "./constraint/setDefaults.constraint.js";
import { startMeetingCleanupScheduler } from "./services/meetingCleanup.service.js";
dotenv.config();

validateEnvironment();
setDefaults();

const PORT = process.env.PORT;
const NODE_ENV = process.env.NODE_ENV;

const gracefulShutdown = (server) => {
  const shutdown = (signal) => {
    server.close(() => {
      if (global.mongoose && global.mongoose.connection) {
        global.mongoose.connection.close(() => {
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });
    setTimeout(() => {
      process.exit(1);
    }, parseInt(process.env.GRACEFUL_SHUTDOWN_TIMEOUT));
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

DbConnection()
  .then(() => {
    console.log("✅ Database connected. Starting server...");

    const server = createServer(app);
    const socketServer = new SocketServer(server);
    console.log("🔌 Socket server initialized.");

    // Start meeting cleanup scheduler
    startMeetingCleanupScheduler();

    server.listen(PORT, "0.0.0.0", () => {
      if (NODE_ENV === "production") {
        const productionUrl =
          process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
        console.log(`Server running in production at: ${productionUrl}`);
      } else {
        console.log(`Server running at: http://localhost:${PORT}`);
      }
    });

    gracefulShutdown(server);

    server.on("error", (error) => {
      if (error.syscall !== "listen") throw error;

      const bind = typeof PORT === "string" ? `Pipe ${PORT}` : `Port ${PORT}`;

      switch (error.code) {
        case "EACCES":
          console.error(`${bind} requires elevated privileges`);
          process.exit(1);
        case "EADDRINUSE":
          console.error(`${bind} is already in use`);
          process.exit(1);
        default:
          throw error;
      }
    });
  })
  .catch((err) => {
    console.error("🚨 Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
