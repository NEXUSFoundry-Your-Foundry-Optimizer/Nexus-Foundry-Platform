# NEXUS-Foundry — System Architecture

> **Purpose of this document:** This is a build specification. An AI coding agent should be able to read this file and understand *what to build* at the system level — layers, twins, models, data stores, and how they connect — before writing any code.

---

## 1. Project Identity

- **Name:** NEXUS-Foundry
- **Full title:** A Cross-Stage Cognitive Digital Twin Platform for Predictive Casting Intelligence
- **Type:** AI-powered digital twin platform for foundry (metal casting) operations
- **Core idea:** Connect four stages of the casting process — **Melting → Molding → Pouring → Quality** — into one intelligent, event-driven system that predicts equipment failures 8–24 hours in advance and casting defects 15+ hours before they occur, enabling *preventive* intervention instead of reactive scrap management.

### Problems it solves
1. **Unexpected equipment failures** — furnace linings erode invisibly; failure can cause large financial losses (₹54 lakhs cited as example).
2. **Late defect discovery** — defects are currently found ~15 hours after the causal event, wasting material and energy.
3. **Loss of expert knowledge** — when experienced operators retire, their tacit diagnostic intuition is lost. (This is what the RAG cognitive assistant is meant to preserve/replace.)

### High-level loop
```
Physical Foundry → Sensors/Images → Kafka → Digital Twins → AI Models → Dashboard → Operator Action → Physical Foundry
```
This is a **closed feedback loop**: sensor data flows through AI models to the operator, whose action changes the physical process, which produces new sensor data.

---

## 2. Seven-Layer Architecture

Build the system as seven distinct layers, each with a clear responsibility. Keep layers loosely coupled (communicate via defined APIs/queues, not direct imports across layers).

| # | Layer | Components | Responsibility |
|---|---|---|---|
| 1 | **Physical / Edge** | Sensors, Cameras, PLCs, SCADA | Data generation at the source |
| 2 | **Ingestion** | MQTT, Kafka, FastAPI | Ingest and distribute raw events |
| 3 | **Storage / Data** | InfluxDB, PostgreSQL, Redis, ChromaDB | Persist time-series, relational, cache, and vector data |
| 4 | **Digital Twin** | Melting Twin, Molding Twin, Pouring Twin, Quality Twin | Maintain live, stateful virtual replicas |
| 5 | **AI / Analytics** | LSTM-AE, TFT, XGBoost, ResNet-50, PINN | Predictions, forecasts, classification, simulation |
| 6 | **Intelligence** | SHAP, RAG (Llama 3 + ChromaDB + LangChain) | Explainability and natural-language cognitive assistant |
| 7 | **Application** | React Dashboard, Alerts, Chat UI | User-facing interaction |

**Reference stack diagram (hierarchical "System of Systems"):**
```
Application Layer   : React Dashboard / GenAI Assistant / Alerts
Analytics Layer      : LSTM-AE • TFT • XGBoost+SHAP • ResNet-50 • PINN • RAG
Digital Twin Layer   : Melting | Molding | Pouring | Quality
Data Layer           : InfluxDB / PostgreSQL / ChromaDB / File Storage
Edge Layer           : PLC / SCADA / MQTT / Data Ingestion
```

---

## 3. The Four Digital Twins

Each twin is a stateful service/module that holds the live state of one physical stage, exposes a `GET /api/twin/{module}/state` endpoint, and calls the AI models relevant to its stage.

| Twin | Represents | Key State Variables | Model Calls |
|---|---|---|---|
| **Melting Twin** | Induction Furnace | `melt_temp`, `power_kw`, `vibration_g`, `lining_health`, `operating_state` | LSTM-AE (every 2s), TFT (hourly) |
| **Molding Twin** | Sand Mold | `sand_moisture`, `permeability`, `green_strength`, `compactability`, `mold_age` | Storage/query only (feeds features to Pouring Twin) |
| **Pouring Twin** | Ladle / Pour Event | `pour_temp`, `pour_speed`, `ladle_fill_pct`, `upstream_risk`, `pre_pour_risk` | XGBoost, PINN, SHAP |
| **Quality Twin** | Post-Pour Inspection | `defect_prediction`, `defect_type`, `severity`, `training_queue` | ResNet-50, PCA, XGBoost |

