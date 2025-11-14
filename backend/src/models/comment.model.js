// Comment.model.js
import mongoose, { Schema } from "mongoose";

let commentSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    complaintId: {
        type: Schema.Types.ObjectId,
        ref: "Complaint",
        required: true
    },
    content: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: () => new Date()
    },
    updatedAt: {
        type: Date,
        default: () => new Date()
    },
});

export const Comment = mongoose.model("Comment", commentSchema);