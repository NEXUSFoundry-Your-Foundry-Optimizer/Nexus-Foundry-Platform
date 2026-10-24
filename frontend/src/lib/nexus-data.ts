/** Presentation metadata and shared types for the live NEXUS-Foundry twins. */

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
  /** Chart series draw straight from the twin state; `field` is the state key
   *  and `unit` is the engineering unit shown on the Y axis, tooltip and legend. */
  series: { key: string; field: string; label: string; unit: string; color: string; percent?: boolean; fallback?: number }[];
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
      { key: "anomaly_score", label: "Anomaly Score", unit: "" },
      { key: "operating_state", label: "State", unit: "" },
    ],
    series: [
      { key: "temp", field: "melt_temp", label: "Melt temperature", unit: "°C", color: "var(--color-chart-1)", fallback: 1380 },
      { key: "power", field: "power_kw", label: "Power draw", unit: "kW", color: "var(--color-chart-2)", fallback: 800 },
      { key: "vibration", field: "vibration_g", label: "Vibration", unit: "g", color: "var(--color-chart-3)", fallback: 0.03 },
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
      { key: "permeability", label: "Permeability", unit: "norm" },
      { key: "green_strength", label: "Green Strength", unit: "kPa" },
      { key: "compactability", label: "Compactability", unit: "%" },
    ],
    series: [
      { key: "temp", field: "sand_moisture", label: "Sand moisture", unit: "%", color: "var(--color-chart-1)", fallback: 4.2 },
      { key: "power", field: "permeability", label: "Permeability", unit: "norm", color: "var(--color-chart-2)", fallback: 0.88 },
      { key: "vibration", field: "green_strength", label: "Green strength", unit: "kPa", color: "var(--color-chart-3)", fallback: 96 },
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
      { key: "pre_pour_risk", label: "Defect Risk", unit: "%" },
    ],
    series: [
      { key: "temp", field: "pour_temp", label: "Pour temperature", unit: "°C", color: "var(--color-chart-1)", fallback: 1445 },
      { key: "power", field: "ladle_fill_pct", label: "Ladle fill", unit: "%", color: "var(--color-chart-2)", fallback: 85 },
      { key: "vibration", field: "pour_speed", label: "Pour speed", unit: "m/s", color: "var(--color-chart-3)", fallback: 0.6 },
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
      { key: "defect_risk", label: "Defect Risk", unit: "%" },
      { key: "quality_score", label: "Quality Score", unit: "%" },
      { key: "inspection_result", label: "Result", unit: "" },
    ],
    series: [
      { key: "temp", field: "defect_risk", label: "Defect risk", unit: "%", color: "var(--color-chart-1)", percent: true, fallback: 0.02 },
      { key: "power", field: "quality_score", label: "Quality score", unit: "%", color: "var(--color-chart-2)", percent: true, fallback: 0.98 },
      { key: "vibration", field: "severity", label: "Severity", unit: "", color: "var(--color-chart-3)", fallback: 0 },
    ],
  },
};

export const TWIN_ORDER: TwinId[] = ["melting", "molding", "pouring", "quality"];

export interface AlertRow {
  id: string;
  twin: TwinId;
  batch: string;
  severity: Severity;
  time: string;
  message: string;
}

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
