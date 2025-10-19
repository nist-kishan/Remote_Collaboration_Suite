import mongoose from "mongoose";

export const DbConnection = async () => {
  try {
    const uri = process.env.MONGO_URI;
    const dbName = process.env.DB_NAME;
    await mongoose.connect(uri, {
      autoIndex: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    // Database connected successfully
  } catch (err) {
    // Database connection error
    process.exit(1);
  }
};
