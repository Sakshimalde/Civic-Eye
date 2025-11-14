// comment.routes.js
import { Router } from "express";
import { createComment, deleteComment, editComment, getCommentsByComplaint } from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const commentRouter = Router();

// Route 1: Handles POST to create a comment and GET to fetch all comments for a specific complaint ID.
// URL structure: /api/v1/comments/:complaintId
commentRouter.route("/:complaintId")
    .post(verifyJWT, createComment)     // POST /api/v1/comments/12345
    .get(verifyJWT, getCommentsByComplaint);    // GET /api/v1/comments/12345

// Route 2: Handles PUT to edit and DELETE to remove a specific comment.
// URL structure: /api/v1/comments/:complaintId/:commentId
commentRouter.route("/:complaintId/:commentId")
    .put(verifyJWT, editComment)        // PUT /api/v1/comments/12345/67890
    .delete(verifyJWT, deleteComment);  // DELETE /api/v1/comments/12345/67890

export default commentRouter;