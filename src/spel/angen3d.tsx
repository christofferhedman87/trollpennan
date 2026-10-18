import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Component, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import texterJson from "../../data/texter-gard.json" with { type: "json" };
import { kontrast } from "./kit.ts";
import { useMinne } from "./minne.ts";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { brygga, type Sparad } from "./brygga.ts";
import { byggPack, forma } from "./djurmesh.ts";
import { replik } from "./replik.ts";
import { ljud } from "./ljud.ts";
import { sagaNatt, sagaNu } from "./saga.ts";
import type { SparatBygge } from "./bygge.ts";
import { GltfDjur, harModell, type DjurSignal } from "./gltfDjur.tsx";
import { artFarg, flyger, hoppHojd, simmar, svavar, vikt } from "./entiteter.ts";
import { faestTillbehor, procAnkare } from "./tillbehor/index.ts";
import { DjurEffekter } from "./effekter.tsx";
import { KenneyNatur } from "./kenneyNatur.tsx";
import { AGG_KROPP, OrdAgg, ReservAgg } from "./ordagg.tsx";

const HINT = (texterJson as { tred_hint: string }).tred_hint;
const SNART = (texterJson as { demo: { snart: string } }).demo.snart;
const TRAD: [number, number, number][] = [
  [-2.7, -2.4, 1.05],
  [-3.15, -4.1, 1.22],
  [-2.35, -5.5, 0.95],
  [2.75, -2.2, 1.08],
  [3.2, -3.9, 1.2],
  [2.4, -5.3, 0.95],
];
const GRAN: [number, number][] = [
  [-3.4, -7.4],
  [3.5, -7.6],
];
const BLOMMOR = [
  [-1.25, 1.15, "#F48FB1"],
  [-1.55, 1.38, "#FDD835"],
  [-0.95, 1.42, "#FFFFFF"],
  [-1.4, 1.62, "#CE93D8"],
  [-1.05, 1.68, "#F48FB1"],
  [1.15, 1.2, "#FDD835"],
  [1.45, 1.4, "#FFFFFF"],
  [0.9, 1.48, "#CE93D8"],
  [1.3, 1.62, "#F48FB1"],
  [-0.45, 2.05, "#F48FB1"],
  [0.1, 2.28, "#FDD835"],
  [0.55, 2.02, "#FFFFFF"],
  [-0.15, 2.42, "#CE93D8"],
] as const;

declare global {
  interface Window {
    __tred?: {
      x: number;
      y: number;
      z: number;
      zoom: number;
      dx?: number;
      dy?: number;
      dz?: number;
      fov?: number;
      calls?: number;
      tris?: number;
      fps?: number;
      husx?: number;
      husy?: number;
    };
    __tredMal?: Record<string, { x: number; y: number }>;
  }
}

