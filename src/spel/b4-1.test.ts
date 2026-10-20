// B4.1: det barnet skapar lyser i grottan (data/platser.json), högst 4 ljus – de senast skapade.
import assert from "node:assert/strict";
import { test } from "node:test";
import entiteter from "../../data/entiteter.json" with { type: "json" };
import { LJUS_STYRKA, MAX_LJUS, ljuskallaFor, lyserVad, valjLjus, ytansBredd } from "./ljuskalla.ts";
import { platsMed } from "./platser.ts";

const sak = (uid: string, kropp: string, med: string[] = [], skapad = 1) => ({ uid, kropp, tillbehor: med.map((id) => ({ id })) as never, skapad });

test("B4.1: grottans ljuskälla kommer ur data, radie som andel av ytans bredd", () => {
  const g = platsMed("grottan")!;
  const l = g.miljo.ljuskalla_skapad as { radie: number; intensitet: number; farg: string };
  const k = ljuskallaFor(g)!;
  assert.ok(k, "grottan har ljus");
  assert.equal(ytansBredd(), 11);
  assert.ok(Math.abs(k.avstand - l.radie * 11) < 1e-9, `avstånd ${k.avstand}`);
  assert.ok(k.avstand > 2 && k.avstand < 3.2, "ungefär som 2.5 i den gamla prompten");
  assert.equal(k.intensitet, l.intensitet * LJUS_STYRKA);
  assert.equal(k.farg, l.farg);
  assert.ok(k.entiteter.includes("lykta"));
  const ent = (entiteter as unknown as { entiteter: Record<string, { modell?: string }> }).entiteter;
  for (const e of k.entiteter) assert.ok(ent[e]?.modell, `${e} finns i entiteter.json med modell`);
  assert.ok(!k.entiteter.includes("kanin"));
});

test("B4.1: ängen har inget ljus; en plats utan lista eller med trasig data ger inget ljus", () => {
  assert.equal(ljuskallaFor(platsMed("ang")), null);
  assert.equal(ljuskallaFor({ miljo: { ljuskalla_skapad: { radie: 0.2, intensitet: 0.3, farg: "#FFD58A" } } }), null, "ingen entiteter-lista");
  const k = ljuskallaFor({ miljo: { ljuskalla_skapad: { radie: -1, intensitet: "x", farg: "röd", entiteter: ["lykta", 3] } } }, 10)!;
  assert.deepEqual(k, { farg: "#FFD58A", intensitet: 0.35 * LJUS_STYRKA, avstand: 2.4, entiteter: ["lykta"] }, "standardvärden");
});

test("B4.1: det som lyser är kroppen ('en lykta') eller saken djuret har med sig ('en kanin med en lykta')", () => {
  const k = ljuskallaFor(platsMed("grottan"))!;
  assert.equal(lyserVad(sak("a", "lykta"), k), "lykta");
  assert.equal(lyserVad(sak("b", "kanin", ["lykta"]), k), "lykta");
  assert.equal(lyserVad(sak("c", "rav", ["bok", "fackla"]), k), "fackla");
  assert.equal(lyserVad(sak("d", "kanin", ["bok"]), k), null);
  assert.equal(lyserVad(sak("e", "kanin"), k), null);
});

test("B4.1: högst 4 ljus, de senast skapade behålls; saker som inte lyser räknas inte", () => {
  const k = { entiteter: ["lykta"] };
  const djur = [1, 2, 3, 4, 5, 6].map((n) => sak(`l${n}`, "kanin", ["lykta"], n * 1000));
  djur.splice(2, 0, sak("k", "kanin", [], 99999));
  const v = valjLjus(djur, k);
  assert.equal(MAX_LJUS, 4);
  assert.deepEqual([...v.keys()].sort(), ["l3", "l4", "l5", "l6"]);
  assert.equal(v.get("l6"), "lykta");
  const lika = [sak("x", "lykta", [], 5), sak("y", "lykta", [], 5)];
  assert.deepEqual([...valjLjus(lika, k, 1).keys()], ["y"], "samma tid → den senare i listan");
  assert.equal(valjLjus(djur, k, 0).size, 0);
});
