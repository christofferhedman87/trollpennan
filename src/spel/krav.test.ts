import assert from "node:assert/strict";
import { test } from "node:test";
import prov from "../../data/test-uppdragssvar.json" with { type: "json" };
import blocklist from "../../data/blocklist.json" with { type: "json" };
import { SKRIV } from "./aventyr.ts";
import { betydelseFranText } from "./betydelse.ts";
import { bedomKrav, type KravGrupp } from "./krav.ts";
import { bedomUppdragsSvar, kravUppfylltTolkat } from "./uppdragsmotor.ts";

test("T05: varje migrerat uppdrag har minst tre ja och två nej genom spelets riktiga tolk", () => {
  const migrerade = SKRIV.filter((u) => u.krav?.betydelse);
  assert.equal(migrerade.length, Object.keys(prov.uppdrag).length, "inget migrerat uppdrag får sakna svarsprov");
  for (const u of migrerade) {
    const p = (prov.uppdrag as Record<string, { ja: string[]; nej: string[] }>)[u.id]!;
    assert.ok(new Set(p.ja).size >= 3 && new Set(p.nej).size >= 2, u.id);
    assert.ok(u.hjalp && u.hjalp.length >= 2 && u.nastan, u.id);
    for (const [ok, fraser] of [[true, [...p.ja, ...u.hjalp!, ...u.val!.grupper.flatMap((g) => g.forslag.map((f) => f.fras))]], [false, p.nej]] as const) {
      for (const fras of fraser) assert.equal(bedomUppdragsSvar(u.krav!, fras).ok, ok, `${u.id}: ${fras}`);
    }
  }
});

test("T05: olika individer, antal och kroppsfärg binds till sina verkliga subjekt", () => {
  const krav = SKRIV.find((u) => u.id === "tva-farger")!.krav!;
  assert.equal(kravUppfylltTolkat(krav, "en röd katt", true), false);
  assert.equal(kravUppfylltTolkat(krav, "en röd katt och en blå hund", false), true, "rå boolesk djurflagga får inte ersätta faktisk tolkning");
  assert.equal(bedomUppdragsSvar(krav, "två röda katter med blå hattar").ok, false);
  const k: KravGrupp = { id: "rod", nagon_av: ["farg:röd"], subjekt: "djur", beskrivning: "en röd vän" };
  assert.equal(bedomKrav({ grupper: [], olika: [k, k], djur: 2 }, betydelseFranText("två röda katter")).ok, true);
  assert.equal(bedomKrav({ grupper: [], olika: [k, k], djur: 2 }, betydelseFranText("en röd katt")).ok, false);
});

test("T05: matchningen kan flytta ett tidigare val och lämnar tolkning och krav orörda", () => {
  const grupp = (id: string, nagon_av: string[]): KravGrupp => ({ id, nagon_av, subjekt: "djur", beskrivning: id });
  const krav = { grupper: [], olika: [grupp("valfri", ["a", "b"]), grupp("bara-a", ["a"])], djur: 2 };
  const fakta = [{ taggar: new Set(["a"]), djur: true, antal: 1 }, { taggar: new Set(["b"]), djur: true, antal: 1 }];
  const fore = JSON.stringify({ krav, fakta: fakta.map((s) => ({ ...s, taggar: [...s.taggar] })) });
  assert.equal(bedomKrav(krav, fakta).ok, true);
  assert.equal(JSON.stringify({ krav, fakta: fakta.map((s) => ({ ...s, taggar: [...s.taggar] })) }), fore);
  assert.equal(bedomKrav({ grupper: [grupp("bade", [])] }, fakta).ok, false, "tom alternativlista är inget verkligt krav");
});

test("T05: saknade krav kommer från data och spärrade/okända ord blir aldrig lösningar", () => {
  const u = SKRIV.find((u) => u.id === "vingar-i-luften")!;
  const r = bedomUppdragsSvar(u.krav!, "en hund");
  assert.equal(r.ok, false); assert.ok(r.saknas.includes("en vän som kan flyga"));
  assert.equal(bedomUppdragsSvar(u.krav!, "en blorf som lyser").ok, false);
  assert.equal(bedomUppdragsSvar(u.krav!, `en hund som flyger ${blocklist.ord[0]}`).ok, false);
  assert.equal(bedomUppdragsSvar(u.krav!, "").ok, false);
});

test("T05: torr betydelsebedömning ändrar aldrig lokal lagring, inte heller för blanddjur", () => {
  const gamla = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  let skrivningar = 0;
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: () => null, setItem: () => { skrivningar++; }, removeItem: () => { skrivningar++; } } });
  try {
    assert.ok(betydelseFranText("en hund som flyger").length);
    betydelseFranText("en blandning av katt och hund");
    assert.equal(skrivningar, 0);
  } finally {
    if (gamla) Object.defineProperty(globalThis, "localStorage", gamla);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});
