// vote.routes.js

import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { complaintViseVotes, deleteVote, vote, getUserVotes } from "../controllers/vote.controller.js"; // ⭐ FIX 7: Import getUserVotes

let voteRouter = Router();

voteRouter.route("/:complaintId").post(verifyJWT, vote);   //?category=up/down
voteRouter.route("/:complaintId").get(verifyJWT, complaintViseVotes);  // complaint vise votes
voteRouter.route("/:complaintId").delete(verifyJWT, deleteVote)

// ⭐ FIX 8: Add the route for fetching user votes on multiple issues
voteRouter.route("/user-votes").get(verifyJWT, getUserVotes);

export default voteRouter;