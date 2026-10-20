// B6.2: "ljus" är en sak, räven håller avstånd till vattnet, platsernas milstolpe.final / las_upp / final_fore används.
import assert from "node:assert/strict";
import { test } from "node:test";
import { SKRIV } from "./aventyr.ts";
import { djurPlats } from "./ang/delat.ts";
import { harModell } from "./entiteter.ts";
import { PLATSER, arFinal, klaraPerPlats, platsMed, upplast, type Matt, type Plats } from "./platser.ts";
import { KANT_MARGINAL, franPlats, iVatten, tillPlats, torrKropp } from "./platsYta.ts";
import { nastaSkrivUppdrag } from "./uppdragsmotor.ts";
import { tolkaMedReserv } from "../tolk/reserv.ts";

const skapad = (t: string) => {
  const u = tolkaMedReserv(t);
  assert.equal(u.typ, "skapad", t);
  return u.typ === "skapad" ? u.varelse : null!;
};

test("B6.2: 'ljus' ensamt, med 'ett' eller efter 'med' är saken ljus; 'en ljus katt' är fortfarande en ljusare katt", () => {
  assert.equal(skapad("ljus").kropp, "ljus");
  assert.equal(skapad("ett ljus").kropp, "ljus");
  assert.equal(skapad("ljuset").kropp, "ljus");
  assert.equal(skapad("två ljus").kropp, "ljus");
  assert.deepEqual(skapad("en kanin med ett ljus").tillbehor.map((t) => t.id), ["ljus"]);
  assert.deepEqual(skapad("en kanin med ljus").tillbehor.map((t) => t.id), ["ljus"]);
  assert.deepEqual(skapad("en katt och ett ljus").tillbehor.map((t) => t.id), ["ljus"]);
  const ljusKatt = skapad("en ljus katt");
  assert.equal(ljusKatt.kropp, "katt");
  assert.deepEqual(ljusKatt.tillbehor, [], "förledet, ingen sak");
  assert.equal(skapad("en ljusblå katt").farg, "#90CAF9", "ljusblå orörd");
  assert.equal(skapad("en lampa").kropp, "lampa");
});

test("B6.2: land­djur på sjön står minst KANT_MARGINAL (1,0) från vattnet, också när de vickar", () => {
  const sjon = platsMed("sjon")!;
  assert.ok(KANT_MARGINAL >= 1);
  const spar = (uid: string, kropp: string) => ({ uid, kropp, formel: `en ${kropp}`, beskrivning: "", skala: 1, alpha: 1, formagor: [], tillbehor: [], overraskningar: [], skapad: 1 }) as never;
  const alla = ["räv", "katt", "hund", "kanin", "gris", "ko", "get", "häst"].map((k, i) => spar(`d${i}`, k));
  for (const d of alla) {
    const [x, , z] = djurPlats(d, alla, sjon);
    assert.ok(torrKropp(sjon, x, z), `${(d as { kropp: string }).kropp} på land med marginal`);
    // närmaste vatten, på ett fint rutnät
    let min = Infinity;
    for (let px = 0; px <= 1; px += 0.01) for (let py = 0; py <= 1; py += 0.01) if (iVatten(sjon, px, py)) { const [wx, wz] = franPlats(px, py); min = Math.min(min, Math.hypot(wx - x, wz - z)); }
    assert.ok(min >= 0.95, `${(d as { kropp: string }).kropp}: ${min.toFixed(2)} till vattnet`);
    assert.ok(!iVatten(sjon, ...tillPlats(x, z)));
  }
});

