// Entiteter: rena funktioner över data/entiteter.json och data/tillgangar.json. Ingen three-import (testas i Node).
// Ett nytt djur = en rad i entiteter.json + en rad i tillgangar.json + (efter granskning) en ordrad. Ingen kod per djur.
import entiteterJson from "../../data/entiteter.json" with { type: "json" };
import tillgangarJson from "../../data/tillgangar.json" with { type: "json" };
import storlekJson from "../../data/storlek.json" with { type: "json" };
import fotJson from "../../data/fotavtryck.json" with { type: "json" };
import { skarmRuta } from "./skarm.ts";
import modellmattSynJson from "../../data/modellmatt.json" with { type: "json" };

export type Typ = "djur" | "tillbehor" | "byggnad" | "foremal" | "natur";
export type Rorelse = "land" | "flyg" | "sim" | "svavar";
export type FramAxel = "+z" | "-z" | "+x" | "-x";
export type Palett = { from: number; range: number; bodyL: number };
export type Entitet = {
  typ: Typ;
  kategori: string;
  /** Nyckel i tillgangar.json, eller null om djuret bara finns som kodritad form. */
  modell: string | null;
  /** Rundad CC0-modell (s-djur-*). Saknas fältet ritas modell som förut. */
  rundModell?: string | null;
  /** Önskad höjd i ängens enheter (krävs när modell finns). */
  malhojd?: number;
  palett?: Palett;
  /** Grundfärg när barnet inte skrivit någon (kodritad form och kort). */
  art: string;
  rorelse?: Rorelse;
  /** P3 (Doodle r83a: blå ankan svävade vid trädkanten): flyger, men på en plats med vatten (inte ängen) simmar den i vattenytan. */
  vattenfagel?: boolean;
  vikt?: number;
  /** Hopphöjd (sekunder av hopp-animationen); saknas = hoppar inte. */
  hopp?: number;
  natt?: "vaken";
  /** Färg som gäller när barnet inte valt någon. */
  standardfarg?: string;
  /** Materialnamn i GLB → roll: "farg" tar djurets färg, "ljus" en ljusare nyans. Saknas = paletten byter färg. */
  material?: Record<string, "farg" | "ljus" | "behall">;
  /** Valfri åsidosättning. Saknas = modellens framsida är +z och djuret står vänt mot kameran. */
  framAxel?: FramAxel;
  /** false = modellen hämtas först när ordet används (R3C). Saknas = hämtas direkt vid start, som de första djuren. */
  forladda?: boolean;
  /** Orden som skapar djuret (R3C-rader; ord.json är sanningen om vilka ord som fungerar). */
  ord?: string[];
  /** Vilken runda/rutin som lade in raden (R3C). */
  inlagd?: string;
};
export type Tillgang = { fil?: string; mapp?: string; licens: string; upphov: string; kalla: string; anvands?: boolean };

export const ENTITETER = entiteterJson.entiteter as unknown as Record<string, Entitet>;
export const TILLGANGAR = tillgangarJson.tillgangar as unknown as Record<string, Tillgang>;
export const LICENSER = tillgangarJson.licenser as unknown as Record<string, { namn: string; namnangivelse: boolean }>;

export const STANDARD_ART = "#CE93D8";
const TYPER: Typ[] = ["djur", "tillbehor", "byggnad", "foremal", "natur"];
const RORELSER: Rorelse[] = ["land", "flyg", "sim", "svavar"];
const AXLAR: FramAxel[] = ["+z", "-z", "+x", "-x"];

export function entitet(kropp: string): Entitet | undefined {
  return ENTITETER[kropp];
}

/** Alla djur i den ordning de visas i albumet (ordningen i entiteter.json). */
export function djurIds(): string[] {
  return Object.keys(ENTITETER).filter((k) => ENTITETER[k]?.typ === "djur");
}

/** Modeller som ska hämtas direkt vid start. Resten (forladda: false) hämtas när ordet används. */
export function forladdaUrls(): string[] {
  const urls = new Set<string>();
  for (const [id, e] of Object.entries(ENTITETER)) {
    if (e.typ !== "djur" || e.forladda === false) continue;
    const u = modellUrl(id);
    if (u) urls.add(u);
  }
  return [...urls];
}

/** Har ordet en 3D-modell? (B6.1: flyttad hit från gltfDjur.tsx så att komponentfilen bara exporterar komponenter.) */
export function harModell(kropp: string): boolean {
  return Boolean(modellUrl(kropp));
}

export function modellUrl(kropp: string): string | null {
  const m = ENTITETER[kropp]?.modell;
  return (m && TILLGANGAR[m]?.fil) || null;
}

