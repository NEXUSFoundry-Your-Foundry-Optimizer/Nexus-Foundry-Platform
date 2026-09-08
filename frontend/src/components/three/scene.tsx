import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import type { Group, Mesh } from "three";

export type SceneVariant = "furnace" | "mold" | "ladle" | "inspection";

const SIGNAL = "#ff6a00";
const HOT = "#ff5500";
const STEEL = "#222222";

function Furnace({ heat = 1 }: { heat?: number }) {
  const glow = useRef<Mesh>(null);
  useFrame((state) => {
    if (glow.current) {
      const t = state.clock.elapsedTime;
      const s = 1 + Math.sin(t * 2) * 0.04 * heat;
      glow.current.scale.set(s, 1, s);
    }
  });
  return (
    <group>
      <mesh position={[0, -1.15, 0]} receiveShadow>
        <cylinderGeometry args={[1.5, 1.7, 0.25, 48]} />
        <meshStandardMaterial color={STEEL} metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[1.15, 1.25, 2.2, 48, 1, true]} />
        <meshStandardMaterial color={STEEL} metalness={0.85} roughness={0.25} side={2} />
      </mesh>
      {[0.8, 0.35, -0.1, -0.55].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.32, 0.055, 12, 60]} />
          <meshStandardMaterial color={SIGNAL} emissive={SIGNAL} emissiveIntensity={0.6} metalness={0.4} />
        </mesh>
      ))}
      <mesh ref={glow} position={[0, 0.9, 0]}>
        <cylinderGeometry args={[1.05, 1.05, 0.12, 48]} />
        <meshStandardMaterial color={HOT} emissive={HOT} emissiveIntensity={2.2} />
      </mesh>
      <pointLight position={[0, 1.4, 0]} color={HOT} intensity={12} distance={7} />
    </group>
  );
}

function Mold() {
  return (
    <group>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[2.4, 1, 1.8]} />
        <meshStandardMaterial color={STEEL} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[2.4, 1, 1.8]} />
        <meshStandardMaterial color="#16302c" metalness={0.5} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[2.46, 0.08, 1.86]} />
        <meshStandardMaterial color={SIGNAL} emissive={SIGNAL} emissiveIntensity={0.9} />
      </mesh>
      <mesh position={[-0.7, 1.2, 0]}>
        <cylinderGeometry args={[0.22, 0.3, 0.5, 24]} />
        <meshStandardMaterial color={SIGNAL} emissive={SIGNAL} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.75, 1.15, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.4, 24]} />
        <meshStandardMaterial color="#2c534b" metalness={0.7} />
      </mesh>
    </group>
  );
}

function Ladle() {
  const g = useRef<Group>(null);
  useFrame((s) => {
    if (g.current) g.current.rotation.z = Math.sin(s.clock.elapsedTime * 0.8) * 0.18 - 0.12;
  });
  return (
    <group ref={g} position={[0, 0.2, 0]}>
      <mesh>
        <cylinderGeometry args={[1, 0.75, 1.6, 40]} />
        <meshStandardMaterial color={STEEL} metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.78, 0]}>
        <torusGeometry args={[1, 0.07, 12, 48]} />
        <meshStandardMaterial color={SIGNAL} emissive={SIGNAL} emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.92, 0.92, 0.08, 40]} />
        <meshStandardMaterial color={HOT} emissive={HOT} emissiveIntensity={2.4} />
      </mesh>
      <mesh position={[0.95, 0.9, 0]} rotation={[0, 0, -0.5]}>
        <coneGeometry args={[0.25, 0.6, 24, 1, true]} />
        <meshStandardMaterial color={HOT} emissive={HOT} emissiveIntensity={1.4} side={2} />
      </mesh>
      <pointLight position={[0, 1.1, 0]} color={HOT} intensity={10} distance={6} />
    </group>
  );
}

function Inspection() {
  const scan = useRef<Mesh>(null);
  useFrame((s) => {
    if (scan.current) scan.current.position.y = Math.sin(s.clock.elapsedTime * 1.2) * 0.7 + 0.4;
  });
  return (
    <group>
      <mesh position={[0, -0.9, 0]}>
        <boxGeometry args={[3, 0.2, 2]} />
        <meshStandardMaterial color={STEEL} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.2, 0]}>
        <torusKnotGeometry args={[0.5, 0.17, 120, 20]} />
        <meshStandardMaterial color="#7fd6c2" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh ref={scan} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.05, 60]} />
        <meshBasicMaterial color={SIGNAL} transparent opacity={0.8} side={2} />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[0.6, 0.35, 0.6]} />
        <meshStandardMaterial color={SIGNAL} emissive={SIGNAL} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

export default function Scene({
  variant = "furnace",
  interactive = true,
}: {
  variant?: SceneVariant;
  interactive?: boolean;
}) {
  return (
    <Canvas camera={{ position: [3.6, 2.4, 4.4], fov: 42 }} dpr={[1, 1.8]}>
      <color attach="background" args={["#F4E9CD"]} />
      <fog attach="fog" args={["#F4E9CD", 8, 18]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 6, 4]} intensity={1.1} color="#ffffff" />
      <directionalLight position={[-5, 2, -4]} intensity={0.5} color={SIGNAL} />
      <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.5}>
        {variant === "furnace" && <Furnace />}
        {variant === "mold" && <Mold />}
        {variant === "ladle" && <Ladle />}
        {variant === "inspection" && <Inspection />}
      </Float>
      <gridHelper args={[16, 16, "#D1C5A1", "#E7DBB8"]} position={[0, -1.5, 0]} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enabled={interactive}
        autoRotate
        autoRotateSpeed={0.9}
        minPolarAngle={Math.PI / 3.4}
        maxPolarAngle={Math.PI / 2.1}
      />
    </Canvas>
  );
}