function lerpHex(a: string, b: string, t: number) {
  const p = (h: string) => {
    const n = Number.parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const A = p(a);
  const B = p(b);
  const c = A.map((v, i) => Math.round(v + ((B[i] ?? v) - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

const _mal = new THREE.Vector3();
const _blomM = new THREE.Matrix4();
const _blomQ = new THREE.Quaternion();
const _blomE = new THREE.Euler();
const _blomP = new THREE.Vector3();
const _blomS = new THREE.Vector3(1, 1, 1);

function normDuk(canvas: HTMLElement, v: THREE.Vector3): { x: number; y: number } {
  const crect = canvas.getBoundingClientRect();
  const sx = crect.left + ((v.x + 1) / 2) * crect.width;
  const sy = crect.top + ((1 - v.y) / 2) * crect.height;
  const ang = canvas.closest(".ang");
  if (!(ang instanceof HTMLElement)) return { x: 0.5, y: 0.45 };
  const arect = ang.getBoundingClientRect();
  const nx = (sx - arect.left) / Math.max(1, arect.width);
  const ny = (sy - arect.top) / Math.max(1, arect.height);
  const stil = getComputedStyle(ang);
  const dukX = Number.parseFloat(stil.getPropertyValue("--duk-x")) || 0;
  const dukY = Number.parseFloat(stil.getPropertyValue("--duk-y")) || 0;
  const dukW = Number.parseFloat(stil.getPropertyValue("--duk-w")) || 1;
  const dukH = Number.parseFloat(stil.getPropertyValue("--duk-h")) || 1;
  return { x: (nx - dukX) / dukW, y: (ny - dukY) / dukH };
}

function djurFarg(spec: Sparad) {
  if (spec.farg?.startsWith("#")) return spec.farg;
  return artFarg(spec.kropp);
}

function flygare(spec: Sparad) {
  return flyger(spec.kropp, spec.formagor);
}

function simmare(spec: Sparad) {
  return simmar(spec.kropp, spec.formagor);
}

const LAND_SLOT: [number, number][] = [
  [0.1, -0.15],
  [-1.45, 0.35],
  [1.4, 0.25],
  [-0.8, 0.85],
  [0.85, 0.75],
  [0.05, 1.05],
  [-1.55, 1.05],
  [1.55, 0.95],
];

function djurPlats(spec: Sparad, alla: Sparad[]): [number, number, number] {
  if (simmare(spec)) {
    const sim = alla.filter((d) => simmare(d));
    const i = Math.max(0, sim.findIndex((d) => d.uid === spec.uid));
    const ang = (i / Math.max(1, sim.length)) * Math.PI * 2;
    return [1.15 + Math.cos(ang) * 0.35, 0.16, -0.45 + Math.sin(ang) * 0.22];
  }
  const land = alla.filter((d) => !simmare(d) && !flygare(d));
  const flyg = alla.filter((d) => flygare(d) && !simmare(d));
  const tyngd = (d: Sparad) => vikt(d.kropp);
  if (flygare(spec)) {
    const i = Math.max(0, flyg.findIndex((d) => d.uid === spec.uid));
    return [-1.4 + i * 1.5, 1.55, -0.85];
  }
  const sorterad = land.slice().sort((a, b) => tyngd(b) - tyngd(a) || a.uid.localeCompare(b.uid));
  const i = Math.max(0, sorterad.findIndex((d) => d.uid === spec.uid));
  const slot = LAND_SLOT[i] ?? [((i % 2 === 0 ? -1 : 1) * (2.2 + Math.floor(i / 2) * 0.4)), -1.2];
  return [slot[0], 0, slot[1]];
}

function slag(id: string): "hus" | "trad" | "blomma" | "damm" | "talt" | "mur" {
  if (id === "damm") return "damm";
  if (id === "tält") return "talt";
  if (id === "staket" || id === "mur") return "mur";
  if (["träd", "gran", "palm", "äppelträd", "buske", "svamp"].includes(id)) return "trad";
  if (id === "blomma") return "blomma";
  return "hus";
}

class ModellGren extends Component<{ spec: Sparad; children: ReactNode }, { fel: boolean }> {
  state = { fel: false };
  componentDidCatch() {
    window.dispatchEvent(new CustomEvent("trollpennan:model-fallback", { detail: { kropp: this.props.spec.kropp } }));
  }
  static getDerivedStateFromError() {
    return { fel: true };
  }
  render() {
    return this.state.fel ? <DjurForm spec={this.props.spec} /> : this.props.children;
  }
}

class NaturGren extends Component<{ children: ReactNode }, { fel: boolean }> {
  state = { fel: false };
  static getDerivedStateFromError() {
    return { fel: true };
  }
  render() {
    if (this.state.fel) {
      return (
        <>
          <TradOchBlommor />
          <GrasTuvor />
          <Stenar />
          <Nackrosor />
          <Forgrund />
        </>
      );
    }
    return this.props.children;
  }
}

class TredGren extends Component<{ children: ReactNode }, { fel: boolean }> {
  state = { fel: false };
  static getDerivedStateFromError() {
    return { fel: true };
  }
  render() {
    return this.state.fel ? null : this.props.children;
  }
}

const _dir = new THREE.Vector3();
function Sond() {
  const fps = useRef({ n: 0, t: 0 });
  useFrame((state) => {
    const p = state.camera.position;
    const t = window.__tred ?? { x: 0, y: 0, z: 0, zoom: 0 };
    t.x = Math.round(p.x * 100) / 100;
    t.y = Math.round(p.y * 100) / 100;
    t.z = Math.round(p.z * 100) / 100;
    t.zoom = Math.round(p.length() * 100) / 100;
    state.camera.getWorldDirection(_dir);
    t.dx = Math.round(_dir.x * 100) / 100;
    t.dy = Math.round(_dir.y * 100) / 100;
    t.dz = Math.round(_dir.z * 100) / 100;
    const cam = state.camera as THREE.PerspectiveCamera;
    t.fov = cam.fov;
    t.calls = state.gl.info.render.calls;
    t.tris = state.gl.info.render.triangles;
    const nu = state.clock.elapsedTime;
    const r = fps.current;
    r.n += 1;
    if (nu - r.t >= 0.5) {
      t.fps = Math.round(r.n / Math.max(0.001, nu - r.t));
      r.n = 0;
      r.t = nu;
    }
    window.__tred = t;
  });
  return null;
}

function Moln({ position, fart }: { position: [number, number, number]; fart: number }) {
  const ref = useRef<THREE.Group>(null);
  const basY = position[1];
  useFrame((state, delta) => {
    const g = ref.current;
    if (!g) return;
    const d = Math.min(delta, 0.1);
    g.position.x += d * fart;
    if (g.position.x > 6) g.position.x = -6;
    g.position.y = basY + Math.sin(state.clock.elapsedTime * 0.12 + position[0]) * 0.06;
  });
  return (
      <group ref={ref} position={position} scale={0.48}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.05, 7, 5]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[0.95, -0.12, 0.15]}>
        <sphereGeometry args={[0.78, 6, 5]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[-0.9, -0.18, 0.05]}>
        <sphereGeometry args={[0.62, 6, 5]} />
        <meshBasicMaterial color="#E7F3FC" />
      </mesh>
    </group>
  );
}

function TradOchBlommor() {
  const stam = useRef<THREE.InstancedMesh>(null);
  const krona = useRef<THREE.InstancedMesh>(null);
  const topp = useRef<THREE.InstancedMesh>(null);
  const blom = useRef<THREE.InstancedMesh>(null);
  const mitt = useRef<THREE.InstancedMesh>(null);
  const stjalk = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    TRAD.forEach(([x, z, s], i) => {
      _blomQ.identity();
      _blomP.set(x, 0.55, z);
      _blomS.set(s, s, s);
      _blomM.compose(_blomP, _blomQ, _blomS);
      stam.current?.setMatrixAt(i, _blomM);
      _blomP.set(x, 1.45, z);
      _blomS.set(1.05 * s, 0.9 * s, 1.05 * s);
      _blomM.compose(_blomP, _blomQ, _blomS);
      krona.current?.setMatrixAt(i, _blomM);
      _blomP.set(x + 0.15 * s, 1.95, z);
      _blomS.set(0.72 * s, 0.62 * s, 0.72 * s);
      _blomM.compose(_blomP, _blomQ, _blomS);
      topp.current?.setMatrixAt(i, _blomM);
    });
    if (stam.current) stam.current.instanceMatrix.needsUpdate = true;
    if (krona.current) krona.current.instanceMatrix.needsUpdate = true;
    if (topp.current) topp.current.instanceMatrix.needsUpdate = true;
    const c = new THREE.Color();
    BLOMMOR.forEach(([x, z, farg], i) => {
      m.makeTranslation(x, 0.28, z);
      blom.current?.setMatrixAt(i, m);
      blom.current?.setColorAt(i, c.set(farg));
      m.makeTranslation(x, 0.36, z);
      mitt.current?.setMatrixAt(i, m);
      m.makeTranslation(x, 0.14, z);
      stjalk.current?.setMatrixAt(i, m);
    });
    if (blom.current) {
      blom.current.instanceMatrix.needsUpdate = true;
      if (blom.current.instanceColor) blom.current.instanceColor.needsUpdate = true;
    }
    if (mitt.current) mitt.current.instanceMatrix.needsUpdate = true;
    if (stjalk.current) stjalk.current.instanceMatrix.needsUpdate = true;
  }, []);
  useFrame((state) => {
    const mesh = blom.current;
    const ben = stjalk.current;
    const nav = mitt.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < BLOMMOR.length; i++) {
      const blomma = BLOMMOR[i];
      if (!blomma) continue;
      const [x, z] = blomma;
      const svaj = Math.sin(t * 1.35 + i * 0.7) * 0.08;
      _blomP.set(x + svaj, 0.3 + Math.sin(t * 2.1 + i) * 0.02, z);
      _blomE.set(svaj * 0.4, t * 0.15 + i, svaj * 0.5);
      _blomQ.setFromEuler(_blomE);
      _blomS.set(0.16, 0.13, 0.16);
      _blomM.compose(_blomP, _blomQ, _blomS);
      mesh.setMatrixAt(i, _blomM);
      if (nav) {
        _blomP.set(x + svaj, 0.4, z);
        _blomS.set(0.07, 0.07, 0.07);
        _blomM.compose(_blomP, _blomQ, _blomS);
        nav.setMatrixAt(i, _blomM);
      }
      if (ben) {
        _blomP.set(x + svaj * 0.35, 0.14, z);
        _blomE.set(svaj * 0.4, 0, svaj);
        _blomQ.setFromEuler(_blomE);
        _blomS.set(1, 1, 1);
        _blomM.compose(_blomP, _blomQ, _blomS);
        ben.setMatrixAt(i, _blomM);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (nav) nav.instanceMatrix.needsUpdate = true;
    if (ben) ben.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      <instancedMesh ref={stam} args={[undefined, undefined, TRAD.length]}>
        <cylinderGeometry args={[0.11, 0.16, 1.15, 5]} />
        <meshToonMaterial color="#8D6E63" gradientMap={TOON_MAP} />
      </instancedMesh>
      <instancedMesh ref={krona} args={[undefined, undefined, TRAD.length]}>
        <sphereGeometry args={[0.85, 7, 6]} />
        <meshToonMaterial color="#7CB342" gradientMap={TOON_MAP} />
      </instancedMesh>
      <instancedMesh ref={topp} args={[undefined, undefined, TRAD.length]}>
        <sphereGeometry args={[0.7, 6, 5]} />
        <meshToonMaterial color="#9CCC65" gradientMap={TOON_MAP} />
      </instancedMesh>
      <Granar />
      <instancedMesh ref={stjalk} args={[undefined, undefined, BLOMMOR.length]}>
        <cylinderGeometry args={[0.02, 0.035, 0.32, 4]} />
        <meshToonMaterial color="#7CB342" gradientMap={TOON_MAP} />
      </instancedMesh>
      <instancedMesh ref={blom} args={[undefined, undefined, BLOMMOR.length]}>
        <sphereGeometry args={[1, 7, 5]} />
        <meshToonMaterial color="#ffffff" gradientMap={TOON_MAP} />
      </instancedMesh>
      <instancedMesh ref={mitt} args={[undefined, undefined, BLOMMOR.length]}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshBasicMaterial color="#FFF59D" />
      </instancedMesh>
    </>
  );
}

function Granar() {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    GRAN.forEach(([x, z], i) => {
      p.set(x, 1.35, z);
      s.set(1, 1.6, 1);
      m.compose(p, q, s);
      ref.current?.setMatrixAt(i, m);
    });
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, GRAN.length]}>
      <coneGeometry args={[0.7, 2.2, 6]} />
      <meshToonMaterial color="#3E7A32" gradientMap={TOON_MAP} />
    </instancedMesh>
  );
}

function Hus({
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

function Byggnad({ b }: { b: SparatBygge }) {
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

const TOON_MAP = (() => {
  const data = new Uint8Array([72, 158, 255]);
  const t = new THREE.DataTexture(data, 3, 1, THREE.RedFormat);
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  t.colorSpace = THREE.NoColorSpace;
  t.needsUpdate = true;
  return t;
})();
const KONTUR_MAT = new THREE.MeshBasicMaterial({ color: "#3B2F2F", side: THREE.BackSide });
const GEO = {
  boll: new THREE.SphereGeometry(1, 8, 6),
  kon: new THREE.ConeGeometry(0.5, 1, 5),
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 6),
};

function Formdel({
  geo,
  color,
  position,
  scale,
  rotation,
  kontur = true,
  skugga = false,
  glans = false,
}: {
  geo: THREE.BufferGeometry;
  color: string;
  position?: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
  kontur?: boolean;
  skugga?: boolean;
  glans?: boolean;
}) {
  const mat = useMemo(
    () =>
      new THREE.MeshToonMaterial({
        color,
        gradientMap: TOON_MAP,
        emissive: glans ? "#FFE082" : "#000000",
        emissiveIntensity: glans ? 0.45 : 0,
      }),
    [color, glans],
  );
  useEffect(() => {
    return () => mat.dispose();
  }, [mat]);
  return (
    <group position={position} scale={scale} rotation={rotation}>
      <mesh geometry={geo} material={mat} castShadow={skugga} />
      {kontur ? <mesh geometry={geo} material={KONTUR_MAT} scale={1.06} /> : null}
    </group>
  );
}

const KROPP_MAT = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: TOON_MAP });
const OGA_MAT = new THREE.MeshBasicMaterial({ vertexColors: true });

