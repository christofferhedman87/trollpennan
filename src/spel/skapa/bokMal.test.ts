import { test } from "node:test";
import assert from "node:assert/strict";
import { aktivtMal, ideForMal, type MalIndata } from "./bokMal.ts";
import { onskeKort } from "./hjalpord.ts";
import { laggKort } from "./insattning.ts";
import { tillText } from "./mening.ts";
import { tolka } from "../../tolk/tolka.ts";
const kalla = (id: string, losningar = ["en röd kanin", "en blå häst"]) => ({ id, lapp: { fran: id, text: id, bild: null }, losningar });
test("bokmål: gåva, uppdrag, önskan, tomt, Väktare, plats och fri har en gemensam prioritet utan mutation", () => {
  const s: MalIndata = { gava: kalla("g"), uppdrag: { ...kalla("u"), malDjur: "kaninen", krav: { ord: ["röd"] } }, onskan: kalla("o"), tomt: kalla("0"), vaktare: kalla("v"), plats: kalla("p") };
  for (const slag of ["gava", "uppdrag", "onskan", "tomt", "vaktare", "plats"] as const) {
    const fore = JSON.stringify(s); const mal = aktivtMal(s);
    assert.equal(mal.slag, slag); assert.equal(JSON.stringify(s), fore);
    if (slag === "uppdrag") { assert.equal(mal.malDjur, "kaninen"); assert.deepEqual(mal.krav, { ord: ["röd"] }); }
    delete s[slag];
  }
  assert.equal(aktivtMal(s).slag, "fri");
});
test("bokmål: idéer följer målets förslag, upprepar inte samma val och skriver aldrig i underlaget", () => {
  const s = { onskan: kalla("varm", ["med strumpor", "med vantar", "med strumpor", " "]) };
  const fore = JSON.stringify(s); const mal = aktivtMal(s);
  assert.deepEqual(mal.losningar, ["med strumpor", "med vantar"]);
  assert.deepEqual(mal.ideer, mal.losningar, "tomma och upprepade idéer tas bort även i ren logik");
  assert.equal(ideForMal(mal, "med strumpor", 0), "med vantar");
  assert.equal(ideForMal({ ...mal, ideer: ["med strumpor"] }, null, 0), "med strumpor", "adapterns bildurval används utan att byta mål");
  assert.equal(JSON.stringify(s), fore);
});
test("bokmål: modellerade föremål och plagg finns i hjälpen och sätts in i rätt roll", () => {
  const mat = onskeKort(["en morot"]); assert.ok(mat.some((k) => k.id === "morot" && k.fraga === "vad"));
  const plagg = onskeKort(["med strumpor", "med regnjacka"]);
  assert.ok(plagg.some((k) => k.id === "strumpa" && k.fraga === "har"));
  assert.ok(plagg.some((k) => k.id === "regnjacka" && k.fraga === "har"));
  const ord = "en kanin".split(" ").map((t) => ({ t, k: "skriv" as const }));
  const insatt = laggKort(ord, plagg.find((k) => k.id === "strumpa")!);
  const text = tillText(insatt.ord, "");
  assert.match(text, /kanin med/);
  const u = tolka(text, { kalla: "kort" });
  assert.equal(u.typ, "skapad");
  if (u.typ === "skapad") assert.ok(u.varelse.tillbehor.some((t) => t.id === "strumpa"));
});

import ui from "../../../data/skapa-ui.json" with { type: "json" };
test("bokmål: de utökade fria idéerna är verkliga kända skapelser utan okända ord", () => {
  assert.ok(ui.bokmal.fria_ideer.length >= 20);
  for (const text of ui.bokmal.fria_ideer) {
    const u = tolka(text, { kalla: "kort" });
    assert.equal(u.typ, "skapad", text);
    if (u.typ === "skapad") assert.deepEqual(u.okanda, [], text);
  }
});
