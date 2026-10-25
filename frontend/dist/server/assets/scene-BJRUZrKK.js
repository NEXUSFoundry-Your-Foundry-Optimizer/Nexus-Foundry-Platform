import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
const DARK_BG = "#0d0e11";
const WARM_RIM = "#ff8a3d";
const STEEL = { color: "#42474f", metalness: 0.82, roughness: 0.34 };
const STEEL_DARK = { color: "#2b2e33", metalness: 0.78, roughness: 0.42 };
const YOKE = { color: "#33383f", metalness: 0.6, roughness: 0.55 };
const REFRACTORY = { color: "#8f7a5e", metalness: 0.05, roughness: 0.92 };
const SAND = { color: "#c7a26d", metalness: 0.02, roughness: 0.95 };
const COPPER = { color: "#b4622a", metalness: 0.85, roughness: 0.3 };
const PAINT = { color: "#255a4d", metalness: 0.35, roughness: 0.5 };
const HEAT_STOPS = [
  new THREE.Color("#5c0e01"),
  new THREE.Color("#e03a00"),
  new THREE.Color("#ff8f00"),
  new THREE.Color("#ffd75e")
];
function heatColor(n, target) {
  const t = THREE.MathUtils.clamp(n, 0, 1) * (HEAT_STOPS.length - 1);
  const i = Math.min(HEAT_STOPS.length - 2, Math.floor(t));
  const from = HEAT_STOPS[i] ?? HEAT_STOPS[0];
  const to = HEAT_STOPS[i + 1] ?? from;
  return target.copy(from).lerp(to, t - i);
}
function num(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function str(value, fallback) {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}
const clamp01 = (v) => THREE.MathUtils.clamp(v, 0, 1);
function deriveTelemetry(live) {
  if (!live) return {};
  const flag = live["anomaly_flag"];
  return {
    tempC: num(live["melt_temp"], 1380),
    powerKw: num(live["power_kw"], 800),
    vibrationG: num(live["vibration_g"], 0.03),
    liningHealth: num(live["lining_health"], 0.85),
    operatingState: str(live["operating_state"], "Melting"),
    anomaly: num(live["anomaly_score"], 0) > 0.78 || flag === true || flag === "True" || flag === "true",
    pourSpeed: num(live["pour_speed"], 0.6),
    ladleFillPct: num(live["ladle_fill_pct"], 85),
    sandMoisture: num(live["sand_moisture"], 4.2),
    permeability: num(live["permeability"], 118),
    compactability: num(live["compactability"], 44),
    greenStrength: num(live["green_strength"], 96),
    defectRisk: num(live["defect_risk"] ?? live["defect_probability"], 0.02),
    inspectionResult: str(live["inspection_result"], "PASS")
  };
}
function BoltRing({ radius, y, count = 8 }) {
  return /* @__PURE__ */ jsx(Fragment, { children: Array.from({ length: count }, (_, i) => {
    const a = i / count * Math.PI * 2;
    return /* @__PURE__ */ jsxs("mesh", { position: [Math.sin(a) * radius, y, Math.cos(a) * radius], rotation: [-Math.PI / 2, 0, 0], children: [
      /* @__PURE__ */ jsx("cylinderGeometry", { args: [0.05, 0.05, 0.05, 6] }),
      /* @__PURE__ */ jsx("meshStandardMaterial", { ...STEEL_DARK })
    ] }, i);
  }) });
}
function Plinth({ radius, color = "#191b1f" }) {
  return /* @__PURE__ */ jsxs("group", { children: [
    /* @__PURE__ */ jsxs("mesh", { position: [0, -1.64, 0], receiveShadow: true, children: [
      /* @__PURE__ */ jsx("cylinderGeometry", { args: [radius, radius + 0.08, 0.16, 48] }),
      /* @__PURE__ */ jsx("meshStandardMaterial", { color, metalness: 0.2, roughness: 0.8 })
    ] }),
    /* @__PURE__ */ jsx(BoltRing, { radius: radius - 0.22, y: -1.53 })
  ] });
}
function Furnace({
  tempC = 1380,
  powerKw = 800,
  vibrationG = 0.03,
  liningHealth = 0.85,
  operatingState = "Melting",
  anomaly = false
}) {
  const bathRef = useRef(null);
  const bathLightRef = useRef(null);
  const coilRef = useRef(null);
  const steamRef = useRef(null);
  const bubbleRef = useRef(null);
  const beaconRef = useRef(null);
  const shellRef = useRef(null);
  const gap = 1.9;
  const shellStart = gap / 2;
  const shellLength = Math.PI * 2 - gap;
  const liningStart = gap / 2 - 0.06;
  const liningLength = Math.PI * 2 - gap + 0.12;
  const yokeRing = Array.from({ length: 6 }, (_, i) => shellStart + shellLength * i / 5);
  const meltPhases = ["Melting", "Melt", "Superheat", "Hold", "Charging"];
  const meltActive = meltPhases.some((p) => operatingState.toLowerCase().includes(p.toLowerCase()));
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const tempN = clamp01((tempC - 1150) / 500);
    const powerN = clamp01(powerKw / 1800);
    if (bathRef.current) {
      const mat = bathRef.current.material;
      mat.emissive.copy(heatColor(tempN, mat.emissive));
      const flicker = meltActive ? 0.86 + 0.08 * Math.sin(t * 9.5) + 0.05 * Math.sin(t * 23.3) : 0.35;
      mat.emissiveIntensity = 0.4 + 2.6 * (0.35 * powerN + 0.65 * tempN) * flicker;
      bathRef.current.scale.y = 1 + 0.12 * Math.sin(t * 5.2);
    }
    if (bathLightRef.current) {
      bathLightRef.current.intensity = meltActive ? 5 + 9 * powerN * tempN : 1.2;
    }
    if (bubbleRef.current) {
      bubbleRef.current.visible = meltActive && powerN > 0.05;
      bubbleRef.current.children.forEach((bubble, i) => {
        const rise = (t * 0.5 + i / bubbleRef.current.children.length) % 1;
        bubble.position.y = 0.62 + rise * 0.09;
        bubble.position.x = Math.sin(t * 3 + i * 2.7) * 0.35;
        bubble.position.z = Math.cos(t * 2.4 + i * 1.9) * 0.35;
        bubble.scale.setScalar(0.6 + Math.sin(t * 8 + i) * 0.2);
      });
    }
    if (coilRef.current) {
      coilRef.current.children.forEach((child, i) => {
        const mat = child.material;
        const phase = Math.sin(t * 7 - i * 0.55);
        mat.emissiveIntensity = 0.12 + 2.2 * powerN * (0.6 + 0.4 * phase);
      });
    }
    if (steamRef.current) {
      steamRef.current.children.forEach((puff, i) => {
        const count = steamRef.current.children.length;
        const rise = (t * 0.3 + i / count) % 1;
        puff.position.y = rise * 2;
        const p = puff.material;
        p.opacity = steamOpacity(rise, powerN);
        const s = 0.3 + rise * 0.9;
        puff.scale.set(s, s, s);
        puff.position.x = Math.sin(t * 1.2 + i * 2.4) * 0.1;
      });
    }
    if (shellRef.current) {
      shellRef.current.position.x = Math.sin(t * 41) * 0.012 * clamp01(vibrationG / 0.5);
    }
    if (beaconRef.current) {
      const mat = beaconRef.current.material;
      if (anomaly) {
        mat.color.set("#ff2020");
        mat.emissive.set("#ff2020");
        mat.emissiveIntensity = 2.2 + Math.sin(t * 6) * 1.8;
      } else {
        mat.color.set("#37d67a");
        mat.emissive.set("#37d67a");
        mat.emissiveIntensity = 1.1;
      }
    }
  });
  const liningWorn = clamp01(1 - liningHealth);
  return /* @__PURE__ */ jsxs("group", { children: [
    /* @__PURE__ */ jsx(Plinth, { radius: 1.85 }),
    /* @__PURE__ */ jsxs("group", { ref: shellRef, children: [
      /* @__PURE__ */ jsxs("mesh", { children: [
        /* @__PURE__ */ jsx("cylinderGeometry", { args: [1.32, 1.32, 2.5, 64, 1, true, shellStart, shellLength] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { ...STEEL, side: THREE.DoubleSide })
      ] }),
      /* @__PURE__ */ jsxs("mesh", { position: [0, -1.18, 0], rotation: [Math.PI / 2, 0, 0], children: [
        /* @__PURE__ */ jsx("torusGeometry", { args: [1.35, 0.07, 12, 64] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { ...STEEL_DARK })
      ] }),
      /* @__PURE__ */ jsxs("mesh", { position: [0, 1.18, 0], rotation: [Math.PI / 2, 0, 0], children: [
        /* @__PURE__ */ jsx("torusGeometry", { args: [1.35, 0.07, 12, 64] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { ...STEEL_DARK })
      ] }),
      /* @__PURE__ */ jsxs("mesh", { children: [
        /* @__PURE__ */ jsx("cylinderGeometry", { args: [1.16, 1.16, 2.44, 48, 1, true, liningStart, liningLength] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { ...REFRACTORY, side: THREE.DoubleSide })
      ] }),
      /* @__PURE__ */ jsxs("mesh", { position: [0, 0.42, 0], children: [
        /* @__PURE__ */ jsx("cylinderGeometry", { args: [1.171, 1.171, 0.3, 48, 1, true, liningStart, liningLength] }),
        /* @__PURE__ */ jsx(
          "meshStandardMaterial",
          {
            color: liningWorn > 0.35 ? "#5c3a22" : "#7d6448",
            roughness: 0.85 + liningWorn * 0.1,
            side: THREE.DoubleSide
          }
        )
      ] }),
      /* @__PURE__ */ jsx("group", { ref: coilRef, children: Array.from({ length: 9 }, (_, i) => /* @__PURE__ */ jsxs("mesh", { position: [0, -1.05 + i * 0.26, 0], rotation: [Math.PI / 2, 0, 0], children: [
        /* @__PURE__ */ jsx("torusGeometry", { args: [1.2, 0.048, 10, 56] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { ...COPPER, emissive: "#ff5a1a", emissiveIntensity: 0.3 })
      ] }, i)) }),
      yokeRing.map((a, i) => /* @__PURE__ */ jsxs("mesh", { position: [Math.sin(a) * 1.44, 0, Math.cos(a) * 1.44], rotation: [0, -a, 0], children: [
        /* @__PURE__ */ jsx("boxGeometry", { args: [0.12, 2.46, 0.26] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { ...YOKE })
      ] }, i)),
      /* @__PURE__ */ jsxs("mesh", { position: [0, -1.32, 0], rotation: [Math.PI / 2, 0, 0], children: [
        /* @__PURE__ */ jsx("torusGeometry", { args: [1.45, 0.05, 10, 64] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { ...YOKE })
      ] }),
      /* @__PURE__ */ jsxs("mesh", { position: [0, 1.32, 0], rotation: [Math.PI / 2, 0, 0], children: [
        /* @__PURE__ */ jsx("torusGeometry", { args: [1.45, 0.05, 10, 64] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { ...YOKE })
      ] }),
      /* @__PURE__ */ jsxs("mesh", { ref: bathRef, position: [0, 0.68, 0], children: [
        /* @__PURE__ */ jsx("cylinderGeometry", { args: [1.02, 1.02, 0.06, 48] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#1a0c04", emissive: "#e03a00", emissiveIntensity: 2.2, roughness: 0.4 })
      ] }),
      /* @__PURE__ */ jsx("group", { ref: bubbleRef, children: Array.from({ length: 5 }, (_, i) => /* @__PURE__ */ jsxs("mesh", { position: [0, 0.65, 0], children: [
        /* @__PURE__ */ jsx("sphereGeometry", { args: [0.05, 10, 10] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#ffb060", emissive: "#ff8a30", emissiveIntensity: 2, transparent: true, opacity: 0.8 })
      ] }, i)) }),
      /* @__PURE__ */ jsxs("mesh", { position: [0, -1.18, 0], rotation: [-Math.PI / 2, 0, 0], children: [
        /* @__PURE__ */ jsx("circleGeometry", { args: [1.1, 48] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#120d08", roughness: 1, side: THREE.DoubleSide })
      ] }),
      /* @__PURE__ */ jsxs("mesh", { position: [0, 1.28, 0], rotation: [Math.PI / 2, 0, 0], children: [
        /* @__PURE__ */ jsx("torusGeometry", { args: [1.3, 0.06, 12, 64] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { ...STEEL })
      ] }),
      /* @__PURE__ */ jsx("group", { position: [0, 1.31, -1.05], rotation: [-0.55, 0, 0], children: /* @__PURE__ */ jsxs("mesh", { position: [0, 0.05, 1.05], children: [
        /* @__PURE__ */ jsx("cylinderGeometry", { args: [1.26, 1.26, 0.1, 48] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { ...STEEL_DARK })
      ] }) }),
      [-1, 1].map((s) => /* @__PURE__ */ jsxs("mesh", { position: [s * 1.42, -0.35, 0], rotation: [0, 0, Math.PI / 2], children: [
        /* @__PURE__ */ jsx("cylinderGeometry", { args: [0.14, 0.14, 0.2, 16] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { ...STEEL_DARK })
      ] }, s)),
      /* @__PURE__ */ jsxs("group", { position: [1.35, -1.15, 0.9], rotation: [0, -0.5, -0.55], children: [
        /* @__PURE__ */ jsxs("mesh", { position: [0, -0.8, 0], children: [
          /* @__PURE__ */ jsx("cylinderGeometry", { args: [0.13, 0.13, 1.6, 16] }),
          /* @__PURE__ */ jsx("meshStandardMaterial", { ...PAINT })
        ] }),
        /* @__PURE__ */ jsxs("mesh", { position: [0, 0.15, 0], children: [
          /* @__PURE__ */ jsx("cylinderGeometry", { args: [0.07, 0.07, 0.9, 16] }),
          /* @__PURE__ */ jsx("meshStandardMaterial", { ...STEEL })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("mesh", { position: [-1.25, -1.35, 0.55], rotation: [0, 0, 0.35], children: [
        /* @__PURE__ */ jsx("cylinderGeometry", { args: [0.05, 0.05, 0.85, 10] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#46707f", metalness: 0.7, roughness: 0.3 })
      ] }),
      /* @__PURE__ */ jsxs("mesh", { position: [-1.02, -0.85, 0.62], rotation: [1.2, 0, 0], children: [
        /* @__PURE__ */ jsx("cylinderGeometry", { args: [0.05, 0.05, 0.7, 10] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#6d4a3d", metalness: 0.7, roughness: 0.3 })
      ] }),
      /* @__PURE__ */ jsxs("mesh", { position: [0, 1.66, 0], children: [
        /* @__PURE__ */ jsx("cylinderGeometry", { args: [1.55, 1.4, 0.5, 48, 1, true] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { ...STEEL_DARK, side: THREE.DoubleSide })
      ] }),
      /* @__PURE__ */ jsxs("mesh", { position: [0, 2.3, 0], children: [
        /* @__PURE__ */ jsx("cylinderGeometry", { args: [0.55, 1.35, 1.1, 32, 1, true] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { ...STEEL_DARK, side: THREE.DoubleSide })
      ] }),
      /* @__PURE__ */ jsxs("mesh", { position: [0, 3.2, 0], children: [
        /* @__PURE__ */ jsx("cylinderGeometry", { args: [0.55, 0.55, 0.9, 24] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { ...STEEL_DARK })
      ] }),
      /* @__PURE__ */ jsxs("mesh", { ref: beaconRef, position: [0.62, 3.82, 0], children: [
        /* @__PURE__ */ jsx("sphereGeometry", { args: [0.12, 16, 16] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#37d67a", emissive: "#37d67a", emissiveIntensity: 1.1 })
      ] }),
      /* @__PURE__ */ jsx("group", { ref: steamRef, position: [0, 3.8, 0], children: Array.from({ length: 6 }, (_, i) => /* @__PURE__ */ jsxs("mesh", { children: [
        /* @__PURE__ */ jsx("sphereGeometry", { args: [0.22, 10, 10] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#aab3bd", transparent: true, opacity: 0.13, depthWrite: false })
      ] }, i)) }),
      /* @__PURE__ */ jsxs("group", { position: [-2.5, -1.05, 0.6], children: [
        /* @__PURE__ */ jsxs("mesh", { position: [0, -0.55, 0], children: [
          /* @__PURE__ */ jsx("boxGeometry", { args: [0.12, 0.9, 0.12] }),
          /* @__PURE__ */ jsx("meshStandardMaterial", { ...STEEL_DARK })
        ] }),
        /* @__PURE__ */ jsxs("mesh", { children: [
          /* @__PURE__ */ jsx("boxGeometry", { args: [0.75, 1.05, 0.4] }),
          /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#3a4046", metalness: 0.5, roughness: 0.45 })
        ] }),
        /* @__PURE__ */ jsxs("mesh", { position: [0.2, 0.28, 0.21], children: [
          /* @__PURE__ */ jsx("boxGeometry", { args: [0.3, 0.22, 0.02] }),
          /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#0d1a12", emissive: "#2bd97a", emissiveIntensity: 0.8 })
        ] }),
        /* @__PURE__ */ jsxs("mesh", { position: [-0.18, -0.3, 0.21], children: [
          /* @__PURE__ */ jsx("circleGeometry", { args: [0.075, 16] }),
          /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#151a1e", metalness: 0.4, roughness: 0.3 })
        ] })
      ] }),
      /* @__PURE__ */ jsx("pointLight", { ref: bathLightRef, position: [0, 1.35, 0], color: "#ff7a1a", distance: 7, decay: 2, intensity: 8 })
    ] })
  ] });
}
function steamOpacity(rise, powerN) {
  return (1 - rise) * 0.16 * powerN;
}
function LadleScene({ pourSpeed = 0.6, ladleFillPct = 85, tempC = 1420 }) {
  const tiltRef = useRef(null);
  const metalRef = useRef(null);
  const streamRef = useRef(null);
  const streamLightRef = useRef(null);
  const sparkRef = useRef(null);
  const moldGlowRef = useRef(null);
  const flowN = useRef(0);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const streaming = clamp01((pourSpeed - 0.28) / 0.7) * clamp01((ladleFillPct - 5) / 30);
    flowN.current += (streaming - flowN.current) * 0.06;
    const fill = clamp01(ladleFillPct / 100);
    if (metalRef.current) {
      metalRef.current.position.y = -0.62 + fill * 1.05;
      const mat = metalRef.current.material;
      mat.emissive.copy(heatColor(clamp01((tempC - 1150) / 500), mat.emissive));
      mat.emissiveIntensity = 2.4 + 0.5 * Math.sin(t * 6.1);
    }
    if (tiltRef.current) {
      tiltRef.current.rotation.z = THREE.MathUtils.lerp(tiltRef.current.rotation.z, -0.08 - 0.5 * flowN.current, 0.05);
      tiltRef.current.rotation.x = Math.sin(t * 0.9) * 0.012;
    }
    if (streamRef.current) {
      const visible = flowN.current > 0.04 && fill > 0.03;
      streamRef.current.visible = visible;
      if (visible) {
        const tipY = 0.52;
        const moldY = -1.28;
        const h = tipY - moldY;
        streamRef.current.scale.set(0.6 + 0.35 * flowN.current, h / 2.2, 1);
        streamRef.current.position.set(0.02, moldY + h / 2, 1.28);
        const mat = streamRef.current.material;
        mat.emissive.copy(heatColor(clamp01((tempC - 1150) / 500), mat.emissive));
        mat.emissiveIntensity = (2.6 + Math.sin(t * 21) * 0.5) * (0.5 + flowN.current);
      }
      if (streamLightRef.current) {
        streamLightRef.current.intensity = visible ? 6 * flowN.current + 2 : 0;
      }
    }
    if (sparkRef.current) {
      sparkRef.current.visible = flowN.current > 0.05;
      sparkRef.current.children.forEach((sp, i) => {
        const prog = t * (1.1 + i * 0.13) % 1;
        sp.position.set(
          0.02 + Math.sin(t * 27 + i * 5) * 0.09,
          0.5 - prog * 1.7,
          1.28 + Math.sin(t * 19 + i * 3) * 0.07
        );
        const s = 0.03 + 0.02 * Math.sin(t * 40 + i);
        sp.scale.set(s, 2.2 * s, s);
      });
    }
    if (moldGlowRef.current) {
      const mat = moldGlowRef.current.material;
      mat.emissive.copy(heatColor(clamp01((tempC - 1150) / 500) * 0.9, mat.emissive));
      mat.emissiveIntensity = 0.15 + 2.4 * flowN.current * (0.85 + 0.15 * Math.sin(t * 13));
    }
  });
  return /* @__PURE__ */ jsxs("group", { children: [
    /* @__PURE__ */ jsxs("group", { position: [0, -1.28, 1.35], children: [
      /* @__PURE__ */ jsxs("mesh", { position: [0, -0.16, 0], children: [
        /* @__PURE__ */ jsx("boxGeometry", { args: [1.55, 0.32, 1.1] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { ...SAND })
      ] }),
      [-1, 1].map((s) => /* @__PURE__ */ jsxs("mesh", { position: [s * 0.82, 0.02, 0], children: [
        /* @__PURE__ */ jsx("boxGeometry", { args: [0.12, 0.5, 1.22] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { ...STEEL_DARK })
      ] }, `x${s}`)),
      [-1, 1].map((s) => /* @__PURE__ */ jsxs("mesh", { position: [0, 0.02, s * 0.66], children: [
        /* @__PURE__ */ jsx("boxGeometry", { args: [1.78, 0.5, 0.12] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { ...STEEL_DARK })
      ] }, `z${s}`)),
      /* @__PURE__ */ jsxs("mesh", { ref: moldGlowRef, position: [0, 0.28, 0], rotation: [-Math.PI / 2, 0, 0], children: [
        /* @__PURE__ */ jsx("planeGeometry", { args: [1.4, 0.95] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#170a02", emissive: "#e03a00", emissiveIntensity: 0.2 })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("mesh", { position: [0, -1.64, 0.6], receiveShadow: true, children: [
      /* @__PURE__ */ jsx("boxGeometry", { args: [4.6, 0.14, 3.4] }),
      /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#1b1d21", metalness: 0.2, roughness: 0.85 })
    ] }),
    [-1.5, 1.5].map((x) => /* @__PURE__ */ jsxs("mesh", { position: [x, -0.62, 0], rotation: [0, 0, -x * 0.06], children: [
      /* @__PURE__ */ jsx("boxGeometry", { args: [0.16, 2.1, 0.3] }),
      /* @__PURE__ */ jsx("meshStandardMaterial", { ...PAINT })
    ] }, x)),
    /* @__PURE__ */ jsxs("mesh", { position: [0, 0.44, 0], rotation: [0, 0, Math.PI / 2], children: [
      /* @__PURE__ */ jsx("cylinderGeometry", { args: [0.09, 0.09, 3.05, 20] }),
      /* @__PURE__ */ jsx("meshStandardMaterial", { ...STEEL })
    ] }),
    /* @__PURE__ */ jsxs("group", { ref: tiltRef, position: [0, 0.44, 0], children: [
      /* @__PURE__ */ jsxs("group", { position: [0, -0.72, 0], children: [
        /* @__PURE__ */ jsxs("mesh", { children: [
          /* @__PURE__ */ jsx("cylinderGeometry", { args: [0.92, 0.68, 1.5, 40, 1, true] }),
          /* @__PURE__ */ jsx("meshStandardMaterial", { ...STEEL, side: THREE.DoubleSide })
        ] }),
        /* @__PURE__ */ jsxs("mesh", { position: [0, -0.75, 0], children: [
          /* @__PURE__ */ jsx("cylinderGeometry", { args: [0.68, 0.62, 0.12, 40] }),
          /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#3a3226", roughness: 0.9 })
        ] }),
        /* @__PURE__ */ jsxs("mesh", { position: [0, -0.4, 0], children: [
          /* @__PURE__ */ jsx("cylinderGeometry", { args: [0.94, 0.9, 0.2, 40, 1, true] }),
          /* @__PURE__ */ jsx("meshStandardMaterial", { ...REFRACTORY, side: THREE.DoubleSide })
        ] }),
        /* @__PURE__ */ jsxs("mesh", { position: [0, 0.62, 0.92], rotation: [1.15, 0, 0], children: [
          /* @__PURE__ */ jsx("coneGeometry", { args: [0.24, 0.5, 16, 1, true] }),
          /* @__PURE__ */ jsx("meshStandardMaterial", { ...STEEL, side: THREE.DoubleSide })
        ] }),
        /* @__PURE__ */ jsxs("mesh", { ref: metalRef, position: [0, -0.1, 0], children: [
          /* @__PURE__ */ jsx("cylinderGeometry", { args: [0.82, 0.62, 0.1, 40] }),
          /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#1a0c04", emissive: "#e8700a", emissiveIntensity: 2.4, roughness: 0.5 })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("mesh", { position: [-0.9, -0.15, 0], rotation: [0, 0, 0.5], children: [
        /* @__PURE__ */ jsx("cylinderGeometry", { args: [0.05, 0.05, 0.75, 10] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { ...COPPER })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("mesh", { ref: streamRef, visible: false, children: [
      /* @__PURE__ */ jsx("cylinderGeometry", { args: [0.06, 0.045, 2.2, 12] }),
      /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#3a1504", emissive: "#ff6a00", emissiveIntensity: 3, roughness: 0.35 })
    ] }),
    /* @__PURE__ */ jsx("group", { ref: sparkRef, visible: false, children: Array.from({ length: 4 }, (_, i) => /* @__PURE__ */ jsxs("mesh", { children: [
      /* @__PURE__ */ jsx("sphereGeometry", { args: [1, 8, 8] }),
      /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#ffcf7a", emissive: "#ffb43a", emissiveIntensity: 3 })
    ] }, i)) }),
    /* @__PURE__ */ jsx("pointLight", { ref: streamLightRef, position: [0.02, -0.7, 1.3], color: "#ff8a2a", distance: 5, intensity: 3 })
  ] });
}
function MoldScene({ sandMoisture = 4.2, permeability = 118, compactability = 44 }) {
  const copeRef = useRef(null);
  const plateRef = useRef(null);
  const steamRef = useRef(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (copeRef.current) {
      copeRef.current.position.y = 0.42 + Math.sin(t * 0.7) * 0.04;
      copeRef.current.rotation.z = 0.06 * Math.sin(t * 0.5);
    }
    if (plateRef.current) {
      plateRef.current.position.y = 0.78 - 0.14 * clamp01(compactability / 60) * (0.6 + 0.4 * Math.sin(t * 0.9));
    }
    if (steamRef.current) {
      const ventN = clamp01(permeability) * clamp01(sandMoisture / 6);
      steamRef.current.children.forEach((puff, i) => {
        const count = steamRef.current.children.length;
        const rise = (t * 0.22 + i / count) % 1;
        puff.position.y = 0.62 + rise * 1.1;
        puff.position.x = Math.sin(t * 1.4 + i * 2.1) * 0.35;
        const p = puff.material;
        p.opacity = (1 - rise) * 0.13 * ventN;
        const s = 0.16 + rise * 0.55;
        puff.scale.set(s, s, s);
      });
    }
  });
  return /* @__PURE__ */ jsxs("group", { children: [
    /* @__PURE__ */ jsx(Plinth, { radius: 2.2, color: "#17191d" }),
    /* @__PURE__ */ jsxs("group", { position: [-1.9, 0.15, 0.9], children: [
      /* @__PURE__ */ jsxs("mesh", { position: [0, -0.75, 0], children: [
        /* @__PURE__ */ jsx("boxGeometry", { args: [0.12, 1.4, 0.12] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { ...STEEL_DARK })
      ] }),
      /* @__PURE__ */ jsxs("mesh", { children: [
        /* @__PURE__ */ jsx("boxGeometry", { args: [0.85, 0.6, 0.45] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#3f4750", metalness: 0.5, roughness: 0.4 })
      ] }),
      /* @__PURE__ */ jsxs("mesh", { position: [0.2, 0.16, 0.23], children: [
        /* @__PURE__ */ jsx("boxGeometry", { args: [0.4, 0.2, 0.02] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#10230f", emissive: "#5ad07a", emissiveIntensity: 0.9 })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("group", { position: [0, -0.85, 0], children: [
      /* @__PURE__ */ jsxs("mesh", { position: [0, 0.02, -1.34], children: [
        /* @__PURE__ */ jsx("boxGeometry", { args: [2.62, 0.58, 0.1] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#33393f", metalness: 0.6, roughness: 0.45 })
      ] }),
      /* @__PURE__ */ jsxs("mesh", { position: [0, 0.02, 1.34], children: [
        /* @__PURE__ */ jsx("boxGeometry", { args: [2.62, 0.58, 0.1] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#33393f", metalness: 0.6, roughness: 0.45 })
      ] }),
      [-1.31, 1.31].map((x) => /* @__PURE__ */ jsxs("mesh", { position: [x, 0.02, 0], children: [
        /* @__PURE__ */ jsx("boxGeometry", { args: [0.1, 0.58, 2.78] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#33393f", metalness: 0.6, roughness: 0.45 })
      ] }, x)),
      /* @__PURE__ */ jsxs("mesh", { position: [0, -0.16, 0.72], children: [
        /* @__PURE__ */ jsx("boxGeometry", { args: [2.3, 0.5, 1.35] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#bc9a5f", roughness: 0.96 - 0.18 * clamp01(sandMoisture / 6), metalness: 0.02 })
      ] }),
      /* @__PURE__ */ jsxs("mesh", { position: [0, -0.33, 0], children: [
        /* @__PURE__ */ jsx("boxGeometry", { args: [2.4, 0.24, 2.55] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#b39052", roughness: 0.97 })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("group", { ref: copeRef, position: [0, 0.42, 0], children: [
      [-1.31, 1.31].map((x) => /* @__PURE__ */ jsxs("mesh", { position: [x, 0.02, 0], children: [
        /* @__PURE__ */ jsx("boxGeometry", { args: [0.1, 0.58, 2.78] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#33393f", metalness: 0.6, roughness: 0.45 })
      ] }, x)),
      [0, 1].map((i) => /* @__PURE__ */ jsxs("mesh", { position: [0, 0.02, i === 0 ? -1.34 : 1.34], children: [
        /* @__PURE__ */ jsx("boxGeometry", { args: [2.62, 0.58, 0.1] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#33393f", metalness: 0.6, roughness: 0.45 })
      ] }, i)),
      /* @__PURE__ */ jsxs("mesh", { position: [0, -0.3, 0], children: [
        /* @__PURE__ */ jsx("boxGeometry", { args: [2.4, 0.22, 2.55] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#bf9a58", roughness: 0.95 })
      ] }),
      /* @__PURE__ */ jsxs("mesh", { position: [-0.55, 0.32, 0.5], children: [
        /* @__PURE__ */ jsx("cylinderGeometry", { args: [0.075, 0.11, 0.4, 16] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#8a744f", roughness: 0.85 })
      ] }),
      /* @__PURE__ */ jsxs("mesh", { position: [0.5, 0.3, -0.4], children: [
        /* @__PURE__ */ jsx("cylinderGeometry", { args: [0.11, 0.13, 0.38, 16] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#8a744f", roughness: 0.85 })
      ] }),
      [0.9, -0.9].map((x) => /* @__PURE__ */ jsxs("mesh", { position: [x, -0.1, x], children: [
        /* @__PURE__ */ jsx("cylinderGeometry", { args: [0.018, 0.018, 0.5, 8] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#2c2f33", metalness: 0.6 })
      ] }, x))
    ] }),
    /* @__PURE__ */ jsxs("group", { children: [
      /* @__PURE__ */ jsxs("mesh", { ref: plateRef, position: [0, 0.78, 0], children: [
        /* @__PURE__ */ jsx("cylinderGeometry", { args: [0.7, 0.7, 0.22, 24] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#8a4a1c", metalness: 0.3, roughness: 0.6 })
      ] }),
      /* @__PURE__ */ jsxs("mesh", { position: [0, 1.5, 0], children: [
        /* @__PURE__ */ jsx("cylinderGeometry", { args: [0.09, 0.12, 1.3, 12] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { ...STEEL })
      ] })
    ] }),
    /* @__PURE__ */ jsx("group", { ref: steamRef, children: Array.from({ length: 5 }, (_, i) => /* @__PURE__ */ jsxs("mesh", { position: [0, 0.62, 0], children: [
      /* @__PURE__ */ jsx("sphereGeometry", { args: [0.2, 10, 10] }),
      /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#cfd6dc", transparent: true, opacity: 0.1, depthWrite: false })
    ] }, i)) })
  ] });
}
function InspectionScene({ defectRisk = 0.02, inspectionResult = "PASS" }) {
  const rollerRef = useRef(null);
  const partRef = useRef(null);
  const scannerRef = useRef(null);
  const coneRef = useRef(null);
  const lampRef = useRef(null);
  const riskN = clamp01(defectRisk);
  const rejected = inspectionResult !== "" && (inspectionResult.startsWith("NR") || inspectionResult.toUpperCase() === "FAIL") || riskN > 0.5;
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (rollerRef.current) {
      rollerRef.current.children.forEach((roller) => {
        roller.rotation.z += 0.05;
      });
    }
    if (partRef.current) {
      const loop = t * 0.9 % 4.2;
      partRef.current.position.x = THREE.MathUtils.clamp(loop - 2.1, -1.35, 1.35);
    }
    if (scannerRef.current && partRef.current) {
      const x = partRef.current.position.x;
      const tracking = Math.abs(x) < 1.2;
      scannerRef.current.position.x = THREE.MathUtils.lerp(scannerRef.current.position.x, tracking ? x : 0, 0.1);
      if (coneRef.current) {
        coneRef.current.material = coneRef.current.material;
        const mat = coneRef.current.material;
        mat.opacity = (tracking ? 0.1 : 0.03) + 0.03 * Math.sin(t * 14);
      }
    }
    if (lampRef.current) {
      const mat = lampRef.current.material;
      const color = riskN > 0.5 ? "#ff3030" : riskN > 0.2 ? "#ffb020" : "#37d67a";
      const pulse = rejected ? Math.abs(Math.sin(t * 5)) : 1;
      mat.color.set(color);
      mat.emissive.set(color);
      mat.emissiveIntensity = 1.4 * pulse + (riskN > 0.5 ? 1.2 : 0.3);
    }
  });
  return /* @__PURE__ */ jsxs("group", { children: [
    /* @__PURE__ */ jsx(Plinth, { radius: 2.1, color: "#16181c" }),
    /* @__PURE__ */ jsxs("group", { position: [0, -0.9, 0], children: [
      /* @__PURE__ */ jsxs("mesh", { children: [
        /* @__PURE__ */ jsx("boxGeometry", { args: [3.4, 0.09, 1.35] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#2c3037", metalness: 0.6, roughness: 0.5 })
      ] }),
      [-1.55, 1.55].map((x) => /* @__PURE__ */ jsxs("mesh", { position: [x, 0, 0], rotation: [Math.PI / 2, 0, 0], children: [
        /* @__PURE__ */ jsx("cylinderGeometry", { args: [0.16, 0.16, 1.35, 18] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { ...STEEL })
      ] }, x)),
      /* @__PURE__ */ jsx("group", { ref: rollerRef, position: [0, 0.01, 0], children: [-1.1, -0.4, 0.4, 1.1].map((x) => /* @__PURE__ */ jsxs("mesh", { position: [x, 0, 0], rotation: [Math.PI / 2, 0, 0], children: [
        /* @__PURE__ */ jsx("cylinderGeometry", { args: [0.06, 0.06, 1.35, 12] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#484f57", metalness: 0.75, roughness: 0.35 })
      ] }, x)) }),
      [-1, 1].map(
        (z) => [-1.5, 0, 1.5].map((x) => /* @__PURE__ */ jsxs("mesh", { position: [x, -0.42, z * 0.62], children: [
          /* @__PURE__ */ jsx("boxGeometry", { args: [0.09, 0.8, 0.09] }),
          /* @__PURE__ */ jsx("meshStandardMaterial", { ...STEEL_DARK })
        ] }, `${z}-${x}`))
      )
    ] }),
    /* @__PURE__ */ jsxs("mesh", { ref: partRef, position: [0, -0.66, 0], children: [
      /* @__PURE__ */ jsx("cylinderGeometry", { args: [0.42, 0.42, 0.24, 28] }),
      /* @__PURE__ */ jsx("meshStandardMaterial", { color: rejected ? "#7a3b28" : "#8d949c", metalness: 0.75, roughness: rejected ? 0.75 : 0.35 })
    ] }),
    /* @__PURE__ */ jsxs("group", { position: [0, 0.6, 0], children: [
      [-1.5, 1.5].map((x) => /* @__PURE__ */ jsxs("mesh", { position: [x, -0.2, 0], children: [
        /* @__PURE__ */ jsx("boxGeometry", { args: [0.14, 2.4, 0.14] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { ...PAINT })
      ] }, x)),
      /* @__PURE__ */ jsxs("mesh", { children: [
        /* @__PURE__ */ jsx("boxGeometry", { args: [3.2, 0.3, 0.5] }),
        /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#3d454e", metalness: 0.5, roughness: 0.45 })
      ] }),
      /* @__PURE__ */ jsxs("group", { ref: scannerRef, children: [
        /* @__PURE__ */ jsxs("mesh", { position: [0, -0.5, 0], children: [
          /* @__PURE__ */ jsx("cylinderGeometry", { args: [0.22, 0.26, 0.5, 20] }),
          /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#22262b", metalness: 0.7, roughness: 0.3 })
        ] }),
        /* @__PURE__ */ jsxs("mesh", { position: [0, -0.78, 0], children: [
          /* @__PURE__ */ jsx("cylinderGeometry", { args: [0.14, 0.09, 0.14, 20] }),
          /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#0a0c0e", metalness: 0.9, roughness: 0.15, emissive: "#20323d", emissiveIntensity: 0.7 })
        ] }),
        /* @__PURE__ */ jsxs("mesh", { ref: coneRef, position: [0, -1.1, 0], children: [
          /* @__PURE__ */ jsx("coneGeometry", { args: [0.85, 0.7, 24, 1, true] }),
          /* @__PURE__ */ jsx("meshBasicMaterial", { color: "#39d0ff", transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false })
        ] }),
        /* @__PURE__ */ jsxs("mesh", { position: [0, -1.26, 0], rotation: [-Math.PI / 2, 0, 0], children: [
          /* @__PURE__ */ jsx("ringGeometry", { args: [0.52, 0.58, 40] }),
          /* @__PURE__ */ jsx("meshBasicMaterial", { color: "#39d0ff", transparent: true, opacity: 0.55, side: THREE.DoubleSide })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("group", { position: [1.25, 0.3, 0.35], children: [
        /* @__PURE__ */ jsxs("mesh", { position: [0, -0.28, 0], children: [
          /* @__PURE__ */ jsx("cylinderGeometry", { args: [0.03, 0.03, 0.8, 8] }),
          /* @__PURE__ */ jsx("meshStandardMaterial", { ...STEEL_DARK })
        ] }),
        /* @__PURE__ */ jsxs("mesh", { ref: lampRef, position: [0, 0.16, 0], children: [
          /* @__PURE__ */ jsx("cylinderGeometry", { args: [0.085, 0.085, 0.22, 16] }),
          /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#37d67a", emissive: "#37d67a", emissiveIntensity: 1.2 })
        ] }),
        /* @__PURE__ */ jsxs("mesh", { position: [0, 0.38, 0], children: [
          /* @__PURE__ */ jsx("cylinderGeometry", { args: [0.085, 0.085, 0.06, 16] }),
          /* @__PURE__ */ jsx("meshStandardMaterial", { color: "#22262b" })
        ] })
      ] })
    ] })
  ] });
}
function Scene({
  variant = "furnace",
  interactive = true,
  live = null
}) {
  const telemetry = useMemo(() => deriveTelemetry(live), [live]);
  return /* @__PURE__ */ jsxs(Canvas, { camera: { position: [4.4, 2.6, 4.8], fov: 40 }, dpr: [1, 1.8], children: [
    /* @__PURE__ */ jsx("color", { attach: "background", args: [DARK_BG] }),
    /* @__PURE__ */ jsx("fog", { attach: "fog", args: [DARK_BG, 10, 20] }),
    /* @__PURE__ */ jsx("ambientLight", { intensity: 0.5 }),
    /* @__PURE__ */ jsx("directionalLight", { position: [5, 7, 3], intensity: 1, color: "#ffffff" }),
    /* @__PURE__ */ jsx("directionalLight", { position: [-6, 3, -4], intensity: 0.45, color: WARM_RIM }),
    variant === "furnace" && /* @__PURE__ */ jsx(Furnace, { ...telemetry }),
    variant === "mold" && /* @__PURE__ */ jsx(MoldScene, { ...telemetry }),
    variant === "ladle" && /* @__PURE__ */ jsx(LadleScene, { ...telemetry }),
    variant === "inspection" && /* @__PURE__ */ jsx(InspectionScene, { ...telemetry }),
    /* @__PURE__ */ jsx(ContactShadows, { position: [0, -1.73, 0], opacity: 0.55, scale: 11, blur: 2.4, far: 5 }),
    /* @__PURE__ */ jsx("gridHelper", { args: [20, 20, "#20242c", "#191c21"], position: [0, -1.72, 0] }),
    /* @__PURE__ */ jsx(
      OrbitControls,
      {
        enablePan: false,
        enableZoom: false,
        enabled: interactive,
        autoRotate: true,
        autoRotateSpeed: 0.7,
        minPolarAngle: Math.PI / 3.6,
        maxPolarAngle: Math.PI / 2.05
      }
    )
  ] });
}
export {
  Scene as default
};
