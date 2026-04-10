/**
 * app.js  —  MediScan AI Frontend Logic
 * ======================================
 * • Fetches symptom list from Flask API (or uses a hardcoded fallback)
 * • Multi-select symptom grid + search + chips
 * • POST /predict  →  animated result rendering
 * • Confidence ring SVG animation
 */

// ── Configuration ──────────────────────────────────────────────────────────
// Change this to your deployed backend URL for production
const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5000"
  : "https://diseases-prediction-6.onrender.com";   // ← replace with real URL after deployment

// ── Fallback symptom list (used when API is unreachable) ───────────────────
const FALLBACK_SYMPTOMS = [
  "Itching","Skin Rash","Nodal Skin Eruptions","Continuous Sneezing","Shivering","Chills",
  "Joint Pain","Stomach Pain","Acidity","Ulcers On Tongue","Muscle Wasting","Vomiting",
  "Burning Micturition","Spotting Urination","Fatigue","Weight Gain","Anxiety","Cold Hands And Feets",
  "Mood Swings","Weight Loss","Restlessness","Lethargy","Patches In Throat","Irregular Sugar Level",
  "Cough","High Fever","Sunken Eyes","Breathlessness","Sweating","Dehydration",
  "Indigestion","Headache","Yellowish Skin","Dark Urine","Nausea","Loss Of Appetite",
  "Pain Behind The Eyes","Back Pain","Constipation","Abdominal Pain","Diarrhoea","Mild Fever",
  "Yellow Urine","Yellowing Of Eyes","Acute Liver Failure","Fluid Overload","Swelling Of Stomach",
  "Swelled Lymph Nodes","Malaise","Blurred And Distorted Vision","Phlegm","Throat Irritation",
  "Redness Of Eyes","Sinus Pressure","Runny Nose","Congestion","Chest Pain","Weakness In Limbs",
  "Fast Heart Rate","Pain During Bowel Movements","Pain In Anal Region","Bloody Stool",
  "Irritation In Anus","Neck Pain","Dizziness","Cramps","Bruising","Obesity","Swollen Legs",
  "Swollen Blood Vessels","Puffy Face And Eyes","Enlarged Thyroid","Brittle Nails",
  "Swollen Extremities","Excessive Hunger","Extra Marital Contacts","Drying And Tingling Lips",
  "Slurred Speech","Knee Pain","Hip Joint Pain","Muscle Weakness","Stiff Neck","Swelling Joints",
  "Movement Stiffness","Spinning Movements","Loss Of Balance","Unsteadiness",
  "Weakness Of One Body Side","Loss Of Smell","Bladder Discomfort","Foul Smell Of Urine",
  "Continuous Feel Of Urine","Passage Of Gases","Internal Itching","Toxic Look",
  "Depression","Irritability","Muscle Pain","Altered Sensorium","Red Spots Over Body",
  "Belly Pain","Abnormal Menstruation","Dischromic Patches","Watering From Eyes",
  "Increased Appetite","Polyuria","Family History","Mucoid Sputum","Rusty Sputum",
  "Lack Of Concentration","Visual Disturbances","Receiving Blood Transfusion",
  "Receiving Unsterile Injections","Coma","Stomach Bleeding","Distention Of Abdomen",
  "History Of Alcohol Consumption","Blood In Sputum","Prominent Veins On Calf","Palpitations",
  "Painful Walking","Pus Filled Pimples","Blackheads","Scurring","Skin Peeling",
  "Silver Like Dusting","Small Dents In Nails","Inflammatory Nails","Blister",
  "Red Sore Around Nose","Yellow Crust Ooze"
];

// ── State ──────────────────────────────────────────────────────────────────
let allSymptoms   = [];
let selected      = new Set();

// ── DOM refs ───────────────────────────────────────────────────────────────
const searchInput   = document.getElementById("symptom-search");
const clearBtn      = document.getElementById("clear-search");
const suggestionBox = document.getElementById("suggestions");
const selectedWrap  = document.getElementById("selected-wrap");
const chipsEl       = document.getElementById("chips");
const gridEl        = document.getElementById("symptom-grid");
const predictBtn    = document.getElementById("predict-btn");
const loadingCard   = document.getElementById("loading-card");
const resultCard    = document.getElementById("result-card");
const symptomCard   = document.getElementById("symptom-card");
const resetBtn      = document.getElementById("reset-btn");

