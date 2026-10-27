import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { brygga, type Sparad } from "../brygga.ts";
import type { Plats } from "../platser.ts";
import { byggPack, forma } from "../djurmesh.ts";
import { replik } from "../replik.ts";
import { ljud } from "../ljud.ts";
import { GltfDjur, GltfSak, squashSkala, type DjurSignal } from "../gltfDjur.tsx";
import { arPlagg, arSak, fotKant, harDjurGltf, hoppHojd, malhojd, svavar, takSkala } from "../entiteter.ts";
import { regelFor, ritSkala } from "../placering.ts";
import { faestTillbehor, procAnkare } from "../tillbehor/index.ts";
import { bollOffset, largoSkala, monteraLargoDel, rapportPos, skuttBeslut } from "../tillbehor/largo.ts";
import { AnsiktsUttryck, sattUttryck } from "../tillbehor/AnsiktsUttryck.tsx";
import { useMinne } from "../minne.ts";
import { DjurEffekter } from "../effekter.tsx";
import { MILJO } from "../miljo.ts";
import { synligKedja } from "../pekare.ts";
import { AGG_KROPP, OrdAgg, ReservAgg } from "../ordagg.tsx";
import { HumorIkon } from "./humorIkon.tsx";
import { Ljusken } from "./ljusken.tsx";
import type { Ljuskalla } from "../ljuskalla.ts";
import { _mal, djurFarg, djurIStall, djurKrymp, djurPlats, djurVand, flygare, normDuk, PLATTFORM_SAKER, simmare, synMatt } from "./delat.ts";
import { sakLage } from "../landning.ts";
import { torrKropp } from "../platsYta.ts";
import { malTillDuk } from "../ui/hjalp.ts";
import { SolstjarnaPlopp } from "../solstjarna.ts";
import { frigoraKontaktSkugga, skapaKontaktSkugga } from "../grafikKvalitet.ts";

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

export function Hjartan({ puls }: { puls: number }) {
  const grupp = useRef<THREE.Group>(null);
  const start = useRef(-10);
  useEffect(() => { if (puls > 0) start.current = performance.now(); }, [puls]);
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
      if (gnist && puls < 2) { m.visible = false; continue; }
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
        <mesh key={x} position={[x, 0, 0]}><sphereGeometry args={[0.16, 8, 6]} /><meshBasicMaterial color="#F06292" transparent opacity={1} /></mesh>
      ))}
      {[[-0.16, 0.08], [0.18, -0.05], [0.02, 0.16], [-0.04, -0.12]].map(([x, z]) => (
        <mesh key={`${x}${z}`} name="gnist" position={[x ?? 0, 0, z ?? 0]} visible={false}><sphereGeometry args={[0.045, 6, 5]} /><meshBasicMaterial color="#FFE082" transparent opacity={1} /></mesh>
      ))}
    </group>
  );
}

