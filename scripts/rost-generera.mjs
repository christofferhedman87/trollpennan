// TTS-1: förgenererar röstljud med ElevenLabs för spelets fasta texter (data/rost.json, rundor/TTS/PLAN.md).
//   ELEVENLABS_API_KEY=… node scripts/rost-generera.mjs [--tak 15000] [--torr]
//   Idempotent: filnamnet är en hash av text (efter 'uttal') + röst + modell + inställningar + format; finns filen görs inget anrop.
//   Skriver public/ljud/rost/<hash>.mp3 (ffmpeg, mono, 'kbps') och data/rost-manifest.json. Tar bort föräldralösa mp3.
//   --tak = max krediter i den här körningen (svarshuvudet character-cost); --torr = bara räkna, inga anrop.
//   Nyckeln skrivs aldrig ut.
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const TORR = process.argv.includes("--torr");
const TAK = Number(arg("tak", "15000"));
const ROT = process.cwd();
const las = (f) => JSON.parse(fs.readFileSync(path.join(ROT, f), "utf8"));
const CFG = las("data/rost.json");
const UT = path.join(ROT, "public/ljud/rost");
const MANIFEST = path.join(ROT, "data/rost-manifest.json");
fs.mkdirSync(UT, { recursive: true });

/** Samma normalisering och nyckel som src/spel/rostManifest.ts (FNV-1a 32 bit över UTF-16). */
export function normalisera(t) {
  return t.normalize("NFC").replace(/\s+/g, " ").trim();
}
export function nyckel(t) {
  const s = normalisera(t);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
function uttala(t) {
  let s = t;
  for (const [ord, som] of Object.entries(CFG.uttal ?? {})) {
    s = s.replace(new RegExp(`(?<![\\p{L}])${ord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}])`, "gu"), som);
  }
  return s;
}

/** Fasta texter i prioritetsordning: { id, t, talare }. Text med platshållare ({…}) eller djursignatur (" /Ekorren") hoppas över. */
function samla() {
  const ut = [];
  const lagg = (id, t, talare) => {
    if (typeof t !== "string" || !t.trim() || t.includes("{") || / \/\p{Lu}/u.test(t)) return;
    ut.push({ id, t: normalisera(t), talare });
  };
  const tal = CFG.talare;
  for (const [fil, lista] of [["bengtsson.json", las("data/bengtsson.json").uppdrag], ["uppdrag.json", las("data/uppdrag.json").uppdrag]]) {
    for (const u of lista) {
      const vem = u.givare === "bengtsson" ? tal.bengtsson : tal.berattare;
      lagg(`${fil}:${u.id}.text`, u.givare && u.text_bengtsson ? u.text_bengtsson : u.text, vem);
      lagg(`${fil}:${u.id}.klart`, u.givare && u.klart_bengtsson ? u.klart_bengtsson : u.klart, vem);
    }
  }
  const npc = las("data/npc.json");
  const rep = npc.npc?.bengtsson?.repliker ?? {};
  (rep.fel ?? []).forEach((t, i) => lagg(`npc.json:bengtsson.fel.${i}`, t, tal.bengtsson));
  lagg("npc.json:bengtsson.inga_fler", rep.inga_fler, tal.bengtsson);
  lagg("npc.json:bengtsson.bara_aventyr", rep.bara_aventyr, tal.bengtsson);
  const pl = las("data/platser.json").platser;
  for (const p of Array.isArray(pl) ? pl : Object.values(pl)) if (p?.final_fore?.text) lagg(`platser.json:${p.id}.final_fore`, p.final_fore.text, tal.bengtsson);
  for (const [plats, d] of Object.entries(npc.repliker_plats ?? {})) (d.glad ?? []).forEach((t, i) => lagg(`npc.json:repliker_plats.${plats}.glad.${i}`, t, tal.bengtsson));
  const sedda = new Map();
  return ut.filter((r) => {
    const k = nyckel(r.t);
    if (sedda.has(k)) {
      if (sedda.get(k) !== r.t) throw new Error(`nyckelkollision ${k}: "${sedda.get(k)}" / "${r.t}"`);
      return false;
    }
    sedda.set(k, r.t);
    return true;
  });
}

function hash(t, rost, extra = "") {
  const s = JSON.stringify({ t: uttala(t), rost, m: CFG.modell, sprak: CFG.sprak, inst: CFG.installningar, fmt: CFG.format, extra });
  return crypto.createHash("sha1").update(s).digest("hex").slice(0, 16);
}
const ms = (fil) => Math.round(1000 * Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", fil]).toString().trim()));
function koda(ra, fil) {
  const tmp = path.join(os.tmpdir(), `rost-${process.pid}.mp3`);
  fs.writeFileSync(tmp, ra);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", tmp, "-ac", String(CFG.format.kanaler), "-b:a", `${CFG.format.kbps}k`, "-codec:a", "libmp3lame", fil]);
  fs.rmSync(tmp);
}

let anvant = 0;
let anrop = 0;
async function api(rost, text, medTid) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY saknas");
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${CFG.roster[rost].id}${medTid ? "/with-timestamps" : ""}?output_format=${CFG.format.api}`;
  for (let forsok = 1; ; forsok++) {
    const r = await fetch(url, {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: medTid ? "application/json" : "audio/mpeg" },
      body: JSON.stringify({ text: uttala(text), model_id: CFG.modell, language_code: CFG.sprak, voice_settings: CFG.installningar }),
    });
    if (r.ok) {
      anrop++;
      anvant += Number(r.headers.get("character-cost") ?? text.length);
      return medTid ? r.json() : Buffer.from(await r.arrayBuffer());
    }
    const fel = (await r.text()).slice(0, 300);
    if ((r.status === 429 || r.status >= 500) && forsok < 4) {
      await new Promise((res) => setTimeout(res, 3000 * forsok));
      continue;
    }
    throw new Error(`API ${r.status}: ${fel}`);
  }
}

const gammal = fs.existsSync(MANIFEST) ? las("data/rost-manifest.json") : { rader: {} };
const rader = {};
let intro = null;
let stopp = null;
const behov = { tecken: 0, rader: 0 };

// 1) introt med tidsstämplar
{
  const I = CFG.intro;
  const rost = CFG.talare.intro;
  const h = hash(I.tal, rost, "intro-tid");
  const fil = path.join(UT, `${h}.mp3`);
  if (fs.existsSync(fil) && gammal.intro?.f === `/ljud/rost/${h}.mp3`) intro = gammal.intro;
  else if (TORR) behov.tecken += I.tal.length;
  else {
    const svar = await api(rost, I.tal, true);
    koda(Buffer.from(svar.audio_base64, "base64"), fil);
    const al = svar.normalized_alignment ?? svar.alignment;
    const tecken = al.characters.join("");
    const fran = [];
    let fr = 0;
    for (const a of I.ankare) {
      const j = tecken.indexOf(a, fr);
      if (j < 0) throw new Error(`intro: ankaret "${a}" hittades inte`);
      fran.push(fran.length === 0 ? 0 : Math.round(al.character_start_times_seconds[j] * 100) / 100);
      fr = j + a.length;
    }
    const m = ms(fil);
    intro = { f: `/ljud/rost/${h}.mp3`, ms: m, fran, langd: Math.round((m / 1000 + I.efter_s) * 100) / 100, t: I.tal };
  }
}

// 2) övriga fasta texter
const texter = samla();
for (const r of texter) {
  const h = hash(r.t, r.talare);
  const f = `/ljud/rost/${h}.mp3`;
  const fil = path.join(UT, `${h}.mp3`);
  const k = nyckel(r.t);
  if (fs.existsSync(fil)) {
    rader[k] = { f, ms: gammal.rader?.[k]?.f === f ? gammal.rader[k].ms : ms(fil), r: r.talare, id: r.id, t: r.t };
    continue;
  }
  if (TORR) {
    behov.tecken += r.t.length;
    behov.rader++;
    continue;
  }
  if (stopp) continue;
  if (anvant + r.t.length * 0.5 > TAK) {
    stopp = `taket ${TAK} krediter nått (${anvant} använda)`;
    continue;
  }
  koda(await api(r.talare, r.t), fil);
  rader[k] = { f, ms: ms(fil), r: r.talare, id: r.id, t: r.t };
  if (anrop % 20 === 0) console.error(`… ${anrop} anrop, ${anvant} krediter`);
}

if (TORR) {
  console.log(JSON.stringify({ texter: texter.length, saknas: behov.rader, tecken_kvar: behov.tecken }, null, 1));
  process.exit(0);
}
// 3) föräldralösa filer bort, manifest ut
const anvanda = new Set([intro?.f, ...Object.values(rader).map((r) => r.f)].filter(Boolean).map((f) => path.basename(f)));
let bort = 0;
for (const f of fs.readdirSync(UT)) {
  if (!f.endsWith(".mp3") || anvanda.has(f)) continue;
  fs.rmSync(path.join(UT, f));
  bort++;
}
const sorterad = Object.fromEntries(Object.entries(rader).sort(([a], [b]) => a.localeCompare(b)));
const manifest = {
  version: 1,
  _om: "GENERERAD av scripts/rost-generera.mjs, ändra inte för hand. Nyckel = FNV-1a 32 av den normaliserade texten som visas (src/spel/rostManifest.ts). f = fil i public/, ms = längd, r = talare (data/rost.json), id = källa, t = texten.",
  modell: CFG.modell,
  intro,
  rader: sorterad,
};
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + "\n");
const mb = [...anvanda].reduce((s, f) => s + fs.statSync(path.join(UT, f)).size, 0) / 1e6;
console.log(JSON.stringify({ anrop, krediter: anvant, filer: anvanda.size, rader: Object.keys(rader).length, saknas: texter.length - Object.keys(rader).length, mb: Math.round(mb * 100) / 100, bort, stopp }, null, 1));
