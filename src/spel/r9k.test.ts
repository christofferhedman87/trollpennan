// R9K: idéraden visar aldrig svaret, enkla uppdragstexter, gåvorutan med djurets namn på alla platser,
// humörikon ur data, grottans stenar utan gröna toppar, repliker utan "ängen" på andra platser.
import assert from "node:assert/strict";
import { test } from "node:test";
import humor from "../../data/humor.json" with { type: "json" };
import ord from "../../data/ord.json" with { type: "json" };
import gard from "../../data/texter-gard.json" with { type: "json" };
import upplevelse from "../../data/upplevelse.json" with { type: "json" };
import { SKRIV } from "./aventyr.ts";
import { exempelFor, ideRad, visarKravord } from "./ideRad.ts";
import { HUMOR_IKON } from "./liv.ts";
import { dekorFor, spridDekor } from "./platsDekor.ts";
import { PLATSER, platsMed } from "./platser.ts";
import { platsText } from "./platsText.ts";
import { kravUppfyllt } from "./uppdragsmotor.ts";
import { gavoRuta } from "./ui/gavoRuta.ts";

test("R9K: idéraden innehåller aldrig kravorden (eller böjningar) i något uppdrag på någon plats, och inga dubbletter", () => {
  const platser = new Set<string>();
  for (const u of SKRIV) {
    platser.add(u.omrade);
    const rad = ideRad(u);
    const synligt = [rad?.rubrik ?? "", ...(rad?.grupper ?? []).flatMap((g) => [g.etikett, ...g.knappar.flatMap((k) => [k.visa, k.fyll])])];
    for (const t of synligt) assert.ok(!visarKravord(u.krav, t), `${u.id}: "${t}" visar ett kravord (${u.krav!.ord.join(", ")})`);
    const knappar = (rad?.grupper ?? []).flatMap((g) => g.knappar.map((k) => k.visa.toLocaleLowerCase("sv")));
    assert.equal(new Set(knappar).size, knappar.length, `${u.id}: dubbletter i idéraden`);
    for (const k of (rad?.grupper ?? []).flatMap((g) => g.knappar)) {
      assert.ok(!kravUppfyllt(u.krav!, k.fyll), `${u.id}: knappen "${k.visa}" löser uppdraget`);
      assert.ok(k.fyll.endsWith(" ") && k.visa.endsWith("…"), `${u.id}: knappen börjar bara meningen`);
    }
    // Exempelraden i boken (samma källa) läcker inte heller
    for (const e of exempelFor(u, upplevelse.examples)) assert.ok(!visarKravord(u.krav, e.visa) && !visarKravord(u.krav, e.fyll), `${u.id}: exemplet "${e.visa}"`);
  }
  for (const p of ["ang", "skogen", "sjon", "grottan"]) assert.ok(platser.has(p), `uppdrag på ${p} prövades`);
});

test("R9K: grottans 'en kanin med en lykta' blir 'en kanin med …', lykta syns inte och ingen knapp kommer två gånger", () => {
  const u = SKRIV.find((x) => x.id === "grotta-forsta-skenet")!;
  const knappar = ideRad(u)!.grupper.flatMap((g) => g.knappar);
  assert.ok(knappar.some((k) => k.visa === "en kanin med …" && k.fyll === "en kanin med "));
  assert.ok(knappar.every((k) => !/lykt/i.test(k.visa)));
  assert.equal(new Set(knappar.map((k) => k.visa)).size, knappar.length);
});

test("R9K: uppdragstexterna säger det konkret – inga ord om 'orden', 'skillnaden', 'farkosten' eller 'intill'", () => {
  const abstrakt = /dina ord|orden visa|låta orden|skillnaden|farkost|innanför kanterna|sitter högre|intill\b|möbelns|motsatser|binder ihop|innehållet/i;
  for (const u of SKRIV) {
    assert.doesNotMatch(u.text_bengtsson ?? "", abstrakt, `${u.id}: "${u.text_bengtsson}"`);
    const meningar = (u.text_bengtsson ?? "").split(/[.!?]+/).filter((m) => m.trim());
    for (const m of meningar) assert.ok(m.trim().split(/\s+/).length <= 17, `${u.id}: för lång mening "${m.trim()}"`);
  }
});

