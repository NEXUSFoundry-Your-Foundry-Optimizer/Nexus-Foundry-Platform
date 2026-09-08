# NEXUS-Foundry — Frontend Build Specification

> **Purpose of this document:** This is a page-by-page and component-by-component UI spec. An AI building the frontend should be able to scaffold the entire app structure directly from this file, then fill in each page using the layouts and data bindings described below. Pair with `02_WORKFLOW_AND_REQUIREMENTS.md §6` for the exact API endpoints each page consumes.

---

## 1. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | **React 18 + TypeScript** (Vite) | UI development |
| Styling | **Tailwind CSS + shadcn/ui** | Component library / design system |
| 3D Visualization | **Three.js + React Three Fiber** | 3D factory / twin views |
| Charts | **Recharts** | Live graphs, forecast bands, SHAP bars |
| State management | **Zustand** | Global client state |
| Data fetching | **TanStack Query (React Query)** | REST API calls, caching, polling |
| Real-time | **native WebSocket API** | Live push updates (`/ws`) |

---

## 2. Project / Folder Structure

```
nexus-foundry-frontend/
├── src/
│   ├── pages/
│   │   ├── LandingPage/
│   │   ├── Twins/
│   │   │   ├── MeltingTwin/
│   │   │   ├── MoldingTwin/
│   │   │   ├── PouringTwin/
│   │   │   └── QualityTwin/
│   │   ├── Dashboard/
│   │   ├── FinalAnalytics/
│   │   ├── Agent/
│   │   │   ├── RAGPage/
│   │   │   └── PINNPage/
│   │   ├── UserProfile/
│   │   └── Notifications/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navbar/
│   │   │   ├── Footer/
│   │   │   └── Layout/
│   │   ├── charts/
│   │   │   ├── TFTChart/
│   │   │   ├── SHAPChart/
│   │   │   └── LiveSensorChart/
│   │   ├── 3d/
│   │   │   ├── Furnace3D/
│   │   │   ├── Mold3D/
│   │   │   └── Ladle3D/
│   │   └── alerts/
│   │       ├── AlertBanner/
│   │       └── NotificationBell/
│   ├── services/
│   │   ├── api/            # REST client (React Query hooks)
│   │   ├── websocket/      # WS connection manager
│   │   └── models/         # TypeScript interfaces for twin/model payloads
│   └── utils/
│       └── constants/
```

---

## 3. Navigation (Navbar)

| Button | Dropdown | Links to |
|---|---|---|
| **Twins** | ▼ | Melting Twin, Molding Twin, Pouring Twin, Quality Twin |
| **Dashboard** | — | Dashboard page |
| **Final Analytics** | — | Final Analytics page |
| **Agent** | ▼ | RAG Assistant, PINN Simulation |
| **User Profile** | — | User Profile (top right) |
| **Notifications** | — | Alerts (bell icon, left of user profile) |

---

## 4. Landing Page

**Purpose:** First impression — explains the concept and tools used. No live data required.

**Sections, in order:**

1. **Hero Section**
   - Title: *"NEXUS-Foundry: AI-Powered Digital Twin Platform for Foundry Operations"*
   - Tagline: *"Predict, Prevent, Preserve — Making Foundry Data Speak"*
   - Visual: animated 3D model of a foundry furnace (React Three Fiber)

2. **About Digital Twins**
   - Copy: *"A digital twin is a living virtual replica of your physical asset. It updates in real-time, remembers history, and predicts future behavior."*
   - Four twin cards: Melting, Molding, Pouring, Quality (mark **Quality as "Coming Soon"** to match current backend status)

3. **About Foundry Process**
   - Visual flow diagram of the four stages (Melting → Molding → Pouring → Quality)
   - Short description under each stage

4. **Project Novelty**
   - *Cross-Stage Correlation:* "Connecting furnace anomalies to casting defects 6+ hours before pour"
   - *Physics-Validated What-If:* "PINN simulation with heat equation constraints"
   - *Triple-Source RAG:* "Combining manuals + live twins + model outputs in one answer"

