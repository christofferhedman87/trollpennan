// Stigar och skyltar från Ängen till de andra platserna (ersätter de fyra lösa skyltarna och de svävande
// namnknapparna i Vagvisare3D/VagvisareHud). Varje plats har en stig från ängens bakkant och en egen pilformad
// skylt med namnet målat på brädan. Två stolpar vid stigarnas förgreningar: Skogen och Gården till vänster,
// Grottan och Sjön till höger. Tryck på skylten (eller på platsen i fjärran, HorisontVarld) reser dit.
// Layouten kommer från varldsKarta.ts; namn och färger från data/platser.json (varldskarta).
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { KAMERA_ANG } from "../skarm.ts";
import { InstansModell } from "../kenneyNatur.tsx";
import { TOON_MAP } from "./djur.tsx";
import { usePennTryck } from "./delat.ts";
import { RESMAL, STOLPAR, skyltFor, type Resmal, type ResmalId, type Stolpe } from "./varldsKarta.ts";

/** Brädans mått i meter. En textrad på ca 0,3 m blir ca 18–20 px hög på en stående telefon vid z ≈ −2,5 (skarm.ts). */
const BRADA = { bredd: 1.3, hojd: 0.42, spets: 0.22, djup: 0.06 };
const STOLPE_HOJD = 1.72;
const TRA = "#9a6a3c";
const TEXT_FARG = "#3b2614";
/** Stigen ligger strax över markens svaj (damm.ts: SVAJ_AMP 0,06). */
const STIG_Y = 0.075;

function pilForm(hoger: boolean): THREE.Shape {
  const { bredd: w, hojd: h, spets: t } = BRADA;
  const s = new THREE.Shape();
  const x = (v: number) => (hoger ? v : -v);
  s.moveTo(x(-w / 2), -h / 2);
  s.lineTo(x(w / 2 - t), -h / 2);
  s.lineTo(x(w / 2), 0);
  s.lineTo(x(w / 2 - t), h / 2);
  s.lineTo(x(-w / 2), h / 2);
  s.closePath();
  return s;
}

/** Framsidan som egen yta med UV 0..1 över brädans ruta, så att canvas-bilden täcker hela pilen. */
function framsida(hoger: boolean): THREE.ShapeGeometry {
  const g = new THREE.ShapeGeometry(pilForm(hoger));
  const pos = g.getAttribute("position");
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = pos.getX(i) / BRADA.bredd + 0.5;
    uv[i * 2 + 1] = pos.getY(i) / BRADA.hojd + 0.5;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
}

/** Brädans målning: ljus platsfärg, mörkare kant och namnet i Fredoka (samma typsnitt som spelets rubriker). */
function malaSkylt(c: HTMLCanvasElement, namn: string, farg: string, kant: string, hoger: boolean) {
  const x = c.getContext("2d");
  if (!x) return;
  const W = c.width;
  const H = c.height;
  const t = (BRADA.spets / BRADA.bredd) * W;
  const px = (v: number) => (hoger ? v : W - v);
  x.clearRect(0, 0, W, H);
  const pil = () => {
    x.beginPath();
    x.moveTo(px(0), 0);
    x.lineTo(px(W - t), 0);
    x.lineTo(px(W), H / 2);
    x.lineTo(px(W - t), H);
    x.lineTo(px(0), H);
    x.closePath();
  };
  pil();
  x.fillStyle = farg;
  x.fill();
  x.lineWidth = H * 0.11;
  x.strokeStyle = kant;
  x.lineJoin = "round";
  x.stroke();
  // Texten står i den raka delen av brädan, inte i spetsen.
  const mitt = hoger ? (W - t) / 2 + H * 0.04 : t + (W - t) / 2 - H * 0.04;
  let storlek = H * 0.62;
  x.font = `700 ${storlek}px Fredoka, Nunito, sans-serif`;
  const maxBredd = (W - t) * 0.86;
  while (x.measureText(namn).width > maxBredd && storlek > H * 0.3) {
    storlek -= 4;
    x.font = `700 ${storlek}px Fredoka, Nunito, sans-serif`;
  }
  x.fillStyle = TEXT_FARG;
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText(namn, mitt, H / 2 + storlek * 0.05);
}

function useSkyltTextur(id: ResmalId, hoger: boolean): THREE.CanvasTexture | null {
  const tex = useMemo(() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = 768;
    c.height = Math.round((768 * BRADA.hojd) / BRADA.bredd);
    const { namn, farg, kant } = skyltFor(id);
    malaSkylt(c, namn, farg, kant, hoger);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [id, hoger]);
  useEffect(() => {
    if (!tex || typeof document === "undefined" || !document.fonts) return;
    let aktiv = true;
    // Måla om när Fredoka har laddats, annars kan första målningen bli i reservtypsnittet.
    document.fonts.load("700 96px Fredoka").then(() => {
      if (!aktiv) return;
      const { namn, farg, kant } = skyltFor(id);
      malaSkylt(tex.image as HTMLCanvasElement, namn, farg, kant, hoger);
      tex.needsUpdate = true;
    }).catch(() => undefined);
    return () => {
      aktiv = false;
      tex.dispose();
    };
  }, [tex, id, hoger]);
  return tex;
}

