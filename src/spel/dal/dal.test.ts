import assert from "node:assert/strict";
import test from "node:test";
import { tolkaByggFormel } from "../../tolk/byggform.ts";
import { byggaPaAngen } from "./byggVal.ts";
import { DALEN, TOMTER, klampaMal, ledigTomt, naraTomt, tomtKarta } from "./tomter.ts";

test("Block 1: tomterna ligger utanför ängens mitt, dammen, skyltarna och stigarna och krockar inte", () => {
  assert.ok(TOMTER.length >= 16);
  const r = DALEN.tomt.radie;
  for (const [i, a] of TOMTER.entries()) {
    assert.ok(Math.abs(a.x) >= 3.3, `tomt ${i} för nära ängens mitt`);
    for (const [j, b] of TOMTER.entries()) if (i < j) assert.ok(Math.hypot(a.x - b.x, a.z - b.z) >= 2 * r + 0.2, `tomt ${i} och ${j} krockar`);
  }
  assert.ok(!naraTomt(1.12, -0.35), "dammen");
  assert.ok(!naraTomt(1.45, -2.65) && !naraTomt(-1.45, -2.6), "skyltarna");
});

test("Block 1: gamla byggen får lediga tomter i ordning, ingen tomt används två gånger, flytt behålls", () => {
  const byggen = [{ uid: "a" }, { uid: "b", tomt: 0 }, { uid: "c", tomt: 0 }, { uid: "d", tomt: 99 }];
  const k = tomtKarta(byggen);
  assert.equal(k.get("b"), 0);
  assert.equal(new Set(k.values()).size, 4);
  assert.equal(ledigTomt(byggen), 4);
  assert.equal(ledigTomt(byggen, 7), 7);
  assert.equal(ledigTomt(byggen, 0), 4);
  const fullt = TOMTER.map((_, i) => ({ uid: `x${i}`, tomt: i }));
  assert.equal(ledigTomt(fullt), null);
  assert.equal(tomtKarta([...fullt, { uid: "extra" }]).has("extra"), false);
});

test("Block 1: kamerans mål hålls inom dalen", () => {
  const [x, z] = klampaMal(99, -99);
  assert.equal(x, DALEN.kamera.x[1]);
  assert.equal(z, DALEN.kamera.z[0]);
});

test("Block 1: på ängen blir byggmeningar byggen, djur vinner och små naturord blir saker", () => {
  const ja = ["ett hus", "ett stall som ser ut som ett slott", "en lada", "en blomma av glas", "ett varmt hus åt kaninerna", "ett glittrigt slott"];
  const nej = ["en blomma", "ett träd", "en kanin och ett hus", "en katt", "en kanin med en svamp"];
  for (const f of ja) assert.ok(byggaPaAngen(tolkaByggFormel(f), f), f);
  for (const f of nej) assert.ok(!byggaPaAngen(tolkaByggFormel(f), f), f);
});

test("Block 7: låsta tomter fylls inte av nya byggen men gamla byggen får alltid plats", async () => {
  const { oppnaTomter, utbyggnadFor } = await import("./utbyggnad.ts");
  const oppna = oppnaTomter([]);
  assert.equal(oppna.size, 8);
  const atta = Array.from({ length: 8 }, (_, i) => ({ uid: `b${i}`, tomt: i }));
  assert.equal(ledigTomt(atta, null, oppna), null, "fullt på startmarken");
  assert.equal(ledigTomt(atta, 9, oppna), null, "en låst tomt går inte att välja");
  assert.equal(ledigTomt(atta, null, oppnaTomter(["backen"])), 8, "Kvarnbacken köpt");
  const gamla = Array.from({ length: 12 }, (_, i) => ({ uid: `g${i}` }));
  assert.equal(tomtKarta(gamla, oppna).size, 12, "en gammal sparfil med tolv byggen visar alla");
  assert.equal(utbyggnadFor(13)?.id, "stranden");
  assert.equal(utbyggnadFor(3), undefined);
});

