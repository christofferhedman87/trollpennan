import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { DjurHumör, DjurSignal } from "../gltfDjur.tsx";
import type { Ankare } from "./ankare.ts";

const OFFSET = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 } as const;
const OGA = new THREE.MeshBasicMaterial({ color: "#231B1B", ...OFFSET });
const VIT = new THREE.MeshBasicMaterial({ color: "#FFFFFF", ...OFFSET });
const KIND = new THREE.MeshBasicMaterial({ color: "#F48FB1", transparent: true, opacity: 0.65, depthWrite: false, ...OFFSET });
const MUN = new THREE.MeshBasicMaterial({ color: "#3B2F2F", ...OFFSET });
const SKRATT = new THREE.MeshBasicMaterial({ color: "#D84315", ...OFFSET });
const TUNGA = new THREE.MeshBasicMaterial({ color: "#F48FB1", ...OFFSET });
const STJ = new THREE.MeshBasicMaterial({ color: "#FFE082", ...OFFSET });
const GEO = {
  sfar: new THREE.SphereGeometry(1, 12, 10), liten: new THREE.SphereGeometry(1, 8, 6),
  mun: new THREE.TorusGeometry(1, 0.2, 5, 10, Math.PI), stav: new THREE.BoxGeometry(1.55, 0.28, 0.2),
};
/** Ansiktets skärmyta på 375×812 vid fov 42°. Främre zonen (avstånd 3.2) ska räcka till minst 24×14 px. */
export function beraknaUttryckSkarmPx(bredd: number, avstand = 3.2): { breddPx: number; hojdPx: number } {
  const synligH = 2 * Math.max(0.25, avstand) * Math.tan((42 * Math.PI) / 360);
  const synligB = synligH * (375 / 812);
  const hojd = Math.max(0, bredd) * (14 / 24);
  return { breddPx: (Math.max(0, bredd) / synligB) * 375, hojdPx: (hojd / synligH) * 812 };
}
export function sattUttryck(signal: { current: DjurSignal }, age: number, hoppar: boolean, butik: string | undefined, sover: boolean, extra: boolean): void {
  const nu = performance.now();
  let h: DjurHumör = "glad";
  if (age < 2.5 || nu - signal.current.klapp < 2500) h = "fortjust";
  else if (butik === "sugen") h = "hungrig";
  else if (butik === "somnig" || sover) h = "somnig";
  else if (butik === "lekfull" || hoppar || extra) h = "busig";
  signal.current.humör = h;
}

function lyft(v: THREE.Vector3, fram: THREE.Vector3, d: number) {
  return v.clone().addScaledVector(fram, d);
}

function benAnsikte(klon: THREE.Object3D) {
  klon.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(klon);
  const at = (n: string) => klon.getObjectByName(n)?.getWorldPosition(new THREE.Vector3());
  const le = at("LeftEye"), re = at("RightEye"), mouth = at("Mouth"), head = at("Head"), hend = at("Head_end"), brow = at("EyebrowL");
  const par = (x: number, y: number, z: number, my: number, mz: number) => ({
    ogL: new THREE.Vector3(-x, y, z), ogR: new THREE.Vector3(x, y, z), mun: new THREE.Vector3(0, my, mz) });
  if (le && re) {
    const z = Math.max(le.z + 0.08, box.max.z * 0.85);
    return par(Math.max(0.08, Math.abs(le.x) * 0.92), le.y, z, mouth ? mouth.y : le.y - 0.09, z + 0.04);
  }
  if (head && hend) {
    const y = head.y * 0.55 + hend.y * 0.45, z = Math.max(hend.z * 0.9, box.max.z * 0.78);
    return par(Math.max(0.09, (box.max.x - box.min.x) * 0.16), y, z, y - 0.09, z + 0.05);
  }
  if (!brow) return null;
  const y = brow.y - 0.08, z = box.max.z * 0.88;
  return par(Math.max(0.08, Math.abs(brow.x) * 0.85), y, z, y - 0.09, z + 0.03);
}

