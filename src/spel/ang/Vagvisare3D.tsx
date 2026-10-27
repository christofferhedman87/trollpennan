import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { belysScen } from "../belys.ts";
import { forladdaNarLedig } from "../modeller/forladda.ts";
import { projiceraVagvisare, type SkarmPunkt } from "./vagvisareProjektion.ts";

const GLB = "/models/bulk/w-vagvisare-cc0.glb";
const kopplaMeshopt = (loader: { setMeshoptDecoder?: (d: typeof MeshoptDecoder) => void }) => {
  loader.setMeshoptDecoder?.(MeshoptDecoder);
};
forladdaNarLedig([GLB], (url) => useGLTF.preload(url, true, true, kopplaMeshopt));

export type VagvisarePlatsId = "ang" | "skogen" | "sjon" | "grottan" | "garden";
export type VagvisareSkarmPunkt = { id: VagvisarePlatsId; namn: string; ikon: string; x: number; y: number };
type Ankare = { id: VagvisarePlatsId; namn: string; ikon: string; pos: [number, number, number]; ry: number };

const VAGVISARE_ANKARE: Ankare[] = [
  { id: "skogen", namn: "Skogen", ikon: "🌲", pos: [-1.15, 0, -3.5], ry: 2.3 },
  { id: "grottan", namn: "Grottan", ikon: "💎", pos: [1.15, 0, -3.8], ry: 0.84 },
  { id: "garden", namn: "Gården", ikon: "🏡", pos: [-2.15, 0, -2.5], ry: 3.04 },
  { id: "sjon", namn: "Sjön", ikon: "🌊", pos: [2.15, 0, -2.5], ry: -0.15 },
];
const RETUR_ANKARE: Ankare = { id: "ang", namn: "Till Ängen", ikon: "🌸", pos: [0, 0, -3], ry: 0 };

export function vagvisareAnkareForPlats(plats: VagvisarePlatsId): Ankare[] {
  return plats === "ang" ? VAGVISARE_ANKARE : [RETUR_ANKARE];
}

function skarmFor(id: VagvisarePlatsId, p: SkarmPunkt, w: number): SkarmPunkt {
  if (id === "skogen") return { x: Math.min(Math.max(p.x, 54), w * 0.34), y: Math.min(Math.max(p.y - 88, 126), 144) };
  if (id === "grottan") return { x: Math.max(Math.min(p.x, w - 58), w * 0.66), y: Math.min(Math.max(p.y - 80, 134), 152) };
  if (id === "garden") return { x: Math.min(Math.max(p.x, 54), w * 0.34), y: Math.min(Math.max(p.y - 38, 194), 214) };
  if (id === "sjon") return { x: Math.max(Math.min(p.x, w - 54), w * 0.66), y: Math.min(Math.max(p.y - 38, 198), 218) };
  return { x: Math.min(Math.max(p.x, 72), w - 72), y: Math.min(Math.max(p.y - 60, 132), 185) };
}

function VagvisareSkylt({ a, onValj }: { a: Ankare; onValj: (id: VagvisarePlatsId) => void }) {
  const gltf = useGLTF("/models/bulk/w-vagvisare-cc0.glb", true, true, kopplaMeshopt);
  const klon = useMemo(() => {
    const c = gltf.scene.clone(true);
    belysScen(c);
    return c;
  }, [gltf.scene]);
  return (
    <group position={a.pos} rotation={[0, a.ry, 0]} scale={[1, 1, 1]} onClick={(e) => { e.stopPropagation(); onValj(a.id); }}>
      <primitive object={klon} />
    </group>
  );
}

function VagvisareGlid({ plats }: { plats: VagvisarePlatsId }) {
  const jobb = useRef<{ t0: number; fran: THREE.Vector3; till: THREE.Vector3 } | null>(null);
  useEffect(() => {
    const f = (e: Event) => {
      const id = (e as CustomEvent<VagvisarePlatsId>).detail;
      const a = vagvisareAnkareForPlats(plats).find((x) => x.id === id);
      if (!a) return;
      jobb.current = { t0: -1, fran: new THREE.Vector3(), till: new THREE.Vector3(a.pos[0], 1.15, a.pos[2]) };
    };
    window.addEventListener("troll-vagvisare-glid", f);
    return () => window.removeEventListener("troll-vagvisare-glid", f);
  }, [plats]);
  useFrame(({ camera, clock }) => {
    const j = jobb.current;
    if (!j) return;
    const nu = clock.elapsedTime;
    if (j.t0 < 0) {
      j.t0 = nu;
      j.fran.copy(camera.position);
      const steg = j.till.clone().sub(j.fran);
      const len = steg.length();
      if (len > 0.05) steg.multiplyScalar(Math.min(1.7, len * 0.42) / len);
      j.till.copy(j.fran).add(steg);
    }
    const u = Math.min(1, (nu - j.t0) / 0.34);
    camera.position.lerpVectors(j.fran, j.till, u * u * (3 - 2 * u));
    if (u >= 1) jobb.current = null;
  });
  return null;
}

export function Vagvisare3D({ plats, onValjPlats }: { plats: VagvisarePlatsId; onValjPlats: (id: VagvisarePlatsId) => void }) {
  return (
    <group name="vagvisare">
      {vagvisareAnkareForPlats(plats).map((a) => (
        <VagvisareSkylt key={a.id} a={a} onValj={onValjPlats} />
      ))}
      <VagvisareGlid plats={plats} />
    </group>
  );
}

export function VagvisareProjektor({ plats, onPunkter }: { plats: VagvisarePlatsId; onPunkter: (p: VagvisareSkarmPunkt[]) => void }) {
  const { camera, size } = useThree();
  const onRef = useRef(onPunkter);
  onRef.current = onPunkter;
  const senast = useRef("");
  const v = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => {
    const tick = () => {
      if (size.width <= 0 || size.height <= 0) return;
      const ut: VagvisareSkarmPunkt[] = [];
      for (const a of vagvisareAnkareForPlats(plats)) {
        v.set(a.pos[0], 1.15, a.pos[2]).project(camera);
        const rå = projiceraVagvisare({ x: v.x, y: v.y, z: v.z }, size.width, size.height) ?? { x: size.width * 0.5, y: size.height * 0.32 };
        const j = skarmFor(a.id, rå, size.width);
        ut.push({ id: a.id, namn: a.namn, ikon: a.ikon, x: Math.round(j.x), y: Math.round(j.y) });
      }
      const sig = ut.map((p) => `${p.id}:${p.x}:${p.y}`).join("|");
      if (sig === senast.current) return;
      senast.current = sig;
      onRef.current(ut);
    };
    tick();
    const id = window.setInterval(tick, 150);
    return () => window.clearInterval(id);
  }, [plats, camera, size.width, size.height, v]);
  return null;
}

export function VagvisareHud({ punkter, onValjPlats, dold }: { punkter: VagvisareSkarmPunkt[]; onValjPlats: (id: VagvisarePlatsId) => void; dold?: boolean }) {
  if (dold || punkter.length === 0 || typeof document === "undefined") return null;
  return createPortal(
    <div className="tp-vagvisare-hud" aria-label="Vägvisare i världen">
      {punkter.map((p) => (
        <button key={p.id} type="button" data-w3="vagvisare-knapp" data-plats={p.id} style={{ left: `${p.x}px`, top: `${p.y}px` }} onClick={() => onValjPlats(p.id)}>
          {p.ikon} {p.namn}
        </button>
      ))}
    </div>,
    document.body,
  );
}
