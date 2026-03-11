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
    
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low'
    },

    // ✅ Volunteer's proof photo submitted when marking resolved — kept separate from original complaint photo
    proofPhoto: {
        type: String,
        default: ""
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

    // ✅ Admin rejected this complaint entirely — stops all further processing
    isRejected: {
        type: Boolean,
        default: false
    },

    // ✅ Admin rejection reason shown to citizen
    rejectionNote: {
        type: String,
        default: ""
    },

    // ✅ Volunteer has submitted a resolution awaiting admin approval
    pendingUpdate: {
        type: Boolean,
        default: false
    },

    // ✅ Admin rejected the volunteer's resolution — volunteer must retry
    resolutionRejected: {
        type: Boolean,
        default: false
    },

    // ✅ Reason admin rejected the resolution — shown to volunteer on their assigned issues page
    resolutionRejectionNote: {
        type: String,
        default: ""
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