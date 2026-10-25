// P4b: läsnivåer, ledtrådstrappa och specifik stavningsåterkoppling.
import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import platserJson from "../../data/platser.json" with { type: "json" };
import { gatUrval } from "./gata.ts";
import { aktuellLasniva, delaStavelser, lasnivaUrval, ledtradsSteg, ordLasniva, stavningsFeedback, type Lasniva } from "./lasniva.ts";
import { franSparning, useMinne } from "./minne.ts";

const facit = JSON.parse(fs.readFileSync("rundor/P4-lasning-och-karta/facit-p4.json", "utf8")) as {
  p4b: {
    lasniva_exempel: Record<string, string[]>;
    auto_steg: { funna_antal: number; forvantad_niva: Lasniva }[];
    stavning_exempel: { skrivet: string; mal: string; typ: string; ratt_prefix: string }[];
  };
};

test("P4b: ordLasniva följer facit för alla 35 ord", () => {
  for (const [nivaStr, ordLista] of Object.entries(facit.p4b.lasniva_exempel)) {
    const forv = Number(nivaStr) as Lasniva;
    for (const ord of ordLista) assert.equal(ordLasniva(ord), forv, ord);
  }
  assert.equal(ordLasniva("  Ko "), 1);
  assert.equal(ordLasniva("lamm"), 2);
  assert.equal(ordLasniva("tjur"), 2);
});

test("P4b: aktuellLasniva följer trappan och manuellt val", () => {
  for (const s of facit.p4b.auto_steg) {
    const funna = Array.from({ length: s.funna_antal }, (_, i) => `d${i}`);
    assert.equal(aktuellLasniva(funna, "auto"), s.forvantad_niva, String(s.funna_antal));
  }
  assert.equal(aktuellLasniva({}, "auto"), 1);
  assert.equal(aktuellLasniva({ a: {}, b: {}, c: {} }, "auto"), 2);
  const atta: Record<string, unknown> = {};
  for (let i = 0; i < 8; i++) atta[`d${i}`] = { guld: false };
  assert.equal(aktuellLasniva(atta, "auto"), 3);
  assert.equal(aktuellLasniva(["bara-en"], 1), 1);
  assert.equal(aktuellLasniva([], 2), 2);
  assert.equal(aktuellLasniva(["a", "b", "c", "d", "e", "f", "g", "h", "i"], 3), 3);
});

test("P4b: lasnivaUrval håller nivån på alla fyra platser", () => {
  const ord = JSON.parse(fs.readFileSync("data/ord.json", "utf8")) as { ord: { id: string; klass: string; niva: string }[] };
  const led = JSON.parse(fs.readFileSync("data/ledtradar.json", "utf8")) as { ledtradar: Record<string, unknown> };
  const ids = ord.ord.filter((o) => o.klass === "djur" && o.niva === "fritt" && led.ledtradar[o.id]).map((o) => o.id);
  assert.ok(ids.length >= 35);
  for (const pid of ["ang", "skogen", "sjon", "grottan"]) {
    const plats = platserJson.platser.find((p) => p.id === pid);
    assert.ok(plats, pid);
    for (const niva of [1, 2, 3] as const) {
      const bas = gatUrval([...ids], plats.hemliga);
      const urval = lasnivaUrval(ids, plats.hemliga, niva);
      assert.ok(urval.length > 0, `${pid} nivå ${niva}`);
      for (const id of urval) assert.ok(bas.includes(id), id);
      const inom = bas.filter((id) => ordLasniva(id) <= niva);
      if (inom.length) {
        for (const id of urval) assert.ok(ordLasniva(id) <= niva, `${pid} ${id}`);
        const exakt = urval.filter((id) => ordLasniva(id) === niva).length;
        assert.deepEqual(urval.slice(0, exakt).map(ordLasniva), Array.from({ length: exakt }, () => niva));
      } else {
        assert.deepEqual(urval, bas);
      }
    }
  }
});

