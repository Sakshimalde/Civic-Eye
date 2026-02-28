import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";

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
} from "../controllers/complaint.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const complaintRouter = Router();

// General
complaintRouter.route("/register").post(verifyJWT, upload.single("complaintPhoto"), registerComplaint);
complaintRouter.route("/all").get(verifyJWT, getAllComplaints);
complaintRouter.route("/dashboard/:userId").get(verifyJWT, viewComplaint);
complaintRouter.route("/pending-requests").get(verifyJWT, getPendingRequests);

// Volunteer
complaintRouter.route("/assigned").get(verifyJWT, getAssignedIssues);
complaintRouter.route("/assign/:complaintId").put(verifyJWT, updateComplaintAssignment);
complaintRouter.route("/update-status/:complaintId").put(verifyJWT, upload.single("proofPhoto"), volunteerUpdateStatus);

// Single complaint (admin detail panel)
complaintRouter.route("/detail/:complaintId").get(verifyJWT, getSingleComplaint);

// Edit / Delete (keep last — broad :complaintId param must come after specific routes)
complaintRouter.route("/:complaintId").put(verifyJWT, upload.single("complaintPhoto"), editComplaint);
complaintRouter.route("/:complaintId").delete(verifyJWT, deleteComplaint);

export default complaintRouter;