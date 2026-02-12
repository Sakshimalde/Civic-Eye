import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // Extract token from cookies or Authorization header
    const token =
      req.cookies.accessToken ||
      req.headers.authorization?.split(" ")[1];

    console.log("----- JWT DEBUG START -----");
    console.log("Token received:", token);
    console.log("Authorization header:", req.headers.authorization);
    console.log("ACCESS_TOKEN_SECRET:", process.env.ACCESS_TOKEN_SECRET);

    if (!token) {
      console.log("❌ No token found");
      throw new ApiError(401, "Authentication token is required");
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    console.log("✅ Decoded token:", decoded);

    if (!decoded || !decoded._id) {
      console.log("❌ Decoded token invalid");
      throw new ApiError(401, "Invalid token");
    }

    // Find user by ID
    const user = await User.findById(decoded._id).select("-password -refreshToken");

    if (!user) {
      console.log("❌ User not found in DB");
      throw new ApiError(404, "User not found");
    }

    console.log("✅ User verified:", user._id);
    console.log("----- JWT DEBUG END -----");

    req.user = user;
    next();

  } catch (error) {
    console.log("🚨 JWT ERROR:", error.message);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error.name === "JsonWebTokenError") {
      throw new ApiError(401, "Invalid token");
    }

    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Token has expired");
    }

    throw new ApiError(401, `JWT verification failed: ${error.message}`);
  }
});
