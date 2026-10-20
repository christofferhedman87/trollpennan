// B6.3: dammens vatten över markens svaj (G), uppmaningens längd (H), ängens dammzon (I), stora saker spridda bak (J).
import assert from "node:assert/strict";
import { test } from "node:test";
import { DAMM, siktFri, SVAJ_AMP } from "./ang/damm.ts";
import { djurPlats } from "./ang/delat.ts";
import { BAK_ZON, bakPlatser, flyger, FOT_MARGINAL, fotKant, siktHojd, siktRadie, simmar, storlekKlass, VICKNING } from "./entiteter.ts";
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

test("B6.3 (J): stora saker sprids i sidled och djupled, aldrig på rad, och grinden i staketet syns", () => {
  const uids = Array.from({ length: 7 }, (_, i) => `fordon-${i}`);
  const p = bakPlatser(uids);
  assert.deepEqual(bakPlatser(uids), p, "samma uid ger samma läge");
  const zs = p.map(([, z]) => z);
  const xs = p.map(([x]) => x);
  assert.ok(Math.max(...zs) - Math.min(...zs) >= 0.3, `djupled: ${zs.join(", ")}`);
  assert.ok(Math.max(...xs) - Math.min(...xs) >= 3, `sidled: ${xs.join(", ")}`);
  for (const [x, z] of p) {
    assert.ok(x >= BAK_ZON.zon.x[0] && x <= BAK_ZON.zon.x[1] && z >= BAK_ZON.zon.z[0] && z <= BAK_ZON.zon.z[1], "inom zonen");
    for (const [a, b] of BAK_ZON.fri_x) assert.ok(x < a || x > b, `x ${x} framför grinden`);
  }
  for (let i = 0; i < 4; i++) for (let j = 0; j < i; j++) assert.ok(Math.hypot(p[i]![0] - p[j]![0], p[i]![1] - p[j]![1]) >= BAK_ZON.min_avstand - 1e-9, `de fyra första isär (${i}, ${j})`);
  // inte samma z på rad: ingen z-nivå delas av fler än två
  const rad = new Map<number, number>();
  for (const z of zs) rad.set(Math.round(z * 10), (rad.get(Math.round(z * 10)) ?? 0) + 1);
  assert.ok(Math.max(...rad.values()) <= 2, `ingen rad: ${zs.join(", ")}`);
  // via djurPlats på ängen: fortfarande bakom djuren
  const alla = [...uids.map((u, i) => spar(u, ["bil", "buss", "traktor", "slott", "raket", "tag", "gravmaskin"][i]!)), spar("k", "katt"), spar("h", "hund")];
  for (const d of alla as { uid: string; kropp: string }[]) if (storlekKlass(d.kropp)) assert.ok(djurPlats(d as never, alla, ANG)[2] < djurPlats(alla[7]!, alla, ANG)[2] - 0.5);
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
      const kropp = Math.hypot(x - DAMM.x, z - DAMM.z) - DAMM.r - (fotKant(d.kropp) - FOT_MARGINAL);
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
      const kropp = Math.hypot(x - DAMM.x, z - DAMM.z) - DAMM.r - (fotKant(d.kropp) - FOT_MARGINAL);
      if (kropp < 0.1) fel.push(`${d.kropp} ${kropp.toFixed(2)}`);
    }
  }
  assert.ok(ovriga.length > 500, `${ovriga.length} entiteter`);
  assert.deepEqual(fel, [], `kroppens kant närmare vattnet än 0,1 (vickning inräknad): ${fel.join(", ")}`);
});

test("B6.3 (D, Doodle 09:17): siktzonen – ingen placering på ängen kan skymma dammen för kameran", () => {
  // geometrin: kon rakt framför dammen skymmer, bredvid eller bakom gör den inte
  assert.equal(siktFri(1.0, 0.9, siktRadie("ko"), siktHojd("ko")), false, "kon framför dammen");
  assert.equal(siktFri(-1.2, 0.9, siktRadie("ko"), siktHojd("ko")), true, "kon till vänster");
  assert.equal(siktFri(1.1, -2.3, siktRadie("ko"), siktHojd("ko")), true, "kon bakom");
  assert.equal(siktFri(1.0, 2.9, 0.3, 0.1), true, "en låg sak långt fram");
  // Doodles D2, de största/högsta skapelserna och alla entiteter i lag om 10: varje placerad kropp håller siktzonen fri
  const ENT = (entJson as unknown as { entiteter: Record<string, { modell?: string; malhojd?: number }> }).entiteter;
  const mark = Object.keys(ENT).filter((k) => ENT[k]!.modell && !flyger(k, []) && !simmar(k, [])).sort();
  const hogst = mark.filter((k) => storlekKlass(k)?.zon !== "bak").sort((a, b) => siktHojd(b) * siktRadie(b) - siktHojd(a) * siktRadie(a) || a.localeCompare(b)).slice(0, 10);
  const lag = [["bowlingklot", "akvarium", "spjalsang", "paskagg", "vattenpistol", "filt", "fiol", "mikroskop", "trumset", "ko"], hogst];
  for (let i = 0; i < mark.length; i += 10) lag.push(mark.slice(i, i + 10));
  const fel: string[] = [];
  for (const fro of ["a", "b", "c"])
    for (const [n, kroppar] of lag.entries()) {
      if (fro !== "a" && n > 1) break; // tre frön för värsta fallen (D2, de största), ett för alla entiteter
      const alla = kroppar.filter((k) => k in ENT).map((k, i) => spar(`${fro}${n}-${i}`, k));
      for (const d of alla as { uid: string; kropp: string }[]) {
        const [x, , z] = djurPlats(d as never, alla, ANG);
        if (!siktFri(x, z, siktRadie(d.kropp), siktHojd(d.kropp))) fel.push(`${fro}/${n}: ${d.kropp} (${x.toFixed(2)}, ${z.toFixed(2)})`);
      }
    }
  assert.ok(hogst.length === 10 && mark.length > 1000);
  assert.deepEqual(fel, [], `i siktzonen: ${fel.slice(0, 12).join(", ")}`);
});
