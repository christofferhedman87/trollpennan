import { ordLista } from "../tolk/tolka.ts";
import type { Ord } from "../tolk/typer.ts";

const BILD: Record<string, string> = {
  kanin: "🐰",
  katt: "🐱",
  hund: "🐶",
  hast: "🐴",
  häst: "🐴",
  fagel: "🐦",
  fågel: "🐦",
  fisk: "🐟",
  groda: "🐸",
  gris: "🐷",
  drake: "🐉",
  uggla: "🦉",
  ekorre: "🐿️",
  rav: "🦊",
  räv: "🦊",
  bjorn: "🐻",
  björn: "🐻",
  mus: "🐭",
  ko: "🐮",
  anka: "🦆",
  get: "🐐",
  far: "🐑",
  får: "🐑",
  apa: "🐵",
  lejon: "🦁",
  elefant: "🐘",
  giraff: "🦒",
  pingvin: "🐧",
  orm: "🐍",
  bi: "🐝",
  enhörning: "🦄",
  enhorning: "🦄",
  dinosaurie: "🦕",
  dino: "🦕",
  skoldpadda: "🐢",
  sköldpadda: "🐢",
  haj: "🦈",
  baver: "🦫",
  bäver: "🦫",
};

const SLAG_BILD = { djur: "🐾", skatt: "💎", bygg: "🧱", foto: "📷" } as const;

export type AlbumSlag = keyof typeof SLAG_BILD;

/** 2D-bricka för albumkort. Kända kroppar får djur-emoji, övriga en tydlig färgbricka. */
export function albumBild(id: string, slag: AlbumSlag = "djur"): string {
  return BILD[id] ?? SLAG_BILD[slag];
}

export const PLATS_ANG = "🌿 Ängen";
export const PLATS_AVENTYR = "✨ Äventyret";
export const PLATS_GARD = "🏡 Gården";

const OMR_IKON: Record<string, string> = {
  skogen: "🌲",
  sjon: "🌊",
  grottan: "🪨",
  on: "🏝️",
  ang: "🌿",
  garden: "🏡",
};

export function platsVild(omrade: string, namn: string): string {
  return `${OMR_IKON[omrade] ?? "📍"} ${namn}`;
}

export type OrdKategori = { id: string; ikon: string; namn: string; hittat: number; totalt: number };

const KAT_MALL: { id: string; ikon: string; namn: string; passar: (o: Ord) => boolean }[] = [
  { id: "djur", ikon: "🐾", namn: "Djur", passar: (o) => o.niva !== "fritt" && o.klass === "djur" },
  {
    id: "farg",
    ikon: "🎨",
    namn: "Färger & egenskaper",
    passar: (o) => o.niva !== "fritt" && (o.klass === "farg" || o.klass === "egenskap" || o.klass === "storlek" || o.klass === "monster"),
  },
  {
    id: "saker",
    ikon: "🎁",
    namn: "Saker & gåvor",
    passar: (o) => o.niva !== "fritt" && (o.klass === "foremal" || o.klass === "tillbehor" || o.klass === "formaga"),
  },
  { id: "hemliga", ikon: "✨", namn: "Hemliga ord", passar: (o) => o.niva === "fritt" },
];

export function ordbokKategorier(funna: Record<string, unknown>): OrdKategori[] {
  const alla = ordLista();
  return KAT_MALL.map((k) => {
    const ord = alla.filter(k.passar);
    return { id: k.id, ikon: k.ikon, namn: k.namn, hittat: ord.filter((o) => funna[o.id]).length, totalt: ord.length };
  });
}

/** Olåsta ord från `hittade`. Om listan är tom används nycklarna i `funna`. */
export function olastaOrd(
  hittade: { id: string; visa: string }[],
  funna: Record<string, unknown>,
): { id: string; visa: string }[] {
  if (hittade.length > 0) return hittade.map((o) => ({ id: o.id, visa: o.visa }));
  const alla = ordLista();
  return Object.keys(funna).map((id) => ({ id, visa: alla.find((o) => o.id === id)?.visa ?? id }));
}
