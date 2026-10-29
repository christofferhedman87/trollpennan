// Block 7: när ett nytt bygge skapas växer en byggnadsställning fram i tre steg (KayKit building_stage A–C)
// innan bygget självt studsar fram – som när något byggs i en riktig by.
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { kopplaMeshopt } from "../modeller/forladda.ts";
import { passaByggnad, skuggaUtanTraff } from "../gard/modellPrep.ts";
import { BYGGDATA } from "./ritplan.ts";

const S = BYGGDATA.stallning;

function Steg({ url }: { url: string }) {
  const gltf = useGLTF(url, false, true, kopplaMeshopt);
  const g = useMemo(() => {
    const k = gltf.scene.clone(true);
    const grupp = new THREE.Group();
    grupp.add(k);
    passaByggnad(grupp, S.hojd, BYGGDATA.max_bredd);
    skuggaUtanTraff(k, false);
    return grupp;
  }, [gltf.scene]);
  return <primitive object={g} />;
}

/** `start` = klockans tid (s) när bygget skapades; ställningen syns i S.ms och försvinner sedan. */
export function Stallning({ start }: { start: { current: number | null } }) {
  const grupp = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = grupp.current;
    if (!g) return;
    const t0 = start.current;
    const u = t0 == null || t0 < 0 ? (t0 == null ? 1 : 0) : (clock.elapsedTime - t0) / (S.ms / 1000);
    const steg = Math.min(2, Math.floor(u * 3));
    g.visible = u < 1;
    g.children.forEach((c, i) => {
      c.visible = i === steg;
      c.scale.setScalar(i === steg ? 0.9 + 0.1 * Math.sin(((u * 3) % 1) * Math.PI) : 1);
    });
  });
  return (
    <group ref={grupp}>
      {S.filer.map((f) => (
        <group key={f}>
          <Steg url={f} />
        </group>
      ))}
    </group>
  );
}

if (typeof window !== "undefined") for (const f of S.filer) useGLTF.preload(f, false, true, kopplaMeshopt);
