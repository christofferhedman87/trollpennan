// F4: värmeplagg på djuret som redan står på ängen, och en klickbar 3D-Bengtsson inom 375×812.
import { normaliseraPlaggId, plaggModellUrl } from "./modeller/plaggModell.ts";
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import * as THREE from "three";
import plaggJson from "../../data/plagg.json" with { type: "json" };
import tillbehorJson from "../../data/tillbehor.json" with { type: "json" };
import tillgangarJson from "../../data/tillgangar.json" with { type: "json" };
import placeringJson from "../../data/placering.json" with { type: "json" };
import type { TillbehorSpec, Varelse } from "../tolk/typer.ts";
import { ENTITETER, modellUrl } from "./entiteter.ts";
import { useMinne } from "./minne.ts";
import { arVarmePlagg, mossaPaFrysKanin, mossaPaKanin } from "./mossaKanin.ts";
import { arVarmePlagg as arVarmeStyr, mossaPaFrysKanin as mossaStyr } from "./styr/mossaKanin.ts";
import { tolka } from "../tolk/tolka.ts";
import { faestPlaggKlon, faestTillbehor } from "./tillbehor/faest.ts";
import { plaggKonfig } from "./tillbehor/data.ts";

const las = (fil: string) => fs.readFileSync(fil, "utf8");

function varelse(kropp: string, tillbehor: TillbehorSpec[] = [], farg: string | null = null): Varelse {
  return {
    kropp,
    farg,
    monster: null,
    monsterfarg: null,
    formagor: [],
    tillbehor,
    skala: 1,
    alpha: 1,
    kontur: false,
    glans: false,
    formel: kropp,
    beskrivning: kropp,
    overraskningar: [],
  };
}

const plagg = (id: string, farg: string | null = null): TillbehorSpec => ({ id, farg, glans: false });