export function AnsiktsUttryck({
  ankare,
  klon,
  signal,
  index = 0,
}: {
  ankare: Ankare | null;
  klon?: THREE.Object3D;
  signal?: { current: DjurSignal };
  index?: number;
}) {
  const rot = useRef<THREE.Group>(null);
  const ogaL = useRef<THREE.Mesh>(null);
  const ogaR = useRef<THREE.Mesh>(null);
  const glimtL = useRef<THREE.Mesh>(null);
  const glimtR = useRef<THREE.Mesh>(null);
  const kindL = useRef<THREE.Mesh>(null);
  const kindR = useRef<THREE.Mesh>(null);
  const leende = useRef<THREE.Mesh>(null);
  const oppen = useRef<THREE.Mesh>(null);
  const oMun = useRef<THREE.Mesh>(null);
  const tunga = useRef<THREE.Mesh>(null);
  const stjL = useRef<THREE.Group>(null);
  const stjR = useRef<THREE.Group>(null);
  const p = useMemo(() => {
    if (!ankare) return null;
    const fram = ankare.fram.clone();
    if (fram.lengthSq() < 1e-8) fram.set(0, 0, 1);
    else fram.normalize();
    const steg = Math.max(0.02, ankare.bredd * 0.02);
    const ben = klon ? benAnsikte(klon) : null;
    const srcL = ben?.ogL ?? ankare.ogonL, srcR = ben?.ogR ?? ankare.ogonR, srcM = ben?.mun ?? ankare.mun;
    const d = ben ? 0 : steg;
    const ogL = lyft(srcL, fram, d);
    const ogR = lyft(srcR, fram, d);
    const mun = lyft(srcM, fram, ben ? 0 : steg + 0.008);
    const spann = Math.max(0.1, srcL.distanceTo(srcR));
    let oga = Math.max(0.055, spann * 0.5);
    const px = beraknaUttryckSkarmPx(spann + oga * 2);
    if (px.breddPx < 24 || px.hojdPx < 14) oga *= Math.max(24 / Math.max(px.breddPx, 1), 14 / Math.max(px.hojdPx, 1));
    const kindY = srcL.y - Math.abs(srcL.y - srcM.y) * 0.55;
    const ut = Math.max(oga * 0.35, Math.abs(srcL.x - ankare.ansikte.x) * 0.15);
    const kl = lyft(new THREE.Vector3(srcL.x - ut, kindY, srcL.z), fram, d);
    const kr = lyft(new THREE.Vector3(srcR.x + ut, kindY, srcR.z), fram, d);
    return { ogL, ogR, mun, oga, kl, kr, kind: oga * 0.72 };
  }, [ankare, klon]);
  useLayoutEffect(() => { rot.current?.traverse((o) => { o.renderOrder = 12; }); }, [p]);
  useFrame(({ clock }) => {
    if (!p) return;
    const t = clock.elapsedTime;
    const h = signal?.current.humör ?? "glad";
    const period = 3.2 + (index % 6) * 0.383;
    const blink = h === "glad" && (t + index * 0.41) % period > period - 0.12;
    const andas = h === "somnig" ? 1 + Math.sin(t * 1.35) * 0.08 : 1;
    const syL = (h === "busig" ? 0.12 : h === "somnig" ? 0.25 : h === "hungrig" ? 1.2 : blink ? 0.12 : 1) * andas;
    const syR = (h === "somnig" ? 0.25 : h === "hungrig" ? 1.2 : blink ? 0.12 : 1) * andas;
    const sx = h === "hungrig" ? 1.2 : 1;
    const satta = (m: THREE.Mesh | null, sy: number) => {
      if (!m) return;
      m.visible = true;
      m.scale.set(p.oga * sx, p.oga * sy, p.oga);
    };
    satta(ogaL.current, syL);
    satta(ogaR.current, syR);
    const darr = h === "hungrig" ? Math.sin(t * 23) * 0.09 : 0;
    glimtL.current?.position.set(-0.32 + darr, 0.34, 0.82);
    glimtR.current?.position.set(-0.32 + darr, 0.34, 0.82);
    const ks = (h === "fortjust" ? 1.3 : 1) * p.kind * (h === "somnig" ? andas : 1);
    if (kindL.current) kindL.current.scale.setScalar(ks);
    if (kindR.current) kindR.current.scale.setScalar(ks);
    if (leende.current) {
      leende.current.visible = h === "glad" || h === "somnig" || h === "busig";
      leende.current.rotation.z = Math.PI + (h === "busig" ? 0.55 : 0);
      leende.current.scale.set(p.oga * 1.45, p.oga * (h === "somnig" ? 0.62 : 1.05) * andas, p.oga);
    }
    if (oppen.current) {
      oppen.current.visible = h === "fortjust";
      oppen.current.scale.set(p.oga * 1.2, p.oga * 0.82, p.oga * 0.45);
    }
    if (oMun.current) {
      oMun.current.visible = h === "hungrig";
      oMun.current.scale.setScalar(p.oga * 0.4);
    }
    if (tunga.current) {
      tunga.current.visible = h === "fortjust" || h === "busig";
      const k = h === "busig" ? 0.32 : 0.52;
      tunga.current.scale.set(p.oga * k, p.oga * k * 0.7, p.oga * 0.28);
    }
    if (stjL.current) stjL.current.visible = h === "fortjust";
    if (stjR.current) stjR.current.visible = h === "fortjust";
  });
  if (!p) return null;
  const xyz = (v: THREE.Vector3): [number, number, number] => [v.x, v.y, v.z];
  return (
    <group ref={rot} userData={{ plaggPar: "uttryck", par: "uttryck" }}>
      <mesh ref={ogaL} geometry={GEO.sfar} material={OGA} position={xyz(p.ogL)} scale={p.oga}>
        <mesh ref={glimtL} geometry={GEO.liten} material={VIT} position={[-0.32, 0.34, 0.82]} scale={0.32} />
        <mesh geometry={GEO.liten} material={VIT} position={[0.3, -0.28, 0.86]} scale={0.14} />
      </mesh>
      <mesh ref={ogaR} geometry={GEO.sfar} material={OGA} position={xyz(p.ogR)} scale={p.oga}>
        <mesh ref={glimtR} geometry={GEO.liten} material={VIT} position={[-0.32, 0.34, 0.82]} scale={0.32} />
        <mesh geometry={GEO.liten} material={VIT} position={[0.3, -0.28, 0.86]} scale={0.14} />
      </mesh>
      <group ref={stjL} position={[p.ogL.x, p.ogL.y, p.ogL.z + p.oga * 0.95]} scale={p.oga * 1.2} rotation={[0, 0, 0]} visible={false}>
        <mesh geometry={GEO.stav} material={STJ} />
        <mesh geometry={GEO.stav} material={STJ} rotation={[0, 0, Math.PI / 2]} />
      </group>
      <group ref={stjR} position={[p.ogR.x, p.ogR.y, p.ogR.z + p.oga * 0.95]} scale={p.oga * 1.2} rotation={[0, 0, 0]} visible={false}>
        <mesh geometry={GEO.stav} material={STJ} />
        <mesh geometry={GEO.stav} material={STJ} rotation={[0, 0, Math.PI / 2]} />
      </group>
      <mesh ref={kindL} geometry={GEO.sfar} material={KIND} position={xyz(p.kl)} scale={p.kind} />
      <mesh ref={kindR} geometry={GEO.sfar} material={KIND} position={xyz(p.kr)} scale={p.kind} />
      <mesh ref={leende} geometry={GEO.mun} material={MUN} position={xyz(p.mun)} rotation={[0, 0, Math.PI]} scale={p.oga} />
      <mesh ref={oppen} geometry={GEO.sfar} material={SKRATT} position={xyz(p.mun)} visible={false} />
      <mesh ref={oMun} geometry={GEO.liten} material={MUN} position={xyz(p.mun)} visible={false} />
      <mesh ref={tunga} geometry={GEO.sfar} material={TUNGA} position={[p.mun.x, p.mun.y - p.oga * 0.28, p.mun.z + 0.012]} visible={false} />
    </group>
  );
}
