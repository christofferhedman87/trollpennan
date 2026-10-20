// B6.4: vad en GLB-kropp får för färg. Rotorsaken till att jultomten blev orange, brandhjälmen laxrosa, narvalen blek och
// krakens lila lavendel utan färgord: varje ny varelse med ett guldord (första gången ordet skrivs) får glans, och glansen
// lades som ett varmgult självlyse (#FFE082) över HELA kroppen på alla modeller med palett eller farg-material – också när
// barnet inte skrivit något färgord. Dessutom fick ett "ljus"-material en fast gul nyans (#ffd27a) utan färgord.
// Utan färgord rörs modellens material inte alls (egna färger). Det gäller fortfarande (R8-3a).
//
// R8-3a (R9C): med färgord färgas HELA kroppen på alla modeller – textur, materialfärger eller båda – och ögon, hud och
// detaljer behålls. Vilka material som är kropp avgörs generellt av `kroppsRoller()` (yta + färg), eller av entitetens
// "material"-tabell i data när den finns. Ingen kod per djur.
import { hexTillHsl, nyansAvstand, rgbTillHsl, type Hsl } from "./palett.ts";

export type Fargning = {
  /** Ny materialfärg (målfärgen för materialet), eller null = materialets egen. */
  farg: string | null;
  /** Byt texturens kroppsfärg mot färgordets nyans. */
  palettByte: boolean;
  /** Lägg glansens självlyse (i färgordets egen nyans) på materialet. */
  glans: boolean;
};

/** Materialets roll när barnet skrivit ett färgord. Data ("material" i entiteter.json): "farg" = kropp, "ljus" = ljusare kropp, "behall" = detalj. */
export type KroppRoll = "kropp" | "ljus" | "detalj";
const INGEN: Fargning = { farg: null, palettByte: false, glans: false };

/** hex = färgordets hex (null = inget färgord). roll = materialets roll (kroppsRoller eller datan; undefined = detalj).
 *  harKarta = materialet har en textur (då byts texturens kroppsfärg i stället för materialfärgen). */
export function fargning(o: { hex: string | null; roll?: string; harRoller?: boolean; harPalett?: boolean; harKarta: boolean; glans: boolean; ljusare: (hex: string) => string }): Fargning {
  const { hex, harKarta } = o;
  if (!hex) return INGEN;
  const r = o.roll === "farg" || o.roll === "kropp" ? "kropp" : o.roll === "ljus" ? "ljus" : "detalj";
  if (r === "detalj") return INGEN;
  const mal = r === "ljus" ? o.ljusare(hex) : hex;
  return { farg: harKarta ? null : mal, palettByte: harKarta, glans: o.glans && r === "kropp" };
}

export type MatInfo = {
  /** Materialets namn (nyckel i datans "material"-tabell). */
  namn: string;
  /** Materialets kärnfärg i sRGB-HSL: materialfärgen, eller (med textur) vanligaste texelfärgen på nätets UV. */
  hsl: Hsl;
  /** Andel av modellens yta (0–1). */
  yta: number;
};

/** Gränser för den automatiska indelningen (en plats, testade i r8-3a.test.ts). */
export const KROPP = {
  /** Mörkare än så: ögon, pupiller, nos, kontur – behålls (utom när det är hela kroppen). */
  morkL: 0.15,
  /** Mättnad under: neutral (vit, grå, svart). */
  neutralS: 0.25,
  /** Kulörta material med högst så här stort nyansavstånd från kroppen hör till kroppen (hudton mot röd dräkt är 23–33°). */
  nyans: 22,
  /** Neutrala material med högst så här stor skillnad i ljushet från en neutral kropp hör till kroppen. */
  ljushet: 0.2,
  /** Mindre yta än så räknas aldrig som kropp (utom huvudmaterialet). */
  minYta: 0.03,
} as const;

function liknar(a: Hsl, b: Hsl): boolean {
  const an = a[1] < KROPP.neutralS, bn = b[1] < KROPP.neutralS;
  if (an !== bn) return false;
  if (an) return Math.abs(a[2] - b[2]) <= KROPP.ljushet;
  return nyansAvstand(a[0], b[0]) <= KROPP.nyans;
}

/** Roll per material. `roller` = entitetens "material"-tabell i data: ett namn som står där får datans roll
 *  ("farg" kropp, "ljus" ljusare kropp, "behall" detalj). Övriga material automatiskt: huvudmaterialet = största ytan bland de icke-mörka (ögon, nos), och kropp = huvudmaterialet + varje
 *  material med samma färgfamilj (samma nyans ±22°, eller neutral med liknande ljushet). Hud, vita kanter, svarta skor,
 *  guldspännen och ögon blir detalj. Index i samma ordning som `mats`. */
