import mongoose from "mongoose";

export const DbConnection = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME;
    
    // Basic MongoDB connection options for compatibility
    await mongoose.connect(uri, {
      // Essential connection settings
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      
      // Enable retries for better reliability
      retryWrites: true,
      retryReads: true,
    });

    // Handle connection events
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    // Database connected successfully
    console.log('🗄️ Database connection established');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    // Don't exit immediately, let the app try to reconnect
    setTimeout(() => {
      console.log('🔄 Attempting to reconnect to database...');
      DbConnection();
    }, 5000);
  }
};
