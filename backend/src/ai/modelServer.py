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
]

# Raw model output labels
RAW_MODEL_LABELS = [
    'Garbage',
    'Potholes',
    'Street Lights',
    'Vandalism',
    'Water Issues',
]

# Valid public categories
VALID_LABELS = {
    'Garbage',
    'Potholes',
    'Street Lights',
    'Water Issues'
}

IMAGE_SIZE = (224, 224)

# Minimum confidence required
CONFIDENCE_THRESHOLD = 0.50

model = None


def load_model():
    global model

    print(f"[Model] Loading from: {MODEL_PATH}", flush=True)

    try:
        model = tf.keras.saving.load_model(
            MODEL_PATH,
            compile=False
        )
        print("[Model] Loaded successfully (keras.saving).", flush=True)
        return

    except Exception as e:
        print(f"[Model] keras.saving failed: {e}", flush=True)

    try:
        model = tf.keras.models.load_model(
            MODEL_PATH,
            compile=False
        )
        print("[Model] Loaded successfully (legacy loader).", flush=True)
        return

    except Exception as e:
        print(f"[Model] Legacy loader failed: {e}", flush=True)
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
        return jsonify({
            'error': 'No photo file provided'
        }), 400

    photo_file = request.files['photo']
    expected_label = request.form.get('expected_label', '').strip()

    try:

        # Read image
        img_bytes = photo_file.read()

        img = Image.open(
            io.BytesIO(img_bytes)
        ).convert('RGB')

        img = img.resize(IMAGE_SIZE)

        img_array = np.array(
            img,
            dtype=np.float32
        ) / 255.0

        img_array = np.expand_dims(img_array, axis=0)

        # Predict
        predictions = model.predict(
            img_array,
            verbose=0
        )

        predicted_index = int(
            np.argmax(predictions[0])
        )

        confidence = float(
            predictions[0][predicted_index]
        )

        raw_label = RAW_MODEL_LABELS[predicted_index]

        # Convert unsupported labels to Other
        predicted_class = (
            raw_label
            if raw_label in VALID_LABELS
            else 'Other'
        )

        print(
            f"[Predict] raw={raw_label} → {predicted_class} "
            f"@ {confidence:.2%} "
            f"(expected: {expected_label or 'any'})",
            flush=True
        )

        # -----------------------------------------
        # REJECT unrelated / unknown images
        # -----------------------------------------
        if predicted_class == 'Other':

            return jsonify({
                'predicted_class': 'Other',
                'confidence': round(confidence, 4),
                'is_match': False,
                'expected_label': expected_label,
                'note': 'Photo mismatch - uploaded image does not match selected category'
            })

        # -----------------------------------------
        # REJECT low confidence images
        # -----------------------------------------
        if confidence < CONFIDENCE_THRESHOLD:

            return jsonify({
                'predicted_class': predicted_class,
                'confidence': round(confidence, 4),
                'is_match': False,
                'expected_label': expected_label,
                'note': 'Low confidence image. Please upload a clearer image.'
            })

        # -----------------------------------------
        # NORMAL CATEGORY MATCHING
        # -----------------------------------------
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
                RAW_MODEL_LABELS[i]: round(
                    float(predictions[0][i]),
                    4
                )
                for i in range(len(RAW_MODEL_LABELS))
            }
        })

    except Exception as e:

        print(f"[Predict] Error: {e}", flush=True)

        return jsonify({
            'error': str(e)
        }), 500


if __name__ == '__main__':

    port = int(
        os.environ.get('PORT', 7860)
    )

    print(
        f"[Server] Starting on port {port}...",
        flush=True
    )

    app.run(
        host='0.0.0.0',
        port=port,
        debug=False
    )