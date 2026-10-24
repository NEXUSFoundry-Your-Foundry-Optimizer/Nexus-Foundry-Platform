import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Group, Mesh } from "three";

/**
 * Physically-informed 3D telemetry models for the four NEXUS-Foundry twins.
 *
 * Geometry follows real coreless induction furnace anatomy (steel rolled shell,
 * rammed silica refractory lining, water-cooled copper induction coil, silicon
 * steel magnetic yokes, hydraulic tilt cylinder, cooling circuit, exhaust hood —
 * ref. Ajax TOCCO / Atlas Foundry) and the pouring physics v ≈ Cd·√(2gh) for the
 * ladle stream. Every model is driven by live digital-twin state so the visual
 * behaves like the physical asset, not a looping animation.
 */

export type SceneVariant = "furnace" | "mold" | "ladle" | "inspection";

export interface SceneTelemetry {
  tempC?: number;
  powerKw?: number;
  vibrationG?: number;
  liningHealth?: number;
  operatingState?: string;
  anomaly?: boolean;
  pourSpeed?: number;
  ladleFillPct?: number;
  sandMoisture?: number;
  permeability?: number;
  compactability?: number;
  greenStrength?: number;
  defectRisk?: number;
  inspectionResult?: string;
}

const DARK_BG = "#0d0e11";
const WARM_RIM = "#ff8a3d";

// ---- materials -------------------------------------------------------------
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
  new THREE.Color("#ffd75e"),
];

/** Map a normalized temperature (0 dull red .. 1 near-white) to a molten color. */
function heatColor(n: number, target: THREE.Color): THREE.Color {
  const t = THREE.MathUtils.clamp(n, 0, 1) * (HEAT_STOPS.length - 1);
  const i = Math.min(HEAT_STOPS.length - 2, Math.floor(t));
  const from = HEAT_STOPS[i] ?? HEAT_STOPS[0]!;
  const to = HEAT_STOPS[i + 1] ?? from;
  return target.copy(from).lerp(to, t - i);
}

function num(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function str(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

const clamp01 = (v: number) => THREE.MathUtils.clamp(v, 0, 1);

/** Map a raw live twin payload into the telemetry each model consumes. */
function deriveTelemetry(live?: Record<string, unknown> | null): SceneTelemetry {
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
    inspectionResult: str(live["inspection_result"], "PASS"),
  };
}

// ---- shared small parts ----------------------------------------------------
function BoltRing({ radius, y, count = 8 }: { radius: number; y: number; count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.sin(a) * radius, y, Math.cos(a) * radius]} rotation={[-Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.05, 6]} />
            <meshStandardMaterial {...STEEL_DARK} />
          </mesh>
        );
      })}
    </>
  );
}

function Plinth({ radius, color = "#191b1f" }: { radius: number; color?: string }) {
  return (
    <group>
      <mesh position={[0, -1.64, 0]} receiveShadow>
        <cylinderGeometry args={[radius, radius + 0.08, 0.16, 48]} />
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.8} />
      </mesh>
      <BoltRing radius={radius - 0.22} y={-1.53} />
    </group>
  );
}

