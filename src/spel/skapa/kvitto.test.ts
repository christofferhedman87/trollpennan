import assert from "node:assert/strict";
import { test } from "node:test";
import { meningsbrickor } from "./meningsbrickor.ts";
import type { MOrd } from "./mening.ts";
import uiJson from "../../../data/skapa-ui.json" with { type: "json" };
import { kvittoGuldord, kvittoInnehall } from "./kvitto.ts";
import { lasbarTid } from "../rost.ts";

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

test("T-32: lästexten omfattar samma huvudrad, stjärnor och långa guldlista som visas", () => {
  const innehall = kvittoInnehall({ id: 1, ord: kvitto(ord("ett stort rött hus av guld med två dörrar")), stj: 3, guld: 999, tack: "Tack för huset!" }, uiJson.kvitto);
  assert.equal(innehall.guldtext, "5 guldord: stort, rött, hus, guld, dörrar", "den faktiska understrykningen styr även vid fel gammal räknare");
  assert.equal(innehall.lastext, "Tack för huset! Du trollade fram ett stort rött hus av guld med två dörrar! +3 stjärnor 5 guldord: stort, rött, hus, guld, dörrar");
  assert.ok(lasbarTid(innehall.lastext) > 5600, "en lång guldlista behöver mer än basens lästid");
});
