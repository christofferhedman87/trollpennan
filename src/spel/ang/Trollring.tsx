// Nya Skapa 6.10–6.11: trollringen på marken och hologrammet i den. Ringen visar var nästa skapelse hamnar och
// syns bara när Pennans bok är öppen. Hologrammet är den riktiga modellen (djurets GLB eller Byggverk) med
// hologrammaterial; varje ändrat ord ger en liten studs. Kameran förskjuts så att ringen syns ovanför arket.
import { useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { DjurSignal } from "../gltfDjur.tsx";
import { GltfDjur } from "../gltfDjur.tsx";
import { harDjurGltf, malhojd, takSkala } from "../entiteter.ts";
import { ritSkala } from "../placering.ts";
import { platsMed, START_PLATS } from "../platser.ts";

const ANG = platsMed(START_PLATS);
import { Byggverk } from "../dal/Byggverk.tsx";
import { forhand } from "../skapa/forhand.ts";
import { DjurForm, ModellGren } from "./djur.tsx";
import { gorHolo, HOLO_TID } from "./holoMaterial.ts";

const _v = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();

/** Ungefärlig höjd i meter på det som förhandsvisas. */
function hojdFor(spec: ReturnType<typeof forhand.lage>["spec"]): number {
  if (!spec) return 1;
  if (spec.typ === "bygg") return 2.2;
  return Math.max(0.6, malhojd(spec.spec.kropp) * (spec.spec.skala || 1) * 1.15);
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

function HoloDjur({ spec, z }: { spec: Parameters<typeof GltfDjur>[0]["spec"]; z: number }) {
  const signal = useRef<DjurSignal>({ klapp: 0, ror: 0 });
  // Samma storlek som djuret får på ängen (djur.tsx: takSkala × ritSkala).
  const s = takSkala(spec.kropp, spec.skala || 1) * ritSkala(spec, z, ANG);
  return <group scale={s}>{harDjurGltf(spec.kropp) ? (
    <ModellGren spec={spec}>
      <Suspense fallback={<DjurForm spec={spec} signal={signal} />}>
        <GltfDjur spec={spec} signal={signal} />
      </Suspense>
    </ModellGren>
  ) : (
    <DjurForm spec={spec} signal={signal} />
  )}</group>;
}

/** Hologrammet: studsar när meningen ändras, svävar lätt, blir solitt när barnet trollar. */
function Hologram() {
  const l = useForhand();
  const grupp = useRef<THREE.Group>(null);
  const solid = useRef({ value: 0 });
  const studs = useRef({ id: l.studs, t: -1 });
  const blixt = useRef(l.blixt);
  useEffect(() => {
    solid.current.value = 0;
  }, [l.nyckel]);
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
      const y0 = -_a.set(ring.x, 0, ring.z).project(camera).y;
      const y1 = -_b.set(ring.x, hojdFor(forhand.lage().spec), ring.z).project(camera).y;
      const behov = ((y0 - y1) / 2) * rr.height;
      const plats = ((y0 + 1) / 2) * rr.height - 90;
      if (behov > 0 && plats > 0) pass = Math.max(0.55, Math.min(1, plats / behov));
    }
    g.scale.set(sx * pass, sy * pass, sx * pass);
    g.position.y = l.spec?.typ === "djur" ? 0.08 + Math.sin(t * 2.4) * 0.04 : 0;
  });
  if (!l.spec || !l.ring) return null;
  return (
    <group ref={grupp}>
      {l.spec.typ === "djur" ? (
        <HoloDjur key={l.nyckel} spec={l.spec.spec} z={l.ring.z} />
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
      if (w > h && l.arkVanster != null) {
        mx = sx - (l.arkVanster - r.left) / 2;
        my = Math.max(0, sy - h * 0.7);
      }
      else if (l.arkKant != null) {
        my = Math.max(0, sy - (l.arkKant - r.top - 40));
        // Ligger ringen nära kanten flyttas bilden i sidled också, så att hologrammet syns helt.
        if (Math.abs(sx - w / 2) > w * 0.22) mx = sx - w / 2 - Math.sign(sx - w / 2) * w * 0.22;
      }
      forhand.sattRingSkarm({ x: r.left + sx - cur.current.x, y: r.top + sy - cur.current.y });
      (window as unknown as { __trollring?: unknown }).__trollring = { x: Math.round(r.left + sx - cur.current.x), y: Math.round(r.top + sy - cur.current.y), dy: Math.round(cur.current.y), dx: Math.round(cur.current.x), wx: l.ring.x, wz: l.ring.z };
    }
    const k = 1 - Math.exp(-dt * 6);
    cur.current.x += (mx - cur.current.x) * k;
    cur.current.y += (my - cur.current.y) * k;
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

export function Trollring() {
  const l = useForhand();
  return (
    <>
      <ArkKamera />
      {l.oppen && l.ring ? (
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
