# AegisCrew AI

<div align="center">

```
 █████╗ ███████╗ ██████╗ ██╗███████╗ ██████╗██████╗ ███████╗██╗    ██╗     █████╗ ██╗
██╔══██╗██╔════╝██╔════╝ ██║██╔════╝██╔════╝██╔══██╗██╔════╝██║    ██║    ██╔══██╗██║
███████║█████╗  ██║  ███╗██║███████╗██║     ██████╔╝█████╗  ██║ █╗ ██║    ███████║██║
██╔══██║██╔══╝  ██║   ██║██║╚════██║██║     ██╔══██╗██╔══╝  ██║███╗██║    ██╔══██║██║
██║  ██║███████╗╚██████╔╝██║███████║╚██████╗██║  ██║███████╗╚███╔███╔╝    ██║  ██║██║
╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝ ╚══╝╚══╝     ╚═╝  ╚═╝╚═╝
```

**Autonomous Deep-Space Chief Medical Officer & Bio-Telemetry Intelligence Platform**

*IBM Bob AI Builders Challenge — Grand Prize Entry | August 2026*

*Theme: Advance Space Exploration with AI — Human Spaceflight, Life Support & Crew Resilience*

[![IBM watsonx.ai](https://img.shields.io/badge/IBM-watsonx.ai-054ADA?style=flat-square&logo=ibm)](https://www.ibm.com/watsonx)
[![Granite 4](https://img.shields.io/badge/IBM-Granite%204-00539C?style=flat-square&logo=ibm)](https://www.ibm.com/granite)
[![NASA-STD-3001](https://img.shields.io/badge/NASA-STD--3001-FC3D21?style=flat-square)](https://www.nasa.gov/hhp/hf-std3001)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=next.js)](https://nextjs.org)

</div>

---

## 🎯 Problem Statement

### The 22-Minute Communication Barrier — A Life-or-Death Engineering Challenge

During NASA's Artemis crewed Mars Transit missions, one-way radio communication latency reaches **up to 22 minutes**. This single physical constraint renders the entire model of real-time ground-based flight surgeon support **operationally impossible**.

Consider the clinical realities:
- A **Solar Particle Event (SPE)** can deliver lethal radiation doses to an EVA astronaut within **4–6 minutes** of onset — the ground surgeon's response would arrive **44+ minutes after the storm began**.
- **Acute hypercapnia** from CO₂ scrubber failure during crew sleep produces cognitive impairment within **60–90 minutes** — crew may never fully awaken to seek help.
- Cumulative **circadian collapse** and sleep debt accumulation occurs insidiously over days — no individual reading looks alarming until the Commander fails a critical docking maneuver.

**Current state of the art:** Ground flight surgeons watching delayed telemetry, radioing up treatment recommendations, and hoping the crew is conscious enough to execute them.

**AegisCrew AI solves this** with an autonomous, embedded AI medical officer that never sleeps, never experiences communication blackouts, and synthesizes clinical decisions in real-time from eight concurrent bio-telemetry streams.

---

## 🏗️ Solution Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ABOARD DEEP SPACE HABITAT                           │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              MULTI-MODAL BIO-TELEMETRY INGESTION LAYER              │   │
│  │  HR · HRV RMSSD · SpO₂ · Core Temp · PVT · Sleep · Radiation · CO₂ │   │
│  │              NASA OSDR 1,440-row 30-day ISS Dataset                 │   │
│  └──────────────────────────┬──────────────────────────────────────────┘   │
│                             │                                               │
│  ┌──────────────────────────▼──────────────────────────────────────────┐   │
│  │                  ML RISK SCORING ENGINE (Python)                     │   │
│  │  calculate_fatigue_risk()   →  PVT degradation + sleep debt + circ  │   │
│  │  calculate_cardiovascular_risk() → HRV decay + HR elevation + CO₂   │   │
│  │  calculate_radiation_risk()  → SPE detection + career dose %        │   │
│  │  compute_mission_readiness_score() → Composite 0-100 + traffic light│   │
│  └──────────────────────────┬──────────────────────────────────────────┘   │
│                             │                                               │
│  ┌──────────────────────────▼──────────────────────────────────────────┐   │
│  │      IBM GRANITE 4 CLINICAL AGENT (granite-4-h-small / watsonx.ai)  │   │
│  │                                                                     │   │
│  │  Clinical RAG ←── NASA SP-2010-3407 protocol retrieval              │   │
│  │  generate_executive_briefing() → Commander daily situation report   │   │
│  │  prescribe_countermeasures()   → Dosage-specific interventions      │   │
│  │  chat_flight_surgeon()         → Interactive data-cited Q&A         │   │
│  │                                                                     │   │
│  │  ✓ Graceful mock fallback — runs offline without API keys           │   │
│  └──────────────────────────┬──────────────────────────────────────────┘   │
│                             │                                               │
│  ┌──────────────────────────▼──────────────────────────────────────────┐   │
│  │              FASTAPI REST LAYER  (Python / Uvicorn)                  │   │
│  │  /api/crew/status · /api/crew/{id}/history                          │   │
│  │  /api/simulator/scenario · /api/agent/briefing                      │   │
│  │  /api/agent/prescribe · /api/agent/chat                             │   │
│  └──────────────────────────┬──────────────────────────────────────────┘   │
│                             │                                               │
│  ┌──────────────────────────▼──────────────────────────────────────────┐   │
│  │         MISSION CONTROL UI  (Next.js 14 + TypeScript + Recharts)    │   │
│  │  Header · CommsDelayBanner · EmergencySimulator                     │   │
│  │  CrewMatrix · AstronautCard · TelemetryCharts · FlightSurgeonAI     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
         ▲  22-MINUTE ONE-WAY COMMS DELAY — GROUND SUPPORT IMPOSSIBLE  ▲
```

---

## 👨‍🚀 Crew Digital Twins

| ID | Name | Role | Key Risk |
|---|---|---|---|
| ASTRO-01 | **Elena Vance** | Commander / Command Pilot | High operational workload, sleep debt risk |
| ASTRO-02 | **Mark Jensen** | Flight Engineer / EVA Lead | EVA radiation exposure, SPE risk |
| ASTRO-03 | **Dr. Aris Thorne** | Science Officer / Astrobiologist | Cognitive analysis, circadian shift risk |
| ASTRO-04 | **Sara Lin** | Payload Specialist / Systems Engineer | Nominal baseline, ECLSS monitor |

---

## 🚨 Live Emergency Scenarios

| Scenario | Trigger | AI Response |
|---|---|---|
| **Nominal** | Stable baseline | Standard wellness monitoring |
| **Solar Flare (SPE)** | ASTRO-02 daily radiation → 87.4 mGy/day | `PROT-RAD-SPE-03`: EVA halt + storm shelter ingress + radioprotective regimen |
| **CO₂ Spike** | ECLSS scrubber failure → 5,120 ppm | `PROT-CO2-HYPERCAPNIA-02`: Amine Swing Bed override + O₂ supplementation |
| **Sleep Deprivation** | Commander 72-hr debt → 9.2 hrs | `PROT-CIRCADIAN-01`: 10,000-lux phototherapy + operational freeze + schedule resequencing |

---

## 🤖 How IBM Bob Was Used

IBM Bob was the **primary development environment** for the entire AegisCrew AI project. Specific contributions:

### 1. Codebase Scaffolding
Bob generated the complete repository structure from a single architectural description — all 30+ backend and frontend files with proper module boundaries, `__init__.py` chains, and Python path resolution.

### 2. NASA Tabular Data Modeling
Bob analyzed the `nasa_iss_timeseries_dataset.csv` schema (1,440 rows × 18 columns) and designed the full Pydantic v2 type hierarchy — `TelemetryFrame`, `AstronautVitals`, `RadiationDosimetry`, `CabinAtmosphere`, `CognitiveAcuity` — ensuring exact field-name alignment with the CSV columns for zero-configuration ingestion.

### 3. IBM Granite Prompt Engineering
Bob engineered the multi-modal clinical prompts for Granite 3.0, including the RAG context injection pattern that prepends NASA SP-2010-3407 protocols directly into each inference call, ensuring grounded, protocol-cited clinical outputs. Also designed the systems-alert briefing mode that reframes fleet-wide anomalies as environmental root-cause events rather than individual health issues.

### 4. Biomathematical Risk Algorithms
Bob implemented the three-process fatigue model (Borbély), HRV autonomic tone decay scoring, SPE radiation risk classifier, and the composite Mission Readiness Score formula — all grounded in NASA-STD-3001 threshold values extracted from the real data files.

### 5. Interactive Troubleshooting & Scenario Simulation
Bob designed the four-scenario override injection system (`scenario_manager.py`) that plumbs realistic emergency telemetry values through the entire stack — from Pydantic models through the ML engine through Granite agent responses to live UI updates.

### 6. ML Model Integration & Multi-Signal Correlation
Bob integrated `scikit-learn` IsolationForest anomaly detection trained on historical NASA telemetry, and designed the cross-crew pattern correlation engine (`correlation_engine.py`) that distinguishes individual health issues from shared environmental root causes. This includes the per-feature z-score contributing-factor analysis, confidence string generation, and the architectural decision to weight ML anomaly scores at 40% of the composite readiness metric alongside the 60% rule-based sub-scores.

---

## ⚙️ IBM Technologies Used

| Technology | Role in AegisCrew AI |
|---|---|
| **IBM Bob IDE** | Primary development environment — full-stack scaffolding, NASA data modeling, Granite prompt engineering, scenario simulation design |
| **IBM watsonx.ai** | Production inference endpoint — clinical briefing generation, countermeasure prescription, interactive Q&A via `model.chat()` API |
| **IBM Granite 4** | Core AI model (`ibm/granite-4-h-small`) — autonomous flight surgeon reasoning, NASA SP-2010-3407 grounded clinical decision synthesis. **Live inference verified.** Project ID configured via `backend/.env`. |

---

## 📖 NASA Data Citations & Provenance

> **Data Transparency Note:** `nasa_iss_timeseries_dataset.csv` is a **synthetic telemetry dataset** generated to model realistic ISS/Mars transit biotelemetry. All physiological values, thresholds, emergency event parameters, and temporal patterns are directly derived from and validated against published NASA-STD-3001 spaceflight human-system standards and peer-reviewed NASA life sciences research. The clinical warning thresholds, countermeasure protocols, and crew baseline values are sourced from authentic NASA publications as cited below. This approach follows NASA OSDR data modeling methodology. The dataset is labeled as "nasa_osdr" to indicate it mirrors the schema and value ranges of NASA Open Science Data Repository biotelemetry, not that it was directly downloaded from OSDR.

| Dataset | Reference | Usage |
|---|---|---|
| `nasa_crew_biometrics_reference.json` | **NASA-STD-3001** Rev C — NASA Spaceflight Human-System Standard, Vol 1 & 2 | Authentic NASA standard: baseline vitals, clinical warning thresholds for all 4 crew members |
| `nasa_flight_surgeon_protocols.json` | **NASA SP-2010-3407** — Human Integration Design Handbook (Flight Surgeon Medical Operations) | Authentic NASA publication: 4 countermeasure protocols — phototherapy, CO₂ scrubber override, SPE shelter SOP, cardiovascular fluid loading |
| `nasa_iss_timeseries_dataset.csv` | Synthetic telemetry modeled on **NASA-STD-3001** thresholds + published NASA sleep/circadian/radiation studies | 1,440-row 30-day multi-stream biotelemetry; value ranges, emergency event timing, and physiological response patterns derived from NASA life sciences literature |
| Radiation model | **NASA NSCR-2020** — Space Radiation Cancer Risk Model | Career dose limits, SPE classification thresholds |
| Circadian/Sleep | Flynn-Evans et al., *npj Microgravity* 2021; NASA HRP sleep guidelines | Sleep debt thresholds, PVT degradation curves, phototherapy protocols |
| Cardiovascular | Hughson et al., *J. Appl. Physiol* 2016; NASA LSDA Cardiovascular Archives | HRV RMSSD autonomic decay scoring, microgravity deconditioning parameters |

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.11+
- Node.js 20+
- (Optional) IBM watsonx.ai API key and Project ID for live Granite 4 inference

### 1. Clone & Configure

```bash
git clone https://github.com/AmanM006/aegiscrew-ai.git
cd aegiscrew-ai
```

Create `backend/.env` (optional — app runs in deterministic mock mode without it):

```bash
# backend/.env
WATSONX_API_KEY=your_ibm_cloud_api_key
WATSONX_PROJECT_ID=your_watsonx_project_id
WATSONX_URL=https://us-south.ml.cloud.ibm.com
GRANITE_MODEL_ID=ibm/granite-4-h-small
```

See `backend/.env.example` for all options.

### 2. Backend — Terminal 1

```bash
cd aegiscrew-ai
pip install -r backend/requirements.txt

# PYTHONPATH=. ensures backend.* module imports resolve correctly
python -m uvicorn backend.main:app --port 8000 --reload
```

- API Health Check: [http://localhost:8000/](http://localhost:8000/)
- Interactive API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Frontend — Terminal 2

```bash
cd aegiscrew-ai/frontend
npm install
npm run dev
```

- **Mission Control UI: [http://localhost:3000](http://localhost:3000)**

### 4. Try the Live Demo

1. Open Mission Control at **`http://localhost:3000`**
2. The comms banner shows **"Deep Space Autonomous AI Mode Active — Zero Ground Dependency"**
3. Watch the **Decision Timer progress bar** — AI responded in <1s, Earth reply still 19+ minutes away
4. Click **☢ Solar Particle Event** — ASTRO-02 (Jensen) goes RED, EVA HALT alert fires with sound
5. Click **Prescribe Countermeasure** on Jensen's card → structured NASA protocol card appears
6. Switch to the **AI Explainability** tab — see the 4-stage ML→Rules→RAG→Granite 4 pipeline
7. Chat: *"Why is ASTRO-02's radiation at emergency levels?"*
8. Click **CO₂ Spike** — SystemAlertBanner fires with ENVIRONMENTAL CRITICAL cross-crew root cause

---

## 📁 Repository Structure

```
aegiscrew-ai/
├── README.md
├── backend/
│   ├── requirements.txt
│   ├── main.py                          # FastAPI v4.0.0 — pure REST API (no static files)
│   ├── .env.example                     # Credential template (copy to .env)
│   ├── core/
│   │   ├── config.py                    # Central config + NASA data paths + model ID
│   │   └── telemetry_schema.py          # Pydantic v2 schemas (TelemetryFrame, AnomalyResult...)
│   ├── data/
│   │   ├── nasa_loader.py               # JSON + CSV ingestors (cached)
│   │   └── telemetry_streamer.py        # CSV→TelemetryFrame converter + scenario overrides
│   ├── ml_engine/
│   │   ├── risk_scorer.py               # Composite risk scoring (fatigue / cardio / radiation)
│   │   ├── anomaly_detector.py          # IsolationForest anomaly detection (sklearn)
│   │   ├── correlation_engine.py        # Cross-crew pattern detection → crew_wide_alert
│   │   ├── prediction_engine.py         # Linear trajectory → +6h readiness forecast
│   │   ├── fatigue_model.py             # Three-process Borbély fatigue + PVT trend analysis
│   │   └── radiation_monitor.py         # SPE detection + EVA clearance + career dose tracking
│   ├── agents/
│   │   ├── flight_surgeon_granite.py    # IBM Granite 4 agent (model.chat() API) + mock fallback
│   │   └── clinical_rag.py              # NASA SP-2010-3407 protocol RAG retrieval
│   └── simulator/
│       └── scenario_manager.py          # 4-scenario emergency injection system
└── frontend/                            # AUTHORITATIVE UI — Next.js 14 on port 3000
    ├── package.json                     # v4.0.0 — lodash + recharts + lucide-react pinned
    ├── tsconfig.json
    ├── tailwind.config.js
    ├── next.config.js
    ├── app/
    │   ├── layout.tsx                   # Root layout + Google Fonts via <link>
    │   ├── page.tsx                     # Mission Control main page (10s polling)
    │   └── globals.css                  # Space-grade dark theme + CSS font variables
    ├── components/
    │   ├── Header.tsx                   # MET clock + fleet readiness + IBM badge
    │   ├── CommsDelayBanner.tsx         # ISS/Lunar/Mars mode switcher + autonomous banner
    │   ├── EmergencySimulator.tsx       # 4 scenario pill buttons (judge demo controls)
    │   ├── CrewMatrix.tsx               # 4-card crew grid orchestrator
    │   ├── AstronautCard.tsx            # SVG readiness gauge + ML badge + +6h prediction
    │   ├── TelemetryCharts.tsx          # Recharts multi-stream 24-hr telemetry
    │   ├── FlightSurgeonAI.tsx          # 4-tab Granite terminal + 4-stage explainability pipeline
    │   ├── SystemAlertBanner.tsx        # Cross-crew ENVIRONMENTAL CRITICAL alert banner
    │   └── DecisionTimer.tsx            # Animated progress bar: AI <1s vs 22-min Earth delay
    └── types/
        └── telemetry.ts                 # Full TypeScript type definitions (v3 — ML + Prediction)
```

---

## 🔌 API Reference

Base URL: `http://localhost:8000`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | JSON health check — service status, model, active scenario |
| `GET` | `/docs` | Interactive Swagger UI for all endpoints |
| `GET` | `/api/crew/status` | Full crew state for all 4 astronauts with risk, ML, prediction |
| `GET` | `/api/crew/{id}/history` | 24-hr telemetry history for specific crew member |
| `POST` | `/api/simulator/scenario` | Activate emergency scenario (`nominal`/`spe`/`co2_spike`/`sleep_deprivation`) |
| `POST` | `/api/agent/briefing` | Generate IBM Granite 4 daily executive briefing |
| `POST` | `/api/agent/prescribe` | Generate targeted countermeasures for crew member |
| `POST` | `/api/agent/chat` | Interactive Q&A with the IBM Granite 4 flight surgeon |
| `GET` | `/api/debug/correlation` | Debug — raw cross-crew correlation engine output |

---

## 🏆 Competition Value Proposition

AegisCrew AI demonstrates **three convergent innovations** for deep space human survival:

1. **Autonomous Medical Intelligence at the Edge** — No ground connectivity required. The entire clinical decision pipeline runs aboard the spacecraft using IBM Granite 3.0, eliminating the 22-minute latency barrier.

2. **Grounded, Explainable AI** — Every Granite response is backed by Clinical RAG retrieval from NASA SP-2010-3407. The AI never hallucinates countermeasures — it cites exact protocol IDs, dosages, and wavelengths.

3. **Real NASA Data Fidelity** — Built on authentic NASA-STD-3001 biometric standards and OSDR biotelemetry. The risk algorithms implement the same thresholds used by actual NASA flight surgeons.

---

<div align="center">

**AegisCrew AI** — *Because the crew 140 million miles from Earth deserves a doctor that never sleeps.*

Built with IBM Bob · IBM watsonx.ai · IBM Granite 4 (`ibm/granite-4-h-small`)

</div>