test("P4b: ledtradsSteg lämnar alltid minst ett streck", () => {
  for (const ord of ["kattunge", "räv", "ko"]) {
    for (const steg of [0, 1, 2] as const) {
      const info = ledtradsSteg(ord, steg);
      assert.ok(info, `${ord} ${steg}`);
      assert.ok(info.streck.includes("_"), info.streck);
      const delar = info.streck.split(" ");
      assert.equal(delar.length, ord.length);
      assert.ok(delar.some((d) => d === "_"));
      assert.ok(info.synliga < ord.length);
    }
  }
  const s0 = ledtradsSteg("kattunge", 0)!;
  const s1 = ledtradsSteg("kattunge", 1)!;
  const s2 = ledtradsSteg("kattunge", 2)!;
  assert.equal(s0.streck, "K A T T U N G E".split(" ").map((b, i) => (i < 1 ? b : "_")).join(" "));
  assert.equal(s0.extraText, null);
  assert.equal(s0.ljudText, null);
  assert.equal(s1.synliga, 2);
  assert.equal(s1.extraText, "Min mamma är en katt.");
  assert.equal(s1.ljudText, null);
  assert.equal(s2.synliga, 4);
  assert.equal(s2.streck, "K A T T _ _ _ _");
  assert.equal(s2.ljudText, "Lyssna på början: K – A – T – T.");
  assert.equal(ledtradsSteg("ko", 2)!.streck, "K _");
  assert.equal(ledtradsSteg("räv", 0)!.streck, "R _ _");
  const utan = ledtradsSteg("kisse", 1)!;
  assert.match(utan.extraText ?? "", /delar/);
  assert.equal(ledtradsSteg("", 0), null);
});

test("P4b: delaStavelser delar kring vokaler", () => {
  assert.deepEqual(delaStavelser("kapybara"), ["ka", "py", "ba", "ra"]);
  assert.deepEqual(delaStavelser("kattunge"), ["katt", "ung", "e"]);
  assert.deepEqual(delaStavelser("ko"), ["ko"]);
  assert.deepEqual(delaStavelser("bäver"), ["bä", "ver"]);
  assert.deepEqual(delaStavelser(""), []);
});

test("P4b: stavningsFeedback matchar facit", () => {
  for (const ex of facit.p4b.stavning_exempel) {
    const fb = stavningsFeedback(ex.skrivet, ex.mal);
    assert.ok(fb, ex.skrivet);
    assert.equal(fb.nara, true);
    assert.equal(fb.typ, ex.typ);
    assert.equal(fb.rattPrefix, ex.ratt_prefix);
    assert.ok(fb.tips.length > 0);
    assert.equal(fb.forklaring, fb.tips);
    assert.equal(fb.restenSkrivet, ex.skrivet.slice(fb.rattPrefix.length));
  }
  assert.equal(stavningsFeedback("katt", "katt"), null);
  assert.equal(stavningsFeedback("", "katt"), null);
  const allman = stavningsFeedback("kattx", "kattunge");
  assert.equal(allman, null);
  const nara = stavningsFeedback("kotte", "katt");
  assert.equal(nara?.typ, "allman");
  assert.equal(nara?.rattPrefix, "k");
});

test("P4b: sattLasniva sparas och läses tillbaka", () => {
  useMinne.getState().aterstall();
  assert.equal(useMinne.getState().lasnivaVal, "auto");
  useMinne.getState().sattLasniva(2);
  assert.equal(useMinne.getState().lasnivaVal, 2);
  useMinne.getState().sattLasniva(1);
  assert.equal(useMinne.getState().lasnivaVal, 1);
  useMinne.getState().sattLasniva("auto");
  assert.equal(useMinne.getState().lasnivaVal, "auto");
  assert.equal(franSparning({ version: 2, lasnivaVal: 3 }).lasnivaVal, 3);
  assert.equal(franSparning({ version: 2, lasnivaVal: "auto" }).lasnivaVal, "auto");
  assert.equal(franSparning({ version: 2, lasnivaVal: 9 }).lasnivaVal, "auto");
  assert.equal(franSparning({ version: 2 }).lasnivaVal, "auto");
  useMinne.getState().aterstall();
});
