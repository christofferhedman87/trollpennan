// V7a: kort intro (3 steg, högst 8 s), Hoppa över och skrivläge utan gratisdjur.
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import introJson from "../../data/intro.json" with { type: "json" };

const las = (fil: string) => fs.readFileSync(fil, "utf8");

test("V7a: intro.json har tre korta steg och behåller de låsta fälten", () => {
  assert.equal(introJson.hoppa, "Hoppa över ⏭");
  assert.equal(introJson.v7a.langd, 7.5);
  assert.ok(introJson.v7a.langd <= 8);
  assert.equal(introJson.v7a.scener.length, 3);
  assert.deepEqual(
    introJson.v7a.scener.map((s) => ({ fran: s.fran, fas: s.fas, text: s.text })),
    [
      { fran: 0, fas: 0, text: "Hej! Jag är Trollpennan." },
      { fran: 2.4, fas: 1, text: "Det jag skriver … vaknar." },
      { fran: 4.8, fas: 4, text: "Vad ska vi väcka först?" },
    ],
  );
  assert.equal(introJson.scener.length, 12);
  assert.equal(introJson.skriv.ord, "katt");
  assert.equal(introJson.skriv.fras, "en katt");
  assert.deepEqual(introJson.skriv.ljud, ["k", "a", "tt"]);
});

test("V7a: titel och intro stoppar klick och låser upp ljud", () => {
  const intro = las("src/spel/intro.tsx");
  const titel = las("src/spel/ui/Titel.tsx");
  assert.match(intro, /rostIntro\(INTRO\.scener\.length\)/);
  assert.match(intro, /V7A_SCENER/);
  assert.match(intro, /V7A_LANGD/);
  assert.match(intro, /data-v7a="intro-rot"/);
  assert.match(intro, /data-v7a="hoppa-over"/);
  assert.match(intro, /data-testid="intro-hoppa"/);
  assert.match(intro, /data-testid="intro-ord"/);
  assert.match(intro, /data-testid="intro-hor"/);
  assert.match(intro, /data-testid="intro-ideer"/);
  assert.match(intro, /data-testid="intro-ide"/);
  assert.match(intro, /stopPropagation\(\)/);
  assert.match(intro, /lasOpp\(\)/);
  assert.match(titel, /stopPropagation\(\)/);
  assert.match(titel, /lasOpp\(\)/);
  assert.match(titel, /data-testid="titel-borja"/);
  assert.match(titel, /data-testid="titel-fortsatt"/);
});

test("V7a: SpelVy öppnar skrivläget utan stallKanin", () => {
  const vy = las("src/spel/ui/SpelVy.tsx");
  assert.equal(/\bstallKanin\s*\(/.test(vy), false);
  assert.match(vy, /onSteg=\{\(\) => undefined\}/);
  assert.match(vy, /setIntro\(false\)/);
  assert.match(vy, /setPanel\("spel"\)/);
  assert.match(vy, /setLage\("skriv"\)/);
  assert.match(vy, /setBokOpp\(true\)/);
});

test("Försidan: ett enda laddlager från första bildrutan, bilderna är WebP", () => {
  const html = las("index.html");
  assert.match(html, /id="forsida"/);
  assert.ok(html.indexOf('id="forsida"') > html.indexOf('id="root"'), "titeln ska vara sista dialogen (dialogFokus)");
  assert.doesNotMatch(las("src/spel/angen3d.tsx"), /ladd-3d/);
  assert.doesNotMatch(las("src/pages-main.tsx"), /fallback=\{<main/);
  for (const f of ["logga", "bakgrund-staende", "bakgrund-liggande"]) {
    const b = fs.readFileSync(`public/forsida/${f}.webp`);
    assert.equal(b.subarray(8, 12).toString(), "WEBP", f);
    assert.ok(b.length < 200_000, `${f} är ${b.length} byte`);
  }
});
