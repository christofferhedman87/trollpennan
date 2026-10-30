// Nya Skapa 7.2: artiklar och adjektiv som ett kort lagt in böjs efter substantivets genus ("stor" → "stort"
// när det står "ett hus"). Det barnet skrivit böjs aldrig tyst; där visar remsan böjningshjälpen i stället.
import { huvudord, meningsbrickor, type BrickOpts } from "./meningsbrickor.ts";
import type { MOrd } from "./mening.ts";

const ANTAL = /^(två|tre|fyra|fem|sex|sju|åtta|nio|tio|många)$/i;

/** Böj kortens artiklar och adjektiv. Returnerar de ord som bytte form (för vändningen i remsan). */
export function autoBoj(ord0: readonly MOrd[], opts?: BrickOpts): { ord: MOrd[]; bojda: number[] } {
  const ord = ord0.map((o) => ({ ...o }));
  const br = meningsbrickor(ord, opts);
  const bojda: number[] = [];
  if (ord.some((o) => ANTAL.test(o.t))) return { ord, bojda };
  for (let b = 0; b < br.length; b++) {
    const x = br[b]!;
    if (x.kalla === "skriv" || x.n !== 1) continue;
    const artikel = x.klass === "smaord" && /^(en|ett)$/i.test(x.t);
    if (!artikel && !x.bojning) continue;
    const h = huvudord(br, b);
    if (!h?.genus) continue;
    const ratt = artikel ? h.genus : x.bojning![h.genus];
    if (ord[x.i]!.t !== ratt) {
      ord[x.i]!.t = ratt;
      bojda.push(x.i);
    }
  }
  return { ord, bojda };
}

/** Rätta ett ord till formen som böjningshjälpen föreslår. Som ett valt förslag blir det ett vanligt ord (inte guld);
 *  suddar barnet och skriver om ordet själv blir det guld igen. */
export function rattaBoj(ord: readonly MOrd[], i: number, ratt: string): MOrd[] {
  return ord.map((o, j) => (j === i ? { t: ratt, k: "kort" as const } : o));
}