test("B6.2: milstolpe.final pekar på platsens final och stämmer med final:true; finalen räknas inte som klart uppdrag", () => {
  for (const p of PLATSER) {
    if (!p.milstolpe?.final) continue;
    const u = SKRIV.find((x) => x.id === p.milstolpe!.final);
    assert.ok(u, `${p.id}: finalen ${p.milstolpe.final} finns`);
    assert.equal(u!.omrade, p.id);
    assert.equal(u!.final, true, `${p.id}: bengtsson.json och platser.json säger samma sak`);
    assert.ok(arFinal(u!));
  }
  // ett uppdrag som bara platser.json kallar final behandlas som final
  const u = { id: "x-final", omrade: "skogen" };
  const lista: Plats[] = PLATSER.map((p) => (p.id === "skogen" ? { ...p, milstolpe: { ...p.milstolpe!, final: "x-final" } } : p));
  assert.ok(arFinal(u, lista));
  assert.ok(!arFinal({ id: "skog-kvallsljus", omrade: "skogen" }));
  assert.equal(klaraPerPlats({ "skog-final-minnesljus": "klar" }).skogen ?? 0, 0);
  const allaUtom = Object.fromEntries(SKRIV.filter((x) => x.omrade === "skogen" && !arFinal(x)).map((x) => [x.id, "klar" as const]));
  assert.equal(nastaSkrivUppdrag(allaUtom, "skogen", false), undefined);
  assert.equal(nastaSkrivUppdrag(allaUtom, "skogen", true)?.id, "skog-final-minnesljus");
});

test("B6.2: las_upp öppnar nästa plats när milstolpen nås, även utan eget upplåsningsvillkor", () => {
  const lista: Plats[] = PLATSER.map((p) => (p.id === "sjon" ? { ...p, upplasning: { nagon: [] } } : p));
  const m = (klara: number, skap: number): Matt => ({ skapelser: { ang: 3, skogen: skap }, klara: { skogen: klara }, oppnade: [] });
  assert.ok(!upplast("sjon", m(4, 7), lista), "milstolpen inte nådd");
  assert.ok(upplast("sjon", m(5, 0), lista), "5 klara i skogen → skogens las_upp öppnar sjön");
  assert.ok(upplast("sjon", m(0, 8), lista), "8 skapelser i skogen");
  for (const p of PLATSER) if (p.milstolpe?.las_upp) assert.ok(platsMed(p.milstolpe.las_upp), `${p.id}: las_upp finns`);
});

test("B6.2: varje plats med final har en final_fore-replik (Bengtsson säger den när finalen öppnas)", () => {
  for (const p of PLATSER) if (p.milstolpe?.final) assert.ok((p.final_fore?.text ?? "").length > 10, `${p.id}: final_fore.text`);
});

test("B6.2: mönster-/förmågeord med modell blir en sak när de står fristående (\"en regnbåge\", \"en eld\")", () => {
  const sak = (f: string) => {
    const t = tolkaMedReserv(f);
    return t.typ === "skapad" ? t.varelse.kropp : `(${t.typ})`;
  };
  for (const f of ["en regnbåge", "regnbåge", "regnbågen", "två regnbågar"]) assert.equal(sak(f), "regnbage", f);
  for (const f of ["en eld", "eld", "elden"]) assert.equal(sak(f), "eld", f);
  assert.ok(harModell("regnbage") && harModell("eld"), "modellerna är inkopplade via data");
  // med ett djur: saken följer med som tillbehör
  const t = tolkaMedReserv("en katt och en regnbåge");
  assert.ok(t.typ === "skapad" && t.varelse.kropp === "katt" && t.varelse.tillbehor.some((x) => x.id === "regnbage"));
});

test("B6.2: som attribut behåller regnbåge och eld sin gamla betydelse", () => {
  const v = (f: string) => {
    const t = tolkaMedReserv(f);
    assert.equal(t.typ, "skapad", f);
    return (t as Extract<typeof t, { typ: "skapad" }>).varelse;
  };
  for (const f of ["en regnbågsfärgad katt", "en katt med regnbåge", "en regnbågskatt"]) {
    const x = v(f);
    assert.equal(x.kropp, "katt", f);
    assert.equal(x.monster, "regnbåge", f);
    assert.ok(!x.tillbehor.some((y) => y.id === "regnbage"), `${f}: ingen regnbåge-sak`);
  }
  for (const f of ["en drake med eld", "en eldkanin", "en drake som sprutar eld"]) {
    const x = v(f);
    assert.ok(x.formagor.includes("flammor"), `${f}: flammor`);
    assert.ok(!x.tillbehor.some((y) => y.id === "eld"), `${f}: ingen eld-sak`);
  }
  // "en eldig drake" var en drake utan förmåga före B6.2 och är det fortfarande
  assert.equal(v("en eldig drake").kropp, "drake");
});