/** Rundad djurmodell om den finns, annars samma fil som modellUrl. Ändrar inte modellUrl. */
export function djurGltfUrl(kropp: string): string | null {
  const rm = ENTITETER[kropp]?.rundModell;
  if (rm && TILLGANGAR[rm]?.fil) return TILLGANGAR[rm]!.fil;
  return modellUrl(kropp);
}

export function harDjurGltf(kropp: string): boolean {
  return djurGltfUrl(kropp) !== null;
}

export type StorlekKlass = { id: string; tak: number; zon: "bak"; kant?: number; rad?: "bortom"; max_halv?: number };
const STORLEK = storlekJson as unknown as { klasser: Record<string, { tak: number; zon: "bak"; kant?: number; rad?: "bortom"; max_halv?: number }>; kategori: Record<string, string>; ids?: Record<string, string>; minsta?: { storlek: number; yta: number; max_forstoring: number; lutning?: number; ovanifran?: number }; smasak?: { malhojd: [number, number]; ids?: string[] }; syn?: { min_px: number; max_forstoring: number } };

/** B6.1 (E): storleksklassen för en sak ur data/storlek.json (via kategorin). Djur har aldrig någon klass. */
export function storlekKlass(kropp: string): StorlekKlass | null {
  const e = ENTITETER[kropp];
  if (!e || e.typ === "djur") return null;
  // B6.5: klass per entitet (storlek.json ids, t.ex. matbordet) före kategorin
  const id = STORLEK.ids?.[kropp] ?? STORLEK.kategori[e.kategori];
  const k = id ? STORLEK.klasser[id] : undefined;
  return k && id ? { id, ...k } : null;
}

/** Målhöjden; för stora saker högst klassens tak (B6.1). */
export function malhojd(kropp: string): number {
  const h = ENTITETER[kropp]?.malhojd ?? 1;
  const k = storlekKlass(kropp);
  return k ? Math.min(h, k.tak) : h;
}

/** B6.1 (E): barnets storleksord ("stor", "jätte") får inte lyfta en stor sak över taket. */
export function takSkala(kropp: string, skala: number): number {
  const k = storlekKlass(kropp);
  if (!k) return skala;
  return Math.min(skala, k.tak / Math.max(0.001, malhojd(kropp)));
}

const FOT = (fotJson as { halvbredd: Record<string, number> }).halvbredd;
/** B6.3: djuren vickar så här långt från sin plats (djur.tsx: x ±0,22, z ±0,16, hypot ≈ 0,27), saker står still. */
export const VICKNING = 0.27;
/** B6.3: fri strand mellan kroppens kant och vattnet (Doodle: halva bredden + 0,15, inte bara mitten). */
export const FOT_MARGINAL = 0.15;

/** B6.6: halva bredden på marken (data/fotavtryck.json, barnets storleksord inräknat, under taket). */
export function halvBredd(kropp: string, skala = 1): number {
  return (FOT[kropp] ?? 0.5 * malhojd(kropp)) * takSkala(kropp, skala || 1);
}

/**
 * P3 (Doodle r83a: narvalen var väldigt liten): minsta synliga storlek för en varelse. Kroppens skärmruta på djupet wz
 * (stående kamera, skarm.ts) får inte ha sitt minsta mått (bredd eller höjd) under syn.min_px (data/storlek.json).
 * Annars förstoras den, högst syn.max_forstoring gånger. Gäller djur, inte saker (de har minsta) eller stora saker (bak).
 */
export const SYN = STORLEK.syn;
const MODELLMATT_SYN = (modellmattSynJson as unknown as { matt: Record<string, number[]> }).matt;
export function synSkala(kropp: string, skala: number, wz: number): number {
  const S = STORLEK.syn;
  const e = ENTITETER[kropp];
  if (!S || !e || e.typ !== "djur") return 1;
  // P3a torr 4: modellens egna mått (data/modellmatt.json, som placeringsregeln) – fotavtrycket är den största halva
  // utbredningen (fjällräven 0,62 mot sin bredd 0,33/2) och gav för små djur
  const mm0 = MODELLMATT_SYN[kropp];
  const mm = mm0 && (harModell(kropp) || mm0.length > 3) ? mm0 : undefined;
  const ts = takSkala(kropp, skala || 1);
  const r = mm ? skarmRuta(0, 0, wz, (mm[0]! * ts) / 2, mm[1]! * ts) : skarmRuta(0, 0, wz, halvBredd(kropp, skala), malhojd(kropp) * ts);
  const minsta = Math.min(r.x1 - r.x0, r.y1 - r.y0);
  if (minsta <= 0) return 1;
  return Math.min(S.max_forstoring, Math.max(1, S.min_px / minsta));
}

