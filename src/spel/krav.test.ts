import assert from "node:assert/strict";
import { test } from "node:test";
import prov from "../../data/test-uppdragssvar.json" with { type: "json" };
import blocklist from "../../data/blocklist.json" with { type: "json" };
import { SKRIV } from "./aventyr.ts";
import { betydelseFranText } from "./betydelse.ts";
import { bedomKrav, type KravGrupp } from "./krav.ts";
import { bedomUppdragsSvar, kravUppfylltTolkat } from "./uppdragsmotor.ts";
import { kvittotack } from "./skapa/tack.ts";
import { hamtaUppdragsSvar, noteraUppdragsSvar, tystaBannrar, type UppdragsSvar } from "./skapa/kvitto.ts";
import { ONSK } from "./onska.ts";
import type { OnskaSpar } from "./minne.ts";

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
  const storlek = SKRIV.find((u) => u.id === "stor-och-liten")!.krav!;
  assert.deepEqual(bedomUppdragsSvar(storlek, "två små dinosaurier").saknas, ["en stor vän"]);
  assert.deepEqual(bedomUppdragsSvar(krav, "två röda katter").saknas, ["en blå vän"]);
});

test("T05: kvittot visar det faktiska försöket och bevarar önsketackets prioritet", () => {
  const svar: UppdragsSvar = { id: "tva-farger", resultat: "fel", nastan: SKRIV.find((u) => u.id === "tva-farger")!.nastan! };
  assert.equal(kvittotack(null, null, svar), svar.nastan);
  assert.equal(kvittotack(null, null, { ...svar, resultat: "klar" }), null);
  const onskan = { id: ONSK.onskningar[0]!.id, uid: "prov", kalla: "djur", typ: ONSK.onskningar[0]!.typ, text: ONSK.onskningar[0]!.text } as OnskaSpar;
  assert.equal(kvittotack(onskan, null, svar), ONSK.onskningar[0]!.tack);
  assert.equal(kvittotack(onskan, onskan, null), null, "en obesvarad ge-önskan får inte en annan pågående quests ledtråd");
});

test("T05: bara den pågående Trolla-handlingens verkliga bedömning följer med", () => {
  const svar: UppdragsSvar = { id: "tva-farger", resultat: "fel", nastan: "prov" };
  tystaBannrar(true); noteraUppdragsSvar(svar); tystaBannrar(false);
  assert.equal(hamtaUppdragsSvar(), svar);
  tystaBannrar(true); tystaBannrar(false);
  assert.equal(hamtaUppdragsSvar(), null, "nästa handling kan vara en önskan utan uppdragsförsök");
  noteraUppdragsSvar(svar);
  assert.equal(hamtaUppdragsSvar(), null, "direktanrop utanför Trolla får inte lämna ett gammalt kvittosvar");
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


test("T08: betydelsekontrollen räknar tillbehörens antal på varje huvuddjur", () => {
  const grupp: KravGrupp = { id: "apple", nagon_av: ["ord:äpple"], subjekt: "sak", beskrivning: "ett äpple" };
  assert.equal(bedomKrav({ grupper: [], olika: [grupp, grupp] }, betydelseFranText("en katt med två äpplen")).ok, true);
  assert.equal(bedomKrav({ grupper: [], olika: [grupp, grupp] }, betydelseFranText("en katt med ett äpple")).ok, false);
  assert.equal(bedomKrav({ grupper: [], olika: [grupp, grupp, grupp, grupp] }, betydelseFranText("två katter med två äpplen")).ok, true);
});

test("T08: två föremål som delar modell behåller sin egen temperatur", () => {
  const krav = SKRIV.find((u) => u.id === "varmt-och-kallt")!.krav!;
  assert.equal(bedomUppdragsSvar(krav, "en katt med varm filt och kall filt").ok, true);
  assert.equal(bedomUppdragsSvar(krav, "en varm filt med en kall filt").ok, true);
  assert.equal(bedomUppdragsSvar(krav, "en katt med två kalla filtar").ok, false);
});
