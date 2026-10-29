// Block 1 (En värld): Hemdalen. Gårdens byggen står på tomter runt ängen, i samma scen som djuren.
// Lediga tomter glimmar (som de tomma tomterna i Slime Rancher): tryck på en, så hamnar nästa bygge där.
// När barnet flyttar ett bygge lyser alla tomter, och ett tryck på en tomt flyttar dit.
import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { oppnaTomter, useDal } from "./utbyggnad.ts";

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
const OPPEN_FARG = new THREE.Color("#FFFFFF");
const LAST_FARG = new THREE.Color(DALEN.utbyggnader.las_farg).multiplyScalar(0.9);
const LIGG = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

/** Alla tomter i tre instansierade nät (platta, kant, gnistor) i stället för fyra nät per tomt: håller nere
 *  antalet ritanrop i dalen. Glöden när barnet flyttar eller har valt en tomt ritas bara då. */
function Tomtplattor({ ledig, last, flyttar, vald }: { ledig: (i: number) => boolean; last: (i: number) => boolean; flyttar: string | null; vald: number | null }) {
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
    TOMTER.forEach((_, i) => platta.current?.setColorAt(i, last(i) ? LAST_FARG : OPPEN_FARG));
    if (platta.current?.instanceColor) platta.current.instanceColor.needsUpdate = true;
    if (kant.current) kant.current.instanceMatrix.needsUpdate = true;
    platta.current?.computeBoundingSphere();
  }, [last]);
  const tryck = usePennTryck(() => {
    const i = senast.current;
    if (i == null) return;
    if (last(i)) {
      if (flyttar || !kamera.current) return;
      const t = TOMTER[i]!;
      const p = skarmPunkt(t.x, 0.4, t.z, kamera.current);
      brygga.skicka({ typ: "tomt", tomt: i, x: p.x, y: p.y });
      return;
    }
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
      const fri = ledig(i) && !last(i) && !flyttar;
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

/** En skylt per låst utbyggnad: namn, lås och pris, mitt bland tomterna. */
function Utbyggnadsskyltar({ oppna }: { oppna: ReadonlySet<number> }) {
  const skyltar = useMemo(
    () =>
      DALEN.utbyggnader.lista
        .filter((u) => !u.tomter.every((t) => oppna.has(t)))
        .map((u) => {
          // Skylten står vid den främsta tomten i gruppen, lite närmare ängen, så att den syns.
          const p0 = u.tomter.map((t) => TOMTER[t]!).reduce((a, t) => ({ x: a.x + t.x / u.tomter.length, z: a.z + t.z / u.tomter.length }), { x: 0, z: 0 });
          const p = { x: p0.x * 0.82, z: Math.max(p0.z, -3.2) };
          return { u, p, karta: skyltTextur(`🔒 ${u.namn} ★${u.pris}`) };
        }),
    [oppna],
  );
  useFrame(({ camera, gl }) => {
    // För prov: skyltarnas skärmpunkter (CSS-px).
    const r = gl.domElement.getBoundingClientRect();
    (window as unknown as { __utbyggnad?: Record<string, { x: number; y: number }> }).__utbyggnad = Object.fromEntries(
      skyltar.map(({ u, p }) => {
        const v = _v.set(p.x, 1.4, p.z).project(camera);
        return [u.id, { x: Math.round(r.left + (v.x * 0.5 + 0.5) * r.width), y: Math.round(r.top + (-v.y * 0.5 + 0.5) * r.height) }];
      }),
    );
  });
  return (
    <>
      {skyltar.map(({ u, p, karta }) =>
        karta ? (
          <sprite
            key={u.id}
            position={[p.x, 1.4, p.z]}
            scale={[2.6, 0.65, 1]}
            userData={{ "data-utbyggnad": u.id }}
            onClick={(e) => {
              if (e.delta > 12) return;
              e.stopPropagation();
              const t = TOMTER[u.tomter[0]!]!;
              const sp = skarmPunkt(t.x, 0.4, t.z, e.camera);
              brygga.skicka({ typ: "tomt", tomt: u.tomter[0]!, x: sp.x, y: sp.y });
            }}
          >
            <spriteMaterial map={karta} transparent depthWrite={false} />
          </sprite>
        ) : null,
      )}
    </>
  );
}

function skyltTextur(text: string): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const x = c.getContext("2d");
  if (!x) return null;
  x.fillStyle = "rgba(255,246,229,0.95)";
  x.beginPath();
  x.roundRect(8, 8, 496, 112, 40);
  x.fill();
  x.lineWidth = 6;
  x.strokeStyle = DALEN.utbyggnader.las_farg;
  x.stroke();
  x.fillStyle = "#3B2F2F";
  x.font = "800 52px Fredoka, system-ui, sans-serif";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText(text, 256, 68, 470);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function Hemdalen({ natt = 0 }: { natt?: number }) {
  const garden = useMinne((s) => s.garden);
  const utbyggnader = useDal((s) => s.utbyggnader);
  const oppna = useMemo(() => oppnaTomter(utbyggnader), [utbyggnader]);
  const karta = useMemo(() => tomtKarta(garden, oppna), [garden, oppna]);
  const lage = useDalLage();
  const upptagna = useMemo(() => new Set(karta.values()), [karta]);
  const last = useCallback((i: number) => !oppna.has(i) && !upptagna.has(i), [oppna, upptagna]);
  // Äldre sparfiler: byggen utan tomt får sin tomt sparad en gång, så att alla delar av spelet ser samma plats.
  useEffect(() => {
    if (!garden.some((b) => b.tomt == null)) return;
    useMinne.setState({ garden: garden.map((b) => (b.tomt == null ? { ...b, tomt: karta.get(b.uid) ?? null } : b)) });
  }, [garden, karta]);
  // Byggen som finns när dalen visas första gången har redan vuxit fram; bara nya får byggstudsen.
  const kanda = useRef<Set<string> | null>(null);
  kanda.current ??= new Set(garden.map((b) => b.uid));
  return (
    <group name="hemdalen">
      <Tomtplattor ledig={(i) => !upptagna.has(i)} last={last} flyttar={lage.flyttar} vald={lage.vald} />
      <Utbyggnadsskyltar oppna={oppna} />
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
