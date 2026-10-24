# NEXUS-Foundry

**A replay-driven digital-twin platform for earlier, explainable casting decisions.**

NEXUS-Foundry connects the melting, molding, pouring, and quality stages of a foundry workflow. It replays process data, maintains a live state for each stage, detects abnormal furnace behaviour, forecasts thermal degradation, estimates pre-pour defect risk, and presents the evidence through a React dashboard.

> **Prototype status.** NEXUS-Foundry is a development and demonstration platform. It does not control plant equipment, and it must not be connected to a production foundry without formal safety, security, data-governance, and model-validation approval.

## Contents

- [What the platform does](#what-the-platform-does)
- [Architecture](#architecture)
- [Quick start with Docker](#quick-start-with-docker)
- [Local development](#local-development)
- [Configuration](#configuration)
- [Data and model artifacts](#data-and-model-artifacts)
- [API and real-time interface](#api-and-real-time-interface)
- [Cross-stage workflow](#cross-stage-workflow)
- [Machine-learning components](#machine-learning-components)
- [Repository layout](#repository-layout)
- [Validation and testing](#validation-and-testing)
- [Security and production readiness](#security-and-production-readiness)
- [Troubleshooting](#troubleshooting)

## What the platform does

NEXUS-Foundry focuses on one operational question: **can the team identify and explain risk before the pour, while there is still time for an operator to intervene?**

The current prototype provides:

- A replay controller that streams historical or synthetic process records.
- Four stateful digital twins: Melting, Molding, Pouring, and Quality.
- MQTT and Kafka integration for event movement between replay, backend services, and twins.
- PostgreSQL ORM entities, InfluxDB measurement writes, and Redis-backed twin-state caching.
- A 30-step LSTM autoencoder anomaly detector for furnace telemetry.
- A PyTorch forecast service that returns 48 temperature and lining-health horizons with P10/P50/P90 quantiles.
- An XGBoost pre-pour risk service with TreeSHAP feature attributions.
- A PINN-style what-if endpoint for proposed process parameters.
- FastAPI REST/WebSocket endpoints and a React/TanStack dashboard with twin, analytics, workflow, RAG, and simulation views.

## Architecture

```text
Historical datasets or edge signals
              |
              v
      MQTT publisher / subscriber
              |
              v
          Kafka event bus
              |
              v
  Digital twins: Melting -> Molding -> Pouring -> Quality
              |
              +--> InfluxDB       time-series telemetry
              +--> PostgreSQL     batch and decision records
              +--> Redis          live state and workflow cache
              |
              v
  LSTM-AE -> TFT -> XGBoost + TreeSHAP -> PINN what-if
              |
              v
   FastAPI REST and WebSocket gateway
              |
              v
      React dashboard and operator views
```

The primary unit of correlation is `batch_id`. An anomaly warning carries the batch context into the Pouring Twin, which retrieves corresponding molding, pouring, production, geometry, and model-schema records before scoring risk.

### Digital twins

| Twin | Main state | Role in the decision flow |
| --- | --- | --- |
| Melting | Temperature, power, vibration, lining health, operating state | Updates furnace context, runs anomaly detection, triggers forecasting. |
| Molding | Sand moisture, permeability, green strength, compactability | Provides batch-specific mold condition data. |
| Pouring | Pour temperature/speed, ladle fill, upstream risk, pre-pour risk | Combines cross-stage context, runs risk scoring, preserves SHAP evidence. |
| Quality | Defect presence/type/severity and inspection result | Records post-pour inspection state and supports the feedback path. |

## Quick start with Docker

### Prerequisites

- Docker Desktop with Compose v2.
- At least 8 GB available memory. TensorFlow, PyTorch, Kafka, InfluxDB, and Grafana make this a comparatively heavy local stack.
- Required datasets and model artifacts in the paths described in [Data and model artifacts](#data-and-model-artifacts).

### Start the stack

```powershell
docker compose up --build
```

Open these local endpoints after the services are ready:

| Service | URL | Purpose |
| --- | --- | --- |
| Frontend | http://localhost:8081 | Operator dashboard |
| Backend health | http://localhost:8000/api/health | Basic service status |
| OpenAPI / Swagger | http://localhost:8000/docs | Interactive API documentation |
| InfluxDB | http://localhost:8086 | Time-series administration |
| Grafana | http://localhost:3000 | Observability UI |

Stop the stack with:

```powershell
docker compose down
```

Remove local database volumes only when you intentionally want to discard all local PostgreSQL and InfluxDB data:

```powershell
docker compose down --volumes
```

> The Compose credentials and tokens currently committed in `docker-compose.yml` are **development-only defaults**. Replace them with managed secrets before any shared or production deployment.

## Local development

Run the infrastructure through Docker, then start the backend and frontend from separate terminals if you need hot reload.

### Backend

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
$env:PYTHONPATH = (Get-Location).Path
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend starts MQTT/Kafka clients, initializes available PostgreSQL tables, connects to InfluxDB and Redis, and starts a furnace replay when no replay already runs.

### Frontend

```powershell
cd frontend
npm ci
$env:VITE_API_URL = "http://localhost:8000"
npm run dev
```

For a production-style frontend build:

```powershell
cd frontend
npm run build
npm run preview
```

`VITE_API_URL` is a build-time browser setting. When the frontend runs on a different host from the backend, set it to the externally reachable backend URL before building.

## Configuration

The backend reads `.env` values through `backend/app/config.py`. Docker Compose supplies service-host overrides for the container network.

| Variable | Default | Description |
| --- | --- | --- |
| `MQTT_BROKER_HOST` / `MQTT_BROKER_PORT` | `localhost` / `1883` | MQTT broker endpoint. |
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:29092` | Kafka bootstrap address for local processes. |
| `POSTGRES_HOST`, `POSTGRES_PORT` | `localhost`, `5432` | PostgreSQL endpoint. |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | `nexus`, development defaults, `nexus_foundry` | Relational-store connection settings. |
| `INFLUXDB_URL`, `INFLUXDB_TOKEN`, `INFLUXDB_ORG`, `INFLUXDB_BUCKET` | Local development defaults | InfluxDB client configuration. |
| `REDIS_HOST` / `REDIS_PORT` | `localhost` / `6379` | Redis cache endpoint. |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4318` | OpenTelemetry collector endpoint. |
| `DATASETS_DIR` | `./Datasets` | Local dataset directory. |
| `VITE_API_URL` | `http://localhost:8000` | Frontend API base URL. |

Never commit real passwords, API tokens, or production connection strings. Use `.env` locally and a secret manager in deployed environments.

## Data and model artifacts

Large generated data files are intentionally ignored by Git. A fresh clone must obtain or generate the required files before a full replay can run.

### Required runtime inputs

| Path | Used by | Notes |
| --- | --- | --- |
| `Datasets/furnace_sensor.csv` | Replay, LSTM-AE, TFT context | Default startup replay source. |
| `Datasets/production_master.csv` | Scheduling and batch lineage | Used to find a scheduled pour for a warning batch. |
| `Datasets/molding_sensor.csv` | Molding context | Supplies sand-condition values. |
| `Datasets/pouring_sensor.csv` | Pouring context | Supplies pour-specific values. |
| `Datasets/xgboost_features.csv` | XGBoost feature schema | Provides source fields for the 65-feature vector. |
| `Datasets/geometry_metadata.csv` | Geometry context | Contains part-linked geometry metadata/embedding. |
| `Datasets/pinn_X.npy`, `Datasets/pinn_y.npy` | PINN data | Required for PINN training/reference workflows. |
| `models/lstm/lstm_ae_best.h5` | LSTM autoencoder | Loaded by the anomaly service. |
| `models/tft/tft_model.pt` | Forecaster | Loaded by the TFT-style service. |
| `models/pinn/pinn_heat_equation.pt` | PINN service | Loaded by the what-if service. |
| `backend/models/xgboost/*` | Risk and SHAP services | XGBoost model, scaler, feature names, SHAP explainer. |

`generate_datasets.py` can generate `pouring_sensor.csv` and `pinn_y.npy` when its source inputs exist:

```powershell
python generate_datasets.py
```

`train_and_export_models.py` creates compatible TFT and PINN weight files, but it initializes model weights. Treat any artifact produced by this script as a development placeholder until a recorded training and validation process replaces it.

## API and real-time interface

The running backend publishes OpenAPI documentation at `/docs`. The endpoints below provide the most useful starting points.

### Service, replay, and state

| Endpoint | Description |
| --- | --- |
| `GET /` | Gateway identity and docs link. |
| `GET /api/health` | Basic health response. |
| `GET /api/models/status` | Loaded/unavailable state for XGBoost, SHAP, LSTM-AE, TFT, and PINN. |
| `GET /api/dashboard/summary` | Latest state of all four twins. |
| `GET /api/twin/{twin}/state` | State of one twin. |
| `GET /api/v1/digital-twins/{twin}/state` | Versioned twin state, preferring the Redis cache. |
| `POST /api/v1/simulation/start` | Start replay. Query parameters: `dataset_name`, `speed`, optional `batch_id`. |
| `POST /api/v1/simulation/pause` / `resume` / `stop` / `restart` | Replay lifecycle controls. |
| `GET /api/v1/simulation/status` | Current replay status. |
| `GET /api/v1/workflows/latest` | Latest persisted cross-stage workflow. |

### Intelligence and quality

| Endpoint | Description |
| --- | --- |
| `POST /api/anomaly/detect` | Current Melting Twin anomaly state. |
| `GET /api/v1/predictions/tft` | TFT forecast; accepts `horizon`. |
| `GET /api/v1/predictions/xgboost` | Batch-specific completed cross-stage prediction, when available. |
| `GET /api/analytics/shap` | Current SHAP attribution response for the analytics view. |
| `POST /api/simulate/what-if` | Evaluates twin-specific proposed parameters through PINN and XGBoost. |
| `POST /api/rag/ask` | Context-grounded assistant request: `{"message":"...","batch_id":"latest"}`. |
| `POST /api/quality/inspect` | Submits inspection metadata for the Quality Twin. |
| `GET /api/v1/alerts` | Current recorded alerts; optional `twin` filter. |

### WebSocket

Connect to `ws://localhost:8000/ws` for live updates. The frontend sends `subscribe` after opening the socket and expects `digital_twin_update` messages with a `twin` and `state` payload. The backend also exposes `/api/v1/ws` and `/api/v1/ws/digital-twin/{batch_id}`.

## Cross-stage workflow

The workflow store records the following evidence chain for an actual anomaly cascade:

1. The Melting Twin receives a furnace replay row and updates its state.
2. LSTM-AE evaluates the latest 30-step, seven-feature sensor window.
3. A threshold crossing triggers a 48-horizon forecast using source-data context.
4. The Melting Twin checks for a same-batch scheduled pour inside a 12-hour window.
5. It sends an upstream warning only when the schedule check permits downstream work.
6. The Pouring Twin loads batch-linked molding, pouring, production, geometry, and feature-schema records.
7. It assembles the XGBoost vector, records prediction and TreeSHAP context, and evaluates alert policy.
8. `workflow_store` persists every step, including skipped or failed steps and their reasons.

This audit trail prevents a missing schedule or unavailable model from appearing as a successful low-risk decision.

## Machine-learning components

| Component | Current behaviour | Important limitation |
| --- | --- | --- |
| LSTM-AE | Loads a Keras artifact and derives an anomaly score from reconstruction error on a 30×7 window. | Anomaly score indicates novelty relative to baseline, not a confirmed failure diagnosis. |
| TFT-style forecaster | Uses a PyTorch LSTM/attention architecture to emit 48 temperature and lining-health quantiles. | Validate chronological error, coverage, and calibration before operational use. |
| XGBoost | Scores an ordered 65-feature cross-stage vector and returns probability, risk score, and label. | Do not quote accuracy or F1 without an archived split, evaluation script, and report. |
| TreeSHAP | Returns feature attributions for the XGBoost decision. | Attribution explains model behaviour, not physical causation. |
| PINN | Returns cooling-rate and solidification-time estimates with a `physics_valid` flag. | Validate against measurements or high-fidelity reference simulation before using it as a safety control. |
| Quality classifier | Current service evaluates submitted inspection metadata. | It does not yet load or execute a trained ResNet-50 image model. |
| RAG assistant | Returns live-state-grounded responses and source metadata. | It currently uses an in-process contextual response flow, not a full vector retrieval plus LLM stack. |

## Repository layout

```text
.
├── backend/
│   ├── app/
│   │   ├── api/v1/              # FastAPI route modules
│   │   ├── digital_twins/       # Melting, molding, pouring, quality state services
│   │   ├── simulator/           # Dataset replay and event mapping
│   │   ├── ml/                  # Model loaders and inference services
│   │   ├── db/                  # PostgreSQL, InfluxDB, Redis managers
│   │   ├── kafka/, mqtt/        # Event transport clients and bridge
│   │   └── workflows/           # Cross-stage audit record
│   ├── models/                  # XGBoost, SHAP, LSTM-related artifacts
│   └── requirements.txt
├── frontend/
│   └── src/                     # React routes, charts, 3D view, API hooks
├── Datasets/                    # Local/generated source data; large files ignored
├── models/                      # TFT and PINN artifacts
├── docker-compose.yml           # Local multi-service stack
├── 01_ARCHITECTURE.md           # System architecture specification
├── 02_WORKFLOW_AND_REQUIREMENTS.md
├── 03_FRONTEND.md               # Frontend build specification
└── presentation.tex             # Project-defense deck
```

## Validation and testing

`pytest` and `httpx` are declared in the backend dependencies, but this repository does not yet contain an automated test suite or an archived benchmark report. Treat model and performance statements as unverified until the team adds reproducible evidence.

Recommended validation layers:

- **Unit tests:** dataset mapping, feature order, anomaly threshold behaviour, cache fallback, and model-unavailable responses.
- **Integration tests:** deterministic replay through MQTT/Kafka, twin-state updates, workflow persistence, and WebSocket broadcast.
- **API contract tests:** valid requests, validation errors, absent batch records, missing model artifacts, and no-scheduled-pour paths.
- **Model evaluation:** chronological train/validation/test splits, calibration curves, confusion matrices, forecast MAE/RMSE, quantile coverage, and hardware-tagged inference latency.
- **User acceptance tests:** an operator must trace every alert from batch ID through source inputs, model version, and recommended next review.

Frontend quality checks are available through:

```powershell
cd frontend
npm run lint
npm run build
```

## Security and production readiness

The current codebase is configured for local development. Before any shared or production deployment, complete the following work:

- Implement authentication and role-based authorization for every non-public endpoint.
- Restrict CORS from the current permissive configuration.
- Move all credentials and tokens into a secret manager; rotate the committed development defaults.
- Add TLS for browser, API, MQTT, Kafka, database, and observability traffic.
- Replace automatic schema creation with reviewed, versioned database migrations.
- Enforce foreign keys and transactional/idempotent handling for multi-record workflows.
- Add structured logs, correlation IDs, audit retention, metrics, alerting, backups, and recovery drills.
- Add CI/CD gates for dependency scanning, tests, image scanning, and signed deployments.
- Validate all models under representative operating conditions and define human escalation procedures.
- Keep PLC or actuator control outside the platform until independent functional-safety review approves it.

## Troubleshooting

### The frontend cannot reach the backend

- Confirm `http://localhost:8000/api/health` returns JSON.
- Confirm `VITE_API_URL` matches the backend address used by the browser.
- When using Docker, use `http://localhost:8000` from a local browser, not the internal Compose hostname.

### A model reports `loaded: false`

- Call `GET /api/models/status` and inspect its `error` value.
- Confirm the corresponding artifact exists at the expected path and matches the loader's framework version.
- Do not replace an unavailable model response with a fabricated prediction.

### Replay does not start or stops early

- Confirm `Datasets/furnace_sensor.csv` exists and can be read by the backend process/container.
- Check `GET /api/v1/simulation/status` and backend logs.
- Start a focused replay with `POST /api/v1/simulation/start?dataset_name=furnace_sensor.csv&speed=1.0`.

### No downstream XGBoost prediction appears

- Verify the anomaly crossed the configured threshold.
- Verify the same `batch_id` has a scheduled pour within the workflow window.
- Inspect `GET /api/v1/workflows/latest`; it records the exact reason for skipped downstream steps.

### Redis or InfluxDB is unavailable

The services log a connection failure. Redis falls back to an in-memory cache for development continuity. This fallback is not durable and must not serve as a production availability strategy.

## Supporting documentation

- [Architecture specification](01_ARCHITECTURE.md)
- [Workflow and requirements](02_WORKFLOW_AND_REQUIREMENTS.md)
- [Frontend specification](03_FRONTEND.md)
- [Software-architecture rubric slides](phase2_rubric_architecture_deck.tex)
- [Project-defense presentation](presentation.tex)

## Contributing

1. Create a focused branch using the `codex/` prefix.
2. Keep each change working and scoped to a clear purpose.
3. Add or update tests and documentation with behaviour changes.
4. Run the relevant backend and frontend checks before opening a review.
5. Never commit datasets, generated credentials, real operational telemetry, or model artifacts without approval.

## License

No license file is currently included. All rights remain reserved until the project owners add an explicit license.
