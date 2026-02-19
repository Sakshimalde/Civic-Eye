/**
 * AI Photo Validation Route
 * POST /api/v1/ai/validate-photo
 *
 * Uses the civic_issue_model_new.h5 model (via Python subprocess or a Python Flask microservice)
 * to verify that an uploaded photo matches the selected civic issue category.
 *
 * SETUP INSTRUCTIONS:
 * 1. Place civic_issue_model_new.h5 somewhere accessible, e.g. /server/models/civic_issue_model_new.h5
 * 2. Install Python deps: pip install tensorflow pillow numpy flask
 * 3. Run the Python model server: python modelServer.py
 * 4. Register this router in your Express app:
 *    const aiRoute = require('./routes/aiValidationRoute');
 *    app.use('/api/v1/ai', aiRoute);
 */

import express from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
const router = express.Router();

// Multer: keep file in memory so we can forward it to the Python model server
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// Map frontend category names → model class labels
// These MUST match the class names your model was trained on exactly.
const CATEGORY_TO_MODEL_LABEL = {
    'Garbage & Waste': 'Garbage',
    'Potholes': 'Potholes',
    'Street Lights': 'Street Lights',
    'Water Issues': 'Water Issues',
    'Vandalism': 'Vandalism',
};

const PYTHON_MODEL_SERVER_URL = process.env.MODEL_SERVER_URL || 'http://localhost:5001';

/**
 * POST /api/v1/ai/validate-photo
 * Body (multipart/form-data):
 *   - photo: image file
 *   - category: string (e.g. "Garbage & Waste")
 */
router.post('/validate-photo', upload.single('photo'), async (req, res) => {
    try {
        const { category } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'No photo provided.' });
        }

        const expectedLabel = CATEGORY_TO_MODEL_LABEL[category];
        if (!expectedLabel) {
            // Category doesn't require AI validation (e.g. "Other")
            return res.json({
                valid: true,
                predictedClass: null,
                confidence: null,
                message: 'Category does not require AI photo validation.'
            });
        }

        // Forward photo to the Python model server
        const form = new FormData();
        form.append('photo', file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype
        });
        form.append('expected_label', expectedLabel);

        const modelResponse = await axios.post(
            `${PYTHON_MODEL_SERVER_URL}/predict`,
            form,
            { headers: form.getHeaders(), timeout: 15000 }
        );

        const { predicted_class, confidence, is_match } = modelResponse.data;

        if (is_match) {
            return res.json({
                valid: true,
                predictedClass: predicted_class,
                confidence: confidence,
                message: `Photo confirmed as a ${predicted_class} issue.`
            });
        } else {
            return res.json({
                valid: false,
                predictedClass: predicted_class,
                confidence: confidence,
                message: `This photo appears to show "${predicted_class}", not "${category}". Please upload a relevant photo.`
            });
        }

    } catch (error) {
        console.error('AI Validation Error:', error.message);

        // Gracefully degrade — don't block users if model server is down
        return res.json({
            valid: true,
            predictedClass: null,
            confidence: null,
            message: 'AI validation service unavailable — photo accepted without verification.'
        });
    }
});

export default router;