// R1: köns sex fall mot facit. Takten läses ur data/rost-takt.json, tiderna ur provfall-r1.json.
// Falsk klocka och falsk spelare. Varje spelad rad varar las_ms, annars 1800 ms.
import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import * as rostKo from "./rostKo.ts";

const takt = JSON.parse(fs.readFileSync("data/rost-takt.json", "utf8")) as {
  version: number;
  takt: { oombedd_mellan_ms: number };
};
const facit = JSON.parse(fs.readFileSync("rundor/R1-rostens-takt/provfall-r1.json", "utf8")) as {
  fall: {
    namn: string;
    handelser: { ms: number; typ: string; kalla?: string; text?: string; las_ms?: number }[];
    forvantat: {
      spelas: { text: string; min: number; max: number }[];
      stryks?: string[];
      antal_strukna?: number;
      avbryts?: string[];
    };
  }[];
};

const HORD = new Set(["fil", "mall", "reserv", "tyst"]);
/** Spelad längd när händelsen inte anger las_ms. Inte ett takttal. */
const LAS_STANDARD = 1800;

type RostRad = { text: string; satt: string; klass?: string; kalla?: string; fodd?: number };
type Stamp = { text: string; satt: string; t: number };
type Timer = { id: number; vid: number; fn: () => void };

test("R1: schemaläggaren läser takten ur data/rost-takt.json", () => {
  assert.equal(takt.version, 1);
  assert.equal(rostKo.TAKT.takt.oombedd_mellan_ms, takt.takt.oombedd_mellan_ms);
  assert.equal(facit.fall.length, 6);
});

for (const fall of facit.fall) {
  test(`R1: ${fall.namn}`, () => {
    let tid = 0;
    let nastaId = 0;
    const timers: Timer[] = [];
    const stamp: Stamp[] = [];
    const rost: RostRad[] = [];
    const push = rost.push.bind(rost);
    rost.push = (...rader: RostRad[]) => {
      for (const r of rader) stamp.push({ text: r.text, satt: r.satt, t: tid });
      return push(...rader);
    };
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
    const advance = (mal: number) => {
      while (true) {
        timers.sort((a, b) => a.vid - b.vid || a.id - b.id);
        const nx = timers[0];
        if (!nx || nx.vid > mal) break;
        timers.shift();
        tid = nx.vid;
        nx.fn();
      }
      tid = mal;
    };

    rostKo.provAterstall();
    rostKo.prov({
      nu: () => tid,
      senare,
      avbrytSenare,
      spela: (text, meta, las_ms, klar) => {
        rost.push({ text, satt: "tyst", klass: meta.klass, kalla: meta.kalla, fodd: meta.fodd });
        const id = senare(las_ms ?? LAS_STANDARD, klar);
        return { avbryt: () => avbrytSenare(id) };
      },
    });

    const grupper = new Map<number, typeof fall.handelser>();
    for (const h of fall.handelser) {
      const lista = grupper.get(h.ms) ?? [];
      lista.push(h);
      grupper.set(h.ms, lista);
    }
    const tider = [...grupper.keys()].sort((a, b) => a - b);
    for (const ms of tider) {
      advance(ms);
      for (const h of grupper.get(ms) ?? []) {
        if (h.typ === "oppna") rostKo.oppna();
        else if (h.typ === "handling") rostKo.handling();
        else if (h.typ === "anmal") rostKo.anmal({ text: h.text ?? "", kalla: h.kalla as rostKo.Kalla, las_ms: h.las_ms });
      }
    }
    advance((tider.at(-1) ?? 0) + 100_000);

    const spelade = stamp.filter((r) => HORD.has(r.satt));
    const strukna = stamp.filter((r) => r.satt === "struken").map((r) => r.text);
    const avbrutna = stamp.filter((r) => r.satt === "avbruten").map((r) => r.text);
    const vantat = fall.forvantat;

    assert.equal(spelade.length, vantat.spelas.length, `spelade: ${spelade.map((s) => `${s.t} ${s.text}`).join(" | ")}`);
    for (let i = 0; i < vantat.spelas.length; i++) {
      const s = spelade[i]!;
      const v = vantat.spelas[i]!;
      assert.equal(s.text, v.text);
      assert.ok(s.t >= v.min && s.t <= v.max, `${v.text} startade vid ${s.t}, väntat ${v.min}–${v.max}`);
    }
    if ((vantat.stryks?.length ?? 0) > 0) assert.deepEqual(strukna, vantat.stryks);
    if (typeof vantat.antal_strukna === "number") assert.equal(strukna.length, vantat.antal_strukna, strukna.join(" | "));
    if (vantat.avbryts) assert.deepEqual(avbrutna, vantat.avbryts);
  });
}
