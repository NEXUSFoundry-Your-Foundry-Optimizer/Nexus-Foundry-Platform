/**
 * Mock data layer for NEXUS-Foundry.
 * Mirrors the API contract in 02_WORKFLOW_AND_REQUIREMENTS.md so the real
 * FastAPI backend can be swapped in behind the same shapes.
 */

export type Severity = "critical" | "warning" | "normal";
export type TwinId = "melting" | "molding" | "pouring" | "quality";

export interface TwinMeta {
  id: TwinId;
  name: string;
  icon: string;
  blurb: string;
  comingSoon?: boolean;
  metricLabel: string;
  fields: { key: string; label: string; unit: string }[];
  series: { key: string; label: string; color: string }[];
}

export const TWINS: Record<TwinId, TwinMeta> = {
  melting: {
    id: "melting",
    name: "Melting Twin",
    icon: "flame",
    blurb: "Induction furnace state, lining health and LSTM-AE anomaly scoring.",
    metricLabel: "Melt temperature",
    fields: [
      { key: "melt_temp", label: "Melt Temp", unit: "°C" },
      { key: "power_kw", label: "Power", unit: "kW" },
      { key: "vibration_g", label: "Vibration", unit: "g" },
      { key: "lining_health", label: "Lining Health", unit: "" },
      { key: "operating_state", label: "State", unit: "" },
    ],
    series: [
      { key: "temp", label: "Temperature (°C)", color: "var(--color-chart-1)" },
      { key: "power", label: "Power (kW)", color: "var(--color-chart-2)" },
      { key: "vibration", label: "Vibration (g×10⁴)", color: "var(--color-chart-3)" },
    ],
  },
  molding: {
    id: "molding",
    name: "Molding Twin",
    icon: "layers",
    blurb: "Green sand chemistry — moisture, permeability and compactability.",
    metricLabel: "Sand moisture",
    fields: [
      { key: "sand_moisture", label: "Sand Moisture", unit: "%" },
      { key: "permeability", label: "Permeability", unit: "AFS" },
      { key: "green_strength", label: "Green Strength", unit: "kPa" },
      { key: "compactability", label: "Compactability", unit: "%" },
    ],
    series: [
      { key: "temp", label: "Moisture (%×100)", color: "var(--color-chart-1)" },
      { key: "power", label: "Permeability (AFS)", color: "var(--color-chart-2)" },
      { key: "vibration", label: "Green Strength (kPa×10)", color: "var(--color-chart-3)" },
    ],
  },
  pouring: {
    id: "pouring",
    name: "Pouring Twin",
    icon: "droplets",
    blurb: "Ladle transfer, pour kinetics and upstream risk inherited from melt.",
    metricLabel: "Upstream risk",
    fields: [
      { key: "pour_temp", label: "Pour Temp", unit: "°C" },
      { key: "pour_speed", label: "Pour Speed", unit: "m/s" },
      { key: "ladle_fill_pct", label: "Ladle Fill", unit: "%" },
      { key: "upstream_risk", label: "Upstream Risk", unit: "%" },
    ],
    series: [
      { key: "temp", label: "Pour Temp (°C)", color: "var(--color-chart-1)" },
      { key: "power", label: "Fill Level (%)", color: "var(--color-chart-2)" },
      { key: "vibration", label: "Pour Speed (m/s×100)", color: "var(--color-chart-3)" },
    ],
  },
  quality: {
    id: "quality",
    name: "Quality Twin",
    icon: "scan",
    blurb: "ResNet-50 visual inspection and defect classification.",
    comingSoon: true,
    metricLabel: "Defect probability",
    fields: [
      { key: "defect_present", label: "Defect Present", unit: "" },
      { key: "defect_type", label: "Defect Type", unit: "" },
      { key: "severity", label: "Severity", unit: "" },
    ],
    series: [
      { key: "temp", label: "Defect Probability (%)", color: "var(--color-chart-1)" },
      { key: "power", label: "Inspection Confidence (%)", color: "var(--color-chart-2)" },
      { key: "vibration", label: "Surface Score", color: "var(--color-chart-3)" },
    ],
  },
};

export const TWIN_ORDER: TwinId[] = ["melting", "molding", "pouring", "quality"];

export interface SensorPoint {
  t: string;
  temp: number;
  power: number;
  vibration: number;
}

