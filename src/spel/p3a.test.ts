// P3a – EN placeringsregel för alla platser (data/placering.json, placering.ts). Ett prov per plats med 8 djur/saker:
// tre fasta frön och det värsta fallet. Inget som står kvar skyms mer än max_skymd av sin skärmruta (de framför, platsens
// fasta saker och de reserverade rutorna: utgångarna, guiden, Bengtsson, nedre raden), alla står på rätt underlag för sin
// roll, den nyaste får alltid en ruta och syns, och den som inte ryms går till stallet (somnar) – aldrig över någon.
import assert from "node:assert/strict";
import { test } from "node:test";
import { ENTITETER, harModell } from "./entiteter.ts";
import { iStallet, kroppMatt, PLACERING, placera, regelFor, rollFor, SKARM_RESERVERAT, topp } from "./placering.ts";
import { tacker } from "./skarm.ts";
import { platsMed, START_PLATS } from "./platser.ts";
import type { Plats } from "./platser.ts";
import type { Sparad } from "./brygga.ts";
import { iVatten, tillPlats, torrKropp } from "./platsYta.ts";
import { framfor, sakRuta, synligAndel } from "./skymning.ts";

export const PLATSER_P3A = [START_PLATS, "sjon", "skogen", "grottan"] as const;
const spar = (uid: string, kropp: string, skapad: number, formagor: string[] = []) =>
  ({ uid, kropp, formel: `en ${kropp}`, beskrivning: "", skala: 1, alpha: 1, formagor, tillbehor: [], overraskningar: [], skapad }) as unknown as Sparad;

