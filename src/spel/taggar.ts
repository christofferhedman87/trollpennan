import egenJson from "../../data/egenskaper.json" with { type: "json" };
import { ordFranForm } from "../tolk/lexikon.ts";
import type { Varelse } from "../tolk/typer.ts";

type Egen = {
  formaga: Record<string, string[]>;
  tillbehor: Record<string, string[]>;
  tillbehorsord?: Record<string, string[]>;
  monster: Record<string, string[]>;
  genomskinlighet: { taggar: string[] };
  storlek: { stor: { taggar: string[] }; liten: { taggar: string[] } };
  kropp: Record<string, string[]>;
  fargtaggar: Record<string, string[]>;
};

const E = egenJson as Egen;

export function taggarAv(v: Varelse, medKropp: boolean): Set<string> {
  const s = new Set<string>();
  if (medKropp) {
    s.add(`kropp:${v.kropp}`);
    for (const t of E.kropp[v.kropp] ?? []) s.add(t);
  }
  if (v.farg) {
    s.add("farg");
    for (const t of E.fargtaggar[v.farg] ?? []) s.add(t);
  }
  for (const id of v.formagor) {
    s.add(`formaga:${id}`);
    for (const t of E.formaga[id] ?? []) s.add(t);
  }
  for (const tb of v.tillbehor) {
    s.add(`tillbehor:${tb.id}`);
    // Flera ord kan dela modell. Solglasögon och vanliga glasögon gör olika
    // saker, även i äldre v2 som bara sparar modell-id och den färdiga formeln.
    const alias = v.formel.toLocaleLowerCase("sv").split(/[^a-zåäöéü]+/).map(ordFranForm)
      .find((o) => o?.del?.tillbehor === tb.id && E.tillbehorsord?.[o.id]);
    for (const t of (alias && E.tillbehorsord?.[alias.id]) ?? E.tillbehor[tb.id] ?? []) s.add(t);
  }
  if (v.monster) {
    s.add(`monster:${v.monster}`);
    for (const t of E.monster[v.monster] ?? []) s.add(t);
  }
  if (v.alpha <= 0.6) for (const t of E.genomskinlighet.taggar) s.add(t);
  if (v.skala >= 1.3) for (const t of E.storlek.stor.taggar) s.add(t);
  if (v.skala <= 0.75) for (const t of E.storlek.liten.taggar) s.add(t);
  return s;
}

export function nyaTaggar(fore: Varelse, efter: Varelse): Set<string> {
  const a = taggarAv(fore, false);
  const b = taggarAv(efter, false);
  const n = new Set<string>();
  for (const t of b) if (!a.has(t)) n.add(t);
  return n;
}

export function uppfyller(taggar: Set<string>, nagon: string[], alla: string[]): boolean {
  if (alla.some((t) => !taggar.has(t))) return false;
  if (!nagon.length) return alla.length > 0;
  return nagon.some((t) => taggar.has(t));
}