**Design note for the AI builder:** implement twins as independent, containerizable services (per NFR-SC1, see workflow doc) that each own their state and can be queried by other twins (e.g., Pouring Twin queries Molding Twin for `sand_moisture`).

---

## 4. The Six AI Models

| Model | Purpose | Input | Output | Notes for implementation |
|---|---|---|---|---|
| **LSTM-AE** (LSTM Autoencoder) | Real-time anomaly detection on furnace sensors | 30×7 sliding sensor window | `anomaly_score`, `flag`, `type` | Runs every 2 seconds; reconstruction-error threshold ≈ 0.78 (FR-03) |
| **TFT** (Temporal Fusion Transformer) | 48-hour degradation forecast | 168×7 history + static features | `P10`/`P50`/`P90` quantile forecast, `failure_time` | Pre-train on a public benchmark (e.g. NASA CMAPSS turbofan degradation dataset) then fine-tune on furnace data |
| **XGBoost + SHAP** | Casting defect prediction | 65 features (50 shape embedding + 15 process features) | `defect_prob`, `defect_type`, SHAP contribution values | Use class weighting (defect:OK ≈ 3:1) to handle imbalance |
| **ResNet-50 + PCA** | Visual feature extraction from inspection images | 512×512 image | 50-dim feature vector (then classified) | Pre-train on ImageNet, fine-tune on foundry inspection images |
| **PINN** (Physics-Informed Neural Network) | What-if simulation constrained by physics | current_state + proposed_action + material props + shape | `new_temp`, `new_risk`, `physics_valid` flag | Loss = data loss + λ·physics-residual loss (heat equation); λ≈10 in reference training |
| **RAG** (Retrieval-Augmented Generation) | Cognitive assistant / operator Q&A | question + live twin state + model outputs + documents | Cited natural-language answer with sources | Combine three retrieval sources: manuals/SOPs (vector DB), live twin state, and model outputs — this "triple-source" retrieval is the project's stated novelty |

### Model training summary (reference performance targets)
| Model | Dataset(s) used | Training approach | Target/achieved performance |
|---|---|---|---|
| LSTM-AE | `furnace_sensor.csv` | 70/15/15 split, early stopping, 200 epochs | Detection rate > 95% (achieved 99.6%, FPR 5.1%) |
| TFT | `furnace_sensor.csv` (hourly resample) | Pre-trained on NASA CMAPSS, fine-tuned on foundry data | MAE < 15°C (achieved 12.4°C, RMSE 19.3°C) |
| XGBoost | `xgboost_features.csv` + `inspection_labels.csv` | Class-weighted (3:1) | F1 > 0.85–0.87 (achieved 0.87, accuracy 95%) |
| ResNet-50 | `inspection_images/` | Pre-trained on ImageNet, fine-tuned | Accuracy > 97% target (early result 91.2%) |
| PINN | `pinn_X.npy` + `pinn_y.npy` | Physics loss λ=10, 100 epochs | Error < 5°C; simulation runtime < 3 seconds |

---

## 5. Cross-Stage Correlation (Core Novelty)

This is the signature feature of the project: an anomaly detected in one twin propagates a warning to a downstream twin, which fuses multi-source features into a single risk prediction.