// ---- Melting: coreless induction furnace (cutaway) --------------------------
function Furnace({
  tempC = 1380,
  powerKw = 800,
  vibrationG = 0.03,
  liningHealth = 0.85,
  operatingState = "Melting",
  anomaly = false,
}: SceneTelemetry) {
  const bathRef = useRef<Mesh>(null);
  const bathLightRef = useRef<THREE.PointLight>(null);
  const coilRef = useRef<Group>(null);
  const steamRef = useRef<Group>(null);
  const bubbleRef = useRef<Group>(null);
  const beaconRef = useRef<Mesh>(null);
  const shellRef = useRef<Group>(null);

  // Cutaway gap centred on +Z so the internals face the default camera.
  const gap = 1.9;
  const shellStart = gap / 2;
  const shellLength = Math.PI * 2 - gap;
  const liningStart = gap / 2 - 0.06;
  const liningLength = Math.PI * 2 - gap + 0.12;

  // Yokes sit only on the closed (non-cutaway) side of the shell.
  const yokeRing = Array.from({ length: 6 }, (_, i) => shellStart + (shellLength * i) / 5);

  const meltPhases = ["Melting", "Melt", "Superheat", "Hold", "Charging"];
  const meltActive = meltPhases.some((p) => operatingState.toLowerCase().includes(p.toLowerCase()));

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const tempN = clamp01((tempC - 1150) / 500); // 1150 °C dull red → 1650 °C yellow-white
    const powerN = clamp01(powerKw / 1800); // installed supplies run ~250 kW/t class

    // Molten surface: emissive intensity flickers; hue follows temperature.
    if (bathRef.current) {
      const mat = bathRef.current.material as THREE.MeshStandardMaterial;
      mat.emissive.copy(heatColor(tempN, mat.emissive));
      const flicker = meltActive ? 0.86 + 0.08 * Math.sin(t * 9.5) + 0.05 * Math.sin(t * 23.3) : 0.35;
      mat.emissiveIntensity = 0.4 + 2.6 * (0.35 * powerN + 0.65 * tempN) * flicker;
      bathRef.current.scale.y = 1 + 0.12 * Math.sin(t * 5.2);
    }
    if (bathLightRef.current) {
      bathLightRef.current.intensity = meltActive ? 5 + 9 * powerN * tempN : 1.2;
    }
    // Induced-current bubbles stirring the bath (EM stirring in the melt).
    if (bubbleRef.current) {
      bubbleRef.current.visible = meltActive && powerN > 0.05;
      bubbleRef.current.children.forEach((bubble, i) => {
        const rise = (t * 0.5 + i / bubbleRef.current!.children.length) % 1;
        bubble.position.y = 0.62 + rise * 0.09;
        bubble.position.x = Math.sin(t * 3 + i * 2.7) * 0.35;
        bubble.position.z = Math.cos(t * 2.4 + i * 1.9) * 0.35;
        bubble.scale.setScalar(0.6 + Math.sin(t * 8 + i) * 0.2);
      });
    }
    // Coil energisation pulses with the mid-frequency power supply.
    if (coilRef.current) {
      coilRef.current.children.forEach((child, i) => {
        const mat = (child as Mesh).material as THREE.MeshStandardMaterial;
        const phase = Math.sin(t * 7 - i * 0.55);
        mat.emissiveIntensity = 0.12 + 2.2 * powerN * (0.6 + 0.4 * phase);
      });
    }
    // Cooling-tower steam above the exhaust duct scales with heat rejection.
    if (steamRef.current) {
      steamRef.current.children.forEach((puff, i) => {
        const count = steamRef.current!.children.length;
        const rise = (t * 0.3 + i / count) % 1;
        puff.position.y = rise * 2;
        const p = (puff as Mesh).material as THREE.MeshStandardMaterial;
        p.opacity = steamOpacity(rise, powerN);
        const s = 0.3 + rise * 0.9;
        puff.scale.set(s, s, s);
        puff.position.x = Math.sin(t * 1.2 + i * 2.4) * 0.1;
      });
    }
    // Physical shell tremor scaled by the live vibration channel (g).
    if (shellRef.current) {
      shellRef.current.position.x = Math.sin(t * 41) * 0.012 * clamp01(vibrationG / 0.5);
    }
    if (beaconRef.current) {
      const mat = beaconRef.current.material as THREE.MeshStandardMaterial;
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

  return (
    <group>
      <Plinth radius={1.85} />

      <group ref={shellRef}>
        {/* Rolled steel shell with cutaway */}
        <mesh>
          <cylinderGeometry args={[1.32, 1.32, 2.5, 64, 1, true, shellStart, shellLength]} />
          <meshStandardMaterial {...STEEL} side={THREE.DoubleSide} />
        </mesh>
        {/* Stiffening bands */}
        <mesh position={[0, -1.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.35, 0.07, 12, 64]} />
          <meshStandardMaterial {...STEEL_DARK} />
        </mesh>
        <mesh position={[0, 1.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.35, 0.07, 12, 64]} />
          <meshStandardMaterial {...STEEL_DARK} />
        </mesh>

        {/* Rammed silica refractory Crucible lining */}
        <mesh>
          <cylinderGeometry args={[1.16, 1.16, 2.44, 48, 1, true, liningStart, liningLength]} />
          <meshStandardMaterial {...REFRACTORY} side={THREE.DoubleSide} />
        </mesh>
        {/* High-wear slag interfaceline band — the classic erosion hotspot */}
        <mesh position={[0, 0.42, 0]}>
          <cylinderGeometry args={[1.171, 1.171, 0.3, 48, 1, true, liningStart, liningLength]} />
          <meshStandardMaterial
            color={liningWorn > 0.35 ? "#5c3a22" : "#7d6448"}
            roughness={0.85 + liningWorn * 0.1}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Water-cooled copper Induction power Coil */}
        <group ref={coilRef}>
          {Array.from({ length: 9 }, (_, i) => (
            <mesh key={i} position={[0, -1.05 + i * 0.26, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[1.2, 0.048, 10, 56]} />
              <meshStandardMaterial {...COPPER} emissive="#ff5a1a" emissiveIntensity={0.3} />
            </mesh>
          ))}
        </group>

        {/* Silicon steel magnetic yokes — flux return path on the closed side */}
        {yokeRing.map((a, i) => (
          <mesh key={i} position={[Math.sin(a) * 1.44, 0, Math.cos(a) * 1.44]} rotation={[0, -a, 0]}>
            <boxGeometry args={[0.12, 2.46, 0.26]} />
            <meshStandardMaterial {...YOKE} />
          </mesh>
        ))}
        {/* Faraday flux plates top and bottom */}
        <mesh position={[0, -1.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.45, 0.05, 10, 64]} />
          <meshStandardMaterial {...YOKE} />
        </mesh>
        <mesh position={[0, 1.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.45, 0.05, 10, 64]} />
          <meshStandardMaterial {...YOKE} />
        </mesh>

        {/* Molten bath surface near the top of the crucible */}
        <mesh ref={bathRef} position={[0, 0.68, 0]}>
          <cylinderGeometry args={[1.02, 1.02, 0.06, 48]} />
          <meshStandardMaterial color="#1a0c04" emissive="#e03a00" emissiveIntensity={2.2} roughness={0.4} />
        </mesh>
        {/* stirred melt bubbles */}
        <group ref={bubbleRef}>
          {Array.from({ length: 5 }, (_, i) => (
            <mesh key={i} position={[0, 0.65, 0]}>
              <sphereGeometry args={[0.05, 10, 10]} />
              <meshStandardMaterial color="#ffb060" emissive="#ff8a30" emissiveIntensity={2} transparent opacity={0.8} />
            </mesh>
          ))}
        </group>
        {/* Crucible floor */}
        <mesh position={[0, -1.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.1, 48]} />
          <meshStandardMaterial color="#120d08" roughness={1} side={THREE.DoubleSide} />
        </mesh>

        {/* Top flange + ajar hinged cover */}
        <mesh position={[0, 1.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.3, 0.06, 12, 64]} />
          <meshStandardMaterial {...STEEL} />
        </mesh>
        <group position={[0, 1.31, -1.05]} rotation={[-0.55, 0, 0]}>
          <mesh position={[0, 0.05, 1.05]}>
            <cylinderGeometry args={[1.26, 1.26, 0.1, 48]} />
            <meshStandardMaterial {...STEEL_DARK} />
          </mesh>
        </group>

        {/* Hydraulic tilt: trunnion pads + cylinder */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 1.42, -0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.14, 0.14, 0.2, 16]} />
            <meshStandardMaterial {...STEEL_DARK} />
          </mesh>
        ))}
        <group position={[1.35, -1.15, 0.9]} rotation={[0, -0.5, -0.55]}>
          <mesh position={[0, -0.8, 0]}>
            <cylinderGeometry args={[0.13, 0.13, 1.6, 16]} />
            <meshStandardMaterial {...PAINT} />
          </mesh>
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.9, 16]} />
            <meshStandardMaterial {...STEEL} />
          </mesh>
        </group>

        {/* Cooling circuit (water enters / returns at the coil jacket) */}
        <mesh position={[-1.25, -1.35, 0.55]} rotation={[0, 0, 0.35]}>
          <cylinderGeometry args={[0.05, 0.05, 0.85, 10]} />
          <meshStandardMaterial color="#46707f" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[-1.02, -0.85, 0.62]} rotation={[1.2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.7, 10]} />
          <meshStandardMaterial color="#6d4a3d" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Exhaust hood + duct over the open mouth */}
        <mesh position={[0, 1.66, 0]}>
          <cylinderGeometry args={[1.55, 1.4, 0.5, 48, 1, true]} />
          <meshStandardMaterial {...STEEL_DARK} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 2.3, 0]}>
          <cylinderGeometry args={[0.55, 1.35, 1.1, 32, 1, true]} />
          <meshStandardMaterial {...STEEL_DARK} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 3.2, 0]}>
          <cylinderGeometry args={[0.55, 0.55, 0.9, 24]} />
          <meshStandardMaterial {...STEEL_DARK} />
        </mesh>

        {/* Condition beacon atop the duct */}
        <mesh ref={beaconRef} position={[0.62, 3.82, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#37d67a" emissive="#37d67a" emissiveIntensity={1.1} />
        </mesh>

        {/* Cooling-tower steam plume */}
        <group ref={steamRef} position={[0, 3.8, 0]}>
          {Array.from({ length: 6 }, (_, i) => (
            <mesh key={i}>
              <sphereGeometry args={[0.22, 10, 10]} />
              <meshStandardMaterial color="#aab3bd" transparent opacity={0.13} depthWrite={false} />
            </mesh>
          ))}
        </group>

        {/* Local control cabinet */}
        <group position={[-2.5, -1.05, 0.6]}>
          <mesh position={[0, -0.55, 0]}>
            <boxGeometry args={[0.12, 0.9, 0.12]} />
            <meshStandardMaterial {...STEEL_DARK} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.75, 1.05, 0.4]} />
            <meshStandardMaterial color="#3a4046" metalness={0.5} roughness={0.45} />
          </mesh>
          <mesh position={[0.2, 0.28, 0.21]}>
            <boxGeometry args={[0.3, 0.22, 0.02]} />
            <meshStandardMaterial color="#0d1a12" emissive="#2bd97a" emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[-0.18, -0.3, 0.21]}>
            <circleGeometry args={[0.075, 16]} />
            <meshStandardMaterial color="#151a1e" metalness={0.4} roughness={0.3} />
          </mesh>
        </group>

        <pointLight ref={bathLightRef} position={[0, 1.35, 0]} color="#ff7a1a" distance={7} decay={2} intensity={8} />
      </group>
    </group>
  );
}

