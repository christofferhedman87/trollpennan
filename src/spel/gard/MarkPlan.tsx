import type { ThreeEvent } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { SparatBygge } from "../bygge.ts";
import { kanterForEtt } from "./modellPrep.ts";
import {
  CELL_STORLEK,
  GARD_BREDD,
  GARD_DJUP,
  arKantBygge,
  cellNyckel,
  cellTillVarld,
  kantNyckel,
  kantTillVarld,
  xyTillCell,
  type CellPlats,
  type KantPlats,
  type SlutenHage,
} from "./rutnat.ts";

const ALLA_CELLER: CellPlats[] = [];
for (let gz = 0; gz < GARD_DJUP; gz += 1) {
  for (let gx = 0; gx < GARD_BREDD; gx += 1) ALLA_CELLER.push({ gx, gz });
}

const ALLA_KANTER: KantPlats[] = [];
for (let gz = 0; gz <= GARD_DJUP; gz += 1) {
  for (let gx = 0; gx < GARD_BREDD; gx += 1) ALLA_KANTER.push({ gx, gz, kant: "N" });
}
for (let gz = 0; gz < GARD_DJUP; gz += 1) {
  for (let gx = 0; gx <= GARD_BREDD; gx += 1) ALLA_KANTER.push({ gx, gz, kant: "W" });
}

const PLATT_Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
const M = new THREE.Matrix4();
const P = new THREE.Vector3();
const S = new THREE.Vector3();
const Q = new THREE.Quaternion();
const UPP = new THREE.Vector3(0, 1, 0);
const RUTA = new THREE.PlaneGeometry(1, 1);
const KANT = new THREE.BoxGeometry(0.9, 0.05, 0.1);
const MAT_RUTA = new THREE.MeshStandardMaterial({ color: "#49B652", roughness: 0.72 });
const MAT_HAGE = new THREE.MeshStandardMaterial({ color: "#82E05A", roughness: 0.72 });
const MAT_CELL = new THREE.MeshStandardMaterial({
  color: "#ffe082",
  transparent: true,
  opacity: 0.72,
  roughness: 0.45,
  emissive: "#ffe082",
  emissiveIntensity: 0.35,
});
const MAT_KANT = new THREE.MeshStandardMaterial({
  color: "#ffd54f",
  transparent: true,
  opacity: 0.9,
  roughness: 0.4,
  emissive: "#ffd54f",
  emissiveIntensity: 0.4,
});

function ingenTraff() {
  return undefined;
}

function laggPlattor(
  mesh: THREE.InstancedMesh,
  celler: readonly CellPlats[],
  y: number,
  storlek: number,
) {
  S.set(storlek, storlek, 1);
  celler.forEach((c, i) => {
    const v = cellTillVarld(c.gx, c.gz);
    P.set(v.wx, y, v.wz);
    M.compose(P, PLATT_Q, S);
    mesh.setMatrixAt(i, M);
  });
  mesh.count = celler.length;
  mesh.instanceMatrix.needsUpdate = true;
}

function Plattor({
  celler,
  y,
  storlek,
  mat,
}: {
  celler: readonly CellPlats[];
  y: number;
  storlek: number;
  mat: THREE.Material;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    laggPlattor(mesh, celler, y, storlek);
  }, [celler, y, storlek]);
  if (celler.length === 0) return null;
  return (
    <instancedMesh
      ref={ref}
      args={[RUTA, mat, GARD_BREDD * GARD_DJUP]}
      frustumCulled={false}
      raycast={ingenTraff}
      receiveShadow
    />
  );
}

function laggKanter(mesh: THREE.InstancedMesh, kanter: readonly KantPlats[]) {
  S.set(1, 1, 1);
  kanter.forEach((k, i) => {
    const v = kantTillVarld(k);
    Q.setFromAxisAngle(UPP, v.rotY);
    P.set(0, 0.04, -0.5).applyQuaternion(Q);
    P.x += v.wx;
    P.z += v.wz;
    M.compose(P, Q, S);
    mesh.setMatrixAt(i, M);
  });
  mesh.count = kanter.length;
  mesh.instanceMatrix.needsUpdate = true;
}

function KantGlod({ kanter }: { kanter: readonly KantPlats[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    laggKanter(mesh, kanter);
  }, [kanter]);
  if (kanter.length === 0) return null;
  return (
    <instancedMesh
      ref={ref}
      args={[KANT, MAT_KANT, ALLA_KANTER.length]}
      frustumCulled={false}
      raycast={ingenTraff}
    />
  );
}

export function MarkPlan({
  garden,
  hagar,
  kanter,
  flyttarUid,
  onValj,
}: {
  garden: readonly SparatBygge[];
  hagar: readonly SlutenHage[];
  kanter: readonly KantPlats[];
  flyttarUid: string | null;
  onValj: (e: ThreeEvent<PointerEvent>) => void;
}) {
  const hageCeller = useMemo(() => hagar.flatMap((h) => h.celler), [hagar]);
  const flytt = garden.find((b) => b.uid === flyttarUid) ?? null;
  const ledigaCeller = useMemo(() => {
    if (!flytt || arKantBygge(flytt.bygg)) return [];
    const tagna = new Set<string>();
    for (const b of garden) {
      if (b.uid === flytt.uid || arKantBygge(b.bygg)) continue;
      const c = xyTillCell(b.x, b.y);
      tagna.add(cellNyckel(c.gx, c.gz));
    }
    return ALLA_CELLER.filter((c) => !tagna.has(cellNyckel(c.gx, c.gz)));
  }, [garden, flytt]);
  const ledigaKanter = useMemo(() => {
    if (!flytt || !arKantBygge(flytt.bygg)) return [];
    const egna = new Set(kanterForEtt(flytt).map((k) => kantNyckel(k)));
    const tagna = new Set<string>();
    for (const k of kanter) {
      const ny = kantNyckel(k);
      if (!egna.has(ny)) tagna.add(ny);
    }
    return ALLA_KANTER.filter((k) => !tagna.has(kantNyckel(k)));
  }, [flytt, kanter]);
  const bredd = GARD_BREDD * CELL_STORLEK;
  const djup = GARD_DJUP * CELL_STORLEK;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow raycast={ingenTraff}>
        <circleGeometry args={[28, 48]} />
        <meshStandardMaterial color="#69b84f" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow raycast={ingenTraff}>
        <circleGeometry args={[8.8, 40]} />
        <meshStandardMaterial color="#76c45a" roughness={0.92} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.006, 0]}
        receiveShadow
        raycast={ingenTraff}
      >
        <planeGeometry args={[bredd + 0.52, djup + 0.52]} />
        <meshStandardMaterial color="#d9a760" roughness={0.88} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        receiveShadow
        raycast={ingenTraff}
      >
        <planeGeometry args={[bredd, djup]} />
        <meshStandardMaterial color="#62b355" roughness={1} />
      </mesh>
      <Plattor celler={ALLA_CELLER} y={0.012} storlek={0.9} mat={MAT_RUTA} />
      <Plattor celler={hageCeller} y={0.015} storlek={0.94} mat={MAT_HAGE} />
      <Plattor celler={ledigaCeller} y={0.02} storlek={0.96} mat={MAT_CELL} />
      <KantGlod kanter={ledigaKanter} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} onPointerDown={onValj}>
        <planeGeometry args={[bredd + 0.4, djup + 0.4]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
