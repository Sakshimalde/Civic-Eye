// complaint_controller.js — PART 1 of 3
// Contains: imports, getPendingRequests, registerComplaint, updateComplaintAssignment

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Complaint } from "../models/complaint.model.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import sendEmail from "../utils/sendEmail.js";
import {
    complaintRegisteredEmail,
    volunteerAssignedEmail,
    workStartedEmail,
    issueResolvedEmail,
    resolutionRejectedEmail,
    complaintRejectedEmail,
} from "../utils/emailTemplates.js";

const fmt = (date) => new Date(date).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
});

const allowedDepartments = [
    "Municipal sanitation and public health",
    "Roads and street infrastructure",
    "Street lighting and electrical assets",
    "Water, sewerage, and stormwater",
    "Ward/zone office and central admin"
];

// ================= Get Pending Requests for Admin =================
// ✅ FIX: was { pendingUpdate: 'true' } (string) — never matched anything
const getPendingRequests = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        throw new ApiError(403, "Access forbidden. Only admins can view pending requests.");
    }

    const pendingComplaints = await Complaint.find({ pendingUpdate: true })  // boolean true
        .populate("userId", "name profilePhoto email")
        .sort({ updatedAt: -1 });

    res.status(200).json(new ApiResponse(200, pendingComplaints, "Pending requests fetched successfully."));
});

// ================= Register Complaint =================
console.log("📧 [REGISTER] Sending email to:", user.email);
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
        userId: req.user._id, title, description, address,
        photo: complaintPhotoUrl, assignedTo, locationCoords
    });
    console.log("✅ [REGISTER] Email function called");

    const createdComplaint = await Complaint.findById(complaint._id);
    if (!createdComplaint) throw new ApiError(500, "complaint registration failed");

    try {
        const citizen = await User.findById(userId).select("email name");
        if (citizen?.email) {
            const { subject, html } = complaintRegisteredEmail({
                citizenName: citizen.name, title, description,
                category: assignedTo, address: address.join(', '),
                complaintId: createdComplaint._id.toString().slice(-8).toUpperCase(),
                createdAt: fmt(createdComplaint.createdAt),
            });
            await sendEmail(citizen.email, subject, html);
        }
    } catch (emailErr) {
        console.error("[Email] Registration email failed:", emailErr.message);
    }

    res.status(201).json(new ApiResponse(200, createdComplaint, "Complaint Registered successfully"));
});

// ================= Update Complaint Assignment (Admin assigns volunteer) =================
const updateComplaintAssignment = asyncHandler(async (req, res) => {
    const { complaintId } = req.params;
    const { assignedTo } = req.body;

    if (!mongoose.Types.ObjectId.isValid(complaintId)) throw new ApiError(400, "Invalid Complaint ID");
    if (!assignedTo) throw new ApiError(400, "Volunteer assignment name is required");

    const updatedComplaint = await Complaint.findByIdAndUpdate(
        complaintId,
        { $set: { assignedTo, updatedAt: new Date() } },
        { new: true, runValidators: false }
    ).populate("userId", "name email");

    if (!updatedComplaint) throw new ApiError(404, "Complaint not found or assignment failed");

    try {
        const citizen = updatedComplaint.userId;
        if (citizen?.email) {
            const { subject, html } = volunteerAssignedEmail({
                citizenName: citizen.name, title: updatedComplaint.title,
                volunteerName: assignedTo,
                complaintId: updatedComplaint._id.toString().slice(-8).toUpperCase(),
                assignedAt: fmt(updatedComplaint.updatedAt),
            });
            await sendEmail(citizen.email, subject, html);
        }
    } catch (emailErr) {
        console.error("[Email] Volunteer assigned email failed:", emailErr.message);
    }

    res.status(200).json(new ApiResponse(200, updatedComplaint, "Complaint assigned successfully"));
});
console.log("📧 [ASSIGN] Sending email to:", user.email);

// complaint_controller.js — PART 2 of 3
// Contains: getSingleComplaint, viewComplaint, editComplaint, deleteComplaint, getAllComplaints

// ================= Get Single Complaint =================
const getSingleComplaint = asyncHandler(async (req, res) => {
    const { complaintId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(complaintId)) throw new ApiError(400, "Invalid Complaint ID");

    const complaint = await Complaint.findById(complaintId)
        .populate("userId", "name email profilePhoto");
    if (!complaint) throw new ApiError(404, "Complaint not found");

    res.status(200).json(new ApiResponse(200, complaint, "Complaint fetched successfully"));
});

