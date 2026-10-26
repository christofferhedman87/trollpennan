// R9K: idéraden under uppdraget får aldrig visa svaret. Knapparna börjar meningen ("en kanin med …") och barnet skriver
// själv resten. Generellt för alla uppdrag på alla platser: kravorden (och deras böjningar, samma regel som kontrollen) tas
// aldrig med, inte i knapparna, inte i etiketterna, och samma knapp visas bara en gång.
import ordJson from "../../data/ord.json" with { type: "json" };
import { forstaDjurKropp, type Uppdrag } from "./aventyr.ts";
import { kravTraffar } from "./uppdragsmotor.ts";

const F = (ordJson as { funktionsord: { artiklar: string[]; med: string[]; och: string[]; som: string[]; kan: string[]; antal: Record<string, number> } }).funktionsord;
const ARTIKLAR = new Set(F.artiklar);
/** Småord som inte räcker som början på en idé ("en …" säger ingenting). */
const SMAORD = new Set([...F.artiklar, ...F.med, ...F.och, ...F.som, ...F.kan, ...Object.keys(F.antal)]);

export type IdeKnapp = { visa: string; fyll: string };
export type IdeGrupp = { etikett: string; knappar: IdeKnapp[] };
export type IdeRad = { rubrik: string; grupper: IdeGrupp[] };

/** Innehåller texten något kravord (exakt, böjt eller i ett sammansatt ord)? */
export function visarKravord(krav: Uppdrag["krav"], text: string): boolean {
  return !!krav && kravTraffar({ ord: krav.ord, min: 1 }, text).length > 0;
}

/** Början på en fras fram till första kravordet, utan artikel sist. null om det som är kvar bara är småord. */
export function borjan(krav: Uppdrag["krav"], fras: string): string | null {
  const fore: string[] = [];
  for (const o of fras.trim().split(/\s+/)) {
    if (visarKravord(krav, o)) break;
    fore.push(o);
  }
  while (fore.length && ARTIKLAR.has(fore[fore.length - 1]!.toLocaleLowerCase("sv"))) fore.pop();
  return fore.some((o) => !SMAORD.has(o.toLocaleLowerCase("sv"))) ? fore.join(" ") : null;
}

/** Idéraden för ett uppdrag, eller null när det inte finns någon idé som inte avslöjar svaret. */
export function ideRad(u: (Pick<Uppdrag, "krav" | "val"> & { id?: string }) | undefined, djurKropp?: string): IdeRad | null {
  if (!u?.val) return null;
  const sedda = new Set<string>();
  const grupper: IdeGrupp[] = [];
  const djur = u.id === "kanin-fryser" ? (djurKropp ?? forstaDjurKropp()).toLocaleLowerCase("sv") : "";
  for (const g of u.val.grupper) {
    const knappar: IdeKnapp[] = [];
    for (const f of g.forslag) {
      const fras = djur ? f.fras.replace(/\bkanin\b/gi, djur) : f.fras;
      const b = borjan(u.krav, fras);
      if (!b || sedda.has(b.toLocaleLowerCase("sv"))) continue;
      sedda.add(b.toLocaleLowerCase("sv"));
      knappar.push({ visa: `${b} …`, fyll: `${b} ` });
    }
    if (knappar.length) grupper.push({ etikett: visarKravord(u.krav, g.etikett) ? "" : g.etikett, knappar });
  }
  if (!grupper.length) return null;
  return { rubrik: visarKravord(u.krav, u.val.rubrik) ? "" : u.val.rubrik, grupper };
}

const ETT_ORD = new Set<string>(
  ((ordJson as { ord?: { id?: string; visa?: string; genus?: string }[] }).ord ?? [])
    .filter((o) => o.genus === "n")
    .flatMap((o) => [o.id, o.visa].filter((x): x is string => !!x)),
);