5. **Future Enhancements**
   - Quality Twin integration, mobile app, multi-foundry deployment, advanced image augmentation

6. **Tools Used**
   - Backend: FastAPI, Python, PyTorch, TensorFlow
   - Frontend: React, Three.js, Tailwind CSS
   - Data: InfluxDB, PostgreSQL, ChromaDB
   - Deployment: Docker, Kubernetes

---

## 5. Twin Pages (4 pages, shared layout)

All four twin pages (`/twins/melting`, `/twins/molding`, `/twins/pouring`, `/twins/quality`) share one layout component with stage-specific data.

```
┌─────────────────────────────────────────────────────────────┐
│ {Twin Name}                     Status: 🔴 Critical         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌──────────────────────────────┐ │
│  │ 3D CAD Model        │  │ Live Simulation Graph        │ │
│  │ (Three.js)          │  │ (Recharts)                   │ │
│  │  [stage-specific     │  │  time-series of key sensors  │ │
│  │   3D model]          │  │                              │ │
│  └─────────────────────┘  └──────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Data Info (Batch, Timestamp, Sensor Values)              ││
│  │ Batch: AL-CB-001 | Time: 14:48:02 | Temp: 1479°C        ││
│  │ Power: 1023kW | Vibration: 0.062g | Health: 0.61        ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Alert Logs                                               ││
│  │ 🔴 CRITICAL | 14:48:02 | Anomaly detected (2.18×)       ││
│  │ 🟡 WARNING  | 14:15:00 | Temperature rising              ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Data source:** `GET /api/twin/{module}/state`, refreshed via WebSocket (`/ws`) every 2 seconds; alert log from `GET /api/alerts?twin={module}`.

### Melting Twin
- 3D model: induction furnace
- Graph: temperature, power, vibration over time
- Data fields: `melt_temp`, `power_kw`, `vibration_g`, `lining_health`, `operating_state`
- Alerts: anomaly detection alerts (from LSTM-AE)

### Molding Twin
- 3D model: sand molding machine
- Graph: sand moisture, permeability, green strength
- Data fields: `sand_moisture`, `permeability`, `green_strength`, `compactability`
- Alerts: high-moisture / low-permeability alerts

### Pouring Twin
- 3D model: ladle
- Graph: pour temperature, speed, fill level
- Data fields: `pour_temp`, `pour_speed`, `ladle_fill_pct`, `upstream_risk`
- Alerts: pre-pour risk alerts

### Quality Twin (build last — backend integration in progress)
- 3D model: inspection station
- Graph: defect classification over time
- Data fields: `defect_present`, `defect_type`, `severity`
- Alerts: defect-detected alerts

---

## 6. Dashboard Page

**Purpose:** Comprehensive live overview of all four twins and batch activity. Data source: `GET /api/dashboard/summary` + WebSocket updates.

**Sections:**

1. **Summary Cards** (one per twin)
   ```
   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
   │ Melting  │ │ Molding  │ │ Pouring  │ │ Quality  │
   │ 1479°C   │ │ 4.2%     │ │ 91% Risk │ │ 0.29     │
   │ 🟢 Normal │ │ 🟢 Normal │ │ 🔴 High  │ │ 🟡 Warn  │
   └──────────┘ └──────────┘ └──────────┘ └──────────┘
   ```
2. **Batch Timeline** — horizontal timeline of all batches, color-coded (green = normal, yellow = warning, red = defect detected). Source: `GET /api/batches`.
3. **Historical Charts** — temperature trends per day, defect rate over time, furnace health degradation.
4. **Active Alerts** — list of current alerts with severity and timestamp. Source: `GET /api/alerts/active`.

---

## 7. Final Analytics Page

**Purpose:** Consolidated analysis, SHAP explainability, and alert management.

**Sections:**

1. **Alert Summary Table**
   ```
   ┌─────────┬──────────┬─────────┬──────────┬──────────┐
   │ Twin    │ Batch    │ Severity│ Time     │ Action   │
   ├─────────┼──────────┼─────────┼──────────┼──────────┤
   │ Melting │ CB-001   │ 🔴 Crit │ 14:48    │ View ───▶│
   │ Pouring │ CB-001   │ 🔴 Crit │ 14:48    │ View ───▶│
   │ Molding │ CB-002   │ 🟡 Warn │ 09:15    │ View ───▶│
   └─────────┴──────────┴─────────┴──────────┴──────────┘
   ```
   Clicking **View** navigates to the relevant twin page and highlights that specific alert.

2. **SHAP Explainability panel**
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │ Defect Prediction: Gas Porosity (29%)                       │
   ├─────────────────────────────────────────────────────────────┤
   │ Why?                                                         │
   │ Humidity (58%)    ████████████████░░░░░░░░░░  +16%          │
   │ Sand Moisture     ████████████░░░░░░░░░░░░░░  +12%          │
   │ Visual Pattern    ██████████░░░░░░░░░░░░░░░░  +10%          │
   │ Pour Speed        ░░░░░░░░░░░░░░░░░░░░░░░░░░   -4%          │
   │ Recommendation: Reduce humidity or increase venting.        │
   └─────────────────────────────────────────────────────────────┘
   ```
   Data source: `GET /api/analytics/shap`. Render as a horizontal bar/waterfall chart with `SHAPChart` component.