const BASELINE: Record<TwinId, [number, number, number]> = {
  melting: [1479, 1023, 620],
  molding: [420, 118, 96],
  pouring: [1391, 91, 74],
  quality: [29, 94, 61],
};

function wobble(base: number, amp: number, i: number, phase: number) {
  return +(base + Math.sin(i / 3 + phase) * amp + Math.cos(i / 7) * amp * 0.4).toFixed(2);
}

export function buildSeries(twin: TwinId, points = 40, offset = 0): SensorPoint[] {
  const [a, b, c] = BASELINE[twin];
  const now = Date.now();
  return Array.from({ length: points }, (_, i) => {
    const k = i + offset;
    const d = new Date(now - (points - i) * 2000);
    return {
      t: d.toLocaleTimeString("en-GB", { hour12: false }).slice(3),
      temp: wobble(a, a * 0.012, k, 0),
      power: wobble(b, b * 0.03, k, 1.4),
      vibration: wobble(c, c * 0.06, k, 2.7),
    };
  });
}

export interface TwinState {
  status: Severity;
  batch: string;
  values: { label: string; value: string; unit: string }[];
}

export const TWIN_STATE: Record<TwinId, TwinState> = {
  melting: {
    status: "critical",
    batch: "AL-CB-001",
    values: [
      { label: "Melt Temp", value: "1479", unit: "°C" },
      { label: "Power", value: "1023", unit: "kW" },
      { label: "Vibration", value: "0.062", unit: "g" },
      { label: "Lining Health", value: "0.61", unit: "" },
      { label: "Anomaly Score", value: "2.18", unit: "×" },
      { label: "State", value: "Holding", unit: "" },
    ],
  },
  molding: {
    status: "normal",
    batch: "AL-CB-002",
    values: [
      { label: "Sand Moisture", value: "4.2", unit: "%" },
      { label: "Permeability", value: "118", unit: "AFS" },
      { label: "Green Strength", value: "96", unit: "kPa" },
      { label: "Compactability", value: "44", unit: "%" },
      { label: "Mold Count", value: "312", unit: "" },
      { label: "State", value: "Running", unit: "" },
    ],
  },
  pouring: {
    status: "critical",
    batch: "AL-CB-001",
    values: [
      { label: "Pour Temp", value: "1391", unit: "°C" },
      { label: "Pour Speed", value: "0.74", unit: "m/s" },
      { label: "Ladle Fill", value: "91", unit: "%" },
      { label: "Upstream Risk", value: "91", unit: "%" },
      { label: "Time To Pour", value: "6.2", unit: "h" },
      { label: "State", value: "Pre-pour", unit: "" },
    ],
  },
  quality: {
    status: "warning",
    batch: "AL-CB-001",
    values: [
      { label: "Defect Probability", value: "0.29", unit: "" },
      { label: "Defect Type", value: "Gas Porosity", unit: "" },
      { label: "Severity", value: "Moderate", unit: "" },
      { label: "Inspected Today", value: "148", unit: "" },
      { label: "Model", value: "ResNet-50", unit: "" },
      { label: "State", value: "Integrating", unit: "" },
    ],
  },
};

export interface AlertRow {
  id: string;
  twin: TwinId;
  batch: string;
  severity: Severity;
  time: string;
  message: string;
}

export const ALERTS: AlertRow[] = [
  {
    id: "a1",
    twin: "melting",
    batch: "CB-001",
    severity: "critical",
    time: "14:48:02",
    message: "LSTM-AE anomaly detected — reconstruction error 2.18× threshold (0.78)",
  },
  {
    id: "a2",
    twin: "pouring",
    batch: "CB-001",
    severity: "critical",
    time: "14:48:04",
    message: "Cross-stage warning received from Melting Twin — defect risk 91%",
  },
  {
    id: "a3",
    twin: "melting",
    batch: "CB-001",
    severity: "warning",
    time: "14:15:00",
    message: "Melt temperature rising above holding band (+21°C in 20 min)",
  },
  {
    id: "a4",
    twin: "molding",
    batch: "CB-002",
    severity: "warning",
    time: "09:15:41",
    message: "Sand moisture drifting high — 4.6% against 4.0% target",
  },
  {
    id: "a5",
    twin: "quality",
    batch: "CB-000",
    severity: "normal",
    time: "07:02:11",
    message: "Batch cleared inspection — no defects classified",
  },
];

