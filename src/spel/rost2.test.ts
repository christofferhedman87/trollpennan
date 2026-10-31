// TTS-2: resterande fasta texter har förgenererad röst (kallor i data/rost.json), mallar spelas som delar, "en kanin" finns
// för alla modeller, fasta texter utan fil läses inte av telefonen (reserv 'tyst') och syntaxviruset har en egen röst.
import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import entiteterJson from "../../data/entiteter.json" with { type: "json" };
import rostJson from "../../data/rost.json" with { type: "json" };
import { tolkaMedReserv } from "../tolk/reserv.ts";
import { bannerTid, lasTid, lasbarTid } from "./rost.ts";
import manifestJson from "../../data/rost-manifest.json" with { type: "json" };
import klientJson from "../../data/rost-klient.json" with { type: "json" };
import { ANTAL_RADER, DYNAMISK, RESERV, mallDel, normalisera, nyckel, rostFor, rostPlan } from "./rostManifest.ts";

type Rad = { f: string; ms: number; r: string; t?: string; n?: number };
const MANIFEST = manifestJson as unknown as { intro: { f: string; ms: number; n?: number } | null; mallar?: { m: string }[]; rader: Record<string, Rad> };

type Kalla = { fil?: string; talare?: string; falt?: string[]; varden?: boolean };
const R = rostJson as unknown as {
  roster: Record<string, { id: string }>;
  talare: Record<string, string>;
  kallor: { lista: Kalla[] };
};

function strangar(fil: string): { p: string; s: string }[] {
  const ut: { p: string; s: string }[] = [];
  const ga = (x: unknown, p: string) => {
    if (Array.isArray(x)) x.forEach((v) => ga(v, `${p}[]`));
    else if (x && typeof x === "object") {
      for (const [k, v] of Object.entries(x)) if (!k.startsWith("_")) ga(v, `${p}.${k}`);
    } else if (typeof x === "string") ut.push({ p, s: x });
  };
  ga(JSON.parse(fs.readFileSync(`data/${fil}`, "utf8")), "");
  return ut;
}
function texter(k: Kalla): string[] {
  return strangar(k.fil!)
    .filter(({ p, s }) => k.falt!.some((r) => new RegExp(r).test(p)) && /\p{L}/u.test(s))
    .map(({ s }) => normalisera(s));
}

test("TTS-2: inställningarna – reserv tyst, telefonen bara för barnets ord, syntaxviruset har egen röst", () => {
  assert.equal(RESERV, "tyst");
  assert.equal(DYNAMISK, "tyst");
  assert.equal(R.roster.syntaxviruset?.id, "ZMs9a3j1SLzirC7aygJQ");
  assert.equal(R.talare.syntaxviruset, "syntaxviruset");
  const ider = Object.values(R.roster).map((r) => r.id);
  assert.equal(new Set(ider).size, ider.length, "tre olika röster");
});

test("TTS-2: varje fast text i kallor har fil, och varje mall har filer för alla sina fasta delar", () => {
  const saknas: string[] = [];
  let n = 0;
  // Beslut D (En värld): texter som väntar på ElevenLabs-röst listas i data/rost.json (vantar_rost) och hoppas över.
  const vantar = new Set((rostJson as { vantar_rost?: string[] }).vantar_rost ?? []);
  for (const k of R.kallor.lista) {
    if (k.varden) continue;
    for (const t of texter(k)) {
      n++;
      if (vantar.has(t)) continue;
      if (!t.includes("{")) {
        const r = rostFor(t) ? MANIFEST.rader[nyckel(t)] : null;
        if (!r) saknas.push(`${k.fil}: ${t}`);
        else assert.equal(r.r, k.talare === "bengtsson" ? "bengtsson" : r.r, `${k.fil}: ${t}`);
        continue;
      }
      assert.ok(MANIFEST.mallar?.some((m) => m.m === t), `mallen saknas i manifestet: ${t}`);
      for (const d of t.split(/\{\w+\}/)) if (mallDel(d) && !rostFor(mallDel(d))) saknas.push(`${k.fil} (mall): ${mallDel(d)}`);
    }
  }
  assert.ok(n > 500, `bara ${n} texter`);
  assert.deepEqual(saknas.slice(0, 20), [], `${saknas.length} saknas`);
});

test("TTS-2: 'en kanin' (spelets egen formel) har fil för alla modeller, och tal 1–30 finns", () => {
  const E = (entiteterJson as { entiteter: Record<string, { ord?: string[] }> }).entiteter;
  const saknas: string[] = [];
  let n = 0;
  for (const [k, v] of Object.entries(E)) {
    const t = tolkaMedReserv(`en ${v.ord?.[0] ?? k}`) as { typ: string; varelse?: { formel?: string } };
    if (t.typ !== "skapad" || !t.varelse?.formel) continue;
    n++;
    if (!rostFor(t.varelse.formel)) saknas.push(t.varelse.formel);
  }
  assert.ok(n > 20, `bara ${n} modeller`);
  assert.deepEqual(saknas, []);
  for (let i = 1; i <= 30; i++) assert.ok(rostFor(String(i)), `talet ${i}`);
});

