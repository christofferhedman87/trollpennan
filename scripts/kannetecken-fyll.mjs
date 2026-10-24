#!/usr/bin/env node
// O1b: fyller data/kannetecken.json. En rad per djur i data/ord.json.
// De 50 i rundor/O1-ordtolk/matt/vanligaste-50.txt plus enhörning, zebra och noshörning kureras här.
// Övriga djur (även mullvad) får en tom rad. Körs om utan att ändra något.
//
//   node scripts/kannetecken-fyll.mjs           skriv filen
//   node scripts/kannetecken-fyll.mjs --check   validera, skriv inte
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORD_FIL = path.join(rot, "data", "ord.json");
const UT_FIL = path.join(rot, "data", "kannetecken.json");
const LISTA_FIL = path.join(rot, "rundor", "O1-ordtolk", "matt", "vanligaste-50.txt");

/** @typedef {{ farg: string | null, monster: string | null, monsterfarg: string | null, tillbehor: string[], formagor: string[], beskrivning: string | null }} Rad */

const TOM = { farg: null, monster: null, monsterfarg: null, tillbehor: [], formagor: [], beskrivning: null };

/** @param {Partial<Rad> & { beskrivning: string }} over @returns {Rad} */
function rad(over) {
  return {
    farg: over.farg ?? null,
    monster: over.monster ?? null,
    monsterfarg: over.monsterfarg ?? null,
    tillbehor: over.tillbehor ?? [],
    formagor: over.formagor ?? [],
    beskrivning: over.beskrivning,
  };
}

/** Kännetecken ett barn känner igen. Fågel, drake och fisk lånar bara ut förmågan (ingen färg), så gamla sammansättningar behåller utseendet. */
const KURERAT = {
  orm: rad({ farg: "#43A047", beskrivning: "ormens gröna färg" }),
  katt: rad({ farg: "#64B5F6", beskrivning: "kattens blå färg" }),
  hund: rad({ farg: "#FFD54F", beskrivning: "hundens gula färg" }),
  häst: rad({ farg: "#8D6E63", beskrivning: "hästens bruna färg" }),
  fisk: rad({ formagor: ["fenor"], beskrivning: "fiskens fenor" }),
  varg: rad({ farg: "#9E9E9E", beskrivning: "vargens grå färg" }),
  get: rad({ tillbehor: ["horn"], beskrivning: "getens horn" }),
  fågel: rad({ formagor: ["vingar"], beskrivning: "fågelns vingar" }),
  gris: rad({ farg: "#F8BBD0", beskrivning: "grisens rosa färg" }),
  ko: rad({ farg: "#FAFAFA", monster: "prickar", monsterfarg: "#2B2B2B", beskrivning: "kons prickar och vita färg" }),
  björn: rad({ farg: "#8D6E63", beskrivning: "björnens bruna färg" }),
  anka: rad({ formagor: ["vingar"], beskrivning: "ankans vingar" }),
  apa: rad({ farg: "#8D6E63", beskrivning: "apans bruna färg" }),
  får: rad({ farg: "#FAFAFA", beskrivning: "fårets vita färg" }),
  mask: rad({ farg: "#F48FB1", beskrivning: "maskens rosa färg" }),
  valp: rad({ farg: "#FFD54F", beskrivning: "valpens gula färg" }),
  älg: rad({ tillbehor: ["horn"], beskrivning: "älgens horn" }),
  kyckling: rad({ farg: "#FDD835", beskrivning: "kycklingens gula färg" }),
  råtta: rad({ farg: "#9E9E9E", beskrivning: "råttans grå färg" }),
  fluga: rad({ formagor: ["vingar"], beskrivning: "flugans vingar" }),
  mus: rad({ farg: "#9E9E9E", beskrivning: "musens grå färg" }),
  lamm: rad({ farg: "#FAFAFA", beskrivning: "lammets vita färg" }),
  lejon: rad({ farg: "#FFC107", beskrivning: "lejonets gula färg" }),
  elefant: rad({ farg: "#9E9E9E", beskrivning: "elefantens grå färg" }),
  myra: rad({ farg: "#2B2B2B", beskrivning: "myrans svarta färg" }),
  groda: rad({ farg: "#8BC34A", beskrivning: "grodans gröna färg" }),
  tiger: rad({ farg: "#FB8C00", monster: "ränder", monsterfarg: "#2B2B2B", beskrivning: "tigerns ränder och orange färg" }),
  räv: rad({ farg: "#FB8C00", beskrivning: "rävens orange färg" }),
  kanin: rad({ farg: "#F48FB1", beskrivning: "kaninens rosa färg" }),
  drake: rad({ formagor: ["vingar"], beskrivning: "drakens vingar" }),
  höna: rad({ farg: "#8D6E63", beskrivning: "hönans bruna färg" }),
  fjäril: rad({ formagor: ["vingar"], beskrivning: "fjärilens vingar" }),
  duva: rad({ formagor: ["vingar"], beskrivning: "duvans vingar" }),
  åsna: rad({ farg: "#9E9E9E", beskrivning: "åsnans grå färg" }),
  tjur: rad({ tillbehor: ["horn"], beskrivning: "tjurens horn" }),
  spindel: rad({ farg: "#2B2B2B", beskrivning: "spindelns svarta färg" }),
  kamel: rad({ farg: "#C27138", beskrivning: "kamelens bruna färg" }),
  rådjur: rad({ tillbehor: ["horn"], beskrivning: "rådjurets horn" }),
  kräfta: rad({ farg: "#E53935", beskrivning: "kräftans röda färg" }),
  bi: rad({ formagor: ["vingar"], beskrivning: "biets vingar" }),
  hare: rad({ farg: "#8D6E63", beskrivning: "harens bruna färg" }),
  gås: rad({ formagor: ["vingar"], beskrivning: "gåsens vingar" }),
  hjort: rad({ tillbehor: ["horn"], beskrivning: "hjortens horn" }),
  örn: rad({ formagor: ["vingar"], beskrivning: "örnens vingar" }),
  vildsvin: rad({ farg: "#8D6E63", beskrivning: "vildsvinets bruna färg" }),
  ponny: rad({ farg: "#8D6E63", beskrivning: "ponnyns bruna färg" }),
  geting: rad({ farg: "#FDD835", monster: "ränder", monsterfarg: "#2B2B2B", beskrivning: "getingens ränder och gula färg" }),
  krabba: rad({ farg: "#E53935", beskrivning: "krabbans röda färg" }),
  oxe: rad({ tillbehor: ["horn"], beskrivning: "oxens horn" }),
  syrsa: rad({ farg: "#43A047", beskrivning: "syrsans gröna färg" }),
  enhörning: rad({ farg: "#FAFAFA", tillbehor: ["horn"], beskrivning: "enhörningens horn och vita färg" }),
  zebra: rad({ monster: "ränder", monsterfarg: "#2B2B2B", beskrivning: "zebrans ränder" }),
  noshörning: rad({ farg: "#9E9E9E", tillbehor: ["horn"], beskrivning: "noshörningens horn" }),
};

