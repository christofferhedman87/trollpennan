import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { brygga, type Sparad } from "../brygga.ts";
import type { Plats } from "../platser.ts";
import { byggPack, forma } from "../djurmesh.ts";
import { replik } from "../replik.ts";
import { ljud } from "../ljud.ts";
import { GltfDjur, GltfSak, harModell, type DjurSignal } from "../gltfDjur.tsx";
import { arSak, hoppHojd, malhojd, svavar } from "../entiteter.ts";
import { faestTillbehor, procAnkare } from "../tillbehor/index.ts";
import { DjurEffekter } from "../effekter.tsx";
import { MILJO } from "../miljo.ts";
import { synligKedja } from "../pekare.ts";
import { AGG_KROPP, OrdAgg, ReservAgg } from "../ordagg.tsx";
import { _mal, djurFarg, djurPlats, flygare, normDuk, simmare } from "./delat.ts";

export class ModellGren extends Component<{ spec: Sparad; children: ReactNode }, { fel: boolean }> {
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

export const TOON_MAP = (() => {
  const data = new Uint8Array([72, 158, 255]);
  const t = new THREE.DataTexture(data, 3, 1, THREE.RedFormat);
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  t.colorSpace = THREE.NoColorSpace;
  t.needsUpdate = true;
  return t;
})();
const KONTUR_MAT = new THREE.MeshBasicMaterial({ color: MILJO.kontur.farg, side: THREE.BackSide });

export function Formdel({
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

export function DjurForm({ spec }: { spec: Sparad }) {
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



export function Hjartan({ puls }: { puls: number }) {
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

export function DjurIScen({ spec, alla, plats }: { spec: Sparad; alla: Sparad[]; plats?: Plats }) {
  const [x, y, z] = djurPlats(spec, alla, plats);
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
  const sak = arSak(spec.kropp);
  const medSaker = spec.tillbehor.map((t) => t.id).filter((id) => id !== spec.kropp && arSak(id));
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
    } else if (sak) {
      // R3G: en sak står still (bara pop och hopp när barnet trycker).
      g.position.x = 0;
      g.position.z = 0;
      g.position.y = y + lyft;
      g.rotation.z = 0;
      g.rotation.y = snurr.current > 0 ? t * 7 : 0;
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
    // R9H: osynlig träff (puff/plask) → låt nästa, närmaste synliga djur ta trycket
    if (!synligKedja(e.object)) return;
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
            <Suspense fallback={sak ? null : <DjurForm spec={spec} />}>
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
      {medSaker.map((id, i) => (
        <group key={id} position={[(0.45 + malhojd(spec.kropp) * 0.35) * (i % 2 === 0 ? 1 : -1) * (spec.skala || 1), 0, 0.2 + Math.floor(i / 2) * 0.3]}>
          <ModellGren spec={{ ...spec, kropp: id }}>
            <Suspense fallback={null}>
              <GltfSak id={id} />
            </Suspense>
          </ModellGren>
        </group>
      ))}
    </group>
  );
}
