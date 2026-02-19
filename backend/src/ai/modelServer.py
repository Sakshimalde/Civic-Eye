import os
import io
import sys
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import tensorflow as tf
import tensorflow as tf
tf.compat.v1.disable_eager_execution()

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.environ.get('MODEL_PATH', './civic_issue_model_new.h5')

CLASS_LABELS = [
    'Garbage',
    'Potholes',
    'Street Lights',
    'Vandalism',
    'Water Issues',
]

IMAGE_SIZE = (224, 224)
CONFIDENCE_THRESHOLD = 0.50

# Load model

print(f"Loading model from {MODEL_PATH} ...", flush=True)

if not os.path.exists(MODEL_PATH):
    print(f"ERROR: Model file not found at {MODEL_PATH}", flush=True)
    print(f"Files in current directory: {os.listdir('.')}", flush=True)
    sys.exit(1)

try:
    model = tf.keras.models.load_model(MODEL_PATH, compile=False)
    print("Model loaded successfully.", flush=True)
    print(f"Model input shape: {model.input_shape}", flush=True)
except Exception as e:
    print(f"ERROR loading model: {e}", flush=True)
    sys.exit(1)

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
        img_bytes = photo_file.read()
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
        img = img.resize(IMAGE_SIZE)
        img_array = np.array(img, dtype=np.float32) / 255.0
        img_array = np.expand_dims(img_array, axis=0)

        predictions = model.predict(img_array, verbose=0)
        predicted_index = int(np.argmax(predictions[0]))
        confidence = float(predictions[0][predicted_index])
        predicted_class = CLASS_LABELS[predicted_index]

        if confidence < CONFIDENCE_THRESHOLD:
            return jsonify({
                'predicted_class': predicted_class,
                'confidence': round(confidence, 4),
                'is_match': True,
                'expected_label': expected_label,
                'note': 'Low confidence — accepted without strict validation'
            })

        is_match = predicted_class.lower() == expected_label.lower()

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
        print(f"Prediction error: {e}", flush=True)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    print(f"Starting model server on port {port}...", flush=True)
    app.run(host='0.0.0.0', port=port, debug=False)