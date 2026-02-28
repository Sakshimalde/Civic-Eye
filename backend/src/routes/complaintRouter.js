import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";

import { 
    registerComplaint, 
    viewComplaint, 
    editComplaint, 
    deleteComplaint,
    getAllComplaints,
    updateComplaintAssignment, // Imported for Admin Assign
    getAssignedIssues, // Imported for Volunteer Fetch
    volunteerUpdateStatus,// Imported for Volunteer Update
      getPendingRequests 
} from "../controllers/complaint.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const complaintRouter = Router();

// --- General User/Admin Routes ---
complaintRouter.route("/register").post(verifyJWT, upload.single("complaintPhoto"), registerComplaint);
complaintRouter.route("/all").get(verifyJWT, getAllComplaints); // Admin/Browse All Issues
complaintRouter.route("/dashboard/:userId").get(verifyJWT, viewComplaint); // User's own complaints
complaintRouter.route("/:complaintId").put(verifyJWT, upload.single("complaintPhoto"), editComplaint);
complaintRouter.route("/:complaintId").delete(deleteComplaint);
// ✅ Admin: Fetch all pending volunteer status updates
complaintRouter.route("/pending-requests").get(verifyJWT, getPendingRequests);

// --- Volunteer/Assignment Routes ---
// New Route 1: Get issues assigned to the logged-in volunteer
complaintRouter.route("/assigned").get(verifyJWT, getAssignedIssues);

// New Route 2: Route for admin to assign/reassign a volunteer
complaintRouter.route("/assign/:complaintId").put(verifyJWT, updateComplaintAssignment);

complaintRouter.route("/update-status/:complaintId")
  .put(verifyJWT, upload.single("proofPhoto"), volunteerUpdateStatus);


export default complaintRouter;