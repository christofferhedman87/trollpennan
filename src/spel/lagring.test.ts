import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { lasLokalt, skrivLokalt, normalisera, sakerJson, arDjur, arBygge, lagringsStatus, tillatSkrivning } from "./lagring.ts";
beforeEach(() => tillatSkrivning());
const bas = { version: 2, ang: [], garden: [], stjarnor: 0, startLage: "kort", ljudPa: true, mossaRakn: { onskan: 0, hemligt: 0, guld: 0 } };
test("tom lagring", () => assert.equal(lasLokalt(() => ({ getItem: () => null, setItem() {} })), null));
test("giltig äldre sparning", () => assert.equal(normalisera({ version: 1, stjarnor: 8 }, bas)?.version, 2));
test("ofullständig sparning får standardfält", () => assert.deepEqual(normalisera({ version: 2 }, bas), bas));
test("giltiga fält bevaras", () => assert.equal(normalisera({ version: 2, stjarnor: 42 }, bas)?.stjarnor, 42));
test("felaktig fälttyp ersätts", () => assert.deepEqual(normalisera({ version: 2, ang: null }, bas)?.ang, []));
test("okänd version avvisas", () => assert.equal(normalisera({ version: 3 }, bas), null));
test("null avvisas", () => assert.equal(normalisera(null, bas), null));
test("metodfält kopieras inte", () => assert.equal('importera' in normalisera({ version: 2, importera: 'skadad' }, bas)!, false));
test("prototypnyckel avvisas", () => assert.equal(sakerJson(JSON.parse('{"__proto__":{}}')), false));
test("icke ändliga tal avvisas", () => assert.equal(normalisera({ version: 2, stjarnor: Infinity }, bas), null));
test("nästlade räknare kompletteras", () => assert.deepEqual(normalisera({ version: 2, mossaRakn: { guld: 3 } }, bas)?.mossaRakn, { onskan: 0, hemligt: 0, guld: 3 }));
test("korrupt JSON kraschar inte", () => { assert.equal(lasLokalt(() => ({ getItem: () => '{', setItem() {} })), null); assert.equal(lagringsStatus(), 'skadad'); });
test("blockerad läsning kraschar inte", () => assert.equal(lasLokalt(() => { throw new Error('SecurityError'); }), null));
test("full lagring kraschar inte", () => assert.equal(skrivLokalt(() => ({ getItem: () => null, setItem() { throw new Error('QuotaExceededError'); } }), bas), false));
test("blockerad getter kraschar inte", () => assert.equal(skrivLokalt(() => { throw new Error('SecurityError'); }, bas), false));
test("lyckad skrivning använder v2", () => { tillatSkrivning(); let key = ''; assert.equal(skrivLokalt(() => ({ getItem: () => null, setItem(k) { key = k; } }), bas), true); assert.equal(key, 'trollpennan-v2'); });
test("giltigt djur accepteras", () => assert.equal(arDjur({ uid:'a', kropp:'drake', formel:'rosa drake', beskrivning:'en rosa drake', skapad:1, skala:1, alpha:1, formagor:[], tillbehor:[], overraskningar:[] }), true));
test("trasigt djur avvisas", () => assert.equal(arDjur({ uid:'a', kropp:'drake' }), false));
test("trasigt bygge avvisas", () => assert.equal(arBygge({ uid:'a', bygg:'hus', delar:null }), false));
test("giltigt bygge accepteras", () => assert.equal(arBygge({ uid:'a', bygg:'hus', formel:'hus', ord:'hus', x:.5, y:.5, antal:1, delar:[], boende:[] }), true));

test("korrupt original skrivs inte över", () => { lasLokalt(() => ({ getItem: () => '{', setItem() {} })); let skrivet = false; assert.equal(skrivLokalt(() => ({ getItem: () => null, setItem() { skrivet = true; } }), bas), false); assert.equal(skrivet, false); tillatSkrivning(); });

// Kopians tur genom JSON och import måste bevara hela den skapade världen, även utanför ängen.
import { useMinne, type Data } from "./minne.ts";
import { tom } from "./minneSparning.ts";
import { exportera } from "./ui/hjalp.ts";
import type { Sparad } from "./brygga.ts";
import type { SparatBygge } from "./bygge.ts";
import { skapaInstFranKopia } from "./skapa/installning.ts";

