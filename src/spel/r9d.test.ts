// R9D: ett uppdrag i taget (önskningar följer Bengtssons takt) och varje förslag klarar sitt eget uppdrag i den riktiga tolken.
import assert from "node:assert/strict";
import { test } from "node:test";
import { tolka } from "../tolk/tolka.ts";
import { tolkaMedReserv } from "../tolk/reserv.ts";
import { SKRIV } from "./aventyr.ts";
import { geTraff, kompisTraff, laggPa, ONSK } from "./onska.ts";
import { TAKT, kravUppfyllt, onskaFarKomma, sekTillRedo } from "./uppdragsmotor.ts";

const O = TAKT.onskan!;
const m = (djur: number, spelSek: number, sekSedanKlart: number | null, sekSedanOnska: number | null) => ({ djur, spelSek, sekSedanKlart, sekSedanOnska });

test("takt: ingen önskan före Bengtssons första regel, under hans uppdrag eller före hans första klara uppdrag", () => {
  assert.ok(O && O.mellan_sekunder >= 60 && O.efter_klart_sekunder > TAKT.mellan_sekunder);
  const a = SKRIV[0]!.id;
  assert.equal(onskaFarKomma({}, m(0, 10, null, null)), false, "ny spelare");
  assert.equal(onskaFarKomma({}, m(TAKT.forsta.efter_djur - 1, TAKT.forsta.eller_sekunder - 1, null, null)), false, "innan regeln");
  assert.equal(sekTillRedo({}, m(TAKT.forsta.efter_djur, 1, null, null)), 0, "Bengtsson bjuder in först");
  assert.equal(onskaFarKomma({}, m(TAKT.forsta.efter_djur, 999, null, null)), false, "inte samtidigt som Bengtssons första inbjudan");
  assert.equal(onskaFarKomma({ [a]: "pagar" }, m(9, 999, null, null)), false, "inte medan ett uppdrag pågår");
  assert.equal(onskaFarKomma({ [a]: "klar" }, m(9, 999, 5, null)), false, "luft efter klart uppdrag");
  assert.equal(onskaFarKomma({ [a]: "klar" }, m(9, 999, O.efter_klart_sekunder, 10)), false, "luft efter förra önskan");
  assert.equal(onskaFarKomma({ [a]: "klar" }, m(9, 999, O.efter_klart_sekunder, O.mellan_sekunder)), true);
  assert.equal(onskaFarKomma({ [a]: "klar" }, m(9, 999, null, null)), true, "klart i tidigare session");
});

const prep = new Set(["i", "vid", "under", "på", "bredvid", "bakom", "framför", "över", "ovanpå"]);

test("varje förslag i Bengtssons uppdrag klarar sitt uppdrag och blir djuret (inte ett ägg, inget ägg för i/vid/under/på)", () => {
  const fel: string[] = [];
  let n = 0;
  for (const u of SKRIV) {
    for (const g of u.val?.grupper ?? []) {
      for (const f of g.forslag) {
        n++;
        const r = tolkaMedReserv(f.fras, { kalla: "kort" });
        const v = r.typ === "skapad" ? r.varelse : null;
        const agg = (v?.reserv ?? []).map((x) => x.ord).filter((x) => prep.has(x));
        if (!u.krav || !kravUppfyllt(u.krav, f.fras)) fel.push(`${u.id}: "${f.fras}" klarar inte kravet`);
        else if (!v || v.kropp === "agg") fel.push(`${u.id}: "${f.fras}" blir ${r.typ}/${v?.kropp}`);
        else if (agg.length) fel.push(`${u.id}: "${f.fras}" ger ägg för ${agg.join(",")}`);
        if (!f.fras.toLowerCase().includes(f.ord.toLowerCase().slice(0, 4))) fel.push(`${u.id}: "${f.fras}" saknar ordet ${f.ord}`);
      }
    }
  }
  assert.ok(n > 0);
  assert.deepEqual(fel, []);
});

test("varje exempel i djurens önskningar uppfyller sin önskan (t.ex. 'lila' och 'mörkblå' för skymningshimlen)", () => {
  const fel: string[] = [];
  for (const o of ONSK.onskningar) {
    for (const ex of o.exempel) {
      if (o.typ === "ge") {
        const b = tolka(`en ${o.bara_for?.[0] ?? "kanin"}`, { kalla: "skriv" });
        const bas = b.typ === "skapad" ? b.varelse : null;
        const efter = bas ? laggPa(bas, ex) : null;
        if (!bas || !efter || !geTraff(bas, efter, o)) fel.push(`${o.id}: ${ex}`);
      } else {
        const r = tolka(ex, { kalla: "skriv" });
        if (r.typ !== "skapad" || !kompisTraff(r.varelse, o)) fel.push(`${o.id}: ${ex}`);
      }
    }
  }
  assert.deepEqual(fel, []);
});
