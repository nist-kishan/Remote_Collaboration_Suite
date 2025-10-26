export const validateEnvironment = () => {
  const requiredVars = [
    "ACCESS_TOKEN_SECRET",
    "REFRESH_TOKEN_SECRET",
    "MONGODB_URI",
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0 && process.env.NODE_ENV === "production") {
    process.exit(1);
  }
};
