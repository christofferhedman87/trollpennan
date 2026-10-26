// V8b: småsaker i fri siktlinje, nyaste byggnaden främst, sjukhus ≤ 10 % skymt, tröjans fäste.
import assert from "node:assert/strict";
import { test } from "node:test";
import { arSmasak, malhojd, skalaFor } from "./entiteter.ts";
import { PLACERING, placera } from "./placering.ts";
import { tacker } from "./skarm.ts";
import { platsMed, START_PLATS } from "./platser.ts";
import type { Sparad } from "./brygga.ts";
import { plaggKonfig } from "./tillbehor/data.ts";

const spar = (uid: string, kropp: string, skapad: number) =>
  ({ uid, kropp, formel: `en ${kropp}`, beskrivning: "", skala: 1, alpha: 1, formagor: [], tillbehor: [], overraskningar: [], skapad }) as unknown as Sparad;

const ang = platsMed(START_PLATS)!;

test("V8b: boll, apple, svamp, stjarna och nyckel är småsaker", () => {
  for (const id of ["boll", "apple", "svamp", "stjarna", "nyckel"]) assert.equal(arSmasak(id), true, id);
  assert.equal(arSmasak("slott"), false);
  assert.equal(arSmasak("kanin"), false);
  assert.equal(arSmasak("kaffekopp"), true, "målhöjd 0,4 ligger kvar i intervallet");
  assert.ok(malhojd("svamp") > 0.5, "svamp är listad, inte kort");
});

test("V8b: svamp skalas utanför småsaksintervallet (samma 3D-skala som före ids)", () => {
  const [h, b, d] = [0.4, 1.2, 1];
  const mal = malhojd("svamp");
  const somVanligSak = mal / Math.max(h, 0.6 * Math.max(b, d));
  const somSmasak = mal / Math.max(h, Math.max(b, d));
  const s = skalaFor("svamp", h, b, d);
  assert.ok(Math.abs(s - somVanligSak) < 1e-6, `skala ${s}, väntat ${somVanligSak}`);
  assert.ok(Math.abs(s - somSmasak) > 0.2, "ids får inte slå på småsaksskalan");
});

test("V8b: fem småsaker har ≥ 40 px, ≥ 40 px mellan centra och 0 % överlapp", () => {
  const ids = ["boll", "apple", "svamp", "stjarna", "nyckel"];
  const lista = ids.map((id, i) => spar(`s${i}`, id, i + 1));
  const pl = placera(lista, ang);
  const poster = lista.map((d) => {
    const pos = pl.get(d.uid)!;
    assert.equal(pos.stall, false, d.kropp);
    const r = pos.kropp ?? pos.r;
    return { kropp: d.kropp, r, skymd: pos.skymd?.tackt ?? 1, sida: Math.max(r.x1 - r.x0, r.y1 - r.y0) };
  });
  for (const p of poster) {
    assert.ok(p.sida >= 40, `${p.kropp} ${p.sida.toFixed(1)} px`);
    assert.equal(p.skymd, 0, p.kropp);
  }
  for (let i = 0; i < poster.length; i++) {
    for (let j = i + 1; j < poster.length; j++) {
      const a = poster[i]!;
      const b = poster[j]!;
      const dist = Math.hypot((a.r.x0 + a.r.x1) / 2 - (b.r.x0 + b.r.x1) / 2, (a.r.y0 + a.r.y1) / 2 - (b.r.y0 + b.r.y1) / 2);
      assert.ok(dist >= 40, `${a.kropp}-${b.kropp} ${dist.toFixed(1)} px`);
      assert.equal(tacker(a.r, b.r), 0, `${a.kropp} täcker ${b.kropp}`);
      assert.equal(tacker(b.r, a.r), 0, `${b.kropp} täcker ${a.kropp}`);
    }
  }
});

test("V8b: nyaste byggnaden står främst och skyms högst 10 %", () => {
  const ids = ["slott", "hus", "torn", "koja"];
  const lista: Sparad[] = [];
  for (const [i, id] of ids.entries()) {
    lista.push(spar(`b${i}`, id, i + 1));
    const pl = placera(lista, ang);
    const ny = pl.get(`b${i}`)!;
    assert.equal(ny.stall, false, id);
    assert.ok((ny.skymd?.tackt ?? 1) <= 0.1, `${id} skymd ${ny.skymd?.tackt}`);
    for (const aldre of lista.slice(0, -1)) {
      const q = pl.get(aldre.uid)!;
      assert.ok(ny.z >= q.z - 1e-9, `${id} z ${ny.z} bakom ${aldre.kropp} z ${q.z}`);
    }
  }
});

test("V8b: sjukhuset i 10-ordssekvensen skyms högst 10 %", () => {
  const ord = ["ko", "katt", "hund", "kanin", "sjukhus", "stjarna", "kaffekopp", "gris", "slott", "puck"];
  const lista = ord.map((id, i) => spar(`a${i}`, id, i + 1));
  const pl = placera(lista, ang);
  const s = pl.get("a4")!;
  assert.equal(s.stall, false);
  assert.ok((s.skymd?.tackt ?? 1) <= 0.1, `skymd ${s.skymd?.tackt}`);
});

test("V8b: tröjan har den kalibrerade fästningen", () => {
  const t = plaggKonfig("troja");
  assert.ok(t);
  assert.equal(t!.ankare, "rygg");
  assert.equal(t!.skala, 1.48);
  assert.equal(t!.djupSkala, 3.4);
  assert.equal(t!.upp, -0.06);
  assert.equal(t!.fram, 0.78);
  assert.equal(t!.par, "kropp");
  assert.equal(PLACERING.smasak_min_px, 40);
  assert.equal(PLACERING.smasak_center_px, 40);
  assert.equal(PLACERING.byggnad_max_skymd, 0.1);
});
