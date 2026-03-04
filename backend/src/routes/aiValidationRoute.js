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

const PYTHON_MODEL_SERVER_URL =
    process.env.MODEL_SERVER_URL || 'http://localhost:5001';

// ─────────────────────────────────────────────
// 🔔 Wake ping — hits /health to warm up the
//    Render free-tier instance before predict
// ─────────────────────────────────────────────
const wakeServer = async () => {
    try {
        console.log('[AI] Pinging server to wake from sleep...');
        await axios.get(`${PYTHON_MODEL_SERVER_URL}/health`, {
            timeout: 60000 // allow up to 60s for cold start
        });
        console.log('[AI] Server is awake and healthy.');
    } catch (err) {
        // Don't throw — server might still come up by the time we call /predict
        console.warn('[AI] Wake ping failed:', err.message, '— will still attempt predict.');
    }
};

// ─────────────────────────────────────────────
// 🔁 Retry helper
//    Attempt 1 → wait 45s (absorbs cold start)
//    Attempt 2 → wait 15s
//    Attempt 3 → final, throw on failure
// ─────────────────────────────────────────────
const RETRYABLE_CODES = new Set([
    'ECONNABORTED',
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EPIPE',
]);

const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

const callFlaskWithRetry = async (formData, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(
                `[AI] Attempt ${attempt}/${retries} → ${PYTHON_MODEL_SERVER_URL}/predict`
            );

            const response = await axios.post(
                `${PYTHON_MODEL_SERVER_URL}/predict`,
                formData,
                {
                    headers: formData.getHeaders(),
                    timeout: 120000 // 120s — generous for cold-start + inference
                }
            );

            return response;

        } catch (err) {
            const status = err.response?.status;
            const code = err.code;
            const isLastAttempt = attempt === retries;
            const isRetryable =
                RETRYABLE_CODES.has(code) || RETRYABLE_STATUSES.has(status);

            if (!isLastAttempt && isRetryable) {
                // 45s on first retry (Render cold start), 15s on second
                const delay = attempt === 1 ? 45000 : 15000;
                console.log(
                    `[AI] Attempt ${attempt} failed (${status || code}) — retrying in ${delay / 1000}s...`
                );
                await new Promise(res => setTimeout(res, delay));
                continue;
            }

            // Non-retryable or last attempt — bubble up
            throw err;
        }
    }
};

// ─────────────────────────────────────────────
// 🧠 AI Validation Route
//    POST /validate-photo
//    Body: multipart/form-data
//      - photo: image file
//      - category: string (must match CATEGORY_TO_MODEL_LABEL)
// ─────────────────────────────────────────────
router.post('/validate-photo', upload.single('photo'), async (req, res) => {
    try {
        const { category } = req.body;
        const file = req.file;

        // ── Guard: photo missing ──────────────────
        if (!file) {
            return res.status(400).json({
                valid: false,
                serverDown: false,
                message: 'No photo provided.'
            });
        }

        // ── Guard: category not AI-validated ─────
        const expectedLabel = CATEGORY_TO_MODEL_LABEL[category];
        if (!expectedLabel) {
            return res.json({
                valid: true,
                serverDown: false,
                predictedClass: null,
                confidence: null,
                message: 'Category does not require AI validation.'
            });
        }

        // ── Wake the Render instance first ────────
        await wakeServer();

        // ── Build multipart form for Flask ────────
        const form = new FormData();
        form.append('photo', file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype
        });
        form.append('expected_label', expectedLabel);

        // ── Call Flask with retry logic ───────────
        const modelResponse = await callFlaskWithRetry(form);
        const { predicted_class, confidence, is_match, note } = modelResponse.data;

        if (is_match) {
            return res.json({
                valid: true,
                serverDown: false,
                predictedClass: predicted_class,
                confidence,
                message: note
                    ? `Photo accepted (${predicted_class}, low confidence).`
                    : `Photo confirmed as a ${predicted_class} issue.`
            });
        } else {
            return res.json({
                valid: false,
                serverDown: false,
                predictedClass: predicted_class,
                confidence,
                message: `This photo appears to show "${predicted_class}", not "${category}". Please upload a relevant photo.`
            });
        }

    } catch (error) {
        console.error('[AI] Server unreachable after all retries:', error.message);

        // Return 503 + serverDown flag so the frontend can
        // decide whether to block or allow submission
        return res.status(503).json({
            valid: false,
            serverDown: true,
            predictedClass: null,
            confidence: null,
            message: 'AI validation is temporarily unavailable. Please try again in a moment.'
        });
    }
});

export default router;