test("R9K: gåvorutan heter 'Vad vill du ge kaninen?' på ängen, gården och alla platser, utan mellanslag före frågetecknet", () => {
  const kanin = (uid: string) => ({ uid, kropp: "kanin", formel: "en kanin", beskrivning: "en kanin", skala: 1, alpha: 1, formagor: [], tillbehor: [], overraskningar: [], skapad: 1 }) as never;
  const platsSkapelser: Record<string, never[]> = {};
  for (const p of PLATSER) if (p.id !== "ang") platsSkapelser[p.id] = [kanin(`k-${p.id}`)];
  const s = { ang: [kanin("k-ang")], hemma: [{ spec: kanin("k-gard") }] as never[], platsSkapelser };
  assert.equal(gavoRuta("egen:k-ang", s), "Vad vill du ge kaninen?");
  assert.equal(gavoRuta("egen:k-gard", s), "Vad vill du ge kaninen?");
  for (const id of Object.keys(platsSkapelser)) assert.equal(gavoRuta(`egen:k-${id}`, s), "Vad vill du ge kaninen?", id);
  assert.equal(gavoRuta("egen:finns-inte", s), "Vad vill du ge?");
  const rav = { ...(kanin("r") as object), kropp: "rav", formel: "en orange räv" } as never;
  assert.equal(gavoRuta("egen:r", { ang: [], hemma: [], platsSkapelser: { grottan: [rav] } }), "Vad vill du ge räven?", "räv har kroppen rav");
  assert.ok(gavoRuta("mossugglan", s).startsWith("Vad vill du ge Mossugglan"));
});

test("R9K: humörikonen kommer ur data/humor.json, en per humör", () => {
  for (const h of humor.humor as { id: string; ikon?: string }[]) {
    assert.ok(h.ikon && h.ikon.length <= 4, `${h.id} saknar ikon i data`);
    assert.equal(HUMOR_IKON[h.id], h.ikon);
  }
});

test("R9K: grottans stenar har inga gröna toppar – materialfärg ur data/platser.json på dekor och startobjekt", () => {
  const g = platsMed("grottan")!;
  assert.ok(g.materialfarger?.grass, "grass har en färg");
  const gron = (hex: string) => {
    const [r, gg, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    return gg! > r! + 25 && gg! > b! + 25;
  };
  assert.ok(!gron(g.materialfarger!.grass!), "inte grönt");
  const sten = spridDekor(g).filter((r) => /klipp|sten/.test(r.url));
  assert.ok(sten.length >= 3 && sten.every((r) => r.farger?.grass === g.materialfarger!.grass), "dekorens stenar färgas");
  const start = dekorFor(g).saker.filter((s) => /klipp|sten/.test(s.kropp));
  assert.ok(start.length >= 2 && start.every((s) => s.farger?.grass === g.materialfarger!.grass), "startobjektens stenar färgas");
  assert.equal(spridDekor(platsMed("skogen")).every((r) => !r.farger), true, "skogen är orörd");
});

test("R9K: inga repliker säger 'ängen' rakt ut – platshållaren fylls med platsen barnet är på", () => {
  const repliker = [...Object.values(ord.repliker).flat(), ...gard.klapp.en, ...gard.klapp.mer, ...(humor.humor as { repliker: string[] }[]).flatMap((h) => h.repliker), ...humor.tack_text, ...humor.favorit_text];
  for (const r of repliker) assert.doesNotMatch(r, /ängen/i, r);
  assert.equal(platsText("{Platsen} är finast när du är här.", "ang", "grottan"), "Grottan är finast när du är här.");
  assert.equal(platsText("Ingen på hela {platsen} springer fortare än jag!", "ang", "sjon"), "Ingen på hela sjön springer fortare än jag!");
  assert.equal(platsText("{Platsen} är finast när du är här.", "ang", "ang"), "Ängen är finast när du är här.");
  assert.equal(platsText("{Platsen} är finast när du är här.", "gard", "ang"), "Gården är finast när du är här.");
  assert.equal(platsText("Hej!", "ang", "skogen"), "Hej!");
});
