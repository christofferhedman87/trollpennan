import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type JSX } from "react";
import * as THREE from "three";
import type { Varelse } from "../tolk/typer.ts";
import { effekterFor, type EffektNamn } from "./attribut.ts";
import type { Ankare } from "./tillbehor/index.ts";

const ELD_N = 24;
const GLITTER_N = 32;

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

const glodBlick = new THREE.Vector3();
const glodKvat = new THREE.Quaternion();

function Aura({ ankare }: { ankare: Ankare }) {
  const mat = useRef<THREE.SpriteMaterial>(null);
  const sprite = useRef<THREE.Sprite>(null);
  const textur = useMemo(() => glodPunkt(), []);
  // Rund gloria: 1,6× den större av bredd och höjd, ritad runt kroppens mitt.
  const span = Math.max(0.25, ankare.bredd, ankare.hojd);
  const storlek = span * 1.6;
  const mittY = ankare.hojd * 0.5;
  // Bakom hela kroppen: halva djupet (större av bredd och höjd) plus marginal,
  // längs kamerans blick så planet ligger bort från betraktaren.
  const bakom = span * 0.5 + 0.12;
  useFrame((state) => {
    const m = mat.current;
    if (m) {
      const puls = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 2.1);
      m.opacity = 0.45 + puls * 0.25;
    }
    const s = sprite.current;
    const parent = s?.parent;
    if (!s || !parent) return;
    parent.updateWorldMatrix(true, false);
    parent.getWorldQuaternion(glodKvat);
    state.camera.getWorldDirection(glodBlick);
    glodBlick.applyQuaternion(glodKvat.invert());
    s.position.set(glodBlick.x * bakom, mittY + glodBlick.y * bakom, glodBlick.z * bakom);
  });
  return (
    <sprite ref={sprite} position={[0, mittY, 0]} scale={[storlek, storlek, 1]} renderOrder={-2}>
      <spriteMaterial
        ref={mat}
        map={textur}
        color="#ffffff"
        transparent
        opacity={0.55}
        depthWrite={false}
        depthTest
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
    // Ellips utanför hela kroppen: sidor (bredd) och över/under (höjd), inte en liten ring uppe.
    const rx = Math.max(0.28, ankare.bredd * 0.72);
    const ry = Math.max(0.28, ankare.hojd * 0.62);
    const yMitt = ankare.hojd * 0.5;
    for (let i = 0; i < GLITTER_N; i++) {
      const a = (i / GLITTER_N) * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * rx;
      pos[i * 3 + 1] = yMitt + Math.sin(a) * ry;
      pos[i * 3 + 2] = 0;
      const vit = i % 2 === 0;
      col[i * 3] = 1;
      col[i * 3 + 1] = vit ? 1 : 0xc8 / 255;
      col[i * 3 + 2] = vit ? 1 : 0x3d / 255;
      fas[i] = a;
      full[i] = 16 + (i % 7);
      storlek[i] = full[i] ?? 18;
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
      const våg = 0.5 + 0.5 * Math.sin(t * 4.2 + (fas[i] ?? 0));
      const bas = full[i] ?? 18;
      arr[i] = 16 + (bas - 16) * våg;
    }
    stor.needsUpdate = true;
  });
  return (
    <points ref={ref} geometry={pack.geo} material={mat} frustumCulled={false} />
  );
}

const LAGOR_N = 44;

