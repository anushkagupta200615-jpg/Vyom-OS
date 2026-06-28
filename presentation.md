---
marp: true
theme: default
class: lead
backgroundColor: #040a14
color: #e2e8f0
---

# Bharatiya Antariksh Hackathon 2026

**Team Name:** ____________________

**Team Leader Name:** ____________________

**Problem Statement:** Antigravity Track - Autonomous Satellite Intelligence System

---

# Team Members

**Team Leader:** 
Name: ____________________
College: ____________________

**Team Member-1:** 
Name: ____________________
College: ____________________

**Team Member-2:** 
Name: ____________________
College: ____________________

**Team Member-3:** 
Name: ____________________
College: ____________________

---

# Opportunity

**How different is it from any of the other existing ideas?**
Traditional ground operations rely on human operators manually reading 2D telemetry dashboards and consulting manuals. VyomOS shifts this paradigm by moving intelligence to the edge, processing anomalies autonomously using a local LLM, and providing mitigating commands instantly without internet dependency.

**How will it be able to solve the problem?**
It reduces human cognitive load and reaction time from minutes to milliseconds. By automating detection, explanation, and mitigation, VyomOS prevents catastrophic failures during high-stress events like solar flares or communication blackouts.

**USP of the proposed solution:**
- 100% Data Sovereignty (Zero reliance on OpenAI or external clouds)
- Multi-Satellite Cascading Anomaly Correlation
- Live integration with NASA DONKI and real ISRO Celestrak TLEs
- Predictive ML forecasting for anomaly severity

---

# List of features offered by the solution

- **3D Digital Twin:** Real-time WebGL visualization of ISRO's fleet using live Celestrak TLEs.
- **Autonomous AI Mitigation:** On-device LLM (Flan-T5) generates instant recovery strategies.
- **ISRO RAG Engine:** Mitigation is grounded in actual ISRO mission protocols using ChromaDB.
- **Predictive Forecasting:** ML model predicts anomaly severity 72 hours into the future.
- **NASA DONKI Integration:** Automatically triggers alerts based on real-world space weather.
- **Telemetry Gauges & Heatmaps:** Live tracking of battery, solar output, and historical anomaly density.
- **Voice Alert System:** Web Speech API provides auditory warnings for critical events.
- **Automated Incident Reports:** One-click PDF generation for mission control logging.

---

# Process flow diagram / Use-case diagram

```text
[Satellite Sensor / Edge] 
        │ (Detects Anomaly & Transmits Payload)
        ▼
[FastAPI Ground Gateway]
        │ (Validates Payload via Pydantic)
        ├──────────────────────────┐
        ▼                          ▼
[ChromaDB RAG Engine]      [Predictive ML]
(Fetches ISRO Context)     (Forecasts 72hr Severity)
        │                          │
        ▼                          │
[Local LLM (Flan-T5)]              │
(Generates Mitigation)             │
        │                          │
        ▼                          ▼
[React 3D Command Center] ◄────────┘
(Plots on Globe, Triggers Voice Alerts & Heatmaps)
```

---

# Wireframes / Mock diagrams of the proposed solution

**Command Center Layout:**
1. **Top Bar:** Ticker tape showing live X-Ray Flux and Flare Classes, along with an overarching Alert Banner (Normal/Watch/Warning/Emergency).
2. **Left Panel (Analytics):** Satellite status matrix, NavIC degradation impact, and live Telemetry Gauges (Battery, Solar, Temp) rendered via Recharts.
3. **Center/Right (Digital Twin):** A massive interactive 3D Globe rendering ISRO satellites, orbital paths, Day/Night terminators, and pulsing Red Alert shockwaves during anomalies.
4. **Bottom Panel:** 72-hour predictive anomaly severity chart using a logistic growth model.
5. **Floating Assistant:** A chat window powered by Gemini 3.5 Flash for ad-hoc space weather queries.

---

# Architecture diagram of the proposed solution

```text
                   ┌───────────────────────────────┐
                   │  EXTERNAL LIVE DATA FEEDS     │
                   │  - NASA DONKI (Space Weather) │
                   │  - Celestrak (Orbital TLEs)   │
                   └───────┬───────────────┬───────┘
                           │               │
┌──────────────────────────▼───────────────▼──────────────────────────┐
│ BACKEND (FastAPI + Python)                                          │
│                                                                     │
│  [API Router] ◄─ (Anomaly Payload) ─ [Simulated Edge Transmitter]   │
│       │                                                             │
│       ├─► [ChromaDB Vector Store] ◄─ (ISRO Mission PDFs)            │
│       │                                                             │
│       ├─► [Local LLM: Flan-T5] ◄─ (RAG Context + Payload)           │
│       │                                                             │
│       └─► [Predictive ML Engine] ◄─ (Logistic Growth Model)         │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ (JSON Payload & Mitigation Report)
┌──────────────────────────▼──────────────────────────────────────────┐
│ FRONTEND (React + Vite + TypeScript)                                │
│                                                                     │
│  - react-globe.gl (3D Visualization & Correlation Arcs)             │
│  - Recharts (Telemetry Gauges & Forecast Charts)                    │
│  - Web Speech API (Voice Alerts)                                    │
│  - jsPDF (Incident Report Generation)                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

# Technologies to be used in the solution

**Frontend:**
- React 18, TypeScript, Vite
- Tailwind CSS (Glassmorphic UI)
- `react-globe.gl` & `three.js` (3D rendering)
- `recharts` & `d3` (Data visualization)
- `satellite.js` (Orbital mechanics)

**Backend:**
- Python 3.10+, FastAPI, Uvicorn
- Pydantic (Data validation)

**AI & Machine Learning:**
- `chromadb` (Vector Database for RAG)
- `sentence-transformers` (Embeddings)
- Google `flan-t5-small` (On-device LLM)
- Gemini 3.5 Flash (Advisory Generation & Chatbot)
- `scipy` & `numpy` (Predictive forecasting)

---

# Estimated implementation cost (optional)

**Development & Software Cost:** 
- **$0** (VyomOS is built entirely on open-source frameworks, free public APIs like NASA DONKI, and locally hosted AI models).

**Deployment Hosting (Command Center):**
- **$0** for Hackathon (Render/Vercel Free Tiers).
- **~$50/month** (Production-grade cloud backend for ground station).

**Edge Hardware (Per Satellite/Node):**
- **~$150 - $300** (NVIDIA Jetson Nano or equivalent space-hardened edge compute module for running the local LLM and anomaly detection on-orbit).

**Total Prototype Cost:** **$0**