/** B6.3: hur långt från vattnet mitten måste stå: halva bredden ur modellens bbox (data/fotavtryck.json, barnets
 *  storleksord inräknat; saknas raden 0,5 × målhöjden), minst klassens kant, plus vickningen för djur och marginalen. */
export function fotKant(kropp: string, skala = 1): number {
  const halv = halvBredd(kropp, skala);
  return Math.max(halv, storlekKlass(kropp)?.kant ?? 0) + (arSak(kropp) ? 0 : VICKNING) + FOT_MARGINAL;
}



/** R3G: allt med modell som inte är ett djur (föremål, natur, byggnad, mat, fordon, kläder) står still på ängen. */
export function arSak(kropp: string): boolean {
  const e = ENTITETER[kropp];
  return !!e && e.typ !== "djur" && !!modellUrl(kropp);
}

/** Kläder med 3D-modell som ska sitta på djuret vid "med", inte som en sak på marken. */
export function arPlagg(id: string): boolean {
  const e = ENTITETER[id];
  return e?.typ === "tillbehor" && !!modellUrl(id);
}

/** P3a-fix: en småsak. Antingen listad i storlek.json smasak.ids, eller en sak vars målhöjd ligger i smasak.malhojd. */
export function arSmasak(kropp: string): boolean {
  if (!arSak(kropp)) return false;
  if (STORLEK.smasak?.ids?.includes(kropp)) return true;
  const sm = STORLEK.smasak?.malhojd;
  const mal = malhojd(kropp);
  return !!sm && mal >= sm[0] - 1e-9 && mal <= sm[1] + 1e-9;
}

/** R3G: skala för en modell. Djur: målhöjden är höjden. Saker: målhöjden gäller det största av höjden och 0,6 × längsta sidan,
 * så platta och långa saker (gaffel, planka, lok) inte blir jättar eller streck. */
export function skalaFor(kropp: string, h: number, b: number, d: number): number {
  const mal = malhojd(kropp);
  // P3: småsaker (storlek.json smasak) mäts med största måttet, så att deras inbördes storlek följer målhöjden
  const sm = STORLEK.smasak?.malhojd;
  const langd = sm && mal >= sm[0] - 1e-9 && mal <= sm[1] + 1e-9 ? 1 : 0.6;
  const matt = arSak(kropp) ? Math.max(h, langd * Math.max(b, d)) : h;
  const s = mal / Math.max(0.001, matt);
  // B6.3: ingen skapelse bredare än slottet (2 × MAX_HALVBREDD) – långa modeller (apatosaurus 7,2, golem 5,1, neontetra
  // 2,9 breda) täckte dammen och fick ingen torr plats. Mäts på halva största bredden, som fotavtryck.json.
  // B6.6: klassen kan tillåta bredare (slottet, kyrkan: storlek.json max_halv)
  const bredTak = (storlekKlass(kropp)?.max_halv ?? MAX_HALVBREDD) / Math.max(0.001, 0.5 * Math.max(b, d));
  if (!arSak(kropp)) return Math.min(s, bredTak);
  // B6.6: en sak får aldrig bli så liten eller tunn att den försvinner i gräset (bäcken, stigen, fiskespöet, kniven):
  // minsta största mått och minsta yta framifrån (storlek.json "minsta"), högst max_forstoring gånger, och aldrig över taket.
  const M = STORLEK.minsta;
  if (!M) return Math.min(s, bredTak);
  const storst = Math.max(h, b, d) * s;
  // P3: ytan som kameran ser den (framsidan, eller ovansidan snett uppifrån om den är större), så att platta saker inte blåses upp
  const yta = Math.max(Math.max(b, d) * h, Math.max(b, d) * Math.min(b, d) * (M.ovanifran ?? 0)) * s * s;
  // P3: för småsaker ett mjukt golv som behåller ordningen (pucken förblir mindre än koppen); når storlek vid storlek
  const lut = langd === 1 ? (M.lutning ?? 0) : 0;
  const golv = M.storlek * (1 - lut) + lut * storst;
  let f = 1;
  if (storst < golv) f = Math.max(f, golv / Math.max(0.001, storst));
  // P3: ytkravet följer golvet i kvadrat (en småsak med lägre golv kräver mindre yta), så ordningen håller även här
  const ytKrav = M.yta * Math.min(1, golv / M.storlek) ** 2;
  if (yta < ytKrav) f = Math.max(f, Math.sqrt(ytKrav / Math.max(1e-6, yta)));
  f = Math.min(f, M.max_forstoring);
  const k = storlekKlass(kropp);
  if (k) f = Math.min(f, Math.max(1, k.tak / Math.max(0.001, h * s)));
  return Math.min(s * f, bredTak);
}

