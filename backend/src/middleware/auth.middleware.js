import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken || req.headers["authorization"]?.split(" ")[1];

    if (!token) {
      throw new ApiError(401, "No token Founded");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decodedToken) {
      throw new ApiError(401, "Invalid token");
    }

    const user = await User.findById(decodedToken?.id).select(
      "-password -refreshToken -resetPasswordToken -resetPasswordExpires -otp"
    );
    
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Add id property for consistency with JWT payload
    req.user = user;
    req.user.id = user._id.toString();
    next();
  } catch (error) {
    return next(new ApiError(401, error.message || "Invalid or expired token"));
  }
};
