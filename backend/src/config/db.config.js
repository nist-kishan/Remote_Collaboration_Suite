import mongoose from "mongoose";

export const DbConnection = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME;
    await mongoose.connect(uri, {
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE),
      serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT),
      socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT),
      connectTimeoutMS: parseInt(process.env.DB_CONNECT_TIMEOUT),
      retryWrites: process.env.DB_RETRY_WRITES === 'true',
      retryReads: process.env.DB_RETRY_READS === 'true',
    });

    console.log("MongoDB connection established successfully!");

    mongoose.connection.on("connected", () => {
      console.log("MongoDB connected successfully");
    });

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected successfully");
    });
  } catch (err) {
    setTimeout(() => {
      DbConnection();
    }, parseInt(process.env.DB_RECONNECT_INTERVAL));
  }
};
