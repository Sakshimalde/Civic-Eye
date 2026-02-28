// complaint.model.js

import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    title: {
        type: String,
        required: true,
    },

    description: {
        type: String,
        required: true,
    },

    photo: {
        type: String,
    },

    locationCoords: {
        type: [Number],
        required: true
    },

    address: {
        type: [String],
        required: true
    },

    assignedTo: {
        type: String,
        required: true,
        default: "Ward/zone office and central admin"
    },

    status: {
        type: String,
        enum: ["recived", "inReview", "resolved", "in progress"],
        default: "recived"
    },

    // ✅ NEW: Admin rejected this complaint — stops all further processing
    isRejected: {
        type: Boolean,
        default: false
    },

    // ✅ Admin rejection reason shown to citizen
    rejectionNote: {
        type: String,
        default: ""
    },

    pendingUpdate: {
        type: Boolean,
        default: false
    },

    workNotes: {
        type: String,
        default: ""
    },

    comments: [
        {
            type: mongoose.Schema.ObjectId,
            ref: "Comment"
        }
    ],

    createdAt: {
        type: Date,
        default: new Date(Date.now())
    },

    updatedAt: {
        type: Date,
        default: new Date(Date.now())
    },
});

export const Complaint = mongoose.model("Complaint", complaintSchema);