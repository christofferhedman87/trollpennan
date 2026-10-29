// Kvällen på ängen. useKlocka räknar fram `natt` (0 = dag, 1 = kväll) och texterna säger "Solen går ner …" och
// "Titta, den första stjärnan!", men scenen var alltid i fullt dagsljus (angen3d.tsx: `0 * natt`).
// Här tonas ljus, himmel och dis mot en varm skymning enligt data/miljo.json (kvall) och data/dygn.json.
// Kvällen blir aldrig mörk: barnet ska kunna se och skapa precis som på dagen. Introt (sagan) styr ljuset själv.
import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { MILJO } from "../miljo.ts";
import { kvallsLjusFaktor, kvallsTon } from "./kvallTon.ts";

type Ref<T> = { current: T | null };

export function KvallsLjus({
  natt,
  aktiv,
  hem,
  dir,
  fyll,
  kant,
}: {
  natt: number;
  aktiv: boolean;
  hem: Ref<THREE.HemisphereLight>;
  dir: Ref<THREE.DirectionalLight>;
  fyll: Ref<THREE.DirectionalLight>;
  kant: Ref<THREE.DirectionalLight>;
}) {
  const f = useMemo(
    () => ({
      nyckelDag: new THREE.Color(MILJO.ljus.nyckel.farg),
      nyckelKvall: new THREE.Color(MILJO.kvall.nyckel_farg),
      fyllDag: new THREE.Color(MILJO.ljus.fyll.farg),
      fyllKvall: new THREE.Color(MILJO.kvall.fyll_farg),
      disDag: new THREE.Color(MILJO.dis.farg),
      disKvall: new THREE.Color(MILJO.kvall.dis_farg),
    }),
    [],
  );
  useFrame(({ scene }) => {
    if (!aktiv) return;
    const L = MILJO.ljus;
    const ljus = kvallsLjusFaktor(natt);
    const ton = kvallsTon(natt);
    // Styrkorna sätts varje bildruta från datafilen, så att ljuset blir detsamma oavsett om introt spelats under passet.
    if (hem.current) hem.current.intensity = L.hemi.styrka * ljus;
    if (dir.current) {
      dir.current.intensity = L.nyckel.styrka * ljus;
      dir.current.color.copy(f.nyckelDag).lerp(f.nyckelKvall, ton);
    }
    if (fyll.current) {
      fyll.current.intensity = L.fyll.styrka * ljus;
      fyll.current.color.copy(f.fyllDag).lerp(f.fyllKvall, ton);
    }
    if (kant.current) kant.current.intensity = L.kant.styrka * ljus;
    if (scene.fog instanceof THREE.Fog) scene.fog.color.copy(f.disDag).lerp(f.disKvall, ton);
  });
  return null;
}