export function kroppsRoller(mats: MatInfo[], roller?: Record<string, string>): { roll: KroppRoll; huvud: number }[] {
  const data = (m: MatInfo): KroppRoll | null => {
    const r = roller?.[m.namn];
    return r === "farg" ? "kropp" : r === "ljus" ? "ljus" : r === "behall" ? "detalj" : null;
  };
  // huvudmaterialet: datans "farg"-material, annars största ytan bland de icke-mörka (annars största ytan)
  let huvud = mats.findIndex((m) => data(m) === "kropp");
  const fri = (m: MatInfo) => data(m) !== "detalj";
  if (huvud < 0) mats.forEach((m, i) => { if (fri(m) && m.hsl[2] >= KROPP.morkL && (huvud < 0 || m.yta > (mats[huvud]?.yta ?? 0))) huvud = i; });
  if (huvud < 0) mats.forEach((m, i) => { if (fri(m) && (huvud < 0 || m.yta > (mats[huvud]?.yta ?? 0))) huvud = i; });
  const H = mats[huvud];
  // R8-3a2: kroppen växer i kedja – ett material som liknar NÅGOT kroppsmaterial (inte bara huvudmaterialet) hör också till
  // kroppen (en mage två nyanssteg bort via en mellanton). Samma gränser som förut per steg, så hud mot röd dräkt (23–33°) stannar.
  const kropp = mats.map((m, i) => data(m) === null && (i === huvud || (!!H && m.yta >= KROPP.minYta && m.hsl[2] >= KROPP.morkL && liknar(m.hsl, H.hsl))));
  for (let andrat = true; andrat; ) {
    andrat = false;
    mats.forEach((m, i) => {
      if (kropp[i] || data(m) !== null || m.yta < KROPP.minYta || m.hsl[2] < KROPP.morkL) return;
      if (mats.some((k, j) => (kropp[j] || data(k) === "kropp") && liknar(m.hsl, k.hsl))) kropp[i] = andrat = true;
    });
  }
  return mats.map((m, i) => ({ roll: data(m) ?? (kropp[i] ? "kropp" : "detalj"), huvud }));
}

/** R8-3a2: gränser för kroppsmasken i en textur och för hörnfärger (en plats, testade i r8-3a2.test.ts). */
export const MASK = {
  /** Största steget mellan två grannar (|ΔR|+|ΔG|+|ΔB|, 0–765) inom kroppen: en mjuk gradient (ankans gulgröna rygg som
   *  blir grön mage i samma färgruta) växer med, en skarp kant (öga, bete, näbb, ruta bredvid i atlasen) stoppar. */
  steg: 30,
  /** Kulör kropp: högsta nyansavstånd från kärnan för det som växer med (ankans 61° → 115° är 54°; näbben 20° från 61° … men
   *  den ligger i en egen ruta och nås aldrig). */
  nyans: 70,
  /** Kulör kropp: lägsta mättnad för det som växer med. */
  mattnad: 0.15,
  /** Neutral kropp: högsta skillnad i ljushet från kroppen (elefantens grå 0,42–0,52 mot betarnas gräddvita 0,87). */
  ljushet: 0.3,
  /** En sammanhängande yta är kropp om minst så stor del av modellens användning av den är kärna (ankans kroppsruta ~0,7,
   *  vingens ruta ~0). */
  karnandel: 0.4,
} as const;

export type Karna = { hsl: Hsl; neutral: boolean };

/** Kärnan själv: texlar som säkert är kropp (samma test som palettbytet: ±22° kulört, eller neutral nära kroppens ljushet). */
export function iKarnan(p: Hsl, k: Karna): boolean {
  if (k.neutral) return p[1] < 0.35 && Math.abs(p[2] - k.hsl[2]) < 0.12;
  return nyansAvstand(p[0], k.hsl[0]) <= KROPP.nyans && p[1] > 0.25 && p[2] >= KROPP.morkL;
}

/** Får texeln/hörnet höra till kroppen om den nås från kärnan? (Samma familj, vidare gränser.) */
export function iFamiljen(p: Hsl, k: Karna): boolean {
  if (k.neutral) return p[1] < 0.35 && p[2] >= KROPP.morkL && Math.abs(p[2] - k.hsl[2]) <= MASK.ljushet;
  return p[1] >= MASK.mattnad && p[2] >= 0.06 && nyansAvstand(p[0], k.hsl[0]) <= MASK.nyans;
}