export interface Batch {
  id: string;
  start: string;
  status: Severity;
  predicted: number;
  actual: string;
  alloy: string;
}

export const BATCHES: Batch[] = [
  { id: "CB-998", start: "04:10", status: "normal", predicted: 0.06, actual: "Clean", alloy: "AL-Si12" },
  { id: "CB-999", start: "06:25", status: "normal", predicted: 0.11, actual: "Clean", alloy: "AL-Si12" },
  { id: "CB-000", start: "07:02", status: "warning", predicted: 0.34, actual: "Clean", alloy: "GG-25" },
  { id: "CB-001", start: "09:40", status: "critical", predicted: 0.91, actual: "Pending", alloy: "AL-Si12" },
  { id: "CB-002", start: "11:15", status: "warning", predicted: 0.29, actual: "Pending", alloy: "GG-25" },
  { id: "CB-003", start: "13:30", status: "normal", predicted: 0.08, actual: "Pending", alloy: "AL-Si7" },
];

export const SHAP = {
  prediction: "Gas Porosity",
  probability: 0.29,
  recommendation: "Reduce ambient humidity or increase mold venting before the CB-001 pour.",
  features: [
    { name: "Humidity (58%)", value: 0.16 },
    { name: "Sand Moisture (4.6%)", value: 0.12 },
    { name: "Visual Pattern Score", value: 0.1 },
    { name: "Lining Health (0.61)", value: 0.07 },
    { name: "Pour Temp (1391°C)", value: 0.03 },
    { name: "Pour Speed (0.74 m/s)", value: -0.04 },
    { name: "Permeability (118 AFS)", value: -0.06 },
  ],
};

export const FORECAST = Array.from({ length: 24 }, (_, i) => {
  const p50 = 0.61 - i * 0.012 + Math.sin(i / 4) * 0.01;
  return {
    h: `+${i * 2}h`,
    p10: +(p50 - 0.03 - i * 0.004).toFixed(3),
    p50: +p50.toFixed(3),
    p90: +(p50 + 0.03 + i * 0.004).toFixed(3),
  };
});

export const HEALTH_HISTORY = Array.from({ length: 30 }, (_, i) => ({
  d: `D-${30 - i}`,
  health: +(0.94 - i * 0.011 + Math.sin(i / 5) * 0.012).toFixed(3),
  defectRate: +(2 + Math.sin(i / 3) * 1.2 + i * 0.06).toFixed(2),
  temp: +(1462 + Math.sin(i / 2) * 9).toFixed(1),
}));

export const severityLabel: Record<Severity, string> = {
  critical: "Critical",
  warning: "Warning",
  normal: "Normal",
};

export const RAG_SOURCES = [
  { doc: "Furnace 3 Maintenance Manual", loc: "p. 4-3", relevance: 0.94 },
  { doc: "Incident Report — Sept 2025", loc: "§2 Lining erosion", relevance: 0.89 },
  { doc: "SOP v2.3 Melting Operations", loc: "p. 7", relevance: 0.83 },
];

export function ragAnswer(question: string): string {
  const q = question.toLowerCase();
  if (q.includes("lining"))
    return "Furnace 3 lining health is at 0.61 and dropping ~0.011/day. The LSTM-AE flagged a reconstruction error of 2.18× the 0.78 threshold at 14:48:02, driven by a vibration signature consistent with refractory spalling near the coil mid-section. The TFT 48-hour forecast puts P50 lining health at 0.32 with a P10 of 0.19, meaning a lining change should be scheduled inside the next two shifts.";
  if (q.includes("defect") || q.includes("porosity"))
    return "Batch CB-001 carries a 91% pre-pour defect risk, classified most likely as gas porosity. SHAP attributes +16% to ambient humidity, +12% to sand moisture and +10% to the visual pattern score. Reducing humidity or increasing mold venting is the highest-leverage intervention available before pour.";
  if (q.includes("pour"))
    return "Pouring Twin currently reads 1391°C at 0.74 m/s with a 91% ladle fill. The PINN what-if run shows that lowering pour speed to 0.68 m/s drops the modelled defect risk from 91% to 34% while keeping the cooling rate physically valid at 1.83°C/min.";
  return "Based on live twin state and the retrieved documents: Furnace 3 is in a critical anomaly state for batch CB-001, the Pouring Twin has inherited a 91% upstream risk, and the recommended action is to run a what-if simulation at a 1400°C setpoint before committing the pour.";
}