// Block 3b: riktiga persistensfel och omladdning, med en isolerad minneslagring.
import { useMinne } from "../minne.ts";
import { exportera } from "../ui/hjalp.ts";
import { lasIn, spara } from "../minneSparning.ts";
import { lagringsStatus, tillatSkrivning } from "../lagring.ts";
import { useDal } from "./utbyggnad.ts";
import { ALDRE_MARK_NYCKEL } from "./markSparning.ts";

class MarkLagring {
  data = new Map<string, string>();
  nekarSkrivning = false;
  efterSkrivning: (() => void) | null = null;
  nekarMarklasning = false;
  skrivningar: { nyckel: string; json: string; stjarnorFore: number; markFore: string[] }[] = [];
  getItem(nyckel: string) {
    if (nyckel === ALDRE_MARK_NYCKEL && this.nekarMarklasning) throw new Error("SecurityError");
    return this.data.get(nyckel) ?? null;
  }
  setItem(nyckel: string, json: string) {
    if (this.nekarSkrivning) throw new Error("QuotaExceededError");
    this.skrivningar.push({ nyckel, json, stjarnorFore: useMinne.getState().stjarnor, markFore: [...useDal.getState().utbyggnader] });
    this.data.set(nyckel, json);
    this.efterSkrivning?.();
  }
}

function markProv(t: import("node:test").TestContext, huvud: unknown = { version: 2, ang: [], garden: [], stjarnor: 17, introSedd: true }, aldre: string | null = null) {
  const lagring = new MarkLagring();
  if (huvud !== null) lagring.data.set("trollpennan-v2", JSON.stringify(huvud));
  if (aldre !== null) lagring.data.set(ALDRE_MARK_NYCKEL, aldre);
  const originalState = useMinne.getState();
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  tillatSkrivning();
  // Förbered store innan window installeras, så förberedelsen inte själv sparas.
  useMinne.setState(lasIn(() => lagring));
  Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: lagring } });
  t.after(() => {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
    useMinne.setState(originalState, true);
    tillatSkrivning();
  });
  return lagring;
}

function lasOm(lagring: MarkLagring) {
  // Simulerar en ny sidvisning: modullivets skrivskydd nollställs, båda nycklarna läses på nytt.
  tillatSkrivning();
  return lasIn(() => lagring);
}

test("mark: äldre lokal mark migreras utan att ändra nyckeln eller förlora världen", (t) => {
  const aldre = JSON.stringify({ utbyggnader: ["backen"] });
  const lagring = markProv(t, { version: 2, ang: [], garden: [], stjarnor: 17, introSedd: true, rostPa: false, effektPa: true, lasnivaVal: 3 }, aldre);
  assert.deepEqual(useDal.getState().utbyggnader, ["backen"]);
  assert.equal(useMinne.getState().stjarnor, 17);
  assert.equal(spara(useMinne.getState()), true);
  assert.equal(lagring.data.get(ALDRE_MARK_NYCKEL), aldre, "legacyoriginalet lämnas orört");
  const igen = lasOm(lagring);
  assert.deepEqual(igen.dal, { utbyggnader: ["backen"] });
  assert.equal(igen.stjarnor, 17);
  assert.equal(igen.rostPa, false);
  assert.equal(igen.effektPa, true);
  assert.equal(igen.lasnivaVal, 3);
});

