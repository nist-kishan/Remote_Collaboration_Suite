import mongoose from "mongoose";

export const DbConnection = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME;
    
    // Basic MongoDB connection options for compatibility
    await mongoose.connect(uri, {
      // Essential connection settings
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
      serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT) || 10000,
      socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT) || 45000,
      connectTimeoutMS: parseInt(process.env.DB_CONNECT_TIMEOUT) || 10000,
      
      // Enable retries for better reliability
      retryWrites: process.env.DB_RETRY_WRITES === 'true' || true,
      retryReads: process.env.DB_RETRY_READS === 'true' || true,
    });

    // Handle connection events
    mongoose.connection.on('connected', () => {
    });

    mongoose.connection.on('error', (err) => {
      // Error handled by connection retry logic
    });

    mongoose.connection.on('disconnected', () => {
    });

    mongoose.connection.on('reconnected', () => {
    });

    // Database connected successfully
  } catch (err) {
    // Retry connection automatically
    setTimeout(() => {
      DbConnection();
    }, parseInt(process.env.DB_RECONNECT_INTERVAL) || 5000);
  }
};
