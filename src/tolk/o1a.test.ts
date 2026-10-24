// O1a: suffixregeln. Röda före regeln, gröna efter. Fraser och facit ändras inte här.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { tolkaMedReserv } from "./reserv.ts";
import fraser from "../../rundor/O1-ordtolk/provfraser-o1.json" with { type: "json" };

const rot = join(dirname(fileURLToPath(import.meta.url)), "../..");

type Fras = {
  fras: string;
  kropp?: string;
  inte_kropp?: string;
  agg?: number;
  antal?: number;
  ingen_replik?: string;
};

function lasUtfall(fras: string): {
  kropp: string | null;
  reserv: number;
  antal: number | null;
  meddelanden: string[];
} {
  const u = tolkaMedReserv(fras);
  if (u.typ === "skapad") {
    return {
      kropp: u.varelse.kropp,
      reserv: u.varelse.reserv?.length ?? 0,
      antal: u.antal,
      meddelanden: u.meddelanden,
    };
  }
  if (u.typ === "behover_djur") {
    return { kropp: null, reserv: 0, antal: null, meddelanden: u.meddelanden };
  }
  return { kropp: null, reserv: 0, antal: null, meddelanden: [] };
}

for (const rad of fraser.O1a as Fras[]) {
  test(`O1a fras: ${rad.fras}`, () => {
    const u = lasUtfall(rad.fras);
    if (rad.kropp != null) assert.equal(u.kropp, rad.kropp, rad.fras);
    if (rad.inte_kropp != null) assert.notEqual(u.kropp, rad.inte_kropp, rad.fras);
    if (rad.agg != null) assert.equal(u.reserv, rad.agg, `${rad.fras} agg`);
    if (rad.antal != null) assert.equal(u.antal, rad.antal, `${rad.fras} antal`);
    if (rad.ingen_replik != null) {
      for (const m of u.meddelanden) {
        assert.equal(m.startsWith(rad.ingen_replik), false, `${rad.fras}: ${m}`);
      }
    }
  });
}

type FacitRad = { lista: string; ord: string; facit: string; forvantat: string };

function lasFacit(): FacitRad[] {
  const text = readFileSync(join(rot, "rundor/O1-ordtolk/matt/facit-o1a.tsv"), "utf8");
  const rader = text.trim().split("\n").slice(1);
  return rader.map((line) => {
    const [lista, ord, , , facit, forvantat] = line.split("\t");
    return { lista: lista ?? "", ord: ord ?? "", facit: facit ?? "", forvantat: forvantat ?? "" };
  });
}

const facit = lasFacit();

test("facit-o1a har 75 rader, 53 fel och 22 rätt", () => {
  assert.equal(facit.length, 75);
  assert.equal(facit.filter((r) => r.facit === "fel").length, 53);
  assert.equal(facit.filter((r) => r.facit === "ratt").length, 22);
});

for (const rad of facit) {
  test(`O1a facit ${rad.lista}: ${rad.ord}`, () => {
    const u = lasUtfall(rad.ord);
    if (rad.forvantat.startsWith("inte:")) {
      assert.notEqual(u.kropp, rad.forvantat.slice("inte:".length), rad.ord);
    } else {
      assert.equal(u.kropp, rad.forvantat, rad.ord);
    }
  });
}

test("data/orddelar.json är högst 100 kB gzip", () => {
  const sok = join(rot, "data/orddelar.json");
  assert.equal(existsSync(sok), true, "data/orddelar.json saknas");
  const byte = gzipSync(readFileSync(sok)).length;
  assert.ok(byte <= 100 * 1024, `gzip ${byte} byte, tak 102400`);
});
