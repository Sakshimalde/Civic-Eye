import os
import io
import sys
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import tensorflow as tf

tf.compat.v1.enable_eager_execution()

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.environ.get('MODEL_PATH', './best_civic_model.h5')

CLASS_LABELS = [
    'Garbage',
    'Potholes',
    'Street Lights',
    'Water Issues',
    # Vandalism removed — unrecognized images now return "Other"
]

# What the model actually outputs at each index
# If your model was trained with Vandalism at index 3, map it to Other
RAW_MODEL_LABELS = [
    'Garbage',
    'Potholes',
    'Street Lights',
    'Vandalism',   # model still outputs this index
    'Water Issues',
]

# Any raw label not in this set becomes "Other"
VALID_LABELS = {'Garbage', 'Potholes', 'Street Lights', 'Water Issues'}

IMAGE_SIZE = (224, 224)
CONFIDENCE_THRESHOLD = 0.50

model = None

def load_model():
    global model
    print(f"[Model] Loading from: {MODEL_PATH}", flush=True)
    try:
        model = tf.keras.saving.load_model(MODEL_PATH, compile=False)
        print("[Model] Loaded successfully (keras.saving).", flush=True)
        return
    except Exception as e:
        print(f"[Model] keras.saving failed: {e}", flush=True)
    try:
        model = tf.keras.models.load_model(MODEL_PATH, compile=False)
        print("[Model] Loaded successfully (legacy loader).", flush=True)
        return
    except Exception as e2:
        print(f"[Model] Legacy loader also failed: {e2}", flush=True)
        sys.exit(1)

load_model()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'model_loaded': model is not None,
        'classes': list(VALID_LABELS) + ['Other']
    })

@app.route('/predict', methods=['POST'])
def predict():
    if 'photo' not in request.files:
        return jsonify({'error': 'No photo file provided'}), 400

    photo_file = request.files['photo']
    expected_label = request.form.get('expected_label', '').strip()

    try:
        img_bytes = photo_file.read()
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
        img = img.resize(IMAGE_SIZE)
        img_array = np.array(img, dtype=np.float32) / 255.0
        img_array = np.expand_dims(img_array, axis=0)

        predictions = model.predict(img_array, verbose=0)
        predicted_index = int(np.argmax(predictions[0]))
        confidence = float(predictions[0][predicted_index])

        # Map raw model output — Vandalism becomes "Other"
        raw_label = RAW_MODEL_LABELS[predicted_index]
        predicted_class = raw_label if raw_label in VALID_LABELS else 'Other'

        print(f"[Predict] raw={raw_label} → {predicted_class} @ {confidence:.2%} (expected: {expected_label or 'any'})", flush=True)

        # Low confidence — accept without strict validation
        if confidence < CONFIDENCE_THRESHOLD:
            return jsonify({
                'predicted_class': predicted_class,
                'confidence': round(confidence, 4),
                'is_match': True,
                'expected_label': expected_label,
                'note': 'Low confidence — accepted without strict validation'
            })

        # If predicted "Other" (was Vandalism or unrecognized) — accept
        if predicted_class == 'Other':

    # If user selected a category, mark mismatch
            is_match = False if expected_label else True

            return jsonify({
                'predicted_class': 'Other',
                'confidence': round(confidence, 4),
                'is_match': is_match,
                'expected_label': expected_label,
                'note': 'Photo mismatch - uploaded image does not match selected category'
            })

        # Normal label match
        is_match = (
            predicted_class.lower() == expected_label.lower()
            if expected_label
            else True
        )

        return jsonify({
            'predicted_class': predicted_class,
            'confidence': round(confidence, 4),
            'is_match': is_match,
            'expected_label': expected_label,
            'all_predictions': {
                RAW_MODEL_LABELS[i]: round(float(predictions[0][i]), 4)
                for i in range(len(RAW_MODEL_LABELS))
            }
        })

    except Exception as e:
        print(f"[Predict] Error: {e}", flush=True)
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 7860))
    print(f"[Server] Starting on port {port}...", flush=True)
    app.run(host='0.0.0.0', port=port, debug=False)