export function DjurIScen({ spec, alla, plats, ljus }: { spec: Sparad; alla: Sparad[]; plats?: Plats; ljus?: { kalla: Ljuskalla; vad: string } }) {
  const [x, y, z] = djurPlats(spec, alla, plats);
  const krymp = djurKrymp(spec, alla, plats);
  const vand = djurVand(spec, alla, plats);
  const iStall = djurIStall(spec, alla, plats);
  const grupp = useRef<THREE.Group>(null);
  const kroppRef = useRef<THREE.Group>(null);
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
  const flyg = flygare(spec, plats, alla);
  const sim = simmare(spec, plats, alla);
  const ankare = useMemo(() => procAnkare(spec.kropp), [spec.kropp]);
  const markSkugga = useMemo(() => skapaKontaktSkugga(0.55), []);
  useEffect(() => () => frigoraKontaktSkugga(markSkugga), [markSkugga]);
  const ritSpec = krymp !== 1 ? { ...spec, skala: (spec.skala || 1) * krymp } : spec;
  const synS = ritSkala(ritSpec, z, plats);
  const sak = arSak(spec.kropp);
  const medSaker = spec.tillbehor.map((t) => t.id).filter((id) => id !== spec.kropp && arSak(id) && !arPlagg(id));
  const harPlattform = medSaker.some((id) => PLATTFORM_SAKER.has(id));
  const sakPos = (id: string, i: number): [number, number, number] => {
    if (PLATTFORM_SAKER.has(id) && i === 0) return [0, 0, 0];
    const onskad: [number, number] = [(0.45 + malhojd(spec.kropp) * 0.35) * (i % 2 === 0 ? 1 : -1) * (spec.skala || 1), 0.2 + Math.floor(i / 2) * 0.3];
    const torr = plats && !sim ? (wx: number, wz: number) => torrKropp(plats, wx, wz, fotKant(id, 1)) : undefined;
    const [wx, wz] = sakLage(x, z, onskad, torr);
    return [wx - x, 0, wz - z];
  };
  useEffect(() => () => {
    if (upp.current) window.removeEventListener("pointerup", upp.current);
    if (window.__tredMal) delete window.__tredMal[spec.uid];
    if (window.__tredPos) delete window.__tredPos[spec.uid];
  }, [spec.uid]);
  useFrame((state, delta) => {
    const g = grupp.current;
    if (!g) return;
    const d = Math.min(delta, 0.1);
    const t = state.clock.elapsedTime;
    const pause = pausaAnim();
    if (fod.current < 0) { fod.current = t; ljud.fil("pop"); }
    const age = t - fod.current;
    const liv = useMinne.getState();
    sattUttryck(signal, age, hopp.current > 0, liv.liv[spec.uid]?.humor, liv.sovande.some((d) => d.uid === spec.uid), Boolean((spec as { extraKropp?: string }).extraKropp));
    if (!landad.current && age >= 0.38) { landad.current = true; ljud.fil("landa"); }
    let bred = 1;
    let hojd = 1;
    if (pause) skal.current = 1;
    else if (age < 0.4) {
      const u = age / 0.4;
      const pop = u < 0.5 ? u / 0.5 : 1 + Math.sin(((u - 0.5) / 0.5) * Math.PI) * 0.16;
      const squash = Math.sin(u * Math.PI) * 0.28;
      skal.current = pop; bred = 1 + squash; hojd = 1 - squash * 1.15;
    } else skal.current += (1 - skal.current) * Math.min(1, d * 6);
    if (!pause) {
      if (hopp.current > 0) hopp.current = Math.max(0, hopp.current - d * 2.2);
      if (kisa.current > 0) kisa.current = Math.max(0, kisa.current - d * 1.5);
      if (snurr.current > 0) snurr.current = Math.max(0, snurr.current - d * 0.55);
      vila.current -= d;
    } else { hopp.current = 0; kisa.current = 0; snurr.current = 0; }
    const hoppH = hoppHojd(spec.kropp);
    const kanHoppa = hoppH !== null;
    if (!pause && vila.current <= 0 && hopp.current <= 0 && snurr.current <= 0) {
      if (hoppH !== null) { hopp.current = hoppH; ljud.plopp(); }
      vila.current = kanHoppa ? 3.1 + (index % 3) * 0.7 : 5;
    }
    const sq = squashSkala(t + index * 1.7, hopp.current, 0, signal.current.humör);
    const lyft = pause ? 0 : (snurr.current > 0 ? Math.sin(hopp.current * Math.PI) * 0.85 : sq.lyft);
    const bob = pause ? 0 : Math.sin(t * (flyg ? 2.4 : 1.6) + index) * (flyg ? 0.16 : sim ? 0.08 : 0.04);
    const s = skal.current * takSkala(spec.kropp, ritSpec.skala || 1) * synS;
    const kram = pause ? 1 : 1 - Math.sin(Math.min(1, kisa.current) * Math.PI) * 0.14;
    const [lx, ly, lz] = largoSkala(spec);
    g.scale.set((s * bred * sq.sxz * lx) / Math.sqrt(kram), s * hojd * kram * sq.sy * ly, (s * bred * sq.sxz * lz) / Math.sqrt(kram));
    const vRad = harPlattform ? vand * 0.08 : vand;
    const wx = Math.cos(t * 0.25 + index) * 0.22 * vRad;
    const wz = Math.sin(t * 0.21 + index * 1.4) * 0.16 * vRad;
    const spx = -Math.sin(t * 0.25 + index) * 0.22 * 0.25 * vRad;
    const spz = Math.cos(t * 0.21 + index * 1.4) * 0.16 * 0.21 * vRad;
    signal.current.ror = Math.hypot(spx, spz) * 10;
    if (flyg) {
      const loop = t * 0.85 + index;
      g.position.set(Math.sin(loop) * 0.4, y + bob + lyft + Math.sin(loop * 2) * 0.1, Math.cos(loop) * 0.22);
      g.rotation.z = pause ? 0 : Math.sin(loop) * 0.28;
      g.rotation.y = snurr.current > 0 ? t * 7 : Math.sin(t * 0.4 + index) * 0.14;
    } else if (svavar(spec.kropp)) {
      g.position.set(Math.sin(t * 0.35 + index) * 0.12, y + 0.18 + Math.sin(t * 1.4 + index) * 0.06, 0);
      g.rotation.z = 0;
      g.rotation.y = snurr.current > 0 ? t * 7 : 0.35;
      signal.current.ror = 0;
    } else if (sak) {
      g.position.set(0, y + lyft, 0);
      g.rotation.z = 0;
      g.rotation.y = snurr.current > 0 ? t * 7 : 0;
      signal.current.ror = 0;
    } else {
      g.position.x = sim ? Math.cos(t * 0.7 + index) * 0.22 * vRad : wx;
      g.position.z = sim ? Math.sin(t * 0.7 + index) * 0.16 * vRad : wz;
      const plattY = harPlattform && !flyg && !sim ? 0.14 : 0;
      g.position.y = y + plattY + bob + lyft;
      g.rotation.z = 0;
      g.rotation.y = snurr.current > 0 ? t * 7 : Math.atan2(spx, spz) * 0.35 * vand;
    }
    const off = bollOffset(spec.uid);
    if (g.parent) g.parent.position.set(x + off.x, 0, z + off.z);
    rapportPos(spec.uid, x + off.x + g.position.x, z + off.z + g.position.z, sak, spec.kropp);
    if (!pause && !sak && !flyg && !sim) {
      const bes = skuttBeslut(spec.uid, [x + off.x + g.position.x, z + off.z + g.position.z], d, t);
      if (bes.mal) {
        g.position.x = bes.wx - x - off.x;
        g.position.z = bes.wz - z - off.z;
        g.position.y += bes.hoppY;
        g.rotation.y = bes.rotY;
        signal.current.malPunkt = bes.mal;
        if (bes.humor) signal.current.humör = bes.humor;
        if (bes.plopp) { signal.current.klapp = performance.now(); ljud.plopp(); }
      } else if (bes.kompishopp) { hopp.current = 0.45; g.rotation.y = bes.rotY; signal.current.malPunkt = null; }
      else signal.current.malPunkt = null;
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
          ((gnist.children[i] as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 1 - u;
        }
      }
    }
    const ring = plask.current;
    if (ring) {
      const syns = sim && hopp.current > 0.04;
      ring.visible = syns;
      if (syns) {
        ring.scale.setScalar(0.45 + (1 - hopp.current) * 1.6);
        (ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, hopp.current * 0.55);
      }
    }
    if (t % 0.2 < d) {
      g.getWorldPosition(_mal);
      (window.__tredPos ??= {})[spec.uid] = { x: Math.round(_mal.x * 100) / 100, z: Math.round(_mal.z * 100) / 100, y: Math.round(_mal.y * 100) / 100, sim, flyg, stall: iStall, k: krymp, syn: Math.round((synS / (regelFor(plats).skala ?? 1)) * 100) / 100 };
      _mal.y += 1.2;
      _mal.project(state.camera);
      const rect = state.gl.domElement.getBoundingClientRect();
      const mal = (window.__tredMal ??= {});
      mal[spec.uid] = { x: Math.round(rect.left + ((_mal.x + 1) / 2) * rect.width), y: Math.round(rect.top + ((1 - _mal.y) / 2) * rect.height) };
      const kr = kroppRef.current;
      if (window.__tredSyn && kr) window.__tredSyn[spec.uid] = synMatt(kr, state.camera, rect);
      if (window.__tredBild?.uid === spec.uid && kr) window.__tredBild.ruta = synMatt(kr, state.camera, rect);
    }
  });
  function ned(e: ThreeEvent<PointerEvent>) {
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
      const malPos = malTillDuk(spec.uid) ?? normDuk(canvas, _mal.project(e.camera));
      const bx = Math.min(0.78, Math.max(0.22, malPos.x));
      const by = Math.min(0.76, Math.max(0.18, malPos.y - 0.06));
      klapp.current += 1;
      signal.current.klapp = performance.now();
      hopp.current = 1;
      kisa.current = 1;
      if (klapp.current >= 2) snurr.current = 1;
      setPuls((n) => n + 1);
      brygga.skicka({ typ: "tryck", uid: spec.uid, text: replik(spec, "tryck"), x: bx, y: by, klapp: klapp.current });
    };
    upp.current = klar;
    window.addEventListener("pointerup", klar, { once: true });
  }
  return (
    <group position={[x, 0, z]} onPointerDown={ned} userData={{ trollDel: spec.uid }}>
      <primitive object={markSkugga} dispose={null} />
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
        <group ref={kroppRef} name="kropp" userData={{ trollUid: spec.uid }}>
          {harDjurGltf(spec.kropp) ? (
            <ModellGren spec={spec}><Suspense fallback={sak ? null : <DjurForm spec={spec} signal={signal} index={Math.max(0, index)} />}><GltfDjur spec={spec} signal={signal} index={Math.max(0, index)} /></Suspense></ModellGren>
          ) : spec.kropp === AGG_KROPP ? <OrdAgg spec={spec} /> : <DjurForm spec={spec} signal={signal} index={Math.max(0, index)} />}
        </group>
        <ReservAgg spec={spec} />
        <DjurEffekter varelse={spec} ankare={ankare} />
        {sak ? null : <HumorIkon uid={spec.uid} hojd={malhojd(spec.kropp) + 0.42} signal={signal} />}
      </group>
      {ljus && ljus.vad === spec.kropp ? <Ljusken uid={spec.uid} kalla={ljus.kalla} hojd={y + malhojd(spec.kropp) * (spec.skala || 1) * 0.75} /> : null}
      {medSaker.map((id, i) => (
        <group key={id} position={sakPos(id, i)}>
          {ljus && ljus.vad === id ? <Ljusken uid={spec.uid} kalla={ljus.kalla} hojd={malhojd(id) * 0.75} /> : null}
          <ModellGren spec={{ ...spec, kropp: id }}><Suspense fallback={null}><GltfSak id={id} /></Suspense></ModellGren>
        </group>
      ))}
      {index === 0 ? <SolstjarnaPlopp /> : null}
    </group>
  );
}