// ── Init ───────────────────────────────────────────────────────────────────
async function init() {
  try {
    const res = await fetch(`${API_BASE}/symptoms`, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    allSymptoms = data.symptoms;
  } catch {
    console.info("API unreachable — using fallback symptom list");
    allSymptoms = FALLBACK_SYMPTOMS;
  }
  renderGrid(allSymptoms);
}

// ── Render symptom grid ────────────────────────────────────────────────────
function renderGrid(symptoms) {
  gridEl.innerHTML = "";
  symptoms.forEach(s => {
    const btn = document.createElement("button");
    btn.className = "sym-btn" + (selected.has(s) ? " selected" : "");
    btn.dataset.sym = s;
    btn.innerHTML = `<i class="fa-solid fa-check"></i>${s}`;
    btn.addEventListener("click", () => toggleSymptom(s, btn));
    gridEl.appendChild(btn);
  });
}

// ── Toggle a symptom ───────────────────────────────────────────────────────
function toggleSymptom(sym, btnEl) {
  if (selected.has(sym)) {
    selected.delete(sym);
    if (btnEl) btnEl.classList.remove("selected");
  } else {
    selected.add(sym);
    if (btnEl) btnEl.classList.add("selected");
  }
  updateChips();
  updatePredictBtn();
}

// ── Update chips bar ───────────────────────────────────────────────────────
function updateChips() {
  chipsEl.innerHTML = "";
  if (selected.size === 0) {
    selectedWrap.classList.add("hidden");
    return;
  }
  selectedWrap.classList.remove("hidden");

  selected.forEach(sym => {
    const chip = document.createElement("span");
    chip.className = "chip remove";
    chip.innerHTML = `${sym} <i class="fa-solid fa-xmark"></i>`;
    chip.title = "Remove";
    chip.addEventListener("click", () => {
      toggleSymptom(sym);
      // deselect in grid
      const gridBtn = gridEl.querySelector(`[data-sym="${sym}"]`);
      if (gridBtn) gridBtn.classList.remove("selected");
    });
    chipsEl.appendChild(chip);
  });
}

// ── Enable / disable predict button ───────────────────────────────────────
function updatePredictBtn() {
  predictBtn.disabled = selected.size === 0;
}

// ── Search / filter ────────────────────────────────────────────────────────
searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) {
    suggestionBox.classList.add("hidden");
    renderGrid(allSymptoms);
    return;
  }
  const filtered = allSymptoms.filter(s => s.toLowerCase().includes(q));
  renderGrid(filtered);

  if (filtered.length > 0) {
    suggestionBox.innerHTML = "";
    filtered.slice(0, 6).forEach(s => {
      const li = document.createElement("li");
      li.innerHTML = `<i class="fa-solid fa-arrow-right"></i>${s}`;
      li.addEventListener("click", () => {
        toggleSymptom(s);
        // sync grid btn
        const gridBtn = gridEl.querySelector(`[data-sym="${s}"]`);
        if (gridBtn) gridBtn.classList.toggle("selected", selected.has(s));
        searchInput.value = "";
        suggestionBox.classList.add("hidden");
        renderGrid(allSymptoms);
      });
      suggestionBox.appendChild(li);
    });
    suggestionBox.classList.remove("hidden");
  } else {
    suggestionBox.classList.add("hidden");
  }
});

clearBtn.addEventListener("click", () => {
  searchInput.value = "";
  suggestionBox.classList.add("hidden");
  renderGrid(allSymptoms);
});

document.addEventListener("click", e => {
  if (!e.target.closest(".search-wrap") && !e.target.closest(".suggestions")) {
    suggestionBox.classList.add("hidden");
  }
});

