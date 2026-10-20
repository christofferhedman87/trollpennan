// TTS-3: guiden räknar bara djur barnet själv väckt (introts kanin och katt räknas inte), äldre sparningar flyttas över,
// uttalsregeln för stammen "ekorr" och att spelets styr-API (window.__troll) bara finns i dev och under prov.
import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import rostJson from "../../data/rost.json" with { type: "json" };
import { aktivtSteg } from "./forstaStunden.ts";
import { franSparning } from "./minne.ts";

const album = (...k: string[]) => Object.fromEntries(k.map((x) => [x, { formel: `en ${x}`, poang: 1, niva: "vanlig", hjartan: 0 }]));

test("TTS-3: efter introt (kanin + katt i albumet) visar guiden 'skriv ett djur'", () => {
  const efterIntro = franSparning({ version: 2, introSedd: true, albumKropp: album("kanin", "katt"), egnaDjur: 0 });
  assert.equal(efterIntro.egnaDjur, 0);
  assert.equal(aktivtSteg(efterIntro as unknown as Record<string, unknown>)?.steg.id, "forsta-ordet");
});

test("TTS-3: äldre sparning utan egnaDjur – introts två djur räknas bort, inget steg går bakåt", () => {
  assert.equal(franSparning({ version: 2, introSedd: true, albumKropp: album("kanin", "katt") }).egnaDjur, 0);
  assert.equal(franSparning({ version: 2, introSedd: true, albumKropp: album("kanin", "katt", "hund") }).egnaDjur, 1);
  assert.equal(franSparning({ version: 2, introSedd: true, albumKropp: album("kanin", "katt", "hund", "gris", "ko", "hast", "anka") }).egnaDjur, 5);
});

test("TTS-3: uttalsregeln 'ekorr' gäller stammen, inte bara exakta ord", () => {
  const r = rostJson as unknown as { uttal: Record<string, string>; uttal_stam: Record<string, string>; omtag: Record<string, unknown> };
  assert.equal(r.uttal_stam.ekorr, "ehkorr");
  assert.equal(r.uttal.Ekorren, undefined, "den exakta regeln är ersatt av stamregeln");
  assert.equal(typeof r.omtag, "object");
});

test("TTS-3: window.__troll sätts bara i dev eller när ett prov styr webbläsaren", () => {
  const s = fs.readFileSync("src/spel/Spel.tsx", "utf8");
  const rader = s.split("\n").filter((r) => /window\.__troll\s*=/.test(r));
  assert.equal(rader.length, 1);
  assert.match(rader[0]!, /if \(import\.meta\.env\.DEV \|\| navigator\.webdriver === true\) window\.__troll = api/);
});
