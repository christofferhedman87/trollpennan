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
import { Boende } from "./Boende.tsx";
import { skarmPunkt } from "../gard/modellPrep.ts";
import { useMinne } from "../minne.ts";
import { usePennTryck } from "../ang/delat.ts";
import { TOON_MAP } from "../ang/djur.tsx";
import { dalStyr } from "./dalStyr.ts";
import { DALEN, TOMTER, tomtKarta } from "./tomter.ts";

const T = DALEN.tomt;

function useDalLage() {
  const [, rita] = useState(0);
  useEffect(() => dalStyr.lyssna(() => rita((n) => n + 1)), []);
  return dalStyr.lage();
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _v = new THREE.Vector3();
const _s = new THREE.Vector3();
const LIGG = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

/** Alla tomter i tre instansierade nät (platta, kant, gnistor) i stället för fyra nät per tomt: håller nere
 *  antalet ritanrop i dalen. Glöden när barnet flyttar eller har valt en tomt ritas bara då. */
function Tomtplattor({ ledig, flyttar, vald }: { ledig: (i: number) => boolean; flyttar: string | null; vald: number | null }) {
  const platta = useRef<THREE.InstancedMesh>(null);
  const kant = useRef<THREE.InstancedMesh>(null);
  const gnistor = useRef<THREE.InstancedMesh>(null);
  const kamera = useRef<THREE.Camera | null>(null);
  const n = TOMTER.length;
  useEffect(() => {
    TOMTER.forEach((t, i) => {
      _m.compose(_v.set(t.x, 0.03, t.z), _q.identity(), _s.set(1, 1, 1));
      platta.current?.setMatrixAt(i, _m);
      _m.compose(_v.set(t.x, 0.065, t.z), LIGG, _s.set(1, 1, 1));
      kant.current?.setMatrixAt(i, _m);
    });
    if (platta.current) platta.current.instanceMatrix.needsUpdate = true;
    if (kant.current) kant.current.instanceMatrix.needsUpdate = true;
    platta.current?.computeBoundingSphere();
  }, []);
  const tryck = usePennTryck(() => {
    const i = senast.current;
    if (i == null) return;
    if (flyttar) {
      useMinne.getState().sattTomt(flyttar, i);
      dalStyr.flytta(null);
      return;
    }
    const t = TOMTER[i];
    if (!t || !ledig(i) || !kamera.current) return;
    const p = skarmPunkt(t.x, 0.4, t.z, kamera.current);
    brygga.skicka({ typ: "tomt", tomt: i, x: p.x, y: p.y });
  });
  const senast = useRef<number | null>(null);
  useFrame(({ clock, camera, gl }) => {
    kamera.current = camera;
    const g = gnistor.current;
    const tid = clock.elapsedTime;
    const r = gl.domElement.getBoundingClientRect();
    const w = window as unknown as { __tomter?: Record<number, { x: number; y: number; ledig: boolean }> };
    w.__tomter ??= {};
    TOMTER.forEach((t, i) => {
      const fri = ledig(i) && !flyttar;
      _m.compose(_v.set(t.x, 0.55 + 0.08 * Math.sin(tid * 1.6 + i), t.z), _q.setFromAxisAngle(_s.set(0, 1, 0), tid * 0.9 + i), _s.setScalar(fri ? 1 : 0));
      g?.setMatrixAt(i, _m);
      // För prov: tomtens skärmpunkt (CSS-px) och om den är ledig.
      const p = _v.set(t.x, 0.1, t.z).project(camera);
      w.__tomter![i] = { x: Math.round(r.left + (p.x * 0.5 + 0.5) * r.width), y: Math.round(r.top + (-p.y * 0.5 + 0.5) * r.height), ledig: ledig(i) };
    });
    if (g) g.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <instancedMesh
        ref={platta}
        args={[undefined, undefined, n]}
        receiveShadow
        onPointerDown={(e) => {
          senast.current = e.instanceId ?? null;
          tryck(e);
        }}
      >
        <cylinderGeometry args={[T.radie, T.radie + 0.06, 0.06, 28]} />
        <meshToonMaterial color={T.mark} gradientMap={TOON_MAP} />
      </instancedMesh>
      <instancedMesh ref={kant} args={[undefined, undefined, n]} raycast={() => undefined}>
        <torusGeometry args={[T.radie, 0.07, 6, 28]} />
        <meshToonMaterial color={T.kant} gradientMap={TOON_MAP} />
      </instancedMesh>
      <instancedMesh ref={gnistor} args={[undefined, undefined, n]} raycast={() => undefined}>
        <octahedronGeometry args={[0.13, 0]} />
        <meshBasicMaterial color={T.ledig_glod} />
      </instancedMesh>
      {TOMTER.map((t, i) =>
        flyttar || vald === i ? (
          <mesh key={i} position={[t.x, 0.07, t.z]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => undefined}>
            <circleGeometry args={[T.radie * 0.92, 28]} />
            <meshBasicMaterial color={flyttar ? T.flytta_glod : T.ledig_glod} transparent opacity={0.45} depthWrite={false} />
          </mesh>
        ) : null,
      )}
    </group>
  );
}

export function Hemdalen({ natt = 0 }: { natt?: number }) {
  const garden = useMinne((s) => s.garden);
  const karta = useMemo(() => tomtKarta(garden), [garden]);
  const lage = useDalLage();
  const upptagna = useMemo(() => new Set(karta.values()), [karta]);
  // Byggen som finns när dalen visas första gången har redan vuxit fram; bara nya får byggstudsen.
  const kanda = useRef<Set<string> | null>(null);
  kanda.current ??= new Set(garden.map((b) => b.uid));
  return (
    <group name="hemdalen">
      <Tomtplattor ledig={(i) => !upptagna.has(i)} flyttar={lage.flyttar} vald={lage.vald} />
      <Boende natt={natt} />
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
