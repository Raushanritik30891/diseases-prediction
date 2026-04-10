"""
app.py  –  Disease Prediction Flask API
"""

import os
import pickle
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

# ── App Setup ─────────────────────────────────────────
app = Flask(__name__)

# ✅ FULL CORS FIX (important)
CORS(
    app,
    resources={r"/*": {"origins": "*"}},
    supports_credentials=True,
)

@app.before_request
def handle_options():
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        headers = response.headers

        headers["Access-Control-Allow-Origin"] = "*"
        headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"

        return response

# ── Paths ─────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")

# ── Load Model ────────────────────────────────────────
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError("model.pkl not found!")

with open(MODEL_PATH, "rb") as f:
    bundle = pickle.load(f)

MODEL          = bundle["model"]
ALL_SYMPTOMS   = bundle["all_symptoms"]
PRECAUTION_MAP = bundle["precaution_map"]

print(f"✅ Model loaded | {len(ALL_SYMPTOMS)} symptoms | {len(PRECAUTION_MAP)} diseases")


# ── Helper Function ───────────────────────────────────
def symptoms_to_vector(symptom_list):
    normalised = {s.strip().lower().replace(" ", "_") for s in symptom_list}
    return np.array(
        [1 if s in normalised else 0 for s in ALL_SYMPTOMS],
        dtype=int,
    ).reshape(1, -1)


# ── Routes ────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": "loaded"})


@app.route("/symptoms", methods=["GET", "OPTIONS"])
def get_symptoms():
    display = [s.replace("_", " ").title() for s in ALL_SYMPTOMS]
    return jsonify({"symptoms": display, "count": len(display)})


@app.route("/predict", methods=["POST", "OPTIONS"])
def predict():

    # Handle preflight manually (extra safe)
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json(silent=True)

    if not data or "symptoms" not in data:
        return jsonify({"error": "Request must contain 'symptoms'"}), 400

    raw_symptoms = data["symptoms"]
    if not isinstance(raw_symptoms, list) or len(raw_symptoms) == 0:
        return jsonify({"error": "Symptoms must be a non-empty list"}), 400

    vec   = symptoms_to_vector(raw_symptoms)
    proba = MODEL.predict_proba(vec)[0]
    idx   = int(np.argmax(proba))

    disease     = MODEL.classes_[idx]
    confidence  = round(float(proba[idx]), 4)
    precautions = PRECAUTION_MAP.get(disease, ["Consult a doctor"])

    top3_idx = np.argsort(proba)[::-1][:3]
    alternatives = [
        {"disease": MODEL.classes_[i], "confidence": round(float(proba[i]), 4)}
        for i in top3_idx
    ]

    matched = {
        x.strip().lower().replace(" ", "_") for x in raw_symptoms
    }

    return jsonify({
        "disease": disease,
        "confidence": confidence,
        "precautions": precautions,
        "alternatives": alternatives,
        "symptoms_matched": [
            s.replace("_", " ").title() for s in ALL_SYMPTOMS if s in matched
        ],
    })


# ── Run ───────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
