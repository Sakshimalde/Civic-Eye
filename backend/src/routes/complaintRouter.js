import { Router } from "express";
import { upload, uploadComplaint } from "../middlewares/multer.middleware.js";

import {
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
} from "../controllers/complaint.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const complaintRouter = Router();

// General
// uploadComplaint allows up to 10MB for complaint photos
complaintRouter.route("/register").post(verifyJWT, uploadComplaint.single("complaintPhoto"), registerComplaint);
complaintRouter.route("/all").get(verifyJWT, getAllComplaints);
complaintRouter.route("/dashboard/:userId").get(verifyJWT, viewComplaint);
complaintRouter.route("/pending-requests").get(verifyJWT, getPendingRequests);

// Volunteer
complaintRouter.route("/assigned").get(verifyJWT, getAssignedIssues);
complaintRouter.route("/assign/:complaintId").put(verifyJWT, updateComplaintAssignment);
// uploadComplaint allows up to 10MB for proof photos
complaintRouter.route("/update-status/:complaintId").put(verifyJWT, uploadComplaint.single("proofPhoto"), volunteerUpdateStatus);

// Admin resolution approval / rejection
complaintRouter.route("/approve-resolution/:complaintId").put(verifyJWT, approveResolution);
complaintRouter.route("/reject-resolution/:complaintId").put(verifyJWT, rejectResolution);

// Single complaint (admin detail panel)
complaintRouter.route("/detail/:complaintId").get(verifyJWT, getSingleComplaint);

// Edit / Delete (keep last — broad :complaintId param must come after specific routes)
complaintRouter.route("/:complaintId").put(verifyJWT, uploadComplaint.single("complaintPhoto"), editComplaint);
complaintRouter.route("/:complaintId").delete(verifyJWT, deleteComplaint);

export default complaintRouter;