// ================= View User's Own Complaints =================
const viewComplaint = asyncHandler(async (req, res) => {
    const allComplaints = await Complaint.find({ userId: req.user._id });
    res.status(201).json(new ApiResponse(201, allComplaints, "user data fetched successfully"));
});

// ================= Edit Complaint (admin full edit + complaint-level rejection) =================
const editComplaint = asyncHandler(async (req, res, next) => {
    const { complaintId } = req.params;
    let { title, description, address, assignedTo, locationCoords, status, pendingUpdate, rejectionNote } = req.body;

    if (locationCoords && typeof locationCoords === 'string') {
        try { locationCoords = JSON.parse(locationCoords); } catch (e) {}
    }
    if (address && typeof address === 'string') {
        try { address = JSON.parse(address); } catch (e) {}
    }

    const complaint = await Complaint.findById(complaintId).populate("userId", "name email");
    if (!complaint) throw new ApiError(404, "Complaint not found");

    const isBeingRejected = req.body.isRejected === true || req.body.isRejected === 'true';

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
                status: isBeingRejected ? complaint.status : (status || complaint.status),
                pendingUpdate: pendingUpdate !== undefined ? pendingUpdate : complaint.pendingUpdate,
                rejectionNote: rejectionNote || complaint.rejectionNote,
                isRejected: isBeingRejected ? true : complaint.isRejected,
                updatedAt: new Date()
            }
        },
        { new: true, runValidators: false }
    ).populate("userId", "name email");

    if (!updatedComplaint) throw new ApiError(500, "Error while updating complaint");

    try {
        const citizen = updatedComplaint.userId;
        if (citizen?.email && isBeingRejected) {
            const { subject, html } = complaintRejectedEmail({
                citizenName: citizen.name,
                title: updatedComplaint.title,
                rejectionNote: rejectionNote || 'Your complaint did not meet the submission criteria.',
                complaintId: updatedComplaint._id.toString().slice(-8).toUpperCase(),
            });
            await sendEmail(citizen.email, subject, html);
        }
    } catch (emailErr) {
        console.error("[Email] Edit complaint email failed:", emailErr.message);
    }

    res.status(200).json(new ApiResponse(200, updatedComplaint, "Complaint updated successfully"));
});

// ================= Delete Complaint =================
const deleteComplaint = asyncHandler(async (req, res, next) => {
    const { complaintId } = req.params;
    const deletedComplaint = await Complaint.findByIdAndDelete(complaintId);
    if (!deletedComplaint) throw new ApiError(404, "Complaint not found");
    res.status(200).json(new ApiResponse(200, {}, "Complaint deleted successfully"));
});

