import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Varelse } from "../tolk/typer.ts";
import type { Ankare } from "./tillbehorFaste.ts";

const ELD_N = 24;
const GLITTER_N = 20;

const ROD = [0xe8 / 255, 0x34 / 255, 0x1c / 255] as const;
const ORANGE = [1, 0x7a / 255, 0x1a / 255] as const;
const GUL = [1, 0xd2 / 255, 0x3f / 255] as const;

let mjukCache: THREE.CanvasTexture | null = null;
let glodCache: THREE.CanvasTexture | null = null;

/** En mjuk rund punkt. Skapas en gång och delas av eld, glöd och glitter. */
function mjukPunkt() {
  if (mjukCache) return mjukCache;
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext("2d");
  if (!ctx) {
    const tom = new THREE.CanvasTexture(c);
    mjukCache = tom;
    return tom;
  }
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,0.85)");
  g.addColorStop(0.72, "rgba(255,255,255,0.25)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  mjukCache = tex;
  return tex;
}

/** Vit kärna, ljusgul fyllning, orange kant. Syns mot ljusgrönt gräs. */
function glodPunkt() {
  if (glodCache) return glodCache;
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext("2d");
  if (!ctx) {
    const tom = new THREE.CanvasTexture(c);
    glodCache = tom;
    return tom;
  }
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.16, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "#FFE066");
  g.addColorStop(0.68, "#FFC44A");
  g.addColorStop(0.84, "rgba(255,140,20,0.95)");
  g.addColorStop(1, "rgba(255,120,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  glodCache = tex;
  return tex;
}

function framZ(ankare: Ankare) {
  // Munnen pekar längs lokal z. Kenney-GLB har mun mot −z, procedurformer mot +z.
  return ankare.mun.z >= 0 ? 1 : -1;
}

function lerp3(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number,
  ut: { r: number; g: number; b: number },
) {
  ut.r = a[0] + (b[0] - a[0]) * t;
  ut.g = a[1] + (b[1] - a[1]) * t;
  ut.b = a[2] + (b[2] - a[2]) * t;
}

const YAW_25 = (25 * Math.PI) / 180;
const KON_20 = (20 * Math.PI) / 180;
const PITCH_UPP = (14 * Math.PI) / 180;

/** Punktstorlek per partikel. `pstorlek` är pixlar (sizeAttenuation av). */
function punktMedStorlek(textur: THREE.Texture, opacity: number) {
  const m = new THREE.PointsMaterial({
    map: textur,
    size: 16,
    sizeAttenuation: false,
    vertexColors: true,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.NormalBlending,
    toneMapped: false,
  });
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float pstorlek;")
      .replace("gl_PointSize = size;", "gl_PointSize = pstorlek;");
  };
  m.customProgramCacheKey = () => "pstorlek";
  return m;
}

function Eld({ ankare }: { ankare: Ankare }) {
  const fram = framZ(ankare);
  const bas = useMemo(() => {
    const seed = new Float32Array(ELD_N * 3);
    for (let i = 0; i < ELD_N; i++) {
      seed[i * 3] = (i / ELD_N) * Math.PI * 2;
      seed[i * 3 + 1] = (i * 0.37) % 1;
      seed[i * 3 + 2] = 0.55 + (i % 5) * 0.09;
    }
    return seed;
  }, []);
  const geo = useMemo(() => {
    const pos = new Float32Array(ELD_N * 3);
    const col = new Float32Array(ELD_N * 3);
    const storlek = new Float32Array(ELD_N);
    storlek.fill(14);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.setAttribute("pstorlek", new THREE.BufferAttribute(storlek, 1));
    return g;
  }, []);
  const textur = useMemo(() => mjukPunkt(), []);
  const mat = useMemo(() => punktMedStorlek(textur, 0.92), [textur]);
  const ref = useRef<THREE.Points>(null);
  const farg = useRef({ r: 0, g: 0, b: 0 });
  useFrame((state) => {
    const p = ref.current;
    if (!p) return;
    const attr = p.geometry.getAttribute("position") as THREE.BufferAttribute;
    const col = p.geometry.getAttribute("color") as THREE.BufferAttribute;
    const stor = p.geometry.getAttribute("pstorlek") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const carg = col.array as Float32Array;
    const sarr = stor.array as Float32Array;
    const t = state.clock.elapsedTime;
    const langd = Math.min(0.55, Math.max(0.32, ankare.bredd * 0.55));
    const mx = ankare.mun.x;
    const my = ankare.mun.y;
    const mz = ankare.mun.z;
    // +25° runt y: mot kameran (fram = −1, kamera på −z) blir x' = −sin 25° < 0,
    // och kamerans höger är då −x. Samma tecken när fram = +1 (höger = +x).
    const ax0 = Math.sin(YAW_25) * Math.cos(PITCH_UPP) * fram;
    const ay0 = Math.sin(PITCH_UPP);
    const az0 = Math.cos(YAW_25) * Math.cos(PITCH_UPP) * fram;
    const alen = Math.hypot(ax0, ay0, az0) || 1;
    const ax = ax0 / alen;
    const ay = ay0 / alen;
    const az = az0 / alen;
    const rx0 = -az;
    const rz0 = ax;
    const rlen = Math.hypot(rx0, rz0) || 1;
    const rx = rx0 / rlen;
    const rz = rz0 / rlen;
    const ux = -rz * ay;
    const uy = rz * ax - rx * az;
    const uz = rx * ay;
    const ton = farg.current;
    for (let i = 0; i < ELD_N; i++) {
      const fas = bas[i * 3] ?? 0;
      const forsk = bas[i * 3 + 1] ?? 0;
      const fart = bas[i * 3 + 2] ?? 0.7;
      const liv = (t * fart + forsk) % 1;
      const dist = liv * langd;
      const vinkel = ((i % 6) / 5) * KON_20;
      const ut = Math.sin(vinkel) * dist;
      const framat = Math.cos(vinkel) * dist;
      const cx = Math.cos(fas);
      const sx = Math.sin(fas);
      arr[i * 3] = mx + ax * framat + (cx * rx + sx * ux) * ut;
      arr[i * 3 + 1] = my + ay * framat + sx * uy * ut;
      arr[i * 3 + 2] = mz + az * framat + (cx * rz + sx * uz) * ut;
      sarr[i] = 14 + liv * 12;
      if (liv < 0.4) lerp3(ROD, ORANGE, liv / 0.4, ton);
      else lerp3(ORANGE, GUL, (liv - 0.4) / 0.6, ton);
      carg[i * 3] = ton.r;
      carg[i * 3 + 1] = ton.g;
      carg[i * 3 + 2] = ton.b;
    }
    attr.needsUpdate = true;
    col.needsUpdate = true;
    stor.needsUpdate = true;
  });
  return (
    <points ref={ref} geometry={geo} material={mat} frustumCulled={false} renderOrder={2} />
  );
}

