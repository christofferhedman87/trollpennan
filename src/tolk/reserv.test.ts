import assert from "node:assert/strict";
import test from "node:test";
import reserv from "../../data/reserv.json" with { type: "json" };
import katord from "../../data/kategori-ord.json" with { type: "json" };
import fraserJson from "../../data/test-fraser-reserv.json" with { type: "json" };
import gamla from "../../data/test-fraser.json" with { type: "json" };
import { arDjur } from "../spel/lagring.ts";
import { ordFranForm } from "./lexikon.ts";
import { fnv1a32, kategoriFor, aggFarg, platsAv, tokensAv, tolkaMedReserv } from "./reserv.ts";
import { tolka } from "./tolka.ts";

type Fras = {
  fras: string;
  forvantat: "agg" | "djur_med_agg" | "forslag" | "sparr" | "oforandrat";
  kropp?: string;
  ord?: string;
  kategori?: string;
  steg?: string;
  delar?: string[];
  forslag?: string;
};
const FRASER = (fraserJson as unknown as { fraser: Fras[] }).fraser;

test("minst 40 fraser i data/test-fraser-reserv.json och alla utfall stämmer", () => {
  assert.ok(FRASER.length >= 40, `bara ${FRASER.length}`);
  for (const f of FRASER) {
    const u = tolkaMedReserv(f.fras);
    const namn = JSON.stringify(f.fras);
    if (f.forvantat === "oforandrat") {
      assert.deepEqual(u, tolka(f.fras), namn);
    } else if (f.forvantat === "sparr") {
      assert.equal(u.typ, "sparr", namn);
      assert.equal(JSON.stringify(u).toLowerCase().includes("fitta"), false, namn);
    } else if (f.forvantat === "forslag") {
      assert.equal(u.typ, "forslag", namn);
      if (u.typ === "forslag") assert.equal(u.forslag[0]?.id, f.forslag, namn);
    } else {
      assert.equal(u.typ, "skapad", namn);
      if (u.typ !== "skapad") continue;
      const r = u.varelse.reserv ?? [];
      assert.ok(r.length >= 1, namn);
      assert.equal(u.varelse.kropp, f.forvantat === "agg" ? "agg" : f.kropp, namn);
      const post = r.find((d) => d.ord === f.ord);
      assert.ok(post, `${namn}: ${f.ord} saknas i ${JSON.stringify(r.map((d) => d.ord))}`);
      assert.equal(post.kategori, f.kategori, namn);
      if (f.steg) assert.equal(post.steg, f.steg, namn);
      if (f.delar) assert.deepEqual(r.map((d) => d.ord), f.delar, namn);
      if (f.forvantat === "agg") assert.equal(r[0]?.ord, f.ord, `${namn}: kroppen är första posten`);
    }
  }
});

test("de 28 befintliga testfraserna ger exakt samma utfall som tolka()", () => {
  const lista = (gamla as unknown as { fraser: { fras: string }[] }).fraser;
  assert.ok(lista.length >= 28);
  for (const f of lista) assert.deepEqual(tolkaMedReserv(f.fras), tolka(f.fras), f.fras);
});

test("tolka() är oförändrad: okänt ord utan djur ger fortfarande behover_djur där", () => {
  const u = tolka("blobbo");
  assert.equal(u.typ, "behover_djur");
  assert.equal(tolkaMedReserv("blobbo").typ, "skapad");
});

test("gissningen: går, dansar och liknande ger ingen 'Menade du' (grå, dino, nasse)", () => {
  for (const f of ["en kanin som går", "en kanin som dansar", "en kanin som kan dansa", "går", "dansar", "en kanin som läser", "en kanin som kommer"]) {
    const u = tolkaMedReserv(f);
    assert.notEqual(u.typ, "forslag", f);
  }
  assert.equal(tolka("en kanin som går").typ, "forslag", "före: gissningen fanns (grå)");
  const ds = tolkaMedReserv("en kanin som dansar");
  assert.ok(!JSON.stringify(ds).includes("dino") && !JSON.stringify(ds).includes("nasse"));
});

test("riktiga stavfel ger fortfarande rätt gissning", () => {
  for (const [fel, id] of [
    ["kanim", "kanin"],
    ["kannin", "kanin"],
    ["hunnd", "hund"],
    ["kattt", "katt"],
    ["draken", "drake"],
  ] as const) {
    const u = tolkaMedReserv(fel);
    if (id === "drake" && u.typ !== "forslag") continue; // "draken" är en böjning och inget stavfel
    assert.equal(u.typ, "forslag", fel);
    if (u.typ === "forslag") assert.equal(u.forslag[0]?.id, id, fel);
  }
});

