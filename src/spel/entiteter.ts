// Entiteter: rena funktioner över data/entiteter.json och data/tillgangar.json. Ingen three-import (testas i Node).
// Ett nytt djur = en rad i entiteter.json + en rad i tillgangar.json + (efter granskning) en ordrad. Ingen kod per djur.
import entiteterJson from "../../data/entiteter.json" with { type: "json" };
import tillgangarJson from "../../data/tillgangar.json" with { type: "json" };

export type Typ = "djur" | "tillbehor" | "byggnad" | "foremal" | "natur";
export type Rorelse = "land" | "flyg" | "sim" | "svavar";
export type FramAxel = "+z" | "-z" | "+x" | "-x";
export type Palett = { from: number; range: number; bodyL: number };
export type Entitet = {
  typ: Typ;
  kategori: string;
  /** Nyckel i tillgangar.json, eller null om djuret bara finns som kodritad form. */
  modell: string | null;
  /** Önskad höjd i ängens enheter (krävs när modell finns). */
  malhojd?: number;
  palett?: Palett;
  /** Grundfärg när barnet inte skrivit någon (kodritad form och kort). */
  art: string;
  rorelse?: Rorelse;
  vikt?: number;
  /** Hopphöjd (sekunder av hopp-animationen); saknas = hoppar inte. */
  hopp?: number;
  natt?: "vaken";
  /** Färg som gäller när barnet inte valt någon. */
  standardfarg?: string;
  /** Materialnamn i GLB → roll: "farg" tar djurets färg, "ljus" en ljusare nyans. Saknas = paletten byter färg. */
  material?: Record<string, "farg" | "ljus">;
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

export function modellUrl(kropp: string): string | null {
  const m = ENTITETER[kropp]?.modell;
  return (m && TILLGANGAR[m]?.fil) || null;
}

export function malhojd(kropp: string): number {
  return ENTITETER[kropp]?.malhojd ?? 1;
}

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
    if (e.modell !== null && !(typeof e.malhojd === "number" && e.malhojd > 0)) fel.push(`${id}: modell kräver malhojd > 0`);
    if (!hex.test(e.art)) fel.push(`${id}: art är ingen hexfärg`);
    if (e.standardfarg !== undefined && !hex.test(e.standardfarg)) fel.push(`${id}: standardfarg är ingen hexfärg`);
    if (e.rorelse !== undefined && !RORELSER.includes(e.rorelse)) fel.push(`${id}: okänd rorelse ${String(e.rorelse)}`);
    if (e.framAxel !== undefined && !AXLAR.includes(e.framAxel)) fel.push(`${id}: okänd framAxel ${String(e.framAxel)}`);
    if (e.palett && !(Number.isFinite(e.palett.from) && Number.isFinite(e.palett.range) && Number.isFinite(e.palett.bodyL))) {
      fel.push(`${id}: palett måste ha från, range och bodyL som tal`);
    }
    for (const [namn, roll] of Object.entries(e.material ?? {})) {
      if (roll !== "farg" && roll !== "ljus") fel.push(`${id}: material ${namn} har okänd roll ${String(roll)}`);
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
