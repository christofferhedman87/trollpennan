import { useGLTF } from "@react-three/drei";
import { Suspense, useLayoutEffect, useMemo } from "react";
import { normaliseraPlaggId, plaggModellUrl } from "./plaggModell.ts";
import { kladesExemplar } from "../tillbehor/exemplar.ts";
import { MeshoptDecoder } from "three-stdlib";
import * as THREE from "three";
import type { Sparad } from "../brygga.ts";
import type { DjurSignal } from "./djurSignal.ts";
import { entitet } from "../entiteter.ts";
import { DjurModellGren } from "./StjarnPuffReserv.tsx";
import { AnsiktsUttryck } from "../tillbehor/AnsiktsUttryck.tsx";
import { faestPlaggKlon, type Ankare } from "../tillbehor/index.ts";

function kopplaMeshopt(loader: { setMeshoptDecoder: (d: unknown) => void }) {
  const av = MeshoptDecoder as unknown;
  loader.setMeshoptDecoder(typeof av === "function" ? (av as () => unknown)() : av);
}

/** GLB-plagg (mössa, tröja, stövel) fästs på klonen, inte som en sak på marken. */
function GltfPlagg({ rot, spec }: { rot: THREE.Object3D; spec: Sparad }) {
  const plagg = useMemo(() => kladesExemplar(spec.tillbehor, spec.kropp).filter(({ t }) => plaggModellUrl(normaliseraPlaggId(t.id)) != null), [spec.tillbehor, spec.kropp]);
  const gltf = useGLTF(plagg.map(({ t }) => plaggModellUrl(normaliseraPlaggId(t.id))!), true, true, kopplaMeshopt);
  useLayoutEffect(() => {
    const ersatta = new Set(plagg.map(({ t }) => "tillbehor-" + t.id));
    const reserv: THREE.Object3D[] = [];
    rot.traverse((o) => { if (ersatta.has(o.name) && !o.userData.plaggId) reserv.push(o); });
    for (const o of reserv) o.parent?.remove(o);
    const noder = plagg.map(({ t, index, antal }, i) => faestPlaggKlon(rot, spec.kropp, normaliseraPlaggId(t.id), gltf[i]!.scene, t.farg, { index, antal, bevara: true }));
    return () => { for (const nod of noder) nod?.parent?.remove(nod); };
  }, [rot, spec.kropp, plagg, gltf]);
  return null;
}

export function GltfInnehall({ klon, spec, fram, signal, index }: { klon: THREE.Object3D; spec: Sparad; fram: number; signal: { current: DjurSignal }; index: number }) {
  const ankare = (klon.userData.ankare as Ankare | undefined) ?? null;
  return (
    <group rotation={[0, fram, 0]}>
      <primitive object={klon} />
      {entitet(spec.kropp)?.typ === "djur" ? <AnsiktsUttryck ankare={ankare} klon={klon} signal={signal} index={index} /> : null}
      <DjurModellGren reserv={null}><Suspense fallback={null}><GltfPlagg rot={klon} spec={spec} /></Suspense></DjurModellGren>
    </group>
  );
}