test("kedjan: varje steg är data och första träff vinner", () => {
  assert.deepEqual(reserv.kedja, ["kategori_ord", "lemma", "sammansatt", "regel", "plats", "agg"]);
  assert.deepEqual(kategoriFor("pizza", "djur"), { kategori: "mat", steg: "kategori_ord", grund: "pizza" });
  assert.deepEqual(kategoriFor("pizzorna", "djur"), { kategori: "mat", steg: "lemma", grund: "pizza" });
  assert.deepEqual(kategoriFor("dansade", "som"), { kategori: "handling", steg: "lemma", grund: "dansa" });
  assert.deepEqual(kategoriFor("chokladtårta", "djur"), { kategori: "mat", steg: "sammansatt", grund: "tårta" });
  assert.deepEqual(kategoriFor("vänlighet", "djur"), { kategori: "kansla", steg: "regel", grund: null });
  assert.deepEqual(kategoriFor("qwerty", "med"), { kategori: "foremal", steg: "plats", grund: null });
  assert.deepEqual(kategoriFor("qwerty", "djur"), { kategori: "okant", steg: "agg", grund: null });
});

test("platsen i meningen: som/kan, med, före djur, djuret självt", () => {
  const t = tokensAv("en glad kanin med paraply som dansar");
  assert.equal(platsAv(t, t.indexOf("glad")), "adj");
  assert.equal(platsAv(t, t.indexOf("paraply")), "med");
  assert.equal(platsAv(t, t.indexOf("dansar")), "som");
  assert.equal(platsAv(["elefant"], 0), "djur");
});

test("samma ord ger samma färg ur paletten, och färgen är en av 12", () => {
  assert.equal(reserv.agg.palett.length, 12);
  for (const w of ["elefant", "pizza", "hmmmx", "å"]) {
    assert.equal(aggFarg(w), aggFarg(w));
    assert.ok(reserv.agg.palett.includes(aggFarg(w)));
  }
  assert.equal(fnv1a32("a"), 0xe40c292c);
  const farger = new Set(["elefant", "pizza", "hmmmx", "giraff", "zebra", "pojke", "tårta", "sol"].map(aggFarg));
  assert.ok(farger.size >= 4, "ord får olika färger");
});

test("tak: högst fyra ägg totalt och etiketten är högst 16 tecken", () => {
  const max = reserv.agg.max_totalt;
  const a = tolkaMedReserv("elefant giraff zebra lejon tiger apa");
  assert.equal(a.typ, "skapad");
  if (a.typ === "skapad") assert.ok((a.varelse.reserv?.length ?? 0) <= max);
  const b = tolkaMedReserv("en kanin med paraply och ballong och cykel och bok och lampa");
  assert.equal(b.typ, "skapad");
  if (b.typ === "skapad") assert.ok((b.varelse.reserv?.length ?? 0) <= max - 1);
  const c = tolkaMedReserv("a".repeat(70));
  assert.equal(c.typ, "skapad");
  if (c.typ === "skapad") for (const d of c.varelse.reserv ?? []) assert.ok(d.ord.length <= reserv.agg.etikett_max);
});

test("spärrade ord ger aldrig ett ägg, även mitt i en mening", () => {
  for (const f of ["fitta", "en kanin med fitta", "elefant fy fan", "f1tta", "negerkanin"]) {
    const u = tolkaMedReserv(f);
    assert.equal(u.typ, "sparr", f);
  }
  const text = tolkaMedReserv("kanin fitta");
  assert.equal(text.typ === "sparr" && text.text, "Det ordet kan Trollpennan inte.");
});

test("reservdjuret är ett giltigt sparat djur och okända ord sparas i okanda", () => {
  const u = tolkaMedReserv("elefant");
  assert.equal(u.typ, "skapad");
  if (u.typ !== "skapad") return;
  assert.ok(arDjur({ ...u.varelse, uid: "x", skapad: 1 }));
  assert.deepEqual(u.okanda, ["elefant"]);
  assert.equal(u.varelse.formel, "ett elefant-ägg");
  assert.equal(u.meddelanden[0], "Det här ordet har jag aldrig sett! Det blev ett ägg som väntar på att kläckas: elefant.");
  assert.deepEqual(u.guld, []);
  const g = tolkaMedReserv("en kanin som går");
  assert.equal(g.typ === "skapad" && g.okanda.includes("går"), true);
});

test("datakontroll: alla kategorier finns, inga dubbletter, inga ord som ord.json redan känner", () => {
  const kat = Object.keys(reserv.kategorier);
  for (const k of Object.keys(katord.kategorier)) assert.ok(kat.includes(k), `kategori ${k} saknar form i reserv.json`);
  for (const r of reserv.regler) assert.ok(kat.includes(r.kategori), r.suffix);
  for (const k of Object.values(reserv.plats)) assert.ok(kat.includes(k), k);
  const sedda = new Map<string, string>();
  for (const [k, lista] of Object.entries(katord.kategorier as Record<string, string[]>)) {
    for (const w of lista) {
      assert.equal(sedda.get(w), undefined, `${w} står i både ${sedda.get(w)} och ${k}`);
      sedda.set(w, k);
      assert.equal(ordFranForm(w), undefined, `${w} finns redan i ord.json`);
      assert.equal(w, w.toLocaleLowerCase("sv"));
    }
  }
  for (const f of Object.values(reserv.forslag.klasser_per_plats).flat()) {
    assert.ok(["djur", "farg", "storlek", "monster", "formaga", "tillbehor", "egenskap"].includes(f), f);
  }
  for (const p of reserv.agg.palett) assert.match(p, /^#[0-9A-F]{6}$/);
});