function DjurForm({ spec }: { spec: Sparad }) {
  const farg = djurFarg(spec);
  const pack = useMemo(() => {
    return byggPack({
      kropp: spec.kropp,
      farg,
      krona: false,
      // Hornet ritas av faestTillbehor så barnets färg syns. Inte en extra guldkon i meshen.
      horn: false,
      monster: Boolean(spec.monster),
      monsterFarg: spec.monsterfarg ?? "#6D4C41",
    });
  }, [farg, spec]);
  const tillSign = spec.tillbehor.map((t) => `${t.id}:${t.farg ?? ""}`).join(",");
  const extra = useMemo(() => {
    const g = new THREE.Group();
    faestTillbehor(g, spec.kropp, spec.tillbehor);
    return g;
  }, [spec, tillSign]);
  const mat = useMemo(() => {
    if (!spec.glans) return KROPP_MAT;
    return new THREE.MeshToonMaterial({
      vertexColors: true,
      gradientMap: TOON_MAP,
      emissive: "#FFE082",
      emissiveIntensity: 0.4,
    });
  }, [spec.glans]);
  const rok = useRef<THREE.Mesh>(null);
  const andas = useRef<THREE.Group>(null);
  useEffect(() => {
    return () => {
      pack.geo.dispose();
      pack.outline.dispose();
      pack.ogon.dispose();
      if (mat !== KROPP_MAT) mat.dispose();
    };
  }, [pack, mat]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    forma(pack, t, spec.kropp);
    const a = andas.current;
    if (a) {
      const b = 1 + Math.sin(t * 1.7) * 0.03;
      a.scale.set(1, b, 1);
    }
    const r = rok.current;
    if (!r) return;
    const cykel = t % 6.5;
    const syns = spec.kropp === "drake" && cykel > 4.6 && cykel < 5.7;
    r.visible = syns;
    if (!syns) return;
    const u = (cykel - 4.6) / 1.1;
    r.position.set(0.08, 0.95 + u * 0.45, 1.05);
    r.scale.setScalar(0.04 + u * 0.16);
    const rm = r.material as THREE.MeshBasicMaterial;
    rm.opacity = (1 - u) * 0.55;
  });
  return (
    <group ref={andas}>
      <mesh geometry={pack.outline} material={KONTUR_MAT} renderOrder={1} />
      <mesh geometry={pack.geo} material={mat} castShadow renderOrder={2} />
      <mesh geometry={pack.ogon} material={OGA_MAT} renderOrder={3} />
      <primitive object={extra} />
      {spec.kropp === "drake" ? (
        <mesh ref={rok} visible={false}>
          <sphereGeometry args={[1, 6, 5]} />
          <meshBasicMaterial color="#F7FBFF" transparent opacity={0.4} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  );
}



function Hjartan({ puls }: { puls: number }) {
  const grupp = useRef<THREE.Group>(null);
  const start = useRef(-10);
  useEffect(() => {
    if (puls > 0) start.current = performance.now();
  }, [puls]);
  useFrame(() => {
    const g = grupp.current;
    if (!g) return;
    const t = (performance.now() - start.current) / 1000;
    const syns = t >= 0 && t < 1.35;
    g.visible = syns;
    if (!syns) return;
    g.position.y = 1.05 + t * 0.55;
    if (puls >= 2) g.rotation.y += 0.08;
    for (let i = 0; i < g.children.length; i++) {
      const m = g.children[i] as THREE.Mesh;
      const gnist = m.name === "gnist";
      if (gnist && puls < 2) {
        m.visible = false;
        continue;
      }
      m.visible = true;
      const lokal = Math.max(0, t - i * 0.08);
      m.position.y = lokal * (gnist ? 0.5 : 0.28);
      const mat = m.material as THREE.MeshBasicMaterial | undefined;
      if (mat) mat.opacity = Math.max(0, 1 - lokal / (gnist ? 0.85 : 1.2));
    }
  });
  return (
    <group ref={grupp} visible={false}>
      {[-0.28, 0.02, 0.3].map((x) => (
        <mesh key={x} position={[x, 0, 0]}>
          <sphereGeometry args={[0.16, 8, 6]} />
          <meshBasicMaterial color="#F06292" transparent opacity={1} />
        </mesh>
      ))}
      {[
        [-0.16, 0.08],
        [0.18, -0.05],
        [0.02, 0.16],
        [-0.04, -0.12],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} name="gnist" position={[x ?? 0, 0, z ?? 0]} visible={false}>
          <sphereGeometry args={[0.045, 6, 5]} />
          <meshBasicMaterial color="#FFE082" transparent opacity={1} />
        </mesh>
      ))}
    </group>
  );
}

