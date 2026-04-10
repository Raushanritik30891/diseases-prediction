"""
train_model.py
==============
Loads the symptoms + precautions datasets, preprocesses them,
trains a Random Forest classifier, and saves the model + encoders.

Run once before starting the Flask server:
    python train_model.py
"""

import os
import pickle
import warnings
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# Suppress sklearn class-count warnings (expected for small curated datasets)
warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")

# ── 1. Paths ─────────────────────────────────────────────────────────────────
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "..", "dataset")
SYMP_CSV    = os.path.join(DATASET_DIR, "symptoms_disease.csv")
PREC_CSV    = os.path.join(DATASET_DIR, "precautions.csv")
MODEL_OUT   = os.path.join(BASE_DIR, "model.pkl")

# ── 2. Load datasets ──────────────────────────────────────────────────────────
print("📂  Loading datasets …")
symp_df = pd.read_csv(SYMP_CSV)
prec_df = pd.read_csv(PREC_CSV)

# ── 3. Melt symptom columns into a long list per disease ─────────────────────
symptom_cols = [c for c in symp_df.columns if c.startswith("Symptom")]

# Collect every unique symptom (strip whitespace, drop NaN)
all_symptoms = (
    symp_df[symptom_cols]
    .stack()
    .str.strip()
    .unique()
    .tolist()
)
all_symptoms = sorted(set(s for s in all_symptoms if isinstance(s, str)))
print(f"✅  Found {len(all_symptoms)} unique symptoms across {len(symp_df)} diseases")

# ── 4. Build binary feature matrix ───────────────────────────────────────────
def row_to_vector(row):
    """Convert a single dataset row into a binary symptom vector."""
    present = set(row[symptom_cols].dropna().str.strip().tolist())
    return [1 if s in present else 0 for s in all_symptoms]

X = np.array([row_to_vector(r) for _, r in symp_df.iterrows()])
y = symp_df["Disease"].str.strip().values

print(f"✅  Feature matrix: {X.shape}  |  Labels: {y.shape}")

# ── 5. Train / test split & model training ───────────────────────────────────
# Dataset is tiny – use most of it for training
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=None
)

clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train, y_train)

train_acc = accuracy_score(y_train, clf.predict(X_train))
test_acc  = accuracy_score(y_test,  clf.predict(X_test))
print(f"🎯  Train accuracy: {train_acc:.2%}  |  Test accuracy: {test_acc:.2%}")

# ── 6. Build precautions lookup dict ─────────────────────────────────────────
prec_cols  = [c for c in prec_df.columns if c.startswith("Precaution")]
precaution_map = {}
for _, row in prec_df.iterrows():
    disease = row["Disease"].strip()
    precs   = [str(row[c]).strip() for c in prec_cols if pd.notna(row[c]) and str(row[c]).strip()]
    precaution_map[disease] = precs

# ── 7. Persist everything ─────────────────────────────────────────────────────
payload = {
    "model":           clf,
    "all_symptoms":    all_symptoms,
    "precaution_map":  precaution_map,
}

with open(MODEL_OUT, "wb") as f:
    pickle.dump(payload, f)

print(f"💾  Model saved → {MODEL_OUT}")
print("✨  Training complete!")
