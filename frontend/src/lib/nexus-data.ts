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
      { key: "anomaly_score", label: "Anomaly Score", unit: "" },
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
      { key: "pre_pour_risk", label: "Defect Risk", unit: "%" },
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
