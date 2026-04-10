# 🧬 MediScan AI — Disease Prediction Web App

> An AI-powered, full-stack disease prediction application built with Python, Flask, scikit-learn and Vanilla JS. Enter your symptoms and get an instant probable diagnosis + precautions — entirely in the browser.

![MediScan AI Banner](https://via.placeholder.com/900x400/060d18/00dcc8?text=MediScan+AI+%E2%80%94+Disease+Prediction)

---

## ✨ Features

| Feature | Detail |
|---|---|
| 🤖 AI Model | Random Forest (scikit-learn) trained on 40+ diseases |
| 💊 Precautions | Personalised prevention tips per diagnosis |
| 🔍 Smart Search | Live symptom autocomplete (130+ symptoms) |
| 📊 Confidence Score | Animated SVG ring showing model confidence |
| 🔄 Alternatives | Top-3 possible diagnoses ranked by probability |
| 🎨 Modern UI | Glassmorphism, animated background, DM Sans + Syne fonts |
| 📱 Responsive | Works on mobile, tablet and desktop |
| 🚀 Deploy-ready | Render (backend) + Netlify (frontend) one-click deploy |

---

## 🗂️ Project Structure

```
disease-prediction-app/
├── backend/
│   ├── app.py              # Flask REST API
│   ├── train_model.py      # Model training script
│   ├── requirements.txt    # Python dependencies
│   ├── render.yaml         # Render deployment config
│   └── Procfile            # Gunicorn start command
├── frontend/
│   ├── index.html          # Main app page
│   ├── style.css           # Full stylesheet
│   ├── app.js              # API integration + UI logic
│   └── netlify.toml        # Netlify deploy config
├── dataset/
│   ├── symptoms_disease.csv  # Disease ↔ Symptom mapping
│   └── precautions.csv       # Disease ↔ Precautions mapping
└── README.md
```

---

## 📊 Datasets

The app ships with curated CSV datasets. You can replace them with the original Kaggle sources for a larger model:

| Dataset | Link |
|---|---|
| Disease + Symptoms | [kaggle.com/datasets/itachi9604/disease-symptom-description-dataset](https://www.kaggle.com/datasets/itachi9604/disease-symptom-description-dataset) |
| Disease + Precautions | [kaggle.com/datasets/itachi9604/disease-symptom-description-dataset](https://www.kaggle.com/datasets/itachi9604/disease-symptom-description-dataset) |

Both are merged on the `Disease` column during training.

---

## 🚀 Local Setup

### Prerequisites
- Python 3.10+
- Node.js not required (pure HTML/CSS/JS frontend)
- A modern browser

### 1 — Clone the repo
```bash
git clone https://github.com/your-username/disease-prediction-app.git
cd disease-prediction-app
```

### 2 — Set up the backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Train the model (generates model.pkl)
python train_model.py
```

### 3 — Start the Flask server
```bash
python app.py
# → http://localhost:5000
```

### 4 — Open the frontend
Simply open `frontend/index.html` in your browser — **no build step needed**.

> Make sure `API_BASE` in `app.js` points to `http://localhost:5000` (it does by default when running locally).

---

## 🌐 API Reference

### `GET /health`
Liveness probe.
```json
{ "status": "ok", "model": "loaded" }
```

### `GET /symptoms`
Returns all recognisable symptom names (display-friendly).
```json
{ "symptoms": ["Fever", "Headache", ...], "count": 132 }
```

### `POST /predict`
**Request:**
```json
{
  "symptoms": ["High Fever", "Headache", "Nausea", "Vomiting", "Chills"]
}
```
**Response:**
```json
{
  "disease":     "Malaria",
  "confidence":  0.87,
  "precautions": ["Consult nearest hospital", "Avoid oily fatty spicy food", "Keep mosquitos away", "Keep environment clean"],
  "alternatives": [
    { "disease": "Malaria",   "confidence": 0.87 },
    { "disease": "Dengue",    "confidence": 0.08 },
    { "disease": "Typhoid",   "confidence": 0.03 }
  ],
  "symptoms_matched": ["Chills", "Vomiting", "High Fever", "Headache", "Nausea"]
}
```

---

## ☁️ Deployment

### Backend → Render

1. Push the `backend/` folder to a GitHub repo.
2. Go to [render.com](https://render.com) → **New Web Service**.
3. Connect your GitHub repo.
4. Render will auto-detect `render.yaml` and set:
   - **Build command:** `pip install -r requirements.txt && python train_model.py`
   - **Start command:** `gunicorn app:app`
5. Click **Deploy**. Copy the live URL (e.g. `https://disease-api.onrender.com`).

### Frontend → Netlify

1. In `frontend/app.js` update line:
   ```js
   : "https://your-backend.onrender.com";
   ```
   with your real Render URL.
2. Push `frontend/` to GitHub.
3. Go to [netlify.com](https://netlify.com) → **New site from Git**.
4. Select repo, set **Publish directory** to `frontend/`.
5. Deploy — done! 🎉

### Environment Variables (optional)
| Key | Default | Purpose |
|---|---|---|
| `PORT` | `5000` | Override Flask port |

---

## 🖥️ Screenshots

> _Replace with real screenshots after deployment_

| Symptom Selection | Result Card |
|---|---|
| ![select](https://via.placeholder.com/420x260/0b1628/00dcc8?text=Symptom+Grid) | ![result](https://via.placeholder.com/420x260/0b1628/3b82f6?text=Diagnosis+Result) |

---

## 🤝 Contributing

Pull requests are welcome! For major changes, open an issue first.

1. Fork the project
2. Create your feature branch (`git checkout -b feat/awesome-feature`)
3. Commit your changes (`git commit -m 'feat: add awesome feature'`)
4. Push to the branch and open a PR

---

## ⚠️ Disclaimer

This app is for **educational and demonstration purposes only**. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.

---

## 📄 License

MIT © 2024 — Built for learning, not medical use.
