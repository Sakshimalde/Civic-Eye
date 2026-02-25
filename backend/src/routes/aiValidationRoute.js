import express from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

const CATEGORY_TO_MODEL_LABEL = {
    'Garbage & Waste': 'Garbage',
    'Potholes': 'Potholes',
    'Street Lights': 'Street Lights',
    'Water Issues': 'Water Issues',
    'Vandalism': 'Vandalism',
};

const PYTHON_MODEL_SERVER_URL = process.env.MODEL_SERVER_URL || 'http://localhost:5001';

// ← CHANGED: retry helper — tries up to 3 times with 5s gap between attempts
const callFlaskWithRetry = async (formData, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`[AI] Attempt ${attempt}/${retries} → ${PYTHON_MODEL_SERVER_URL}/predict`);
            const response = await axios.post(
                `${PYTHON_MODEL_SERVER_URL}/predict`,
                formData,
                {
                    headers: formData.getHeaders(),
                    timeout: 60000, // ← CHANGED: 60s instead of 15s — gives Render cold start time
                }
            );
            return response;
        } catch (err) {
            const status = err.response?.status;
            const isLastAttempt = attempt === retries;

            // ← CHANGED: retry on 429, 503, timeout, or connection reset
            if (!isLastAttempt && (status === 429 || status === 503 || err.code === 'ECONNABORTED' || err.code === 'ECONNRESET')) {
                console.log(`[AI] Attempt ${attempt} failed (${status || err.code}) — waiting 5s before retry...`);
                await new Promise(res => setTimeout(res, 5000));
                continue;
            }

            throw err;
        }
    }
};

router.post('/validate-photo', upload.single('photo'), async (req, res) => {
    try {
        const { category } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'No photo provided.' });
        }

        const expectedLabel = CATEGORY_TO_MODEL_LABEL[category];
        if (!expectedLabel) {
            return res.json({
                valid: true,
                predictedClass: null,
                confidence: null,
                message: 'Category does not require AI photo validation.'
            });
        }

        const form = new FormData();
        form.append('photo', file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype
        });
        form.append('expected_label', expectedLabel);

        const modelResponse = await callFlaskWithRetry(form); // ← CHANGED: use retry helper

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
        console.error('[AI] All retries failed:', error.message);
        return res.json({
            valid: true,
            predictedClass: null,
            confidence: null,
            message: 'AI validation service unavailable — photo accepted without verification.'
        });
    }
});

export default router;