function DjurIScen({ spec, alla }: { spec: Sparad; alla: Sparad[] }) {
  const [x, y, z] = djurPlats(spec, alla);
  const grupp = useRef<THREE.Group>(null);
  const skal = useRef(0.2);
  const fod = useRef(-1);
  const landad = useRef(false);
  const hopp = useRef(0);
  const kisa = useRef(0);
  const snurr = useRef(0);
  const vila = useRef(2 + (spec.uid.charCodeAt(0) % 5));
  const klapp = useRef(0);
  const signal = useRef<DjurSignal>({ klapp: 0, ror: 0 });
  const plask = useRef<THREE.Mesh>(null);
  const puff = useRef<THREE.Group>(null);
  const upp = useRef<((ev: PointerEvent) => void) | null>(null);
  const [puls, setPuls] = useState(0);
  const index = alla.findIndex((d) => d.uid === spec.uid);
  const flyg = flygare(spec);
  const sim = simmare(spec);
  const ankare = useMemo(() => procAnkare(spec.kropp), [spec.kropp]);
  useEffect(() => {
    return () => {
      if (upp.current) window.removeEventListener("pointerup", upp.current);
      if (window.__tredMal) delete window.__tredMal[spec.uid];
    };
  }, [spec.uid]);
  useFrame((state, delta) => {
    const g = grupp.current;
    if (!g) return;
    const d = Math.min(delta, 0.1);
    const t = state.clock.elapsedTime;
    if (fod.current < 0) {
      fod.current = t;
      ljud.fil("pop");
    }
    const age = t - fod.current;
    if (!landad.current && age >= 0.38) {
      landad.current = true;
      ljud.fil("landa");
    }
    let bred = 1;
    let hojd = 1;
    if (age < 0.4) {
      const u = age / 0.4;
      const pop = u < 0.5 ? u / 0.5 : 1 + Math.sin(((u - 0.5) / 0.5) * Math.PI) * 0.16;
      const squash = Math.sin(u * Math.PI) * 0.28;
      skal.current = pop;
      bred = 1 + squash;
      hojd = 1 - squash * 1.15;
    } else {
      skal.current += (1 - skal.current) * Math.min(1, d * 6);
    }
    if (hopp.current > 0) hopp.current = Math.max(0, hopp.current - d * 2.2);
    if (kisa.current > 0) kisa.current = Math.max(0, kisa.current - d * 1.5);
    if (snurr.current > 0) snurr.current = Math.max(0, snurr.current - d * 0.55);
    vila.current -= d;
    const hoppH = hoppHojd(spec.kropp);
    const kanHoppa = hoppH !== null;
    if (vila.current <= 0 && hopp.current <= 0 && snurr.current <= 0) {
      if (hoppH !== null) hopp.current = hoppH;
      vila.current = kanHoppa ? 3.1 + (index % 3) * 0.7 : 5;
    }
    const lyft = Math.sin(hopp.current * Math.PI) * (snurr.current > 0 ? 0.85 : 0.45);
    const bob = Math.sin(t * (flyg ? 2.4 : 1.6) + index) * (flyg ? 0.16 : sim ? 0.08 : 0.04);
    const s = skal.current * (spec.skala || 1);
    const kram = 1 - Math.sin(Math.min(1, kisa.current) * Math.PI) * 0.14;
    g.scale.set((s * bred) / Math.sqrt(kram), s * hojd * kram, (s * bred) / Math.sqrt(kram));
    const wx = Math.cos(t * 0.25 + index) * 0.22;
    const wz = Math.sin(t * 0.21 + index * 1.4) * 0.16;
    const spx = -Math.sin(t * 0.25 + index) * 0.22 * 0.25;
    const spz = Math.cos(t * 0.21 + index * 1.4) * 0.16 * 0.21;
    signal.current.ror = Math.hypot(spx, spz) * 10;
    if (flyg) {
      const loop = t * 0.85 + index;
      g.position.x = Math.sin(loop) * 0.4;
      g.position.z = Math.cos(loop) * 0.22;
      g.position.y = y + bob + lyft + Math.sin(loop * 2) * 0.1;
      g.rotation.z = Math.sin(loop) * 0.28;
      g.rotation.y = snurr.current > 0 ? t * 7 : Math.sin(t * 0.4 + index) * 0.14;
    } else if (svavar(spec.kropp)) {
      g.position.x = Math.sin(t * 0.35 + index) * 0.12;
      g.position.z = 0;
      g.position.y = y + 0.18 + Math.sin(t * 1.4 + index) * 0.06;
      g.rotation.z = 0;
      g.rotation.y = snurr.current > 0 ? t * 7 : 0.35;
      signal.current.ror = 0;
    } else {
      g.position.x = sim ? Math.cos(t * 0.7 + index) * 0.22 : wx;
      g.position.z = sim ? Math.sin(t * 0.7 + index) * 0.16 : wz;
      g.position.y = y + bob + lyft;
      const yaw = Math.atan2(spx, spz);
      g.rotation.z = 0;
      g.rotation.y = snurr.current > 0 ? t * 7 : yaw * 0.35;
    }
    const gnist = puff.current;
    if (gnist) {
      const syns = age < 0.45;
      gnist.visible = syns;
      if (syns) {
        const u = age / 0.45;
        gnist.scale.setScalar(0.4 + u * 1.4);
        gnist.position.y = 0.4 + u * 0.8;
        for (let i = 0; i < gnist.children.length; i++) {
          const m = gnist.children[i] as THREE.Mesh;
          const mat = m.material as THREE.MeshBasicMaterial;
          mat.opacity = 1 - u;
        }
      }
    }
    const ring = plask.current;
    if (ring) {
      const syns = sim && hopp.current > 0.04;
      ring.visible = syns;
      if (syns) {
        const u = 1 - hopp.current;
        ring.scale.setScalar(0.45 + u * 1.6);
        const mat = ring.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, hopp.current * 0.55);
      }
    }
    if (t % 0.2 < d) {
      g.getWorldPosition(_mal);
      _mal.y += 1.2;
      _mal.project(state.camera);
      const rect = state.gl.domElement.getBoundingClientRect();
      const mal = (window.__tredMal ??= {});
      mal[spec.uid] = {
        x: Math.round(rect.left + ((_mal.x + 1) / 2) * rect.width),
        y: Math.round(rect.top + ((1 - _mal.y) / 2) * rect.height),
      };
    }
  });
  function ned(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    if (upp.current) window.removeEventListener("pointerup", upp.current);
    const sx = e.nativeEvent.clientX;
    const sy = e.nativeEvent.clientY;
    const canvas = e.nativeEvent.target instanceof HTMLElement ? e.nativeEvent.target : null;
    const klar = (ev: PointerEvent) => {
      upp.current = null;
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      if (dx * dx + dy * dy > 24 * 24) return;
      const g = grupp.current;
      if (!g || !canvas) return;
      g.getWorldPosition(_mal);
      _mal.y += 1.2;
      const pos = normDuk(canvas, _mal.project(e.camera));
      klapp.current += 1;
      signal.current.klapp = klapp.current;
      hopp.current = 1;
      kisa.current = 1;
      if (klapp.current >= 2) snurr.current = 1;
      setPuls((n) => n + 1);
      brygga.skicka({
        typ: "tryck",
        uid: spec.uid,
        text: replik(spec, "tryck"),
        x: pos.x,
        y: Math.max(0.2, pos.y - 0.06),
        klapp: klapp.current,
      });
    };
    upp.current = klar;
    window.addEventListener("pointerup", klar, { once: true });
  }
  return (
    <group position={[x, 0, z]} onPointerDown={ned}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <circleGeometry args={[0.55, 12]} />
        <meshBasicMaterial color="#2F4A22" transparent opacity={0.14} />
      </mesh>
      {sim ? (
        <mesh ref={plask} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]} visible={false}>
          <ringGeometry args={[0.32, 0.46, 16]} />
          <meshBasicMaterial color="#E1F5FE" transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ) : null}
      <Hjartan puls={puls} />
      <group ref={puff} visible={false}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[Math.cos(i * 1.2) * 0.35, 0.2, Math.sin(i * 1.2) * 0.35]}>
            <sphereGeometry args={[0.055, 5, 4]} />
            <meshBasicMaterial color={i % 2 === 0 ? "#FFE082" : "#FFFDE7"} transparent opacity={0.9} depthWrite={false} />
          </mesh>
        ))}
      </group>
      <group ref={grupp} position={[0, y, 0]}>
        {harModell(spec.kropp) ? (
          <ModellGren spec={spec}>
            <Suspense fallback={<DjurForm spec={spec} />}>
              <GltfDjur spec={spec} signal={signal} />
            </Suspense>
          </ModellGren>
        ) : spec.kropp === AGG_KROPP ? (
          <OrdAgg spec={spec} />
        ) : (
          <DjurForm spec={spec} />
        )}
        <ReservAgg spec={spec} />
        <DjurEffekter varelse={spec} ankare={ankare} />
      </group>
    </group>
  );
}

const FJARIL: { x: number; z: number; f: string; s: number }[] = [
  { x: -1.2, z: -0.3, f: "#FFB74D", s: 0.7 },
  { x: 1.5, z: 0.5, f: "#F48FB1", s: 0.8 },
  { x: -1.6, z: -0.55, f: "#FFF59D", s: 0.6 },
];

function Fjarilar() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < g.children.length; i++) {
      const b = FJARIL[i];
      const c = g.children[i];
      if (!b || !c) continue;
      c.position.set(
        b.x + Math.sin(t * b.s + i) * 0.45,
        2.15 + Math.sin(t * 2.1 + i * 2) * 0.22,
        b.z + Math.cos(t * b.s * 0.75 + i) * 0.35,
      );
      c.rotation.y = Math.sin(t * b.s + i);
      const ving = Math.sin(t * 14 + i) * 0.4;
      const vanster = c.children[0];
      const hoger = c.children[1];
      if (vanster) vanster.rotation.z = 0.7 + ving;
      if (hoger) hoger.rotation.z = -0.7 - ving;
    }
  });
  return (
    <group ref={ref}>
      {FJARIL.map((b) => (
        <group key={b.f}>
          <mesh position={[-0.08, 0, 0]} rotation={[0.2, 0.2, 0.7]}>
            <coneGeometry args={[0.08, 0.18, 3]} />
            <meshBasicMaterial color={b.f} />
          </mesh>
          <mesh position={[0.08, 0, 0]} rotation={[0.2, -0.2, -0.7]}>
            <coneGeometry args={[0.08, 0.18, 3]} />
            <meshBasicMaterial color={b.f} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Ringar() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < g.children.length; i++) {
      const m = g.children[i] as THREE.Mesh | undefined;
      if (!m) continue;
      const u = (t * 0.33 + i * 0.33) % 1;
      m.scale.set(0.35 + u * 0.9, 0.35 + u * 0.9, 1);
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - u) * 0.5;
    }
  });
  return (
    <group ref={ref} position={[1.12, 0.055, -0.35]} rotation={[-Math.PI / 2, 0, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i}>
          <ringGeometry args={[0.55, 0.64, 20]} />
          <meshBasicMaterial color="#E1F5FE" transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function Nackrosor() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < g.children.length; i++) {
      const c = g.children[i];
      if (c) c.position.y = Math.sin(t * 1.2 + i) * 0.012;
    }
  });
  const pads: [number, number, string, boolean][] = [
    [-0.28, 0.12, "#66BB6A", true],
    [0.22, -0.1, "#7CB342", false],
    [0.02, 0.26, "#66BB6A", false],
    [-0.18, -0.2, "#7CB342", false],
  ];
  return (
    <group ref={ref} position={[1.12, 0.075, -0.35]}>
      {pads.map(([x, z, f, blomma]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh rotation={[-Math.PI / 2, 0, x]}>
            <circleGeometry args={[0.16, 10]} />
            <meshStandardMaterial color={f} roughness={0.85} />
          </mesh>
          {blomma ? (
            <mesh position={[0, 0.05, 0]}>
              <sphereGeometry args={[0.055, 6, 4]} />
              <meshStandardMaterial color="#F48FB1" roughness={0.55} />
            </mesh>
          ) : null}
        </group>
      ))}
    </group>
  );
}

const FLUGOR: [number, number][] = [
  [-1.8, 0.5],
  [-0.3, -1.1],
  [0.7, 1.5],
  [2.0, -0.5],
  [-2.1, -2.2],
  [1.3, -3.0],
];

