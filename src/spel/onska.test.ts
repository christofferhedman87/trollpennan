import assert from "node:assert/strict";
import test from "node:test";
import { ordLista, tolka } from "../tolk/tolka.ts";
import { tolkaByggFormel } from "../tolk/byggform.ts";
import { byggTraff, gePassar, geTraff, kompisTraff, laggPa, ONSK, ONSK_BYGG } from "./onska.ts";
import { taggarAv } from "./taggar.ts";
import { djurMedUid, uppdateraDjurSpar } from "./minneDjur.ts";
import { harKvittoAndring } from "./skapa/kvittoSkapelser.ts";
import { hamtaOnskeMiss, noteraOnskeMiss, tystaBannrar } from "./skapa/kvitto.ts";
import { kvittotack } from "./skapa/tack.ts";
import type { OnskaSpar } from "./minne.ts";
import type { Varelse } from "../tolk/typer.ts";

function katt(): Varelse {
  const u = tolka("katt");
  if (u.typ !== "skapad") throw new Error("katt");
  return u.varelse;
}

test("varje bygg-exempel uppfyller sin önskan", () => {
  for (const o of ONSK_BYGG.onskningar) {
    for (const mall of o.exempel) {
      const ex = mall.replace("{djur}", "en kanin");
      // En värld: spelet tolkar byggmeningar med byggformeln (form och egenskaper), som omfattar byggtolken.
      const u = tolkaByggFormel(ex);
      assert.equal(u.typ, "bygge", `${o.id}: ${ex}`);
      if (u.typ !== "bygge") continue;
      const kropp = o.krav.hem_for_djuret ? "katt" : o.krav.form_som_djuret ? "kanin" : o.krav.bara_for?.[0];
      assert.ok(byggTraff(u.byggen, o, kropp), `${o.id} exempel "${ex}"`);
    }
  }
});

test("varje djur-exempel uppfyller sin önskan", () => {
  const bas = katt();
  for (const o of ONSK.onskningar) {
    for (const ex of o.exempel) {
      if (o.typ === "ge") {
        const efter = laggPa(bas, ex);
        assert.ok(efter, `${o.id} gick inte att lägga ${ex}`);
        if (!efter) continue;
        assert.ok(geTraff(bas, efter, o), `${o.id} exempel "${ex}"`);
      } else {
        const u = tolka(ex);
        assert.equal(u.typ, "skapad", ex);
        if (u.typ !== "skapad") continue;
        assert.ok(kompisTraff(u.varelse, o), `${o.id} exempel "${ex}"`);
      }
    }
  }
});


test("frusna tassar behöver värme på tassarna, även om djuret redan har hatt", () => {
  const o = ONSK.onskningar.find((o) => o.id === "frusna-tassar")!;
  for (const fras of ["katt", "katt med hatt"]) {
    const u = tolka(fras); assert.equal(u.typ, "skapad"); if (u.typ !== "skapad") continue;
    assert.ok(gePassar(u.varelse, o), fras);
    for (const [tillagg, ok] of [["med strumpor", true], ["med stövlar", true], ["med tofflor", true], ["med hatt", false], ["med halsduk", false], ["som sprutar eld", false]] as const) {
      const efter = laggPa(u.varelse, tillagg); assert.ok(efter, tillagg);
      assert.equal(geTraff(u.varelse, efter, o), ok, `${fras} + ${tillagg}`);
    }
  }
  const varm = laggPa(katt(), "med strumpor")!;
  assert.equal(gePassar(varm, o), false, "redan varma tassar får ingen sådan önskan");
});

test("frusna öron får rätt regional värme", () => {
  const o = ONSK.onskningar.find((o) => o.id === "frusna-oron")!;
  const bas = katt();
  for (const [fras, ok] of [["med mössa", true], ["med röd mössa", true], ["med luva", true], ["med röd luva", true], ["med kall mössa", false], ["med strumpor", false], ["med halsduk", false], ["med hatt", false]] as const) {
    const efter = laggPa(bas, fras); assert.ok(efter, fras);
    assert.equal(geTraff(bas, efter, o), ok, fras);
  }
});