function Aura({ ankare }: { ankare: Ankare }) {
  const mat = useRef<THREE.SpriteMaterial>(null);
  const textur = useMemo(() => glodPunkt(), []);
  const bredd = Math.max(0.25, ankare.bredd);
  // Ca 2,2× kroppens bredd och minst kroppens höjd, så ringen sticker ut runt silhuetten.
  const sx = bredd * 2.2;
  const sy = Math.max(sx, Math.max(0.25, ankare.hojd) * 2.2);
  const mittY = ankare.hojd * 0.5;
  useFrame((state) => {
    const m = mat.current;
    if (!m) return;
    const puls = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 2.1);
    m.opacity = 0.45 + puls * 0.25;
  });
  return (
    <sprite position={[0, mittY, 0]} scale={[sx, sy, 1]} renderOrder={-2}>
      <spriteMaterial
        ref={mat}
        map={textur}
        color="#ffffff"
        transparent
        opacity={0.55}
        depthWrite={false}
        depthTest={false}
        blending={THREE.NormalBlending}
        toneMapped={false}
      />
    </sprite>
  );
}

function GlitterRing({ ankare }: { ankare: Ankare }) {
  const textur = useMemo(() => mjukPunkt(), []);
  const pack = useMemo(() => {
    const pos = new Float32Array(GLITTER_N * 3);
    const col = new Float32Array(GLITTER_N * 3);
    const storlek = new Float32Array(GLITTER_N);
    const fas = new Float32Array(GLITTER_N);
    const full = new Float32Array(GLITTER_N);
    const rad = Math.max(0.3, Math.min(ankare.bredd * 0.9, ankare.hojd * 0.46));
    const yMitt = ankare.hojd * 0.52;
    for (let i = 0; i < GLITTER_N; i++) {
      const a = (i / GLITTER_N) * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * rad;
      pos[i * 3 + 1] = yMitt + Math.sin(a) * rad;
      pos[i * 3 + 2] = 0;
      const vit = i % 5 === 0;
      col[i * 3] = 1;
      col[i * 3 + 1] = vit ? 1 : 0xc8 / 255;
      col[i * 3 + 2] = vit ? 1 : 0x3d / 255;
      fas[i] = a;
      full[i] = 12 + (i % 5);
      storlek[i] = full[i] ?? 14;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.setAttribute("pstorlek", new THREE.BufferAttribute(storlek, 1));
    return { geo: g, fas, full };
  }, [ankare]);
  const mat = useMemo(() => punktMedStorlek(textur, 1), [textur]);
  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    const p = ref.current;
    if (!p) return;
    const stor = p.geometry.getAttribute("pstorlek") as THREE.BufferAttribute;
    const arr = stor.array as Float32Array;
    const t = state.clock.elapsedTime;
    const fas = pack.fas;
    const full = pack.full;
    for (let i = 0; i < GLITTER_N; i++) {
      const blink = Math.max(0, Math.sin(t * 4.2 + (fas[i] ?? 0)));
      arr[i] = (full[i] ?? 14) * blink;
    }
    stor.needsUpdate = true;
  });
  return (
    <points ref={ref} geometry={pack.geo} material={mat} frustumCulled={false} />
  );
}

/** Eld, glöd och glitter som barn till djurets grupp. Tom förmåga ritar inget. */
export function DjurEffekter({ varelse, ankare }: { varelse: Varelse; ankare: Ankare }) {
  const eld = varelse.formagor.includes("flammor");
  const glod = varelse.formagor.includes("aura");
  const glitter = varelse.monster === "glitter";
  if (!eld && !glod && !glitter) return null;
  return (
    <group name="djur-effekter">
      {glod ? <Aura ankare={ankare} /> : null}
      {eld ? <Eld ankare={ankare} /> : null}
      {glitter ? <GlitterRing ankare={ankare} /> : null}
    </group>
  );
}