function Eldflugor({ natt }: { natt: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const syns = natt > 0.35;
    g.visible = syns;
    if (!syns) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < g.children.length; i++) {
      const bas = FLUGOR[i];
      const c = g.children[i] as THREE.Mesh | undefined;
      if (!bas || !c) continue;
      c.position.set(
        bas[0] + Math.sin(t * 0.7 + i) * 0.4,
        0.6 + (i % 3) * 0.22 + Math.sin(t * 1.4 + i * 1.7) * 0.3,
        bas[1] + Math.cos(t * 0.55 + i) * 0.35,
      );
      const mat = c.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.4 + Math.sin(t * 3.2 + i) * 0.4;
    }
  });
  return (
    <group ref={ref} visible={false}>
      {FLUGOR.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.05, 6, 5]} />
          <meshBasicMaterial color="#FFF59D" transparent opacity={0.8} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

const TUVOR: [number, number][] = [
  [-1.7, 0.95],
  [-0.85, 1.15],
  [-1.15, 1.85],
  [-1.55, 1.7],
  [0.75, 1.05],
  [1.55, 1.2],
  [1.05, 1.75],
  [1.6, 1.7],
  [-0.2, 2.15],
  [0.4, 2.35],
];

const STENAR: [number, number, number][] = [[1.7, -0.05, 0.14]];

const MARK_GEO = (() => {
  const g = new THREE.PlaneGeometry(160, 160, 28, 28);
  const pos = g.attributes.position;
  const cols = new Float32Array(pos.count * 3);
  const ljus = new THREE.Color("#A8DE78");
  const mitt = new THREE.Color("#8FD16A");
  const djup = new THREE.Color("#6DBE45");
  const horisont = new THREE.Color("#6E9A78");
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const n = Math.sin(x * 0.33) * Math.cos(y * 0.27) * 0.5 + 0.5;
    tmp.copy(n > 0.66 ? ljus : n > 0.38 ? mitt : djup);
    const far = Math.min(1, Math.hypot(x, y) / 42);
    tmp.lerp(horisont, far * 0.28);
    cols[i * 3] = tmp.r;
    cols[i * 3 + 1] = tmp.g;
    cols[i * 3 + 2] = tmp.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  return g;
})();

