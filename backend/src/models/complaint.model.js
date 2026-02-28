// complaint.model.js

import mongoose, { Mongoose } from "mongoose";

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

    // 💡 FIX: Removed the restrictive 'enum' to allow saving Volunteer Names (strings)
    assignedTo: {
        type: String, // Now accepts any string, including volunteer names or department names
        required: true,
        default: "Ward/zone office and central admin" // Use a valid initial default value
    },

    status: {
        type: String, 
        enum: ["recived", "inReview", "resolved", "in progress"], // Added "in progress"
        default: "recived"
    },

    // ✅ ADDED FIELDS for Volunteer Updates and Admin Review
    pendingUpdate: {
        type: Boolean,
        default: false // Set to true by Volunteer, reset by Admin
    },

    workNotes: {
        type: String,
        default: "" // Volunteer's notes on the work done
    },
    
    // Admin rejection note (optional)
    rejectionNote: { 
        type: String,
        default: "" 
    },
    // --------------------------------------------------------

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