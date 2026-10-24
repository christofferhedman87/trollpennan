// B6.3: dammens vatten över markens svaj (G), uppmaningens längd (H), ängens dammzon (I), stora saker spridda bak (J).
import assert from "node:assert/strict";
import { test } from "node:test";
import { DAMM, SVAJ_AMP } from "./ang/damm.ts";
import { djurKrymp, djurPlats } from "./ang/delat.ts";
import { flyger, FOT_MARGINAL, fotKant, simmar, VICKNING } from "./entiteter.ts";
import entJson from "../../data/entiteter.json" with { type: "json" };
import { platsMed, START_PLATS } from "./platser.ts";
import { iVatten, tillPlats } from "./platsYta.ts";
import { KAN_INTE_RITA_MS } from "../tolk/aterkoppling.ts";

const spar = (uid: string, kropp: string, formagor: string[] = []) =>
  ({ uid, kropp, formel: `en ${kropp}`, beskrivning: "", skala: 1, alpha: 1, formagor, tillbehor: [], overraskningar: [], skapad: 1 }) as never;
const ANG = platsMed(START_PLATS)!;

test("B6.3 (G): dammens vatten ligger över markens största svaj, med marginal", () => {
  assert.ok(DAMM.y >= SVAJ_AMP + 0.02, `vattnet ${DAMM.y} över svajet ${SVAJ_AMP}`);
});

test("B6.3 (H): uppmaningen vid ord utan modell står minst 5 sekunder", () => {
  assert.ok(KAN_INTE_RITA_MS >= 5000);
});

test("B6.3 (I): ängens dammzon i platser.json täcker dammen som ritas", () => {
  assert.ok(iVatten(ANG, ...tillPlats(DAMM.x, DAMM.z)), "mitten");
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const)
    assert.ok(iVatten(ANG, ...tillPlats(DAMM.x + dx * DAMM.r * 0.99, DAMM.z + dz * DAMM.r * 0.99)), `kanten ${dx},${dz}`);
  assert.ok(!iVatten(ANG, ...tillPlats(0, 0.5)), "ängens mitt är land");
});

test("B6.3 (I): inga djur, figurer eller saker i dammen på ängen – simmare är undantaget", () => {
  const land = ["bebis", "pojke", "katt", "hund", "ko", "gris", "kanin", "drake", "groda", "bjorn", "räv", "uggla"];
  const stora = ["bil", "buss", "traktor", "slott", "raket", "tag", "gravmaskin", "skyskrapa", "ubat"];
  for (const n of [1, 3, 5, 8, 12]) {
    const alla = [...land.slice(0, n).map((k, i) => spar(`l${i}`, k)), ...stora.slice(0, Math.ceil(n * 0.75)).map((k, i) => spar(`s${i}`, k)), spar("f", "fisk")];
    for (const d of alla as { uid: string; kropp: string }[]) {
      const [x, , z] = djurPlats(d as never, alla, ANG);
      const dist = Math.hypot(x - DAMM.x, z - DAMM.z);
      if (d.kropp === "fisk") assert.ok(dist < DAMM.r, `fisken simmar i dammen (${dist.toFixed(2)})`);
      else assert.ok(dist >= DAMM.r + 0.2, `${n}: ${d.kropp} står ${dist.toFixed(2)} från dammens mitt`);
    }
  }
  // bebisen på den plats den hade före B6.3 (slot 3, [1.4, 0.25]) hamnade i dammen; nu flyttas den
  const alla = ["ko", "gris", "bebis"].map((k, i) => spar(`b${i}`, k));
  const [x, , z] = djurPlats(alla[2]!, alla, ANG);
  assert.ok(Math.hypot(x - DAMM.x, z - DAMM.z) >= DAMM.r + 0.2);
});

test("B6.3 (I, Doodle 07:33): kroppen – halva bredden ur bbox + vickning + 0,15 – hålls från dammen, inte bara mitten", () => {
  assert.ok(fotKant("ko") >= 0.6 + VICKNING + FOT_MARGINAL - 1e-9, `ko ${fotKant("ko")}`);
  assert.ok(fotKant("trumset") > fotKant("mikroskop"), "bredare sak, större marginal");
  assert.ok(fotKant("ko", 2) > fotKant("ko"), "barnets storleksord räknas");
  const lag = [
    ["ko", "gris", "bebis", "katt", "pojke", "fisk", "slott", "buss", "kaffekanna", "vaggklocka"],
    ["mikroskop", "trumset", "jordglob", "agg", "vaggklocka", "ko", "fisk", "hund", "buss", "kaffekanna"],
    ["katt", "elefant", "ko", "trumset", "sang", "bord", "mikroskop", "jordglob", "traktor", "hus"],
  ];
  for (const [n, kroppar] of lag.entries()) {
    const alla = kroppar.map((k, i) => spar(`f${n}-${i}`, k));
    for (const d of alla as { uid: string; kropp: string }[]) {
      if (d.kropp === "fisk") continue;
      const [x, , z] = djurPlats(d as never, alla, ANG);
      // P3a: en äldre som ritas mindre när det är trångt (krymp) har en mindre kropp
      const kropp = Math.hypot(x - DAMM.x, z - DAMM.z) - DAMM.r - (fotKant(d.kropp, djurKrymp(d as never, alla, ANG)) - FOT_MARGINAL);
      assert.ok(kropp >= 0.1, `lag ${n}: ${d.kropp} kroppens kant ${kropp.toFixed(2)} från vattnet (vickning inräknad)`);
    }
  }
});

test("B6.3 (I, Doodle 08:26): ALLA skapelser på marken – djur och saker – står med kroppen utanför dammen", () => {
  // Doodles fall först (bowlingklot, akvarium, spjälsäng, påskägg, vattenpistol, filt, fiol), sedan varje entitet i lag om 10.
  const ENT = (entJson as unknown as { entiteter: Record<string, { modell?: string }> }).entiteter;
  const doodle = ["bowlingklot", "akvarium", "spjalsang", "paskagg", "vattenpistol", "filt", "fiol", "mikroskop", "trumset", "ko"].filter((k) => k in ENT);
  const ovriga = Object.keys(ENT).filter((k) => ENT[k]!.modell && !flyger(k, []) && !simmar(k, []) && !doodle.includes(k)).sort();
  const lag = [doodle];
  for (let i = 0; i < ovriga.length; i += 10) lag.push(ovriga.slice(i, i + 10));
  const fel: string[] = [];
  for (const [n, kroppar] of lag.entries()) {
    const alla = kroppar.map((k, i) => spar(`a${n}-${i}`, k));
    for (const d of alla as { uid: string; kropp: string }[]) {
      const [x, , z] = djurPlats(d as never, alla, ANG);
      // P3a: en äldre som ritas mindre när det är trångt (krymp) har en mindre kropp
      const kropp = Math.hypot(x - DAMM.x, z - DAMM.z) - DAMM.r - (fotKant(d.kropp, djurKrymp(d as never, alla, ANG)) - FOT_MARGINAL);
      if (kropp < 0.1) fel.push(`${d.kropp} ${kropp.toFixed(2)}`);
    }
  }
  assert.ok(ovriga.length > 500, `${ovriga.length} entiteter`);
  assert.deepEqual(fel, [], `kroppens kant närmare vattnet än 0,1 (vickning inräknad): ${fel.join(", ")}`);
});

