import os
import io
import sys
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import tensorflow as tf

# ── Eager execution (safe for TF1-style saved models) ──────────────
tf.compat.v1.enable_eager_execution()

app = Flask(__name__)
CORS(app)

# ── Config ──────────────────────────────────────────────────────────
MODEL_PATH = os.environ.get('MODEL_PATH', './best_civic_model.h5')

CLASS_LABELS = [
    'Garbage',
    'Potholes',
    'Street Lights',
    'Vandalism',
    'Water Issues',
]

IMAGE_SIZE = (224, 224)

# Predictions below this threshold are accepted without strict label
# matching (model is uncertain — better to allow than hard-block)
CONFIDENCE_THRESHOLD = 0.50

# ── Model loading ────────────────────────────────────────────────────
model = None

def load_model():
    global model
    print(f"[Model] Loading from: {MODEL_PATH}", flush=True)

    # Primary loader
    try:
        model = tf.keras.saving.load_model(MODEL_PATH, compile=False)
        print("[Model] Loaded successfully (keras.saving).", flush=True)
        print(f"[Model] Input shape: {model.input_shape}", flush=True)
        return
    except Exception as e:
        print(f"[Model] keras.saving failed: {e}", flush=True)

    # Legacy fallback
    try:
        model = tf.keras.models.load_model(MODEL_PATH, compile=False)
        print("[Model] Loaded successfully (legacy loader).", flush=True)
        print(f"[Model] Input shape: {model.input_shape}", flush=True)
        return
    except Exception as e2:
        print(f"[Model] Legacy loader also failed: {e2}", flush=True)
        sys.exit(1)

load_model()


# ── Routes ───────────────────────────────────────────────────────────

@app.route('/health', methods=['GET'])
def health():
    """
    Lightweight health check.
    Called by the Node server before /predict to warm up the
    Render free-tier instance and confirm the model is ready.
    """
    return jsonify({
        'status': 'ok',
        'model_loaded': model is not None,
        'classes': CLASS_LABELS
    })


@app.route('/predict', methods=['POST'])
def predict():
    """
    Accepts multipart/form-data with:
        photo         — image file (required)
        expected_label — label string to match against (optional)

    Returns JSON:
        predicted_class  — top predicted class name
        confidence       — float 0–1
        is_match         — bool (True if predicted == expected, or low confidence)
        expected_label   — echoed back
        all_predictions  — dict of class → score (omitted on low-confidence)
        note             — present when low-confidence bypass is applied
    """
    # ── Guard: photo missing ─────────────────────────────────────────
    if 'photo' not in request.files:
        return jsonify({'error': 'No photo file provided'}), 400

    photo_file = request.files['photo']
    expected_label = request.form.get('expected_label', '').strip()

    try:
        # ── Preprocess image ──────────────────────────────────────────
        img_bytes = photo_file.read()
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
        img = img.resize(IMAGE_SIZE)
        img_array = np.array(img, dtype=np.float32) / 255.0
        img_array = np.expand_dims(img_array, axis=0)  # (1, 224, 224, 3)

        # ── Run inference ─────────────────────────────────────────────
        predictions = model.predict(img_array, verbose=0)
        predicted_index = int(np.argmax(predictions[0]))
        confidence = float(predictions[0][predicted_index])
        predicted_class = CLASS_LABELS[predicted_index]

        print(
            f"[Predict] {predicted_class} @ {confidence:.2%}"
            f" (expected: {expected_label or 'any'})",
            flush=True
        )

        # ── Low confidence — accept without strict validation ─────────
        if confidence < CONFIDENCE_THRESHOLD:
            return jsonify({
                'predicted_class': predicted_class,
                'confidence': round(confidence, 4),
                'is_match': True,
                'expected_label': expected_label,
                'note': 'Low confidence — accepted without strict validation'
            })

        # ── Normal confidence — compare labels ────────────────────────
        is_match = (
            predicted_class.lower() == expected_label.lower()
            if expected_label
            else True  # No expected label → always accept
        )

        return jsonify({
            'predicted_class': predicted_class,
            'confidence': round(confidence, 4),
            'is_match': is_match,
            'expected_label': expected_label,
            'all_predictions': {
                CLASS_LABELS[i]: round(float(predictions[0][i]), 4)
                for i in range(len(CLASS_LABELS))
            }
        })

    except Exception as e:
        print(f"[Predict] Error: {e}", flush=True)
        return jsonify({'error': str(e)}), 500


# ── Entry point ───────────────────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    print(f"[Server] Starting on port {port}...", flush=True)
    app.run(host='0.0.0.0', port=port, debug=False)