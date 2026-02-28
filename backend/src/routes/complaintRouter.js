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
    getPendingApprovals,   // ← new
    approveComplaint,      // ← new
    rejectComplaint,       // ← new
} from "../controllers/complaint.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const complaintRouter = Router();

// ── Citizen ──────────────────────────────────────────────────────────────────
complaintRouter.route("/register").post(verifyJWT, upload.single("complaintPhoto"), registerComplaint);
complaintRouter.route("/dashboard/:userId").get(verifyJWT, viewComplaint);

// ── Admin: Approval flow ─────────────────────────────────────────────────────
complaintRouter.route("/pending-approvals").get(verifyJWT, getPendingApprovals);       // ← new
complaintRouter.route("/approve/:complaintId").put(verifyJWT, approveComplaint);       // ← new
complaintRouter.route("/reject/:complaintId").put(verifyJWT, rejectComplaint);         // ← new

// ── Admin: All approved issues + volunteer assignment ────────────────────────
complaintRouter.route("/all").get(verifyJWT, getAllComplaints);
complaintRouter.route("/assign/:complaintId").put(verifyJWT, updateComplaintAssignment);
complaintRouter.route("/pending-requests").get(verifyJWT, getPendingRequests);

// ── Volunteer ────────────────────────────────────────────────────────────────
complaintRouter.route("/assigned").get(verifyJWT, getAssignedIssues);
complaintRouter.route("/update-status/:complaintId").put(verifyJWT, upload.single("proofPhoto"), volunteerUpdateStatus);

// ── General ──────────────────────────────────────────────────────────────────
complaintRouter.route("/:complaintId").put(verifyJWT, upload.single("complaintPhoto"), editComplaint);
complaintRouter.route("/:complaintId").delete(deleteComplaint);

export default complaintRouter;
