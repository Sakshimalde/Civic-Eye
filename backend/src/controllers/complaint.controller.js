import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Complaint } from "../models/complaint.model.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

const allowedDepartments = [
    "Municipal sanitation and public health",
    "Roads and street infrastructure",
    "Street lighting and electrical assets",
    "Water, sewerage, and stormwater",
    "Ward/zone office and central admin"
];

// ================= Complaint Registration =================
const registerComplaint = asyncHandler(async (req, res, next) => {
    const userId = req.user?._id;
    let { title, description, address, assignedTo, locationCoords } = req.body;

    try { locationCoords = JSON.parse(locationCoords); } catch (e) {}
    try {
        address = JSON.parse(address);
    } catch (e) {
        if (typeof address === 'string') address = [address];
    }

    if (!userId || !title || !description || !address || address.length === 0 || !assignedTo || !locationCoords || locationCoords.length !== 2) {
        throw new ApiError(400, "All required fields must be provided");
    }

    if (!allowedDepartments.includes(assignedTo)) {
        throw new ApiError(400, "Invalid department assigned");
    }

    let complaintPhotoUrl = "";
    if (req.file?.path) {
        const uploadResult = await uploadOnCloudinary(req.file.path);
        if (!uploadResult) throw new ApiError(500, "complaint photo upload failed");
        complaintPhotoUrl = uploadResult.secure_url;
    }

    const complaint = await Complaint.create({
        userId: req.user._id,
        title,
        description,
        address,
        photo: complaintPhotoUrl,
        assignedTo,
        locationCoords,
        adminApproved: false,   // ← always starts unapproved
        adminRejected: false,
    });

    const createdComplaint = await Complaint.findById(complaint._id);
    if (!createdComplaint) throw new ApiError(500, "complaint registration failed");

    res.status(201).json(new ApiResponse(200, createdComplaint, "Complaint submitted successfully. Awaiting admin approval."));
});

// ================= NEW: Get Complaints Pending Admin Approval =================
const getPendingApprovals = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        throw new ApiError(403, "Access forbidden. Admins only.");
    }

    const pending = await Complaint.find({
        adminApproved: false,
        adminRejected: false
    })
    .populate("userId", "name email profilePhoto")
    .sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, pending, "Pending approvals fetched successfully."));
});

// ================= NEW: Admin Approves a Complaint =================
const approveComplaint = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        throw new ApiError(403, "Access forbidden. Admins only.");
    }

    const { complaintId } = req.params;
    const { adminNote } = req.body;

    const complaint = await Complaint.findByIdAndUpdate(
        complaintId,
        {
            $set: {
                adminApproved: true,
                adminRejected: false,
                adminNote: adminNote || "Approved by admin.",
                updatedAt: new Date()
            }
        },
        { new: true }
    ).populate("userId", "name email");

    if (!complaint) throw new ApiError(404, "Complaint not found");

    res.status(200).json(new ApiResponse(200, complaint, "Complaint approved successfully."));
});

// ================= NEW: Admin Rejects a Complaint =================
const rejectComplaint = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        throw new ApiError(403, "Access forbidden. Admins only.");
    }

    const { complaintId } = req.params;
    const { adminNote } = req.body;

    if (!adminNote || !adminNote.trim()) {
        throw new ApiError(400, "A rejection reason is required.");
    }

    const complaint = await Complaint.findByIdAndUpdate(
        complaintId,
        {
            $set: {
                adminApproved: false,
                adminRejected: true,
                adminNote: adminNote.trim(),
                updatedAt: new Date()
            }
        },
        { new: true }
    ).populate("userId", "name email");

    if (!complaint) throw new ApiError(404, "Complaint not found");

    res.status(200).json(new ApiResponse(200, complaint, "Complaint rejected."));
});

// ================= Update Complaint Assignment (Admin assigns volunteer) =================
const updateComplaintAssignment = asyncHandler(async (req, res) => {
    const { complaintId } = req.params;
    const { assignedTo } = req.body;

    if (!mongoose.Types.ObjectId.isValid(complaintId)) {
        throw new ApiError(400, "Invalid Complaint ID");
    }

    if (!assignedTo) {
        throw new ApiError(400, "Volunteer assignment name is required");
    }

    // ── GUARD: Only allow assignment on approved complaints ──
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) throw new ApiError(404, "Complaint not found");

    if (!complaint.adminApproved) {
        throw new ApiError(400, "Cannot assign volunteer — complaint has not been approved yet.");
    }
    // ────────────────────────────────────────────────────────

    const updatedComplaint = await Complaint.findByIdAndUpdate(
        complaintId,
        { $set: { assignedTo, updatedAt: new Date() } },
        { new: true, runValidators: false }
    ).populate("userId", "name email");

    if (!updatedComplaint) throw new ApiError(404, "Complaint not found or assignment failed");

    res.status(200).json(new ApiResponse(200, updatedComplaint, "Complaint assigned successfully"));
});

// ================= Complaint List (User's own) =================
const viewComplaint = asyncHandler(async (req, res) => {
    const allComplaints = await Complaint.find({ userId: req.user._id });
    res.status(201).json(new ApiResponse(201, allComplaints, "user data fetched successfully"));
});

