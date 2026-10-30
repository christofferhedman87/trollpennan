// Nya Skapa: när barnet trycker på mellanslag kollas ordet direkt, med samma tolk som Trolla använder.
// Känt ord → landar i sin färg. Nästan rätt → "Menade du …?". Okänt → ordägg (sparas, ritas som ägg).
import { tolkaByggFormel } from "../../tolk/byggform.ts";
import { tolkaMedReserv } from "../../tolk/reserv.ts";
import { arSparrat } from "../../tolk/sparr.ts";
import { tolka } from "../../tolk/tolka.ts";
import type { ForslagKort } from "../../tolk/typer.ts";
import { arSmaord, slaUpp, type Fraga } from "./lexikon.ts";

export type OrdSvar = { typ: "kand" } | { typ: "forslag"; text: string; forslag: ForslagKort[] } | { typ: "okand" };

const cache = new Map<string, Fraga | null>();

/** Sammansättningar och böjningar som inte står i lexikonet men som tolken förstår ("trähus", "jättekatt",
 *  "eldsprutande"). Svarar med frågan ordet svarar på, eller null om tolken inte känner ordet. */
export function sammansatt(w0: string): Fraga | null {
  const w = w0.toLocaleLowerCase("sv");
  if (cache.has(w)) return cache.get(w)!;
  let svar: Fraga | null = null;
  if (!arSparrat(w)) {
    const b = tolkaByggFormel(w);
    if (b.typ === "bygge" && !b.okanda.length && b.byggen[0]) svar = "vad";
    else {
      const u = tolka(w, { kalla: "kort" });
      if (u.typ === "skapad" && !u.okanda.length && !u.varelse.reserv?.length) svar = "vad";
      else if (u.typ === "behover_djur" && !u.okanda.length) svar = "hurdan";
    }
  }
  if (cache.size > 400) cache.clear();
  cache.set(w, svar);
  return svar;
}

export function arKantOrd(w0: string): boolean {
  const w = w0.toLocaleLowerCase("sv");
  return arSmaord(w) || slaUpp([w], 0, "fri") != null || slaUpp([w], 0, "som", "bygg") != null || sammansatt(w) != null;
}

/** Kolla det ord barnet just skrev färdigt (sista ordet i `fore`, som är meningen fram till och med ordet). */
export function kollaOrd(fore: string, ord: string, behall: readonly string[]): OrdSvar {
  const w = ord.toLocaleLowerCase("sv");
  if (!w || /^\d+$/.test(w)) return { typ: "kand" };
  if (/^[A-ZÅÄÖ]/.test(ord)) return { typ: "kand" }; // ett namn
  const toks = fore.toLocaleLowerCase("sv").trim().split(/\s+/);
  const forra = toks.at(-2);
  if (forra === "heter" || forra === "kallas") return { typ: "kand" };
  if (arKantOrd(w)) return { typ: "kand" };
  if (behall.includes(w)) return { typ: "okand" };
  const u = tolkaMedReserv(fore, { kalla: "skriv", behall: [...behall] });
  if (u.typ === "forslag" && u.token === w && u.forslag.length) return { typ: "forslag", text: u.text, forslag: u.forslag };
  const b = tolkaByggFormel(fore);
  if (b.typ === "forslag" && b.token === w && b.forslag.length) return { typ: "forslag", text: b.text, forslag: b.forslag };
  return { typ: "okand" };
}
