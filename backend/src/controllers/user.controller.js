import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Complaint } from "../models/complaint.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// ── Shared validators ──────────────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const PHONE_REGEX = /^[\d\s\-().+]{7,20}$/;

// ================= Register =================
const registerUser = asyncHandler(async (req, res, next) => {
    const { name, email, password, location, role, phone } = req.body;

    // Required field check
    if (!name || !email || !password || !location) {
        throw new ApiError(400, "Name, email, password, and location are required.");
    }

    // Name validation
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 60) {
        throw new ApiError(400, "Name must be between 2 and 60 characters.");
    }
    if (!/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
        throw new ApiError(400, "Name can only contain letters, spaces, hyphens, and apostrophes.");
    }

    // Email validation
    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
        throw new ApiError(400, "Please provide a valid email address.");
    }

    // Password validation
    if (!PASSWORD_REGEX.test(password)) {
        throw new ApiError(
            400,
            "Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, and one number."
        );
    }

    // Location validation
    const trimmedLocation = location.trim();
    if (trimmedLocation.length < 2 || trimmedLocation.length > 100) {
        throw new ApiError(400, "Location must be between 2 and 100 characters.");
    }

    // Phone validation (optional)
    if (phone && phone.trim() && !PHONE_REGEX.test(phone.trim())) {
        throw new ApiError(400, "Please provide a valid phone number (7–20 characters).");
    }

    // Role validation
    const allowedRoles = ['user', 'volunteer', 'admin'];
    if (role && !allowedRoles.includes(role)) {
        throw new ApiError(400, "Invalid role. Must be 'user', 'volunteer', or 'admin'.");
    }

    // Duplicate email check
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
        throw new ApiError(409, "An account with this email already exists.");
    }

    // Profile photo upload (optional)
    let profilePhotoUrl = "";
    if (req.file?.path) {
        const uploadResult = await uploadOnCloudinary(req.file.path);
        if (!uploadResult) {
            throw new ApiError(500, "Profile photo upload failed. Please try again.");
        }
        profilePhotoUrl = uploadResult.secure_url;
    }

    const user = await User.create({
        name: trimmedName,
        email: trimmedEmail,
        password,
        location: trimmedLocation,
        role: role || 'user',
        phone: phone ? phone.trim() : '',
        profilePhoto: profilePhotoUrl,
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if (!createdUser) {
        throw new ApiError(500, "User creation failed. Please try again.");
    }

    res.status(201).json(new ApiResponse(201, createdUser, "Account created successfully."));
});

// ================= Login =================
const loginUser = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required.");
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
        throw new ApiError(400, "Please provide a valid email address.");
    }

    if (!password || password.length < 8) {
        throw new ApiError(400, "Password must be at least 8 characters.");
    }

    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
        throw new ApiError(401, "Invalid email or password.");
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid email or password.");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    if (!loggedInUser) {
        throw new ApiError(404, "User not found after login.");
    }

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "lax",
    };

    res.status(200)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .cookie("accessToken", accessToken, cookieOptions)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "Login successful."));
});

// ================= Logout =================
const logoutUser = asyncHandler(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: "" });

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "lax",
    };

    return res
        .status(200)
        .cookie("refreshToken", "", { ...cookieOptions, expires: new Date(0) })
        .cookie("accessToken", "", { ...cookieOptions, expires: new Date(0) })
        .json(new ApiResponse(200, null, "Logout successful."));
});

// ================= Get User Details =================
const getUserDetails = asyncHandler(async (req, res, next) => {
    const user = req.user;
    if (!user) throw new ApiError(404, "User not found.");
    res.status(200).json(new ApiResponse(200, user, "User details retrieved successfully."));
});

