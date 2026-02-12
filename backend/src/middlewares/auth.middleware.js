import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // Extract token from cookies or Authorization header
    const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new ApiError(401, "Authentication token is required");
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    if (!decoded || !decoded._id) {
      throw new ApiError(401, "Invalid token");
    }

    // Find user by ID from decoded token
    const user = await User.findById(decoded._id).select("-password -refreshToken");
    
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Attach user to request object
    req.user = user;
    next();
    
  } catch (error) {
    // If it's already an ApiError, just throw it
    if (error instanceof ApiError) {
      throw error;
    }
    
    // For JWT errors or other errors
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(401, "Invalid token");
    }
    
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, "Token has expired");
    }
    
    // Generic JWT verification error
    throw new ApiError(401, `JWT verification failed: ${error.message}`);
  }
});