**Reference sequence:**
```
Melting Twin (anomaly detected, e.g. at 2:48 PM)
        ↓
Warning emitted: severity=2.18, projected_temp=1558°C
        ↓  (must arrive within 2 seconds — see FR-05)
Pouring Twin receives warning
        ↓
Queries Molding Twin  → moisture=4.2%, humidity=58%
Queries CAD DB        → shape_embedding[50], thick_section=62mm
        ↓
Assembles 65 features → XGBoost → e.g. 91% hot tear risk
        ↓
SHAP explains contribution: temp 43%, lining 24%, shape 12%
        ↓
CRITICAL ALERT raised → Operator opens PINN what-if panel
        ↓
Operator applies a proposed fix → PINN validates against physics
        ↓
Risk drops (e.g. to 34%) → Pour proceeds → Quality Twin inspects result
```

Implement this as an **event-driven** interaction (Kafka topic or internal pub/sub) rather than polling, so the "< 2 second cross-stage warning" performance target is achievable.

---

## 6. Complete Data Flow (Backend, End-to-End)

```
 1. Sensors publish data every 2 seconds via MQTT
 2. Kafka ingests and distributes events
 3. FastAPI consumes events, validates, writes to InfluxDB (time-series) and PostgreSQL (relational)
 4. Redis caches current state for fast read access
 5. Melting Twin receives data → LSTM-AE (2s cadence) → anomaly detection
 6. On anomaly → TFT emergency forecast → warning event sent to Pouring Twin
 7. Pouring Twin queries Molding Twin (mold data) + CAD DB (shape) → assembles features → XGBoost → defect prediction
 8. SHAP explains the prediction → pushed to dashboard as an alert
 9. Operator opens PINN what-if panel to simulate a corrective action
10. Action applied → pour proceeds
11. Quality Twin inspects the resulting casting image → ResNet-50 → PCA → XGBoost → final defect classification
12. Human reviews/labels the result → added to training queue → periodic retraining
```

---

## 7. Datasets

Use these as the reference synthetic/training datasets. An AI builder without access to a real foundry should **generate synthetic data matching these schemas** first, then wire the pipeline against it.

| Dataset file | Records | Approx. size | Purpose | Consumed by |
|---|---:|---:|---|---|
| `production_master.csv` | 10,800 | 10 MB | Master production schedule / batch registry | All models |
| `furnace_sensor.csv` | 3.8M | 450 MB | Furnace sensor stream (2s cadence) | LSTM-AE, TFT, XGBoost |
| `molding_sensor.csv` | 259K | 30 MB | Sand mold conditions | XGBoost |
| `pouring_sensor.csv` | 1.3M | 85 MB | Pouring process conditions | XGBoost, PINN |
| `inspection_labels.csv` | 10,800 | 18 MB | Ground-truth defect labels | XGBoost |
| `geometry_metadata.csv` | 20 | 10 MB | CAD shape embeddings per part geometry | XGBoost, PINN |
| `material_properties.csv` | 10 | 2 MB | Alloy/material physical properties | PINN |
| `xgboost_features.csv` | 10,800 | 50 MB | Pre-assembled 65-dim feature vectors | XGBoost, SHAP |
| `pinn_X.npy` + `pinn_y.npy` | 20,000 | 140 MB | Heat-equation solution pairs (physics ground truth) | PINN |
| `inspection_images/` | ~3,000 base images | — | Casting inspection images | ResNet-50 |

Total reference dataset size ≈ 1.5 GB across 10–11 files.

---

## 8. Backend Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | **FastAPI** (Python 3.11) | Async REST + WebSocket backend |
| Relational DB | **PostgreSQL** (via SQLAlchemy) | Batches, geometries, materials, labels |
| Time-series DB | **InfluxDB** | Raw sensor streams |
| Vector DB | **ChromaDB** | RAG document embeddings |
| Cache | **Redis** | Current-state caching for fast reads |
| Message queue | **Kafka** (+ MQTT for edge ingestion) | Event streaming / distribution |
| ML frameworks | **PyTorch, TensorFlow, XGBoost, SHAP** | Model training and inference |
| LLM / RAG | **Llama 3 via Ollama** + **LangChain** | Local, on-premise cognitive assistant generation |
| Real-time transport | **FastAPI WebSocket** | Push live updates to the dashboard every 2 seconds |