test("mark: ett köp sparar mark och debitering i exakt en v2-write före synlig mutation", (t) => {
  const aldre = JSON.stringify({ utbyggnader: [] });
  const lagring = markProv(t, undefined, aldre);
  assert.equal(useDal.getState().kop("backen"), true);
  assert.equal(lagring.skrivningar.length, 1);
  const skrivning = lagring.skrivningar[0]!;
  assert.equal(skrivning.nyckel, "trollpennan-v2");
  assert.equal(skrivning.stjarnorFore, 17);
  assert.deepEqual(skrivning.markFore, [], "UI-fasaden publiceras först efter skrivningen");
  assert.equal(JSON.parse(skrivning.json).stjarnor, 12);
  assert.deepEqual(JSON.parse(skrivning.json).dal, { utbyggnader: ["backen"] });
  assert.equal(useMinne.getState().stjarnor, 12);
  assert.deepEqual(useDal.getState().utbyggnader, ["backen"]);
  assert.equal(lagring.data.get(ALDRE_MARK_NYCKEL), aldre);
  const igen = lasOm(lagring);
  assert.equal(igen.stjarnor, 12);
  assert.deepEqual(igen.dal, { utbyggnader: ["backen"] });
});

test("mark: kvotfel och avbruten skrivning ändrar varken stjärnor, mark, original eller reloadresultat", (t) => {
  const lagring = markProv(t);
  const fore = useMinne.getState();
  const fasadFore = useDal.getState();
  const original = lagring.data.get("trollpennan-v2");
  lagring.nekarSkrivning = true;
  assert.equal(useDal.getState().kop("backen"), false);
  assert.equal(useMinne.getState(), fore);
  assert.equal(useDal.getState(), fasadFore);
  assert.equal(lagring.data.get("trollpennan-v2"), original);
  assert.equal(lagring.skrivningar.length, 0);
  assert.equal(lagringsStatus(), "otillganglig");
  const igen = lasOm(lagring);
  assert.equal(igen.stjarnor, 17);
  assert.deepEqual(igen.dal, { utbyggnader: [] });
});

test("mark: köpt utbyggnad debiteras inte igen och ogiltigt köp är utan mutation", (t) => {
  const lagring = markProv(t);
  assert.equal(useDal.getState().kop("backen"), true);
  const fore = useMinne.getState();
  for (const id of ["backen", "saknas"]) assert.equal(useDal.getState().kop(id), false);
  assert.equal(useMinne.getState(), fore);
  assert.equal(lagring.skrivningar.length, 1);
  useMinne.setState({ stjarnor: 7 });
  const fattig = useMinne.getState();
  assert.equal(useDal.getState().kop("stranden"), false);
  assert.equal(useMinne.getState(), fattig);
});

test("mark: korrupt eller oläsbar äldre mark skyddar båda originalen och blockerar köp", (t) => {
  const lagring = markProv(t);
  const original = lagring.data.get("trollpennan-v2");
  for (const aldre of ["{", "null", JSON.stringify({ utbyggnader: [3] })]) {
    lagring.data.set(ALDRE_MARK_NYCKEL, aldre);
    useMinne.setState(lasOm(lagring));
    assert.equal(lagringsStatus(), "skadad");
    assert.equal(useDal.getState().kop("backen"), false);
    assert.equal(lagring.data.get("trollpennan-v2"), original);
    assert.equal(lagring.data.get(ALDRE_MARK_NYCKEL), aldre);
  }
  lagring.nekarMarklasning = true;
  useMinne.setState(lasOm(lagring));
  assert.equal(lagringsStatus(), "otillganglig");
  assert.equal(useDal.getState().kop("backen"), false);
  assert.equal(lagring.data.get("trollpennan-v2"), original);
});

test("mark: korrupt nytt markfält faller inte tillbaka till äldre mark eller skrivs över", (t) => {
  const aldre = JSON.stringify({ utbyggnader: ["backen"] });
  const raw = { version: 2, ang: [], garden: [], stjarnor: 17, dal: { utbyggnader: "skadad" } };
  const lagring = markProv(t, raw, aldre);
  assert.equal(lagringsStatus(), "skadad");
  assert.deepEqual(useDal.getState().utbyggnader, []);
  assert.equal(useDal.getState().kop("stranden"), false);
  assert.equal(lagring.data.get("trollpennan-v2"), JSON.stringify(raw));
  assert.equal(lagring.data.get(ALDRE_MARK_NYCKEL), aldre);
});

