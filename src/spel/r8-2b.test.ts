// R8-2b: skapelser står bara på land (land/fri, aldrig vattenyta), simmare i vattnet; horisont per plats; inget svävar.
import assert from "node:assert/strict";
import { test } from "node:test";
import type { Sparad } from "./brygga.ts";
import { djurPlats } from "./ang/delat.ts";
import { ANKARE_HOJD, ankareFor, dekorFor, horisontFor, spridDekor, DEKOR_SKALA } from "./platsDekor.ts";
import { PLATSER, platsMed } from "./platser.ts";
import { iVatten, paLand, placeraPaPlats, tillPlats, torrKropp } from "./platsYta.ts";

const spec = (uid: string, kropp: string, formagor: string[] = []) => ({ uid, kropp, formagor, tillbehor: [], skapad: 0 }) as unknown as Sparad;
const LAND = ["kanin", "gris", "katt", "hund", "ko", "rav", "mus", "hast"];

for (const id of ["skogen", "sjon", "grottan"]) {
  test(`R8-2b: ${id} – 8 landdjur står på land, aldrig i vatten, och inte ovanpå varandra`, () => {
    const p = platsMed(id)!;
    const alla = LAND.map((k, i) => spec(`d${i}`, k));
    const pos = alla.map((d) => djurPlats(d, alla, p));
    for (const [i, [x, , z]] of pos.entries()) {
      const [px, py] = tillPlats(x, z);
      assert.equal(iVatten(p, px, py), false, `${id} ${alla[i]!.kropp} i vatten ${px.toFixed(2)},${py.toFixed(2)}`);
      assert.ok(paLand(p, px, py), `${id} ${alla[i]!.kropp} inte på land`);
      assert.ok(torrKropp(p, x, z), `${id} ${alla[i]!.kropp} för nära vattenkanten`);
    }
    for (let i = 0; i < pos.length; i++)
      for (let j = i + 1; j < pos.length; j++) assert.ok(Math.hypot(pos[i]![0] - pos[j]![0], pos[i]![2] - pos[j]![2]) >= 0.4, `${id} ${i}/${j} krockar`);
  });
}

test("R8-2b: en punkt mitt i sjön flyttas till land; simmare i vatten stannar i vatten", () => {
  const p = platsMed("sjon")!;
  const [land, sim] = placeraPaPlats(p, [[1, -3], [1, -3]], [false, true]);
  assert.ok(paLand(p, ...tillPlats(land![0], land![1])));
  assert.ok(iVatten(p, ...tillPlats(sim![0], sim![1])));
});

test("R8-2b: ängen (utan plats) är oförändrad", () => {
  const alla = LAND.map((k, i) => spec(`a${i}`, k));
  assert.deepEqual(alla.map((d) => djurPlats(d, alla)), alla.map((d) => djurPlats(d, alla, undefined)));
  assert.deepEqual(placeraPaPlats(platsMed("ang"), [[0, 0]]), [[0, 0]]);
});

test("R8-2b: horisont ur data – grottan berg, skogen/sjön skog, okänt = ingen", () => {
  assert.equal(horisontFor(platsMed("grottan")!.miljo)?.typ, "berg");
  assert.equal(horisontFor(platsMed("skogen")!.miljo)?.typ, "skog");
  assert.equal(horisontFor(platsMed("sjon")!.miljo)?.typ, "skog");
  assert.equal(horisontFor({ horisont: "ingen" }), null);
  assert.equal(horisontFor(undefined), null);
});

test("R8-2b: inget startobjekt svävar (bara ankare luft får lyfta), droppstenar står vända på marken", () => {
  for (const p of PLATSER) {
    for (const s of p.start) {
      const a = ankareFor(s, p.zoner);
      if (a === "luft") assert.equal(p.zoner.find((z) => z.id === s.zon)?.typ, "luft", `${p.id} ${s.ord} luft utan luft-zon`);
    }
    for (const sak of dekorFor(p).saker) assert.ok(sak.pos[1] <= ANKARE_HOJD.vatten || sak.ord === "moln", `${p.id} ${sak.ord} svävar y=${sak.pos[1]}`);
  }
  const g = platsMed("grottan")!;
  const dropp = dekorFor(g).saker.filter((s) => s.kropp === "droppsten");
  assert.ok(dropp.length >= 1 && dropp.every((s) => s.vand && s.pos[1] === 0));
  assert.ok(spridDekor(g).filter((r) => r.url.includes("droppsten")).every((r) => r.vand));
});

test("R8-2b: land-dekor hamnar aldrig på vattenytan, vatten-dekor alltid på den", () => {
  for (const p of PLATSER) {
    const rader = p.dekor ?? [];
    spridDekor(p).forEach((r, i) => {
      for (const [lx, lz] of r.platser) {
        const [px, py] = tillPlats(lx * DEKOR_SKALA, lz * DEKOR_SKALA);
        assert.equal(iVatten(p, px, py), !!rader[i]!.vatten, `${p.id} ${rader[i]!.modell} ${px.toFixed(2)},${py.toFixed(2)}`);
      }
    });
  }
});