test("kompisönskan kräver ett djur och avvisar saker", () => {
  const o = ONSK.onskningar.find((o) => o.id === "ensam")!;
  for (const [fras, ok] of [["en kanin", true], ["en hund", true], ["en robot", true], ["en räv", true], ["ett får", true], ["en örn", true], ["en isbjörn", true], ["en sköldpadda", true], ["en boll", false], ["en stol", false]] as const) {
    const u = tolka(fras); assert.equal(u.typ, "skapad"); if (u.typ !== "skapad") continue;
    assert.equal(kompisTraff(u.varelse, o), ok, fras);
  }
});


test("solskydd, synhjälp och resa skiljer på vad saken faktiskt gör", () => {
  const bas = katt();
  for (const [id, ja, nej] of [
    ["stark-sol", ["med hatt", "med solglasögon"], ["med glasögon", "med ryggsäck"]],
    ["suddigt", ["med glasögon", "med röda glasögon"], ["med solglasögon", "med hatt"]],
    ["resa", ["som flyger", "som simmar", "med vingar"], ["med ryggsäck", "som springer snabbt"]],
  ] as const) {
    const o = ONSK.onskningar.find((o) => o.id === id)!;
    for (const [fraser, ok] of [[ja, true], [nej, false]] as const) for (const fras of fraser) {
      const efter = laggPa(bas, fras); assert.ok(efter, fras);
      assert.equal(geTraff(bas, efter, o), ok, `${id}: ${fras}`);
    }
  }
});


test("önskans uid ändrar rätt djur på ängen, i hemmet och på utflykten utan att skriva över andra", () => {
  const d = (uid: string) => ({ ...katt(), uid, skapad: 123, smeknamn: "Maja" });
  const fore = { ang: [d("ang")], hemma: [{ spec: d("hem"), hem: "huset" }], platsSkapelser: { sjon: [d("sjon")], skogen: [d("skogen")] }, garden: [] };
  const sparat = JSON.stringify(fore);
  for (const uid of ["ang", "hem", "sjon", "skogen"]) {
    const tillagg = laggPa(djurMedUid(fore, uid)!, "med strumpor")!;
    const r = uppdateraDjurSpar(fore, uid, tillagg)!; assert.ok(r, uid);
    const efter = { ...fore, ...r.patch };
    assert.equal(r.djur.uid, uid); assert.equal(r.djur.skapad, 123); assert.equal(r.djur.smeknamn, "Maja");
    assert.ok(djurMedUid(efter, uid)!.tillbehor.some((t) => t.id === "strumpa"));
    for (const annan of ["ang", "hem", "sjon", "skogen"].filter((u) => u !== uid)) assert.deepEqual(djurMedUid(efter, annan), djurMedUid(fore, annan));
    assert.ok(harKvittoAndring(fore, efter), `${uid} får också kvitto`);
    assert.equal(JSON.stringify(fore), sparat, "föregående sparvärld lämnas orörd");
  }
  assert.equal(uppdateraDjurSpar(fore, "finns-inte", katt()), null);
  assert.equal(harKvittoAndring(fore, fore), false);
});

test("nära miss ger bara den faktiskt bedömda önskans ledtråd, inte en annan eller ett gammalt försök", () => {
  const o = ONSK.onskningar.find((o) => o.id === "frusna-tassar")!;
  const onskan: OnskaSpar = { id: o.id, uid: "Maja", text: o.text, kalla: "djur", typ: o.typ };
  const miss = { id: o.id, uid: "Maja", nastan: o.nastan! };
  assert.equal(kvittotack(onskan, onskan, null, miss), o.nastan);
  assert.equal(kvittotack(onskan, onskan, null, { ...miss, uid: "annan" }), null);
  assert.equal(kvittotack(onskan, onskan, null, { ...miss, id: "annan" }), null);
  assert.equal(kvittotack(onskan, null, null, miss), o.tack);
  tystaBannrar(true); noteraOnskeMiss(miss); tystaBannrar(false);
  assert.deepEqual(hamtaOnskeMiss(), miss);
  tystaBannrar(true); tystaBannrar(false);
  assert.equal(hamtaOnskeMiss(), null);
  noteraOnskeMiss(miss); assert.equal(hamtaOnskeMiss(), null, "direktvägen lämnar inget gammalt kvittosvar");
});