test("TTS-2: mallar spelas som delar – kända värden är filer, barnets eget ord är dynamiskt", () => {
  const fa = rostPlan("+3 stjärnor!");
  assert.ok(fa, "+{n} stjärnor! har ingen plan");
  assert.equal(fa.dynamisk, false);
  assert.equal(fa.delar.length, 2);
  assert.ok(fa.delar.every((d) => "f" in d));
  assert.equal(fa.ms, fa.delar.reduce((s, d) => s + ("ms" in d ? d.ms : 0), 0));
  const mall = MANIFEST.mallar!.find((m) => /^\{\w+\} /.test(m.m) && m.m.split(/\{\w+\}/).length === 2);
  assert.ok(mall, "ingen mall som börjar med {x}");
  const kanin = rostPlan(mall.m.replace(/\{\w+\}/, "en kanin"));
  assert.ok(kanin && !kanin.dynamisk && kanin.delar.length >= 2, mall.m);
  const eget = rostPlan(mall.m.replace(/\{\w+\}/, "en zorbleflax"));
  assert.ok(eget && eget.dynamisk, "okänt ord ska vara dynamiskt");
  assert.deepEqual(eget.delar[0], { dynamisk: "en zorbleflax" });
  const med = rostPlan(mall.m.replace(/\{\w+\}/, "en kanin med mössa"));
  assert.ok(med && !med.dynamisk && med.delar.length >= 3, "'en kanin med mössa' = 'en kanin' + 'med mössa' som filer");
  const blandat = rostPlan(mall.m.replace(/\{\w+\}/, "en kanin med zorbleflax"));
  assert.ok(blandat?.dynamisk && "dynamisk" in blandat.delar[0]!, "går värdet inte att dela helt läses hela värdet som barnets ord");
  assert.equal(rostPlan("Det här står inte i någon data."), null, "okänd fast text har ingen plan (tyst)");
  assert.ok(lasTid("+3 stjärnor!") > 500);
});

test("TTS-2: bannerTid – aldrig kortare än basen eller lästiden (utan fönster: ingen röst)", () => {
  assert.equal(bannerTid("Ja!", 2400), 2400);
  const lang = "Det här är en lång mening som ett barn behöver gott om tid för att hinna läsa själv.";
  assert.equal(bannerTid(lang, 2400), lasbarTid(lang));
  assert.ok(lasbarTid(lang) > 6000 && lasbarTid("x".repeat(1000)) === 12_000);
});

test("TTS-2: spelet bundlar bara klientfilen – samma filer och längder som manifestet, inga texter, inte data/rost.json", () => {
  const K = klientJson as unknown as { rader: Record<string, [string, number]>; mallar: string[] };
  assert.equal(ANTAL_RADER, Object.keys(MANIFEST.rader).length);
  for (const [k, r] of Object.entries(MANIFEST.rader)) assert.deepEqual(K.rader[k], [r.f.slice("/ljud/rost/".length, -4), r.ms], k);
  assert.deepEqual(K.mallar, (MANIFEST.mallar ?? []).map((m) => m.m));
  const src = fs.readFileSync("src/spel/rostManifest.ts", "utf8") + fs.readFileSync("src/spel/rost.ts", "utf8");
  assert.doesNotMatch(src, /rost\.json"|rost-manifest\.json"/, "spelkoden ska inte importera data/rost.json eller hela manifestet");
  assert.ok(fs.statSync("data/rost-klient.json").size < 250_000);
});

test("TTS-2: alla filer har samma ljudnivå (loudnorm till data/rost.json ljudniva)", () => {
  const mal = (rostJson as unknown as { ljudniva: { lufs: number } }).ljudniva.lufs;
  const ojamna = Object.values(MANIFEST.rader).filter((r) => r.n !== mal);
  assert.equal(MANIFEST.intro?.n, mal, "introt");
  assert.deepEqual(ojamna.map((r) => r.f).slice(0, 5), [], `${ojamna.length} filer är inte normaliserade`);
});

test("B1: Groks röstkälla omfattar båda omarkerade djurvarianterna", () => {
  const k = R.kallor.lista.find((x) => x.fil === "bengtsson.json" && x.talare === "bengtsson" && x.falt?.some((f) => new RegExp(f).test(".uppdrag[].text_bengtsson_annat_djur.text")));
  assert.ok(k, "Bengtssons alternativa repliker saknas som generatorkälla");
  const rader = texter(k);
  const vantar = new Set((rostJson as { vantar_rost?: string[] }).vantar_rost ?? []);
  for (const text of ["Brr! Ditt djur fryser. Kan du skriva fram något varmt att ha på sig?", "Så skönt! Nu kan ditt djur sluta huttra."]) {
    assert.ok(rader.includes(text), text);
    assert.ok(vantar.has(text) || rostFor(text), `raden är varken dokumenterad eller inspelad: ${text}`);
  }
});
