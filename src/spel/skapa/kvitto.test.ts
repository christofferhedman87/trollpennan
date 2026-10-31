import assert from "node:assert/strict";
import { test } from "node:test";
import { meningsbrickor } from "./meningsbrickor.ts";
import type { MOrd } from "./mening.ts";
import { kvittoGuldord } from "./kvitto.ts";

const ord = (text: string, k: MOrd["k"] = "skriv"): MOrd[] => text.split(" ").map((t) => ({ t, k }));
const kvitto = (mening: MOrd[]) => meningsbrickor(mening).filter((b) => b.klass !== "vantar").map(({ t, guld }) => Object.freeze({ t, guld }));

test("T-32: en häst har ett guldord; artikeln räknas inte", () => {
  assert.deepEqual(kvittoGuldord(kvitto(ord("en häst"))), ["häst"]);
});

test("T-32: kort och automatiska småord ger inget guldchip", () => {
  assert.deepEqual(kvittoGuldord(kvitto([{ t: "en", k: "auto" }, ...ord("kanin", "kort")])), []);
  assert.deepEqual(kvittoGuldord([]), []);
});

test("T-32: hela sprutar eld är ett guldord, bara när båda orden är skrivna", () => {
  for (const k of ["skriv", "kort"] as const) {
    const mening = [...ord("en drake som", "kort"), ...ord("sprutar eld", k)];
    assert.deepEqual(kvittoGuldord(kvitto(mening)), k === "skriv" ? ["sprutar eld"] : []);
  }
  assert.deepEqual(kvittoGuldord(kvitto([...ord("en drake som", "kort"), { t: "sprutar", k: "skriv" }, { t: "eld", k: "kort" }])), []);
});

test("T-32: flera egna ord listas i meningsordning och hjälpord lämnas utanför", () => {
  const underlag = Object.freeze(kvitto([...ord("en stor grön drake med"), ...ord("hatt", "kort")]));
  const fore = JSON.stringify(underlag);
  assert.deepEqual(kvittoGuldord(underlag), ["stor", "grön", "drake"]);
  assert.equal(JSON.stringify(underlag), fore, "kvittots underlag ändras inte");
  assert.deepEqual(kvittoGuldord(kvitto(ord("en katt och en katt"))), ["katt", "katt"], "varje faktiskt guldmarkerad förekomst visas");
});