/** Fast slump (mulberry32) – samma frö ger samma lag. */
function slump(fro: number) {
  let a = fro >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const MED_MODELL = Object.keys(ENTITETER).filter((k) => harModell(k) && ENTITETER[k]!.typ !== "tillbehor").sort();
const DJUR = MED_MODELL.filter((k) => ENTITETER[k]!.typ === "djur");
/** 8 skapelser: 6 djur och 2 saker ur allt som har en modell. */
export function lagFor(fro: number): string[] {
  const r = slump(fro);
  const ut: string[] = [];
  for (let i = 0; i < 8; i++) {
    const pool = i % 4 === 3 ? MED_MODELL : DJUR;
    ut.push(pool[Math.floor(r() * pool.length)]!);
  }
  return ut;
}
/** Det värsta fallet: de största djuren och byggnaderna, och åtta likadana katter på samma ruta. */
export const VARSTA: [string, string[]][] = [
  ["stora", ["elefant", "giraff", "slott", "val", "dinosaurie", "häst", "ko", "elefant"].map((k) => (ENTITETER[k] ? k : "ko"))],
  ["katter", Array(8).fill("katt")],
];
const FRON = [11, 2026, 4242];

export function provaLag(plats: Plats, kroppar: string[], namn: string) {
  const alla = kroppar.map((k, i) => spar(`${namn}-${i}-${k}`, k, 1000 + i));
  const l = placera(alla, plats);
  const regel = regelFor(plats);
  const kvar = alla.filter((d) => !l.get(d.uid)!.stall);
  const fasta = regel.fasta.map((f) => ({ id: `fast:${f.namn}`, z: f.z, r: sakRuta(f.x, f.z, f.halv, f.hojd, f.djup), plan: !!f.plan }));
  // P3a torr 4: kroppen själv (i vila på sin ruta), inte rutan den rör sig inom – värsta läget räknar regeln (varst)
  const saker = kvar.map((d) => ({ id: d.uid, z: l.get(d.uid)!.z, r: l.get(d.uid)!.kropp ?? l.get(d.uid)!.r, roll: l.get(d.uid)!.roll }));
  const andel = synligAndel([...fasta.filter((f) => !f.plan), ...saker], SKARM_RESERVERAT);
  // ett platt fast (dammen) skyms bara av det som står på marken – simmare och flygare får vara över den
  for (const f of fasta.filter((q) => q.plan)) andel[f.id] = synligAndel([f, ...saker.filter((s) => s.roll === "mark" || s.roll === "bak")], SKARM_RESERVERAT)[f.id]!;
  return { alla, l, kvar, andel };
}

for (const id of PLATSER_P3A) {
  test(`P3a: ${id} – 8 djur/saker (tre frön och värsta fallet): ingen skyms mer än sin gräns (30 % de tre nyaste, 45 % äldre), huvudet högst 10 %, rätt underlag, den nya syns`, () => {
    const plats = platsMed(id)!;
    assert.ok(plats, id);
    const max = PLACERING.max_skymd;
    const aldre = PLACERING.max_skymd_aldre ?? max;
    const huvudMax = PLACERING.huvud_skymd ?? 0;
    // Arkitekten 21:40: regeln använder provets gränser – 30 % skymt de tre nyaste, 45 % äldre, huvudet högst 10 %
    assert.ok(max > 0 && max <= 0.3 && aldre <= 0.45 && huvudMax <= 0.1);
    const fel: string[] = [];
    const lag: [string, string[]][] = [...FRON.map((f) => [`fro${f}`, lagFor(f)] as [string, string[]]), ...VARSTA];
    for (const [namn, kroppar] of lag) {
      const { alla, l, kvar, andel } = provaLag(plats, kroppar, `${id}-${namn}`);
      const nyast = [...alla].sort((a, b) => b.skapad - a.skapad).map((d) => d.uid);
      const gransFor = (k: string) => (k.startsWith("fast:") || nyast.indexOf(k) < (PLACERING.nya_antal ?? 1) ? max : aldre);
      for (const [k, a] of Object.entries(andel)) if (a < 1 - gransFor(k) - 1e-6) fel.push(`${namn}: ${k} syns ${Math.round(a * 100)} %`);
      for (const d of kvar) {
        const q = l.get(d.uid)!;
        const h = topp(q.kropp ?? q.r);
        let t = SKARM_RESERVERAT.reduce((a, r) => a + tacker(r, h), 0);
        for (const o of kvar) if (o !== d && framfor(l.get(o.uid)!, q)) t += tacker(l.get(o.uid)!.kropp ?? l.get(o.uid)!.r, h);
        if (t > huvudMax + 1e-6) fel.push(`${namn}: ${d.kropp} huvudet skymt ${Math.round(t * 100)} %`);
      }
      for (const d of kvar) {
        const q = l.get(d.uid)!;
        const r = q.r;
        if (r.x0 < -0.5 || r.x1 > 375.5 || r.y0 < -0.5 || r.y1 > 812.5) fel.push(`${namn}: ${d.kropp} utanför bilden`);
        if (q.roll === "vatten" && !iVatten(plats, ...tillPlats(q.x, q.z))) fel.push(`${namn}: ${d.kropp} simmar på land`);
        if ((q.roll === "mark" || q.roll === "bak") && !torrKropp(plats, q.x, q.z, 0.2)) fel.push(`${namn}: ${d.kropp} står i vattnet`);
        if (q.roll === "luft" ? q.y <= 0.5 : q.y > 0.5) fel.push(`${namn}: ${d.kropp} (${q.roll}) på höjd ${q.y}`);
        if (q.roll !== rollFor(d, plats)) fel.push(`${namn}: ${d.kropp} fel roll`);
      }
      const ny = alla[alla.length - 1]!;
      if (l.get(ny.uid)!.stall) fel.push(`${namn}: den nya ${ny.kropp} fick ingen ruta`);
      // samma lag ger samma lägen
      const l2 = placera(alla, plats);
      for (const d of alla) if (JSON.stringify(l2.get(d.uid)) !== JSON.stringify(l.get(d.uid))) fel.push(`${namn}: ${d.kropp} olika läge`);
    }
    assert.deepEqual(fel, []);
  });
}

test("P3a: den nya skapelsen får den främsta lediga rutan – en liten ny står längst fram och närmast mitten", () => {
  for (const id of PLATSER_P3A) {
    const plats = platsMed(id)!;
    const alla = ["hund", "katt", "gris", "kanin"].map((k, i) => spar(`${id}-f${i}`, k, 1000 + i));
    const l = placera(alla, plats);
    const ny = l.get(alla[3]!.uid)!;
    for (const d of alla.slice(0, 3)) {
      const q = l.get(d.uid)!;
      if (!q.stall && q.roll === ny.roll) assert.ok(q.z <= ny.z + 1e-9, `${id}: ${d.kropp} (z ${q.z}) framför den nya (z ${ny.z})`);
    }
    const band = regelFor(plats).band[ny.roll]!;
    assert.ok(ny.z >= band.z[0], `${id}: inom bandet`);
  }
});

test("P3a: roll ur data – simmare på vattenytan, flygare i luftbandet, stora saker i det bakre bandet", () => {
  const sjon = platsMed("sjon")!;
  const ang = platsMed(START_PLATS)!;
  assert.equal(rollFor(spar("a", "fisk", 1), sjon), "vatten");
  assert.equal(rollFor(spar("a", "anka", 1), sjon), "vatten", "ankan simmar vid sjön (vattenfågel)");
  assert.equal(rollFor(spar("a", "anka", 1, ["vingar"]), sjon), "luft", "med barnets vingar flyger den");
  assert.equal(rollFor(spar("a", "katt", 1), sjon), "mark");
  assert.equal(rollFor(spar("a", "slott", 1), ang), "bak");
  assert.equal(rollFor(spar("a", "katt", 1, ["vingar"]), ang), "luft");
});

test("P3a-fix (beslut B): ryms inte allt somnar en per ord (fler bara om de annars stod osynliga), aldrig den nya, ingen vaken utan ruta", async () => {
  const { useMinne } = await import("./minne.ts");
  const varelse = (k: string) => ({ kropp: k, formel: `en ${k}`, beskrivning: "", skala: 1, alpha: 1, formagor: [], tillbehor: [], overraskningar: [], farg: null }) as never;
  // barnet skapar en i taget: en sekund mellan varje (annars får alla samma `skapad`)
  const nu = Date.now;
  let t = 1_800_000_000_000;
  Date.now = () => (t += 1000);
  for (const id of PLATSER_P3A) {
    const plats = platsMed(id)!;
    const ang = id === START_PLATS;
    useMinne.setState({ ang: [], sovande: [], plats: id, platsSkapelser: {} } as never);
    let somnat = 0;
    let flera = 0;
    for (const k of ["elefant", "kanin", "häst", "katt", "katt", "jultomte", "katt", "hund", "gris", "ko", "elefant", "kanin"].filter((k) => ENTITETER[k])) {
      const r = useMinne.getState().laggPaAng(varelse(k), 1);
      assert.ok(!r.somnade.some((s) => r.nya.some((n) => n.uid === s.uid)), `${id} ${k}: den nya somnade`);
      somnat += r.somnade.length;
      const lista = ang ? useMinne.getState().ang : (useMinne.getState().platsSkapelser[id] ?? []);
      assert.ok(lista.some((d) => d.uid === r.nya[0]!.uid), `${id} ${k}: den nya finns`);
      // högst en väljs att somna (taket eller somnaEn); fler bara om de annars skulle stå osynliga – ingen vaken står utan ruta
      assert.deepEqual(iStallet(lista, plats).map((d) => d.kropp), [], `${id} ${k}: någon vaken står utan ruta`);
      if (r.somnade.length > 1) flera++;
    }
    assert.ok(somnat > 0, `${id}: ingen somnade av 12`);
    assert.ok(flera <= 2, `${id}: ${flera} ord av 12 sövde fler än en`);
  }
  Date.now = nu;
  useMinne.setState({ plats: START_PLATS } as never);
});

test("P3a (B6.6, Doodle 08:26): byggnaderna behåller sin storlek – slottet är tydligt större än sjukhuset", () => {
  const ang = platsMed(START_PLATS)!;
  const z = regelFor(ang).band.bak!.z[0];
  const [s, h] = ["slott", "sjukhus"].map((k) => kroppMatt(spar(k, k, 1), z, ang));
  assert.ok(s!.hojd >= 1.2 * h!.hojd, `slott ${s!.hojd.toFixed(2)}, sjukhus ${h!.hojd.toFixed(2)}`);
});

test("P3a: prestanda – en ny skapelse placeras på under 50 ms CPU-tid i Node med 30 skapelser (ängen, sjön, skogen, grottan)", (t) => {
  // Orsaken till att det var långsamt (~1 s): varje ny skapelse räknade om allt från början – fyra nivåer × alla storlekar
  // × alla ~2 000 rutor, med underlaget (torrKropp) och skärmrutor som nya objekt för varje ruta. Nu: raderna räknas en
  // gång, underlaget delas mellan alla kroppar per ruta, är det fullt prövas bara den täta nivån, den som inte ryms ens i
  // minsta storlek somnar direkt, och skärmrutan räknas utan mellanobjekt.
  const ORD = ["hund", "katt", "häst", "gris", "ko", "kanin", "elefant", "giraff", "anka", "fisk", "uggla", "slott", "bil", "räv", "get", "får", "höna", "björn", "monstergroda", "drake", "pall", "spade", "tupp", "groda", "marulk", "kronhjort", "pappa", "mus", "lejon"];
  const NYA = ["noshorning", "spinosaurus", "dinosaurie", "valfisk", "katt"];
  for (const id of PLATSER_P3A) {
    const plats = platsMed(id)!;
    const fyll = Object.keys(ENTITETER).filter((k) => ENTITETER[k]!.typ === "djur" && !ORD.includes(k)).sort();
    const bas = [...ORD.filter((k) => k in ENTITETER), ...fyll].slice(0, 29).map((k, i) => spar(`perf-${id}-${i}`, k, 1000 + i));
    placera(bas, plats); // som i spelet: de 29 är redan placerade (och koden varm)
    placera(bas.slice(1), plats);
    const tider: number[] = [];
    for (const [j, ny] of NYA.filter((k) => k in ENTITETER).entries()) {
      const alla = [...bas, spar(`perf-${id}-ny${j}`, ny, 2000 + j)];
      assert.equal(alla.length, 30);
      const c = process.cpuUsage();
      placera(alla, plats);
      const d = process.cpuUsage(c);
      tider.push((d.user + d.system) / 1000);
    }
    tider.sort((a, b) => a - b);
    const median = tider[Math.floor(tider.length / 2)]!;
    t.diagnostic(`${id}: median ${median.toFixed(1)} ms CPU (${tider.map((v) => v.toFixed(0)).join(", ")})`);
    assert.ok(median < 50, `${id}: median ${median.toFixed(1)} ms (${tider.map((t) => t.toFixed(0)).join(", ")})`);
  }
});
