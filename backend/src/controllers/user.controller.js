import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Complaint } from "../models/complaint.model.js"; // CRITICAL: Imported for stats
import { uploadOnCloudinary } from "../utils/cloudinary.js"; // import cloudinary util

// ================= Register =================
const registerUser = asyncHandler(async (req, res, next) => {
    const { name, email, password, location, role } = req.body;

    if (!name || !email || !password || !location) {
        throw new ApiError(400, "All required fields must be provided");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError(400, "User already exists");
    }

    let profilePhotoUrl = "";
    if (req.file?.path) {
        const uploadResult = await uploadOnCloudinary(req.file.path);
        if (!uploadResult) {
            throw new ApiError(500, "Profile photo upload failed");
        }
        profilePhotoUrl = uploadResult.secure_url; // Cloudinary hosted URL
    }

    const user = await User.create({
        name: name.trim(),
        email,
        password,
        location,
        role,
        profilePhoto: profilePhotoUrl
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if (!createdUser) {
        throw new ApiError(500, "User creation failed");
    }

    res.status(201).json(new ApiResponse(201, createdUser, "User created successfully"));
});

// ================= Login =================
const loginUser = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // save refresh token in DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    if (!loggedInUser) {
        throw new ApiError(404, "User not found after login");
    }

    const cookieOptions = {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
    };

    res.status(200)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .cookie("accessToken", accessToken, cookieOptions)
        .json(new ApiResponse(200,
            { user: loggedInUser, accessToken, refreshToken },
            "Login successful"
        ));
});

// ================= Logout =================
const logoutUser = asyncHandler(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: "" });

    const cookieOptions = {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
    };

    return res
        .status(200)
        .cookie("refreshToken", "", { ...cookieOptions, expires: new Date(0) })
        .cookie("accessToken", "", { ...cookieOptions, expires: new Date(0) })
        .json(new ApiResponse(200, null, "Logout successful"));
});

// ================= Get User Details =================
const getUserDetails = asyncHandler(async (req, res, next) => {
    const user = req.user; // Attached by auth middleware
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    res.status(200).json(new ApiResponse(200, user, "User details retrieved successfully"));
});

//Function to update user details in profile section
const updateUserDetails = asyncHandler(async (req, res, next) => {
    const { name, location } = req.body;
    if (!name || !location) {
        throw new ApiError(400, "Name and location are required");
    }
    const updatedData = { name: name.trim(), location };
    if (req.file?.path) {
        const uploadResult = await uploadOnCloudinary(req.file.path);
        if (!uploadResult) {
            throw new ApiError(500, "Profile photo upload failed");
        }
        updatedData.profilePhoto = uploadResult.secure_url; // Cloudinary hosted URL
    }
    const updatedUser = await User.findByIdAndUpdate(req.user._id, updatedData, { new: true, runValidators: true }).select("-password -refreshToken");
    if (!updatedUser) {
        throw new ApiError(404, "User not found");
    }
    res.status(200).json(new ApiResponse(200, updatedUser, "User details updated successfully"));
});


// ================= Get All Users and Stats (Admin/Volunteer View) =================
const getAllUsersAndStats = asyncHandler(async (req, res, next) => {
    // SECURITY CHECK
    if (req.user.role === 'user') {
        throw new ApiError(403, "Access forbidden. Requires admin or volunteer role.");
    }

    let complaintStats = [];
    let allUsers = [];

    try {
        allUsers = await User.find({}).select("-password -refreshToken");

        // REPORTS COUNT AGGREGATION
        complaintStats = await Complaint.aggregate([
            { $group: { _id: "$userId", reportsCount: { $sum: 1 } } }
        ]);
        
    } catch (dbError) {
        console.error("Database Aggregation Error:", dbError);
        throw new ApiError(500, "Error running database statistics query.");
    }

    // DATA MAPPING AND COMBINING
    const responseData = allUsers.map(user => {
        const userObj = user.toObject();
        
        // Use toString() for reliable comparison between ObjectIds
        const reports = complaintStats.find(s => s._id.toString() === user._id.toString());
        
        userObj.reportsCount = reports ? reports.reportsCount : 0;

        // MOCKED VOLUNTEER STATS
        if (userObj.role === 'volunteer') {
            userObj.assigned = (user.location && user.location.includes('North')) ? 12 : 8;
            userObj.resolved = (user.location && user.location.includes('North')) ? 47 : 32;
        }

        return userObj;
    });

    res.status(200).json(new ApiResponse(200, responseData, "Users and statistics fetched successfully"));
});
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    // Generate a token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `Your password reset link: ${resetUrl}`;

    try {
        await sendEmail({ to: user.email, subject: "Password Reset", text: message });
        res.status(200).json({ message: "Reset email sent successfully" });
    } catch (err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save({ validateBeforeSave: false });
        throw new ApiError(500, "Error sending email");
    }
});

// Reset password using token
const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) throw new ApiError(400, "Both password fields required");
    if (password !== confirmPassword) throw new ApiError(400, "Passwords do not match");

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) throw new ApiError(400, "Invalid or expired token");

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
    res.status(200).json({ message: "Password reset successful" });
});


export { 
    registerUser, 
    loginUser, 
    logoutUser, 
    getUserDetails,
    updateUserDetails,
    forgotPassword, resetPassword,
    getAllUsersAndStats // <<< CRITICAL: MUST BE EXPORTED
};