test("F4: kalibrering, modeller, Bengtsson och datainvarianter", () => {
  const kalib = JSON.parse(las("rundor/F4-F5-3d-plagg-vuxenlas/matt/kalibrering-f4.json"));
  const ny = kalib.bengtsson?.ny;
  assert.ok(ny, "bengtsson.ny");
  assert.ok(ny.minX >= 18 && ny.maxX <= 135 && ny.offscreenLeftRatio === 0, `${ny.minX}..${ny.maxX}`);
  assert.ok(kalib.bengtsson3D?.efter?.pos);
  assert.ok(kalib.plaggKalibrering?.kanin?.mossa);

  const tillgångar = (tillgangarJson as unknown as { tillgangar: Record<string, { fil?: string }> }).tillgangar;
  assert.equal(tillgångar.alvmossa?.fil, "/models/bulk/f-mossa-vinter-cc0.glb");
  assert.equal(tillgångar.luva?.fil, "/models/bulk/f-mossa-toppluva-cc0.glb");
  assert.equal(tillgångar.filt?.fil, "/models/bulk/f-filt-vikt-cc0.glb");
  for (const rel of [
    "/models/bulk/f-mossa-vinter-cc0.glb",
    "/models/bulk/f-mossa-toppluva-cc0.glb",
    "/models/bulk/f-halsduk-cc0.glb",
    "/models/bulk/f-filt-draperad-cc0.glb",
    "/models/bulk/f-filt-vikt-cc0.glb",
  ]) {
    assert.equal(fs.existsSync("public" + rel), true, rel);
  }

  const rader = (plaggJson as { plagg: Record<string, unknown> }).plagg;
  assert.equal(typeof rader.mossa, "string");
  assert.equal(rader.mossa, "huvud");
  assert.equal(rader["mössa"], "huvud");
  const hals = plaggKonfig("halsduk");
  const filt = plaggKonfig("filt");
  const troja = plaggKonfig("troja");
  assert.equal(hals?.ankare, "hals");
  assert.equal(hals?.par, "hals");
  assert.equal(hals?.skala, 1.05);
  assert.equal(filt?.ankare, "rygg");
  assert.equal(filt?.par, "rygg");
  assert.equal(filt?.skala, 1.25);
  assert.equal(troja?.skala, 1.48);
  assert.equal(troja?.djupSkala, 3.4);
  assert.equal(troja?.fram, 0.78);
  assert.equal(troja?.par, "kropp");

  const medModell = Object.keys(ENTITETER).filter((id) => ENTITETER[id]?.typ === "tillbehor" && !!modellUrl(id));
  assert.equal(medModell.length, 38);
  assert.equal(Object.prototype.hasOwnProperty.call((tillbehorJson as { tillbehor: object }).tillbehor, "mössa"), false);

  const ang = las("src/spel/ang/Bengtsson3D.tsx");
  assert.equal(ang.includes("boxGeometry"), false);
  assert.equal(ang.includes("BoxGeometry"), false);
  assert.match(ang, /position=\{\[-1\.45, 0, 1\.50\]\}/);
  assert.match(ang, /rotation=\{\[0, 0\.32, 0\]\}/);
  assert.match(ang, /scale=\{1\.0\}/);
  assert.match(ang, /rotation\.y = 0\.32 \+ Math\.sin\(t \* 0\.9\) \* 0\.06/);
  assert.match(ang, /cylinderGeometry args=\{\[0\.55, 0\.55, 1\.60, 12\]\}/);
  assert.match(ang, /visible=\{false\}/);

  const om = las("src/spel/Bengtsson3D.tsx");
  assert.match(om, /from "\.\/ang\/Bengtsson3D\.tsx"/);
  assert.match(om, /-1\.45/);
  assert.match(om, /onClick/);
  assert.match(om, /boxGeometry args=\{\[1\.05, 1\.60, 0\.75\]\}/);

  const vy = las("src/spel/ui/SpelVy.tsx");
  assert.match(vy, /\(!visa3d \? bengtsson\.synlig : platsUi\.plats !== START_PLATS \|\| bengtsson\.mine === "automat"\)/);

  const res = (placeringJson as { skarm_reserverat: Record<string, unknown>[] }).skarm_reserverat.find((r) => r.namn === "bengtsson");
  assert.equal(res?.id, "bengtsson");
  assert.deepEqual(res?.x, [18, 120]);
  assert.deepEqual(res?.y, [390, 555]);
  assert.equal(res?.x0, 30);
  assert.equal(res?.y0, 494);
  assert.equal(res?.x1, 140);
  assert.equal(res?.y1, 738);

  const skapa = las("src/spel/styr/useSkapa.ts");
  assert.match(skapa, /arVarmePlagg\(t\.id\)/);
  assert.match(skapa, /text\.includes\("halsduk"\)/);
  assert.match(skapa, /useMinne\.getState\(\)\.ang\.length > 0/);
  assert.match(skapa, /\$\{useMinne\.getState\(\)\.ang\[0\]!\.kropp\} med \$\{text\}/);

  assert.equal(plaggModellUrl(normaliseraPlaggId("mössa")), "/models/bulk/f-mossa-vinter-cc0.glb");
  assert.equal(plaggModellUrl("halsduk"), "/models/bulk/f-halsduk-cc0.glb");
  assert.equal(plaggModellUrl("kanin"), null);

  const faest = las("src/spel/tillbehor/faest.ts");
  assert.match(faest, /rot\.userData\.ankare = a/);
  assert.match(faest, /hallare\.userData\.plaggId = plaggId/);
  assert.match(faest, /taBortPar\(rot, plaggId, cfg\.par\)/);
  assert.equal(arVarmeStyr, arVarmePlagg);
  assert.equal(mossaStyr, mossaPaFrysKanin);
});