test("alla djurönskningar har en egen läsbar ledtråd och minst två provade hjälpfraser", () => {
  for (const o of ONSK.onskningar) {
    assert.ok(o.nastan && o.nastan.length > 12, o.id);
    assert.ok(new Set(o.exempel).size >= 2, o.id);
  }
});


test("vanliga glasögon hjälper även efter solglasögon, med och utan äldre v2-metadata", () => {
  const o = ONSK.onskningar.find((o) => o.id === "suddigt")!;
  const sol = laggPa(katt(), "med solglasögon")!;
  for (const fore of [sol, { ...sol, tillbehor: sol.tillbehor.map(({ id, farg, glans }) => ({ id, farg, glans })) }]) {
    assert.ok(gePassar(fore, o));
    const efter = laggPa(fore, "med glasögon")!;
    assert.equal(geTraff(fore, efter, o), true, efter.formel);
    const gammal = { ...efter, tillbehor: efter.tillbehor.map(({ id, farg, glans }) => ({ id, farg, glans })) };
    assert.equal(geTraff(fore, gammal, o), true, "äldre v2 med två tillbehör som delar modell");
  }
});

test("uttryckligen kalla plagg värmer inte, men senare varma plagg kan lösa önskan", () => {
  for (const [id, kallt, varmt] of [["frusna-tassar", "med kalla strumpor", "med varma strumpor"], ["frusna-oron", "med kall luva", "med varm luva"]] as const) {
    const o = ONSK.onskningar.find((o) => o.id === id)!;
    const bas = katt(); const kall = laggPa(bas, kallt)!;
    assert.equal(geTraff(bas, kall, o), false, kallt);
    const legacy = { ...kall, tillbehor: kall.tillbehor.map(({ id, farg, glans }) => ({ id, farg, glans })) };
    assert.equal(geTraff(bas, legacy, o), false, "äldre v2 följer också sitt uttryckliga ord kall");
    assert.ok(gePassar(kall, o));
    assert.equal(geTraff(kall, laggPa(kall, varmt)!, o), true, varmt);
  }
});


test("kompisar använder kroppens interna id för alla faktiskt skapade djurord", () => {
  const o = ONSK.onskningar.find((o) => o.id === "ensam")!;
  let antal = 0;
  for (const ord of ordLista().filter((o) => o.klass === "djur")) {
    const u = tolka(`${ord.genus === "n" ? "ett" : "en"} ${ord.visa}`);
    if (u.typ !== "skapad") continue;
    assert.ok(kompisTraff(u.varelse, o), `${ord.visa} → ${u.varelse.kropp}`); antal++;
  }
  assert.ok(antal > 50, "provet täcker den riktiga djurordlistan");
});

test("äldre kvarstående tassönskan går att lösa med ett korrekt svar men inte med hatt", () => {
  const o = ONSK.onskningar.find((o) => o.id === "frusna-tassar")!;
  const varm = laggPa(katt(), "med strumpor")!;
  const legacy = { ...varm, tillbehor: varm.tillbehor.map(({ id, farg, glans }) => ({ id, farg, glans })) };
  for (const [fras, ok] of [["med strumpor", true], ["med stövlar", true], ["med hatt", false], ["med kalla strumpor", false]] as const) {
    assert.equal(geTraff(legacy, laggPa(legacy, fras)!, o, fras), ok, fras);
  }
});


test("äldre tillbehör läses utan mutation eller lagringsskrivning", (t) => {
  const gamla = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  let skrivningar = 0;
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: () => null, setItem: () => { skrivningar++; } } });
  t.after(() => { if (gamla) Object.defineProperty(globalThis, "localStorage", gamla); else Reflect.deleteProperty(globalThis, "localStorage"); });
  const d = laggPa(katt(), "med kalla strumpor och solglasögon och glasögon")!;
  const legacy = { ...d, tillbehor: d.tillbehor.map(({ id, farg, glans }) => ({ id, farg, glans })) };
  const sparat = JSON.stringify(legacy);
  for (let i = 0; i < 2; i++) {
    const taggar = taggarAv(legacy, false);
    assert.ok(taggar.has("sol") && taggar.has("se") && taggar.has("kall"));
    assert.equal(taggar.has("varm:tassar"), false);
  }
  assert.equal(JSON.stringify(legacy), sparat); assert.equal(skrivningar, 0);
});