// ── Predict ────────────────────────────────────────────────────────────────
predictBtn.addEventListener("click", async () => {
  if (selected.size === 0) return;

  // Show loading
  symptomCard.style.display  = "none";
  loadingCard.classList.remove("hidden");
  resultCard.classList.add("hidden");

  // Reset progress bar animation by re-inserting element
  const bar = loadingCard.querySelector(".loading-progress");
  bar.style.animation = "none";
  bar.getBoundingClientRect();
  bar.style.animation = "";

  try {
    const res = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symptoms: Array.from(selected) }),
    });

    if (!res.ok) throw new Error(`Server error ${res.status}`);

    const data = await res.json();

    // Hide loading, show result
    loadingCard.classList.add("hidden");
    renderResult(data);
    resultCard.classList.remove("hidden");
    resultCard.scrollIntoView({ behavior: "smooth", block: "start" });

  } catch (err) {
    loadingCard.classList.add("hidden");
    symptomCard.style.display = "block";
    showError(err.message);
  }
});

// ── Render result ──────────────────────────────────────────────────────────
function renderResult(data) {
  // Disease name
  document.getElementById("disease-name").textContent = data.disease;

  // Confidence ring
  const pct = Math.round(data.confidence * 100);
  document.getElementById("confidence-pct").textContent = pct + "%";
  const circ   = 2 * Math.PI * 32;  // r=32
  const offset = circ - (circ * data.confidence);
  const arc    = document.getElementById("ring-arc");
  // Inject gradient def if not present
  if (!document.getElementById("ring-grad")) {
    arc.closest("svg").insertAdjacentHTML("afterbegin", `
      <defs>
        <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stop-color="#00dcc8"/>
          <stop offset="100%" stop-color="#3b82f6"/>
        </linearGradient>
      </defs>`);
  }
  arc.style.strokeDasharray  = circ;
  arc.style.strokeDashoffset = offset;

  // Precautions
  const precList = document.getElementById("precautions-list");
  precList.innerHTML = "";
  (data.precautions || []).forEach((p, i) => {
    const li = document.createElement("li");
    li.textContent = p;
    li.style.animationDelay = `${i * 0.1}s`;
    precList.appendChild(li);
  });

  // Matched symptoms
  const matchedEl = document.getElementById("matched-chips");
  matchedEl.innerHTML = "";
  (data.symptoms_matched || Array.from(selected)).forEach(s => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.innerHTML = `<i class="fa-solid fa-check"></i>${s}`;
    matchedEl.appendChild(chip);
  });

  // Alternatives
  const altEl = document.getElementById("alternatives");
  altEl.innerHTML = "";
  (data.alternatives || []).slice(0, 3).forEach((alt, i) => {
    if (i === 0) return; // skip top match (already shown)
    const div = document.createElement("div");
    div.className = "alt-item";
    div.style.animationDelay = `${i * 0.1}s`;
    div.innerHTML = `
      <span class="alt-name">${alt.disease}</span>
      <span class="alt-conf">${Math.round(alt.confidence * 100)}%</span>`;
    altEl.appendChild(div);
  });
}

// ── Reset ──────────────────────────────────────────────────────────────────
resetBtn.addEventListener("click", () => {
  selected.clear();
  updateChips();
  updatePredictBtn();
  renderGrid(allSymptoms);
  resultCard.classList.add("hidden");
  symptomCard.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ── Error toast ────────────────────────────────────────────────────────────
function showError(msg) {
  const toast = document.createElement("div");
  toast.style.cssText = `
    position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
    background:#1e2d3d; border:1px solid rgba(248,113,113,.4);
    color:#f87171; padding:14px 24px; border-radius:12px;
    font-size:14px; z-index:999; display:flex; gap:10px; align-items:center;
    box-shadow:0 8px 32px rgba(0,0,0,.5); animation:fadeUp .3s ease;
  `;
  toast.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> ${msg}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ── Keyboard shortcut: Enter to predict ───────────────────────────────────
document.addEventListener("keydown", e => {
  if (e.key === "Enter" && !predictBtn.disabled && document.activeElement !== searchInput) {
    predictBtn.click();
  }
});

// ── Kick off ───────────────────────────────────────────────────────────────
init();
