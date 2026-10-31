import { useGLTF } from "@react-three/drei";
import { Suspense, useLayoutEffect, useMemo } from "react";
import { MeshoptDecoder } from "three-stdlib";
import * as THREE from "three";
import type { Sparad } from "../brygga.ts";
import type { DjurSignal } from "./djurSignal.ts";
import { arPlagg, entitet, modellUrl as modellUrlAv } from "../entiteter.ts";
import { DjurModellGren } from "./StjarnPuffReserv.tsx";
import { AnsiktsUttryck } from "../tillbehor/AnsiktsUttryck.tsx";
import { faestPlaggKlon, type Ankare } from "../tillbehor/index.ts";

function kopplaMeshopt(loader: { setMeshoptDecoder: (d: unknown) => void }) {
  const av = MeshoptDecoder as unknown;
  loader.setMeshoptDecoder(typeof av === "function" ? (av as () => unknown)() : av);
}

/** `"mössa"` och `"tröja"` pekar på samma GLB-rader som `alvmossa` och `troja`. */
function normaliseraPlaggId(id: string): string {
  if (id === "mössa") return "alvmossa";
  if (id === "tröja") return "troja";
  return id;
}

/** Värmeplagg från blockserie F, annars den vanliga plaggmodellen. */
function plaggModellUrl(id: string): string | null {
  if (id === "mossa" || id === "mössa" || id === "alvmossa") return "/models/bulk/f-mossa-vinter-cc0.glb";
  if (id === "luva") return "/models/bulk/f-mossa-toppluva-cc0.glb";
  if (id === "halsduk") return "/models/bulk/f-halsduk-cc0.glb";
  if (id === "filt") return "/models/bulk/f-filt-draperad-cc0.glb";
  if (id === "troja" || id === "tröja") return modellUrlAv("troja");
  return arPlagg(id) ? modellUrlAv(id) : null;
}

/** GLB-plagg (mössa, tröja, stövel) fästs på klonen, inte som en sak på marken. */
function GltfPlagg({ rot, kropp, id, farg }: { rot: THREE.Object3D; kropp: string; id: string; farg: string | null }) {
  const plaggId = normaliseraPlaggId(id);
  const gltf = useGLTF(plaggModellUrl(plaggId)!, true, true, kopplaMeshopt);
  useLayoutEffect(() => {
    const nod = faestPlaggKlon(rot, kropp, plaggId, gltf.scene, farg);
    return () => {
      nod?.parent?.remove(nod);
    };
  }, [rot, kropp, plaggId, farg, gltf.scene]);
  return null;
}

export function GltfInnehall({ klon, spec, fram, signal, index }: { klon: THREE.Object3D; spec: Sparad; fram: number; signal: { current: DjurSignal }; index: number }) {
  const glbPlagg = useMemo(
    () => spec.tillbehor.filter((t) => t.id !== spec.kropp && plaggModellUrl(normaliseraPlaggId(t.id)) != null),
    [spec.tillbehor, spec.kropp],
  );
  const ankare = (klon.userData.ankare as Ankare | undefined) ?? null;
  return (
    <group rotation={[0, fram, 0]}>
      <primitive object={klon} />
      {entitet(spec.kropp)?.typ === "djur" ? <AnsiktsUttryck ankare={ankare} klon={klon} signal={signal} index={index} /> : null}
      {glbPlagg.map((t) => (
        <DjurModellGren key={t.id} reserv={null}>
          <Suspense fallback={null}>
            <GltfPlagg rot={klon} kropp={spec.kropp} id={t.id} farg={t.farg} />
          </Suspense>
        </DjurModellGren>
      ))}
    </group>
  );
}

