import assert from "node:assert/strict";
import { test } from "node:test";
import { FEL_RESA, forstaUpplasta, nyPlatsVantar, platsFranText } from "./resa.ts";
import { mattUr } from "./platser.ts";
import { useMinne } from "./minne.ts";

test("B1.4: platsFranText hittar skogen, sjön, grottan och ängen", () => {
  assert.equal(platsFranText("skogen"), "skogen");
  assert.equal(platsFranText("Till Skogen"), "skogen");
  assert.equal(platsFranText("gå till sjön"), "sjon");
  assert.equal(platsFranText("grottan"), "grottan");
  assert.equal(platsFranText("ängen"), "ang");
  assert.equal(platsFranText("en kanin"), null);
  assert.equal(FEL_RESA, "Inte riktigt än");
});

test("B1.4: forstaUpplasta och nyPlatsVantar efter 3 ängsdjur", () => {
  useMinne.getState().aterstall();
  assert.equal(forstaUpplasta(mattUr(useMinne.getState())), null);
  const v = { uid: "t", kropp: "kanin", formel: "en kanin", beskrivning: "en kanin", skapad: 1, skala: 1, alpha: 1, formagor: [], tillbehor: [], overraskningar: [] } as never;
  for (let i = 0; i < 3; i++) useMinne.getState().laggPaAng(v, 1);
  const m = mattUr(useMinne.getState());
  assert.equal(forstaUpplasta(m), "skogen");
  assert.ok(nyPlatsVantar(m, []));
  assert.ok(!nyPlatsVantar(m, ["skogen"]));
  useMinne.getState().aterstall();
});

test("B1.4: bytPlats till låst plats ger false; seddaIntro sparas", () => {
  useMinne.getState().aterstall();
  assert.equal(useMinne.getState().bytPlats("skogen"), false);
  useMinne.getState().markeraIntro("skogen");
  assert.deepEqual(useMinne.getState().seddaIntro, ["skogen"]);
  useMinne.getState().aterstall();
});
