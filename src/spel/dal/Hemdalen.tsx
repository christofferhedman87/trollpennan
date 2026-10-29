// Block 1 (En värld): Hemdalen. Gårdens byggen står på tomter runt ängen, i samma scen som djuren.
// Lediga tomter glimmar (som de tomma tomterna i Slime Rancher): tryck på en, så hamnar nästa bygge där.
// När barnet flyttar ett bygge lyser alla tomter, och ett tryck på en tomt flyttar dit.
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { brygga } from "../brygga.ts";
import { ByggeModell } from "../gard/ByggModell.tsx";
import { arKantBygge } from "../gard/rutnat.ts";
import { Byggverk } from "./Byggverk.tsx";
import { skarmPunkt } from "../gard/modellPrep.ts";
import { useMinne } from "../minne.ts";
import { usePennTryck } from "../ang/delat.ts";
import { TOON_MAP } from "../ang/djur.tsx";
import { dalStyr } from "./dalStyr.ts";
import { DALEN, TOMTER, tomtKarta, type Tomt } from "./tomter.ts";

const T = DALEN.tomt;

function useDalLage() {
  const [, rita] = useState(0);
  useEffect(() => dalStyr.lyssna(() => rita((n) => n + 1)), []);
  return dalStyr.lage();
}

function Tomtplatta({ t, i, ledig, flyttar, vald }: { t: Tomt; i: number; ledig: boolean; flyttar: string | null; vald: boolean }) {
  const glans = useRef<THREE.Mesh>(null);
  const gnista = useRef<THREE.Mesh>(null);
  const kamera = useRef<THREE.Camera | null>(null);
  const tryck = usePennTryck(() => {
    if (flyttar) {
      useMinne.getState().sattTomt(flyttar, i);
      dalStyr.flytta(null);
      return;
    }
    if (!ledig) return;
    if (!kamera.current) return;
    const p = skarmPunkt(t.x, 0.4, t.z, kamera.current);
    brygga.skicka({ typ: "tomt", tomt: i, x: p.x, y: p.y });
  });
  const visaGlod = flyttar != null || ledig;
  useFrame(({ clock, camera, gl }) => {
    kamera.current = camera;
    // För prov: tomtens skärmpunkt (CSS-px) och om den är ledig.
    if (typeof window !== "undefined" && Math.round(clock.elapsedTime * 60) % 10 === i % 10) {
      const w = window as unknown as { __tomter?: Record<number, { x: number; y: number; ledig: boolean }> };
      const r = gl.domElement.getBoundingClientRect();
      const p = new THREE.Vector3(t.x, 0.1, t.z).project(camera);
      (w.__tomter ??= {})[i] = { x: Math.round(r.left + (p.x * 0.5 + 0.5) * r.width), y: Math.round(r.top + (-p.y * 0.5 + 0.5) * r.height), ledig };
    }
    const tid = clock.elapsedTime + i * 0.7;
    if (glans.current) {
      const m = glans.current.material as THREE.MeshBasicMaterial;
      m.opacity = visaGlod ? (flyttar ? 0.45 : vald ? 0.5 : 0.18 + 0.12 * Math.sin(tid * 2)) : 0;
    }
    if (gnista.current) {
      gnista.current.visible = ledig && !flyttar;
      gnista.current.position.y = 0.55 + 0.08 * Math.sin(tid * 1.6);
      gnista.current.rotation.y = tid * 0.9;
    }
  });
  const glodFarg = flyttar ? T.flytta_glod : T.ledig_glod;
  return (
    <group position={[t.x, 0, t.z]}>
      <mesh position={[0, 0.03, 0]} receiveShadow onPointerDown={tryck} userData={{ "data-tomt": i }}>
        <cylinderGeometry args={[T.radie, T.radie + 0.06, 0.06, 28]} />
        <meshToonMaterial color={T.mark} gradientMap={TOON_MAP} />
      </mesh>
      <mesh position={[0, 0.065, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => undefined}>
        <torusGeometry args={[T.radie, 0.07, 6, 28]} />
        <meshToonMaterial color={T.kant} gradientMap={TOON_MAP} />
      </mesh>
      <mesh ref={glans} position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => undefined}>
        <circleGeometry args={[T.radie * 0.92, 28]} />
        <meshBasicMaterial color={glodFarg} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh ref={gnista} raycast={() => undefined}>
        <octahedronGeometry args={[0.13, 0]} />
        <meshBasicMaterial color={T.ledig_glod} />
      </mesh>
    </group>
  );
}

export function Hemdalen() {
  const garden = useMinne((s) => s.garden);
  const karta = useMemo(() => tomtKarta(garden), [garden]);
  const lage = useDalLage();
  const upptagna = useMemo(() => new Set(karta.values()), [karta]);
  // Byggen som finns när dalen visas första gången har redan vuxit fram; bara nya får byggstudsen.
  const kanda = useRef<Set<string> | null>(null);
  kanda.current ??= new Set(garden.map((b) => b.uid));
  return (
    <group name="hemdalen">
      {TOMTER.map((t, i) => (
        <Tomtplatta key={i} t={t} i={i} ledig={!upptagna.has(i)} flyttar={lage.flyttar} vald={lage.vald === i} />
      ))}
      {garden.map((b) => {
        const i = karta.get(b.uid);
        const t = i == null ? undefined : TOMTER[i];
        if (!t) return null;
        const pos = { wx: t.x, wz: t.z };
        if (arKantBygge(b.bygg)) return <ByggeModell key={b.uid} b={b} flyttar={lage.flyttar != null} pos={pos} />;
        return <Byggverk key={b.uid} b={b} pos={pos} flyttar={lage.flyttar != null} ny={!kanda.current!.has(b.uid)} />;
      })}
    </group>
  );
}
