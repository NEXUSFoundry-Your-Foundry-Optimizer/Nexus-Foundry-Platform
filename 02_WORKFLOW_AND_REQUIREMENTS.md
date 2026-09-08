# NEXUS-Foundry — Workflow, Requirements & API Contract

> **Purpose of this document:** This is the build checklist. It defines *what the system must do* (functional requirements), *how well it must do it* (non-functional requirements/performance targets), the *step-by-step operational flow*, and the *API contract* the frontend and backend must agree on. An AI implementing this project should treat every FR/NFR below as an acceptance criterion.

---

## 1. Functional Requirements (12 core requirements)

### Data & Twin Management
- **FR-01 — Data Acquisition:** Ingest multi-stage sensor data via MQTT at 2-second intervals.
- **FR-02 — Digital Twin Management:** Maintain live twins (Melting, Molding, Pouring, Quality) with persistent state that survives restarts.
- **FR-03 — Anomaly Detection:** Run LSTM-AE every 2 seconds on furnace sensor data; flag anomaly when reconstruction error exceeds threshold **0.78**.

### Analytics & Prediction
- **FR-04 — Degradation Forecasting:** Run TFT to produce a 48-hour forecast with **P10 / P50 / P90** quantile bands.
- **FR-05 — Cross-Stage Correlation:** Melting Twin must warn Pouring Twin **within 2 seconds** of an anomaly.
- **FR-06 — Defect Prediction:** XGBoost model consumes 65 features and returns predictions with **SHAP** explainability.

### Cross-Stage & Simulation
- **FR-07 — What-If Simulation:** PINN runs a physics-constrained simulation and must return a result in **< 3 seconds**.
- **FR-08 — Visual Inspection:** ResNet-50 + PCA performs defect classification from casting images.
- **FR-09 — Cognitive Assistant:** RAG pipeline backed by a **local** Llama 3 model (via Ollama) answers operator questions with citations.

### User Interaction & Learning
- **FR-10 — Alert Management:** Mobile push notifications must be delivered within **500ms** of an alert condition.
- **FR-11 — Continuous Learning:** XGBoost retrains automatically once **50 new labels** have accumulated in the training queue.
- **FR-12 — React Dashboard:** Real-time dashboard updates via WebSocket every **2 seconds**.

---

## 2. Performance Targets (Key Metrics)

### Model performance
| Metric | Target |
|---|---|
| LSTM-AE detection rate | > 95% |
| TFT forecast MAE | < 15°C |
| XGBoost defect F1 | > 0.87 |

### System performance
| Metric | Target |
|---|---|
| Cross-stage warning latency | < 2 seconds |
| What-if simulation runtime | < 3 seconds |
| RAG response time | < 10 seconds |

---

## 3. Non-Functional Requirements (NFRs)

### Performance
| ID | Requirement |
|---|---|
| NFR-P1 | LSTM-AE inference < 100ms |
| NFR-P2 | TFT inference < 2 seconds |
| NFR-P3 | XGBoost inference < 500ms |
| NFR-P4 | PINN simulation < 3 seconds |
| NFR-P5 | ResNet-50 inference < 1 second |
| NFR-P6 | RAG response < 10 seconds |
| NFR-P7 | End-to-end pipeline latency (sensor → dashboard) < 2 seconds |
| NFR-P8 | Push notification delivery < 500ms |

### Reliability & Availability
| ID | Requirement |
|---|---|
| NFR-R1 | Uptime > 99.5% |
| NFR-R2 | Docker restart policy enabled on all containers |
| NFR-R3 | Twin state restored within 30 seconds of restart |
| NFR-R4 | Synthetic data fallback available when live feeds are down |
| NFR-R5 | Daily backups, 30-day retention |

### Security & Data Privacy
| ID | Requirement |
|---|---|
| NFR-S1 | On-premise only — no external inference APIs |
| NFR-S2 | Role-based access control (3 roles) |
| NFR-S3 | Tenant isolation via `foundry_id` on all records |
| NFR-S4 | Docker bridge networking (no unnecessary host exposure) |
| NFR-S5 | API tokens expire after 8 hours |

### Scalability & Maintainability
| ID | Requirement |
|---|---|
| NFR-SC1 | Twins are containerized and horizontally scalable |
| NFR-SC2 | New part geometries can be supported without retraining models |
| NFR-SC3 | New materials are supported via context injection, not retraining |
| NFR-M1 | Versioned model registry |
| NFR-M2 | `/api/health` health-check endpoint |

### Usability
| ID | Requirement |
|---|---|
| NFR-U1 | Operator can onboard in 2 hours |
| NFR-U2 | UI copy uses plain English, no unexplained jargon |
| NFR-U3 | WCAG 2.1 AA accessibility compliance |
| NFR-U4 | Multi-language support |

---

## 4. Backend Operational Flow (Step by Step)

```
 1. Sensor data arrives via MQTT
 2. FastAPI receives data, validates it, writes to InfluxDB
 3. Data is routed to the appropriate Digital Twin
 4. Twin updates its state and calls the relevant model(s)
 5. Model(s) return predictions
 6. Twin updates its state with the predictions
 7. Alerts are generated if configured thresholds are crossed
 8. WebSocket pushes the update to the dashboard
 9. Operator actions (via API) trigger what-if simulations
10. RAG queries retrieve documents + live twin state + model outputs
11. Llama 3 generates a cited natural-language response
12. Training queue accumulates human-reviewed labels for retraining (see FR-11)
```

