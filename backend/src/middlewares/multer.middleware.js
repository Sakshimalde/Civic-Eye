import multer from "multer";
import fs from "fs";

// ensure folder exists
const uploadDir = "./uploads/profilePhotos";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // new folder
    },
    filename: (req, file, cb) => {
        const ext = file.originalname.split('.').pop();
        const uniqueName = `user-${Date.now()}.${ext}`; // unique name
        cb(null, uniqueName);
    }
});

export const upload = multer({ storage });