function lasOrd() {
  return JSON.parse(fs.readFileSync(ORD_FIL, "utf8"));
}

function kureradeId() {
  const rader = fs
    .readFileSync(LISTA_FIL, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  return [...new Set([...rader, "enhörning", "zebra", "noshörning"])];
}

function bygg() {
  const ord = lasOrd();
  /** @type {Record<string, Rad>} */
  const djur = {};
  for (const o of ord.ord) {
    if (o.klass !== "djur") continue;
    djur[o.id] = KURERAT[o.id] ? rad(KURERAT[o.id]) : { ...TOM, tillbehor: [], formagor: [] };
  }
  return {
    version: 1,
    _om: "O1b: vad ett djur lånar ut när det blandas in i ett annat. Fylls av scripts/kannetecken-fyll.mjs. Kurerat för vanligaste-50.txt plus enhörning, zebra och noshörning. Övriga djur, mullvad inräknad, har tom rad.",
    djur,
  };
}

function textAv(doc) {
  return JSON.stringify(doc, null, 1) + "\n";
}

/** @param {Rad | undefined} k */
function harKanne(k) {
  if (!k) return false;
  return !!k.farg || !!k.monster || (k.tillbehor?.length ?? 0) > 0 || (k.formagor?.length ?? 0) > 0;
}

function validera() {
  const ord = lasOrd();
  const fel = [];
  if (!fs.existsSync(UT_FIL)) fel.push("data/kannetecken.json saknas");
  const tab = fel.length ? { djur: {} } : JSON.parse(fs.readFileSync(UT_FIL, "utf8"));
  const rader = tab.djur ?? {};
  const djur = ord.ord.filter((o) => o.klass === "djur");
  const tillbehor = new Set(ord.ord.filter((o) => o.klass === "tillbehor").map((o) => o.id));
  const finns = new Set(ord.ord.map((o) => o.id));
  for (const o of ord.ord) {
    if (o.del?.monster) finns.add(o.del.monster);
    if (o.del?.formaga) finns.add(o.del.formaga);
  }
  for (const o of djur) {
    if (!rader[o.id]) fel.push(`saknar rad: ${o.id}`);
  }
  for (const [id, k] of Object.entries(rader)) {
    for (const tb of k.tillbehor ?? []) {
      if (!tillbehor.has(tb)) fel.push(`${id}: tillbehör ${tb} finns inte`);
    }
    if (k.monster && !finns.has(k.monster)) fel.push(`${id}: mönster ${k.monster} finns inte`);
    for (const fm of k.formagor ?? []) {
      if (!finns.has(fm)) fel.push(`${id}: förmåga ${fm} finns inte`);
    }
  }
  const kur = kureradeId();
  if (kur.length !== 53) fel.push(`kureringslistan har ${kur.length} id, väntat 53`);
  for (const id of kur) {
    const k = rader[id];
    if (!k) {
      fel.push(`kurerad saknas: ${id}`);
      continue;
    }
    if (!k.beskrivning) fel.push(`${id}: saknar beskrivning`);
    if (!harKanne(k)) fel.push(`${id}: saknar kännetecken`);
  }
  const extra = Object.keys(KURERAT).filter((id) => !kur.includes(id));
  if (extra.length) fel.push(`kurerat utanför listan: ${extra.join(", ")}`);
  const saknadeKur = kur.filter((id) => !KURERAT[id]);
  if (saknadeKur.length) fel.push(`listan saknar kurering: ${saknadeKur.join(", ")}`);
  return fel;
}

const check = process.argv.includes("--check");
if (check) {
  const fel = validera();
  if (fel.length) {
    for (const f of fel) console.error(f);
    process.exit(1);
  }
  console.log("kannetecken ok");
} else {
  const doc = bygg();
  const text = textAv(doc);
  const fore = fs.existsSync(UT_FIL) ? fs.readFileSync(UT_FIL, "utf8") : "";
  if (fore !== text) fs.writeFileSync(UT_FIL, text);
  const fel = validera();
  if (fel.length) {
    for (const f of fel) console.error(f);
    process.exit(1);
  }
  console.log(`skrev ${Object.keys(doc.djur).length} djur`);
}
