import { Router } from "express";
import { 
    registerUser,
    loginUser,
    logoutUser,
    getUserDetails,
    updateUserDetails,
    getAllUsersAndStats // <<< CRITICAL: NOW IMPORTED
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const userRouter = Router();

// userRouter.post("/forgot-password", forgotPassword);
// userRouter.post("/reset-password/:token", resetPassword);
userRouter.route("/register").post(upload.single("profilePhoto"),registerUser);
userRouter.route("/login").post(loginUser);
userRouter.route("/logout").post(verifyJWT, logoutUser);
userRouter.route("/profile").get(verifyJWT, getUserDetails);
userRouter.route("/profile").put(verifyJWT, upload.single("profilePhoto"), updateUserDetails);

// NEW ADMIN ROUTE
userRouter.route("/list-all").get(verifyJWT, getAllUsersAndStats); 

export default userRouter;