// R8-2a: dekor ur data sprids deterministiskt, utanför fri yta, och varje modell har fil och licens.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import tillgangar from "../../data/tillgangar.json" with { type: "json" };
import { DEKOR_SKALA, spridDekor } from "./platsDekor.ts";
import { PLATSDATA, PLATSER, type Plats } from "./platser.ts";

const TILL = tillgangar.tillgangar as Record<string, { fil?: string; mapp?: string; licens?: string }>;
const ROT = path.resolve(import.meta.dirname, "../..");

function iFri(px: number, py: number, p: Plats) {
  return p.zoner.some((z) => {
    if (z.typ !== "fri") return false;
    const [x0, y0, x1, y1] = z.rekt;
    return px >= Math.min(x0, x1) && px <= Math.max(x0, x1) && py >= Math.min(y0, y1) && py <= Math.max(y0, y1);
  });
}

function platsXy(wx: number, wz: number): [number, number] {
  const [x0, x1] = PLATSDATA.yta.x;
  const [z0, z1] = PLATSDATA.yta.z;
  return [(wx - x0) / (x1 - x0), (wz - z0) / (z1 - z0)];
}

test("R8-2a: dekor-modeller finns på disk och har licens, zoner finns, spridningen är stabil och fri", () => {
  const medDekor = PLATSER.filter((p) => (p.dekor?.length ?? 0) > 0);
  assert.ok(medDekor.length >= 3);
  for (const p of medDekor) {
    const antal = p.dekor!.reduce((n, r) => n + r.antal, 0);
    const modeller = new Set(p.dekor!.map((r) => r.modell));
    assert.ok(antal <= 70, `${p.id} antal ${antal}`);
    assert.ok(modeller.size <= 14, `${p.id} modeller ${modeller.size}`);
    for (const rad of p.dekor!) {
      assert.ok(p.zoner.some((z) => z.id === rad.zon), `${p.id} saknar zon ${rad.zon}`);
      if (rad.modell.startsWith("natur/")) {
        const fil = rad.modell.slice("natur/".length);
        assert.ok(TILL.natur?.licens, "natur saknar licensrad");
        assert.ok(fs.existsSync(path.join(ROT, "public/models/natur", `${fil}.glb`)), fil);
      } else {
        const post = TILL[rad.modell];
        assert.ok(post?.licens && post.fil, `${rad.modell} saknar licensrad`);
        assert.ok(fs.existsSync(path.join(ROT, "public", post.fil!)), post.fil);
      }
    }
    const a = spridDekor(p);
    const b = spridDekor(p);
    assert.deepEqual(a, b, `${p.id} inte deterministisk`);
    assert.equal(a.some((r) => r.saknas), false, `${p.id} saknar modell`);
    for (const rad of a) {
      for (const [lx, lz] of rad.platser) {
        const [px, py] = platsXy(lx * DEKOR_SKALA, lz * DEKOR_SKALA);
        assert.equal(iFri(px, py, p), false, `${p.id} punkt i fri ${px.toFixed(3)},${py.toFixed(3)}`);
      }
    }
  }
});
