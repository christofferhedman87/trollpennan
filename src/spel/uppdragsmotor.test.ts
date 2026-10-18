// R6A-2: kravkontrollen, Bengtssons miner och bilderna (data/npc.json, data/bengtsson.json, public/npc/).
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { tolkaMedReserv } from "../tolk/reserv.ts";
import { ALLA_UPPDRAG, SKRIV, UPP } from "./aventyr.ts";
import { NPC_DEL, mineUrl, valjMine } from "./npc.ts";
import { aktivtSkrivUppdrag, aventyrKvar, bengtssonLagen, kravTraffar, kravUppfyllt, nastaSkrivUppdrag, ordIText, ordTraffar, type Status } from "./uppdragsmotor.ts";

const krav = (id: string) => SKRIV.find((u) => u.id === id)!.krav!;
const rot = path.resolve(import.meta.dirname, "../../public");
const klarAlla: Status = Object.fromEntries(UPP.uppdrag.map((u) => [u.id, "klar" as const]));

test("ordTraffar: exakt, böjt och sammansatt, men korta ord bara exakt", () => {
  assert.ok(ordTraffar("filt", "filt"));
  assert.ok(ordTraffar("filten", "filt"));
  assert.ok(ordTraffar("ullmössa", "mössa"));
  assert.ok(!ordTraffar("tak", "ta") && !ordTraffar("takåsen", "tak"), "tre bokstäver eller färre: bara exakt");
  assert.ok(!ordTraffar("film", "filt"));
  assert.deepEqual(ordIText("En RÖD Filt, åäö!"), ["en", "röd", "filt", "åäö"]);
});

test("kravet läser det barnet skrev: ägg, böjning och sammansättning räknas, fel ord ger ingen träff", () => {
  const ja: [string, string][] = [
    ["kanin-fryser", "en filt"],
    ["kanin-fryser", "en kanin med ullmössa"],
    ["kanin-fryser", "en varm brasa"],
    ["kanin-fryser", "två filtar"],
    ["regn-skydd", "ett paraply"],
    ["regn-skydd", "en kanin med regnkappa"],
    ["regn-skydd", "ett stort hus"],
    ["sol-skugga", "en kanin med solhatt"],
    ["sol-skugga", "ett parasoll"],
  ];
  for (const [id, fras] of ja) {
    const u = tolkaMedReserv(fras);
    assert.equal(u.typ, "skapad", `${fras}: spelet skapar något (annars körs aldrig kontrollen)`);
    assert.ok(kravUppfyllt(krav(id), fras), `${id}: ${fras}`);
  }
  const nej: [string, string][] = [
    ["kanin-fryser", "en blå katt"],
    ["kanin-fryser", "en film"],
    ["regn-skydd", "en kanin"],
    ["sol-skugga", "en dator"],
    ["kanin-fryser", ""],
  ];
  for (const [id, fras] of nej) assert.ok(!kravUppfyllt(krav(id), fras), `${id}: ${fras}`);
  assert.deepEqual(kravTraffar({ ord: ["filt", "mössa"] }, "filt och mössa och filt"), ["filt", "mössa"]);
  assert.ok(!kravUppfyllt({ ord: ["filt", "mössa"], min: 2 }, "filt"), "min 2 kräver två olika ord");
});

test("data: skriv-uppdragen följer reglerna och krockar inte med äventyrsuppdragen", () => {
  assert.equal(SKRIV.length, 3);
  assert.equal(new Set(ALLA_UPPDRAG.map((u) => u.id)).size, ALLA_UPPDRAG.length, "id:n är unika");
  for (const u of SKRIV) {
    assert.equal(u.givare, "bengtsson");
    assert.equal(u.omrade, "ang");
    assert.equal(u.typ, "skriv");
    assert.equal(u.granskad, false, `${u.id}: utkast tills Copilot granskat`);
    assert.ok(u.text_bengtsson!.length <= 130 && u.klart_bengtsson!.length <= 100, u.id);
    assert.ok(u.krav!.ord.length >= 8, `${u.id}: rimligt många godkända ord`);
    assert.ok(u.stjarnor >= 1);
    assert.ok(!kravUppfyllt(u.krav!, u.text_bengtsson!), `${u.id}: ledtråden läcker inte svaret`);
  }
  assert.equal(SKRIV[0]!.text_bengtsson, "Det verkar som att din kanin fryser. Se om du kan skriva fram något som värmer.", "Christoffers egen formulering, oförändrad");
});