// ================= Get All Complaints =================
const getAllComplaints = asyncHandler(async (req, res) => {
    const { search, sort } = req.query;
    let query = {};

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
// complaint_controller.js — PART 3 of 3
// Contains: getAssignedIssues, volunteerUpdateStatus, approveResolution, rejectResolution, exports

// ================= Get Issues Assigned to Volunteer =================
const getAssignedIssues = asyncHandler(async (req, res) => {
    if (req.user.role !== 'volunteer') {
        throw new ApiError(403, "Access forbidden. Only volunteers can view assigned issues.");
    }

    const volunteerName = req.user.name;
    const assignedIssues = await Complaint.find({
        assignedTo: { $regex: `^${volunteerName}$`, $options: 'i' }
    })
    .populate('userId', 'name')
    .sort({ priority: -1, createdAt: 1 });

    res.status(200).json(new ApiResponse(200, assignedIssues, "Assigned issues fetched successfully."));
});

// ================= Volunteer Updates Status =================
// When volunteer marks as 'resolved':
//   - stores proof photo in proofPhoto field (separate from original complaint photo)
//   - sets pendingUpdate = true for admin to review
//   - does NOT change status to 'resolved' yet — admin must approve first
const volunteerUpdateStatus = asyncHandler(async (req, res) => {
    const { complaintId } = req.params;
    const { status, workNotes } = req.body;

    if (!complaintId) throw new ApiError(400, "Complaint ID is required");

    const complaint = await Complaint.findById(complaintId).populate("userId", "name email");
    if (!complaint) throw new ApiError(404, "Complaint not found");

    const previousStatus = complaint.status;

    if (status === 'resolved') {
        // Don't set status to resolved yet — wait for admin approval
        complaint.pendingUpdate = true;
        complaint.resolutionRejected = false;
        complaint.resolutionRejectionNote = "";
        // status stays as-is (in progress / inReview)
    } else {
        complaint.status = status || complaint.status;
    }

    complaint.updatedAt = new Date();
    if (workNotes) complaint.workNotes = workNotes;

    // ✅ Proof photo saved to proofPhoto field, not photo (keeps original complaint photo intact)
    if (req.file) {
        const imageUpload = await uploadOnCloudinary(req.file.path);
        complaint.proofPhoto = imageUpload?.secure_url || imageUpload?.url || complaint.proofPhoto;
    }

    await complaint.save();

    try {
        const citizen = complaint.userId;
        if (citizen?.email && status === 'inReview' && previousStatus !== 'inReview') {
            console.log("📧 [WORK STARTED] Status changed to inReview");
console.log("📧 Sending email to:", citizen.email);
            const { subject, html } = workStartedEmail({
                citizenName: citizen.name, title: complaint.title,
                volunteerName: req.user.name, workNotes: workNotes || '',
                complaintId: complaint._id.toString().slice(-8).toUpperCase(),
                updatedAt: fmt(complaint.updatedAt),
            });
            await sendEmail(citizen.email, subject, html);
        }
    } catch (emailErr) {
        console.error("[Email] Volunteer update email failed:", emailErr.message);
    }

    const message = status === 'resolved'
        ? "Resolution submitted for admin approval."
        : "Status updated successfully";

    res.status(200).json(new ApiResponse(200, complaint, message));
});

// ================= Admin: Approve Volunteer Resolution =================
const approveResolution = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') throw new ApiError(403, "Only admins can approve resolutions.");

    const { complaintId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(complaintId)) throw new ApiError(400, "Invalid Complaint ID");

    const complaint = await Complaint.findById(complaintId).populate("userId", "name email");
    if (!complaint) throw new ApiError(404, "Complaint not found");
    if (!complaint.pendingUpdate) throw new ApiError(400, "No pending resolution to approve.");

    const updatedComplaint = await Complaint.findByIdAndUpdate(
        complaintId,
        {
            $set: {
                status: 'resolved',
                pendingUpdate: false,
                resolutionRejected: false,
                resolutionRejectionNote: "",
                updatedAt: new Date()
            }
        },
        { new: true }
    ).populate("userId", "name email");

    try {
        const citizen = updatedComplaint.userId;
        if (citizen?.email) {
            const { subject, html } = issueResolvedEmail({
                citizenName: citizen.name, title: updatedComplaint.title,
                volunteerName: updatedComplaint.assignedTo,
                workNotes: updatedComplaint.workNotes,
                complaintId: updatedComplaint._id.toString().slice(-8).toUpperCase(),
                resolvedAt: fmt(updatedComplaint.updatedAt),
            });
            await sendEmail(citizen.email, subject, html);
        }
    } catch (emailErr) {
        console.error("[Email] Approve resolution email failed:", emailErr.message);
    }

    res.status(200).json(new ApiResponse(200, updatedComplaint, "Resolution approved. Issue marked as resolved."));
});

// ================= Admin: Reject Volunteer Resolution =================
const rejectResolution = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') throw new ApiError(403, "Only admins can reject resolutions.");

    const { complaintId } = req.params;
    const { rejectionNote } = req.body;

    if (!mongoose.Types.ObjectId.isValid(complaintId)) throw new ApiError(400, "Invalid Complaint ID");
    if (!rejectionNote?.trim()) throw new ApiError(400, "A rejection reason is required.");

    const complaint = await Complaint.findById(complaintId).populate("userId", "name email");
    if (!complaint) throw new ApiError(404, "Complaint not found");
    if (!complaint.pendingUpdate) throw new ApiError(400, "No pending resolution to reject.");

    const updatedComplaint = await Complaint.findByIdAndUpdate(
        complaintId,
        {
            $set: {
                status: 'in progress',            // push back to volunteer
                pendingUpdate: false,
                resolutionRejected: true,          // volunteer sees this flag
                resolutionRejectionNote: rejectionNote.trim(),
                updatedAt: new Date()
            }
        },
        { new: true }
    ).populate("userId", "name email");

    try {
        const citizen = updatedComplaint.userId;
        if (citizen?.email) {
            const { subject, html } = resolutionRejectedEmail({
                citizenName: citizen.name, title: updatedComplaint.title,
                volunteerName: updatedComplaint.assignedTo,
                rejectionNote: rejectionNote.trim(),
                complaintId: updatedComplaint._id.toString().slice(-8).toUpperCase(),
            });
            await sendEmail(citizen.email, subject, html);
        }
    } catch (emailErr) {
        console.error("[Email] Reject resolution email failed:", emailErr.message);
    }

    res.status(200).json(new ApiResponse(200, updatedComplaint, "Resolution rejected. Volunteer notified to resubmit."));
});

// ================= Exports =================
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
    getSingleComplaint,
    approveResolution,
    rejectResolution,
};