3. **Defect Prediction Dashboard** — list of all batches with predicted defect probability; compares pre-pour prediction vs. post-inspection actual result.

---

## 8. Agent Page

**Purpose:** Entry point for the AI assistant — choose between conversational Q&A (RAG) and interactive simulation (PINN).

```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 Hey, [User Name]! What would you like to do?              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────────────┐   │
│  │  💬 Ask a Question   │  │  ⚡ Try What-If Simulation   │   │
│  │  Click to chat       │  │  ▼ Select a twin             │   │
│  │  with RAG Assistant  │  │  ├─ Melting Twin              │   │
│  │                      │  │  ├─ Molding Twin              │   │
│  │                      │  │  └─ Pouring Twin              │   │
│  └─────────────────────┘  └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. RAG Page

**Purpose:** Chat interface for operator questions, backed by `POST /api/rag/ask`.

```
┌─────────────────────────────────────────────────────────────┐
│ 💬 NEXUS Assistant                    🔄 New Conversation   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 📚 Context: Furnace 3 | Batch: CB-001 | Status: 🔴      ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  User: Why is the lining failing?                            │
│                                                               │
│  Assistant: [answer text generated by Llama 3, grounded in   │
│  live twin state + retrieved documents]                      │
│                                                               │
│  📎 Sources:                                                  │
│  • Furnace 3 Manual p.4-3 (relevance 94%)                    │
│  • Incident Report Sept 2025 (relevance 89%)                 │
│  • SOP v2.3 p.7 (relevance 83%)                               │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Ask a question...                    [Send] 📤          ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Implementation notes:**
- Always show a **context bar** at the top with the currently-selected furnace/batch so the RAG backend can ground its answer in live state.
- Every assistant message must render a **Sources** block with document name, page/section, and relevance % — this is returned by the backend as part of the `POST /api/rag/ask` response (see API contract in `02_WORKFLOW_AND_REQUIREMENTS.md §6`).
- Target response time is < 10 seconds — show a loading/typing indicator while waiting.

---

## 10. PINN Page

**Purpose:** Manual what-if simulation interface across all three actionable twins (Melting, Molding, Pouring). Backed by `POST /api/simulate/what-if`.