test("motorns lägen: nästa, aktivt, bara äventyr, allt klart", () => {
  assert.equal(nastaSkrivUppdrag({})?.id, "kanin-fryser");
  assert.equal(aktivtSkrivUppdrag({}), undefined);
  assert.equal(aktivtSkrivUppdrag({ "regn-skydd": "pagar" })?.id, "regn-skydd");
  assert.deepEqual(bengtssonLagen({}), []);
  assert.deepEqual(bengtssonLagen({ "kanin-fryser": "pagar" }), ["pagar"]);
  const skrivKlara: Status = { "kanin-fryser": "klar", "regn-skydd": "klar", "sol-skugga": "klar" };
  assert.ok(aventyrKvar(skrivKlara));
  assert.deepEqual(bengtssonLagen(skrivKlara), ["bara_aventyr"]);
  assert.deepEqual(bengtssonLagen({ ...skrivKlara, ...klarAlla }), ["alla_klara"]);
});

test("miner: reglerna i data/npc.json styr bilden, första träff vinner, annars standard", () => {
  assert.equal(valjMine("bengtsson", []), "framsida");
  assert.equal(valjMine("bengtsson", ["pagar"]), "tankande");
  assert.equal(valjMine("bengtsson", ["klar_nyss", "pagar"]), "glad");
  assert.equal(valjMine("bengtsson", ["fel", "klar_nyss", "pagar"]), "automat");
  assert.equal(valjMine("bengtsson", ["bara_aventyr"]), "karta");
  assert.equal(valjMine("bengtsson", ["alla_klara"]), "solbrand");
  assert.equal(valjMine("bengtsson", ["okant_lage"]), "framsida");
  assert.equal(valjMine("finns-inte", ["pagar"]), "");
  assert.equal(mineUrl("bengtsson", "framsida"), "/npc/bengtsson/framsida.webp");
});

test("bilder: varje mine pekar på en fil som finns, är WebP och ryms i budgeten", () => {
  let summa = 0;
  for (const [id, f] of Object.entries(NPC_DEL)) {
    assert.ok(f.bilder[f.standard], `${id}: standardminen finns bland bilderna`);
    for (const m of f.miner) assert.ok(f.bilder[m.bild], `${id}: regeln ${m.lage} pekar på okänd bild ${m.bild}`);
    for (const [mine, url] of Object.entries(f.bilder)) {
      const fil = path.join(rot, url);
      assert.ok(fs.existsSync(fil), `${id}/${mine}: ${url} saknas`);
      const b = fs.readFileSync(fil);
      assert.equal(b.subarray(0, 4).toString(), "RIFF", `${url} är inte WebP`);
      assert.equal(b.subarray(8, 12).toString(), "WEBP", `${url} är inte WebP`);
      assert.ok(b.length <= 60 * 1024, `${url}: ${Math.round(b.length / 1024)} KB, budget 60 KB per bild`);
      summa += b.length;
    }
  }
  const ovr = fs.readdirSync(path.join(rot, "npc/ovrigt")).reduce((s, n) => s + fs.statSync(path.join(rot, "npc/ovrigt", n)).size, 0);
  assert.ok(summa + ovr <= 700 * 1024, `npc-bilderna ${Math.round((summa + ovr) / 1024)} KB, budget 700 KB`);
  const bengt = Object.values(NPC_DEL.bengtsson!.bilder).reduce((s, u) => s + fs.statSync(path.join(rot, u)).size, 0);
  assert.ok(bengt <= 400 * 1024, `Bengtssons åtta miner ${Math.round(bengt / 1024)} KB, budget 400 KB`);
});

// R6A-3: guidande val. Knapparna hjälper, fritext är kvar, och varje förslag klarar uppdraget och får spelet att skapa något.
test("guidande val: varje skriv-uppdrag har förslag, och varje förslag uppfyller kravet och skapar något", () => {
  for (const u of SKRIV) {
    assert.ok(u.val, `${u.id} saknar val`);
    const forslag = u.val!.grupper.flatMap((g) => g.forslag);
    assert.ok(u.val!.grupper.length >= 1 && forslag.length >= 3 && forslag.length <= 8, `${u.id}: några få knappar`);
    for (const g of u.val!.grupper) assert.ok(g.etikett && g.forslag.length >= 1 && g.forslag.length <= 4, `${u.id}/${g.etikett}`);
    for (const f of forslag) {
      assert.ok(kravUppfyllt(u.krav!, f.fras), `${u.id}: förslaget "${f.fras}" klarar inte kravet`);
      assert.ok(ordIText(f.fras).includes(f.ord), `${u.id}: knappen "${f.ord}" står inte i "${f.fras}"`);
      assert.equal(tolkaMedReserv(f.fras).typ, "skapad", `${u.id}: "${f.fras}" ger inget djur, då körs kontrollen aldrig`);
    }
    assert.equal(new Set(forslag.map((f) => f.fras)).size, forslag.length, `${u.id}: dubbletter`);
    assert.ok(u.krav!.ord.length >= 8, `${u.id}: fritext räknas fortfarande (kravlistan är kvar)`);
  }
});
