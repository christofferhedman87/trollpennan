// TTS-1: det förgenererade röstljudet (data/rost-manifest.json, public/ljud/rost) hänger ihop med datan och licensen.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import bengtssonJson from "../../data/bengtsson.json" with { type: "json" };
import introJson from "../../data/intro.json" with { type: "json" };
import rostJson from "../../data/rost.json" with { type: "json" };
import uppdragJson from "../../data/uppdrag.json" with { type: "json" };
import manifestJson from "../../data/rost-manifest.json" with { type: "json" };
import skyltarJson from "../../data/skyltar.json" with { type: "json" };
import { normalisera, nyckel, rostFor, rostIntro } from "./rostManifest.ts";
import { utanSignatur } from "./rostText.ts";

// TTS-2: hela manifestet (texter, talare) läses bara av testerna; spelet bundlar data/rost-klient.json.
type Rad = { f: string; ms: number; r: string; id?: string; t?: string; tal?: string };
const MANIFEST = manifestJson as unknown as { intro: { f: string } | null; rader: Record<string, Rad> };

const PUB = path.resolve("public");
const MAPP = path.join(PUB, "ljud/rost");
type U = { id: string; givare?: string; text: string; klart: string; text_bengtsson?: string; klart_bengtsson?: string; text_bengtsson_annat_djur?: { text: string } };
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

test("TTS-1: ingen föräldralös fil, ingen fil över 1 MB och allt under 70 MB (TTS-2: ≈2 700 filer)", () => {
  const anvanda = new Set([MANIFEST.intro?.f, ...Object.values(MANIFEST.rader).map((r) => r.f)].filter(Boolean).map((f) => path.basename(f!)));
  let summa = 0;
  for (const f of fs.readdirSync(MAPP)) {
    if (!f.endsWith(".mp3")) continue;
    assert.ok(anvanda.has(f), `föräldralös fil ${f}`);
    const b = fs.statSync(path.join(MAPP, f)).size;
    assert.ok(b < 1_000_000, `${f} är ${b} byte`);
    summa += b;
  }
  assert.ok(summa < 70_000_000, `röstljudet är ${summa} byte`);
});

// Christoffer har bett Grok generera dessa två rader. Inga andra saknade inspelningar tillåts.
const VANTAR_PA_GROK = new Set([
  "kanin-fryser: Brr! Din kanin fryser om öronen. Kan du skriva fram något varmt att ha på sig?",
  "kanin-fryser: Så skönt! Nu kan öronen sluta huttra.",
  "kanin-fryser: Brr! Ditt djur fryser. Kan du skriva fram något varmt att ha på sig?",
]);

test("TTS-1: alla uppdrag har röst utom dokumenterade rader som väntar på Grok", () => {
  const saknas: string[] = [];
  for (const u of UPPDRAG) {
    const start = u.givare && u.text_bengtsson ? u.text_bengtsson : u.text;
    const klart = u.givare && u.klart_bengtsson ? u.klart_bengtsson : u.klart;
    for (const t of [start, klart, ...(u.text_bengtsson_annat_djur ? [u.text_bengtsson_annat_djur.text] : [])]) {
      if (t.includes("{") || / \/\p{Lu}/u.test(t)) continue;
      const r = rostFor(t) ? MANIFEST.rader[nyckel(t)] : null;
      if (!r) saknas.push(`${u.id}: ${t}`);
      else assert.equal(r.r, u.givare === "bengtsson" ? "bengtsson" : "pennan", u.id);
    }
  }
  assert.deepEqual(saknas.filter((rad) => !VANTAR_PA_GROK.has(rad)), [], "inga nya odokumenterade röstluckor");
});

test("TTS-1: bannerns mall 'Nytt uppdrag från …: text' hittar samma fil som texten", () => {
  const u = UPPDRAG.find((x) => x.text_bengtsson && rostFor(x.text_bengtsson))!;
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

test("TTS-2: signaturen i slutet läses inte upp (utanSignatur)", () => {
  assert.equal(utanSignatur("Kan du hjälpa honom? /Doktor Bengtsson"), "Kan du hjälpa honom?");
  assert.equal(utanSignatur("lägg den vid stubben. /Ekorren"), "lägg den vid stubben.");
  assert.equal(utanSignatur("Tack!  /Ekorren "), "Tack!");
  // bara en signatur i slutet: ett snedstreck i texten, gemener efter / eller utan mellanslag före rörs inte
  assert.equal(utanSignatur("katt/hund och sol /måne"), "katt/hund och sol /måne");
  assert.equal(utanSignatur("Hej/Doktor Bengtsson"), "Hej/Doktor Bengtsson");
  assert.equal(utanSignatur("Ingen signatur här."), "Ingen signatur här.");
});

test("TTS-2: skyltar med signatur har en fil inläst utan signaturen, och uppslaget på den visade texten hittar den", () => {
  type S = { id: string; text: string; givare?: string; text_bengtsson?: string };
  const med = (skyltarJson as { skyltar: S[] }).skyltar.flatMap((s) => [s.text, s.text_bengtsson ?? ""]).filter((t) => / \/\p{Lu}/u.test(t));
  assert.ok(med.length >= 9, `bara ${med.length} skylttexter med signatur`);
  for (const t of med) {
    const r = MANIFEST.rader[nyckel(t)];
    assert.ok(r, `ingen rad för den visade texten: ${t}`);
    assert.equal(r.tal, utanSignatur(normalisera(t)), `inläst text för ${r.id}`);
    assert.doesNotMatch(r.tal ?? "", / \/\p{Lu}/u);
    assert.equal(rostFor(t)?.f, r.f, `rostFor hittar inte filen för ${r.id}`);
    assert.ok(fs.existsSync(path.join(PUB, r.f)), `filen saknas: ${r.f}`);
  }
  for (const r of Object.values(MANIFEST.rader)) assert.doesNotMatch(r.tal ?? r.t ?? "", / \/\p{Lu}/u, `${r.id} läses med signatur`);
});
