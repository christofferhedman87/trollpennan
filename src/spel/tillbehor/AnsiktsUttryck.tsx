import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { DjurHumör, DjurSignal } from "../gltfDjur.tsx";
import type { Ankare } from "./ankare.ts";

const ROSA = new THREE.MeshBasicMaterial({ color: "#F48FB1", transparent: true, opacity: 0.9, depthWrite: false });
const STJ = new THREE.MeshBasicMaterial({ color: "#FFE082", depthWrite: false });
const GEO = { par: new THREE.SphereGeometry(1, 10, 8), stav: new THREE.BoxGeometry(1.55, 0.28, 0.2) };

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

function kors() {
  return (
    <>
      <mesh geometry={GEO.stav} material={STJ} />
      <mesh geometry={GEO.stav} material={STJ} rotation={[0, 0, Math.PI / 2]} />
    </>
  );
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
  void klon;
  const rot = useRef<THREE.Group>(null);
  const par = useRef<THREE.Mesh>(null);
  const stj = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = rot.current;
    if (!g || !ankare) return;
    const t = clock.elapsedTime;
    const h = signal?.current.humör ?? "glad";
    const livlig = h === "fortjust" || h === "busig";
    const lugn = h === "glad" || h === "hungrig" || h === "somnig";
    const bob = Math.sin(t * (livlig ? 3.4 : 1.7) + index) * (livlig ? 0.04 : 0.018);
    g.position.set(ankare.huvudTopp.x, ankare.huvudTopp.y + Math.max(0.14, ankare.hojd * 0.12) + bob, ankare.huvudTopp.z);
    g.rotation.y = t * (livlig ? 0.9 : 0.28);
    const s = Math.min(0.055, Math.max(0.035, (livlig ? 0.05 : 0.04) * (lugn ? 1 + Math.sin(t * 2.2) * 0.08 : 1)));
    par.current?.scale.setScalar(s);
    if (stj.current) stj.current.rotation.z = t * (livlig ? 1.5 : 0.4);
  });
  if (!ankare) return null;
  const p: [number, number, number] = [ankare.huvudTopp.x, ankare.huvudTopp.y + Math.max(0.14, ankare.hojd * 0.12), ankare.huvudTopp.z];
  return (
    <group ref={rot} position={p} userData={{ plaggPar: "uttryck", par: "uttryck" }}>
      <mesh ref={par} geometry={GEO.par} material={ROSA} scale={0.045} />
      <group ref={stj} position={[0.06, 0.03, 0]} scale={0.045}>{kors()}</group>
      <group position={[-0.055, 0.015, 0.01]} scale={0.038} rotation={[0, 0, 0.4]}>{kors()}</group>
    </group>
  );
}
