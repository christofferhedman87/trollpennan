// B6.5: attribut ger alltid en synlig effekt (attributrad + effekt i data/attribut.json), inget extra ägg ("brinnande" ≠ "brinn" + "ande"),
// simmare spridda över vattnet, stora möbler bak, narvalen simmar, "teve" och "tv" samma modell.
import assert from "node:assert/strict";
import { test } from "node:test";
import attributJson from "../../data/attribut.json" with { type: "json" };
import { ORD } from "../tolk/data.ts";
import { tolka } from "../tolk/tolka.ts";
import { djurPlats } from "./ang/delat.ts";
import { EFFEKT_NAMN, EFFEKT_TABELL, I_KROPPEN, effekterFor } from "./attribut.ts";
import { ENTITETER, simmar, storlekKlass } from "./entiteter.ts";
import { PLATSER } from "./platser.ts";
import { iVatten, tillPlats } from "./platsYta.ts";

const skapad = (f: string) => {
  const u = tolka(f);
  assert.equal(u.typ, "skapad", f);
  return u as Extract<typeof u, { typ: "skapad" }>;
};

test("B6.5: 'en brinnande hund' är en hund med lågor – ingen ande, inget ägg", () => {
  const u = skapad("en brinnande hund");
  assert.equal(u.varelse.kropp, "hund");
  assert.equal(u.antal, 1);
  assert.ok(!u.funna.includes("ande"), JSON.stringify(u.funna));
  assert.deepEqual(effekterFor(u.varelse), ["lagor"]);
});

test("B6.5: 'en regnbågsfärgad katt', 'en hund med eld', 'en glödande katt' ger en effekt", () => {
  assert.deepEqual(effekterFor(skapad("en regnbågsfärgad katt").varelse), ["regnbage"]);
  assert.deepEqual(effekterFor(skapad("en hund med eld").varelse), ["eld"]);
  assert.deepEqual(effekterFor(skapad("en glödande katt").varelse), ["glod"]);
  assert.deepEqual(effekterFor(skapad("en flammande drake").varelse), ["lagor"]);
});

test("B6.5: ett okänt particip blir ett okänt ord, aldrig en sammansättning med 'ande'", () => {
  const u = tolka("en dansande hund");
  assert.ok(!("funna" in u) || !(u as { funna: string[] }).funna.includes("ande"), JSON.stringify(u));
  // en känd sammansättning med ande fungerar fortfarande
  assert.equal(skapad("en ande").varelse.kropp, "ande");
});

test("B6.5: varje egenskap som ett ord kan ge har en attributrad (effekt eller ritas i kroppen)", () => {
  const nycklar = new Set<string>();
  const dels = [...ORD.ord.map((o) => o.del ?? {}), ...Object.values(ORD.sammansattningar.forled)] as { formaga?: string; monster?: string }[];
  for (const d of dels) {
    if (d.formaga) nycklar.add(`formaga:${d.formaga}`);
    if (d.monster) nycklar.add(`monster:${d.monster}`);
  }
  for (const k of nycklar) assert.ok(EFFEKT_TABELL[k] || I_KROPPEN.includes(k), `${k} saknar rad i data/attribut.json`);
  for (const [k, lista] of Object.entries(EFFEKT_TABELL)) for (const e of lista) assert.ok((EFFEKT_NAMN as readonly string[]).includes(e), `${k}: okänd effekt ${e}`);
  assert.ok(attributJson.particip.slut.includes("ande"));
});

test("B6.5: simmare på sjön sprids över vattnet (inte en klump vid bryggan)", () => {
  const sjon = PLATSER.find((p) => p.id === "sjon")!;
  const spar = (uid: string, kropp: string) => ({ uid, kropp, formel: `en ${kropp}`, beskrivning: "", skala: 1, alpha: 1, formagor: [], tillbehor: [], overraskningar: [], skapad: 1 }) as never;
  const alla = ["fisk", "haj", "delfin", "narval", "sal"].map((k, i) => spar(`s${i}`, k));
  const lagen = alla.map((d) => djurPlats(d, alla, sjon));
  for (const p of lagen) assert.ok(iVatten(sjon, ...tillPlats(p[0], p[2])), `${p} i vattnet`);
  let minst = Infinity;
  for (let i = 0; i < lagen.length; i++)
    for (let j = i + 1; j < lagen.length; j++) minst = Math.min(minst, Math.hypot(lagen[i]![0] - lagen[j]![0], lagen[i]![2] - lagen[j]![2]));
  assert.ok(minst >= 0.85, `minsta avstånd mellan simmare ${minst.toFixed(2)}`);
  const xs = lagen.map((l) => l[0]);
  assert.ok(Math.max(...xs) - Math.min(...xs) >= 2, `spridning i x ${(Math.max(...xs) - Math.min(...xs)).toFixed(2)}`);
});

test("B6.5: narvalen och bläckfisken simmar; teve och tv är samma modell; matbordet står bak, kudden inte", () => {
  assert.ok(simmar("narval", []));
  assert.ok(simmar("blackfisk", []));
  assert.equal(ENTITETER.teve?.modell, ENTITETER.tv?.modell);
  assert.equal(storlekKlass("matbord")?.zon, "bak");
  assert.equal(storlekKlass("kudde"), null);
});
