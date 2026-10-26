import { Html, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { createElement, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Group } from "three";
import { sparaAlbumNiva, sparaStjarnor } from "../persist/spara.ts";
import { ljud } from "./ljud.ts";
import { useMinne } from "./minne.ts";
import { forladdaNarLedig } from "./modeller/forladda.ts";
import { arLargoDjur } from "./tillbehor/largo.ts";

export const SOLSTJARNA_PLORT_URL = "/models/bulk/s-solstjarna-plort-cc0.glb";
export const PLORT_KRISTALL_URL = "/models/bulk/s-plort-kristall-cc0.glb";

export const FAVORIT_MAT_TABELL: Record<string, { saker: string[]; etikett: string }> = {
  kanin: { saker: ["morot", "jordgubbe", "äpple"], etikett: "🥕 Krispigt & sött" },
  björn: { saker: ["honung", "jordgubbe", "blåbär"], etikett: "🍯 Sött & bärigt" },
  katt: { saker: ["fisk", "kudde", "mjölk"], etikett: "🐟 Mjukt & gott" },
  hund: { saker: ["boll", "studsboll", "kudde"], etikett: "⚽ Studsigt & kul" },
  drake: { saker: ["äpple", "kaka", "kristall", "krona"], etikett: "🍎 Glittrigt & varmt" },
  sköldpadda: { saker: ["jordgubbe", "studsboll", "snäcka"], etikett: "🍓 Soligt & studsigt" },
  gris: { saker: ["äpple", "morot", "kaka"], etikett: "🍎 Rött & gott" },
  uggla: { saker: ["blåbär", "lykta", "bok"], etikett: "🫐 Nattligt & gott" },
};

export function favoritMatEtikett(djurTyp: string): string {
  return FAVORIT_MAT_TABELL[djurTyp]?.etikett ?? "🍓 Färgglad gåva";
}

export function beraknaSolstjarnaBeloning(
  djurTyp: string,
  sakTyp: string,
  harAdjektivEllerVerb = false,
  arLargo = false,
): { stjarnor: 1 | 2; arFavorit: boolean; etikett: string } {
  const saker = FAVORIT_MAT_TABELL[djurTyp]?.saker ?? [];
  const s = sakTyp.toLowerCase();
  const traff = saker.some((x) => s === x || s.includes(x));
  if (arLargo || (traff && (harAdjektivEllerVerb || sakTyp.trim().includes(" ")))) {
    return { stjarnor: 2, arFavorit: true, etikett: "+2 ★ Favorit!" };
  }
  return { stjarnor: 1, arFavorit: false, etikett: "+1 ★" };
}

export const GARDS_UPPGRADERINGAR = [
  { namn: "Soltak till hagen", id: "hage-soltak", kostnad: 4, farg: "#F2B632" },
  { namn: "Musikfontän", id: "musikfontan", kostnad: 6, farg: "#7E57C2" },
  { namn: "Kristall-lykta", id: "kristall-lykta", kostnad: 8, farg: "#80DEEA" },
  { namn: "Studsbolls-korg", id: "studsbolls-korg", kostnad: 10, farg: "#EF5350" },
] as const;

type Plopp = { id: number; stjarnor: 1 | 2; arFavorit: boolean; etikett: string };
let ko: Plopp[] = [];
const lyssnare = new Set<() => void>();
let ploppId = 1;

function publicera(p: Omit<Plopp, "id">) {
  ko = [...ko, { ...p, id: ploppId++ }].slice(-4);
  lyssnare.forEach((f) => f());
}

export function belonaSolstjarna(djurTyp: string, sakTyp: string, harAdjektivEllerVerb: boolean, arLargo: boolean) {
  const bel = beraknaSolstjarnaBeloning(djurTyp, sakTyp, harAdjektivEllerVerb, arLargo);
  sparaStjarnor(bel.stjarnor);
  sparaAlbumNiva(djurTyp, arLargo ? 3 : bel.arFavorit ? 2 : 1);
  publicera(bel);
  ljud.plopp(bel.arFavorit ? 4 : 0);
  return bel;
}

type DjurBit = {
  kropp: string;
  formel?: string;
  beskrivning?: string;
  tillbehor?: { id?: string }[];
  extraKropp?: string;
  blandning?: unknown;
  overraskningar?: { text: string; effekt: string }[];
};

export function noteraSolSkapelse(v: DjurBit): void {
  const ids = (v.tillbehor ?? []).map((t) => t.id).filter((id): id is string => Boolean(id) && id !== v.kropp);
  const sak = ids.join(" ") || v.formel || v.kropp;
  const har = sak.trim().includes(" ") || Boolean(v.formel?.trim().includes(" "));
  belonaSolstjarna(v.kropp, sak, har, arLargoDjur(v as never));
  if (ids.length) sparaAlbumNiva(v.kropp, 3);
}

export function noteraSolGava(nyckel: string, sakTyp: string): void {
  const s = useMinne.getState();
  const d = s.ang.find((a) => a.uid === nyckel) ?? s.hemma.find((h) => h.spec.uid === nyckel)?.spec;
  const djurTyp = d?.kropp ?? nyckel;
  belonaSolstjarna(djurTyp, sakTyp, sakTyp.trim().includes(" "), d ? arLargoDjur(d) : false);
  if (d?.tillbehor.some((t) => t.id !== d.kropp)) sparaAlbumNiva(djurTyp, 3);
}

function nod(type: string, props: Record<string, unknown> | null, ...barn: ReactNode[]) {
  return createElement(type as "div", props as never, ...barn);
}

function PloppMesh({ url, synlig }: { url: string; synlig: boolean }) {
  const gltf = useGLTF(url);
  const objekt = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  return nod("primitive", { object: objekt, visible: synlig, scale: 0.38 });
}

function Bage({ etikett, guld, children }: { etikett: string; guld: boolean; children?: ReactNode }) {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const pause = typeof window !== "undefined" && window.__PAUSE_ANIM === true;
    if (!pause) g.userData.t = Math.min(1, ((g.userData.t as number | undefined) ?? 0) + Math.min(dt, 0.05) / 1.05);
    const t = (g.userData.t as number | undefined) ?? 0;
    g.position.set((t - 0.5) * 1.35, 0.25 + 4.2 * t * (1 - t), 0.1);
    if (!pause) g.rotation.y = t * Math.PI * 2;
  });
  return nod("group", { ref }, children, createElement(Html, { center: true, distanceFactor: 7, position: [0, 0.55, 0] },
    createElement("span", { "data-s5": "solstjarna-piller", className: guld ? "sol-piller guld" : "sol-piller" }, etikett)));
}

export function SolstjarnaPlopp() {
  const [lista, setLista] = useState<Plopp[]>([]);
  const rot = useRef<Group>(null);
  useEffect(() => {
    const fn = () => setLista([...ko]);
    lyssnare.add(fn);
    fn();
    return () => { lyssnare.delete(fn); };
  }, []);
  useFrame((state) => {
    const r = state.gl.domElement.getBoundingClientRect();
    if (rot.current) rot.current.visible = r.width > 40 && r.height > 40;
  });
  return nod("group", { ref: rot, position: [0, 0.15, 0] }, createElement(Suspense, { fallback: null },
    lista.map((p) => createElement(Bage, { key: p.id, etikett: p.etikett, guld: p.arFavorit || p.stjarnor === 2 },
      createElement(PloppMesh, { url: SOLSTJARNA_PLORT_URL, synlig: true }),
      createElement(PloppMesh, { url: PLORT_KRISTALL_URL, synlig: p.arFavorit || p.stjarnor === 2 })))));
}

forladdaNarLedig([SOLSTJARNA_PLORT_URL, PLORT_KRISTALL_URL], (u) => useGLTF.preload(u));
