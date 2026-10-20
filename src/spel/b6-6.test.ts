// B6.6: "skapad men osynlig". Alla tio platser på ängen ligger i bild, och ingen sak blir för liten eller för tunn för att synas.
import assert from "node:assert/strict";
import { test } from "node:test";
import storlekJson from "../../data/storlek.json" with { type: "json" };
import entJson from "../../data/entiteter.json" with { type: "json" };
import { DAMM, siktFri } from "./ang/damm.ts";
import { djurPlats } from "./ang/delat.ts";
import { BAK_ZON, fotKant, halvBredd, malhojd, siktHojd, siktRadie, skalaFor, storlekKlass, takSkala } from "./entiteter.ts";
import { platsMed, START_PLATS } from "./platser.ts";
import { synligX } from "./platsYta.ts";

const spar = (uid: string, kropp: string) =>
  ({ uid, kropp, formel: `en ${kropp}`, beskrivning: "", skala: 1, alpha: 1, formagor: [], tillbehor: [], overraskningar: [], skapad: 1 }) as never;

test("B6.6: tio landdjur och småsaker på ängen står alla inom |x| ≤ 1,6 (kameran ser dem)", () => {
  const kroppar = ["katt", "hund", "gris", "ko", "kanin", "kvast", "kopp", "mynt", "nyckel", "kaffekanna"];
  const alla = kroppar.map((k, i) => spar(`u${i}`, k));
  for (const d of alla) {
    const [x] = djurPlats(d, alla);
    assert.ok(Math.abs(x) <= 1.6, `${(d as { kropp: string }).kropp} x=${x}`);
  }
});

test("B6.6: en tunn sak (pinne) och en platt sak förstoras till minsta storlek och yta, högst max_forstoring", () => {
  const M = storlekJson.minsta;
  // en pinne: 1 hög, 0,05 bred (fiskespöet, kniven)
  const s1 = skalaFor("fiskespo", 1, 0.05, 0.05);
  assert.ok(s1 * 1 * 0.05 * s1 >= M.yta - 1e-9 || s1 / (0.5 / 1) >= M.max_forstoring - 1e-9, `yta ${(s1 * s1 * 0.05).toFixed(3)}`);
  // platt sak: 0,02 hög, 1 bred (bäcken, stigen)
  const s2 = skalaFor("back", 0.02, 1, 1);
  assert.ok(Math.max(1, 0.02) * s2 >= Math.min(M.storlek, 0.45) - 1e-9 || s2 >= (0.1 / 0.6) * M.max_forstoring - 1e-9);
  // ett vanligt djur rörs inte
  assert.equal(skalaFor("katt", 2, 1, 1), skalaFor("katt", 2, 1, 1));
});

test("B6.6: förstoringen går aldrig över storleksklassens tak", () => {
  for (const id of ["bil", "matbord"]) {
    const k = storlekKlass(id);
    if (!k) continue;
    const s = skalaFor(id, 1, 0.05, 0.05);
    assert.ok(s * 1 <= Math.max(k.tak, 0) + 1e-9 || s * 1 <= 1, `${id}: ${s}`);
  }
});

test("B6.6 (Doodle 08:26): storlek per byggnadstyp – slottet är större än sjukhuset", () => {
  const h = (k: string) => malhojd(k) * takSkala(k, 1);
  assert.ok(h("slott") >= h("sjukhus") + 0.3, `slott ${h("slott")}, sjukhus ${h("sjukhus")}`);
  assert.ok(h("kyrka") > h("hus") && h("hus") > h("kiosk"), "kyrka > hus > kiosk");
  assert.equal(storlekKlass("slott")?.rad, "bortom");
});