test("F4: värmeplagg kläder djuret på ängen, oavsett art", () => {
  useMinne.getState().aterstall();
  try {
    assert.equal(mossaPaFrysKanin(varelse("alvmossa")), null, "ingen att klä");
    const katt = useMinne.getState().laggPaAng(varelse("katt"), 1).nya[0];
    assert.ok(katt);
    assert.equal(mossaPaKanin(varelse("alvmossa")), null, "fristående kräver frys");
    useMinne.getState().sattUppdrag("kanin-fryser", "pagar");

    const mossa = mossaPaFrysKanin(varelse("mössa", [], "#E53935"));
    assert.equal(mossa?.uid, katt!.uid);
    assert.deepEqual(mossa?.spec.tillbehor, [{ ...plagg("alvmossa", "#E53935"), ord: "mössa", relation: "med" }]);
    assert.equal(mossa?.spec.kropp, "katt");
    useMinne.getState().uppdateraDjur(katt!.uid, mossa!.spec);

    assert.equal(mossaPaFrysKanin(varelse("alvmossa")), null, "har redan mössa");
    const luva = mossaPaKanin(varelse("katt", [plagg("luva")]));
    assert.equal(luva?.uid, katt!.uid);
    assert.ok(luva?.spec.tillbehor.some((t) => t.id === "luva"));
    assert.ok(luva?.spec.tillbehor.some((t) => t.id === "alvmossa"));

    const kanin = useMinne.getState().laggPaAng(varelse("kanin"), 1).nya[0]!;
    const hals = mossaPaFrysKanin(varelse("kanin", [plagg("halsduk")]));
    assert.equal(hals?.uid, kanin.uid);
    assert.ok(hals?.spec.tillbehor.some((t) => t.id === "halsduk"));
    assert.equal(mossaPaFrysKanin(varelse("kanin", [plagg("halsduk")]))?.uid, kanin.uid);
    useMinne.getState().uppdateraDjur(kanin.uid, hals!.spec);
    const filt = mossaPaKanin(varelse("kanin", [plagg("filt")]));
    assert.equal(filt?.uid, kanin.uid);
    assert.ok(filt?.spec.tillbehor.some((t) => t.id === "filt"));
    assert.ok(filt?.spec.tillbehor.some((t) => t.id === "halsduk"));

    const troja = mossaPaFrysKanin(varelse("tröja"));
    assert.equal(troja?.uid, kanin.uid, "fristående tröja föredrar kaninen");
    assert.ok(troja?.spec.tillbehor.some((t) => t.id === "troja"));

    useMinne.getState().aterstall();
    useMinne.getState().sattUppdrag("kanin-fryser", "pagar");
    const drake = useMinne.getState().laggPaAng(varelse("drake"), 1).nya[0]!;
    const hund = useMinne.getState().laggPaAng(varelse("hund"), 1).nya[0]!;
    const paDrake = mossaPaFrysKanin(varelse("drake", [plagg("mössa")]));
    assert.equal(paDrake?.uid, drake.uid);
    assert.deepEqual(paDrake?.spec.tillbehor.map((t) => t.id), ["alvmossa"]);
    const paHund = mossaPaKanin(varelse("hund", [plagg("filt"), plagg("luva")]));
    assert.equal(paHund?.uid, hund.uid);
    assert.deepEqual(paHund?.spec.tillbehor.map((t) => t.id).sort(), ["filt", "luva"]);
    assert.equal(mossaPaFrysKanin(varelse("katt", [plagg("halsduk")])), null, "katt saknas, hunden kläs inte");

    useMinne.setState({ plats: "skogen" });
    assert.equal(mossaPaFrysKanin(varelse("luva")), null);
    for (const id of ["alvmossa", "mossa", "mössa", "luva", "halsduk", "filt", "troja", "tröja"]) assert.equal(arVarmePlagg(id), true, id);
    assert.equal(arVarmePlagg("krona"), false);
  } finally {
    useMinne.getState().aterstall();
  }
});

test("F4: en hel filtmening skapar nytt utanför värmehjälpen", () => {
  useMinne.getState().aterstall();
  try {
    const kanin = useMinne.getState().laggPaAng(varelse("kanin"), 1).nya[0]!;
    const mening = varelse("kanin", [plagg("filt")]);
    const fore = JSON.stringify(useMinne.getState().ang);
    assert.equal(mossaPaFrysKanin(mening), null, "ett gammalt djur tar inte över fritt skapande");
    assert.equal(JSON.stringify(useMinne.getState().ang), fore);
    const katt = useMinne.getState().laggPaAng(varelse("katt"), 1).nya[0]!;
    const kall = useMinne.getState();
    useMinne.setState({ liv: { ...kall.liv, [katt.uid]: { ...kall.liv[katt.uid]!, humor: "fryser" } } });
    assert.equal(mossaPaFrysKanin(mening), null, "en kall katt får inte låta en glad kanin ta över meningen");
    const s = useMinne.getState();
    useMinne.setState({ liv: { ...s.liv, [kanin.uid]: { ...s.liv[kanin.uid]!, humor: "fryser" } } });
    assert.equal(mossaPaFrysKanin(mening)?.uid, kanin.uid, "ett uttryckligen fruset djur får fortfarande hjälp");
  } finally {
    useMinne.getState().aterstall();
  }
});