function Brada({ r, hoger, onValj }: { r: Resmal; hoger: boolean; onValj: (id: ResmalId) => void }) {
  const grupp = useRef<THREE.Group>(null);
  const gung = useRef(0);
  const tex = useSkyltTextur(r.id, hoger);
  const kropp = useMemo(() => new THREE.ExtrudeGeometry(pilForm(hoger), { depth: BRADA.djup, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 1 }), [hoger]);
  const fram = useMemo(() => framsida(hoger), [hoger]);
  useEffect(() => () => {
    kropp.dispose();
    fram.dispose();
  }, [kropp, fram]);
  const ned = usePennTryck(() => {
    gung.current = 1;
    onValj(r.id);
  });
  // Den övre brädan pekar mot platsen längre bort och lutar lite uppåt.
  const lutning = r.ovre ? (hoger ? 0.12 : -0.12) : 0;
  const forskjut = (hoger ? 1 : -1) * 0.24;
  const y = r.ovre ? 1.38 : 0.93;
  useFrame((_, dt) => {
    const g = grupp.current;
    if (!g) return;
    gung.current = Math.max(0, gung.current - dt * 1.6);
    g.rotation.z = lutning + Math.sin(gung.current * 18) * 0.12 * gung.current;
  });
  return (
    <group ref={grupp} position={[forskjut, y, 0.06]} onPointerDown={ned} onPointerOver={() => { document.body.style.cursor = "pointer"; }} onPointerOut={() => { document.body.style.cursor = ""; }} name={`skylt-${r.id}`}>
      <mesh geometry={kropp} castShadow>
        <meshStandardMaterial color={TRA} roughness={0.85} />
      </mesh>
      <mesh geometry={fram} position={[0, 0, BRADA.djup + 0.017]}>
        <meshStandardMaterial map={tex ?? undefined} color={tex ? "#ffffff" : skyltFor(r.id).farg} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Skyltstolpe({ sida, onValj }: { sida: Stolpe; onValj: (id: ResmalId) => void }) {
  const [x, z] = STOLPAR[sida];
  const hoger = sida === "hoger";
  // Skylten vänds mot kameran så att texten går att läsa från startvyn.
  const ry = Math.atan2(KAMERA_ANG[0] - x, KAMERA_ANG[2] - z);
  const rader = RESMAL.filter((r) => r.stolpe === sida);
  return (
    <group position={[x, 0, z]} rotation={[0, ry, 0]} name={`skyltstolpe-${sida}`}>
      <mesh position={[0, STOLPE_HOJD / 2, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.065, STOLPE_HOJD, 8]} />
        <meshStandardMaterial color={TRA} roughness={0.9} />
      </mesh>
      <mesh position={[0, STOLPE_HOJD + 0.05, 0]} castShadow>
        <coneGeometry args={[0.1, 0.14, 8]} />
        <meshStandardMaterial color="#7a4f2a" roughness={0.9} />
      </mesh>
      {rader.map((r) => (
        <Brada key={r.id} r={r} hoger={hoger} onValj={onValj} />
      ))}
    </group>
  );
}

/** Stigens sandband längs en mjuk kurva, smalare mot platsen. */
function stigGeometri(punkter: readonly (readonly [number, number])[], brett: number, smalt: number, y: number): THREE.BufferGeometry {
  const kurva = new THREE.CatmullRomCurve3(punkter.map(([x, z]) => new THREE.Vector3(x, y, z)));
  const n = 48;
  const pos = new Float32Array((n + 1) * 2 * 3);
  const idx: number[] = [];
  const p = new THREE.Vector3();
  const t = new THREE.Vector3();
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    kurva.getPointAt(u, p);
    kurva.getTangentAt(u, t);
    const nx = -t.z;
    const nz = t.x;
    const l = Math.hypot(nx, nz) || 1;
    const b = (brett + (smalt - brett) * u) / 2;
    pos.set([p.x + (nx / l) * b, y, p.z + (nz / l) * b, p.x - (nx / l) * b, y, p.z - (nz / l) * b], i * 6);
    if (i < n) {
      const a = i * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Stenplattor (samma modell som ängens stig i förgrunden) på stigens första meter. */
function stenarLangs(punkter: readonly (readonly [number, number])[]): [number, number, number, number, number][] {
  const kurva = new THREE.CatmullRomCurve3(punkter.map(([x, z]) => new THREE.Vector3(x, 0, z)));
  const langd = kurva.getLength();
  const ut: [number, number, number, number, number][] = [];
  const p = new THREE.Vector3();
  for (let d = 0.35, i = 0; d < Math.min(langd, 4.2); d += 0.62, i++) {
    kurva.getPointAt(d / langd, p);
    ut.push([p.x + (i % 2 ? 0.07 : -0.07), p.z, 0.42 - d * 0.03, (i * 0.9) % 3.1, 0]);
  }
  return ut;
}

function Stig({ r }: { r: Resmal }) {
  const kant = useMemo(() => stigGeometri(r.stig, 0.6, 0.38, STIG_Y - 0.004), [r]);
  const mitt = useMemo(() => stigGeometri(r.stig, 0.48, 0.28, STIG_Y), [r]);
  useEffect(() => () => {
    kant.dispose();
    mitt.dispose();
  }, [kant, mitt]);
  return (
    <group name={`stig-${r.id}`}>
      <mesh geometry={kant} receiveShadow raycast={() => null}>
        <meshToonMaterial color="#cfae7c" gradientMap={TOON_MAP} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      <mesh geometry={mitt} receiveShadow raycast={() => null}>
        <meshToonMaterial color="#e6cba0" gradientMap={TOON_MAP} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
    </group>
  );
}

const STENAR = RESMAL.flatMap((r) => stenarLangs(r.stig));

export function StigarOchSkyltar({ onValjPlats }: { onValjPlats: (id: ResmalId) => void }) {
  return (
    <group name="stigar-och-skyltar">
      {RESMAL.map((r) => (
        <Stig key={r.id} r={r} />
      ))}
      <InstansModell url="/models/natur/path_stone.glb" platser={STENAR} />
      <Skyltstolpe sida="vanster" onValj={onValjPlats} />
      <Skyltstolpe sida="hoger" onValj={onValjPlats} />
    </group>
  );
}