```
┌─────────────────────────────────────────────────────────────┐
│ ⚡ What-If Simulation                                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Simulation Controls                                      ││
│  │  🔥 Melting Twin                                          ││
│  │  ├─ Current Temperature: 1479°C                          ││
│  │  ├─ Proposed Setpoint: [1400]°C                          ││
│  │  └─ [Run Simulation]                                     ││
│  │  🏔️ Molding Twin                                          ││
│  │  ├─ Current Moisture: 4.2%                                ││
│  │  ├─ Proposed Moisture: [3.5]%                             ││
│  │  └─ [Run Simulation]                                      ││
│  │  💧 Pouring Twin                                          ││
│  │  ├─ Current Speed: 0.74 m/s                               ││
│  │  ├─ Proposed Speed: [0.68] m/s                            ││
│  │  └─ [Run Simulation]                                      ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Simulation Results                                        ││
│  │  New Pour Temperature: 1391°C                             ││
│  │  New Defect Risk: 34% (↓ from 91%)                        ││
│  │  Physics Valid: ✅ Yes (cooling rate 1.83°C/min)          ││
│  │  Recommendation: Reduce pour speed to 0.68 m/s            ││
│  │  [Apply Change]  [Save Scenario]                          ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 3D Simulation View (Three.js)                              ││
│  │  [3D model showing cooling trajectory]                     ││
│  │  ● 1400°C setpoint applied                                 ││
│  │  ● Cooling from 1479°C to 1391°C                           ││
│  │  ● 6.2 hours until pour                                    ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Implementation notes:**
- Only one twin's control panel should submit at a time; disable the other two "Run Simulation" buttons while a request is in flight.
- Results panel must render `physics_valid` as a clear pass/fail badge — this is the PINN's key differentiator vs. a plain regression model.
- **Apply Change** should call an action endpoint that actually updates the twin's target setpoint (define this alongside `/api/simulate/what-if` in the backend); **Save Scenario** should persist the simulation input/output pair for later reference (e.g. training queue or a `scenarios` table).
- Target response time is < 3 seconds — show a spinner/progress state on the results panel.

---

## 11. Notifications & User Profile

- **Notification Bell** (navbar): shows unread alert count; opens a dropdown/panel listing recent alerts (reuse `AlertBanner` component); clicking an alert navigates to the relevant twin page, same as the Final Analytics "View" action.
- **User Profile** (navbar, top right): view/edit account settings, role display (aligns with NFR-S2 role-based access — show the user's role: e.g. Operator / Supervisor / Admin).

---

## 12. Component Reuse Guide

| Component | Used on | Notes |
|---|---|---|
| `AlertBanner` | Twin pages, Dashboard, Notifications | Color-coded by severity (🔴 critical / 🟡 warning / 🟢 normal) |
| `NotificationBell` | Navbar (global) | Polls or subscribes via WebSocket for new alerts |
| `LiveSensorChart` | Twin pages | Recharts line chart, WebSocket-driven |
| `TFTChart` | Melting Twin, Final Analytics | Renders P10/P50/P90 forecast band |
| `SHAPChart` | Final Analytics, Pouring Twin alerts | Horizontal bar/waterfall of feature contributions |
| `Furnace3D` / `Mold3D` / `Ladle3D` | Respective twin pages, Landing Page (Furnace3D only), PINN page | React Three Fiber models |

## 13. Build Order Recommendation

1. Scaffold the folder structure above; set up routing, Tailwind/shadcn, and the API/WebSocket service layers.
2. Build `common/Layout`, `Navbar`, `Footer` and wire up routing between all pages listed in §3.
3. Build the Landing Page (static content, no API dependency) to validate design tokens early.
4. Build one Twin page fully (e.g. Melting) including 3D model, live chart, data panel, and alert log — then replicate for Molding, Pouring, Quality.
5. Build the Dashboard page, consuming `/api/dashboard/summary`.
6. Build Final Analytics (alert table + SHAP panel + defect prediction list).
7. Build the Agent hub page, then RAG page and PINN page.
8. Add Notifications and User Profile.
9. Wire the WebSocket connection globally (via a provider/hook) so any page can subscribe to live twin/alert updates.
