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

test("B1: storleken gäller ett djur och uttrycklig storlek väger tyngre än art", () => {
  const liten = SKRIV.find((u) => u.id === "pytteliten-kompis")!.krav!;
  const stor = SKRIV.find((u) => u.id === "jattestor-van")!.krav!;
  for (const fras of ["en liten sten", "en hund med en liten mössa", "en liten röd mössa på en hund", "en liten varm mössa på en hund", "en stor myra"]) assert.equal(bedomUppdragsSvar(liten, fras).ok, false, fras);
  for (const fras of ["en stor sten", "en hund med en stor mössa", "en stor röd boll bredvid en hund", "en liten elefant", "en liten drake"]) assert.equal(bedomUppdragsSvar(stor, fras).ok, false, fras);
  for (const fras of ["en liten mus", "en pytteliten larv", "en liten myra", "en myra", "en loppa", "en liten dinosaurie", "en stor mössa på en liten hund"]) assert.equal(bedomUppdragsSvar(liten, fras).ok, true, fras);
  for (const fras of ["en stor elefant", "en jättestor drake", "en jättelik hund", "ett jättelikt lamm", "två jättelika katter", "en drake", "en stor giraff", "en elefant", "en blåval", "en stor myra", "en liten mössa på en stor hund"]) assert.equal(bedomUppdragsSvar(stor, fras).ok, true, fras);
});

test("B1: färg och storlek i Skogen, Sjön och Grottan gäller själva djuret", () => {
  const krav = (id: string) => SKRIV.find((u) => u.id === id)!.krav!;
  const nej: Record<string, string[]> = {
    "skog-rod-van": ["en röd boll bredvid en hund", "en hund med en röd mössa", "en räv"],
    "sjo-bla-van": ["en blå boll bredvid en anka", "en anka med en blå mössa", "en fisk"],
    "grotta-gul-van": ["en gul sten bredvid en mus", "en mus med en gul mössa", "en kyckling"],
    "skog-liten-van": ["en hund med en liten mössa", "en liten sten bredvid en hund", "en stor myra"],
    "grotta-liten-upptackare": ["en liten sten", "en hund med en liten mössa", "en stor mus"],
    "sjo-stor-simmare": ["en hund med en stor boll", "en stor sten bredvid en anka", "en liten blåval"],
  };
  for (const [id, fraser] of Object.entries(nej)) for (const fras of fraser) assert.equal(bedomUppdragsSvar(krav(id), fras).ok, false, `${id}: ${fras}`);
  // Christoffers godkända hjälpfraser ska alltid räcka (Textpaket 02).
  for (const u of SKRIV.filter((x) => x.id in nej)) {
    assert.equal(u.krav!.djur, true, `${u.id}: platsuppdrag kräver fortfarande ett djur`);
    for (const fras of u.hjalp ?? []) assert.equal(bedomUppdragsSvar(u.krav!, fras).ok, true, `${u.id}: ${fras}`);
  }
});

test("B1: två vänner på platserna – varsin storlek eller färg hör till varsitt djur", () => {
  const nej: Record<string, string[]> = {
    "skog-stor-och-liten": ["en stor sten och en liten kanin", "en stor räv med en liten mössa", "en stor liten räv"],
    "sjo-tva-storlekar": ["en stor båt och en liten fisk", "en stor fisk bredvid en liten sten", "en stor fisk"],
    "grotta-stor-och-liten": ["en stor sten och en liten mus", "en stor hund med en liten mössa", "en hund och en katt"],
    "sjo-tva-farger": ["en röd boll och en blå fisk", "en röd fisk med en blå mössa", "en röd och blå fisk"],
    "grotta-tva-farger": ["en grön sten och en gul mus", "en grön groda med en gul mössa", "en grön och gul katt"],
  };
  for (const u of SKRIV.filter((x) => x.id in nej)) {
    for (const fras of nej[u.id]!) assert.equal(bedomUppdragsSvar(u.krav!, fras).ok, false, `${u.id}: ${fras}`);
    // Christoffers godkända hjälpfraser och de befintliga idéerna ska alltid räcka.
    for (const fras of [...(u.hjalp ?? []), ...(u.val?.grupper ?? []).flatMap((g) => g.forslag.map((f) => f.fras))]) assert.equal(bedomUppdragsSvar(u.krav!, fras).ok, true, `${u.id}: ${fras}`);
  }
});

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

test("B1: kaninens värmeuppdrag söker varma kläder, inte eld eller kalla plagg", () => {
  const krav = SKRIV.find((u) => u.id === "kanin-fryser")!.krav!;
  for (const fras of ["en kanin med mössa", "en hund med halsduk", "en katt med tröja", "en kanin med en varm hatt", "en hund med varma stövlar"]) {
    assert.equal(bedomUppdragsSvar(krav, fras).ok, true, fras);
  }
  for (const fras of ["en kanin vid en lägereld", "en katt med en kall mössa", "en blå katt", "en kall mössa med en brasa", "en kanin på en mössa", "en kanin bredvid en mössa", "en mössa under en kanin", "en mössa bredvid en kanin", "en mössa under en blåkanin", "en mössa bredvid en blåkanin", "en mössa i en kanin", "en filt i en kanin", "en mössa i en blåkanin", "en mössa och en filt i en kanin", "en hatt och en mössa i en kanin", "en mössa och en boll i en kanin", "en mössa, en filt och en boll i en kanin", "en mössa eller en filt i en kanin", "en mössa och en filt och en jacka i en kanin"]) {
    assert.equal(bedomUppdragsSvar(krav, fras).ok, false, fras);
  }
});

test("B1: färgade vänner kräver skriven kroppsfärg på ett djur", () => {
  for (const [id, ja, nej] of [
    ["vit-som-sno", ["en vit kanin", "ett vitt lamm", "en vit gås"], ["en kanin", "en vit boll", "en brun kanin med en vit hatt"]],
    ["rod-kompis", ["en röd drake", "en röd fisk", "en röd fågel"], ["en räv", "en röd boll", "en blå katt med en röd hatt"]],
    ["gron-kompis", ["en grön groda", "en grön drake", "en grön larv"], ["en groda", "en grön boll", "en blå katt med en grön hatt"]],
  ] as const) {
    const u = SKRIV.find((x) => x.id === id)!;
    for (const text of ja) assert.equal(bedomUppdragsSvar(u.krav!, text).ok, true, `${id}: ${text}`);
    for (const text of nej) assert.equal(bedomUppdragsSvar(u.krav!, text).ok, false, `${id}: ${text}`);
  }
});
