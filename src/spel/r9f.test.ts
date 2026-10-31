// R9F: ny färg/storlek ersätter den gamla när barnet lägger till på ett djur; adjektiv på en sak hamnar inte på djuret; bubblan hålls inne.
import assert from "node:assert/strict";
import { test } from "node:test";
import { tolka } from "../tolk/tolka.ts";
import { geTraff, laggPa, ONSK, tillaggFras } from "./onska.ts";
import { bubblaVanster } from "./ui/bubbla.ts";

const djur = (f: string) => {
  const r = tolka(f, { kalla: "skriv" });
  assert.equal(r.typ, "skapad", f);
  return r.typ === "skapad" ? r.varelse : (null as never);
};

test("ny färg ersätter den gamla: 'en blå katt' + 'lila' = en lila katt och himmelsönskan klaras", () => {
  const lila = ONSK.onskningar.find((o) => o.id === "lila")!;
  for (const [bas, ny, vantat] of [
    ["en blå katt", "lila", "en lila katt"],
    ["en blå katt", "mörkblå", "en mörkblå katt"],
    ["en blå och röd katt", "lila", "en lila katt"],
    ["två blå katter", "lila", "två lila katter"],
    ["en röd katt med hatt", "lila", "en lila katt med hatt"],
  ] as const) {
    const b = djur(bas);
    const e = laggPa(b, ny);
    assert.equal(e?.formel, vantat, `${bas} + ${ny}`);
    assert.ok(e && geTraff(b, e, lila), `${bas} + ${ny} klarar önskan`);
  }
});

test("ny storlek ersätter den gamla, och resten av djuret står kvar", () => {
  assert.equal(laggPa(djur("en stor blå katt med hatt"), "liten")?.formel, "en liten blå katt med hatt");
  assert.equal(tillaggFras(djur("en katt"), "med halsduk"), "en katt med halsduk");
});

test("motsatser: det sista ordet gäller, och adjektiv på en sak hamnar inte på djuret", () => {
  assert.equal(djur("en hög låg hund").formel, "en låg hund");
  assert.equal(djur("en varm kall katt").formel, "en kall katt");
  assert.equal(djur("en hund vid ett högt torn och en låg stubbe").formel, "en hund vid ett högt torn och en låg stubbe");
  assert.equal(djur("en mjuk kanin").formel, "en mjuk kanin");
});

test("pratbubblans vänsterkant hålls innanför skärmen", () => {
  assert.match(bubblaVanster("calc(5%)"), /^clamp\(calc\(min\(9rem, 39%\) \+ 6px\), .*, calc\(100% - \(min\(9rem, 39%\) \+ 6px\)\)\)$/);
});