## 5. Frontend Operational Flow (Step by Step)

```
 1. User lands on the Landing Page → reads about the project
 2. User navigates to the Dashboard → sees a live overview of all twins
 3. User clicks into a Twin page → sees 3D model, live graph, and alerts
 4. User sees an alert → clicks to view details
 5. User goes to Final Analytics → sees SHAP explanations
 6. User goes to the Agent page → chooses RAG or PINN
 7. RAG: user asks a question → assistant responds with citations
 8. PINN: user adjusts parameters → simulation results are displayed
 9. Notifications: user receives real-time alerts
10. User Profile: user views/edits account settings
```

*(See `03_FRONTEND.md` for the full page-by-page UI specification that implements this flow.)*

---

## 6. API Contract

Build the backend to expose (at minimum) these endpoints. The frontend spec in `03_FRONTEND.md` assumes this exact contract.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/twin/melting/state` | Get Melting Twin state |
| GET | `/api/twin/molding/state` | Get Molding Twin state |
| GET | `/api/twin/pouring/state` | Get Pouring Twin state |
| GET | `/api/twin/quality/state` | Get Quality Twin state |
| GET | `/api/batches` | Get all production batches |
| GET | `/api/batches/{id}` | Get a specific batch |
| GET | `/api/alerts` / `/api/alerts/active` | Get active alerts |
| POST | `/api/anomaly/detect` | Trigger/return LSTM-AE anomaly detection |
| POST | `/api/defect/predict` | Trigger/return XGBoost defect prediction |
| POST | `/api/simulate/what-if` | Run a PINN what-if simulation |
| POST | `/api/quality/inspect` | Run image-based quality inspection (ResNet-50 + PCA) |
| POST | `/api/rag/ask` | Ask the RAG cognitive assistant a question |
| GET | `/api/dashboard/summary` | Get the aggregated dashboard summary |
| GET | `/api/analytics/shap` | Get SHAP explanation values for a prediction |
| GET | `/api/health` | Health check (NFR-M2) |
| WS | `/ws` | WebSocket connection for real-time push updates |

### Notes on individual endpoints
- **`POST /api/simulate/what-if`** — request should include: twin identifier (`melting`/`molding`/`pouring`), current state snapshot, and the proposed parameter change (e.g. new setpoint temperature, new moisture %, new pour speed). Response should include the new predicted state, updated risk %, a `physics_valid` boolean, and a plain-language recommendation. Must respond in < 3 seconds (FR-07 / NFR-P4).
- **`POST /api/rag/ask`** — request includes the operator's question plus optional context (current furnace/batch id). Response must include the answer text and a `sources` array, each with a document name, page/section reference, and a relevance score, so the frontend can render citations (see RAG Page spec in `03_FRONTEND.md`). Must respond in < 10 seconds.
- **`GET /api/analytics/shap`** — should return a feature-contribution list (feature name, % contribution, direction) suitable for a waterfall/bar chart, plus a short natural-language recommendation string.
- **`GET /api/dashboard/summary`** — should return the 4 per-twin status cards (value, unit, status level: normal/warning/critical) in one payload to avoid 4 separate round-trips.

---

## 7. Cross-Stage Correlation Example (Reference Scenario)

Use this worked example as an integration-test scenario once the pipeline is built:

```
Melting Twin detects anomaly at 14:48:02
  → severity = 2.18, projected_temp = 1558°C
Warning delivered to Pouring Twin (must be < 2s per FR-05)
Pouring Twin queries:
  → Molding Twin: sand_moisture = 4.2%, humidity = 58%
  → CAD DB: shape_embedding[50], thick_section = 62mm
65 features assembled → XGBoost → 91% hot tear risk
SHAP explanation → temp 43%, lining 24%, shape 12%
CRITICAL alert raised on dashboard
Operator opens PINN panel, proposes reducing pour speed to 0.68 m/s
PINN validates: new_pour_temp = 1391°C, cooling_rate = 1.83°C/min, physics_valid = true
New risk = 34% (down from 91%)
Pour proceeds → Quality Twin inspects the finished casting image
```

---

## 8. Build Order Recommendation for an AI Agent

1. Stand up data layer (Postgres, InfluxDB, Redis, ChromaDB) via Docker Compose.
2. Generate/seed synthetic datasets matching the schemas in `01_ARCHITECTURE.md §7`.
3. Build the ingestion layer (MQTT listener + FastAPI validation + writes to InfluxDB/Postgres).
4. Implement the 4 Digital Twin services with in-memory + persisted state, exposing `GET /api/twin/{module}/state`.
5. Train/wire in the 5 predictive models (LSTM-AE, TFT, XGBoost+SHAP, ResNet-50+PCA, PINN) against the seeded datasets, matching the performance targets in §2.
6. Implement the cross-stage warning event (Melting → Pouring) and the fused 65-feature XGBoost call.
7. Build the RAG pipeline (ChromaDB ingestion of manuals/SOPs + Llama 3 via Ollama + LangChain orchestration).
8. Implement the Alert engine and WebSocket push (2s cadence, < 500ms push latency).
9. Build the FastAPI endpoints listed in §6.
10. Build the React frontend per `03_FRONTEND.md`, wiring each page to its corresponding endpoint(s).
11. Add auth (RBAC, 8h token expiry), health checks, backups, and restart policies to satisfy the NFRs in §3.
12. Containerize everything per the `docker-compose.yml` in `01_ARCHITECTURE.md §9` and validate the reliability targets (restart → state restore in 30s, etc.).