const HJALP_FORSLAG: Record<string, string[]> = {
  "kanin-fryser": ["en varm halsduk", "en röd mössa", "en varm filt", "en sol"],
  "regn-skydd": ["ett stort paraply", "ett gult tält", "en varm regnjacka", "ett litet hus"],
  "sol-skugga": ["ett stort parasoll", "en gul solhatt", "ett grönt träd", "ett svalt tält"],
  "magen-kurrar": ["en knaprig morot", "ett rött äpple", "en gul banan", "en grön broccoli"],
  "regn-pa-nosen": ["ett varmt tält", "en mysig koja", "ett litet hus", "en grön grotta"],
  "kalla-tassar": ["en varm tröja", "en mjuk mössa", "en röd filt", "ett varmt täcke"],
  "trakig-eftermiddag": ["en studsande boll", "en rolig bok", "en snäll nallebjörn", "en gul gunga"],
  "ljus-i-kvallen": ["en varm lykta", "en gul lampa", "en lysande ficklampa", "en fin nattlampa"],
  "redo-for-fest": ["en hög cylinderhatt", "en fin klänning", "en röd keps", "en lila häxhatt"],
  "leriga-tassar": ["ett varmt badkar", "en mjuk tvål", "en blå dusch", "en balja med vatten"],
  "dags-att-vila": ["en mjuk säng", "en skön soffa", "en varm kudde", "en mjuk madrass"],
  "badlangtan": ["ett stort badkar", "en blå pool", "en liten sjö", "en varm strand"],
  "over-backen": ["en stark träbro", "en liten roddbåt", "en gul kanot", "en bred bro"],
  "skugga-at-djuret": ["ett stort träd", "en grön palm", "ett svalt tält", "en mysig koja"],
  "present-till-en-van": ["en röd blomma", "en spännande bok", "en mjuk nallebjörn", "en god kaka"],
  "hitta-till-picknicken": ["en tydlig karta", "en blank kompass", "en gul skylt", "en hög vägskylt"],
  "skog-magen-kurrar": ["en knaprig morot", "ett rött äpple", "en gul banan", "en grön broccoli"],
  "skog-vila-benen": ["en mjuk stubbe", "en bred stock", "en skön stol", "en mjuk soffa"],
  "skog-regnpaus": ["ett varmt tält", "en mysig koja", "ett litet hus", "en trygg grotta"],
  "skog-varm-van": ["en varm tröja", "en röd mössa", "en mjuk filt", "ett varmt täcke"],
  "skog-kvallsljus": ["en varm lykta", "en gul lampa", "en lysande ficklampa", "en fin nattlampa"],
  "skog-over-backen": ["en stark träbro", "en liten båt", "en gul roddbåt", "en snabb kanot"],
  "sjo-fruktpaus": ["ett rött äpple", "en gul banan", "en söt apelsin", "en grön vattenmelon"],
  "sjo-skugga-pa-stranden": ["ett stort träd", "en grön palm", "ett svalt tält", "en mysig koja"],
  "sjo-torr-overfart": ["en liten roddbåt", "en gul kanot", "en bred flotte", "en stor båt"],
  "sjo-regn-vid-stranden": ["ett varmt tält", "en mysig koja", "ett litet hus", "en trygg grotta"],
  "sjo-lys-vid-vattnet": ["en varm lykta", "en gul lampa", "en lysande ficklampa", "en fin nattlampa"],
  "grotta-forsta-skenet": ["en varm lykta", "en gul lampa", "en lysande ficklampa", "en fin nattlampa"],
  "grotta-varma-oron": ["en varm tröja", "en mjuk mössa", "en röd filt", "ett varmt täcke"],
  "grotta-mjuk-vila": ["en mjuk säng", "en skön soffa", "en varm kudde", "en mjuk madrass"],
};

export function uppdragForslag(
  u: { id?: string; exempel?: string[]; krav?: { ord: string[]; min?: number; djur?: boolean } } | null | undefined,
  djurKropp?: string,
): string[] {
  if (!u) return [];
  if (u.id && HJALP_FORSLAG[u.id]) return HJALP_FORSLAG[u.id]!;
  const djur = djurKropp ?? "kanin";
  const ord = u.krav?.ord ?? [];
  const urKrav: string[] = [];
  for (const o of ord.slice(0, 4)) {
    if (["röd", "blå", "gul", "grön", "vit", "svart", "rosa", "lila", "brun", "orange", "stor", "liten", "pytteliten", "jättestor", "randig", "prickig", "rutig", "fluffig", "mjuk", "snabb", "långsam", "glad", "varm", "kall"].includes(o)) {
      urKrav.push(`en ${o} ${djur}`);
    } else if (["katt", "hund", "kanin", "bi", "fågel", "elefant", "giraff", "zebra", "tiger", "isbjörn", "lamm", "groda", "larv", "papegoja", "drake", "mus", "hare", "häst", "pingvin", "apa", "delfin", "uggla", "igelkott", "fisk", "anka", "kyckling"].includes(o)) {
      urKrav.push(`${ETT_ORD.has(o) ? "ett" : "en"} ${o}`);
    } else {
      urKrav.push(`${ETT_ORD.has(o) ? "ett" : "en"} ${o}`);
    }
  }
  const ex = (u.exempel ?? []).filter((e) => !urKrav.includes(e));
  return [...urKrav, ...ex].slice(0, 4);
}

/** Exempelraden i boken: uppdragets idéer, annars de allmänna exemplen utan dem som avslöjar svaret. */
export function exempelFor(u: Pick<Uppdrag, "krav" | "val"> | undefined, allmanna: string[]): IdeKnapp[] {
  const rad = ideRad(u);
  if (rad) return rad.grupper.flatMap((g) => g.knappar);
  return allmanna.filter((e) => !visarKravord(u?.krav, e)).map((e) => ({ visa: e, fyll: e }));
}
