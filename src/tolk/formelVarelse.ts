// T-07/T-08: oförändrad tolklogik, uppdelad före språkändringarna.
import { ORD } from "./data.ts";
import { arPluralForm, boj, pluralOrd } from "./lexikon.ts";
import type { Ord } from "./typer.ts";
import { type Bygg, singularYta, ytaMedForm } from "./tolktillstand.ts";

export function blanda(hex: string, mot: string, t: number): string {
  const p = (h: string) => {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const a = p(hex);
  const c = p(mot);
  const u = a.map((v, i) => Math.round(v + (c[i]! - v) * t));
  return "#" + u.map((v) => v.toString(16).padStart(2, "0")).join("");
}

export function monsterVisas(b: Bygg): Ord | null {
  if ((b.randAuto || b.monsterDolj) && !b.monsterOrd) return null;
  const o = b.monsterOrd;
  if (o?.bojning && o.efter !== "med") return o;
  if (!b.monster) return o;
  const adj = ORD.ord.filter(
    (x) => x.klass === "monster" && x.del?.monster === b.monster && x.bojning && x.efter !== "med",
  );
  adj.sort((a, c) => (a.niva === "kort" ? 0 : 1) - (c.niva === "kort" ? 0 : 1));
  return adj[0] ?? o;
}

export function fargAdjektiv(o: Ord | null): Ord | null {
  if (!o) return null;
  if (o.bojning) return o;
  const hex = o.del?.farg;
  if (!hex) return o;
  const adj = ORD.ord.find((x) => x.klass === "farg" && x.bojning && x.del?.farg === hex && x.id !== o.id);
  return adj ?? o;
}

export function formelAv(b: Bygg): string {
  const djur = b.djur!;
  const plural = (b.antalSatt ? b.antal : b.plural ? 3 : 1) > 1;
  const key: "u" | "n" | "pl" = plural ? "pl" : djur.genus === "n" ? "n" : "u";
  const antal = b.antalSatt ? b.antal : b.plural ? 3 : 1;
  const delar: string[] = [];
  if (plural) {
    const namn = Object.entries(ORD.funktionsord.antal).find(([, n]) => n === antal)?.[0];
    delar.push(namn ?? String(antal));
  } else delar.push(djur.genus === "n" ? "ett" : "en");
  if (b.storlek) delar.push(boj(b.storlek, key));
  const farg = fargAdjektiv(b.fargOrd);
  const farg2 = b.fargOrd2 ? fargAdjektiv(b.fargOrd2) ?? b.fargOrd2 : null;
  if (farg) delar.push(boj(farg, key));
  if (farg2) delar.push("och", boj(farg2, key));
  const mon = monsterVisas(b);
  if (mon?.bojning && mon.efter !== "med") delar.push(boj(mon, key));
  for (const e of ORD.ord) {
    if (e.klass !== "egenskap") continue;
    if (!b.funna.some((f) => f.id === e.id)) continue;
    if (b.inteDjur.includes(e.id)) continue;
    delar.push(boj(e, key));
  }
  for (const f of b.formagor) {
    if (f.vis === "adj" && f.ord) delar.push(f.ord.bojning ? boj(f.ord, key) : f.ord.visa);
  }
  const namn = b.djurRaw
    ? plural
      ? ytaMedForm(b.djurRaw, djur, pluralOrd(djur))
      : singularYta(b.djurRaw, djur)
    : plural
      ? pluralOrd(djur)
      : djur.visa;
  delar.push(namn);
  const med: string[] = [];
  if (mon && mon.efter === "med" && !mon.bojning) med.push(mon.visa);
  for (const f of b.formagor) if (f.vis === "som" && f.ord?.efter === "med") med.push(f.ord.visa);
  if (med.length) delar.push("med", med.join(" och "));
  let forra = med.length ? "med" : "";
  for (const t of b.tillbehor) {
    if (t.recept) continue;
    const plural = (t.antal ?? 1) > 1 || t.ord.genus === "pl" || !!t.form && arPluralForm(t.ord, t.form);
    const genus = plural ? "pl" : t.ord.genus === "n" ? "n" : "u";
    const f = t.fargOrd ? boj(fargAdjektiv(t.fargOrd) ?? t.fargOrd, genus) : "";
    const artikel = t.antal ? (t.antalOrd ?? String(t.antal)) : t.artikel && !plural ? (genus === "n" ? "ett" : "en") : "";
    const namn = (t.antal ?? 1) > 1 && !arPluralForm(t.ord, t.form ?? t.ord.visa) ? pluralOrd(t.ord) : t.form ?? t.ord.visa;
    const fras = [artikel, ...(t.egenskaper ?? []), f, namn].filter(Boolean).join(" ");
    const relation = t.relation ?? "med";
    delar.push(relation === forra ? "och" : relation, fras);
    forra = relation;
  }
  if (b.formagor.some((f) => f.vis === "som" && f.ord?.efter !== "med")) {
    const verb = b.formagor
      .filter((f) => f.vis === "som" && f.ord?.efter !== "med")
      .map((f) => {
        if (f.ord?.visa) return f.ord.visa;
        const kort = ORD.ord.find((o) => o.niva === "kort" && o.klass === "formaga" && o.del?.formaga === f.nyckel);
        return kort?.visa ?? f.nyckel;
      });
    delar.push("som", verb.join(" och "));
  }
  return delar.join(" ").replace(/\s+/g, " ").trim();
}

export function overraskningar(b: Bygg): { effekt: string; text: string }[] {
  const träff: { effekt: string; text: string }[] = [];
  for (const o of ORD.overraskningar) {
    const ok = o.om.every((cond) => {
      if (cond.startsWith("monster:")) return b.monster === cond.slice("monster:".length);
      if (cond.startsWith("formaga:")) return b.formagor.some((f) => f.nyckel === cond.slice("formaga:".length));
      if (cond.startsWith("skala>=")) return b.skala >= Number(cond.slice("skala>=".length));
      if (cond === "egenskap:osynlig") return b.kontur && b.alpha <= 0.3;
      return false;
    });
    if (ok) träff.push({ effekt: o.effekt, text: o.text });
  }
  return träff;
}