/** B6.5: lågor över hela kroppen ("en brinnande hund"). Partiklar stiger från ryggen över kroppens bredd, röd → gul. */
function Lagor({ ankare }: { ankare: Ankare }) {
  const pack = useMemo(() => {
    const pos = new Float32Array(LAGOR_N * 3);
    const col = new Float32Array(LAGOR_N * 3);
    const storlek = new Float32Array(LAGOR_N).fill(18);
    const seed = new Float32Array(LAGOR_N * 3);
    for (let i = 0; i < LAGOR_N; i++) {
      seed[i * 3] = ((i * 0.618) % 1) * 2 - 1;
      seed[i * 3 + 1] = (i * 0.37) % 1;
      seed[i * 3 + 2] = 0.7 + (i % 4) * 0.12;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.setAttribute("pstorlek", new THREE.BufferAttribute(storlek, 1));
    return { geo: g, seed };
  }, []);
  const textur = useMemo(() => mjukPunkt(), []);
  const mat = useMemo(() => punktMedStorlek(textur, 0.95), [textur]);
  const ref = useRef<THREE.Points>(null);
  const ton = useRef({ r: 0, g: 0, b: 0 });
  useFrame((state) => {
    const p = ref.current;
    if (!p) return;
    const attr = p.geometry.getAttribute("position") as THREE.BufferAttribute;
    const col = p.geometry.getAttribute("color") as THREE.BufferAttribute;
    const stor = p.geometry.getAttribute("pstorlek") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const carr = col.array as Float32Array;
    const sarr = stor.array as Float32Array;
    const t = state.clock.elapsedTime;
    const bredd = Math.max(0.25, ankare.bredd) * 0.55;
    const rygg = Math.max(0.2, ankare.hojd * 0.6);
    const hojd = Math.max(0.4, ankare.hojd * 0.95);
    const { seed } = pack;
    for (let i = 0; i < LAGOR_N; i++) {
      const x = seed[i * 3] ?? 0;
      const liv = (t * (seed[i * 3 + 2] ?? 0.8) + (seed[i * 3 + 1] ?? 0)) % 1;
      arr[i * 3] = x * bredd * (1 - liv * 0.5);
      arr[i * 3 + 1] = rygg + liv * hojd;
      arr[i * 3 + 2] = Math.sin(i * 2.3) * bredd * 0.5;
      sarr[i] = 34 - liv * 22;
      const c = ton.current;
      if (liv < 0.35) lerp3(GUL, ORANGE, liv / 0.35, c);
      else lerp3(ORANGE, ROD, (liv - 0.35) / 0.65, c);
      carr[i * 3] = c.r;
      carr[i * 3 + 1] = c.g;
      carr[i * 3 + 2] = c.b;
    }
    attr.needsUpdate = true;
    col.needsUpdate = true;
    stor.needsUpdate = true;
  });
  return <points ref={ref} geometry={pack.geo} material={mat} frustumCulled={false} renderOrder={2} />;
}

const REGNBAGE = ["#E53935", "#FB8C00", "#FDD835", "#43A047", "#1E88E5", "#8E24AA"] as const;

/** B6.5: regnbåge över djuret ("en regnbågsfärgad katt"). En effekt bredvid kroppen – kroppen målas inte om (R9C är pausad). */
function Regnbage({ ankare }: { ankare: Ankare }) {
  const grupp = useRef<THREE.Group>(null);
  const r = Math.max(0.3, ankare.bredd * 0.62, ankare.hojd * 0.55);
  const tjock = r * 0.07;
  const geos = useMemo(
    () => REGNBAGE.map((_, i) => new THREE.TorusGeometry(r - i * tjock * 1.6, tjock * 0.8, 6, 28, Math.PI)),
    [r, tjock],
  );
  const mats = useMemo(
    () => REGNBAGE.map((f) => new THREE.MeshBasicMaterial({ color: f, toneMapped: false, transparent: true, opacity: 0.92, depthWrite: false })),
    [],
  );
  useEffect(() => () => {
    for (const g of geos) g.dispose();
  }, [geos]);
  useEffect(() => () => {
    for (const m of mats) m.dispose();
  }, [mats]);
  useFrame((state) => {
    const g = grupp.current;
    if (!g) return;
    // Bågen vänds mot kameran, så att den syns från alla håll.
    const kam = state.camera.position;
    g.parent?.updateWorldMatrix(true, false);
    g.lookAt(kam.x, g.getWorldPosition(regnbageV).y, kam.z);
    const puls = 0.85 + 0.15 * Math.sin(state.clock.elapsedTime * 2);
    for (const m of mats) m.opacity = 0.75 + 0.2 * puls;
  });
  return (
    <group ref={grupp} position={[0, ankare.hojd * 0.55, 0]} name="regnbage">
      {geos.map((g, i) => (
        <mesh key={i} geometry={g} material={mats[i]} renderOrder={1} />
      ))}
    </group>
  );
}
const regnbageV = new THREE.Vector3();

const EFFEKTER: Record<EffektNamn, (p: { ankare: Ankare }) => JSX.Element> = {
  eld: Eld,
  lagor: Lagor,
  glod: Aura,
  glitter: GlitterRing,
  regnbage: Regnbage,
};

/** Effekterna (eld, lågor, glöd, glitter, regnbåge) som barn till djurets grupp, ur data/attribut.json. Inga effekter ritar inget. */
export function DjurEffekter({ varelse, ankare }: { varelse: Varelse; ankare: Ankare }) {
  const lista = effekterFor(varelse);
  const uid = (varelse as { uid?: string }).uid;
  const nyckel = lista.join(",");
  useEffect(() => {
    const w = window.__tredEffekter;
    if (!w || !uid) return;
    w[uid] = nyckel ? nyckel.split(",") : [];
    return () => {
      delete w[uid];
    };
  }, [uid, nyckel]);
  if (!lista.length) return null;
  return (
    <group name="djur-effekter">
      {lista.map((e) => {
        const K = EFFEKTER[e];
        return K ? <K key={e} ankare={ankare} /> : null;
      })}
    </group>
  );
}
