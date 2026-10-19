// B1.3a: platser som data – upplåsning, milstolpe, yta och sparning per plats.
import assert from "node:assert/strict";
import { test } from "node:test";
import { PLATSER, klaraPerPlats, milstolpeNadd, platsMed, tillVarld, upplast, type Matt, type Plats } from "./platser.ts";
import { franSparning, useMinne } from "./minne.ts";
import type { Varelse } from "../tolk/typer.ts";

// Skogen ur utkastet (data/platser.json har bara ängen tills datapaketet B2 körs).
const SKOGEN: Plats = {
  id: "skogen", namn: "Skogen", ordning: 1,
  upplasning: { nagon: [{ typ: "skapelser", omrade: "ang", min: 3 }] },
  milstolpe: { nagon: [{ typ: "uppdrag_klara", omrade: "skogen", min: 5 }, { typ: "skapelser", omrade: "skogen", min: 8 }], final: "skog-final-minnesljus", las_upp: "sjon" },
  miljo: {}, zoner: [], start: [], uppdrag: [],
};
const LISTA = [...PLATSER, SKOGEN];
const m = (ang: number, skog = 0, klaraSkog = 0, oppnade: string[] = []): Matt => ({ skapelser: { ang, skogen: skog }, klara: { skogen: klaraSkog }, oppnade });

test("B1.3a: data/platser.json har ängen, alltid öppen", () => {
  assert.equal(platsMed("ang")?.namn, "Ängen");
  assert.ok(upplast("ang", m(0)));
  assert.ok(!upplast("finnsinte", m(99)));
});

test("B1.3a: skogen låses upp av 3 skapelser på ängen och förblir öppen", () => {
  assert.ok(!upplast("skogen", m(2), LISTA), "2 skapelser: låst");
  assert.ok(upplast("skogen", m(3), LISTA), "3 skapelser: öppen");
  assert.ok(upplast("skogen", m(0, 0, 0, ["skogen"]), LISTA), "en gång öppnad förblir öppen");
});

test("B1.3a: milstolpen nås med 5 klara uppdrag eller 8 skapelser", () => {
  assert.ok(!milstolpeNadd("skogen", m(3, 7, 4), LISTA));
  assert.ok(milstolpeNadd("skogen", m(3, 0, 5), LISTA));
  assert.ok(milstolpeNadd("skogen", m(3, 8, 0), LISTA));
  assert.ok(!milstolpeNadd("ang", m(99)), "ängen har ingen milstolpe");
});

test("B1.3a: klaraPerPlats räknar per omrade utan finaler", () => {
  const u = [{ id: "a", omrade: "skogen" }, { id: "b", omrade: "skogen" }, { id: "f", omrade: "skogen", final: true }, { id: "c", omrade: "ang" }];
  assert.deepEqual(klaraPerPlats({ a: "klar", b: "pagar", f: "klar", c: "klar" }, u), { skogen: 1, ang: 1 });
});

test("B1.3a: tillVarld ger hörnen i ytan", () => {
  assert.deepEqual(tillVarld(0, 0), [-5.5, -6.5]);
  assert.deepEqual(tillVarld(1, 1), [5.5, 2.5]);
});

const djur = { uid: "x", kropp: "kanin", formel: "en kanin", beskrivning: "en kanin", skapad: 1, skala: 1, alpha: 1, formagor: [], tillbehor: [], overraskningar: [] };

test("B1.3a: gammal sparning utan platsfälten laddas med plats ang och djuren kvar", () => {
  const d = franSparning({ version: 2, ang: [djur], garden: [], stjarnor: 4 });
  assert.equal(d.plats, "ang");
  assert.deepEqual(d.platsSkapelser, {});
  assert.deepEqual(d.oppnadePlatser, []);
  assert.equal(d.ang.length, 1);
  assert.equal(d.ang[0]!.kropp, "kanin");
  assert.equal(d.stjarnor, 4);
  assert.equal(franSparning({ version: 2, ang: [], garden: [], stjarnor: 0, platsSkapelser: { skogen: [{ trasig: 1 }] } }).platsSkapelser.skogen, undefined, "trasig platslista ger standard");
});

