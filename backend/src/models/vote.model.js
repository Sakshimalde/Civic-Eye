import mongoose, { Schema } from "mongoose";

const voteSchema = new Schema({

    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true, // Id of the user
    },

    complaintId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Complaint",
        required: true, // Id of the user
    },

    voteType: {
        type: String,
        enum: ["upvote", "downvote"],
        required: true, // Id of the user
    },

    createdAt: {
        type: Date,
        default: new Date(Date.now())
    },

});

export const Vote = mongoose.model("Vote", voteSchema);