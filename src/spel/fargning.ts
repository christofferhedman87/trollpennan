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
  return mats.map((m, i) => ({
    roll: data(m) ?? (i === huvud || (!!H && m.yta >= KROPP.minYta && m.hsl[2] >= KROPP.morkL && liknar(m.hsl, H.hsl)) ? "kropp" : "detalj"),
    huvud,
  }));
}

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
  let bast: [string, Klump] | null = null, kulor: [string, Klump] | null = null;
  for (const e of fam) {
    if (!bast || e[1].n > bast[1].n) bast = e;
    if (e[0].startsWith("c") && (!kulor || e[1].n > kulor[1].n)) kulor = e;
  }
  if (!bast) return null;
  const val = bast[0].startsWith("n") && kulor && kulor[1].n >= 0.3 * total ? kulor : bast;
  const k = val[1];
  return { hsl: rgbTillHsl(k.r / k.n, k.g / k.n, k.b / k.n), neutral: val[0].startsWith("n") };
}

/** Kärnfärgen för ett material utan textur (sRGB-hex). */
export const hslAv = (hex: string): Hsl => hexTillHsl(hex);

export type FargRad = { kropp: string; mat: string; fore: string; efter: string; sjalvlyse: string; egenKarta: boolean; roll?: KroppRoll };
declare global {
  interface Window {
    /** B6.4/R8-3a, för prov: en rad per material när en GLB-kropp klonas (färg före/efter, självlyse, egen textur kvar, roll). */
    __tredFarg?: FargRad[];
  }
}