test("kopia: bokstavsljud bevarar av/på och äldre kopior har en definierad standard", () => {
  for (const bokstavsljud of [false, true]) {
    assert.deepEqual(skapaInstFranKopia(JSON.parse(JSON.stringify({ bokstavsljud }))), { bokstavsljud });
  }
  assert.deepEqual(skapaInstFranKopia(undefined), { bokstavsljud: true });
  for (const raw of [null, false, [], {}, { bokstavsljud: "false" }, { bokstavsljud: 0 }]) {
    assert.equal(skapaInstFranKopia(raw), null, "felaktig inställning ska avvisas före import");
  }
});

const kopiaDjur = (uid: string): Sparad => ({
  uid, skapad: 123, kropp: "kanin", formel: "en blå kanin", beskrivning: "en blå kanin",
  farg: "#0000ff", monster: "prickig", monsterfarg: "#ffffff", skala: 1.2, alpha: 1,
  kontur: true, glans: true, formagor: ["hoppar"], tillbehor: [{ id: "hatt", farg: "#ffff00", glans: false }],
  overraskningar: [{ effekt: "glitter", text: "Glittrande öron!" }], smeknamn: `Kanin ${uid}`,
});
const kopiaBygge = (uid: string): SparatBygge => ({
  uid, bygg: "stall", formel: "ett blått stall som ser ut som ett slott", ord: "stall", antal: 1,
  fargId: "bla", fargHex: "#0000ff", monster: null, material: "tra", x: .2, y: .4, tomt: 2,
  delar: [{ id: "fonster", antal: 2, fargHex: "#ffff00", material: "glas" }], boende: ["hemma"],
  storlekId: "stor", egenskaper: ["lyser"],
  form: { slag: "bygg", id: "slott", ord: "slott", genus: "ett", plural: "slott", hur: "bisats" },
});

function kopiaVarld(): Required<Data> {
  return {
    version: 2, startLage: "kort", startLageVald: true, funna: { kanin: { guld: true } }, kortGang: { kanin: 4 },
    onskelista: ["månkatt"], sovande: [kopiaDjur("sovande")], formler: [{ text: "en blå kanin", spec: kopiaDjur("formel") }],
    ang: [kopiaDjur("angen")], stjarnor: 17, dal: { utbyggnader: ["backen"] }, ljudPa: true, rostPa: false, effektPa: true,
    koptaSidor: ["skog"], byggSidor: ["start", "solgarden"], snart: { katt: ["dansar"] },
    garden: [kopiaBygge("stallet")], lada: [{ ...kopiaBygge("ladan"), boende: [], tomt: null }],
    hemma: [{ spec: kopiaDjur("hemma"), hem: "stallet" }],
    onskan: { id: "kull", kalla: "djur", uid: "angen", text: "Jag vill springa!", typ: "ge" },
    seddOnska: ["kull"], sidaKlar: ["start"], forstaGard: false, onskaVid: 6, oppna: ["skogen"],
    foljeUid: "angen", hjartan: { kanin: 2 }, van: ["vildkanin"], uppdrag: { skog: "klar", sjo: "pagar" },
    fyr: true, forstaKarta: false, klarOmraden: ["skogen"], dygnMs: 4321,
    liv: { angen: { humor: "glad", humorMs: 10, humorLangd: 20, favorit: "morot", favoritHittad: true, hjartan: 3 } },
    albumKropp: { kanin: { formel: "en blå kanin", poang: 5, niva: "guld", favorit: "morot", hjartan: 3, smeknamn: "Blåis" } },
    foton: [{ id: "foto1", formel: "en blå kanin", kropp: "kanin", niva: "guld", poang: 5, smeknamn: "Blåis" }],
    seddaNiva: ["guld"], mossaLista: [{ id: "skriva", klar: true }], mossaDag: 2, mossaExtra: true,
    mossaRakn: { onskan: 2, hemligt: 3, guld: 4 }, ordFrek: { kanin: 7 }, onskanAntal: 5, egnaDjur: 8,
    skatterHitta: ["skogskista"], byggda: ["stall"], introSedd: true, dragit: true, plats: "skogen",
    platsSkapelser: { skogen: [kopiaDjur("skog")], sjon: [kopiaDjur("sjo")], grottan: [kopiaDjur("grotta")] },
    oppnadePlatser: ["skogen", "sjon", "grottan"], seddaIntro: ["skogen", "sjon"], stall: [kopiaDjur("stall")],
    gataId: "lodjur", lasnivaVal: 3, solstjarnor: 12, albumNiva: { kanin: 3 }, vaktardjur: { skogen: { matad: 3, vackt: true } },
  } satisfies Required<Data>;
}

