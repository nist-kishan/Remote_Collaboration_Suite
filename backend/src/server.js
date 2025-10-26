import dotenv from "dotenv";
import { createServer } from "http";
import app from "./app.js";
import SocketServer from "./socket/socketServer.js";
import { DbConnection } from "./config/db.config.js";

// Load environment variables
dotenv.config();

// Production environment validation
const validateEnvironment = () => {
  const requiredVars = [
    'ACCESS_TOKEN_SECRET',
    'REFRESH_TOKEN_SECRET',
    'MONGODB_URI'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0 && process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
};

// Set secure default environment variables
const setDefaults = () => {
  if (!process.env.ACCESS_TOKEN_SECRET) {
    process.env.ACCESS_TOKEN_SECRET = "your_access_token_secret_key_here_make_it_long_and_secure_123456789";
  }
  
  if (!process.env.REFRESH_TOKEN_SECRET) {
    process.env.REFRESH_TOKEN_SECRET = "your_refresh_token_secret_key_here_make_it_long_and_secure_123456789";
  }
  
  if (!process.env.ACCESS_TOKEN_EXPIRY) {
    process.env.ACCESS_TOKEN_EXPIRY = "15m";
  }
  
  if (!process.env.REFRESH_TOKEN_EXPIRY) {
    process.env.REFRESH_TOKEN_EXPIRY = "7d";
  }
  
  if (!process.env.MONGODB_URI) {
    process.env.MONGODB_URI = "mongodb://localhost:27017/remote_work_collaboration";
  }
  
  if (!process.env.FRONTEND_URL) {
    process.env.FRONTEND_URL = "http://localhost:5173";
  }
  
  // Set FRONTEND_URI for backward compatibility
  if (!process.env.FRONTEND_URI) {
    process.env.FRONTEND_URI = process.env.FRONTEND_URL;
  }
  
  // Production-specific settings
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.PORT) {
      process.env.PORT = 5000;
    }
  }
};

// Initialize environment
validateEnvironment();
setDefaults();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Graceful shutdown handling
const gracefulShutdown = (server) => {
  const shutdown = (signal) => {
    
    server.close(() => {
      
      // Close database connection
      if (global.mongoose && global.mongoose.connection) {
        global.mongoose.connection.close(() => {
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });
    
    // Force close after 30 seconds
    setTimeout(() => {
      process.exit(1);
    }, parseInt(process.env.GRACEFUL_SHUTDOWN_TIMEOUT) || 30000);
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

// Start server
DbConnection()
  .then(() => {
    const server = createServer(app);
    
    // Initialize Socket.IO server
    const socketServer = new SocketServer(server);
    
    server.listen(PORT, '0.0.0.0', () => {
      
      // Show correct URLs based on environment
      if (NODE_ENV === 'production') {
        const productionUrl = process.env.RENDER_EXTERNAL_URL || `https://remote-collaboration-suite.onrender.com`;
      } else {
      }
      
    });
    
    // Set up graceful shutdown
    gracefulShutdown(server);
    
    // Handle server errors
    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }
      
      const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;
      
      switch (error.code) {
        case 'EACCES':
          process.exit(1);
          break;
        case 'EADDRINUSE':
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
  })
  .catch((err) => {
    process.exit(1);
  });