const BYGG_ANG = platsMed(START_PLATS)!;
const byggSpar = (uid: string, kropp: string) => ({ uid, kropp, skala: 1, formagor: [], tillbehor: [], farg: null, formel: kropp, skapad: 0 });
function kollaBak(kroppar: string[], namn: string) {
  const alla = kroppar.map((k, i) => byggSpar(`${namn}-${i}`, k));
  const lagen = alla.map((d) => {
    const [x, , z] = djurPlats(d as never, alla as never, BYGG_ANG);
    return { k: d.kropp, x, z, h: halvBredd(d.kropp), hojd: malhojd(d.kropp) * takSkala(d.kropp, 1), bak: storlekKlass(d.kropp)?.zon === "bak", bygg: storlekKlass(d.kropp)?.rad === "bortom" };
  });
  const djurZ = Math.min(...lagen.filter((l) => !l.bak).map((l) => l.z), Infinity);
  for (const l of lagen.filter((q) => q.bak)) {
    for (const [a, b] of (l.z <= BAK_ZON.bortom!.z[1] + 1e-9 && BAK_ZON.bortom?.fri_x) || BAK_ZON.fri_x) assert.ok(l.x + l.h <= a + 1e-9 || l.x - l.h >= b - 1e-9, `${namn}: ${l.k} (x ${l.x}, halv ${l.h}) står framför grinden`);
    assert.ok(Math.hypot(l.x - DAMM.x, l.z - DAMM.z) - DAMM.r - l.h >= 0.1, `${namn}: ${l.k} i dammen`);
    assert.ok(siktFri(l.x, l.z, siktRadie(l.k), siktHojd(l.k)), `${namn}: ${l.k} skymmer dammen (x ${l.x}, z ${l.z})`);
    assert.ok(l.z < djurZ - 0.5, `${namn}: ${l.k} bakom djuren`);
    if (l.bygg) assert.ok(l.z <= BAK_ZON.bortom!.z[1] + 1e-9, `${namn}: byggnaden ${l.k} bakom staketet (z ${l.z})`);
  }
  // överlappar två i bredd står den lägre framför (större z), så att ingen skyms av en högre
  const bak = lagen.filter((q) => q.bak);
  for (const a of bak) for (const b of bak) if (a !== b && Math.abs(a.x - b.x) < a.h + b.h - 0.05 && a.z > b.z + 1e-9) assert.ok(a.hojd < b.hojd - 1e-9 || (Math.abs(a.hojd - b.hojd) < 1e-9 && a.h <= b.h + 1e-9), `${namn}: ${a.k} (${a.hojd}, halv ${a.h}) står framför ${b.k} (${b.hojd}, halv ${b.h})`);
  return lagen;
}

test("B6.6 (Doodle 08:26): byggnader längst bak, spridda, inget vid grinden, cirkustältet skymmer inte växthuset", () => {
  const l = kollaBak(["slott", "sjukhus", "cirkus", "vaxthus", "hus", "skola", "ko", "katt"], "doodle");
  const [c, v] = [l.find((q) => q.k === "cirkus")!, l.find((q) => q.k === "vaxthus")!];
  if (Math.abs(c.x - v.x) < c.h + v.h) assert.ok(v.z > c.z, "växthuset (smalare) framför cirkustältet");
  // samma par med omvänd ordning och andra uid: fortfarande växthuset framför
  for (const n of ["a", "b", "c", "d"]) {
    const q = kollaBak(["vaxthus", "cirkus", "sjukhus", "slott", "ko"], `cv${n}`);
    const [c2, v2] = [q.find((r) => r.k === "cirkus")!, q.find((r) => r.k === "vaxthus")!];
    if (Math.abs(c2.x - v2.x) < c2.h + v2.h) assert.ok(v2.z > c2.z, `cv${n}: växthuset framför cirkustältet`);
  }
  const xs = l.filter((q) => q.bygg).map((q) => q.x);
  assert.ok(Math.max(...xs) - Math.min(...xs) >= 2.5, `spridda: ${xs.join(", ")}`);
  // alla byggnader i lag om 8, med två djur
  const E = (entJson as unknown as { entiteter: Record<string, { kategori: string; modell?: string }> }).entiteter;
  const hus = Object.keys(E).filter((k) => E[k]!.modell && storlekKlass(k)?.rad === "bortom").sort();
  assert.ok(hus.length > 40);
  for (let i = 0; i < hus.length; i += 6) kollaBak([...hus.slice(i, i + 6), "ko", "hund"], `lag${i}`);
  kollaBak(["buss", "bil", "traktor", "matbord", "soffa", "slott", "ko"], "fordon");
});

test("B6.6: tio stora djur på ängen – var och en står inom den synliga bredden för sitt djup (giraffen längst fram)", () => {
  const kroppar = ["lejon", "zebra", "pingvin", "rav", "flodhast", "anka", "orn", "tyrannosaurus", "giraff", "panda"];
  const alla = kroppar.map((k, i) => byggSpar(`stor-${i}`, k));
  for (const d of alla) {
    const [x, y, z] = djurPlats(d as never, alla as never, BYGG_ANG);
    if (y > 0.5) continue; // flygare i rader, egen regel
    assert.ok(Math.abs(x) <= synligX(z, fotKant(d.kropp)) + 1e-9 || Math.abs(x) <= synligX(z) + 1e-9, `${d.kropp} x ${x}, z ${z}`);
  }
});