// ================= Edit Complaint =================
const editComplaint = asyncHandler(async (req, res, next) => {
    const { complaintId } = req.params;
    let { title, description, address, assignedTo, locationCoords, status, pendingUpdate, rejectionNote } = req.body;

    if (locationCoords && typeof locationCoords === 'string') {
        try { locationCoords = JSON.parse(locationCoords); } catch (e) {}
    }
    if (address && typeof address === 'string') {
        try { address = JSON.parse(address); } catch (e) {}
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) throw new ApiError(404, "Complaint not found");

    let complaintPhotoUrl = complaint.photo;
    if (req.file?.path) {
        const uploadResult = await uploadOnCloudinary(req.file.path);
        if (!uploadResult) throw new ApiError(500, "complaint photo upload failed");
        complaintPhotoUrl = uploadResult.secure_url;
    }

    const updatedComplaint = await Complaint.findByIdAndUpdate(
        complaintId,
        {
            $set: {
                title: title || complaint.title,
                description: description || complaint.description,
                address: address || complaint.address,
                assignedTo: assignedTo || complaint.assignedTo,
                locationCoords: locationCoords || complaint.locationCoords,
                photo: complaintPhotoUrl,
                status: status || complaint.status,
                pendingUpdate: pendingUpdate !== undefined ? pendingUpdate : complaint.pendingUpdate,
                rejectionNote: rejectionNote || complaint.rejectionNote,
                updatedAt: new Date()
            }
        },
        { new: true, runValidators: false }
    ).populate("userId");

    if (!updatedComplaint) throw new ApiError(500, "Error while updating complaint");

    res.status(200).json(new ApiResponse(200, updatedComplaint, "Complaint updated successfully"));
});

// ================= Delete Complaint =================
const deleteComplaint = asyncHandler(async (req, res, next) => {
    const { complaintId } = req.params;
    const deletedComplaint = await Complaint.findByIdAndDelete(complaintId);
    if (!deletedComplaint) throw new ApiError(404, "Complaint not found");
    res.status(200).json(new ApiResponse(200, {}, "Complaint deleted successfully"));
});

// ================= Get All Complaints (Admin — approved only) =================
const getAllComplaints = asyncHandler(async (req, res) => {
    const { search, sort } = req.query;

    // ── Only show approved complaints in the main list ──
    let query = { adminApproved: true };

    if (search) {
        const searchRegex = { $regex: search, $options: 'i' };
        query.$or = [
            { title: searchRegex },
            { description: searchRegex },
            { address: searchRegex }
        ];
    }

    let sortOptions = { createdAt: -1 };
    if (sort === 'Oldest First') sortOptions = { createdAt: 1 };

    const complaints = await Complaint.find(query)
        .populate("userId", "name profilePhoto")
        .sort(sortOptions);

    res.status(200).json(new ApiResponse(200, complaints, "All complaints fetched successfully"));
});

// ================= Get Pending Volunteer Updates (for admin review) =================
const getPendingRequests = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        throw new ApiError(403, "Access forbidden. Only admins can view pending requests.");
    }

    const pendingComplaints = await Complaint.find({ pendingUpdate: true })
        .populate("userId", "name profilePhoto")
        .sort({ updatedAt: -1 });

    res.status(200).json(new ApiResponse(200, pendingComplaints, "Pending requests fetched successfully."));
});

// ================= Get Issues Assigned to Volunteer =================
const getAssignedIssues = asyncHandler(async (req, res) => {
    if (req.user.role !== 'volunteer') {
        throw new ApiError(403, "Access forbidden. Only volunteers can view assigned issues.");
    }

    const volunteerName = req.user.name;

    const assignedIssues = await Complaint.find({
        assignedTo: { $regex: `^${volunteerName}$`, $options: 'i' },
        adminApproved: true   // volunteer only sees approved complaints
    })
    .populate('userId', 'name')
    .sort({ createdAt: 1 });

    res.status(200).json(new ApiResponse(200, assignedIssues, "Assigned issues fetched successfully."));
});

// ================= Volunteer Updates Status =================
const volunteerUpdateStatus = asyncHandler(async (req, res) => {
    const { complaintId } = req.params;
    const { status, workNotes } = req.body;

    if (!complaintId) throw new ApiError(400, "Complaint ID is required");

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) throw new ApiError(404, "Complaint not found");

    complaint.status = status || complaint.status;
    complaint.updatedAt = new Date();
    if (workNotes) complaint.workNotes = workNotes;

    if (status === 'resolved') {
        complaint.pendingUpdate = true;  // flag for admin review
    }

    if (req.file) {
        const imageUpload = await uploadOnCloudinary(req.file.path);
        complaint.photo = imageUpload?.secure_url || imageUpload?.url || complaint.photo;
    }

    await complaint.save();

    res.status(200).json(new ApiResponse(200, complaint, "Status updated successfully"));
});

export {
    registerComplaint,
    viewComplaint,
    editComplaint,
    deleteComplaint,
    getAllComplaints,
    updateComplaintAssignment,
    getAssignedIssues,
    volunteerUpdateStatus,
    getPendingRequests,
    getPendingApprovals,   // ← new
    approveComplaint,      // ← new
    rejectComplaint,       // ← new
};
