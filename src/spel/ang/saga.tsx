import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import type { Sparad } from "../brygga.ts";
import { GltfDjur, squashSkala } from "../gltfDjur.tsx";
import { ljud } from "../ljud.ts";
import { useMinne } from "../minne.ts";
import { sagaNatt, sagaNu } from "../saga.ts";
import { DjurForm } from "./djur.tsx";

const PENNA_GLB = "/models/bulk/f-trollpenna-magisk-cc0.glb";
const STJARNA_GLB = "/models/bulk/f-magisk-stjarna-effekt-cc0.glb";

const KAM: readonly (readonly number[])[] = [
  [0, 0.1, 5.5, 8.5, 0, 2.5, 0.2],
  [2.2, 0, 4.5, 8.2, 0, 2.15, 0.45],
  [5.74, 0, 3.6, 7.2, 0, 1.2, 0.2],
  [8.2, 0, 3.4, 6.8, 0, 0.85, -0.1],
  [10.1, 0, 2.95, 6.5, 0, 0.4, -0.35],
  [13.8, 0, 2.9, 6.4, 0, 0.2, -0.35],
  [18.75, 0, 2.85, 6.4, 0, 0.15, -0.35],
];

function kameraVid(t: number, pos: THREE.Vector3, look: THREE.Vector3) {
  let i = 0;
  while (i < KAM.length - 2 && (KAM[i + 1]?.[0] ?? 0) < t) i += 1;
  const a = KAM[i] ?? KAM[0]!;
  const b = KAM[Math.min(KAM.length - 1, i + 1)] ?? a;
  const span = (b[0] ?? 0) - (a[0] ?? 0) || 1;
  const u = Math.min(1, Math.max(0, (t - (a[0] ?? 0)) / span));
  pos.set(
    (a[1] ?? 0) + ((b[1] ?? 0) - (a[1] ?? 0)) * u,
    (a[2] ?? 0) + ((b[2] ?? 0) - (a[2] ?? 0)) * u,
    (a[3] ?? 0) + ((b[3] ?? 0) - (a[3] ?? 0)) * u,
  );
  look.set(
    (a[4] ?? 0) + ((b[4] ?? 0) - (a[4] ?? 0)) * u,
    (a[5] ?? 0) + ((b[5] ?? 0) - (a[5] ?? 0)) * u,
    (a[6] ?? 0) + ((b[6] ?? 0) - (a[6] ?? 0)) * u,
  );
}

export type OrbitStyr = { enabled: boolean; target: THREE.Vector3; update: () => void };

const SAGA_SIGNAL = { current: { klapp: 0, ror: 0 } };
const SAGA_KANIN: Sparad = {
  uid: "saga-kanin",
  skapad: 0,
  kropp: "kanin",
  farg: "#F48FB1",
  monster: null,
  monsterfarg: null,
  formagor: [],
  tillbehor: [],
  skala: 1,
  alpha: 1,
  kontur: false,
  glans: false,
  formel: "en rosa kanin",
  beskrivning: "rosa kanin",
  overraskningar: [],
};

export function SagaKamera({ styr }: { styr: { current: OrbitStyr | null } }) {
  const was = useRef(false);
  const pos = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3());
  const harDjur = useMinne((s) => s.ang.length > 0 || s.hemma.length > 0);
  useFrame((state) => {
    const cam = state.camera;
    const c = styr.current;
    const styrd = sagaNu.aktiv || !harDjur;
    if (!styrd) {
      if (!was.current) return;
      cam.position.set(0, 4.15, 9.8);
      look.current.set(0, 1.05, -0.15);
      cam.lookAt(look.current);
      if (c) {
        c.target.copy(look.current);
        c.enabled = true;
        c.update();
      }
      was.current = false;
      return;
    }
    was.current = true;
    if (c) c.enabled = false;
    if (sagaNu.aktiv) kameraVid(sagaNu.t, pos.current, look.current);
    else {
      pos.current.set(0, 2.85, 6.4);
      look.current.set(0, 0.15, -0.35);
    }
    cam.position.copy(pos.current);
    cam.lookAt(look.current);
    if (c) c.target.copy(look.current);
  }, -2);
  return null;
}

