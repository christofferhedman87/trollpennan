// Block 4b: förhandsvisningen på utflykterna räknar ut var skapelsen skulle hamna med samma regler som det verkliga
// skapandet (tak, sövning, placeringsregel) men ändrar ingenting. Den rena delen provas här; scenen och arket provas i
// webbläsaren med scripts/prov-platsforhand.mjs.
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { tolkaMedReserv } from "../tolk/reserv.ts";
import type { Varelse } from "../tolk/typer.ts";
import type { Sparad } from "./brygga.ts";
import { laggPaAngSpar } from "./minneSparning.ts";
import { placera } from "./placering.ts";
import { platsMed, TAK_PER_PLATS } from "./platser.ts";
import { forhandForPlats } from "./skapa/forhandTolk.ts";
import { HOLO_UID, platsForhand } from "./skapa/platsForhand.ts";

const PLATSER = ["skogen", "sjon", "grottan"] as const;
const varelse = (text: string): Varelse => {
  const u = tolkaMedReserv(text, { kalla: "kort" });
  assert.equal(u.typ, "skapad", `${text} tolkas som en skapelse`);
  return (u as { varelse: Varelse }).varelse;
};
const sparad = (v: Varelse, uid: string, skapad: number): Sparad => ({ ...v, uid, skapad });
const kopia = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

test("Varje utflykt ger kanin, fisk, fågel och sak ett läge med ring, höjd och krympning", () => {
  for (const id of PLATSER) {
    const plats = platsMed(id);
    for (const ord of ["en kanin", "en fisk", "en fågel", "en sten"]) {
      const f = platsForhand(plats, varelse(ord), [], []);
      assert.ok(f, `${id}: ${ord} får ett läge`);
      assert.equal(f.spec.uid, HOLO_UID);
      assert.ok(Number.isFinite(f.ring.x) && Number.isFinite(f.ring.z), `${id}: ${ord} ringen har koordinater`);
      assert.ok(f.ring.r >= 0.64 && f.ring.r <= 1.2, `${id}: ${ord} ringens radie som på ängen (0,8 × skala 0,8–1,5)`);
      assert.ok(f.krymp > 0 && f.krymp <= 1, `${id}: ${ord} krympningen är 0–1`);
    }
  }
});

test("Höjden följer rollen: marken 0, vattnet över ytan, fågeln i luftbandet", () => {
  const sjon = platsMed("sjon");
  const kanin = platsForhand(sjon, varelse("en kanin"), [], []);
  const fisk = platsForhand(sjon, varelse("en fisk"), [], []);
  const fagel = platsForhand(sjon, varelse("en fågel"), [], []);
  assert.ok(kanin && fisk && fagel);
  assert.equal(kanin.roll, "mark");
  assert.equal(kanin.y, 0);
  assert.equal(fisk.roll, "vatten");
  assert.ok(fisk.y > 0 && fisk.y < 0.5, `fisken svävar strax över vattenytan (${fisk.y})`);
  assert.equal(fagel.roll, "luft");
  assert.ok(fagel.y >= 1.6 && fagel.y <= 2.4, `fågeln ligger i luftbandet 1,6–2,4 (${fagel.y})`);
});

test("Förhandsvisningen hamnar där det verkliga skapandet skulle placera skapelsen", () => {
  for (const id of PLATSER) {
    const plats = platsMed(id);
    const lista = [sparad(varelse("en hund"), "a", 1), sparad(varelse("en katt"), "b", 2), sparad(varelse("en sten"), "c", 3)];
    const v = varelse("en kanin");
    const f = platsForhand(plats, v, lista, []);
    assert.ok(f);
    // Det verkliga flödet: laggPaAngSpar lägger till, placera räknar ut läget för den nya.
    const { patch, resultat } = laggPaAngSpar({ plats: id, platsSkapelser: { [id]: kopia(lista) }, sovande: [], ang: [] }, v, 1);
    const verklig = placera(patch.platsSkapelser![id]!, plats).get(resultat.nya[0]!.uid);
    assert.ok(verklig);
    assert.equal(f.ring.x, verklig.x, `${id}: x`);
    assert.equal(f.ring.z, verklig.z, `${id}: z`);
    assert.equal(f.y, verklig.y, `${id}: y`);
    assert.equal(f.krymp, verklig.krymp ?? 1, `${id}: krymp`);
    assert.equal(f.roll, verklig.roll, `${id}: roll`);
  }
});

test("Full lista: taket och sövningen räknas som i det verkliga skapandet, och den äldsta nämns", () => {
  const plats = platsMed("skogen");
  const lista = Array.from({ length: TAK_PER_PLATS }, (_, i) => sparad(varelse("en katt"), `k${i}`, i + 1));
  const f = platsForhand(plats, varelse("en kanin"), lista, []);
  assert.ok(f);
  const { resultat } = laggPaAngSpar({ plats: "skogen", platsSkapelser: { skogen: kopia(lista) }, sovande: [], ang: [] }, varelse("en kanin"), 1);
  assert.deepEqual(f.somnar, resultat.somnade.map((d) => d.uid), "samma skapelser somnar");
  assert.ok(f.somnar.length >= 1 && f.somnar.includes("k0"), "den äldsta somnar när platsen är full");
});

