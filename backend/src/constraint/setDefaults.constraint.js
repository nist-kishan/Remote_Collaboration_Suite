export const setDefaults = () => {
  if (!process.env.ACCESS_TOKEN_SECRET) {
    process.env.ACCESS_TOKEN_SECRET =
      "your_access_token_secret_key_here_make_it_long_and_secure_123456789";
  }

  if (!process.env.REFRESH_TOKEN_SECRET) {
    process.env.REFRESH_TOKEN_SECRET =
      "your_refresh_token_secret_key_here_make_it_long_and_secure_123456789";
  }

  if (!process.env.ACCESS_TOKEN_EXPIRY) {
    process.env.ACCESS_TOKEN_EXPIRY = "15m";
  }

  if (!process.env.REFRESH_TOKEN_EXPIRY) {
    process.env.REFRESH_TOKEN_EXPIRY = "7d";
  }

  if (!process.env.MONGODB_URI) {
    process.env.MONGODB_URI =
      "mongodb://localhost:27017/remote_work_collaboration";
  }

  if (!process.env.FRONTEND_URL) {
    process.env.FRONTEND_URL = "http://localhost:5173";
  }

  if (!process.env.FRONTEND_URI) {
    process.env.FRONTEND_URI = process.env.FRONTEND_URL;
  }

  if (process.env.NODE_ENV === "production") {
    if (!process.env.PORT) {
      process.env.PORT = 5000;
    }
  }
};
