// comments.controller.js
import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Complaint } from "../models/complaint.model.js";
// comments.controller.js (Final Fix for Update)

//===================Create comment===============
const createComment = asyncHandler(async (req, res) => {
    const { complaintId } = req.params;
    const content = req.body?.content?.trim();

    if (!complaintId) throw new ApiError(400, "Complaint id is required");
    if (!content) throw new ApiError(400, "Comment content is required");

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) throw new ApiError(404, "Complaint not found");

    const comment = await Comment.create({
        userId: req.user._id,
        complaintId,
        content
    });

    await Complaint.findByIdAndUpdate(complaintId, { $push: { comments: comment._id } });

    // FIX 1: Ensure the created comment is returned POPULATED for the frontend to show the name immediately
    const createdComment = await Comment.findById(comment._id)
        .populate('userId', 'name')
        .lean();

    res.status(200).json(new ApiResponse(200, createdComment, "Comment created successfully"));
});

//==================== Get comments for a complaint =================
const getCommentsByComplaint = asyncHandler(async (req, res) => {
    const { complaintId } = req.params;

    if (!complaintId) throw new ApiError(400, "Complaint id is required");

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) throw new ApiError(404, "Complaint not found");

    const comments = await Comment.find({ complaintId })
        .sort({ createdAt: -1 })
        .populate('userId', 'name') // correctly populate for all fetches
        .lean();

    res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully"));
});


// ... (createComment and getCommentsByComplaint remain correct)

//==================== Edit comment (ULTRA-ROBUST FIX) ===============
const editComment = asyncHandler(async (req, res) => {
    // Note: Frontend sends issueId as the first param, commentId as the second.
    // The route is defined as /:complaintId/:commentId. We must ensure we grab the correct ID.
    // However, the frontend API call uses /comments/${issueId}/${commentId}, while the route is /:commentId.
    // Let's assume the frontend API URL is correct: PUT /comments/:complaintId/:commentId.
    // But the route file shows: commentRouter.route("/:commentId").put(verifyJWT, editComment); 
    
    // Based on the *LAST* provided router snippet, the route is /comments/:commentId (meaning req.params.commentId is the only ID).
    // The frontend call: PUT /comments/${issueId}/${commentId} implies req.params.complaintId and req.params.commentId.
    // I will assume the route definition is correct and modify the frontend URL contract to match the route if possible.

    // **Assuming correct route is PUT /comments/:complaintId/:commentId (As implied by deleteComment route)**
    const { complaintId, commentId } = req.params; 
    let content = req.body?.content?.trim();

    if (!commentId) {
        throw new ApiError(400, "commentId is required while updating comment");
    }
    if (!content) {
        throw new ApiError(400, "comment content is required while updating comment");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "comment not found while updating comment");
    }
    if (comment.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "user not authorized to edit this comment");
    }

    // 1. Update and Save
    comment.content = content;
    comment.updatedAt = new Date();
    await comment.save();

    // 2. Re-fetch and Populate to ensure the client gets the full user object
    const updatedComment = await Comment.findById(comment._id)
        .populate('userId', 'name')
        .lean();

    res.status(200).json(new ApiResponse(200, updatedComment, "comment updated successfully"));
});
// ... (deleteComment remains correct)

//==================== Delete comment ==================
const deleteComment = asyncHandler(async (req, res) => {
    const { complaintId, commentId } = req.params;

    if (!complaintId || !commentId) throw new ApiError(400, "ComplaintId and CommentId are required");

    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Comment not found");
    if (comment.userId.toString() !== req.user._id.toString()) throw new ApiError(403, "Not authorized");

    await Complaint.findByIdAndUpdate(complaintId, { $pull: { comments: commentId } });
    await Comment.findByIdAndDelete(commentId);
    res.status(200).json(new ApiResponse(200, { _id: commentId }, "Comment deleted successfully"));

});

export { createComment, editComment, deleteComment, getCommentsByComplaint };