test("Förhandsberäkningen ändrar inte listan, de sovande eller något annat", () => {
  const plats = platsMed("sjon");
  const lista = Array.from({ length: TAK_PER_PLATS }, (_, i) => sparad(varelse("en hund"), `h${i}`, i + 1));
  const sovande = [sparad(varelse("en katt"), "s0", 0)];
  const fore = JSON.stringify({ lista, sovande });
  for (let i = 0; i < 3; i++) platsForhand(plats, varelse("en fisk"), lista, sovande);
  forhandForPlats("en fisk", plats, lista, sovande);
  assert.equal(JSON.stringify({ lista, sovande }), fore, "indata är orörda");
  assert.equal(lista.length, TAK_PER_PLATS);
});

test("Samma meningen ger samma läge varje gång, med samma nyckel (hologrammet ritas inte om)", () => {
  const plats = platsMed("grottan");
  const a = forhandForPlats("en blå fisk", plats, [], []);
  const b = forhandForPlats("en blå fisk", plats, [], []);
  assert.deepEqual(a, b);
  assert.equal(a.nyckel, `grottan:d:${a.spec?.typ === "djur" ? a.spec.spec.formel : ""}`);
  assert.equal(a.plats, "grottan");
});

test("Tom mening ger en tom ring, inget hologram", () => {
  const plats = platsMed("skogen");
  for (const text of ["", "   "]) {
    const f = forhandForPlats(text, plats, [], []);
    assert.equal(f.spec, null, `"${text}": inget hologram`);
    assert.ok(f.ring, `"${text}": ringen visar var ett djur skulle landa`);
    assert.equal(f.plats, "skogen");
  }
});

test("Ett okänt ord får samma reservskapelse som på ängen (ett ägg), så barnet ser samma sak överallt", async () => {
  const { forhandFor } = await import("./skapa/forhandTolk.ts");
  const ang = forhandFor("qwxz", [], [], new Set());
  for (const id of PLATSER) {
    const f = forhandForPlats("qwxz", platsMed(id), [], []);
    assert.equal(f.spec?.typ, "djur");
    assert.equal(f.spec?.typ === "djur" ? f.spec.spec.formel : "", ang.spec?.typ === "djur" ? ang.spec.spec.formel : "?", `${id}: samma tolkning som ängen`);
  }
});

test("Ett tomtbygge får inget lokalt bygghologram på utflykten (det hör till Hemdalen)", () => {
  for (const id of PLATSER) {
    const f = forhandForPlats("ett hus", platsMed(id), [], []);
    assert.notEqual(f.spec?.typ, "bygg", `${id}: inget bygghologram`);
    assert.equal(f.spec, null, `${id}: bara en tom ring`);
    assert.equal(f.plats, id);
  }
});

test("Okänd plats ger ingen förhandsvisning och krockar inte", () => {
  assert.equal(platsForhand(undefined, varelse("en kanin"), [], []), null);
  const f = forhandForPlats("en kanin", undefined, [], []);
  assert.equal(f.spec, null);
  assert.equal(f.ring, null);
});

test("Ängens förhandsvisning är oförändrad: ingen platsinformation i dess svar", async () => {
  const { forhandFor } = await import("./skapa/forhandTolk.ts");
  const f = forhandFor("en kanin", [], [], new Set());
  assert.equal(f.plats, undefined);
  assert.equal(f.y, undefined);
  assert.equal(f.spec?.typ, "djur");
});

test("Inkopplingen: arket och scenen använder platsens förhandsvisning, och ängen och utflykterna delar ring", () => {
  const hook = fs.readFileSync(new URL("./ui/skapa/useForhandArk.ts", import.meta.url), "utf8");
  assert.match(hook, /forhandForPlats\(text, pd, s\.platsSkapelser\[plats\] \?\? \[\], s\.sovande\)/, "platsens egen lista och sovande");
  assert.match(hook, /\[aktiv, arkRef, plats\]/, "byte av plats tömmer ringen (oppna(false) i städningen)");
  const ark = fs.readFileSync(new URL("./ui/skapa/SkapaArk.tsx", import.meta.url), "utf8");
  assert.match(ark, /useForhandArk\(arkRef, text, varld === "ang" && !omrade, plats\)/);
  const scen = fs.readFileSync(new URL("./ang/PlatsDekor.tsx", import.meta.url), "utf8");
  assert.match(scen, /<Trollring plats=\{plats\} \/>/, "PlatsScen ritar ringen och hologrammet");
  const ring = fs.readFileSync(new URL("./ang/Trollring.tsx", import.meta.url), "utf8");
  assert.match(ring, /l\.plats === plats/, "scenen ritar bara sin egen plats");
  assert.doesNotMatch(ring, /const ANG = platsMed\(START_PLATS\)/, "ritskalan är inte längre hårdkodad till ängen");
});