test("B1.3a: en skapelse i skogen hamnar i platsSkapelser.skogen, ängen oförändrad", () => {
  const s = useMinne.getState();
  s.aterstall();
  const v = { ...djur } as unknown as Varelse;
  s.laggPaAng(v, 1);
  const angFore = useMinne.getState().ang.map((a) => a.uid);
  assert.equal(angFore.length, 1);
  useMinne.setState({ plats: "skogen" });
  const { nya } = useMinne.getState().laggPaAng(v, 2);
  const e = useMinne.getState();
  assert.equal(nya.length, 2);
  assert.equal(e.platsSkapelser.skogen?.length, 2);
  assert.deepEqual(e.ang.map((a) => a.uid), angFore, "ang är oförändrad");
  for (let i = 0; i < 12; i++) useMinne.getState().laggPaAng(v, 1);
  assert.equal(useMinne.getState().platsSkapelser.skogen?.length, 10, "samma tak på 10");
  useMinne.getState().aterstall();
});

test("B1.3a: bytPlats går bara till upplåsta platser", () => {
  useMinne.getState().aterstall();
  assert.equal(useMinne.getState().bytPlats("finnsinte"), false);
  assert.equal(useMinne.getState().plats, "ang");
  assert.equal(useMinne.getState().bytPlats("ang"), true);
});

// B1.3b: scenen läser platsen. Ord → entitet går via samma uppslag som barnets ord.
test("B1.3b: ord → entitet (träd→trad, björk→bjork, okänt → null)", async () => {
  const { entitetForOrd } = await import("./platsDekor.ts");
  assert.equal(entitetForOrd("träd"), "trad");
  assert.equal(entitetForOrd("björk"), "bjork");
  assert.equal(entitetForOrd("stubbe"), "stubbe");
  assert.equal(entitetForOrd("vägskylt"), "vagskylt");
  assert.equal(entitetForOrd("xyzzyord"), null);
});

test("B1.3b: skogen, sjön och grottan har synlig dekor och egen miljö", async () => {
  const { dekorFor, vattenytor } = await import("./platsDekor.ts");
  const { miljoFor, MILJO } = await import("./miljo.ts");
  for (const id of ["skogen", "sjon", "grottan"]) {
    const p = platsMed(id);
    assert.ok(p, `${id} finns i data/platser.json`);
    const { saker } = dekorFor(p);
    assert.ok(saker.length >= 5, `${id}: minst 5 startobjekt med modell (${saker.length})`);
    const m = miljoFor(p?.miljo);
    assert.notEqual(m.miljo.himmel.bakgrund, MILJO.himmel.bakgrund, `${id}: annan himmel än ängen`);
    assert.ok(m.ljusSkala > 0 && m.ljusSkala <= 1);
  }
  assert.ok(dekorFor(platsMed("skogen")).saker.some((s) => s.kropp === "trad"));
  assert.ok(vattenytor(platsMed("sjon")).length >= 1, "sjön har en vattenyta");
  assert.equal(dekorFor(platsMed("ang")).saker.length, 0, "ängen har ingen datadekor (ritas som förut)");
});

test("B1.4-fix: markfärg per plats, större vatten, droppsten nära tak, ingen moln på sjön", async () => {
  const { dekorFor, vattenytor } = await import("./platsDekor.ts");
  const { miljoFor } = await import("./miljo.ts");
  assert.equal(miljoFor(platsMed("skogen")?.miljo).mark, "#718957");
  assert.equal(miljoFor(platsMed("sjon")?.miljo).mark, "#DCCB9B");
  assert.equal(miljoFor(platsMed("grottan")?.miljo).mark, "#8A8595");
  const vatten = vattenytor(platsMed("sjon"))[0];
  assert.ok(vatten, "sjön har vatten");
  assert.ok(vatten!.storlek[0] * vatten!.storlek[1] >= 20, `sjöns vattenyta ska fylla vyn (${vatten!.storlek})`);
  const dropp = dekorFor(platsMed("grottan")).saker.filter((s) => s.ord === "droppsten");
  assert.ok(dropp.length >= 1);
  // R8-2b: inget tak ritas, så droppstenen står vänd på marken som stalagmit (svävade förut).
  for (const d of dropp) assert.ok(d.pos[1] === 0 && d.vand, `droppsten y=${d.pos[1]} ska stå vänd på marken`);
  assert.ok(!dekorFor(platsMed("sjon")).saker.some((s) => s.ord === "moln"), "moln borttagen (såg ut som svävande sten)");
});