function SvajMark({ color, natt }: { color: string; natt: number }) {
  const uTime = useMemo(() => ({ value: 0 }), []);
  const mat = useRef<THREE.MeshToonMaterial>(null);
  const ljus = useRef(new THREE.Color("#ffffff"));
  const mork = useRef(new THREE.Color("#3E5C34"));
  const bland = useRef(new THREE.Color());
  const sag = useRef(false);
  const kompilera = useCallback(
    (shader: { uniforms: Record<string, { value: number }>; vertexShader: string }) => {
      shader.uniforms.uTime = uTime;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uTime;")
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
         float svaj = sin(transformed.x * 0.48 + uTime * 1.05) * cos(transformed.y * 0.4 + uTime * 0.75);
         float nara = 1.0 - clamp(length(transformed.xy) / 16.0, 0.0, 1.0);
         transformed.z += svaj * 0.06 * nara;
        `,
        );
    },
    [uTime],
  );
  useFrame((s) => {
    uTime.value = s.clock.elapsedTime;
    const m = mat.current;
    if (!m) return;
    const ov = sagaNatt(natt);
    if (ov == null) {
      if (sag.current) {
        m.color.set(color);
        sag.current = false;
      }
      return;
    }
    sag.current = true;
    bland.current.copy(ljus.current).lerp(mork.current, Math.min(1, ov * 0.85));
    m.color.copy(bland.current);
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <primitive object={MARK_GEO} attach="geometry" />
      <meshToonMaterial ref={mat} color={color} vertexColors gradientMap={TOON_MAP} onBeforeCompile={kompilera} />
    </mesh>
  );
}

function GrasTuvor() {
  const ref = useRef<THREE.InstancedMesh>(null);
  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < TUVOR.length; i++) {
      const p = TUVOR[i];
      if (!p) continue;
      const svaj = Math.sin(t * 1.2 + i) * 0.18;
      _blomP.set(p[0], 0.16, p[1]);
      _blomE.set(svaj, 0, svaj * 0.65);
      _blomQ.setFromEuler(_blomE);
      const h = 0.85 + (i % 4) * 0.12;
      _blomS.set(0.85, h, 0.85);
      _blomM.compose(_blomP, _blomQ, _blomS);
      mesh.setMatrixAt(i, _blomM);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, TUVOR.length]}>
      <coneGeometry args={[0.16, 0.38, 6]} />
      <meshToonMaterial color="#8BC34A" gradientMap={TOON_MAP} />
    </instancedMesh>
  );
}

function Stenar() {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    STENAR.forEach(([x, z, r], i) => {
      p.set(x, r * 0.45, z);
      e.set(0.2 * i, i * 0.7, 0.15 * i);
      q.setFromEuler(e);
      s.set(r, r * 0.72, r * 0.9);
      m.compose(p, q, s);
      ref.current?.setMatrixAt(i, m);
    });
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, STENAR.length]} castShadow receiveShadow>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#B0BEC5" flatShading roughness={0.95} />
    </instancedMesh>
  );
}

function Ljusflackar() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    TRAD.forEach(([x, z], i) => {
      p.set(x, 0.045, z + 0.5);
      const r = 0.7 + (i % 3) * 0.12;
      s.set(r, r, 1);
      m.compose(p, q, s);
      ref.current?.setMatrixAt(i, m);
    });
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  }, []);
  useFrame((s) => {
    if (mat.current) mat.current.opacity = 0.13 + Math.sin(s.clock.elapsedTime * 0.7) * 0.04;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, TRAD.length]}>
      <circleGeometry args={[1, 10]} />
      <meshBasicMaterial ref={mat} color="#FFF4C2" transparent opacity={0.16} depthWrite={false} />
    </instancedMesh>
  );
}

function Glitter() {
  const geo = useMemo(() => {
    const n = 16;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.2;
      const rad = 0.22 + (i % 5) * 0.18;
      pos[i * 3] = Math.cos(a) * rad;
      pos[i * 3 + 1] = (i % 3) * 0.01;
      pos[i * 3 + 2] = Math.sin(a) * rad * 0.75;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  const ref = useRef<THREE.Points>(null);
  useFrame((s) => {
    const p = ref.current;
    if (!p) return;
    const mat = p.material as THREE.PointsMaterial;
    mat.opacity = 0.25 + Math.abs(Math.sin(s.clock.elapsedTime * 3.2)) * 0.75;
  });
  return (
    <points ref={ref} position={[1.12, 0.12, -0.35]} geometry={geo}>
      <pointsMaterial color="#FFFFFF" size={0.045} transparent opacity={0.85} depthWrite={false} sizeAttenuation />
    </points>
  );
}

function FagelFlyg() {
  const ref = useRef<THREE.Group>(null);
  const vL = useRef<THREE.Mesh>(null);
  const vR = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const cykel = 50;
    const u = t % cykel;
    const syns = u > 4 && u < 14;
    g.visible = syns;
    if (!syns) return;
    const p = (u - 4) / 10;
    g.position.set(-6 + p * 12, 3.7 + Math.sin(p * Math.PI) * 0.45, -3.2);
    g.rotation.y = -Math.PI / 2;
    const flap = Math.sin(t * 14) * 0.7;
    if (vL.current) vL.current.rotation.z = flap;
    if (vR.current) vR.current.rotation.z = -flap;
  });
  return (
    <group ref={ref} visible={false}>
      <mesh>
        <sphereGeometry args={[0.16, 6, 4]} />
        <meshStandardMaterial color="#FFB74D" flatShading />
      </mesh>
      <mesh ref={vL} position={[-0.18, 0, 0]}>
        <boxGeometry args={[0.26, 0.035, 0.12]} />
        <meshStandardMaterial color="#FFE0B2" flatShading />
      </mesh>
      <mesh ref={vR} position={[0.18, 0, 0]}>
        <boxGeometry args={[0.26, 0.035, 0.12]} />
        <meshStandardMaterial color="#FFE0B2" flatShading />
      </mesh>
    </group>
  );
}

function usePennTryck(onTap: () => void) {
  const upp = useRef<((ev: PointerEvent) => void) | null>(null);
  const tap = useRef(onTap);
  tap.current = onTap;
  useEffect(() => {
    return () => {
      if (upp.current) window.removeEventListener("pointerup", upp.current);
    };
  }, []);
  return (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (upp.current) window.removeEventListener("pointerup", upp.current);
    const sx = e.nativeEvent.clientX;
    const sy = e.nativeEvent.clientY;
    const klar = (ev: PointerEvent) => {
      upp.current = null;
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      if (dx * dx + dy * dy > 24 * 24) return;
      tap.current();
    };
    upp.current = klar;
    window.addEventListener("pointerup", klar, { once: true });
  };
}

function Hanglas({ gung }: { gung: { current: number } }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    const g = ref.current;
    const tid = gung.current;
    if (!g || tid == null) return;
    const d = Math.min(delta, 0.1);
    if (tid > 0) gung.current = Math.max(0, tid - d);
    const kvar = gung.current ?? 0;
    g.rotation.z = Math.sin((1 - kvar) * Math.PI * 6) * kvar * 0.85;
    const p = 1 + Math.sin(state.clock.elapsedTime * 2.3) * 0.08;
    g.scale.setScalar(p);
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 0.07, 0]}>
        <torusGeometry args={[0.07, 0.02, 5, 8, Math.PI]} />
        <meshStandardMaterial color="#F2B632" metalness={0.35} roughness={0.35} flatShading />
      </mesh>
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[0.12, 0.11, 0.05]} />
        <meshStandardMaterial color="#E6B325" roughness={0.4} flatShading />
      </mesh>
    </group>
  );
}

function Rok() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < g.children.length; i++) {
      const m = g.children[i] as THREE.Mesh | undefined;
      if (!m) continue;
      const u = (t * 0.18 + i * 0.34) % 1;
      m.position.set(0.15 + Math.sin(t * 0.55 + i) * u * 0.28, 1.7 + u * 2.1, 0.85);
      const s = 0.16 + u * 0.55;
      m.scale.setScalar(s);
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - u) * 0.62;
    }
  });
  return (
    <group ref={ref} raycast={() => null}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} scale={0.05} position={[0.38, 1.7, 0]}>
          <sphereGeometry args={[1, 6, 4]} />
          <meshBasicMaterial color="#F7FBFF" transparent opacity={0.2} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function SpokHus({ onSnart }: { onSnart: () => void }) {
  const hus = useRef<THREE.Group>(null);
  const glas = useRef<THREE.MeshBasicMaterial>(null);
  const gung = useRef(0);
  const former = useMemo(() => {
    const vaggar = new THREE.BoxGeometry(1.25, 0.95, 1.05);
    const tak = new THREE.ConeGeometry(0.98, 0.62, 4);
    const kant = new THREE.BoxGeometry(1, 1, 1);
    const acc = new THREE.BufferGeometry();
    const delar: THREE.BufferGeometry[] = [];
    const bx = 1.25;
    const by = 0.95;
    const bz = 1.05;
    const t = 0.045;
    const balk = (x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
      const g = kant.clone();
      g.scale(sx, sy, sz);
      g.translate(x, y, z);
      delar.push(g);
    };
    const y0 = -by / 2;
    const y1 = by / 2;
    for (const [x, z] of [[-bx / 2, -bz / 2], [bx / 2, -bz / 2], [-bx / 2, bz / 2], [bx / 2, bz / 2]] as [number, number][]) {
      balk(x, 0, z, t, by, t);
    }
    for (const y of [y0, y1]) {
      balk(0, y, -bz / 2, bx, t, t);
      balk(0, y, bz / 2, bx, t, t);
      balk(-bx / 2, y, 0, t, t, bz);
      balk(bx / 2, y, 0, t, t, bz);
    }
    const merged = mergeGeometries(delar, false) ?? acc;
    return { vaggar, tak, kant: merged };
  }, []);
  const ned = usePennTryck(() => {
    gung.current = 1;
    onSnart();
  });
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (hus.current) {
      const s = 1 + Math.sin(t * 1.4) * 0.03;
      hus.current.scale.setScalar(s);
    }
    if (glas.current) glas.current.opacity = 0.32 + Math.sin(t * 1.3) * 0.06;
    if (t % 0.2 < 0.05) {
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
    }
  });
  return (
    <group name="spokhus" position={[2.15, 0, -1.7]} scale={1.05} onPointerDown={ned}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0.05]}>
        <circleGeometry args={[1.15, 16]} />
        <meshToonMaterial color="#C4A574" gradientMap={TOON_MAP} />
      </mesh>
      <group ref={hus}>
        <mesh geometry={former.vaggar} position={[0, 0.58, 0]}>
          <meshBasicMaterial ref={glas} color="#D6ECFF" transparent opacity={0.35} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={former.kant} position={[0, 0.58, 0]}>
          <meshBasicMaterial color="#F7FBFF" toneMapped={false} />
        </mesh>
        <mesh geometry={former.tak} position={[0, 1.28, 0]} rotation={[0, Math.PI / 4, 0]}>
          <meshBasicMaterial color="#E3F2FD" transparent opacity={0.35} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0.38, 1.55, 0]}>
          <boxGeometry args={[0.16, 0.32, 0.16]} />
          <meshBasicMaterial color="#EAF6FF" transparent opacity={0.45} />
        </mesh>
      </group>
      <Rok />
      <mesh position={[-0.78, 0.36, 0.4]}>
        <boxGeometry args={[0.08, 0.55, 0.08]} />
        <meshToonMaterial color="#8D6E63" gradientMap={TOON_MAP} />
      </mesh>
      <mesh position={[-0.78, 0.7, 0.42]}>
        <boxGeometry args={[0.32, 0.22, 0.06]} />
        <meshToonMaterial color="#A1887F" gradientMap={TOON_MAP} />
      </mesh>
      <group position={[-0.78, 0.7, 0.5]} scale={1.15}>
        <Hanglas gung={gung} />
      </group>
    </group>
  );
}

function Skogsstig({ onSnart }: { onSnart: () => void }) {
  const gung = useRef(0);
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
      <group name="grind" position={[-0.7, 0, -2.15]} scale={1.05} onPointerDown={ned}>
        <mesh position={[-0.38, 0.32, 0]}>
          <boxGeometry args={[0.09, 0.64, 0.09]} />
          <meshStandardMaterial color="#8D6E63" flatShading />
        </mesh>
        <mesh position={[0.38, 0.32, 0]}>
          <boxGeometry args={[0.09, 0.64, 0.09]} />
          <meshStandardMaterial color="#8D6E63" flatShading />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.86, 0.07, 0.07]} />
          <meshStandardMaterial color="#A1887F" flatShading />
        </mesh>
        <mesh position={[0, 0.26, 0]}>
          <boxGeometry args={[0.86, 0.07, 0.07]} />
          <meshStandardMaterial color="#A1887F" flatShading />
        </mesh>
        <mesh position={[0, 0.4, 0.08]}>
          <boxGeometry args={[1.15, 0.9, 0.3]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        <group position={[0, 0.38, 0.1]} scale={0.9}>
          <Hanglas gung={gung} />
        </group>
      </group>
    </group>
  );
}

const KAM: readonly (readonly number[])[] = [
  [0, 0.1, 5.5, 8.5, 0, 2.5, 0.2],
  [2.2, 0, 4.5, 8.2, 0, 2.15, 0.45],
  [8.2, 0, 4.7, 8.6, 0, 1.85, 0.55],
  [9.3, 0.08, 4.1, 7.4, 0.1, 1.55, 1.05],
  [12.25, 0, 4.15, 9.8, 0, 1.05, -0.15],
  [15.2, 0, 4.15, 9.8, 0, 1.05, -0.15],
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

type OrbitStyr = { enabled: boolean; target: THREE.Vector3; update: () => void };

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

function SagaKamera({ styr }: { styr: { current: OrbitStyr | null } }) {
  const was = useRef(false);
  const pos = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3());
  useFrame((state) => {
    const cam = state.camera;
    const c = styr.current;
    if (!sagaNu.aktiv) {
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
    kameraVid(sagaNu.t, pos.current, look.current);
    cam.position.copy(pos.current);
    cam.lookAt(look.current);
    if (c) c.target.copy(look.current);
  }, -2);
  return null;
}

function SagaLjus({
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

function SagaPenna() {
  const g = useRef<THREE.Group>(null);
  const ljus = useRef<THREE.PointLight>(null);
  useFrame(() => {
    const p = g.current;
    if (!p) return;
    const t = sagaNu.t;
    const syns = sagaNu.aktiv && t < 9.15;
    p.visible = syns;
    if (ljus.current) ljus.current.intensity = syns ? 1.6 : 0;
    if (!syns) return;
    let x = 0;
    let y = 2.2;
    let z = 0.9;
    let rot = -0.4;
    if (t < 1.9) {
      const u = t / 1.9;
      x = -2.2 + u * 2.2;
      y = 3.35 - u * 1.15 + Math.sin(u * Math.PI) * 0.28;
      z = 1.8 - u * 0.9;
      rot = -0.85 + u * 0.4;
    } else if (t < 8.35) {
      const w = t - 1.9;
      x = Math.sin(w * 6.5) * 0.07;
      y = 2.12 + Math.sin(w * 10) * 0.035;
      z = 0.95;
      rot = -0.42 + Math.sin(w * 8) * 0.07;
    } else {
      const u = Math.min(1, (t - 8.35) / 0.8);
      x = u * 1.4;
      y = 2.12 + u * 2;
      z = 0.95 - u * 0.3;
      rot = -0.42 - u * 0.7;
    }
    p.position.set(x, y, z);
    p.rotation.set(0, 0.2, rot);
  });
  return (
    <group ref={g} visible={false}>
      <mesh rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.085, 1.05, 6]} />
        <meshStandardMaterial color="#F48FB1" flatShading emissive="#F48FB1" emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[0, -0.42, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.08, 6]} />
        <meshStandardMaterial color="#FFD54F" flatShading />
      </mesh>
      <mesh position={[0, -0.62, 0]}>
        <coneGeometry args={[0.09, 0.32, 5]} />
        <meshStandardMaterial color="#FFD54F" flatShading emissive="#FFE082" emissiveIntensity={0.45} />
      </mesh>
      <pointLight ref={ljus} position={[0, -0.7, 0.2]} color="#FFE082" intensity={0} distance={7} />
    </group>
  );
}

function SagaBoll() {
  const g = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const m = g.current;
    if (!m) return;
    const t = sagaNu.t;
    const syns = sagaNu.aktiv && t >= 8.15 && t < 9.15;
    m.visible = syns;
    if (!syns) return;
    const u = (t - 8.15) / 0.6;
    const s = u < 0.45 ? u / 0.45 : Math.max(0, 1 - (u - 0.45) / 0.55);
    m.scale.setScalar(0.25 + s * 1.15);
    m.position.set(0.1, 1.85, 1.15);
  });
  return (
    <mesh ref={g} visible={false}>
      <sphereGeometry args={[0.48, 14, 12]} />
      <meshBasicMaterial color="#FFF4C4" transparent opacity={0.95} />
    </mesh>
  );
}

function SagaKanin() {
  const rot = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = rot.current;
    if (!g) return;
    const syns = sagaNu.aktiv && sagaNu.t >= 8.6 && sagaNu.fas >= 3 && sagaNu.fas < 5;
    g.visible = syns;
    if (!syns) return;
    const t = sagaNu.t;
    if (t < 9.35) {
      const u = Math.min(1, Math.max(0, (t - 8.6) / 0.35));
      const s = u * u * (3 - 2 * u);
      g.scale.setScalar(s);
      g.position.set(0.1, 1.35, 1.15);
      g.rotation.set(0, 0.2, Math.sin((t - 8.9) * 11) * 0.28);
      return;
    }
    const u = Math.min(1, Math.max(0, (t - 9.35) / 2.55));
    const hopp = Math.abs(Math.sin(u * Math.PI * 2)) * (1 - u) * 0.85;
    g.scale.setScalar(1);
    g.position.set(0.1, 1.35 * (1 - u) + hopp, 1.15 + (2.05 - 1.15) * u);
    g.rotation.set(0, 0.1, Math.sin(t * 8) * 0.08);
  });
  return (
    <group ref={rot} visible={false} raycast={() => null}>
      <Suspense fallback={<DjurForm spec={SAGA_KANIN} />}>
        <GltfDjur spec={SAGA_KANIN} signal={SAGA_SIGNAL} />
      </Suspense>
    </group>
  );
}

const HIMMEL_VERT = `
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const HIMMEL_FRAG = `
uniform vec3 uTop;
uniform vec3 uHor;
varying vec3 vDir;
void main() {
  float h = normalize(vDir).y;
  float k = smoothstep(-0.55, 0.35, h);
  gl_FragColor = vec4(mix(uHor, uTop, k), 1.0);
}
`;

function Himmel({ natt }: { natt: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  const dagTop = useMemo(() => new THREE.Color("#7EC8F2"), []);
  const dagHor = useMemo(() => new THREE.Color("#A9CDE6"), []);
  const nattTop = useMemo(() => new THREE.Color("#1A2344"), []);
  const nattHor = useMemo(() => new THREE.Color("#3A4A72"), []);
  const top = useRef(new THREE.Color("#7EC8F2"));
  const hor = useRef(new THREE.Color("#A9CDE6"));
  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color("#7EC8F2") },
      uHor: { value: new THREE.Color("#A9CDE6") },
    }),
    [],
  );
  useFrame(({ camera }) => {
    const m = mesh.current;
    if (m) m.position.copy(camera.position);
    const t = Math.min(1, sagaNatt(natt) ?? natt);
    top.current.copy(dagTop).lerp(nattTop, t);
    hor.current.copy(dagHor).lerp(nattHor, t);
    uniforms.uTop.value.copy(top.current);
    uniforms.uHor.value.copy(hor.current);
  });
  return (
    <mesh ref={mesh} renderOrder={-1} frustumCulled={false} raycast={() => null}>
      <sphereGeometry args={[28, 18, 12]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        vertexShader={HIMMEL_VERT}
        fragmentShader={HIMMEL_FRAG}
        uniforms={uniforms}
      />
    </mesh>
  );
}

function Horisont() {
  const trad = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = trad.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    const platser: [number, number, number][] = [
      [-4.2, 1.15, -6.15],
      [-2.4, 1.45, -6.2],
      [-0.6, 1.25, -6.1],
      [1.6, 1.5, -6.25],
      [3.4, 1.2, -6.15],
      [5.1, 0.95, -6.3],
    ];
    platser.forEach(([x, y, z], i) => {
      p.set(x, y, z);
      s.set(0.55, 0.9 + (i % 3) * 0.15, 0.55);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <group>
      <mesh position={[0, 0, -10.6]} scale={[24, 3.6, 1]}>
        <circleGeometry args={[1, 14, 0, Math.PI]} />
        <meshBasicMaterial color="#8FB4C6" />
      </mesh>
      <mesh position={[0, 0, -8.3]} scale={[18, 2.7, 1]}>
        <circleGeometry args={[1, 16, 0, Math.PI]} />
        <meshBasicMaterial color="#7E9E92" />
      </mesh>
      <mesh position={[0, 0, -6.35]} scale={[13, 2.15, 1]}>
        <circleGeometry args={[1, 18, 0, Math.PI]} />
        <meshBasicMaterial color="#3F6E34" />
      </mesh>
      <instancedMesh ref={trad} args={[undefined, undefined, 6]}>
        <coneGeometry args={[0.45, 1.3, 5]} />
        <meshBasicMaterial color="#2C5228" />
      </instancedMesh>
    </group>
  );
}

function Forgrund() {
  const buske = useRef<THREE.InstancedMesh>(null);
  const svamp = useRef<THREE.InstancedMesh>(null);
  const sten = useRef<THREE.InstancedMesh>(null);
  const blom = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    const buskar: [number, number, number, number][] = [
      [-1.85, 0.22, 2.55, 0.42],
      [-1.45, 0.16, 2.85, 0.3],
      [1.75, 0.2, 2.7, 0.4],
      [1.35, 0.14, 3.05, 0.26],
      [-0.55, 0.12, 3.15, 0.22],
    ];
    buskar.forEach(([x, y, z, r], i) => {
      p.set(x, y, z);
      s.set(r * 1.3, r, r);
      m.compose(p, q, s);
      buske.current?.setMatrixAt(i, m);
    });
    if (buske.current) buske.current.instanceMatrix.needsUpdate = true;
    const svampar: [number, number, number][] = [
      [0.95, 0.08, 2.55],
      [1.2, 0.07, 2.9],
      [0.7, 0.06, 2.85],
    ];
    svampar.forEach(([x, y, z], i) => {
      p.set(x, y, z);
      s.set(0.16, 0.1, 0.16);
      m.compose(p, q, s);
      svamp.current?.setMatrixAt(i, m);
    });
    if (svamp.current) svamp.current.instanceMatrix.needsUpdate = true;
    const stigar: [number, number][] = [
      [0.05, 3.25],
      [0.22, 2.85],
      [0.4, 2.45],
      [0.55, 2.05],
      [0.7, 1.65],
      [0.82, 1.25],
      [0.95, 0.9],
    ];
    stigar.forEach(([x, z], i) => {
      p.set(x, 0.04, z);
      s.set(0.22, 0.06, 0.16);
      m.compose(p, q, s);
      sten.current?.setMatrixAt(i, m);
    });
    if (sten.current) sten.current.instanceMatrix.needsUpdate = true;
    const rabatt: [number, number, string][] = [
      [-0.95, 2.35, "#F48FB1"],
      [-0.7, 2.55, "#FDD835"],
      [-1.15, 2.6, "#CE93D8"],
      [-0.85, 2.75, "#FFFFFF"],
      [-0.5, 2.4, "#F48FB1"],
    ];
    const col = new THREE.Color();
    rabatt.forEach(([x, z, f], i) => {
      p.set(x, 0.1, z);
      s.set(0.12, 0.1, 0.12);
      m.compose(p, q, s);
      blom.current?.setMatrixAt(i, m);
      blom.current?.setColorAt(i, col.set(f));
    });
    if (blom.current) {
      blom.current.instanceMatrix.needsUpdate = true;
      if (blom.current.instanceColor) blom.current.instanceColor.needsUpdate = true;
    }
  }, []);
  return (
    <group>
      <instancedMesh ref={buske} args={[undefined, undefined, 5]}>
        <sphereGeometry args={[1, 7, 5]} />
        <meshToonMaterial color="#43A047" gradientMap={TOON_MAP} />
      </instancedMesh>
      <instancedMesh ref={svamp} args={[undefined, undefined, 3]}>
        <sphereGeometry args={[1, 7, 5]} />
        <meshToonMaterial color="#E57373" gradientMap={TOON_MAP} />
      </instancedMesh>
      <instancedMesh ref={sten} args={[undefined, undefined, 7]}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshToonMaterial color="#B0A090" gradientMap={TOON_MAP} />
      </instancedMesh>
      <instancedMesh ref={blom} args={[undefined, undefined, 5]}>
        <sphereGeometry args={[1, 6, 5]} />
        <meshToonMaterial vertexColors gradientMap={TOON_MAP} />
      </instancedMesh>
    </group>
  );
}