function steamOpacity(rise: number, powerN: number): number {
  return (1 - rise) * 0.16 * powerN;
}

// ---- Pouring: trunnion ladle pouring into a mold ---------------------------
function LadleScene({ pourSpeed = 0.6, ladleFillPct = 85, tempC = 1420 }: SceneTelemetry) {
  const tiltRef = useRef<Group>(null);
  const metalRef = useRef<Mesh>(null);
  const streamRef = useRef<Mesh>(null);
  const streamLightRef = useRef<THREE.PointLight>(null);
  const sparkRef = useRef<Group>(null);
  const moldGlowRef = useRef<Mesh>(null);
  const flowN = useRef(0);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const streaming = clamp01((pourSpeed - 0.28) / 0.7) * clamp01((ladleFillPct - 5) / 30);
    flowN.current += (streaming - flowN.current) * 0.06;

    const fill = clamp01(ladleFillPct / 100);
    // Metal surface inside the ladle rises with fill level.
    if (metalRef.current) {
      metalRef.current.position.y = -0.62 + fill * 1.05;
      const mat = metalRef.current.material as THREE.MeshStandardMaterial;
      mat.emissive.copy(heatColor(clamp01((tempC - 1150) / 500), mat.emissive));
      mat.emissiveIntensity = 2.4 + 0.5 * Math.sin(t * 6.1);
    }
    // Ladle tips over the lip while the pour nozzle is open.
    if (tiltRef.current) {
      tiltRef.current.rotation.z = THREE.MathUtils.lerp(tiltRef.current.rotation.z, -0.08 - 0.5 * flowN.current, 0.05);
      tiltRef.current.rotation.x = Math.sin(t * 0.9) * 0.012;
    }
    // Free-span stream from lip to mold (v ≈ Cd·√(2gh), ṁ = ρ·A·v).
    if (streamRef.current) {
      const visible = flowN.current > 0.04 && fill > 0.03;
      streamRef.current.visible = visible;
      if (visible) {
        const tipY = 0.52;
        const moldY = -1.28;
        const h = tipY - moldY;
        streamRef.current.scale.set(0.6 + 0.35 * flowN.current, h / 2.2, 1);
        streamRef.current.position.set(0.02, moldY + h / 2, 1.28);
        const mat = streamRef.current.material as THREE.MeshStandardMaterial;
        mat.emissive.copy(heatColor(clamp01((tempC - 1150) / 500), mat.emissive));
        mat.emissiveIntensity = (2.6 + Math.sin(t * 21) * 0.5) * (0.5 + flowN.current);
      }
      if (streamLightRef.current) {
        streamLightRef.current.intensity = visible ? 6 * flowN.current + 2 : 0;
      }
    }
    // Flying sparks along the stream.
    if (sparkRef.current) {
      sparkRef.current.visible = flowN.current > 0.05;
      sparkRef.current.children.forEach((sp, i) => {
        const prog = (t * (1.1 + i * 0.13)) % 1;
        sp.position.set(
          0.02 + Math.sin(t * 27 + i * 5) * 0.09,
          0.5 - prog * 1.7,
          1.28 + Math.sin(t * 19 + i * 3) * 0.07,
        );
        const s = 0.03 + 0.02 * Math.sin(t * 40 + i);
        sp.scale.set(s, 2.2 * s, s);
      });
    }
    // Cavity brightness: metal transferred out of the ladle into the mold.
    if (moldGlowRef.current) {
      const mat = moldGlowRef.current.material as THREE.MeshStandardMaterial;
      mat.emissive.copy(heatColor(clamp01((tempC - 1150) / 500) * 0.9, mat.emissive));
      mat.emissiveIntensity = 0.15 + 2.4 * flowN.current * (0.85 + 0.15 * Math.sin(t * 13));
    }
  });

  return (
    <group>
      {/* Mold receiving metal */}
      <group position={[0, -1.28, 1.35]}>
        <mesh position={[0, -0.16, 0]}>
          <boxGeometry args={[1.55, 0.32, 1.1]} />
          <meshStandardMaterial {...SAND} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={`x${s}`} position={[s * 0.82, 0.02, 0]}>
            <boxGeometry args={[0.12, 0.5, 1.22]} />
            <meshStandardMaterial {...STEEL_DARK} />
          </mesh>
        ))}
        {[-1, 1].map((s) => (
          <mesh key={`z${s}`} position={[0, 0.02, s * 0.66]}>
            <boxGeometry args={[1.78, 0.5, 0.12]} />
            <meshStandardMaterial {...STEEL_DARK} />
          </mesh>
        ))}
        <mesh ref={moldGlowRef} position={[0, 0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.4, 0.95]} />
          <meshStandardMaterial color="#170a02" emissive="#e03a00" emissiveIntensity={0.2} />
        </mesh>
      </group>

      {/* Shop floor */}
      <mesh position={[0, -1.64, 0.6]} receiveShadow>
        <boxGeometry args={[4.6, 0.14, 3.4]} />
        <meshStandardMaterial color="#1b1d21" metalness={0.2} roughness={0.85} />
      </mesh>

      {/* Trunnion stand */}
      {[-1.5, 1.5].map((x) => (
        <mesh key={x} position={[x, -0.62, 0]} rotation={[0, 0, -x * 0.06]}>
          <boxGeometry args={[0.16, 2.1, 0.3]} />
          <meshStandardMaterial {...PAINT} />
        </mesh>
      ))}
      <mesh position={[0, 0.44, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.09, 0.09, 3.05, 20]} />
        <meshStandardMaterial {...STEEL} />
      </mesh>

      {/* Ladle shell pivoting on the axle */}
      <group ref={tiltRef} position={[0, 0.44, 0]}>
        <group position={[0, -0.72, 0]}>
          <mesh>
            <cylinderGeometry args={[0.92, 0.68, 1.5, 40, 1, true]} />
            <meshStandardMaterial {...STEEL} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -0.75, 0]}>
            <cylinderGeometry args={[0.68, 0.62, 0.12, 40]} />
            <meshStandardMaterial color="#3a3226" roughness={0.9} />
          </mesh>
          {/* refractory wear band inside */}
          <mesh position={[0, -0.4, 0]}>
            <cylinderGeometry args={[0.94, 0.9, 0.2, 40, 1, true]} />
            <meshStandardMaterial {...REFRACTORY} side={THREE.DoubleSide} />
          </mesh>
          {/* lip / pouring spout */}
          <mesh position={[0, 0.62, 0.92]} rotation={[1.15, 0, 0]}>
            <coneGeometry args={[0.24, 0.5, 16, 1, true]} />
            <meshStandardMaterial {...STEEL} side={THREE.DoubleSide} />
          </mesh>
          {/* molten metal inventory */}
          <mesh ref={metalRef} position={[0, -0.1, 0]}>
            <cylinderGeometry args={[0.82, 0.62, 0.1, 40]} />
            <meshStandardMaterial color="#1a0c04" emissive="#e8700a" emissiveIntensity={2.4} roughness={0.5} />
          </mesh>
        </group>
        {/* stopper rod gear on the rim */}
        <mesh position={[-0.9, -0.15, 0]} rotation={[0, 0, 0.5]}>
          <cylinderGeometry args={[0.05, 0.05, 0.75, 10]} />
          <meshStandardMaterial {...COPPER} />
        </mesh>
      </group>

      <mesh ref={streamRef} visible={false}>
        <cylinderGeometry args={[0.06, 0.045, 2.2, 12]} />
        <meshStandardMaterial color="#3a1504" emissive="#ff6a00" emissiveIntensity={3} roughness={0.35} />
      </mesh>
      <group ref={sparkRef} visible={false}>
        {Array.from({ length: 4 }, (_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshStandardMaterial color="#ffcf7a" emissive="#ffb43a" emissiveIntensity={3} />
          </mesh>
        ))}
      </group>

      <pointLight ref={streamLightRef} position={[0.02, -0.7, 1.3]} color="#ff8a2a" distance={5} intensity={3} />
    </group>
  );
}