test("mark: giltigt nytt huvudfält är auktoritativt även om den gamla marknyckeln är skadad", (t) => {
  const lagring = markProv(t, { version: 2, ang: [], garden: [], stjarnor: 17, dal: { utbyggnader: ["stranden"] } }, "{");
  assert.equal(lagringsStatus(), "ok");
  assert.deepEqual(useDal.getState().utbyggnader, ["stranden"]);
  assert.equal(useDal.getState().kop("backen"), true);
  assert.equal(lagring.data.get(ALDRE_MARK_NYCKEL), "{");
  assert.deepEqual(lasOm(lagring).dal, { utbyggnader: ["stranden", "backen"] });
});

test("mark: filimport blandar aldrig in den här profilens äldre lokala mark", (t) => {
  const aldre = JSON.stringify({ utbyggnader: ["backen"] });
  const lagring = markProv(t, undefined, aldre);
  assert.deepEqual(useDal.getState().utbyggnader, ["backen"]);
  const kopia = { version: 2, ang: [], garden: [], stjarnor: 23, rostPa: false, effektPa: true, lasnivaVal: 3 };
  assert.equal(useMinne.getState().importera({ ...kopia, dal: { utbyggnader: ["stranden"] } }), true);
  assert.deepEqual(exportera().dal, { utbyggnader: ["stranden"] });
  assert.deepEqual(lasOm(lagring).dal, { utbyggnader: ["stranden"] });
  assert.equal(useMinne.getState().importera(kopia), true, "äldre backup utan mark har tom standard, inte lokal legacy-mark");
  assert.deepEqual(useDal.getState().utbyggnader, []);
  const igen = lasOm(lagring);
  assert.deepEqual(igen.dal, { utbyggnader: [] });
  assert.equal(igen.stjarnor, 23);
  assert.equal(igen.rostPa, false);
  assert.equal(igen.effektPa, true);
  assert.equal(igen.lasnivaVal, 3);
  assert.equal(lagring.data.get(ALDRE_MARK_NYCKEL), aldre);
  const fore = useMinne.getState();
  assert.equal(useMinne.getState().importera({ ...kopia, dal: { utbyggnader: [null] } }), false);
  assert.equal(useMinne.getState(), fore);
});


test("mark: avbrott efter varaktig commit men före publicering har ett helt köp vid ny läsning", (t) => {
  const lagring = markProv(t);
  let vidCommit: { stjarnorSynliga: number; markSynlig: string[]; stjarnorLasta: number; markLast: string[] } | null = null;
  lagring.efterSkrivning = () => {
    // Avläs själva kraschgränsen medan setItem är färdig men publiceraSparat ännu inte har publicerat.
    const last = lasIn(() => lagring);
    vidCommit = { stjarnorSynliga: useMinne.getState().stjarnor, markSynlig: [...useDal.getState().utbyggnader], stjarnorLasta: last.stjarnor, markLast: last.dal.utbyggnader };
  };
  assert.equal(useDal.getState().kop("backen"), true);
  assert.deepEqual(vidCommit, { stjarnorSynliga: 17, markSynlig: [], stjarnorLasta: 12, markLast: ["backen"] });
});

test("mark: två olika köp och efterföljande vanlig autosparning bevarar båda köpen", (t) => {
  const lagring = markProv(t);
  assert.equal(useDal.getState().kop("backen"), true);
  assert.equal(useDal.getState().kop("stranden"), true);
  assert.equal(lagring.skrivningar.length, 2);
  assert.equal(useMinne.getState().stjarnor, 4);
  useMinne.getState().geStjarnor(2);
  assert.equal(lagring.skrivningar.length, 3, "vanliga ändringar sparas fortfarande");
  const igen = lasOm(lagring);
  assert.equal(igen.stjarnor, 6);
  assert.deepEqual(igen.dal, { utbyggnader: ["backen", "stranden"] });
});