function KameraRam({ styr }: { styr: { current: OrbitStyr | null } }) {
  const lage = useRef("");
  useFrame(({ camera, size }) => {
    if (sagaNu.aktiv) {
      lage.current = "";
      return;
    }
    const land = size.width > size.height + 40;
    const ny = land ? "land" : "sta";
    if (lage.current === ny) return;
    lage.current = ny;
    const cam = camera as THREE.PerspectiveCamera;
    if (land) {
      cam.fov = 46;
      cam.position.set(0, 3.9, 8.6);
    } else {
      cam.fov = 58;
      cam.position.set(0, 4.15, 9.8);
    }
    cam.updateProjectionMatrix();
    cam.lookAt(0, 1.05, -0.15);
    const c = styr.current;
    if (c) {
      c.target.set(0, 1.05, -0.15);
      c.update();
    }
  });
  return null;
}

function Scen({ natt, onSnart, saga }: { natt: number; onSnart: () => void; saga: boolean }) {
  const djur = useMinne((s) => s.ang);
  const garden = useMinne((s) => s.garden);
  const vis = saga ? 0 : 0 * natt;
  const himmel = "#7EC8F2";
  const mark = "#ffffff";
  const amb = useRef<THREE.AmbientLight>(null);
  const hem = useRef<THREE.HemisphereLight>(null);
  const dir = useRef<THREE.DirectionalLight>(null);
  const sol = useRef<THREE.MeshBasicMaterial>(null);
  const fyll = useRef<THREE.DirectionalLight>(null);
  const kantL = useRef<THREE.DirectionalLight>(null);
  const styr = useRef<OrbitStyr>(null);
  return (
    <>
      <color attach="background" args={[himmel]} />
      <fog attach="fog" args={["#C5D5E0", 28, 55]} />
      <Himmel natt={vis} />
      <ambientLight ref={amb} intensity={0.15} color="#fff6ea" />
      <hemisphereLight ref={hem} args={["#dff3ff", "#a8c97a", 2.4]} />
      <directionalLight
        ref={dir}
        color="#fff1dc"
        position={[3, 6, 5]}
        intensity={2.6}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={28}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <directionalLight ref={fyll} color="#cfe6ff" position={[-6, 3, 4]} intensity={0.9} />
      <directionalLight ref={kantL} color="#ffffff" position={[-2, 4, -5]} intensity={1.2} />
      <SagaLjus natt={vis} amb={amb} hem={hem} dir={dir} sol={sol} fyll={fyll} kant={kantL} />
      <mesh position={[-1.5, 5.5, -6]}>
        <sphereGeometry args={[0.42, 8, 6]} />
        <meshBasicMaterial ref={sol} color="#FFE082" />
      </mesh>
      <Moln position={[-2.2, 5.6, -8]} fart={0.016} />
      <Moln position={[0.4, 6.2, -9]} fart={0.02} />
      <Moln position={[2.4, 5.5, -7.5]} fart={0.014} />
      <Moln position={[-0.6, 4.9, -6]} fart={0.018} />
      <Moln position={[1.6, 6.6, -10]} fart={0.012} />
      <FagelFlyg />
      <SvajMark color={mark} natt={vis} />
      <Horisont />
      <NaturGren>
        <Suspense fallback={null}>
          <KenneyNatur />
        </Suspense>
      </NaturGren>
      <Ljusflackar />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.12, 0.02, -0.35]}>
        <circleGeometry args={[0.72, 20]} />
        <meshStandardMaterial color="#4FC3E8" roughness={0.22} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.12, 0.03, -0.35]}>
        <ringGeometry args={[0.64, 0.76, 20]} />
        <meshBasicMaterial color="#B3E5FC" side={THREE.DoubleSide} />
      </mesh>
      <Ringar />
      <Glitter />
      <Fjarilar />
      <Eldflugor natt={vis} />
      <SpokHus onSnart={onSnart} />
      <Skogsstig onSnart={onSnart} />
      {garden.map((b) => (
        <Byggnad key={b.uid} b={b} />
      ))}
      {djur.map((spec) => (
        <DjurIScen key={spec.uid} spec={spec} alla={djur} />
      ))}
      <Sond />
      <SagaPenna />
      <SagaBoll />
      <SagaKanin />
      <OrbitControls
        ref={styr as never}
        enabled={!saga}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={1.42}
        minPolarAngle={1.1}
        minAzimuthAngle={-1.05}
        maxAzimuthAngle={1.05}
        minDistance={6}
        maxDistance={14}
        target={[0, 1.05, -0.15]}
        rotateSpeed={0.7}
        zoomSpeed={0.75}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
      />
      <SagaKamera styr={styr} />
      <KameraRam styr={styr} />
    </>
  );
}

