import { Component, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Sparad } from "../brygga.ts";
import type { DjurSignal } from "../gltfDjur.tsx";
import { byggPack, forma } from "../djurmesh.ts";
import { arSak } from "../entiteter.ts";
import { faestTillbehor, procAnkare } from "../tillbehor/index.ts";
import { monteraLargoDel } from "../tillbehor/largo.ts";
import { AnsiktsUttryck } from "../tillbehor/AnsiktsUttryck.tsx";
import { MILJO } from "../miljo.ts";
import { djurFarg } from "./delat.ts";

function pausaAnim(): boolean {
  return typeof window !== "undefined" && window.__PAUSE_ANIM === true;
}

function StjarnPuff() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (g.current) g.current.position.y = Math.sin(clock.elapsedTime * 1.6) * 0.06; });
  return (
    <group ref={g}>
      <mesh><sphereGeometry args={[0.16, 10, 8]} /><meshStandardMaterial color="#F2B632" emissive="#FFE082" emissiveIntensity={0.35} roughness={0.5} /></mesh>
      {[0, 1, 2, 3].map((i) => <mesh key={i} position={[Math.cos(i * 1.5708) * 0.28, 0.05, Math.sin(i * 1.5708) * 0.28]}><sphereGeometry args={[0.09, 8, 6]} /><meshStandardMaterial color="#FFF6E5" roughness={0.7} /></mesh>)}
    </group>
  );
}

export class ModellGren extends Component<{ spec: Sparad; children: ReactNode }, { fel: boolean }> {
  state = { fel: false };
  componentDidCatch() {
    window.dispatchEvent(new CustomEvent("trollpennan:model-fallback", { detail: { kropp: this.props.spec.kropp } }));
  }
  static getDerivedStateFromError() { return { fel: true }; }
  render() {
    if (!this.state.fel) return this.props.children;
    return arSak(this.props.spec.kropp) ? <StjarnPuff /> : <DjurForm spec={this.props.spec} />;
  }
}

export const TOON_MAP = (() => {
  const data = new Uint8Array([124, 172, 218, 255]);
  const t = new THREE.DataTexture(data, 4, 1, THREE.RedFormat);
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  t.colorSpace = THREE.NoColorSpace;
  t.needsUpdate = true;
  return t;
})();
const KONTUR_MAT = new THREE.MeshBasicMaterial({ color: MILJO.kontur.farg, side: THREE.BackSide });

export function Formdel({ geo, color, position, scale, rotation, kontur = true, skugga = false, glans = false }: {
  geo: THREE.BufferGeometry; color: string; position?: [number, number, number]; scale?: [number, number, number];
  rotation?: [number, number, number]; kontur?: boolean; skugga?: boolean; glans?: boolean;
}) {
  const mat = useMemo(() => new THREE.MeshToonMaterial({ color, gradientMap: TOON_MAP, emissive: glans ? "#FFE082" : "#000000", emissiveIntensity: glans ? 0.45 : 0 }), [color, glans]);
  useEffect(() => () => mat.dispose(), [mat]);
  return (
    <group position={position} scale={scale} rotation={rotation}>
      <mesh geometry={geo} material={mat} castShadow={skugga} />
      {kontur ? <mesh geometry={geo} material={KONTUR_MAT} scale={1.06} /> : null}
    </group>
  );
}

const KROPP_MAT = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: TOON_MAP });
const OGA_MAT = new THREE.MeshBasicMaterial({ vertexColors: true });

export function DjurForm({ spec, signal, index = 0 }: { spec: Sparad; signal?: { current: DjurSignal }; index?: number }) {
  const farg = djurFarg(spec);
  const pack = useMemo(() => byggPack({ kropp: spec.kropp, farg, krona: false, horn: false, monster: Boolean(spec.monster), monsterFarg: spec.monsterfarg ?? "#6D4C41" }), [farg, spec]);
  const extra = useMemo(() => { const g = new THREE.Group(); faestTillbehor(g, spec.kropp, spec.tillbehor); monteraLargoDel(g, spec, g.userData.ankare); return g; }, [spec]);
  const mat = useMemo(() => spec.glans ? new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: TOON_MAP, emissive: "#FFE082", emissiveIntensity: 0.4 }) : KROPP_MAT, [spec.glans]);
  const rok = useRef<THREE.Mesh>(null);
  const andas = useRef<THREE.Group>(null);
  useEffect(() => () => { pack.geo.dispose(); pack.outline.dispose(); pack.ogon.dispose(); if (mat !== KROPP_MAT) mat.dispose(); }, [pack, mat]);
  useFrame((state) => {
    const a = andas.current;
    if (pausaAnim()) { if (a) a.scale.set(1, 1, 1); return; }
    const t = state.clock.elapsedTime;
    forma(pack, t, spec.kropp);
    if (a) a.scale.set(1, 1 + Math.sin(t * 1.7) * 0.03, 1);
    const r = rok.current;
    if (!r) return;
    const cykel = t % 6.5;
    const syns = spec.kropp === "drake" && cykel > 4.6 && cykel < 5.7;
    r.visible = syns;
    if (!syns) return;
    const u = (cykel - 4.6) / 1.1;
    r.position.set(0.08, 0.95 + u * 0.45, 1.05);
    r.scale.setScalar(0.04 + u * 0.16);
    (r.material as THREE.MeshBasicMaterial).opacity = (1 - u) * 0.55;
  });
  return (
    <group ref={andas}>
      <mesh geometry={pack.outline} material={KONTUR_MAT} renderOrder={1} />
      <mesh geometry={pack.geo} material={mat} castShadow renderOrder={2} />
      <mesh geometry={pack.ogon} material={OGA_MAT} renderOrder={3} />
      <AnsiktsUttryck ankare={procAnkare(spec.kropp)} signal={signal} index={index} />
      <primitive object={extra} />
      {spec.kropp === "drake" ? (
        <mesh ref={rok} visible={false}><sphereGeometry args={[1, 6, 5]} /><meshBasicMaterial color="#F7FBFF" transparent opacity={0.4} depthWrite={false} /></mesh>
      ) : null}
    </group>
  );
}

