"""
app.py  –  Disease Prediction Flask API
========================================
Endpoints:
  GET  /health          → liveness probe
  GET  /symptoms        → list of all known symptoms
  POST /predict         → { "symptoms": ["fever", ...] } → prediction
"""

import os
import pickle
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

# ── Bootstrap ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)          # allow requests from any frontend origin

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")

# ── Load trained artefacts ────────────────────────────────────────────────────
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        "model.pkl not found – run `python train_model.py` first!"
    )

with open(MODEL_PATH, "rb") as f:
    bundle = pickle.load(f)

MODEL          = bundle["model"]
ALL_SYMPTOMS   = bundle["all_symptoms"]   # sorted list of symptom strings
PRECAUTION_MAP = bundle["precaution_map"] # disease → list[str]

print(f"✅  Model loaded  |  {len(ALL_SYMPTOMS)} symptoms  |  {len(PRECAUTION_MAP)} diseases")


# ── Helper ────────────────────────────────────────────────────────────────────
def symptoms_to_vector(symptom_list: list[str]) -> np.ndarray:
    """Convert a list of symptom strings into a binary feature vector."""
    # Normalise: lower-case and replace spaces with underscores
    normalised = {s.strip().lower().replace(" ", "_") for s in symptom_list}
    return np.array(
        [1 if s in normalised else 0 for s in ALL_SYMPTOMS],
        dtype=int,
    ).reshape(1, -1)


# ── Routes ────────────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    """Simple liveness probe."""
    return jsonify({"status": "ok", "model": "loaded"})


@app.route("/symptoms", methods=["GET"])
def get_symptoms():
    """Return the full list of recognised symptoms (for autocomplete)."""
    # Return display-friendly versions (replace _ with space, title-case)
    display = [s.replace("_", " ").title() for s in ALL_SYMPTOMS]
    return jsonify({"symptoms": display, "count": len(display)})


@app.route("/predict", methods=["POST"])
def predict():
    """
    Predict disease from a list of symptoms.

    Request body (JSON):
        { "symptoms": ["Fever", "Headache", "Nausea"] }

    Response (JSON):
        {
          "disease":     "Malaria",
          "confidence":  0.87,
          "precautions": ["Drink water", "Avoid mosquitos", ...]
        }
    """
    data = request.get_json(silent=True)

    # ── Validate input ────────────────────────────────────────────────────────
    if not data or "symptoms" not in data:
        return jsonify({"error": "Request body must contain a 'symptoms' key."}), 400

    raw_symptoms = data["symptoms"]
    if not isinstance(raw_symptoms, list) or len(raw_symptoms) == 0:
        return jsonify({"error": "'symptoms' must be a non-empty list."}), 400

    # ── Predict ───────────────────────────────────────────────────────────────
    vec   = symptoms_to_vector(raw_symptoms)
    proba = MODEL.predict_proba(vec)[0]
    idx   = int(np.argmax(proba))

    disease    = MODEL.classes_[idx]
    confidence = round(float(proba[idx]), 4)
    precautions = PRECAUTION_MAP.get(disease, ["Consult a doctor immediately."])

    # Top-3 alternative predictions
    top3_idx = np.argsort(proba)[::-1][:3]
    alternatives = [
        {"disease": MODEL.classes_[i], "confidence": round(float(proba[i]), 4)}
        for i in top3_idx
    ]

    return jsonify(
        {
            "disease":      disease,
            "confidence":   confidence,
            "precautions":  precautions,
            "alternatives": alternatives,
            "symptoms_matched": [
                s.replace("_", " ").title()
                for s in ALL_SYMPTOMS
                if s in {x.strip().lower().replace(" ", "_") for x in raw_symptoms}
            ],
        }
    )


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