// ================= Update User Profile =================
// FIX: Now accepts name, email, phone, location, bio — all optional except name & location.
const updateUserDetails = asyncHandler(async (req, res, next) => {
    const { name, email, phone, location, bio } = req.body;

    // Required fields
    if (!name || !name.trim()) throw new ApiError(400, "Full name is required.");
    if (!location || !location.trim()) throw new ApiError(400, "Location is required.");

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 60) {
        throw new ApiError(400, "Name must be between 2 and 60 characters.");
    }
    if (!/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
        throw new ApiError(400, "Name can only contain letters, spaces, hyphens, and apostrophes.");
    }

    const trimmedLocation = location.trim();
    if (trimmedLocation.length < 2 || trimmedLocation.length > 100) {
        throw new ApiError(400, "Location must be between 2 and 100 characters.");
    }

    // Optional email validation
    const updatedData = {
        name: trimmedName,
        location: trimmedLocation,
    };

    if (email !== undefined && email !== null) {
        const trimmedEmail = email.trim().toLowerCase();
        if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
            throw new ApiError(400, "Please provide a valid email address.");
        }
        // Check if email is taken by another user
        if (trimmedEmail && trimmedEmail !== req.user.email) {
            const emailTaken = await User.findOne({ email: trimmedEmail, _id: { $ne: req.user._id } });
            if (emailTaken) throw new ApiError(409, "This email address is already in use by another account.");
        }
        if (trimmedEmail) updatedData.email = trimmedEmail;
    }

    if (phone !== undefined && phone !== null) {
        const trimmedPhone = phone.trim();
        if (trimmedPhone && !PHONE_REGEX.test(trimmedPhone)) {
            throw new ApiError(400, "Please provide a valid phone number.");
        }
        updatedData.phone = trimmedPhone;
    }

    if (bio !== undefined && bio !== null) {
        const trimmedBio = bio.trim();
        if (trimmedBio.length > 500) {
            throw new ApiError(400, "Bio must not exceed 500 characters.");
        }
        updatedData.bio = trimmedBio;
    }

    // Profile photo upload (optional)
    if (req.file?.path) {
        const uploadResult = await uploadOnCloudinary(req.file.path);
        if (!uploadResult) throw new ApiError(500, "Profile photo upload failed.");
        updatedData.profilePhoto = uploadResult.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        updatedData,
        { new: true, runValidators: true }
    ).select("-password -refreshToken");

    if (!updatedUser) throw new ApiError(404, "User not found.");

    res.status(200).json(new ApiResponse(200, updatedUser, "Profile updated successfully."));
});

// ================= Get All Users and Stats (Admin/Volunteer) =================
const getAllUsersAndStats = asyncHandler(async (req, res, next) => {
    if (req.user.role === 'user') {
        throw new ApiError(403, "Access forbidden. Requires admin or volunteer role.");
    }

    let complaintStats = [];
    let allUsers = [];

    try {
        allUsers = await User.find({}).select("-password -refreshToken");
        complaintStats = await Complaint.aggregate([
            { $group: { _id: "$userId", reportsCount: { $sum: 1 } } }
        ]);
    } catch (dbError) {
        console.error("Database Aggregation Error:", dbError);
        throw new ApiError(500, "Error running database statistics query.");
    }

    const responseData = allUsers.map(user => {
        const userObj = user.toObject();
        const reports = complaintStats.find(s => s._id.toString() === user._id.toString());
        userObj.reportsCount = reports ? reports.reportsCount : 0;

        if (userObj.role === 'volunteer') {
            userObj.assigned = (user.location && user.location.includes('North')) ? 12 : 8;
            userObj.resolved = (user.location && user.location.includes('North')) ? 47 : 32;
        }

        return userObj;
    });

    res.status(200).json(new ApiResponse(200, responseData, "Users and statistics fetched successfully."));
});

// ================= Forgot / Reset Password =================
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
        throw new ApiError(400, "Please provide a valid email address.");
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) throw new ApiError(404, "No account found with this email address.");

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `Your password reset link (valid for 10 minutes): ${resetUrl}`;

    try {
        await sendEmail({ to: user.email, subject: "Password Reset – CivicEye", text: message });
        res.status(200).json({ message: "Password reset email sent. Please check your inbox." });
    } catch (err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save({ validateBeforeSave: false });
        throw new ApiError(500, "Error sending email. Please try again later.");
    }
});

const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) throw new ApiError(400, "Both password fields are required.");
    if (password !== confirmPassword) throw new ApiError(400, "Passwords do not match.");
    if (!PASSWORD_REGEX.test(password)) {
        throw new ApiError(400, "Password must be at least 8 characters with uppercase, lowercase, and a number.");
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) throw new ApiError(400, "Invalid or expired reset token. Please request a new one.");

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful. You can now sign in." });
});

export {
    registerUser,
    loginUser,
    logoutUser,
    getUserDetails,
    updateUserDetails,
    forgotPassword,
    resetPassword,
    getAllUsersAndStats
};