/** B6.3: största halva bredden på marken (världsenheter) en skapelse får ritas med; slottet är 1,15. */
export const MAX_HALVBREDD = 1.2;

export function artFarg(kropp: string): string {
  return ENTITETER[kropp]?.art ?? STANDARD_ART;
}

/** Barnets förmågor vinner; annars gäller entitetens rörelse. */
export function flyger(kropp: string, formagor: readonly string[]): boolean {
  return formagor.includes("vingar") || ENTITETER[kropp]?.rorelse === "flyg";
}

export function simmar(kropp: string, formagor: readonly string[]): boolean {
  return formagor.includes("fenor") || ENTITETER[kropp]?.rorelse === "sim";
}

/** Svävar stilla på stället (draken) i stället för att gå. Gäller bara om djuret inte flyger. */
export function svavar(kropp: string): boolean {
  return ENTITETER[kropp]?.rorelse === "svavar";
}

export function vikt(kropp: string): number {
  return ENTITETER[kropp]?.vikt ?? 1;
}

export function hoppHojd(kropp: string): number | null {
  return ENTITETER[kropp]?.hopp ?? null;
}

export function nattvaken(kropp: string): boolean {
  return ENTITETER[kropp]?.natt === "vaken";
}

/** Vridning runt y (radianer) som lägger modellens framsida mot +z, där kameran står. Saknas axel: 0. */
export function framVinkel(axel: FramAxel | undefined): number {
  switch (axel) {
    case "-z":
      return Math.PI;
    case "+x":
      return -Math.PI / 2;
    case "-x":
      return Math.PI / 2;
    default:
      return 0;
  }
}

/** Kontroll av data: [] = ok. Filförekomst kontrolleras i entiteter.test.ts (använder fs). */
export function kontrolleraEntiteter(): string[] {
  const fel: string[] = [];
  const hex = /^#[0-9a-fA-F]{6}$/;
  for (const [id, e] of Object.entries(ENTITETER)) {
    if (!TYPER.includes(e.typ)) fel.push(`${id}: okänd typ ${String(e.typ)}`);
    if (!e.kategori) fel.push(`${id}: saknar kategori`);
    if (e.modell !== null && !TILLGANGAR[e.modell]?.fil) fel.push(`${id}: modell "${e.modell}" finns inte som fil i tillgangar.json`);
    if (e.rundModell && !TILLGANGAR[e.rundModell]?.fil) fel.push(`${id}: rundModell "${e.rundModell}" finns inte som fil i tillgangar.json`);
    if (e.modell !== null && !(typeof e.malhojd === "number" && e.malhojd > 0)) fel.push(`${id}: modell kräver malhojd > 0`);
    if (!hex.test(e.art)) fel.push(`${id}: art är ingen hexfärg`);
    if (e.standardfarg !== undefined && !hex.test(e.standardfarg)) fel.push(`${id}: standardfarg är ingen hexfärg`);
    if (e.rorelse !== undefined && !RORELSER.includes(e.rorelse)) fel.push(`${id}: okänd rorelse ${String(e.rorelse)}`);
    if (e.framAxel !== undefined && !AXLAR.includes(e.framAxel)) fel.push(`${id}: okänd framAxel ${String(e.framAxel)}`);
    if (e.palett && !(Number.isFinite(e.palett.from) && Number.isFinite(e.palett.range) && Number.isFinite(e.palett.bodyL))) {
      fel.push(`${id}: palett måste ha från, range och bodyL som tal`);
    }
    for (const [namn, roll] of Object.entries(e.material ?? {})) {
      if (roll !== "farg" && roll !== "ljus" && roll !== "behall") fel.push(`${id}: material ${namn} har okänd roll ${String(roll)}`);
    }
    if (e.vikt !== undefined && !(e.vikt > 0)) fel.push(`${id}: vikt måste vara > 0`);
    if (e.hopp !== undefined && !(e.hopp > 0)) fel.push(`${id}: hopp måste vara > 0`);
  }
  for (const [id, t] of Object.entries(TILLGANGAR)) {
    if (!t.fil && !t.mapp) fel.push(`tillgång ${id}: saknar fil eller mapp`);
    if (!LICENSER[t.licens]) fel.push(`tillgång ${id}: okänd licens ${t.licens}`);
    if (!t.upphov || !t.kalla) fel.push(`tillgång ${id}: saknar upphov eller källa`);
  }
  return fel;
}