/** Var modellen faktiskt använder texturen: texelindex och vikt (triangelns yta), ur samma stickprov som kärnfärgen. */
export type Anvandning = { i: ArrayLike<number>; n: ArrayLike<number> };

/** R8-3a2: kroppens texlar i en textur (RGBA, w × h). Från varje texel i kärnan växer en sammanhängande yta i små steg
 *  (gradient) inom familjen. Ytan hör till kroppen om minst `MASK.karnandel` av det modellen ANVÄNDER av den (ytviktat
 *  stickprov `anv`; utan `anv` ytans alla texlar) är kärna. En vinge eller fot vars gradient bara snuddar vid kroppens nyans
 *  (ankans orange 20–45° mot kroppens 61°: nästan ingen användning i kärnan) behålls; ankans gröna mage i kroppens ruta följer
 *  med (ryggen, som är kärna, är det mesta av användningen).
 *  1 = kropp (byts/får mönster), 0 = behålls (ögon, betar, näbb, tänder, rosa öron, andra rutor i atlasen). */
export function kroppsMask(d: ArrayLike<number>, w: number, h: number, k: Karna, anv?: Anvandning): Uint8Array {
  const n = w * h;
  const mask = new Uint8Array(n);
  const komp = new Int32Array(n).fill(-1);
  const ko = new Int32Array(n);
  const px = (i: number) => rgbTillHsl(d[i * 4] ?? 0, d[i * 4 + 1] ?? 0, d[i * 4 + 2] ?? 0);
  const ytor: { start: number; slut: number }[] = [];
  let skriv = 0;
  for (let s0 = 0; s0 < n; s0++) {
    if (komp[s0]! >= 0 || (d[s0 * 4 + 3] ?? 0) < 8 || !iKarnan(px(s0), k)) continue;
    const id = ytor.length;
    const start = skriv;
    let las = skriv;
    komp[s0] = id;
    ko[skriv++] = s0;
    const prova = (fran: number, till: number) => {
      if (komp[till]! >= 0 || (d[till * 4 + 3] ?? 0) < 8) return;
      const a = fran * 4, c = till * 4;
      const dd = Math.abs((d[a] ?? 0) - (d[c] ?? 0)) + Math.abs((d[a + 1] ?? 0) - (d[c + 1] ?? 0)) + Math.abs((d[a + 2] ?? 0) - (d[c + 2] ?? 0));
      if (dd > MASK.steg || !iFamiljen(px(till), k)) return;
      komp[till] = id;
      ko[skriv++] = till;
    };
    while (las < skriv) {
      const i = ko[las++]!;
      const x = i % w;
      if (x > 0) prova(i, i - 1);
      if (x < w - 1) prova(i, i + 1);
      if (i >= w) prova(i, i - w);
      if (i + w < n) prova(i, i + w);
    }
    ytor.push({ start, slut: skriv });
  }
  // hur stor del av det modellen använder av ytan (ytviktat stickprov; utan stickprov alla ytans texlar) som är kärna
  const del = ytor.map(() => ({ alla: 0, karna: 0 }));
  const rakna = (t: number, v: number) => {
    const id = komp[t]!;
    if (id < 0) return;
    const u = del[id]!;
    u.alla += v;
    if (iKarnan(px(t), k)) u.karna += v;
  };
  if (anv) for (let j = 0; j < anv.i.length; j++) { const t = anv.i[j] ?? -1; if (t >= 0 && t < n) rakna(t, anv.n[j] ?? 0); }
  else for (let j = 0; j < skriv; j++) rakna(ko[j]!, 1);
  ytor.forEach((y, id) => {
    const u = del[id]!;
    if (u.alla > 0 && u.karna / u.alla >= MASK.karnandel) for (let j = y.start; j < y.slut; j++) mask[ko[j]!] = 1;
  });
  return mask;
}

/** R8-3a2: hörnfärger (sRGB 0–255, tre per hörn, materialfärgen redan inräknad) → kärnan och vilka hörn som är kropp.
 *  Kärnan väljs som i en textur (valjKarna, en klump per hörn). Hörn i familjen är kropp; mörka (ögon, kanter) och andra kulörer
 *  behålls (hörn har inga grannar att växa genom, så den mörka änden av en gradient räknas inte här). */
