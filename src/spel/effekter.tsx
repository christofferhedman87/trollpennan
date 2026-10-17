import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Varelse } from "../tolk/typer.ts";
import type { Ankare } from "./tillbehorFaste.ts";

const ELD_N = 24;
const GLITTER_N = 20;

function framZ(ankare: Ankare) {
  // Munnen pekar längs lokal z. Kenney-GLB har mun mot −z, procedurformer mot +z.
  return ankare.mun.z >= 0 ? 1 : -1;
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
  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    const p = ref.current;
    if (!p) return;
    const attr = p.geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const t = state.clock.elapsedTime;
    const rack = Math.max(0.42, ankare.bredd * 1.15);
    const mx = ankare.mun.x;
    const my = ankare.mun.y;
    const mz = ankare.mun.z;
    for (let i = 0; i < ELD_N; i++) {
      const fas = bas[i * 3] ?? 0;
      const forsk = bas[i * 3 + 1] ?? 0;
      const fart = bas[i * 3 + 2] ?? 0.7;
      const liv = (t * fart + forsk) % 1;
      const sid = Math.sin(fas + t * 6) * liv * 0.12;
      arr[i * 3] = mx + Math.cos(fas) * sid;
      arr[i * 3 + 1] = my + liv * (0.28 + ankare.hojd * 0.22);
      arr[i * 3 + 2] = mz + fram * liv * rack;
    }
    attr.needsUpdate = true;
  });
  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <pointsMaterial
        size={14}
        sizeAttenuation={false}
        vertexColors
        transparent
        opacity={0.95}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

function Aura({ ankare }: { ankare: Ankare }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const radie = Math.max(0.25, ankare.bredd * 0.8);
  const fram = framZ(ankare);
  useFrame((state) => {
    const m = mat.current;
    if (!m) return;
    const puls = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 2.1);
    m.opacity = 0.38 + puls * 0.32;
  });
  return (
    <mesh position={[0, ankare.hojd * 0.48, -fram * radie * 0.15]} renderOrder={-1}>
      <sphereGeometry args={[radie, 18, 14]} />
      <meshBasicMaterial
        ref={mat}
        color="#FFE082"
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function GlitterRing({ ankare }: { ankare: Ankare }) {
  const geo = useMemo(() => {
    const pos = new Float32Array(GLITTER_N * 3);
    const col = new Float32Array(GLITTER_N * 3);
    const rad = Math.max(0.28, ankare.bredd * 0.85);
    const y0 = ankare.hojd * 0.45;
    for (let i = 0; i < GLITTER_N; i++) {
      const a = (i / GLITTER_N) * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * rad;
      pos[i * 3 + 1] = y0 + Math.sin(a * 2) * ankare.hojd * 0.12;
      pos[i * 3 + 2] = Math.sin(a) * rad * 0.72;
      const guld = i % 2 === 0;
      col[i * 3] = 1;
      col[i * 3 + 1] = guld ? 0.78 : 1;
      col[i * 3 + 2] = guld ? 0.25 : 1;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [ankare]);
  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    const p = ref.current;
    if (!p) return;
    const mat = p.material as THREE.PointsMaterial;
    const blink = Math.abs(Math.sin(state.clock.elapsedTime * 4.5));
    mat.opacity = 0.25 + blink * 0.75;
    const col = p.geometry.getAttribute("color") as THREE.BufferAttribute;
    const arr = col.array as Float32Array;
    for (let i = 0; i < GLITTER_N; i++) {
      const t = (Math.sin(state.clock.elapsedTime * 5 + i) + 1) / 2;
      arr[i * 3] = 1;
      arr[i * 3 + 1] = 0.78 + t * 0.22;
      arr[i * 3 + 2] = 0.25 + t * 0.75;
    }
    col.needsUpdate = true;
  });
  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <pointsMaterial
        size={11}
        sizeAttenuation={false}
        vertexColors
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
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