export function Angen3D({ natt, saga = false }: { natt: number; saga?: boolean }) {
  const djur = useMinne((s) => s.ang);
  const garden = useMinne((s) => s.garden);
  const dragit = useMinne((s) => s.dragit);
  const [prat, setPrat] = useState(false);
  const dolj = useRef<number | null>(null);
  const rot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    return () => {
      if (dolj.current) window.clearTimeout(dolj.current);
    };
  }, []);
  useEffect(() => {
    const el = rot.current;
    if (!el) return;
    let aktiv = false;
    let sx = 0;
    let sy = 0;
    const ned = (e: PointerEvent) => {
      aktiv = true;
      sx = e.clientX;
      sy = e.clientY;
    };
    const flytta = (e: PointerEvent) => {
      if (!aktiv || useMinne.getState().dragit) return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (dx * dx + dy * dy > 24 * 24) {
        aktiv = false;
        useMinne.getState().sattTittat();
      }
    };
    const upp = () => {
      aktiv = false;
    };
    el.addEventListener("pointerdown", ned);
    window.addEventListener("pointermove", flytta);
    window.addEventListener("pointerup", upp);
    window.addEventListener("pointercancel", upp);
    return () => {
      el.removeEventListener("pointerdown", ned);
      window.removeEventListener("pointermove", flytta);
      window.removeEventListener("pointerup", upp);
      window.removeEventListener("pointercancel", upp);
    };
  }, []);
  const onSnart = useCallback(() => {
    setPrat(true);
    if (dolj.current) window.clearTimeout(dolj.current);
    dolj.current = window.setTimeout(() => setPrat(false), 2400);
  }, []);
  return (
    <div ref={rot} className="angen-3d" data-testid="angen-3d" data-djur={djur.length} data-byggen={garden.length} data-saga={saga ? "ja" : "nej"}>
      {!saga && !dragit ? (
        <p className="tred-hint" data-testid="tred-hint">
          {HINT}
        </p>
      ) : null}
      {prat ? (
        <p className="teaser-bubbla" data-testid="kommer-snart">
          {SNART}
        </p>
      ) : null}
      <div className="ladd-3d" data-testid="ladd-3d">
        <h1>Trollpennan</h1>
        <span className="ladd-penna" aria-hidden />
      </div>
      <TredGren>
        <Canvas
          camera={{ position: [0, 4.15, 9.8], fov: 58, near: 0.1, far: 90 }}
          dpr={[1, 2]}
          shadows
          gl={{ antialias: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1 }}
          onCreated={({ gl }) => {
            gl.shadowMap.type = THREE.PCFShadowMap;
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                rot.current?.querySelector("[data-testid='ladd-3d']")?.setAttribute("data-klar", "ja");
              });
            });
          }}
        >
          <Scen natt={natt} onSnart={onSnart} saga={saga} />
        </Canvas>
      </TredGren>
    </div>
  );
}
