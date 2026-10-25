// P4a: uppläsning på tryck och separata reglage för röst och ljudeffekter.
import assert from "node:assert/strict";
import fs from "node:fs";
import { afterEach, beforeEach, test } from "node:test";
import { ljud } from "./ljud.ts";
import { franSparning, useMinne } from "./minne.ts";
import * as rostKo from "./rostKo.ts";

const lasning = JSON.parse(fs.readFileSync("data/lasning.json", "utf8")) as {
  lyssna: Record<string, string>;
  ljud: Record<string, string>;
};
const takt = JSON.parse(fs.readFileSync("data/rost-takt.json", "utf8")) as {
  kallor: Record<string, string>;
};

type Spelad = { text: string; klass: string; kalla: string };
type RostRad = { text: string; satt: string; klass?: string; kalla?: string };

function rigg() {
  const tid = 0;
  let nastaId = 0;
  const timers: { id: number; vid: number; fn: () => void }[] = [];
  const spelade: Spelad[] = [];
  const rost: RostRad[] = [];
  const w = globalThis as unknown as { window: typeof globalThis; __rost: RostRad[] };
  w.window = globalThis;
  w.__rost = rost;
  const senare = (ms: number, fn: () => void) => {
    const id = ++nastaId;
    timers.push({ id, vid: tid + ms, fn });
    return id;
  };
  const avbrytSenare = (id: number) => {
    const i = timers.findIndex((t) => t.id === id);
    if (i >= 0) timers.splice(i, 1);
  };
  rostKo.prov({
    nu: () => tid,
    senare,
    avbrytSenare,
    spela: (text, meta, _las, klar) => {
      spelade.push({ text, klass: meta.klass, kalla: meta.kalla });
      const id = senare(5_000, klar);
      return { avbryt: () => avbrytSenare(id) };
    },
  });
  return { spelade, rost };
}

beforeEach(() => {
  useMinne.getState().aterstall();
  rostKo.provAterstall();
  ljud.satt(true);
});

afterEach(() => {
  rostKo.provAterstall();
  useMinne.getState().aterstall();
  ljud.satt(true);
});

test("P4a: lasning.json har lyssna- och ljudtexter", () => {
  for (const k of ["knapp", "aria_gata", "aria_uppdrag", "aria_onska", "aria_forslag"]) {
    assert.equal(typeof lasning.lyssna[k], "string", k);
    assert.ok(lasning.lyssna[k]!.length > 0, k);
  }
  for (const k of ["rost_pa", "rost_av", "effekt_pa", "effekt_av"]) {
    assert.equal(typeof lasning.ljud[k], "string", k);
  }
});

test("P4a: rost-takt har källan las_upp som svar", () => {
  assert.equal(takt.kallor.las_upp, "svar");
  assert.equal(rostKo.TAKT.kallor.las_upp, "svar");
});

test("P4a: lasUpp avbryter lägre prioritet, spelar direkt som svar och kan spelas igen", () => {
  const { spelade, rost } = rigg();
  rostKo.oppna();
  rostKo.anmal({ text: "Följ med", kalla: "sov" });
  assert.equal(spelade.length, 1);
  assert.equal(spelade[0]!.klass, "folj");
  rostKo.lasUpp("En gåta");
  assert.equal(spelade.at(-1)!.text, "En gåta");
  assert.equal(spelade.at(-1)!.klass, "svar");
  assert.equal(spelade.at(-1)!.kalla, "las_upp");
  assert.ok(rost.some((r) => r.satt === "avbruten" && r.text === "Följ med"));
  rostKo.lasUpp("En gåta");
  assert.equal(spelade.filter((s) => s.text === "En gåta").length, 2);
});

test("P4a: lasUpp startar även om kön inte öppnats", () => {
  const { spelade } = rigg();
  rostKo.lasUpp("En gåta");
  assert.equal(spelade.length, 1);
  assert.equal(spelade[0]!.klass, "svar");
  assert.equal(spelade[0]!.kalla, "las_upp");
});

test("P4a: sattRost tystar uppläsning utan att stänga av effekter", () => {
  const { spelade } = rigg();
  useMinne.getState().sattRost(false);
  assert.equal(useMinne.getState().rostPa, false);
  assert.equal(useMinne.getState().effektPa, true);
  assert.equal(useMinne.getState().ljudPa, true);
  rostKo.lasUpp("En gåta");
  assert.equal(spelade.length, 0);
});

test("P4a: sattEffekt tystar ljudeffekter utan att stänga av rösten", () => {
  useMinne.getState().sattEffekt(false);
  ljud.satt(false);
  assert.equal(useMinne.getState().effektPa, false);
  assert.equal(useMinne.getState().rostPa, true);
  assert.equal(ljud.effektPa(), false);
  const { spelade } = rigg();
  rostKo.lasUpp("En gåta");
  assert.equal(spelade.length, 1);
  assert.equal(spelade[0]!.kalla, "las_upp");
});

test("P4a: sattLjud styr röst och effekter tillsammans", () => {
  useMinne.getState().sattLjud(false);
  assert.equal(useMinne.getState().ljudPa, false);
  assert.equal(useMinne.getState().rostPa, false);
  assert.equal(useMinne.getState().effektPa, false);
  useMinne.getState().sattLjud(true);
  assert.equal(useMinne.getState().ljudPa, true);
  assert.equal(useMinne.getState().rostPa, true);
  assert.equal(useMinne.getState().effektPa, true);
});

test("P4a: äldre sparning utan rostPa ärver ljudPa", () => {
  const d = franSparning({ version: 2, ljudPa: false });
  assert.equal(d.ljudPa, false);
  assert.equal(d.rostPa, false);
  assert.equal(d.effektPa, false);
  const delad = franSparning({ version: 2, ljudPa: true, rostPa: false });
  assert.equal(delad.rostPa, false);
  assert.equal(delad.effektPa, true);
  const intro = franSparning({ introSedd: true });
  assert.equal(intro.introSedd, true);
  assert.equal(intro.rostPa, true);
});

test("P4a: Lyssna- och ljudknapparna finns som data-p4", () => {
  const ui = ["Ledtradsyta.tsx", "UppdragsRemsa.tsx", "BokSvar.tsx", "ForalderDialog.tsx"]
    .map((fil) => fs.readFileSync(`src/spel/ui/${fil}`, "utf8"))
    .join("\n");
  for (const attr of ["lyssna-gata", "lyssna-uppdrag", "lyssna-onska", "lyssna-forslag", "rost-knapp", "effekt-knapp"]) {
    assert.ok(ui.includes(`data-p4="${attr}"`), attr);
  }
});