export function SagaLjus({
  natt,
  amb,
  hem,
  dir,
  sol,
  fyll,
  kant,
}: {
  natt: number;
  amb: { current: THREE.AmbientLight | null };
  hem: { current: THREE.HemisphereLight | null };
  dir: { current: THREE.DirectionalLight | null };
  sol: { current: THREE.MeshBasicMaterial | null };
  fyll: { current: THREE.DirectionalLight | null };
  kant: { current: THREE.DirectionalLight | null };
}) {
  const was = useRef(false);
  const himmel = useRef(new THREE.Color());
  const dagF = useRef(new THREE.Color("#87CEEB"));
  const nattF = useRef(new THREE.Color("#1B2348"));
  const solDag = useRef(new THREE.Color("#FFE082"));
  const solNatt = useRef(new THREE.Color("#FFF8E1"));
  useFrame(({ scene }) => {
    const n = sagaNu.aktiv ? sagaNatt(natt) : null;
    if (n == null) {
      if (!was.current) return;
      was.current = false;
      if (amb.current) amb.current.intensity = 0.15;
      if (hem.current) hem.current.intensity = 2.4;
      if (dir.current) {
        dir.current.intensity = 2.6;
        dir.current.color.set("#fff1dc");
      }
      if (fyll.current) fyll.current.intensity = 0.9;
      if (kant.current) kant.current.intensity = 1.2;
      himmel.current.copy(dagF.current).lerp(nattF.current, Math.min(1, natt));
      const bg = scene.background;
      if (bg instanceof THREE.Color) bg.copy(himmel.current);
      if (sol.current) sol.current.color.copy(natt > 0.55 ? solNatt.current : solDag.current);
      return;
    }
    was.current = true;
    const dag = 1 - Math.min(1, n);
    if (amb.current) amb.current.intensity = 0.15 * (0.45 + dag * 0.55);
    if (hem.current) hem.current.intensity = 2.4 * (0.25 + dag * 0.75);
    if (dir.current) {
      dir.current.intensity = 2.6 * (0.2 + dag * 0.8);
      dir.current.color.set("#fff1dc");
    }
    if (fyll.current) fyll.current.intensity = 0.9 * (0.3 + dag * 0.7);
    if (kant.current) kant.current.intensity = 1.2 * (0.2 + dag * 0.8);
    himmel.current.copy(dagF.current).lerp(nattF.current, Math.min(1, n));
    const bg = scene.background;
    if (bg instanceof THREE.Color) bg.copy(himmel.current);
    if (sol.current) sol.current.color.copy(n > 0.55 ? solNatt.current : solDag.current);
  });
  return null;
}

function PennaGltf() {
  const gltf = useGLTF(PENNA_GLB);
  const klon = useMemo(() => SkeletonUtils.clone(gltf.scene) as THREE.Object3D, [gltf.scene]);
  return <primitive object={klon} />;
}

function MagiskStjarna({ i, landning = false }: { i: number; landning?: boolean }) {
  const gltf = useGLTF(STJARNA_GLB);
  const g = useRef<THREE.Group>(null);
  const klon = useMemo(() => SkeletonUtils.clone(gltf.scene) as THREE.Object3D, [gltf.scene]);
  useFrame(({ clock }) => {
    const p = g.current;
    if (!p) return;
    const t = clock.elapsedTime;
    const syns = landning
      ? (sagaNu.aktiv && sagaNu.t >= 10.1) || (!sagaNu.aktiv && useMinne.getState().ang.length === 0)
      : sagaNu.aktiv && sagaNu.t < 10.5;
    p.visible = syns;
    if (!syns) return;
    const a = i * 1.7 + t * 1.4;
    const y0 = landning ? 0.85 : 1.6;
    p.position.set(Math.cos(a) * 0.42, y0 + Math.sin(t * 2 + i) * 0.18, (landning ? -0.35 : 1.1) + Math.sin(a) * 0.22);
    p.rotation.y = t * 2 + i;
    p.scale.setScalar(0.11 + Math.sin(t * 3 + i) * 0.03);
  });
  return (
    <group ref={g} visible={false}>
      <primitive object={klon} />
    </group>
  );
}

