// P2: den guidade starten (data/forsta-stunden.json) och introts skrivscen (data/intro.json "skriv").
import { test } from "node:test";
import assert from "node:assert/strict";
import { FORSTA, aktivtSteg, malFor, rakna, senastRad, uppfyllt } from "./forstaStunden.ts";
import introJson from "../../data/intro.json" with { type: "json" };
import tangentbordJson from "../../data/tangentbord.json" with { type: "json" };

const album = (...k: string[]) => Object.fromEntries(k.map((x) => [x, { formel: `en ${x}`, poang: 1, niva: "vanlig", hjartan: 0 }]));

test("P2: rakna – lista, objekt, värde, tal, sant/falskt", () => {
  assert.equal(rakna([1, 2, 3]), 3);
  assert.equal(rakna({ a: "pagar", b: "klar" }), 2);
  assert.equal(rakna({ a: "pagar", b: "klar" }, "klar"), 1);
  assert.equal(rakna(4), 4);
  assert.equal(rakna(true), 1);
  assert.equal(rakna(undefined), 0);
});

test("P2: ingen guide före introt, första steget direkt efter", () => {
  assert.equal(aktivtSteg({ introSedd: false }), null);
  assert.equal(aktivtSteg({ introSedd: true, albumKropp: {} })?.steg.id, "forsta-ordet");
  // TTS-3: introts kanin OCH katt räknas inte – efter introt (två djur i albumet) börjar guiden med "skriv ett djur"
  assert.equal(aktivtSteg({ introSedd: true, albumKropp: album("kanin", "katt"), egnaDjur: 0 })?.steg.id, "forsta-ordet");
  assert.equal(aktivtSteg({ introSedd: true, albumKropp: album("kanin", "katt"), egnaDjur: 1 })?.steg.id, "bengtsson");
});

test("P2: stegen följer sparningen i ordning", () => {
  const bas = { introSedd: true, albumKropp: album("kanin", "katt"), egnaDjur: 1, uppdrag: {}, seddaIntro: [] };
  assert.equal(aktivtSteg(bas)?.steg.id, "bengtsson");
  assert.equal(aktivtSteg({ ...bas, uppdrag: { u1: "pagar" } })?.steg.id, "uppdraget");
  const klar = { ...bas, egnaDjur: 2, uppdrag: { u1: "klar" } };
  assert.equal(aktivtSteg(klar)?.steg.id, "tre-djur");
  assert.equal(aktivtSteg({ ...klar, egnaDjur: 4 })?.steg.id, "tre-djur");
  const fyra = { ...klar, egnaDjur: 5 };
  const g = aktivtSteg(fyra);
  assert.equal(g?.steg.id, "grinden");
  assert.equal(g?.nr, FORSTA.steg.length);
  assert.equal(aktivtSteg({ ...fyra, seddaIntro: ["skogen"] }), null);
});

test("P2: varje steg har text, mål och ett villkor på ett fält som finns i sparningen", () => {
  const falt = new Set(["egnaDjur", "albumKropp", "uppdrag", "seddaIntro", "ang", "funna", "oppnadePlatser", "stjarnor", "dragit"]);
  for (const s of FORSTA.steg) {
    assert.ok(s.text.trim() && s.id, s.id);
    assert.ok(falt.has(s.klart_nar.falt), `${s.id}: okänt fält ${s.klart_nar.falt}`);
    const m = malFor(s.pekar_pa);
    assert.ok(m.testid.length || m.ankare, s.id);
    assert.equal(uppfyllt(s.klart_nar, {}), false, `${s.id} får inte vara klart i en tom sparning`);
  }
});

test("P2: Fortsätt-raden visar senaste djuret", () => {
  assert.equal(senastRad({ ang: [{ formel: "en katt" }, { formel: "en blå kanin med hatt" }] }), "Senast väckte du en blå kanin med hatt.");
  assert.equal(senastRad({}), FORSTA.senast.tom);
});

test("P2: introts ord går att skriva på tangentbordet och frasen innehåller ordet", () => {
  const s = (introJson as { skriv?: { ord: string; fras: string } }).skriv;
  assert.ok(s, "intro.json saknar skriv");
  const tangenter = new Set((tangentbordJson as { rader: string[][] }).rader.flat());
  for (const b of s.ord) assert.ok(tangenter.has(b), `bokstaven ${b} saknas på tangentbordet`);
  assert.ok(s.fras.split(" ").includes(s.ord));
});
