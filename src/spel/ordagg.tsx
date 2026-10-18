import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import reservJson from "../../data/reserv.json" with { type: "json" };
import { fnv1a32 } from "../tolk/reserv.ts";
import type { ReservDel } from "../tolk/typer.ts";
import type { Sparad } from "./brygga.ts";

/**
 * Ordägget: reservformen för ett ord som spelet inte känner (R3B). Ett ägg som väntar på att kläckas.
 * Färgen kommer ur ordet (data/reserv.json agg.palett), mönstret ur kategorin (kategorier[kategori].form.monster).
 * Ett nytt ord eller en ny kategori kräver ingen kod här. Etiketten är ordets egen text.
 */

export const AGG_KROPP = "agg";

type Monster = "slat" | "prickar" | "flackar" | "band" | "rander" | "stjarnor";
type Form = { monster: Monster; antal: number; hojd?: number };
const KATEGORIER = (reservJson as unknown as { kategorier: Record<string, { form: Form }> }).kategorier;
const ETIKETT_MAX = (reservJson as unknown as { agg: { etikett_max: number } }).agg.etikett_max;

const TOON = (() => {
  const t = new THREE.DataTexture(new Uint8Array([90, 170, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();

const matCache = new Map<string, THREE.MeshToonMaterial>();
function toon(farg: string, ljus = 0.12): THREE.MeshToonMaterial {
  const nyckel = `${farg}|${ljus}`;
  let m = matCache.get(nyckel);
  if (!m) {
    m = new THREE.MeshToonMaterial({ color: farg, gradientMap: TOON, emissive: farg, emissiveIntensity: ljus });
    matCache.set(nyckel, m);
  }
  return m;
}
const KONTUR = new THREE.MeshBasicMaterial({ color: "#3B2F2F", side: THREE.BackSide });
const SPRICKA = new THREE.MeshBasicMaterial({ color: "#3B2F2F" });

const geoCache = new Map<string, THREE.BufferGeometry>();
function geo(nyckel: string, gor: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let g = geoCache.get(nyckel);
  if (!g) {
    g = gor();
    geoCache.set(nyckel, g);
  }
  return g;
}

/** Äggets profil: höjd 1 (y 0 till 1), bredast på nedre halvan, smalare överst. */
const BRED = 0.36;
function radieVid(v: number): number {
  const t = Math.acos(1 - 2 * v);
  return BRED * Math.sin(t) * (1 + 0.16 * Math.cos(t));
}
function aggGeo(): THREE.BufferGeometry {
  return geo("agg", () => {
    const punkter: THREE.Vector2[] = [];
    for (let i = 0; i <= 24; i++) {
      const v = i / 24;
      punkter.push(new THREE.Vector2(Math.max(0.001, radieVid(v)), v));
    }
    return new THREE.LatheGeometry(punkter, 30);
  });
}

/** Punkt på äggets yta: v = höjd 0..1, a = vinkel (z framåt vid a = π/2). */
function ytpunkt(v: number, a: number, ut = 1): [number, number, number] {
  const r = radieVid(v) * ut;
  return [Math.cos(a) * r, v, Math.sin(a) * r];
}

function nyans(hex: string, dl: number): string {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, THREE.MathUtils.clamp(hsl.l + dl, 0.12, 0.95));
  return "#" + c.getHexString();
}

const etiketter = new Map<string, THREE.CanvasTexture>();
function etikettTextur(text: string, farg: string): THREE.CanvasTexture {
  const nyckel = `${text}|${farg}`;
  const har = etiketter.get(nyckel);
  if (har) return har;
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  const px = 56;
  const font = `700 ${px}px Fredoka, Nunito, "Segoe UI", sans-serif`;
  let bredd = 256;
  if (ctx) {
    ctx.font = font;
    bredd = Math.max(160, Math.ceil(ctx.measureText(text).width) + 56);
  }
  c.width = bredd;
  c.height = 96;
  const g = c.getContext("2d");
  if (g) {
    g.font = font;
    g.fillStyle = "#FFFDF5";
    g.strokeStyle = farg;
    g.lineWidth = 8;
    const r = 40;
    g.beginPath();
    g.roundRect(6, 6, bredd - 12, 84, r);
    g.fill();
    g.stroke();
    g.fillStyle = "#3B2F2F";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, bredd / 2, 52);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  etiketter.set(nyckel, tex);
  return tex;
}

function Etikett({ text, farg, y, hojd }: { text: string; farg: string; y: number; hojd: number }) {
  const tex = useMemo(() => etikettTextur(text.slice(0, ETIKETT_MAX), farg), [text, farg]);
  const b = (tex.image as HTMLCanvasElement).width / 96;
  return (
    <sprite position={[0, y, 0]} scale={[hojd * b, hojd, 1]} renderOrder={20}>
      <spriteMaterial map={tex} transparent depthTest={false} depthWrite={false} />
    </sprite>
  );
}

function formAv(kategori: string): Form {
  return (KATEGORIER[kategori] ?? KATEGORIER["okant"]!).form;
}

/** Äggets höjd i äggets egna enheter. */
function aggHojd(form: Form): number {
  return 0.95 * (form.hojd ?? 1);
}

/** Små pseudoslumptal ur ordet: samma ord ger alltid samma ägg. */
function slump(ord: string): () => number {
  let h = fnv1a32(ord) || 1;
  return () => {
    h ^= h << 13;
    h >>>= 0;
    h ^= h >>> 17;
    h ^= h << 5;
    h >>>= 0;
    return h / 4294967296;
  };
}

function Monstret({ form, ord, farg }: { form: Form; ord: string; farg: string }) {
  const lj = nyans(farg, 0.22);
  const mo = nyans(farg, -0.2);
  const n = Math.max(1, form.antal);
  const delar = useMemo(() => {
    const ut: { v: number; a: number; s: number; r: number }[] = [];
    const sl = slump(ord);
    for (let i = 0; i < n; i++) ut.push({ v: 0.2 + sl() * 0.55, a: Math.PI * (0.18 + 0.64 * sl()), s: 0.6 + sl() * 0.8, r: sl() });
    return ut;
  }, [ord, n]);
  const m = form.monster;
  if (m === "prickar" || m === "flackar") {
    const stor = m === "flackar" ? 0.085 : 0.05;
    return (
      <group>
        {delar.map((d, i) => {
          const p = ytpunkt(d.v, d.a, 1.0);
          return (
            <mesh key={i} position={p} rotation={[0, -d.a + Math.PI / 2, 0]} scale={[d.s * stor, d.s * stor, d.s * stor * 0.45]} geometry={geo("prick", () => new THREE.SphereGeometry(1, 10, 8))} material={toon(i % 2 ? lj : mo, 0.1)} />
          );
        })}
      </group>
    );
  }
  if (m === "stjarnor") {
    return (
      <group>
        {delar.map((d, i) => {
          const p = ytpunkt(d.v, d.a, 1.0);
          return (
            <mesh key={i} position={p} rotation={[d.r * 3, d.r * 3, d.r * 3]} scale={d.s * 0.06} geometry={geo("stjarna", () => new THREE.OctahedronGeometry(1, 0))} material={toon(lj, 0.25)} />
          );
        })}
      </group>
    );
  }
  if (m === "band" || m === "rander") {
    const ringar = m === "band" ? Math.min(3, n) : Math.min(5, n);
    return (
      <group>
        {Array.from({ length: ringar }, (_, i) => {
          const v = m === "band" ? 0.42 + i * 0.12 : 0.22 + i * (0.5 / Math.max(1, ringar - 1));
          const rad = radieVid(v);
          return (
            <mesh key={i} position={[0, v, 0]} rotation={[Math.PI / 2, 0, 0]} geometry={geo(`ring${Math.round(v * 100)}`, () => new THREE.TorusGeometry(rad, m === "band" ? 0.035 : 0.022, 6, 30))} material={toon(i % 2 ? mo : lj, 0.12)} />
          );
        })}
      </group>
    );
  }
  return null;
}

/** En liten spricka överst: ägget kläcks snart. */
function Spricka() {
  const punkter: [number, number][] = [
    [0.8, 0.9],
    [0.68, 0.82],
    [0.58, 0.9],
    [0.47, 0.8],
    [0.36, 0.86],
  ];
  return (
    <group>
      {punkter.slice(0, -1).map((p, i) => {
        const q = punkter[i + 1]!;
        const a = Math.PI / 2;
        const [x1, y1, z1] = ytpunkt(p[1], a + (p[0] - 0.58) * 1.7, 1.015);
        const [x2, y2, z2] = ytpunkt(q[1], a + (q[0] - 0.58) * 1.7, 1.015);
        const len = Math.hypot(x2 - x1, y2 - y1);
        const ang = Math.atan2(y2 - y1, x2 - x1);
        return (
          <mesh key={i} position={[(x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2]} rotation={[0, 0, ang]} scale={[len * 1.15, 0.03, 0.03]} geometry={geo("spricka", () => new THREE.BoxGeometry(1, 1, 1))} material={SPRICKA} />
        );
      })}
    </group>
  );
}

function Agg({ del, vagg }: { del: ReservDel; vagg: number }) {
  const form = formAv(del.kategori);
  const hojd = aggHojd(form);
  const kropp = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime + vagg * 0.9;
    const g = kropp.current;
    if (!g) return;
    const fas = t % 3.4;
    const gunga = fas < 1.1 ? Math.sin((fas / 1.1) * Math.PI * 4) * 0.17 * (1 - fas / 1.1 * 0.4) : 0;
    g.rotation.z = gunga;
    g.rotation.x = fas < 1.1 ? Math.sin((fas / 1.1) * Math.PI * 4 + 1) * 0.04 : 0;
    g.position.y = fas < 1.1 ? Math.abs(Math.sin((fas / 1.1) * Math.PI * 2)) * 0.03 : 0;
  });
  const g = aggGeo();
  return (
    <group ref={kropp}>
      <group scale={[1, hojd, 1]}>
        <mesh geometry={g} material={toon(del.farg)} />
        <mesh geometry={g} material={KONTUR} scale={1.07} />
        <Monstret form={form} ord={del.ord} farg={del.farg} />
        <Spricka />
      </group>
    </group>
  );
}

const KROPPSSKALA = 1.6;
const SVAV_SKALA = 0.6;

/** Själva kroppen för ett djur med kropp "agg": första posten i spec.reserv. */
export function OrdAgg({ spec }: { spec: Sparad }) {
  const del = spec.reserv?.[0];
  if (!del) return null;
  const hojd = aggHojd(formAv(del.kategori));
  return (
    <group>
      <group scale={KROPPSSKALA}>
        <Agg del={del} vagg={0} />
      </group>
      <Etikett text={del.ord} farg={del.farg} y={hojd * KROPPSSKALA + 0.28} hojd={0.46} />
    </group>
  );
}

/** Ord som svävar som små ägg ovanför djuret (alla poster utom kroppens). */
export function ReservAgg({ spec }: { spec: Sparad }) {
  const lista = (spec.reserv ?? []).slice(spec.kropp === AGG_KROPP ? 1 : 0);
  if (!lista.length) return null;
  const bas = spec.kropp === AGG_KROPP ? 2.2 : 1.55;
  return (
    <group>
      {lista.map((del, i) => {
        const hojd = aggHojd(formAv(del.kategori));
        return (
          <group key={del.ord} position={[(i - (lista.length - 1) / 2) * 1.05, bas, 0]}>
            <group scale={SVAV_SKALA}>
              <Agg del={del} vagg={i + 1} />
            </group>
            <Etikett text={del.ord} farg={del.farg} y={hojd * SVAV_SKALA + 0.24} hojd={0.4} />
          </group>
        );
      })}
    </group>
  );
}
