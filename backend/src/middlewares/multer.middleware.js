import multer from "multer";
import fs from "fs";
import path from "path";

// Ensure upload folders exist
const profileDir   = "./uploads/profilePhotos";
const complaintDir = "./uploads/complaintPhotos";
const proofDir     = "./uploads/proofPhotos";

[profileDir, complaintDir, proofDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Allowed image mime types
const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const fileFilter = (req, file, cb) => {
    if (IMAGE_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed (JPG, PNG, WEBP)"), false);
    }
};

// ── Profile photo storage ─────────────────────────────────────────────────────
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, profileDir),
    filename:    (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `user-${Date.now()}${ext}`);
    }
});

// ── Complaint / proof photo storage ──────────────────────────────────────────
const complaintStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // proofPhoto goes to proofPhotos folder, everything else to complaintPhotos
        const dir = file.fieldname === "proofPhoto" ? proofDir : complaintDir;
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const prefix = file.fieldname === "proofPhoto" ? "proof" : "complaint";
        cb(null, `${prefix}-${Date.now()}${ext}`);
    }
});

// 10 MB limit for complaint/proof photos
const TEN_MB  = 10 * 1024 * 1024;
// 5 MB limit for profile photos
const FIVE_MB = 5  * 1024 * 1024;

export const upload         = multer({ storage: profileStorage,   limits: { fileSize: FIVE_MB  }, fileFilter });
export const uploadComplaint = multer({ storage: complaintStorage, limits: { fileSize: TEN_MB   }, fileFilter });   