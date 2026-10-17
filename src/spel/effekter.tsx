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
    for (let i = 0; i < ELD_N; i++) {
      const u = i / (ELD_N - 1);
      col[i * 3] = 1;
      col[i * 3 + 1] = 0.32 + u * 0.62;
      col[i * 3 + 2] = 0.05 + u * 0.2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, []);
  const textur = useMemo(() => mjukPunkt(), []);
  const ref = useRef<THREE.Points>(null);
  const farg = useRef({ r: 0, g: 0, b: 0 });
  useFrame((state) => {
    const p = ref.current;
    if (!p) return;
    const attr = p.geometry.getAttribute("position") as THREE.BufferAttribute;
    const col = p.geometry.getAttribute("color") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const carg = col.array as Float32Array;
    const t = state.clock.elapsedTime;
    const langd = Math.min(0.5, Math.max(0.28, ankare.bredd * 0.5));
    const mx = ankare.mun.x;
    const my = ankare.mun.y;
    const mz = ankare.mun.z;
    const ton = farg.current;
    for (let i = 0; i < ELD_N; i++) {
      const fas = bas[i * 3] ?? 0;
      const forsk = bas[i * 3 + 1] ?? 0;
      const fart = bas[i * 3 + 2] ?? 0.7;
      const liv = (t * fart + forsk) % 1;
      const sid = Math.sin(fas) * liv * 0.035;
      arr[i * 3] = mx + sid;
      arr[i * 3 + 1] = my + Math.cos(fas) * liv * 0.03 + liv * 0.05;
      arr[i * 3 + 2] = mz + fram * liv * langd;
      if (liv < 0.4) lerp3(ROD, ORANGE, liv / 0.4, ton);
      else lerp3(ORANGE, GUL, (liv - 0.4) / 0.6, ton);
      carg[i * 3] = ton.r;
      carg[i * 3 + 1] = ton.g;
      carg[i * 3 + 2] = ton.b;
    }
    attr.needsUpdate = true;
    col.needsUpdate = true;
  });
  return (
    <points ref={ref} geometry={geo} frustumCulled={false} renderOrder={2}>
      <pointsMaterial
        map={textur}
        size={16}
        sizeAttenuation={false}
        vertexColors
        transparent
        opacity={0.92}
        depthWrite={false}
        blending={THREE.NormalBlending}
        toneMapped={false}
      />
    </points>
  );
}

function Aura({ ankare }: { ankare: Ankare }) {
  const mat = useRef<THREE.SpriteMaterial>(null);
  const textur = useMemo(() => mjukPunkt(), []);
  const fram = framZ(ankare);
  const bredd = Math.max(0.25, ankare.bredd);
  const storlek = bredd * 1.5;
  const mittY = ankare.hojd * 0.5;
  const bakom = -fram * bredd * 0.55;
  useFrame((state) => {
    const m = mat.current;
    if (!m) return;
    const puls = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 2.1);
    m.opacity = 0.25 + puls * 0.2;
  });
  return (
    <sprite position={[0, mittY, bakom]} scale={[storlek, storlek, 1]} renderOrder={-1}>
      <spriteMaterial
        ref={mat}
        map={textur}
        color="#FFD56A"
        transparent
        opacity={0.35}
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
    const bas = new Float32Array(GLITTER_N * 3);
    const rad = Math.max(0.32, ankare.bredd * 0.95);
    const y0 = ankare.hojd * 0.42;
    for (let i = 0; i < GLITTER_N; i++) {
      const a = (i / GLITTER_N) * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * rad;
      pos[i * 3 + 1] = y0 + Math.sin(a * 2) * ankare.hojd * 0.1;
      pos[i * 3 + 2] = Math.sin(a) * rad * 0.72;
      const vit = i % 5 === 0;
      bas[i * 3] = 1;
      bas[i * 3 + 1] = vit ? 1 : 0xc8 / 255;
      bas[i * 3 + 2] = vit ? 1 : 0x3d / 255;
      col[i * 3] = bas[i * 3] ?? 1;
      col[i * 3 + 1] = bas[i * 3 + 1] ?? 1;
      col[i * 3 + 2] = bas[i * 3 + 2] ?? 1;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return { geo: g, bas };
  }, [ankare]);
  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    const p = ref.current;
    if (!p) return;
    const col = p.geometry.getAttribute("color") as THREE.BufferAttribute;
    const arr = col.array as Float32Array;
    const bas = pack.bas;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < GLITTER_N; i++) {
      const blink = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(t * 4.2 + i * 0.85));
      arr[i * 3] = (bas[i * 3] ?? 1) * blink;
      arr[i * 3 + 1] = (bas[i * 3 + 1] ?? 1) * blink;
      arr[i * 3 + 2] = (bas[i * 3 + 2] ?? 1) * blink;
    }
    col.needsUpdate = true;
  });
  return (
    <points ref={ref} geometry={pack.geo} frustumCulled={false}>
      <pointsMaterial
        map={textur}
        size={12}
        sizeAttenuation={false}
        vertexColors
        transparent
        opacity={0.95}
        depthWrite={false}
        blending={THREE.NormalBlending}
        toneMapped={false}
      />
    </points>
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
