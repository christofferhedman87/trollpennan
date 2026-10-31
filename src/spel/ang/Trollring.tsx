// Nya Skapa 6.10–6.11: trollringen på marken och hologrammet i den. Ringen visar var nästa skapelse hamnar och
// syns bara när Pennans bok är öppen. Hologrammet är den riktiga modellen (djurets GLB eller Byggverk) med
// hologrammaterial; varje ändrat ord ger en liten studs. Kameran förskjuts så att ringen syns ovanför arket.
import { useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { DjurSignal } from "../gltfDjur.tsx";
import type { GltfDjur } from "../gltfDjur.tsx";
import { malhojd, takSkala } from "../entiteter.ts";
import { ritSkala } from "../placering.ts";
import { platsMed, START_PLATS } from "../platser.ts";

import { Byggverk } from "../dal/Byggverk.tsx";
import { forhand } from "../skapa/forhand.ts";
import { SammansattDjur } from "./SammansattDjur.tsx";
import { gorHolo, HOLO_TID } from "./holoMaterial.ts";
import { bokHoloYta, passaHolo } from "./holoYta.ts";


import { synligModellRuta } from "../modeller/synligRuta.ts";

const _v = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _box = new THREE.Box3();
const _hx = [0, 0, 0, 0, 0, 0, 0, 0].map(() => new THREE.Vector3());
/** Bara dev och prov (aldrig för barn): hologrammets ruta på skärmen i CSS-px, för att provet ska kunna se att det syns. */
const PROV = import.meta.env.DEV || (typeof navigator !== "undefined" && navigator.webdriver === true);
let provRam = 0;
function holoRuta(g: THREE.Group, camera: THREE.Camera, gl: THREE.WebGLRenderer) {
  synligModellRuta(g, _box);
  if (_box.isEmpty()) return;
  const r = gl.domElement.getBoundingClientRect();
  const { min, max } = _box;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  [0, 1].forEach((i) => [0, 1].forEach((j) => [0, 1].forEach((k) => {
    const p = _hx[i * 4 + j * 2 + k]!.set(i ? max.x : min.x, j ? max.y : min.y, k ? max.z : min.z).project(camera);
    const sx = r.left + ((p.x + 1) / 2) * r.width;
    const sy = r.top + ((1 - p.y) / 2) * r.height;
    x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
  })));
  return { x0, y0, x1, y1 };
}
function provHologram(g: THREE.Group, camera: THREE.Camera, gl: THREE.WebGLRenderer) {
  if (++provRam % 6 !== 0) return;
  const ruta = holoRuta(g, camera, gl);
  if (!ruta) return;
  const { x0, y0, x1, y1 } = ruta;
  const l = forhand.lage();
  (window as unknown as { __trollholo?: unknown }).__trollholo = {
    plats: l.plats, nyckel: l.nyckel, kropp: l.spec?.typ === "djur" ? l.spec.spec.kropp : null, y: l.holoY, krymp: l.krymp,
    x0: Math.round(x0), y0: Math.round(y0), x1: Math.round(x1), y1: Math.round(y1), skala: Math.round(g.scale.y * 1000) / 1000,
  };
}

/** En flygare svävar i förhandsvisningen över ringen, men högst så här högt (m): luftbandet ligger på 1,6–2,4 m, och högre än så
 *  ryms inte mellan HUD:en och arket i stående. Fisken (strax över vattnet) och marken påverkas inte. */
const HOLO_MAX_Y = 1.1;
const synY = (holoY: number) => Math.min(holoY, HOLO_MAX_Y);

/** Ungefärlig höjd i meter på det som förhandsvisas, räknat från marken (en fågel i luften står högre: `holoY`). */
function hojdFor(spec: ReturnType<typeof forhand.lage>["spec"], holoY = 0): number {
  if (!spec) return 1;
  if (spec.typ === "bygg") return 2.2;
  return synY(holoY) + Math.max(0.6, malhojd(spec.spec.kropp) * (spec.spec.skala || 1) * 1.15);
}
const LIGG = new THREE.Euler(-Math.PI / 2, 0, 0);

function useForhand() {
  const [, rita] = useState(0);
  useEffect(() => forhand.lyssna(() => rita((n) => n + 1)), []);
  return forhand.lage();
}

function Ring({ r }: { r: number }) {
  const tex = useTexture("/ui/skapa/trollring.png");
  const ref = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const blixt = useRef({ id: forhand.lage().blixt, t: -1 });
  useFrame(({ clock }, dt) => {
    const m = ref.current;
    if (!m) return;
    m.rotation.z += dt * 0.45;
    const l = forhand.lage();
    const b = blixt.current;
    if (l.blixt !== b.id) {
      b.id = l.blixt;
      b.t = clock.elapsedTime;
    }
    const u = b.t < 0 ? 1 : (clock.elapsedTime - b.t) / 0.7;
    if (mat.current) mat.current.opacity = u < 1 ? 1 : 0.9;
    const s = u < 1 ? 1 + Math.sin(u * Math.PI) * 0.35 : 1;
    m.scale.setScalar(s);
    if (mat.current) mat.current.color.setScalar(u < 1 ? 1 + Math.sin(u * Math.PI) * 1.2 : 1);
  });
  return (
    <mesh ref={ref} rotation={LIGG} position={[0, 0.06, 0]} raycast={() => undefined} renderOrder={2}>
      <planeGeometry args={[r * 2, r * 2]} />
      <meshBasicMaterial ref={mat} map={tex} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </mesh>
  );
}

function HoloDjur({ spec, z, plats, krymp }: { spec: Parameters<typeof GltfDjur>[0]["spec"]; z: number; plats: string; krymp: number }) {
  const signal = useRef<DjurSignal>({ klapp: 0, ror: 0 });
  // Samma storlek som djuret får på sin plats (djur.tsx: krymp först, sedan takSkala × ritSkala för platsen).
  const rit = krymp !== 1 ? { ...spec, skala: (spec.skala || 1) * krymp } : spec;
  const s = takSkala(spec.kropp, rit.skala || 1) * ritSkala(rit, z, platsMed(plats));
  return <group scale={s}><SammansattDjur spec={spec} signal={signal} holo /></group>;
}

/** Hologrammet: studsar när meningen ändras, svävar lätt, blir solitt när barnet trollar. */
function Hologram() {
  const l = useForhand();
  const grupp = useRef<THREE.Group>(null);
  const solid = useRef({ value: 0 });
  const studs = useRef({ id: l.studs, t: -1 });
  const blixt = useRef(l.blixt);
  // Hur långt ner HUD:en når (Väktarens remsa på utflykterna): hologrammet skalas så att det ryms under den.
  const hud = useRef({ n: 0, botten: 90 });
  useEffect(() => {
    solid.current.value = 0;
  }, [l.nyckel]);
  useEffect(() => {
    if (PROV && !l.spec) (window as unknown as { __trollholo?: unknown }).__trollholo = null;
  }, [l.spec]);
  useFrame(({ clock, camera, gl }) => {
    const g = grupp.current;
    if (!g) return;
    HOLO_TID.value = clock.elapsedTime;
    gorHolo(g, solid.current);
    const t = clock.elapsedTime;
    const s = studs.current;
    if (forhand.lage().studs !== s.id) {
      s.id = forhand.lage().studs;
      s.t = t;
    }
    if (forhand.lage().blixt !== blixt.current) {
      blixt.current = forhand.lage().blixt;
      s.t = t;
      solid.current.value = 1;
    }
    const u = s.t < 0 ? 1 : Math.min(1, (t - s.t) / 0.38);
    const sy = u < 1 ? 0.82 + (1 - Math.cos(u * Math.PI)) * 0.15 + Math.sin(u * Math.PI) * 0.15 : 1;
    const sx = 1 / Math.sqrt(sy);
    // 6.10: är det trångt under HUD:en skalas hologrammet ner (minst 0,55), så att hela skapelsen syns.
    const ring = forhand.lage().ring;
    let pass = 1;
    if (ring) {
      const rr = gl.domElement.getBoundingClientRect();
      if (hud.current.n++ % 10 === 0) {
        const remsa = document.querySelector('[data-s4="vaktar-aptitbubbla"]');
        hud.current.botten = remsa ? Math.max(90, remsa.getBoundingClientRect().bottom + 14) : 90;
      }
      const y0 = -_a.set(ring.x, 0, ring.z).project(camera).y;
      const y1 = -_b.set(ring.x, hojdFor(forhand.lage().spec, forhand.lage().holoY), ring.z).project(camera).y;
      const behov = ((y0 - y1) / 2) * rr.height;
      const plats = ((y0 + 1) / 2) * rr.height - hud.current.botten;
      // Minst 0,55 som förut; är det trångt under en remsa får det gå ner till 0,4 så att hela skapelsen ändå syns.
      const minst = hud.current.botten > 90 ? 0.4 : 0.55;
      if (behov > 0 && plats > 0) pass = Math.max(minst, Math.min(1, plats / behov));
    }
    // Använd den riktiga modellens ruta när den fria ytan också avgränsas av Pennan och Stäng.
    // Både modell och svävhöjd krymper kring samma markpunkt; ringens verkliga plats ändras aldrig.
    const hojd = l.spec?.typ === "djur" ? synY(l.holoY) + 0.08 + Math.sin(t * 2.4) * 0.04 : 0;
    const duk = gl.domElement.getBoundingClientRect();
    const yta = bokHoloYta(duk, l.spec?.typ === "djur" && l.spec.spec.tillbehor.length > 0);
    if (yta && ring) {
      g.scale.set(sx, sy, sx);
      g.position.y = hojd;
      const ruta = holoRuta(g, camera, gl);
      _v.set(ring.x, 0, ring.z).project(camera);
      if (ruta) pass = passaHolo(ruta, duk.left + (_v.x + 1) * duk.width / 2, duk.top + (1 - _v.y) * duk.height / 2, yta);
    }
    g.scale.set(sx * pass, sy * pass, sx * pass);
    g.position.y = hojd * pass;
    if (PROV) provHologram(g, camera, gl);
  });
  if (!l.spec || !l.ring) return null;
  return (
    <group ref={grupp}>
      {l.spec.typ === "djur" ? (
        <HoloDjur key={l.nyckel} spec={l.spec.spec} z={l.ring.z} plats={l.plats} krymp={l.krymp} />
      ) : (
        <group position={[-l.ring.x, 0, -l.ring.z]}>
          <Byggverk key={l.nyckel} b={l.spec.bygge} pos={{ wx: l.ring.x, wz: l.ring.z }} flyttar={false} ny={false} />
        </group>
      )}
    </group>
  );
}

/** Kameran: bilden förskjuts (setViewOffset) så att ringen hamnar ca 40 px ovanför arkets kant. Kameran själv flyttas
 *  inte, så panorering och zoom fungerar som förut. Liggande förskjuts bilden i sidled i stället. */
function ArkKamera() {
  const { camera, gl } = useThree();
  const cur = useRef({ x: 0, y: 0 });
  useFrame((_, dt) => {
    const cam = camera as THREE.PerspectiveCamera;
    const l = forhand.lage();
    const r = gl.domElement.getBoundingClientRect();
    const w = r.width;
    const h = r.height;
    let mx = 0;
    let my = 0;
    if (l.oppen && l.ring && w > 0 && h > 0) {
      _v.set(l.ring.x, 0, l.ring.z).project(cam);
      // Ringens läge utan nuvarande förskjutning.
      const sx = (_v.x * 0.5 + 0.5) * w + cur.current.x;
      const sy = (-_v.y * 0.5 + 0.5) * h + cur.current.y;
      const sammansatt = l.spec?.typ === "djur" && l.spec.spec.tillbehor.length > 0;
      const friYta = bokHoloYta(r, sammansatt);
      if (friYta) {
        mx = sx - ((friYta.left + friYta.right) / 2 - r.left);
        // En sammansättning har även markyta framför ringen, som behöver rum nedåt.
        const ringY = sammansatt ? friYta.top + (friYta.bottom - friYta.top) * 0.65 : friYta.bottom - 12;
        my = sy - (ringY - r.top);
      } else if (w > h && l.arkVanster != null) {
        mx = sx - (l.arkVanster - r.left) / 2;
        my = Math.max(0, sy - h * 0.7);
      }
      else if (l.arkKant != null) {
        my = Math.max(0, sy - (l.arkKant - r.top - 40));
        // Ligger ringen nära kanten flyttas bilden i sidled också, så att hologrammet syns helt.
        if (Math.abs(sx - w / 2) > w * 0.22) mx = sx - w / 2 - Math.sign(sx - w / 2) * w * 0.22;
      }
      forhand.sattRingSkarm({ x: r.left + sx - cur.current.x, y: r.top + sy - cur.current.y });
      (window as unknown as { __trollring?: unknown }).__trollring = { plats: l.plats, x: Math.round(r.left + sx - cur.current.x), y: Math.round(r.top + sy - cur.current.y), dy: Math.round(cur.current.y), dx: Math.round(cur.current.x), wx: l.ring.x, wz: l.ring.z };
    }
    const k = 1 - Math.exp(-dt * 6);
    cur.current.x += (mx - cur.current.x) * k;
    cur.current.y += (my - cur.current.y) * k;
    if (PROV) (window as unknown as { __trollvy?: unknown }).__trollvy = { aktiv: !!cam.view?.enabled, x: Math.round(cur.current.x), y: Math.round(cur.current.y), oppen: l.oppen, calls: gl.info.render.calls, tris: gl.info.render.triangles };
    if (Math.abs(cur.current.x) < 0.5 && Math.abs(cur.current.y) < 0.5 && !mx && !my) {
      if (cam.view?.enabled) cam.clearViewOffset();
      cur.current.x = 0;
      cur.current.y = 0;
      return;
    }
    cam.setViewOffset(w, h, cur.current.x, cur.current.y, w, h);
  });
  useEffect(() => () => (camera as THREE.PerspectiveCamera).clearViewOffset(), [camera]);
  return null;
}

/** `plats` = platsen scenen visar. Ringen och hologrammet ritas bara när förhandsvisningen gäller just den platsen. */
export function Trollring({ plats = START_PLATS }: { plats?: string }) {
  const l = useForhand();
  return (
    <>
      <ArkKamera />
      {l.oppen && l.ring && l.plats === plats ? (
        <group position={[l.ring.x, 0, l.ring.z]}>
          <Suspense fallback={null}>
            <Ring r={l.ring.r} />
          </Suspense>
          <Hologram />
        </group>
      ) : null}
    </>
  );
}
