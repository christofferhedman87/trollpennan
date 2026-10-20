// TTS-1: det förgenererade röstljudet (data/rost-manifest.json, public/ljud/rost) hänger ihop med datan och licensen.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import bengtssonJson from "../../data/bengtsson.json" with { type: "json" };
import introJson from "../../data/intro.json" with { type: "json" };
import rostJson from "../../data/rost.json" with { type: "json" };
import uppdragJson from "../../data/uppdrag.json" with { type: "json" };
import { MANIFEST, normalisera, nyckel, rostFor, rostIntro } from "./rostManifest.ts";

const PUB = path.resolve("public");
const MAPP = path.join(PUB, "ljud/rost");
type U = { id: string; givare?: string; text: string; klart: string; text_bengtsson?: string; klart_bengtsson?: string };
const UPPDRAG = [...(bengtssonJson as { uppdrag: U[] }).uppdrag, ...(uppdragJson as { uppdrag: U[] }).uppdrag];

test("TTS-1: varje manifestrad har en fil, rätt nyckel och en talare med röst i data/rost.json", () => {
  const roster = (rostJson as { roster: Record<string, { id: string }> }).roster;
  const rader = Object.entries(MANIFEST.rader);
  assert.ok(rader.length > 0, "manifestet är tomt");
  for (const [k, r] of rader) {
    assert.ok(fs.existsSync(path.join(PUB, r.f)), `filen saknas: ${r.f}`);
    assert.equal(k, nyckel(r.t ?? ""), `nyckeln stämmer inte för ${r.id}`);
    assert.ok(roster[r.r], `okänd talare ${r.r} (${r.id})`);
    assert.ok(r.ms > 300, `för kort ljud ${r.id}`);
  }
});

test("TTS-1: ingen föräldralös fil, ingen fil över 1 MB och allt under 25 MB", () => {
  const anvanda = new Set([MANIFEST.intro?.f, ...Object.values(MANIFEST.rader).map((r) => r.f)].filter(Boolean).map((f) => path.basename(f!)));
  let summa = 0;
  for (const f of fs.readdirSync(MAPP)) {
    if (!f.endsWith(".mp3")) continue;
    assert.ok(anvanda.has(f), `föräldralös fil ${f}`);
    const b = fs.statSync(path.join(MAPP, f)).size;
    assert.ok(b < 1_000_000, `${f} är ${b} byte`);
    summa += b;
  }
  assert.ok(summa < 25_000_000, `röstljudet är ${summa} byte`);
});

test("TTS-1: alla Bengtssons uppdrag (start och klart) har röst", () => {
  const saknas: string[] = [];
  for (const u of UPPDRAG) {
    const start = u.givare && u.text_bengtsson ? u.text_bengtsson : u.text;
    const klart = u.givare && u.klart_bengtsson ? u.klart_bengtsson : u.klart;
    for (const t of [start, klart]) {
      if (t.includes("{") || / \/\p{Lu}/u.test(t)) continue;
      const r = rostFor(t);
      if (!r) saknas.push(`${u.id}: ${t}`);
      else assert.equal(r.r, u.givare === "bengtsson" ? "bengtsson" : "pennan", u.id);
    }
  }
  assert.deepEqual(saknas, []);
});

test("TTS-1: bannerns mall 'Nytt uppdrag från …: text' hittar samma fil som texten", () => {
  const u = UPPDRAG.find((x) => x.text_bengtsson)!;
  const r = rostFor(u.text_bengtsson!);
  assert.ok(r);
  assert.equal(rostFor(`Nytt uppdrag från Doktor Bengtsson: ${u.text_bengtsson}`)?.f, r.f);
  assert.equal(rostFor(`  ${u.text_bengtsson}  `)?.f, r.f, "normaliseras");
  assert.equal(rostFor("Det här står inte i någon data."), null);
  assert.equal(normalisera(" a \n b "), "a b");
});

test("TTS-1: introt har Trollpennans fil och stigande scentider, en per scen", () => {
  const scener = (introJson as { scener: unknown[] }).scener.length;
  const I = rostIntro(scener);
  assert.ok(I, "introt saknas i manifestet");
  assert.ok(fs.existsSync(path.join(PUB, I.f)));
  assert.equal(I.fran[0], 0);
  for (let i = 1; i < I.fran.length; i++) assert.ok(I.fran[i]! > I.fran[i - 1]!, `scen ${i}: ${I.fran[i]} efter ${I.fran[i - 1]}`);
  assert.ok(I.fran.at(-1)! < I.ms / 1000 && I.langd > I.ms / 1000);
  assert.equal(rostIntro(scener + 1), null, "fel antal scener ger reserven");
});

test("TTS-1: rösterna är Christoffers val och licensen står i LICENSES.md", () => {
  const r = rostJson as { modell: string; roster: Record<string, { id: string }>; uttal: Record<string, string> };
  assert.equal(r.modell, "eleven_multilingual_v2");
  assert.equal(r.roster.bengtsson!.id, "kkwvaJeTPw4KK0sBdyvD");
  assert.equal(r.roster.pennan!.id, "4Ct5uMEndw4cJ7q0Jx0l");
  assert.equal(typeof r.uttal, "object");
  const lic = fs.readFileSync("LICENSES.md", "utf8");
  assert.match(lic, /## Röster och tal/);
  assert.match(lic, /ElevenLabs betald plan/);
});
