# NEXUS-Foundry: End-to-End Cognitive Digital Twin Platform for Smart Foundry Operations

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/3D_Digital_Twin-Three.js_%2F_R3F-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![PyTorch](https://img.shields.io/badge/Deep_Learning-PyTorch_2.3-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![TensorFlow](https://img.shields.io/badge/ML-TensorFlow_2.16-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)](https://tensorflow.org/)
[![XGBoost](https://img.shields.io/badge/Defect_Classifier-XGBoost-18534F?style=for-the-badge)](https://xgboost.readthedocs.io/)
[![Docker](https://img.shields.io/badge/Containerized-Docker_Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

> NEXUS-Foundry is a complete industrial AI platform for green sand and metal casting operations. It connects real-time plant telemetry, digital twin state modeling, predictive analytics, and explainable decision support in one unified system. The platform simulates the flow of material and intelligence from melting to molding, pouring, and final quality inspection.

---

## Project Summary

NEXUS-Foundry addresses a fundamental challenge in modern foundry operations: the process is highly thermal, physically nonlinear, and fragmented across multiple stages, yet decisions are often made with delayed feedback and siloed monitoring. The result is ongoing scrap, lost throughput, refractory wear, energetic inefficiency, and operator uncertainty.

This project builds a digital twin ecosystem for foundry operations, with:

- Real-time process telemetry collection and monitoring
- Stage-specific digital twins for Melting, Molding, Pouring, and Quality
- Early warning anomaly detection using LSTM-based autoencoders
- Forecasting of degradation and temperature drift using Temporal Fusion Transformer (TFT)
- Pre-pour defect risk classification using XGBoost
- Explainability using SHAP
- Physics-informed simulation using PINN (Physics-Informed Neural Network)
- A web dashboard for operations and decision-making
- A cognitive RAG assistant and AI operator support layer
- Synthetic datasets created to model industrial casting behavior without real proprietary data exposure

The platform is designed as a production-style simulation and intelligence system for metal casting plants, with the full system spanning multiple repositories.

---

## Why This Project Exists

The foundry process is interconnected across several physical stages:

1. Melting
2. Molding
3. Pouring
4. Quality inspection

Traditional factory systems monitor each stage separately. That creates blind spots:

- Furnace drift is discovered only after quality problems appear
- Mold conditions may not be associated with downstream defect outcomes
- Pouring and defect risks are evaluated too late
- Plant operators lack transparent explanations for AI predictions

NEXUS-Foundry closes that gap by synchronizing state across stages, capturing causal relationships, and surfacing actionable explanations and simulations before costly mistakes happen.

---

## End-to-End System Architecture

The platform follows a layered cyber-physical architecture:

```text
Physical Plant / Sensors
    ↓
Data Ingestion Layer
    ↓
Digital Twin Layer
    ↓
AI Analytics Layer
    ↓
Decision Support Layer
    ↓
Operator Dashboard & RAG Assistant
```

### Core industrial flow

```text
[ Melting Twin ] ───► [ Molding Twin ] ───► [ Pouring Twin ] ───► [ Quality Twin ]
   │                    │                     │                        │
   ▼                    ▼                     ▼                        ▼
 LSTM-AE + TFT     Sand Kinetics     XGBoost + PINN      ResNet + QC Rules
 Anomaly + Drift   Process Control    Defect Risk        Quality Outcome
```

This creates a closed-loop intelligence system where upstream anomalies are propagated downstream to inform risk, response, and corrective action.

---

## The Four Digital Twins

### 1. Melting Twin
Responsible for furnace behavior and melt process health.

Key signals:
- Melt temperature
- Power draw (kW)
- Vibration and coil instability
- Lining health
- Cooling water metrics
- Operating state

AI responsibilities:
- LSTM autoencoder-based anomaly detection
- Forecasting degradation or thermal drift using TFT
- Triggering risk propagation to downstream stages

### 2. Molding Twin
Responsible for sand and mold quality conditions.

Key signals:
- Sand moisture
- Permeability
- Compactability
- Green strength
- Mold age / processing conditions

AI responsibilities:
- Conditioning the risk factors that influence pre-pour quality
- Providing process context for defect prediction

### 3. Pouring Twin
Responsible for ladle flow and pour quality.

Key signals:
- Pour temperature
- Flow speed
- Ladle fill percentage
- Thermal drop between stages
- Upstream risk context

AI responsibilities:
- Pre-pour risk scoring
- What-if simulation with PINN and process constraints
- Correction recommendations for temperature and flow

### 4. Quality Twin
Responsible for final defect outcome and inspection intelligence.

Key signals:
- Defect prediction
- Defect type
- Severity
- Visual inspection context

AI responsibilities:
- Post-pour defect classification and feedback
- Explainability for defect causes
- Triggering corrective learning loops

---

## AI / ML Pipeline

The platform uses a hybrid AI stack designed for different decision types:

### Tier 1: Screening / anomaly detection
- LSTM Autoencoder
- Detects abnormal melting behavior based on reconstruction error
- Useful for early, low-latency alerts

### Tier 2: Forecasting
- Temporal Fusion Transformer (TFT)
- Predicts future degradation or temperature trajectories
- Produces P10 / P50 / P90 forecast bands

### Tier 3: Risk classification
- XGBoost
- Predicts defect probabilities before pouring
- Combines process, geometry, and material properties

### Tier 4: Explainability
- TreeSHAP
- Explains which feature values drove a defect prediction
- Makes model decisions interpretable for operators

### Physics validation layer
- Physics-Informed Neural Network (PINN)
- Verifies whether suggested operating changes align with thermodynamic constraints
- Used for what-if exploration and operator simulation

---

## 11-Step Cross-Stage Decision Workflow

When an anomaly is detected in the melting stage, the system executes an end-to-end workflow:

1. LSTM-AE detects a furnace anomaly
2. Melting Twin triggers TFT forecasting
3. Forecasts are generated for the next window
4. Active batch timing is validated
5. Warning is dispatched to Pouring Twin
6. Pouring Twin inherits upstream thermal risk
7. Molding Twin condition data is fetched
8. Geometry and process data are merged
9. A feature vector is assembled
10. XGBoost predicts defect probability and SHAP explains it
11. Corrective actions are proposed to the operator

This is the operational heart of the platform: not just prediction, but coordinated response.

---

## Data Strategy and Synthetic Dataset

The project includes synthetic datasets as a safe, scalable, and publicly shareable stand-in for proprietary industrial data.

### Dataset repository
- [Synthetic-Datasets](https://github.com/NEXUSFoundry-Your-Foundry-Optimizer/Synthetic-Datasets)

### Why synthetic data matters
- Real foundry data is often private and sensitive
- Large industrial datasets are difficult to distribute
- Synthetic generation allows reproducible benchmark development
- It supports research in anomaly detection, defect prediction, and process optimization

### Dataset characteristics
The synthetic dataset simulates around 90 days of production behavior and includes over 10,800 batches, with process telemetry and labels generated according to metallurgical rules.

Key files include:
- production_master.csv
- environmental.csv
- molding_sensor.csv
- inspection_labels.csv
- geometry_metadata.csv
- material_properties.csv
- xgboost_features.csv
- .npy model inputs for PINN and related pipelines

### Dataset use cases
- Training XGBoost defect risk models
- Building anomaly detection pipelines
- Testing forecast models with concept drift scenarios
- Running multi-stage decision support experiments
- Benchmarking industrial AI methods in a realistic but privacy-safe context

---

## Repository Map

This project is distributed across multiple GitHub repositories, each with a distinct role:

### 1. Nexus-Foundry-Platform
Repository for the main project definition and integrated system documentation.

- GitHub: https://github.com/NEXUSFoundry-Your-Foundry-Optimizer/Nexus-Foundry-Platform
- Purpose: overall architecture, project narrative, orchestration documentation, and platform-level overview

### 2. Backend
Python backend for AI inference, streaming, orchestration, model loading, and data services.

- GitHub: https://github.com/NEXUSFoundry-Your-Foundry-Optimizer/backend
- Purpose: FastAPI services, digital twin orchestration, event streaming, Kafka/MQTT integration, DB adapters, and model serving

### 3. Frontend
React-based operator dashboard and management interface.

- GitHub: https://github.com/NEXUSFoundry-Your-Foundry-Optimizer/frontend
- Purpose: interactive analytics dashboard, 3D visualization, Twin views, AI assistant, and operator experience

### 4. Synthetic-Datasets
Industrial synthetic dataset generator and benchmark data files.

- GitHub: https://github.com/NEXUSFoundry-Your-Foundry-Optimizer/Synthetic-Datasets
- Purpose: public dataset for training, evaluation, and benchmarking

---

## Frontend Repository: What It Provides

The frontend repository focuses on the user experience layer of the platform.

### Primary capabilities
- Real-time operations dashboard
- Stage-specific interfaces for each digital twin
- 3D visualization using React Three Fiber and Three.js
- KPI monitoring and alert visualization
- SHAP analytics views
- RAG assistant interface
- PINN simulation studio
- Operator workflow walkthroughs

### Tech stack
- React 19
- TypeScript
- Vite
- TanStack Start
- Tailwind CSS
- Recharts
- Zustand
- React Three Fiber
- Motion

### User experience goals
- High-clarity situational awareness for plant operators
- Explainable insights rather than opaque model output
- Smooth multi-page industrial control experience
- Scenario simulation without direct machine exposure

---

## Backend Repository: What It Provides

The backend is the core intelligence and orchestration engine behind the platform.

### Main responsibilities
- FastAPI API layer
- WebSocket telemetry streaming
- Digital twin state management
- Cross-stage workflow engine
- Inference services for LSTM, TFT, XGBoost, SHAP, and PINN
- Integration with Kafka, MQTT, Postgres, InfluxDB, and Redis
- Dataset replay and simulation engine
- Alert and workflow tracking

### Key modules
- app/main.py: service entry point
- app/api/v1: API routing
- app/digital_twins: twin implementations
- app/ml: ML inference modules
- app/db: storage integrations
- app/kafka: broker integration
- app/simulator: dataset replay logic
- app/workflows: execution trace and audit trail

### Core services
- `/api/health`
- `/api/models/status`
- `/api/dashboard/summary`
- `/api/twin/{twin}/state`
- `/api/anomaly/detect`
- `/api/v1/predictions/tft`
- `/api/v1/predictions/xgboost`
- `/api/analytics/shap`
- `/api/simulate/what-if`
- `/ws/live-stream`

---

## System Data Flow

```text
Sensors / SCADA / Logs
      ↓
InfluxDB / PostgreSQL / Redis
      ↓
FastAPI backend
      ↓
Digital twin state update
      ↓
ML inference (LSTM / TFT / XGBoost / SHAP / PINN)
      ↓
Alert generation and workflow events
      ↓
Frontend dashboard + operator alerts + RAG assistant
```

This architecture creates a continuous loop:

- data enters
- models score and explain behavior
- operators see the state
- simulation and recommendations inform action
- quality outcomes feed future improvement

---

## Typical Use Cases

### Operational monitoring
Plant operators can observe live process metrics, KPIs, and critical events across all stages.

### Early anomaly detection
Furnace and process abnormalities are detected before they propagate into scrap or dangerous conditions.

### Defect prevention
Pre-pour risk models evaluate whether a batch is likely to produce defects based on melt, mold, geometry, and material conditions.

### Explainable decision support
Instead of only producing a risk score, the platform explains which variables matter most.

### What-if simulation
Operators can test changes to temperature, pour speed, and process settings before actual execution.

### Training and benchmarking
Researchers can use the synthetic dataset for reproducible development and evaluation.

---

## Technical Stack Summary

### Frontend
- React 18+
- TypeScript
- Vite
- Tailwind
- Three.js / React Three Fiber
- Recharts
- Zustand
- TanStack Query

### Backend
- Python 3.10–3.12
- FastAPI
- PyTorch
- TensorFlow / Keras
- XGBoost
- SHAP
- Kafka
- Redis
- PostgreSQL
- InfluxDB
- Docker Compose

### Data and modeling
- Synthetic foundry telemetry datasets
- Physics-informed heat modeling
- LSTM anomaly detection
- TFT multi-horizon forecasting
- SHAP explainability
- Defect classification and risk scoring

---

## Deployment and Local Run

The project is designed to run as a multi-service environment using Docker Compose, with local development possible separately for backend and frontend.

### Typical stack deployment
- frontend app
- backend API
- PostgreSQL
- InfluxDB
- Redis
- Kafka
- MQTT
- Grafana / observability services

### Running locally
From the main project structure or orchestration layer:

```bash
docker compose up --build
```

Then access services like:

- Frontend: http://localhost:8081
- Backend API docs: http://localhost:8000/docs
- Backend health: http://localhost:8000/api/health

---

## Full-System Project Value

NEXUS-Foundry is not just a dashboard or a model. It is a complete industrial intelligence platform whose value is the combination of all parts:

- Data capture
- Physical interpretation
- AI prediction
- Explainability
- Operational response
- Process validation
- Dataset-driven experimentation

This end-to-end system is well-suited for:
- Smart manufacturing initiatives
- Predictive quality programs
- Process optimization research
- Digital twin experimentation
- Foundry modernization projects

---

## Project Vision

The long-term vision of NEXUS-Foundry is to transform conventional foundry operations into a self-aware, predictive, and explainable manufacturing environment.

It aims to:
- reduce scrap and rework
- reduce failure risk at the furnace and downstream stages
- improve operator decision-making with explainable AI
- increase process visibility through digital twins
- support sustainable, high-efficiency industrial production

---

## Final Readme Summary

The NEXUS-Foundry project is an end-to-end industrial digital twin and AI platform built to monitor, predict, and explain production behavior across all major stages of a foundry workflow. The frontend provides the interactive operator interface, the backend provides the intelligence and orchestration layer, the main platform repo ties the project together at an architectural level, and the synthetic dataset repo supplies the public benchmark and training corpus for this ecosystem.

Together, the repositories form one coherent system for modern smart foundry intelligence.

---

## Related Repositories

- Main platform: https://github.com/NEXUSFoundry-Your-Foundry-Optimizer/Nexus-Foundry-Platform
- Frontend: https://github.com/NEXUSFoundry-Your-Foundry-Optimizer/frontend
- Backend: https://github.com/NEXUSFoundry-Your-Foundry-Optimizer/backend
- Synthetic datasets: https://github.com/NEXUSFoundry-Your-Foundry-Optimizer/Synthetic-Datasets

---

## License

This project is designed for research, demonstration, and industrial prototyping in the area of smart manufacturing and digital twins. The dataset repository is published under MIT-style usage for synthetic research purposes, and the overall project documentation is intended for open technical communication and benchmarking.

> Please check the specific repository LICENSE files for the exact legal terms applicable to each repository.

---

## Contributors & Team Focus

The project reflects a collaborative multidisciplinary effort spanning:

- AI/ML engineering
- backend services and orchestration
- industrial process modeling
- frontend engineering and 3D visualization
- explainable AI systems
- synthetic dataset engineering and benchmarking

This system is a strong example of combining modern AI, digital twins, and industrial engineering in a single end-to-end platform.
