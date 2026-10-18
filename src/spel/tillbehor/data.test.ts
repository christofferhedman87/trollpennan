import assert from "node:assert/strict";
import test from "node:test";
import ordJson from "../../../data/ord.json" with { type: "json" };
import {
  ANKARNAMN,
  FORMER,
  KROPPAR,
  TILLBEHOR,
  forskjutning,
  kontrolleraTillbehor,
  skalaVarde,
  tillbehorDelar,
  tillbehorFarg,
  tillbehorRad,
} from "./data.ts";

const GLB_KROPPAR = ["kanin", "katt", "hund", "fisk", "fågel", "uggla", "groda", "drake", "häst"];
const orden = (ordJson as { ord: { klass?: string; del?: { tillbehor?: string } }[] }).ord;
const ordIds = [...new Set(orden.filter((o) => o.klass === "tillbehor" && o.del?.tillbehor).map((o) => o.del!.tillbehor!))];

test("datan är hel och varje tillbehör i ord.json har en rad", () => {
  assert.deepEqual(kontrolleraTillbehor(ordIds), []);
  assert.ok(ordIds.length >= 8, "ord.json ska ha minst de åtta kända tillbehören");
});

test("alla nio GLB-djur har en modellrad och alla kroppar har mesh-ankare", () => {
  for (const k of GLB_KROPPAR) assert.ok(KROPPAR[k]?.modell, `${k}: modell saknas`);
  for (const [k, r] of Object.entries(KROPPAR)) for (const n of ANKARNAMN) assert.equal((r.mesh[n] as number[] | undefined)?.length, 3, `${k}.${n}`);
});

test("framAxel är valfri: saknas den gäller +z, och om den finns är den giltig", () => {
  for (const [k, r] of Object.entries(KROPPAR)) {
    const f = r.modell?.framAxel ?? r.framAxel;
    if (f !== undefined) assert.ok(["+z", "-z", "+x", "-x"].includes(f), k);
  }
});

test("skala och förskjutning räknar som gamla skalaFor och platsFor", () => {
  // krona på ett generiskt djur (b 0,72, h 1,2): max(0,28; min(0,72·1,15; 1,2·0,55)) · 1,6 = 0,66 · 1,6
  assert.ok(Math.abs(skalaVarde(TILLBEHOR["krona"]!.skala, 0.72, 1.2) - 1.056) < 1e-9);
  // glasögon: max(0,34·b; min(1,35·b; 0,72·h)) · 0,8 = 0,864 · 0,8
  assert.ok(Math.abs(skalaVarde(TILLBEHOR["glasögon"]!.skala, 0.72, 1.2) - 0.6912) < 1e-9);
  // rosettens sida på GLB: max(0,04; 0,46·b)
  assert.ok(Math.abs(forskjutning(TILLBEHOR["rosett"]!.plats.ut, 0.9, 1) - 0.414) < 1e-9);
  assert.equal(forskjutning(undefined, 1, 1), 0);
  assert.ok(forskjutning(TILLBEHOR["mantel"]!.plats.fram, 0.1, 1) === -0.04, "mantelns steg bakåt har golvet 0,04 och är negativt (−z)");
});

test("overstyr per djur ersätter faktor och plats men inte resten", () => {
  assert.equal(tillbehorRad("krona", "ekorre")!.skala.faktor, 1.12);
  assert.equal(tillbehorRad("krona", "katt")!.skala.faktor, 1.6);
  assert.equal(tillbehorRad("horn", "haj")!.plats.ankare, "huvudTopp");
  assert.equal(tillbehorRad("mantel", "drake")!.plats.mot?.ankare, "rygg");
  assert.equal(tillbehorRad("saknas", "katt"), null);
  assert.equal(tillbehorRad("krona", "okandkropp")!.skala.faktor, 1.6, "okänd kropp ger grundraden");
});

test("färg: karta, standard och variant", () => {
  const krona = TILLBEHOR["krona"]!;
  assert.equal(tillbehorFarg(krona, "#FFC107"), "#F2B632");
  assert.equal(tillbehorFarg(krona, null), "#F2B632");
  assert.equal(tillbehorFarg(krona, "#123456"), "#123456");
  const hatt = TILLBEHOR["hatt"]!;
  assert.equal(tillbehorDelar(hatt, "#5E35B1").length, 2);
  assert.notEqual(tillbehorDelar(hatt, "#5E35B1"), hatt.delar);
  assert.equal(tillbehorDelar(hatt, null), hatt.delar);
  for (const f of ["cyl", "kon", "ring", "kub", "sfar", "mantel"]) assert.ok((FORMER as readonly string[]).includes(f));
});

test("ett nytt tillbehör är bara data: en rad syns för alla kroppar utan kodändring", () => {
  const mossa = structuredClone(TILLBEHOR["hatt"]!);
  TILLBEHOR["mössa"] = mossa;
  try {
    assert.deepEqual(kontrolleraTillbehor([...ordIds, "mössa"]), []);
    for (const k of Object.keys(KROPPAR)) assert.ok(tillbehorRad("mössa", k), k);
  } finally {
    delete TILLBEHOR["mössa"];
  }
  assert.ok(kontrolleraTillbehor(["mössa"]).length > 0, "saknad rad ska ge fel");
});

test("kontrollen hittar trasig data", () => {
  const rad = TILLBEHOR["krona"]!;
  const gammal = rad.plats.ankare;
  rad.plats.ankare = "nacke";
  try {
    assert.ok(kontrolleraTillbehor(ordIds).some((f) => f.includes("okänt ankare nacke")));
  } finally {
    rad.plats.ankare = gammal;
  }
  assert.deepEqual(kontrolleraTillbehor(ordIds), []);
});