test("kopia: alla skapelser, framsteg och inställningar överlever JSON och import", (t) => {
  const original = useMinne.getState();
  t.after(() => useMinne.setState(original, true));
  const varld = kopiaVarld();
  useMinne.setState(varld);
  const kopia = JSON.parse(JSON.stringify(exportera())) as Required<Data>;
  assert.deepEqual(kopia, varld, "exporten måste innehålla hela världen, inklusive valfria framstegsfält");
  useMinne.setState(tom());
  assert.equal(useMinne.getState().importera(kopia), true);
  assert.deepEqual(exportera(), varld, "importen återställer skapelser på alla platser samt inställningar");
  assert.equal(typeof useMinne.getState().registrera, "function", "store-metoder får inte ersättas");
});

test("kopia: äldre v1/v2-kopior får standardfält utan att förlora sina djur eller stjärnor", (t) => {
  const original = useMinne.getState();
  t.after(() => useMinne.setState(original, true));
  useMinne.setState(kopiaVarld());
  for (const version of [1, 2]) {
    const aldre = { version, ang: [kopiaDjur("aldre")], garden: [], stjarnor: 4, introSedd: true };
    assert.equal(useMinne.getState().importera(JSON.parse(JSON.stringify(aldre))), true);
    assert.deepEqual(exportera(), { ...tom(), ...aldre, version: 2 });
  }
});

test("kopia: saknade valfria framstegsfält exporteras med befintliga standardvärden", (t) => {
  const original = useMinne.getState();
  t.after(() => useMinne.setState(original, true));
  useMinne.setState({ ...tom(), solstjarnor: undefined, albumNiva: undefined, vaktardjur: undefined });
  const kopia = JSON.parse(JSON.stringify(exportera())) as Required<Data>;
  assert.equal(kopia.solstjarnor, 0);
  assert.deepEqual(kopia.albumNiva, {});
  assert.deepEqual(kopia.vaktardjur, {});
  assert.equal(useMinne.getState().importera(kopia), true);
});

test("kopia: ogiltig version, trasiga skapelser och prototypdata ändrar inte världen", (t) => {
  const original = useMinne.getState();
  t.after(() => useMinne.setState(original, true));
  const varld = kopiaVarld();
  useMinne.setState(varld);
  const fore = useMinne.getState();
  for (const kopia of [
    null,
    { ...varld, version: 3 },
    { ...varld, ang: [{}] },
    { ...varld, stjarnor: "många" },
    { ...varld, ...JSON.parse('{"__proto__":{"skadad":true}}') },
  ]) {
    assert.equal(useMinne.getState().importera(kopia), false);
    assert.equal(useMinne.getState(), fore, "avvisad import ska lämna store orörd");
  }
  assert.deepEqual(exportera(), varld);
});


test("lagring: nekad getter skyddar ett läsbart original mot senare automatisk skrivning", () => {
  const original = JSON.stringify({ ...bas, stjarnor: 17 });
  let sparat = original;
  const frisk = { getItem: () => sparat, setItem(_k: string, v: string) { sparat = v; } };
  const nekad = { get localStorage(): typeof frisk { throw new Error("SecurityError"); } };
  assert.equal(lasLokalt(() => nekad.localStorage), null);
  assert.equal(lagringsStatus(), "otillganglig");
  assert.equal(skrivLokalt(() => frisk, bas), false);
  assert.equal(sparat, original);
});

test("lagring: ett övergående getItem-fel lämnar skrivspärren aktiv även efter lyckad läsning", () => {
  const original = JSON.stringify({ ...bas, stjarnor: 17 });
  let sparat = original;
  let nekar = true;
  const lagring = {
    getItem() { if (nekar) throw new Error("SecurityError"); return sparat; },
    setItem(_k: string, v: string) { sparat = v; },
  };
  assert.equal(lasLokalt(() => lagring), null);
  nekar = false;
  assert.deepEqual(lasLokalt(() => lagring), JSON.parse(original));
  assert.equal(skrivLokalt(() => lagring, bas), false);
  assert.equal(sparat, original);
  assert.equal(lagringsStatus(), "otillganglig");
});