export function hornKropp(rgb: ArrayLike<number>): { karna: Karna; kropp: Uint8Array } | null {
  const n = Math.floor(rgb.length / 3);
  const klumpar: Klump[] = [];
  for (let i = 0; i < n; i++) klumpar.push({ n: 1, r: rgb[i * 3] ?? 0, g: rgb[i * 3 + 1] ?? 0, b: rgb[i * 3 + 2] ?? 0 });
  const karna = valjKarna(klumpar);
  if (!karna) return null;
  const kropp = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const p = rgbTillHsl(rgb[i * 3] ?? 0, rgb[i * 3 + 1] ?? 0, rgb[i * 3 + 2] ?? 0);
    if (p[2] >= KROPP.morkL && (iKarnan(p, karna) || iFamiljen(p, karna))) kropp[i] = 1;
  }
  return { karna, kropp };
}

/** sRGB-byte (0–255) ↔ linjärt (0–1), samma gamma 2,2 som palett.ts. */
export const tillLinjar = (b: number) => Math.pow(Math.max(0, b) / 255, 2.2);
export const tillSrgb = (v: number) => Math.round(255 * Math.min(1, Math.max(0, Math.pow(Math.max(0, v), 1 / 2.2))));

/** En färgklump i en textur: vikt (yta) och medelfärg i sRGB 0–255. */
export type Klump = { n: number; r: number; g: number; b: number };

/** R8-3a: kroppens färg i en textur, ur ytviktade texelklumpar (texeln mitt i varje triangel, viktad med triangelns yta –
 *  tidigare räknades hörn, och då vann tätt modellerade öron och ögon över den stora kroppen). Klumparna slås ihop till
 *  färgfamiljer (kulört: nyans i steg om 20°; neutralt: ljushet i steg om 0,2), mörka (ögon) räknas inte. Största familjen
 *  vinner, men är den neutral och en kulör familj täcker minst 30 % (jultomtens röda dräkt bredvid vitt skägg och hud) blir
 *  den kulöra kroppen. Ger null utan klumpar. */
export function valjKarna(klumpar: Klump[]): { hsl: Hsl; neutral: boolean } | null {
  const fam = new Map<string, Klump>();
  let total = 0;
  for (const k of klumpar) {
    if (k.n <= 0) continue;
    const [h, sat, l] = rgbTillHsl(k.r / k.n, k.g / k.n, k.b / k.n);
    total += k.n;
    if (l < KROPP.morkL) continue;
    const nyckel = sat < 0.35 ? `n${Math.round(l * 5)}` : `c${Math.round(h / 20) % 18}`;
    const f = fam.get(nyckel) ?? { n: 0, r: 0, g: 0, b: 0 };
    f.n += k.n; f.r += k.r; f.g += k.g; f.b += k.b;
    fam.set(nyckel, f);
  }
  // R8-3a2: en kulör familj räknas ihop med grannfacken vars medelnyans ligger inom KROPP.nyans (bilens röda 9° och 12° hamnar
  // i olika 20°-fack; var för sig under 30 %, så de grå rutorna blev kärna och bara taket färgades).
  const kulorFam = [...fam].filter(([k]) => k.startsWith("c"));
  const nyansAv = (f: Klump) => rgbTillHsl(f.r / f.n, f.g / f.n, f.b / f.n)[0];
  const sammanslagen = (f: Klump): Klump => {
    const h = nyansAv(f), s: Klump = { n: 0, r: 0, g: 0, b: 0 };
    for (const [, g] of kulorFam) if (nyansAvstand(nyansAv(g), h) <= KROPP.nyans) { s.n += g.n; s.r += g.r; s.g += g.g; s.b += g.b; }
    return s;
  };
  let bast: [string, Klump] | null = null, kulor: [string, Klump] | null = null;
  for (const [nyckel, f] of fam) {
    const e: [string, Klump] = [nyckel, nyckel.startsWith("c") ? sammanslagen(f) : f];
    if (!bast || e[1].n > bast[1].n) bast = e;
    if (nyckel.startsWith("c") && (!kulor || e[1].n > kulor[1].n)) kulor = e;
  }
  if (!bast) return null;
  const val = bast[0].startsWith("n") && kulor && kulor[1].n >= 0.3 * total ? kulor : bast;
  const k = val[1];
  return { hsl: rgbTillHsl(k.r / k.n, k.g / k.n, k.b / k.n), neutral: val[0].startsWith("n") };
}

/** Kärnfärgen för ett material utan textur (sRGB-hex). */
export const hslAv = (hex: string): Hsl => hexTillHsl(hex);

export type FargRad = { kropp: string; mat: string; fore: string; efter: string; sjalvlyse: string; egenKarta: boolean; roll?: KroppRoll; mask?: number; horn?: boolean; monster?: string };
declare global {
  interface Window {
    /** B6.4/R8-3a, för prov: en rad per material när en GLB-kropp klonas (färg före/efter, självlyse, egen textur kvar, roll). */
    __tredFarg?: FargRad[];
  }
}