### Database schema (reference)
| Store | Table/Collection | Contents |
|---|---|---|
| InfluxDB | `sensor_readings` | Time-series sensor data |
| PostgreSQL | `batches` | Production batch records |
| PostgreSQL | `geometries` | CAD shape embeddings |
| PostgreSQL | `materials` | Alloy/material properties |
| PostgreSQL | `inspection_labels` | Ground-truth defect labels |
| ChromaDB | `documents` | RAG knowledge vectors (manuals, SOPs, incident reports) |

### Module decomposition (build order suggestion)
1. **Data Ingestion** — MQTT listener, FastAPI ingestion endpoints, payload validation
2. **Multi-Modal Twin Core** — the 4 twins with state management (start here after ingestion works)
3. **Physics & Predictive Analytics** — LSTM-AE, TFT, XGBoost, PINN
4. **Visual Quality** — ResNet-50 + PCA classification pipeline
5. **Cognitive Interface** — RAG pipeline, Dashboard aggregation endpoints, Alert engine

---

## 9. Deployment

Target a **7-container Docker Compose** stack (containerize each twin/service for horizontal scaling per NFR-SC1). Reference `docker-compose.yml`:

```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - influxdb
      - redis
      - chromadb
      - ollama

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: nexus
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  influxdb:
    image: influxdb:2.7
    environment:
      INFLUXDB_DB: nexus
      INFLUXDB_ADMIN_USER: admin
      INFLUXDB_ADMIN_PASSWORD: password

  redis:
    image: redis:7-alpine

  chromadb:
    image: chromadb/chroma:latest

  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_data:/root/.ollama
    command: serve

volumes:
  postgres_data:
  ollama_data:
```

**Deployment / reliability requirements (build these in from day one):**
- Docker restart policy enabled on every service (`restart: unless-stopped` or `on-failure`).
- Twin state must be restorable from persisted storage within 30 seconds of a restart.
- Provide a synthetic-data fallback mode if live sensor feeds are unavailable (useful for demos/dev).
- Daily backups with 30-day retention for PostgreSQL/InfluxDB volumes.
- On-premise only — **no external API calls** for inference (this is why Llama 3 runs locally via Ollama, not a hosted LLM API).
- API tokens should expire after 8 hours; implement role-based access control with 3 roles.
- Tenant isolation should be enforced via a `foundry_id` field on all relevant records (multi-foundry ready).

---

## 10. Status Reference (as of guide submission)

| Component | Status |
|---|---|
| Dataset generation | ✅ Complete |
| LSTM-AE training | ✅ Complete |
| TFT training | ✅ Complete |
| XGBoost + SHAP | ✅ Complete |
| ResNet-50 | ✅ Complete |
| PINN | ✅ Complete |
| RAG (ChromaDB + Llama 3) | ✅ Complete |
| Melting Twin | ✅ Complete |
| Molding Twin | ✅ Complete |
| Pouring Twin | ✅ Complete |
| Quality Twin | ⏳ In progress (ResNet-50 integration) |
| Frontend (React + Three.js) | ⏳ In progress |
| API (FastAPI endpoints) | ⏳ In progress |
| Deployment (Docker Compose) | ⏳ In progress |

**One-line project summary:** NEXUS-Foundry is a cloud-deployable, event-driven AI digital-twin architecture where real-time foundry sensor and inspection data are ingested through Kafka, persisted in time-series and relational databases, synchronized into four stage-specific digital twins, analyzed by six specialized AI models, and exposed through explainable dashboards and a RAG-based operator assistant to support preventive decisions and continuous learning.

*See `02_WORKFLOW_AND_REQUIREMENTS.md` for the full requirements list, API contract, and performance targets, and `03_FRONTEND.md` for the UI build spec.*
