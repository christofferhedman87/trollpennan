// O1b: blandningsgrammatik. Röda före regeln, gröna efter. Fraser och testdata ändras inte här.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import entiteterJson from "../../data/entiteter.json" with { type: "json" };
import kanneteckenJson from "../../data/kannetecken.json" with { type: "json" };
import ordJson from "../../data/ord.json" with { type: "json" };
import fraser from "../../rundor/O1-ordtolk/provfraser-o1.json" with { type: "json" };
import type { Kannetecken } from "./typer.ts";
import { tolkaMedReserv } from "./reserv.ts";

const rot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const ent = (entiteterJson as { entiteter: Record<string, { art?: string }> }).entiteter;

type Rad = {
  fras: string;
  kropp?: string;
  tillbehor?: string[];
  farg?: string | null;
  farg_fran?: string;
  monster?: string | null;
  formagor?: string[];
  agg?: number;
  agg_ord?: string[];
  replik_borjar?: string;
};

for (const rad of fraser.O1b as Rad[]) {
  test(`O1b: ${rad.fras}`, () => {
    const u = tolkaMedReserv(rad.fras);
    assert.equal(u.typ, "skapad", rad.fras);
    if (u.typ !== "skapad") return;
    if (rad.kropp != null) assert.equal(u.varelse.kropp, rad.kropp, rad.fras);
    if (rad.tillbehor) {
      const ids = u.varelse.tillbehor.map((t) => t.id);
      for (const id of rad.tillbehor) assert.ok(ids.includes(id), `${rad.fras} saknar ${id}`);
    }
    if ("farg" in rad) assert.equal(u.varelse.farg, rad.farg, rad.fras);
    if (rad.farg_fran) {
      assert.ok(u.varelse.farg, rad.fras);
      assert.equal(u.varelse.farg, ent[rad.farg_fran]?.art, rad.fras);
    }
    if ("monster" in rad) assert.equal(u.varelse.monster, rad.monster, rad.fras);
    if (rad.formagor) {
      for (const id of rad.formagor) assert.ok(u.varelse.formagor.includes(id), `${rad.fras} saknar ${id}`);
    }
    if (rad.agg != null) assert.equal((u.varelse.reserv ?? []).length, rad.agg, rad.fras);
    if (rad.agg_ord) assert.deepEqual((u.varelse.reserv ?? []).map((r) => r.ord), rad.agg_ord, rad.fras);
    if (rad.replik_borjar) {
      assert.ok(
        u.meddelanden.some((m) => m.startsWith(rad.replik_borjar!)),
        `${rad.fras}: ${u.meddelanden.join(" | ")}`,
      );
      const mening = rad.replik_borjar.replace(/!$/, "");
      const formel = mening.charAt(0).toLocaleLowerCase("sv") + mening.slice(1);
      assert.equal(u.varelse.formel, formel, rad.fras);
      assert.ok(u.varelse.beskrivning.includes(formel.replace(/^(en|ett)\s+/, "")), u.varelse.beskrivning);
    }
  });
}

test("kannetecken täcker varje djur och de 53 kurerade är ifyllda", () => {
  const ord = ordJson as { ord: { id: string; klass: string }[] };
  const tab = kanneteckenJson as { djur: Record<string, Kannetecken> };
  const djur = ord.ord.filter((o) => o.klass === "djur");
  assert.equal(djur.length, 345);
  for (const o of djur) assert.ok(tab.djur[o.id], `saknar rad: ${o.id}`);
  const lista = readFileSync(join(rot, "rundor/O1-ordtolk/matt/vanligaste-50.txt"), "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  const kur = [...new Set([...lista, "enhörning", "zebra", "noshörning"])];
  assert.equal(kur.length, 53);
  for (const id of kur) {
    const k = tab.djur[id];
    assert.ok(k, id);
    assert.ok(k!.beskrivning, `${id} saknar beskrivning`);
    const har = !!k!.farg || !!k!.monster || k!.tillbehor.length > 0 || k!.formagor.length > 0;
    assert.ok(har, `${id} saknar kännetecken`);
  }
  const mullvad = tab.djur.mullvad;
  assert.deepEqual(mullvad, {
    farg: null,
    monster: null,
    monsterfarg: null,
    tillbehor: [],
    formagor: [],
    beskrivning: null,
  });
});