// ---- Molding: green-sand flask on the pattern line -------------------------
function MoldScene({ sandMoisture = 4.2, permeability = 118, compactability = 44 }: SceneTelemetry) {
  const copeRef = useRef<Group>(null);
  const plateRef = useRef<Mesh>(null);
  const steamRef = useRef<Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Cope hovers while the drag cycle completes; subtle machine sway.
    if (copeRef.current) {
      copeRef.current.position.y = 0.42 + Math.sin(t * 0.7) * 0.04;
      copeRef.current.rotation.z = 0.06 * Math.sin(t * 0.5);
    }
    // Squeeze head presses into the cope sand per compactability.
    if (plateRef.current) {
      plateRef.current.position.y = 0.78 - 0.14 * clamp01(compactability / 60) * (0.6 + 0.4 * Math.sin(t * 0.9));
    }
    // Permeability drives venting steam off the green sand. The dataset ships
    // permeability as a normalized 0–1 index, matching xgboost_features.csv.
    if (steamRef.current) {
      const ventN = clamp01(permeability) * clamp01(sandMoisture / 6);
      steamRef.current.children.forEach((puff, i) => {
        const count = steamRef.current!.children.length;
        const rise = (t * 0.22 + i / count) % 1;
        puff.position.y = 0.62 + rise * 1.1;
        puff.position.x = Math.sin(t * 1.4 + i * 2.1) * 0.35;
        const p = (puff as Mesh).material as THREE.MeshStandardMaterial;
        p.opacity = (1 - rise) * 0.13 * ventN;
        const s = 0.16 + rise * 0.55;
        puff.scale.set(s, s, s);
      });
    }
  });

  return (
    <group>
      <Plinth radius={2.2} color="#17191d" />

      {/* Pattern-equipment control box */}
      <group position={[-1.9, 0.15, 0.9]}>
        <mesh position={[0, -0.75, 0]}>
          <boxGeometry args={[0.12, 1.4, 0.12]} />
          <meshStandardMaterial {...STEEL_DARK} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.85, 0.6, 0.45]} />
          <meshStandardMaterial color="#3f4750" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0.2, 0.16, 0.23]}>
          <boxGeometry args={[0.4, 0.2, 0.02]} />
          <meshStandardMaterial color="#10230f" emissive="#5ad07a" emissiveIntensity={0.9} />
        </mesh>
      </group>

      {/* Drag (lower flask) with packed green sand */}
      <group position={[0, -0.85, 0]}>
        <mesh position={[0, 0.02, -1.34]}>
          <boxGeometry args={[2.62, 0.58, 0.1]} />
          <meshStandardMaterial color="#33393f" metalness={0.6} roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.02, 1.34]}>
          <boxGeometry args={[2.62, 0.58, 0.1]} />
          <meshStandardMaterial color="#33393f" metalness={0.6} roughness={0.45} />
        </mesh>
        {[-1.31, 1.31].map((x) => (
          <mesh key={x} position={[x, 0.02, 0]}>
            <boxGeometry args={[0.1, 0.58, 2.78]} />
            <meshStandardMaterial color="#33393f" metalness={0.6} roughness={0.45} />
          </mesh>
        ))}
        {/* open pattern cavity facing the camera */}
        <mesh position={[0, -0.16, 0.72]}>
          <boxGeometry args={[2.3, 0.5, 1.35]} />
          <meshStandardMaterial color="#bc9a5f" roughness={0.96 - 0.18 * clamp01(sandMoisture / 6)} metalness={0.02} />
        </mesh>
        {/* drag sand underfill */}
        <mesh position={[0, -0.33, 0]}>
          <boxGeometry args={[2.4, 0.24, 2.55]} />
          <meshStandardMaterial color="#b39052" roughness={0.97} />
        </mesh>
      </group>

      {/* Cope (upper flask) hovering during roll-over / venting */}
      <group ref={copeRef} position={[0, 0.42, 0]}>
        {[-1.31, 1.31].map((x) => (
          <mesh key={x} position={[x, 0.02, 0]}>
            <boxGeometry args={[0.1, 0.58, 2.78]} />
            <meshStandardMaterial color="#33393f" metalness={0.6} roughness={0.45} />
          </mesh>
        ))}
        {[0, 1].map((i) => (
          <mesh key={i} position={[0, 0.02, i === 0 ? -1.34 : 1.34]}>
            <boxGeometry args={[2.62, 0.58, 0.1]} />
            <meshStandardMaterial color="#33393f" metalness={0.6} roughness={0.45} />
          </mesh>
        ))}
        {/* cope sand underside */}
        <mesh position={[0, -0.3, 0]}>
          <boxGeometry args={[2.4, 0.22, 2.55]} />
          <meshStandardMaterial color="#bf9a58" roughness={0.95} />
        </mesh>
        {/* sprue bush + riser */}
        <mesh position={[-0.55, 0.32, 0.5]}>
          <cylinderGeometry args={[0.075, 0.11, 0.4, 16]} />
          <meshStandardMaterial color="#8a744f" roughness={0.85} />
        </mesh>
        <mesh position={[0.5, 0.3, -0.4]}>
          <cylinderGeometry args={[0.11, 0.13, 0.38, 16]} />
          <meshStandardMaterial color="#8a744f" roughness={0.85} />
        </mesh>
        {/* vent rods */}
        {[0.9, -0.9].map((x) => (
          <mesh key={x} position={[x, -0.1, x]}>
            <cylinderGeometry args={[0.018, 0.018, 0.5, 8]} />
            <meshStandardMaterial color="#2c2f33" metalness={0.6} />
          </mesh>
        ))}
      </group>

      {/* squeeze head */}
      <group>
        <mesh ref={plateRef} position={[0, 0.78, 0]}>
          <cylinderGeometry args={[0.7, 0.7, 0.22, 24]} />
          <meshStandardMaterial color="#8a4a1c" metalness={0.3} roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.09, 0.12, 1.3, 12]} />
          <meshStandardMaterial {...STEEL} />
        </mesh>
      </group>

      {/* venting steam */}
      <group ref={steamRef}>
        {Array.from({ length: 5 }, (_, i) => (
          <mesh key={i} position={[0, 0.62, 0]}>
            <sphereGeometry args={[0.2, 10, 10]} />
            <meshStandardMaterial color="#cfd6dc" transparent opacity={0.1} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ---- Quality: inspection gantry over moving castings -----------------------
function InspectionScene({ defectRisk = 0.02, inspectionResult = "PASS" }: SceneTelemetry) {
  const rollerRef = useRef<Group>(null);
  const partRef = useRef<Mesh>(null);
  const scannerRef = useRef<Group>(null);
  const coneRef = useRef<Mesh>(null);
  const lampRef = useRef<Mesh>(null);

  const riskN = clamp01(defectRisk);
  const rejected =
    (inspectionResult !== "" && (inspectionResult.startsWith("NR") || inspectionResult.toUpperCase() === "FAIL")) ||
    riskN > 0.5;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Chain-driven roller travel.
    if (rollerRef.current) {
      rollerRef.current.children.forEach((roller) => {
        roller.rotation.z += 0.05;
      });
    }
    // Casting traverses the inspection window and recycles at the end of the line.
    if (partRef.current) {
      const loop = (t * 0.9) % 4.2;
      partRef.current.position.x = THREE.MathUtils.clamp(loop - 2.1, -1.35, 1.35);
    }
    if (scannerRef.current && partRef.current) {
      const x = partRef.current.position.x;
      // Gantry tracks the casting only while inside the inspection window.
      const tracking = Math.abs(x) < 1.2;
      scannerRef.current.position.x = THREE.MathUtils.lerp(scannerRef.current.position.x, tracking ? x : 0, 0.1);
      // Line-scan light sweeps over the casting.
      if (coneRef.current) {
        coneRef.current.material = coneRef.current.material as THREE.MeshBasicMaterial;
        const mat = coneRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = (tracking ? 0.1 : 0.03) + 0.03 * Math.sin(t * 14);
      }
    }
    if (lampRef.current) {
      const mat = lampRef.current.material as THREE.MeshStandardMaterial;
      const color = riskN > 0.5 ? "#ff3030" : riskN > 0.2 ? "#ffb020" : "#37d67a";
      const pulse = rejected ? Math.abs(Math.sin(t * 5)) : 1;
      mat.color.set(color);
      mat.emissive.set(color);
      mat.emissiveIntensity = 1.4 * pulse + (riskN > 0.5 ? 1.2 : 0.3);
    }
  });

  return (
    <group>
      <Plinth radius={2.1} color="#16181c" />

      {/* roller conveyor */}
      <group position={[0, -0.9, 0]}>
        <mesh>
          <boxGeometry args={[3.4, 0.09, 1.35]} />
          <meshStandardMaterial color="#2c3037" metalness={0.6} roughness={0.5} />
        </mesh>
        {[-1.55, 1.55].map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 1.35, 18]} />
            <meshStandardMaterial {...STEEL} />
          </mesh>
        ))}
        <group ref={rollerRef} position={[0, 0.01, 0]}>
          {[-1.1, -0.4, 0.4, 1.1].map((x) => (
            <mesh key={x} position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 1.35, 12]} />
              <meshStandardMaterial color="#484f57" metalness={0.75} roughness={0.35} />
            </mesh>
          ))}
        </group>
        {[-1, 1].map((z) =>
          [-1.5, 0, 1.5].map((x) => (
            <mesh key={`${z}-${x}`} position={[x, -0.42, z * 0.62]}>
              <boxGeometry args={[0.09, 0.8, 0.09]} />
              <meshStandardMaterial {...STEEL_DARK} />
            </mesh>
          )),
        )}
      </group>

      {/* casting travelling the line */}
      <mesh ref={partRef} position={[0, -0.66, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.24, 28]} />
        <meshStandardMaterial color={rejected ? "#7a3b28" : "#8d949c"} metalness={0.75} roughness={rejected ? 0.75 : 0.35} />
      </mesh>

      {/* inspection gantry */}
      <group position={[0, 0.6, 0]}>
        {[-1.5, 1.5].map((x) => (
          <mesh key={x} position={[x, -0.2, 0]}>
            <boxGeometry args={[0.14, 2.4, 0.14]} />
            <meshStandardMaterial {...PAINT} />
          </mesh>
        ))}
        <mesh>
          <boxGeometry args={[3.2, 0.3, 0.5]} />
          <meshStandardMaterial color="#3d454e" metalness={0.5} roughness={0.45} />
        </mesh>
        <group ref={scannerRef}>
          {/* camera head */}
          <mesh position={[0, -0.5, 0]}>
            <cylinderGeometry args={[0.22, 0.26, 0.5, 20]} />
            <meshStandardMaterial color="#22262b" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* lens */}
          <mesh position={[0, -0.78, 0]}>
            <cylinderGeometry args={[0.14, 0.09, 0.14, 20]} />
            <meshStandardMaterial color="#0a0c0e" metalness={0.9} roughness={0.15} emissive="#20323d" emissiveIntensity={0.7} />
          </mesh>
          {/* laser light curtain */}
          <mesh ref={coneRef} position={[0, -1.1, 0]}>
            <coneGeometry args={[0.85, 0.7, 24, 1, true]} />
            <meshBasicMaterial color="#39d0ff" transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          {/* scan ring over the casting */}
          <mesh position={[0, -1.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.52, 0.58, 40]} />
            <meshBasicMaterial color="#39d0ff" transparent opacity={0.55} side={THREE.DoubleSide} />
          </mesh>
        </group>
        {/* stack light pole */}
        <group position={[1.25, 0.3, 0.35]}>
          <mesh position={[0, -0.28, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
            <meshStandardMaterial {...STEEL_DARK} />
          </mesh>
          <mesh ref={lampRef} position={[0, 0.16, 0]}>
            <cylinderGeometry args={[0.085, 0.085, 0.22, 16]} />
            <meshStandardMaterial color="#37d67a" emissive="#37d67a" emissiveIntensity={1.2} />
          </mesh>
          <mesh position={[0, 0.38, 0]}>
            <cylinderGeometry args={[0.085, 0.085, 0.06, 16]} />
            <meshStandardMaterial color="#22262b" />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// ---- Scene root ------------------------------------------------------------
export default function Scene({
  variant = "furnace",
  interactive = true,
  live = null,
}: {
  variant?: SceneVariant;
  interactive?: boolean;
  live?: Record<string, unknown> | null;
}) {
  const telemetry = useMemo(() => deriveTelemetry(live), [live]);

  return (
    <Canvas camera={{ position: [4.4, 2.6, 4.8], fov: 40 }} dpr={[1, 1.8]}>
      <color attach="background" args={[DARK_BG]} />
      <fog attach="fog" args={[DARK_BG, 10, 20]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 7, 3]} intensity={1.0} color="#ffffff" />
      <directionalLight position={[-6, 3, -4]} intensity={0.45} color={WARM_RIM} />

      {variant === "furnace" && <Furnace {...telemetry} />}
      {variant === "mold" && <MoldScene {...telemetry} />}
      {variant === "ladle" && <LadleScene {...telemetry} />}
      {variant === "inspection" && <InspectionScene {...telemetry} />}

      <ContactShadows position={[0, -1.73, 0]} opacity={0.55} scale={11} blur={2.4} far={5} />
      <gridHelper args={[20, 20, "#20242c", "#191c21"]} position={[0, -1.72, 0]} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enabled={interactive}
        autoRotate
        autoRotateSpeed={0.7}
        minPolarAngle={Math.PI / 3.6}
        maxPolarAngle={Math.PI / 2.05}
      />
    </Canvas>
  );
}