test("lagring: giltig explicit import släpper spärren efter läsfel, ogiltig import behåller den", (t) => {
  const fore = useMinne.getState();
  t.after(() => useMinne.setState(fore, true));
  let sparat = JSON.stringify({ ...bas, stjarnor: 17 });
  const frisk = { getItem: () => sparat, setItem(_k: string, v: string) { sparat = v; } };
  lasLokalt(() => { throw new Error("SecurityError"); });
  assert.equal(useMinne.getState().importera({ version: 3, ang: [], garden: [], stjarnor: 23 }), false);
  assert.equal(skrivLokalt(() => frisk, bas), false, "avvisad import öppnar inte för automatisk sparning");
  const kopia = { version: 2, ang: [], garden: [], stjarnor: 23, introSedd: true };
  assert.equal(useMinne.getState().importera(kopia), true);
  assert.equal(skrivLokalt(() => frisk, exportera()), true);
  assert.equal(JSON.parse(sparat).stjarnor, 23);
  assert.equal(lagringsStatus(), "ok");
});

test("T-07: valfri relation överlever faktisk export/import och gammal v2 accepteras", (t) => {
  const original = useMinne.getState();
  t.after(() => useMinne.setState(original, true));
  const varld = kopiaVarld();
  for (const d of [varld.ang[0]!, varld.platsSkapelser.skogen![0]!, varld.sovande[0]!, varld.formler[0]!.spec]) {
    d.tillbehor = [{ id: "bord", farg: null, glans: false, relation: "under" }];
  }
  useMinne.setState(varld);
  const kopia = JSON.parse(JSON.stringify(exportera()));
  useMinne.setState(tom());
  assert.equal(useMinne.getState().importera(kopia), true);
  assert.deepEqual(exportera(), varld);
  const aldre = kopiaDjur("aldre");
  aldre.tillbehor = [{ id: "hatt", farg: null, glans: false }];
  assert.equal(useMinne.getState().importera({ version: 2, ang: [aldre], garden: [], stjarnor: 17 }), true);
  assert.deepEqual(useMinne.getState().ang[0]!.tillbehor, aldre.tillbehor);
  const fore = useMinne.getState();
  for (const relation of ["ovanpå", "", 3, null, {}, ["under"]]) {
    const fel = { ...aldre, tillbehor: [{ id: "bord", relation }] };
    assert.equal(useMinne.getState().importera({ version: 2, ang: [fel], garden: [], stjarnor: 17 }), false);
    assert.equal(useMinne.getState(), fore, "ogiltig relation får inte ändra världen");
  }
});


import { tolka } from "../tolk/tolka.ts";
test("T06: tillbehörets egna ord/egenskaper överlever v2-export/import och felaktig metadata avvisas atomärt", (t) => {
  const original = useMinne.getState(); t.after(() => useMinne.setState(original, true));
  const u = tolka("en kanin med kalla strumpor och solglasögon och glasögon");
  assert.equal(u.typ, "skapad"); if (u.typ !== "skapad") return;
  assert.equal(u.varelse.tillbehor[0]!.ord, "strumpa");
  assert.deepEqual(u.varelse.tillbehor[0]!.egenskaper, ["kalla"]);
  assert.deepEqual(u.varelse.tillbehor.slice(1).map((t) => t.ord), ["solglasögon", "glasögon"]);
  const varld = kopiaVarld();
  for (const d of [varld.ang[0]!, varld.hemma[0]!.spec, varld.platsSkapelser.skogen![0]!, varld.sovande[0]!, varld.formler[0]!.spec]) Object.assign(d, u.varelse);
  useMinne.setState(varld);
  const kopia = JSON.parse(JSON.stringify(exportera()));
  useMinne.setState(tom()); assert.equal(useMinne.getState().importera(kopia), true);
  assert.deepEqual(exportera(), varld);
  const fore = useMinne.getState();
  for (const [falt, fel] of [["ord", null], ["ord", 3], ["ord", {}], ["ord", []], ["egenskaper", null], ["egenskaper", "kall"], ["egenskaper", {}], ["egenskaper", [3]], ["egenskaper", [null]]]) {
    const trasig = JSON.parse(JSON.stringify(kopia)); trasig.ang[0].tillbehor[0][falt as string] = fel;
    assert.equal(useMinne.getState().importera(trasig), false, `${falt}: ${JSON.stringify(fel)}`);
    assert.equal(useMinne.getState(), fore);
  }
});
