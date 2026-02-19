"""
modelServer.py — Python Flask server that loads civic_issue_model_new.h5
and exposes a /predict endpoint for the Node.js backend to call.

SETUP:
  pip install tensorflow pillow numpy flask

RUN:
  python modelServer.py

The server listens on port 5001 by default (configurable via PORT env var).

IMPORTANT: Update CLASS_LABELS below to exactly match the order your model
was trained on. The order matters — it must match the folder order used
during model training (typically alphabetical if you used ImageDataGenerator
with flow_from_directory).
"""

import os
import io
import numpy as np
from flask import Flask, request, jsonify
from PIL import Image
import tensorflow as tf

app = Flask(__name__)

# ─── Configuration ────────────────────────────────────────────────────────────

MODEL_PATH = os.environ.get('MODEL_PATH', './models/civic_issue_model_new.h5')

# UPDATE THIS LIST to match EXACTLY the class order your model was trained on.
# Typically this is alphabetical order of your training folder names.
CLASS_LABELS = [
    'Garbage',       # index 0
    'Potholes',      # index 1
    'Street Lights', # index 2
    'Vandalism',     # index 3
    'Water Issues',  # index 4
]

# Image size your model expects (must match training config)
IMAGE_SIZE = (224, 224)  # Change if your model uses a different input size

# Confidence threshold — predictions below this are treated as "uncertain"
CONFIDENCE_THRESHOLD = 0.50

# ─── Load Model ───────────────────────────────────────────────────────────────

print(f"Loading model from {MODEL_PATH} ...")
model = tf.keras.models.load_model(MODEL_PATH)
print("Model loaded successfully.")
print(f"Model input shape: {model.input_shape}")
print(f"Class labels: {CLASS_LABELS}")

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'classes': CLASS_LABELS})


@app.route('/predict', methods=['POST'])
def predict():
    if 'photo' not in request.files:
        return jsonify({'error': 'No photo file provided'}), 400

    photo_file = request.files['photo']
    expected_label = request.form.get('expected_label', '').strip()

    try:
        # Load and preprocess the image
        img_bytes = photo_file.read()
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
        img = img.resize(IMAGE_SIZE)
        img_array = np.array(img, dtype=np.float32) / 255.0  # Normalize to [0, 1]
        img_array = np.expand_dims(img_array, axis=0)        # Add batch dimension

        # Run inference
        predictions = model.predict(img_array, verbose=0)
        predicted_index = int(np.argmax(predictions[0]))
        confidence = float(predictions[0][predicted_index])

        if predicted_index >= len(CLASS_LABELS):
            return jsonify({'error': 'Predicted index out of range for CLASS_LABELS'}), 500

        predicted_class = CLASS_LABELS[predicted_index]

        # Determine if prediction matches expected category
        is_match = (
            predicted_class.lower() == expected_label.lower() and
            confidence >= CONFIDENCE_THRESHOLD
        )

        # If confidence is too low, treat as uncertain (don't block the user)
        if confidence < CONFIDENCE_THRESHOLD:
            is_match = True  # Gracefully pass low-confidence predictions
            predicted_class = f"{predicted_class} (low confidence)"

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
        print(f"Prediction error: {e}")
        return jsonify({'error': str(e)}), 500


# ─── Start Server ─────────────────────────────────────────────────────────────

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    print(f"Starting model server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
