import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { kontrast } from "../kit.ts";
import type { SparatBygge } from "../bygge.ts";
import { _mal, slag, usePennTryck } from "./delat.ts";
import { TOON_MAP } from "./djur.tsx";
import { PLACERING } from "../placering.ts";

/** P3a: spökhusets läge ur data/placering.json (ang.fasta), samma som placeringen räknar med. */
const SPOK = PLACERING.platser.ang?.fasta?.find((f) => f.namn === "spokhus") ?? { x: 2.15, z: -1.7 };

export function Hus({
  position,
  farg,
  fonster,
  skala = 1.55,
}: {
  position: [number, number, number];
  farg: string;
  fonster: number;
  skala?: number;
}) {
  const tak = kontrast(farg);
  const n = Math.max(1, Math.min(4, fonster));
  const luckor = useMemo(() => {
    return Array.from({ length: n }, (_, i) => (n === 1 ? 0 : -0.42 + (i * 0.84) / (n - 1)));
  }, [n]);
  return (
    <group position={position} scale={skala}>
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 1.5, 1.45]} />
        <meshStandardMaterial color={farg} roughness={0.84} />
      </mesh>
      <mesh position={[0, 1.85, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.35, 0.95, 4]} />
        <meshStandardMaterial color={tak} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.42, 0.74]} castShadow>
        <boxGeometry args={[0.4, 0.72, 0.08]} />
        <meshStandardMaterial color="#5D4037" roughness={0.8} />
      </mesh>
      {luckor.map((x) => (
        <mesh key={x} position={[x, 1.02, 0.75]}>
          <boxGeometry args={[0.3, 0.3, 0.06]} />
          <meshStandardMaterial color="#FFF8E1" emissive="#FFE082" emissiveIntensity={0.45} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

export function Byggnad({ b }: { b: SparatBygge }) {
  const x = (b.x - 0.5) * 16;
  const z = (b.y - 0.62) * 12;
  const farg = b.fargHex?.startsWith("#") ? b.fargHex : "#E57373";
  const fonster = b.delar.find((d) => d.id === "fönster")?.antal ?? 2;
  const typ = slag(b.bygg);
  if (typ === "damm") {
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.05, z]}>
        <circleGeometry args={[1.7, 24]} />
        <meshStandardMaterial color="#4FC3F7" roughness={0.25} />
      </mesh>
    );
  }
  if (typ === "talt") {
    return (
      <mesh position={[x, 0.75, z]} castShadow>
        <coneGeometry args={[1, 1.5, 6]} />
        <meshStandardMaterial color={farg} roughness={0.85} />
      </mesh>
    );
  }
  if (typ === "mur") {
    return (
      <mesh position={[x, 0.35, z]} castShadow>
        <boxGeometry args={[1.9, 0.7, 0.28]} />
        <meshStandardMaterial color={farg} roughness={0.9} />
      </mesh>
    );
  }
  if (typ === "trad") {
    const lov = farg === "#E57373" ? "#43A047" : farg;
    return (
      <group position={[x, 0, z]}>
        <mesh position={[0, 0.75, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.26, 1.5, 6]} />
          <meshStandardMaterial color="#6D4C41" roughness={0.92} />
        </mesh>
        <mesh position={[0, 1.9, 0]} castShadow>
          <coneGeometry args={[0.9, 1.6, 7]} />
          <meshStandardMaterial color={lov} roughness={0.86} />
        </mesh>
      </group>
    );
  }
  if (typ === "blomma") {
    return (
      <group position={[x, 0, z]}>
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.06, 0.08, 0.8, 5]} />
          <meshStandardMaterial color="#66BB6A" />
        </mesh>
        <mesh position={[0, 0.9, 0]} castShadow>
          <sphereGeometry args={[0.32, 10, 8]} />
          <meshStandardMaterial color={farg} roughness={0.6} />
        </mesh>
      </group>
    );
  }
  return <Hus position={[x, 0, z]} farg={farg} fonster={fonster} />;
}

export function SpokHus({ onSnart: _onSnart }: { onSnart: () => void }) {
  const hus = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (state.clock.elapsedTime % 0.2 >= 0.05) return;
    const rot = hus.current;
    if (!rot) return;
    rot.getWorldPosition(_mal);
    _mal.y += 0.9;
    _mal.project(state.camera);
    const rect = state.gl.domElement.getBoundingClientRect();
    const tred = (window.__tred ??= { x: 0, y: 0, z: 0, zoom: 0 });
    tred.husx = Math.round(rect.left + ((_mal.x + 1) / 2) * rect.width);
    tred.husy = Math.round(rect.top + ((1 - _mal.y) / 2) * rect.height);
    window.__tred = tred;
  });
  return (
    <group name="spokhus" position={[SPOK.x, 0, SPOK.z]}>
      <group ref={hus} />
    </group>
  );
}

export function Skogsstig({ onSnart }: { onSnart: () => void }) {
  const gung = useRef(0);
  const grind = useRef<THREE.Group>(null);
  // P2-2: guidens 3D-ankare "grind" (data/forsta-stunden.json pekar_pa "3d:grind"), samma mönster som spökhusets husx/husy
  useFrame((state) => {
    const g = grind.current;
    if (!g || state.clock.elapsedTime % 0.25 > 0.05) return;
    g.getWorldPosition(_mal);
    _mal.y += 0.45;
    _mal.project(state.camera);
    const mal = (window.__tredMal ??= {});
    if (_mal.z > 1) {
      delete mal.grind;
      return;
    }
    const rect = state.gl.domElement.getBoundingClientRect();
    mal.grind = { x: Math.round(rect.left + ((_mal.x + 1) / 2) * rect.width), y: Math.round(rect.top + ((1 - _mal.y) / 2) * rect.height) };
  });
  const ned = usePennTryck(() => {
    gung.current = 1;
    onSnart();
  });
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0.02]} position={[-0.7, 0.028, -1.7]}>
        <planeGeometry args={[0.42, 1.6]} />
        <meshToonMaterial color="#E6CBA0" gradientMap={TOON_MAP} />
      </mesh>
      <group ref={grind} name="grind" position={[-0.7, 0, -2.15]} scale={1.05} onPointerDown={ned} />
    </group>
  );
}
