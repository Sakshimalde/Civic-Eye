// vote.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Complaint } from "../models/complaint.model.js";
import { Vote } from "../models/vote.model.js";

//=================== Helper: Compute Vote Counts ===============
async function computeCounts(complaintId) {
    const votes = await Vote.find({ complaintId });
    const upvote = votes.filter(v => v.voteType === "upvote").length;
    const downVote = votes.filter(v => v.voteType === "downvote").length;
    return { upvote, downVote };
}

//=================== Create / Update / Delete Vote ===============
const vote = asyncHandler(async (req, res) => {
    const { complaintId } = req.params;
    // Category is passed as a query string: ?category=upvote or ?category=downvote
    const category = req.query?.category; 

    if (!["upvote", "downvote"].includes(category)) throw new ApiError(400, "Vote category required");

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) throw new ApiError(404, "Complaint not found");

    // Find if the user has already voted on this complaint
    let existingVote = await Vote.findOne({ complaintId, userId: req.user._id });

    if (existingVote) {
        if (existingVote.voteType === category) {
            // Case 1: Toggling off the existing vote (upvote -> no vote, or downvote -> no vote)
            await Vote.findByIdAndDelete(existingVote._id);
        } else {
            // Case 2: Changing the vote (upvote -> downvote, or downvote -> upvote)
            existingVote.voteType = category;
            await existingVote.save();
        }
    } else {
        // Case 3: Creating a new vote
        await Vote.create({ complaintId, userId: req.user._id, voteType: category });
    }

    const counts = await computeCounts(complaintId);
    res.status(200).json(new ApiResponse(200, { counts }, "Vote updated successfully"));
});

//=================== Get Complaint-wise Votes ===============
const complaintViseVotes = asyncHandler(async (req, res) => {
    const { complaintId } = req.params;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) throw new ApiError(404, "Complaint not found");

    const counts = await computeCounts(complaintId);
    res.status(200).json(new ApiResponse(200, counts, "Complaint votes fetched successfully"));
});

//=================== Delete Vote (Only used if explicitly deleting a vote) =================
const deleteVote = asyncHandler(async (req, res) => {
    const { complaintId } = req.params;

    const voteToDelete = await Vote.findOne({ complaintId, userId: req.user._id });
    if (!voteToDelete) throw new ApiError(404, "Vote not found");

    await Vote.findByIdAndDelete(voteToDelete._id);

    const counts = await computeCounts(complaintId);
    res.status(200).json(new ApiResponse(200, { counts }, "Vote deleted successfully"));
});

//=================== Get User Votes on Multiple Issues =================
// This is the function used in fetchIssues to check if a user has previously voted
const getUserVotes = asyncHandler(async (req, res) => {
    // req.query.issues is a comma-separated string of complaint IDs
    const issues = (req.query.issues || '').split(',').filter(id => id.length > 0); 

    if (!req.user) throw new ApiError(401, "Unauthorized");

    const votes = await Vote.find({ userId: req.user._id, complaintId: { $in: issues } });

    // Format the response as {issueId: "upvote" | "downvote"}
    const voteMap = {};
    votes.forEach(v => {
        voteMap[v.complaintId.toString()] = v.voteType;
    });

    res.status(200).json(new ApiResponse(200, voteMap, "User votes fetched successfully"));
});

export { vote, complaintViseVotes, deleteVote, getUserVotes };