test("F4: värmehjälpen bevarar riktiga relationer, antal och egenskaper", () => {
  const lasMening = (text: string) => { const u = tolka(text, { kalla: "kort" }); assert.equal(u.typ, "skapad"); return (u as { varelse: Varelse }).varelse; };
  useMinne.getState().aterstall();
  try {
    const kanin = useMinne.getState().laggPaAng(lasMening("en kanin"), 1).nya[0]!;
    const s = useMinne.getState();
    useMinne.setState({ liv: { ...s.liv, [kanin.uid]: { ...s.liv[kanin.uid]!, humor: "fryser" } } });
    assert.equal(mossaPaFrysKanin(lasMening("en kanin bredvid en filt")), null, "en fristående filt får inte kläs på djuret");
    for (const text of ["en kanin med två filtar", "en kanin med en kall filt", "en kanin med en filt och en filt"]) {
      const v = lasMening(text), h = mossaPaFrysKanin(v);
      assert.equal(h?.uid, kanin.uid);
      assert.deepEqual(h?.spec.tillbehor, v.tillbehor, text);
    }
    const fristaende = mossaPaFrysKanin(lasMening("två kalla filtar"));
    assert.deepEqual(fristaende?.spec.tillbehor, lasMening("en kanin med två kalla filtar").tillbehor);
    for (const text of ["en röd filt med en blå filt", "en glittrig filt med en blå filt", "en röd filt med en blå hatt", "en filt bredvid en boll", "en filt med en guldkrona"]) {
      assert.deepEqual(mossaPaFrysKanin(lasMening(text))?.spec.tillbehor, lasMening(`en kanin med ${text}`).tillbehor, "varje plagg behåller egen färg och glans");
    }
    assert.deepEqual(useMinne.getState().ang[0]?.tillbehor, [], "hjälpberäkningen skriver inte i minnet");
  } finally { useMinne.getState().aterstall(); }
});

test("F4: GLB-klon ersätter procedur-halsduk och par-grupper krockar inte", () => {
  const rot = new THREE.Group();
  const kropp = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1, 0.5));
  rot.add(kropp);
  rot.updateMatrixWorld(true);
  faestTillbehor(rot, "kanin", [plagg("halsduk")], "mesh");
  assert.ok(rot.userData.ankare);
  assert.equal(rot.getObjectByName("tillbehor-halsduk")?.userData.plaggId, undefined);
  const hals = faestPlaggKlon(rot, "kanin", "halsduk", new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2)), null);
  assert.ok(hals);
  assert.equal(hals!.userData.plaggId, "halsduk");
  assert.equal(hals!.userData.plaggPar, "hals");
  assert.equal(hals, rot.getObjectByName("tillbehor-halsduk"));
  let antal = 0;
  rot.traverse((o) => {
    if (o.name === "tillbehor-halsduk") antal += 1;
  });
  assert.equal(antal, 1, "procedur-halsduken är borttagen");
  const hatt = faestPlaggKlon(rot, "kanin", "alvmossa", new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2)), null);
  const rygg = faestPlaggKlon(rot, "kanin", "filt", new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.3)), "#1565C0");
  assert.equal(hatt?.userData.plaggPar, "hatt");
  assert.equal(rygg?.userData.plaggPar, "rygg");
  assert.ok(rot.getObjectByName("tillbehor-halsduk"));
  assert.ok(rot.getObjectByName("tillbehor-alvmossa"));
  assert.ok(rot.getObjectByName("tillbehor-filt"));
  assert.ok(rot.userData.ankare?.hals);
  faestPlaggKlon(rot, "kanin", "luva", new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.2)), null);
  assert.equal(rot.getObjectByName("tillbehor-alvmossa"), undefined, "samma par hatt ersätts");
  assert.ok(rot.getObjectByName("tillbehor-luva"));
  assert.ok(rot.getObjectByName("tillbehor-halsduk"));
});
