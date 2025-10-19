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
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// Set secure default environment variables
const setDefaults = () => {
  if (!process.env.ACCESS_TOKEN_SECRET) {
    console.warn('⚠️ ACCESS_TOKEN_SECRET not set, using default (NOT SECURE FOR PRODUCTION)');
    process.env.ACCESS_TOKEN_SECRET = "your_access_token_secret_key_here_make_it_long_and_secure_123456789";
  }
  
  if (!process.env.REFRESH_TOKEN_SECRET) {
    console.warn('⚠️ REFRESH_TOKEN_SECRET not set, using default (NOT SECURE FOR PRODUCTION)');
    process.env.REFRESH_TOKEN_SECRET = "your_refresh_token_secret_key_here_make_it_long_and_secure_123456789";
  }
  
  if (!process.env.ACCESS_TOKEN_EXPIRY) {
    process.env.ACCESS_TOKEN_EXPIRY = "15m";
  }
  
  if (!process.env.REFRESH_TOKEN_EXPIRY) {
    process.env.REFRESH_TOKEN_EXPIRY = "7d";
  }
  
  if (!process.env.MONGODB_URI) {
    console.warn('⚠️ MONGODB_URI not set, using default local MongoDB');
    process.env.MONGODB_URI = "mongodb://localhost:27017/remote_work_collaboration";
  }
  
  if (!process.env.FRONTEND_URL) {
    console.warn('⚠️ FRONTEND_URL not set, using default local URL');
    process.env.FRONTEND_URL = "http://localhost:5173";
  }
  
  // Production-specific settings
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.PORT) {
      console.warn('⚠️ PORT not set, using default port 5000');
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
    console.log(`\n🛑 ${signal} received. Starting graceful shutdown...`);
    
    server.close(() => {
      console.log('✅ HTTP server closed');
      
      // Close database connection
      if (global.mongoose && global.mongoose.connection) {
        global.mongoose.connection.close(() => {
          console.log('✅ Database connection closed');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });
    
    // Force close after 30 seconds
    setTimeout(() => {
      console.error('❌ Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
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
      console.log('🚀 Server Information:');
      console.log(`   Environment: ${NODE_ENV}`);
      console.log(`   Port: ${PORT}`);
      console.log(`   Frontend URL: ${process.env.FRONTEND_URL}`);
      console.log(`   Database: ${process.env.MONGODB_URI?.replace(/\/\/.*@/, '//***:***@')}`);
      console.log(`   Access Token Expiry: ${process.env.ACCESS_TOKEN_EXPIRY}`);
      console.log(`   Refresh Token Expiry: ${process.env.REFRESH_TOKEN_EXPIRY}`);
      console.log(`   Server URL: http://localhost:${PORT}`);
      console.log(`   API Base URL: http://localhost:${PORT}/api/v1`);
      console.log('✅ Server started successfully!');
      console.log('📡 Socket.IO server initialized');
      
      if (NODE_ENV === 'production') {
        console.log('🔒 Production mode enabled');
      } else {
        console.log('🔧 Development mode enabled');
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
          console.error(`❌ ${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`❌ ${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
    console.error('🔧 Make sure MongoDB is running and MONGODB_URI is correct');
    process.exit(1);
  });