export function SagaPenna() {
  const g = useRef<THREE.Group>(null);
  const ljus = useRef<THREE.PointLight>(null);
  useFrame(() => {
    const p = g.current;
    if (!p) return;
    const t = sagaNu.t;
    const syns = sagaNu.aktiv && t < 10.5;
    p.visible = syns;
    if (ljus.current) ljus.current.intensity = syns ? 1.6 : 0;
    if (!syns) return;
    let x = 0.45, y = 1.24, z = 1.75, rot = -0.58;
    if (t < 1.9) {
      const u = t / 1.9;
      x = -2.2 + u * 2.65;
      y = 3.35 - u * 2.1 + Math.sin(u * Math.PI) * 0.28;
      z = 1.8 - u * 0.05;
      rot = -0.85 + u * 0.27;
    } else if (t < 8.71) {
      const w = t - 1.9;
      x = 0.45 + Math.sin(w * 6.5) * 0.12;
      y = 1.24 + Math.sin(w * 10) * 0.05;
      z = 1.75;
      rot = -0.58 + Math.sin(w * 8) * 0.08;
    } else {
      const u = Math.min(1, (t - 8.71) / 1.8);
      x = 0.45 + u * 0.8;
      y = 1.24 + u * 1.4;
      z = 1.75 - u * 0.4;
      rot = -0.58 - u * 0.5;
    }
    p.position.set(x, y, z);
    p.rotation.set(0.15, 0.25, rot);
  });
  return (
    <group ref={g} visible={false} scale={0.95}>
      <Suspense fallback={null}>
        <PennaGltf />
      </Suspense>
      {[0, 1, 2, 3].map((i) => (
        <Suspense key={i} fallback={null}>
          <MagiskStjarna i={i} />
        </Suspense>
      ))}
      <pointLight ref={ljus} position={[0, -0.7, 0.2]} color="#FFE082" intensity={0} distance={7} />
    </group>
  );
}

export function SagaBoll() {
  const g = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const m = g.current;
    if (!m) return;
    const t = sagaNu.t;
    const syns = sagaNu.aktiv && t >= 9.8 && t < 10.8;
    m.visible = syns;
    if (!syns) return;
    const u = (t - 9.8) / 0.6;
    const s = u < 0.45 ? u / 0.45 : Math.max(0, 1 - (u - 0.45) / 0.55);
    m.scale.setScalar(0.25 + s * 1.15);
    m.position.set(0, 0.9, -0.35);
  });
  return (
    <mesh ref={g} visible={false}>
      <sphereGeometry args={[0.48, 14, 12]} />
      <meshBasicMaterial color="#FFF4C4" transparent opacity={0.95} />
    </mesh>
  );
}

export function SagaKanin() {
  const rot = useRef<THREE.Group>(null);
  const landad = useRef(false);
  const hopp = useRef(0);
  const harDjur = useMinne((s) => s.ang.length > 0 || s.hemma.length > 0);
  useFrame((state, delta) => {
    const g = rot.current;
    if (!g) return;
    const t = sagaNu.t;
    const syns = (sagaNu.aktiv && (t >= 10.1 || sagaNu.fas >= 3)) || (!sagaNu.aktiv && !harDjur);
    g.visible = syns;
    if (!syns) {
      landad.current = false;
      return;
    }
    const clock = state.clock.elapsedTime;
    if (sagaNu.aktiv && t < 10.18) {
      const u = Math.min(1, Math.max(0, (t - 10.1) / 0.08));
      const s = u * u * (3 - 2 * u);
      g.scale.setScalar(s);
      g.position.set(0, 0.35 + (1 - u) * 0.7, -0.35);
      g.rotation.set(0, 0.2, 0);
      return;
    }
    if (!landad.current) {
      landad.current = true;
      hopp.current = 1;
      ljud.plopp();
      ljud.boing();
    }
    hopp.current = Math.max(0, hopp.current - delta * 1.35);
    if (hopp.current <= 0 && Math.sin(clock * 0.55) > 0.92) hopp.current = 1;
    const sq = squashSkala(clock, hopp.current);
    g.scale.set(sq.sxz, sq.sy, sq.sxz);
    g.position.set(0, 0.35 + Math.max(0, sq.lyft), -0.35);
    const freeze = typeof window !== "undefined" && window.__PAUSE_ANIM === true;
    g.rotation.set(0, 0.15, freeze ? 0 : Math.sin(clock * 0.9) * 0.12);
  });
  return (
    <group ref={rot} visible={false} raycast={() => null}>
      <Suspense fallback={<DjurForm spec={SAGA_KANIN} />}>
        <GltfDjur spec={SAGA_KANIN} signal={SAGA_SIGNAL} />
      </Suspense>
      {[0, 1, 2].map((i) => (
        <Suspense key={i} fallback={null}>
          <MagiskStjarna i={i} landning />
        </Suspense>
      ))}
    </group>
  );
}

useGLTF.preload(PENNA_GLB);
useGLTF.preload(STJARNA_GLB);
