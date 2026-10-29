import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import byggData from "../../../data/bygg.json" with { type: "json" };
import gard3d from "../../../data/gard-3d.json" with { type: "json" };
import tillgangar from "../../../data/tillgangar.json" with { type: "json" };
import {
  CELL_STORLEK,
  GARD_BREDD,
  GARD_DJUP,
  cellTillXy,
  hittaSlutnaHagar,
  kantTillVarld,
  kantTillXy,
  kanterForByggen,
  ledigKantPlats,
  xyTillCell,
  xyTillKant,
  type CellPlats,
  type KantPlats,
} from "./rutnat.ts";
import { skapaGardVandrare, tillatnaCellerForHem, uppdateraGardVandrare } from "./vandra.ts";

const ROT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const KLAMP = { xMin: 0.06, xMax: 0.94, yMin: 0.3, yMax: 0.94 };

function klampa(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function filFinns(fil: string): boolean {
  return existsSync(resolve(ROT, `public${fil}`));
}

function licensFor(id: string): string | undefined {
  for (const [nyckel, post] of Object.entries(tillgangar.tillgangar)) {
    if (nyckel === id) return post.licens;
  }
  return undefined;
}

function ring(gx: number, gz: number): KantPlats[] {
  return [
    { gx, gz, kant: "N" },
    { gx, gz: gz + 1, kant: "N" },
    { gx, gz, kant: "W" },
    { gx: gx + 1, gz, kant: "W" },
  ];
}

test("alla 47 byggord finns i gard-3d och filer samt CC0-id stämmer", () => {
  assert.equal(byggData.bygg_ord.length, 47);
  assert.equal(GARD_BREDD, 6);
  assert.equal(GARD_DJUP, 10);
  assert.equal(CELL_STORLEK, 1);
  for (const b of byggData.bygg_ord) {
    assert.ok(Object.hasOwn(gard3d.byggnader, b.id), `saknar byggord ${b.id}`);
  }
  const filer: string[] = [gard3d.staket.enkelFil, gard3d.staket.grindFil];
  const idn: string[] = [];
  for (const post of Object.values(gard3d.byggnader)) {
    if (post.fil) filer.push(post.fil);
    if (post.tillgangId) idn.push(post.tillgangId);
  }
  for (const d of gard3d.dekor) {
    if (d.fil) filer.push(d.fil);
    if (d.tillgangId) idn.push(d.tillgangId);
  }
  for (const fil of filer) assert.ok(filFinns(fil), `saknar public${fil}`);
  for (const id of idn) assert.equal(licensFor(id), "CC0-1.0", id);
});

test("60 celler och 136 kanter är bijektiva genom minne-klampningen", () => {
  let cellOk = 0;
  for (let gz = 0; gz < GARD_DJUP; gz += 1) {
    for (let gx = 0; gx < GARD_BREDD; gx += 1) {
      const p = cellTillXy(gx, gz);
      assert.ok(p.x >= KLAMP.xMin && p.x <= KLAMP.xMax && p.y >= KLAMP.yMin && p.y <= KLAMP.yMax);
      const c = xyTillCell(klampa(p.x, KLAMP.xMin, KLAMP.xMax), klampa(p.y, KLAMP.yMin, KLAMP.yMax));
      assert.deepEqual(c, { gx, gz });
      cellOk += 1;
    }
  }
  assert.equal(cellOk, 60);

  let kantOk = 0;
  for (let gz = 0; gz <= GARD_DJUP; gz += 1) {
    for (let gx = 0; gx < GARD_BREDD; gx += 1) {
      const k: KantPlats = { gx, gz, kant: "N" };
      const p = kantTillXy(k);
      assert.ok(p.x >= KLAMP.xMin && p.x <= KLAMP.xMax && p.y >= KLAMP.yMin && p.y <= KLAMP.yMax);
      const tillbaka = xyTillKant(klampa(p.x, KLAMP.xMin, KLAMP.xMax), klampa(p.y, KLAMP.yMin, KLAMP.yMax));
      assert.deepEqual(tillbaka, k);
      kantOk += 1;
    }
  }
  for (let gz = 0; gz < GARD_DJUP; gz += 1) {
    for (let gx = 0; gx <= GARD_BREDD; gx += 1) {
      const k: KantPlats = { gx, gz, kant: "W" };
      const p = kantTillXy(k);
      assert.ok(p.x >= KLAMP.xMin && p.x <= KLAMP.xMax && p.y >= KLAMP.yMin && p.y <= KLAMP.yMax);
      const tillbaka = xyTillKant(klampa(p.x, KLAMP.xMin, KLAMP.xMax), klampa(p.y, KLAMP.yMin, KLAMP.yMax));
      assert.deepEqual(tillbaka, k);
      kantOk += 1;
    }
  }
  assert.equal(kantOk, 136);
  assert.equal(kantTillVarld({ gx: 2, gz: 4, kant: "N" }).rotY, 0);
  assert.equal(kantTillVarld({ gx: 3, gz: 4, kant: "W" }).rotY, Math.PI / 2);
});

test("BFS hittar slutna hagar och fyra lediga kanter sluter en ruta", () => {
  assert.equal(hittaSlutnaHagar([]).length, 0);
  assert.equal(hittaSlutnaHagar(ring(2, 4).slice(0, 3)).length, 0);

  const en = hittaSlutnaHagar(ring(2, 4));
  assert.equal(en.length, 1);
  assert.deepEqual(en[0]?.celler, [{ gx: 2, gz: 4 }]);
  assert.deepEqual(en[0]?.kanter, ["2,4,N", "2,4,W", "2,5,N", "3,4,W"]);

  const tva = hittaSlutnaHagar([
    { gx: 2, gz: 4, kant: "N" },
    { gx: 3, gz: 4, kant: "N" },
    { gx: 2, gz: 6, kant: "N" },
    { gx: 3, gz: 6, kant: "N" },
    { gx: 2, gz: 4, kant: "W" },
    { gx: 2, gz: 5, kant: "W" },
    { gx: 4, gz: 4, kant: "W" },
    { gx: 4, gz: 5, kant: "W" },
  ]);
  assert.equal(tva.length, 1);
  assert.deepEqual(tva[0]?.celler, [
    { gx: 2, gz: 4 },
    { gx: 3, gz: 4 },
    { gx: 2, gz: 5 },
    { gx: 3, gz: 5 },
  ]);

  const tvaHagar = hittaSlutnaHagar([...ring(1, 2), ...ring(4, 7)]);
  assert.equal(tvaHagar.length, 2);
  assert.equal(tvaHagar[0]?.id, "hage-1");
  assert.deepEqual(tvaHagar[0]?.celler, [{ gx: 1, gz: 2 }]);
  assert.equal(tvaHagar[1]?.id, "hage-2");
  assert.deepEqual(tvaHagar[1]?.celler, [{ gx: 4, gz: 7 }]);

  const finns: { x: number; y: number; bygg: string; antal: number }[] = [];
  for (let i = 0; i < 4; i += 1) {
    const p = ledigKantPlats(finns);
    finns.push({ x: p.x, y: p.y, bygg: "staket", antal: 1 });
  }
  const hagar = hittaSlutnaHagar(
    kanterForByggen(finns.map((b) => ({ uid: `k${b.x}`, bygg: b.bygg, ord: b.bygg, x: b.x, y: b.y, antal: b.antal }))),
  );
  assert.equal(hagar.length, 1);
  assert.deepEqual(hagar[0]?.celler, [{ gx: 2, gz: 4 }]);
});

function stega(celler: CellPlats[], hageId: string | null, steg: number) {
  let v = skapaGardVandrare(1, 10, celler, hageId, 0);
  const besokta = new Set([`${v.cell.gx},${v.cell.gz}`]);
  let utanfor = 0;
  for (let i = 0; i < steg; i += 1) {
    v = uppdateraGardVandrare(v, 0.05);
    const nyckel = `${v.cell.gx},${v.cell.gz}`;
    besokta.add(nyckel);
    if (!celler.some((c) => c.gx === v.cell.gx && c.gz === v.cell.gz)) utanfor += 1;
  }
  return { v, besokta, utanfor };
}

const HAGE_2X2: CellPlats[] = [
  { gx: 2, gz: 4 },
  { gx: 3, gz: 4 },
  { gx: 2, gz: 5 },
  { gx: 3, gz: 5 },
];

test("djur i 2×2-hage vandrar inne i rutorna under 400 steg", () => {
  const { v, besokta, utanfor } = stega(HAGE_2X2, "hage-1", 400);
  assert.equal(utanfor, 0);
  assert.ok(v.forflyttad > 1.5, `forflyttad ${v.forflyttad}`);
  assert.ok(besokta.size >= 2, `besökte ${besokta.size}`);
});

test("L-hage kliver aldrig in i det öppna hörnet", () => {
  const celler: CellPlats[] = [
    { gx: 2, gz: 4 },
    { gx: 2, gz: 5 },
    { gx: 3, gz: 5 },
  ];
  const { v, utanfor } = stega(celler, "hage-l", 400);
  assert.equal(utanfor, 0);
  assert.equal([...stega(celler, "hage-l", 400).besokta].includes("3,4"), false);
  assert.ok(v.forflyttad > 0.4);
});

test("staket och stall intill hagen delar hagens celler", () => {
  const kanter: KantPlats[] = [
    { gx: 2, gz: 4, kant: "N" },
    { gx: 3, gz: 4, kant: "N" },
    { gx: 2, gz: 6, kant: "N" },
    { gx: 3, gz: 6, kant: "N" },
    { gx: 2, gz: 4, kant: "W" },
    { gx: 2, gz: 5, kant: "W" },
    { gx: 4, gz: 4, kant: "W" },
    { gx: 4, gz: 5, kant: "W" },
  ];
  const hagar = hittaSlutnaHagar(kanter);
  assert.equal(hagar.length, 1);
  const kant: KantPlats = kanter[0] ?? { gx: 2, gz: 4, kant: "N" };
  const xy = kantTillXy(kant);
  const staket = tillatnaCellerForHem({ uid: "101", bygg: "staket", x: xy.x, y: xy.y }, hagar, kanter);
  assert.equal(staket.hageId, hagar[0]?.id);
  assert.deepEqual(staket.celler, hagar[0]?.celler);
  const stallXy = cellTillXy(1, 4);
  const stall = tillatnaCellerForHem({ uid: "105", bygg: "stall", x: stallXy.x, y: stallXy.y }, hagar, kanter);
  assert.equal(stall.hageId, hagar[0]?.id);
  assert.deepEqual(stall.celler, hagar[0]?.celler);
});
