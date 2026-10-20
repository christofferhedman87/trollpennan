// TTS-1: förgenererar röstljud med ElevenLabs för spelets fasta texter (data/rost.json, rundor/TTS/PLAN.md).
//   ELEVENLABS_API_KEY=… node --experimental-strip-types scripts/rost-generera.mjs [--tak 15000] [--torr]
//   TTS-2: också 'kallor' (fasta texter i prioritetsordning, mallar med {x}) och 'varden' (tal, 'en kanin' för alla modellord,
//   ord och namn) ur data/rost.json. Mallarna hamnar i manifestets 'mallar'; deras fasta delar och värdena blir vanliga rader.
//   Idempotent: filnamnet är en hash av text (efter 'uttal') + röst + modell + inställningar + format; finns filen görs inget anrop.
//   Skriver public/ljud/rost/<hash>.mp3 (ffmpeg, mono, 'kbps') och data/rost-manifest.json. Tar bort föräldralösa mp3.
//   --tak = max krediter i den här körningen (svarshuvudet character-cost); --torr = bara räkna, inga anrop.
//   TTS-2: normaliserar alla filer till data/rost.json 'ljudniva' (loudnorm, lokalt; --utan-jamning hoppar över) och skriver
//   data/rost-klient.json (det enda spelet bundlar). Nyckeln skrivs aldrig ut.
import crypto from "node:crypto";
import { execFile, execFileSync } from "node:child_process";
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
const KLIENT = path.join(ROT, "data/rost-klient.json");
const NIVA = CFG.ljudniva ?? { lufs: -16, tp: -1.5, lra: 11 };
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
  return ut;
}

/** Alla strängar i en datafil med sökväg ('.a.b[]'), nycklar som börjar med _ hoppas över. */
function strangar(fil) {
  const ut = [];
  const ga = (x, p) => {
    if (Array.isArray(x)) x.forEach((v) => ga(v, `${p}[]`));
    else if (x && typeof x === "object") {
      for (const [k, v] of Object.entries(x)) if (!k.startsWith("_")) ga(v, `${p}.${k}`);
    } else if (typeof x === "string") ut.push({ p, s: x });
  };
  ga(las(`data/${fil}`), "");
  return ut;
}
const traff = (falt, p) => falt.some((r) => new RegExp(r).test(p));
/** En malls fasta del som text att läsa: ledande skiljetecken bort; bara skiljetecken = ingen fil. */
export function mallDel(t) {
  const s = normalisera(t.replace(/^[\s\p{P}\p{S}]+/u, ""));
  return /\p{L}/u.test(s) ? s : "";
}

/** TTS-2: värden som fylls i mallar. Formerna "en kanin" kommer från spelets egen tolk (samma som formeln i spelet). */
async function varden() {
  const V = CFG.varden ?? {};
  const ut = new Set();
  if (V.tal) for (let n = V.tal[0]; n <= V.tal[1]; n++) ut.add(String(n));
  for (const k of V.falt ?? []) {
    for (const { p, s } of strangar(k.fil)) {
      if (!traff(k.falt, p) || !s.trim()) continue;
      ut.add(normalisera(s));
      if (k.sma) ut.add(normalisera(s.toLocaleLowerCase("sv")));
    }
  }
  if (V.ord) for (const o of las("data/ord.json").ord ?? []) if (o.visa) ut.add(normalisera(o.visa));
  if (V.formler) {
    const { tolkaMedReserv } = await import(path.join(ROT, "src/tolk/reserv.ts"));
    const E = las("data/entiteter.json").entiteter;
    const ord = new Set(Object.entries(E).map(([k, v]) => v.ord?.[0] ?? k));
    for (const o of las("data/ord.json").ord ?? []) if (o.del?.kropp) ord.add(o.visa);
    for (const w of ord) {
      const t = tolkaMedReserv(`en ${w}`);
      if (t.typ === "skapad" && t.varelse?.formel) ut.add(normalisera(t.varelse.formel));
    }
  }
  if (V.tillbehor) {
    const { tolkaMedReserv } = await import(path.join(ROT, "src/tolk/reserv.ts"));
    for (const v of Object.values(las("data/entiteter.json").entiteter)) {
      if (v.typ !== "tillbehor") continue;
      for (const w of v.ord ?? []) {
        const f = tolkaMedReserv(`en kanin med ${w}`).varelse?.formel ?? "";
        if (!f.startsWith("en kanin med ")) continue;
        ut.add(normalisera(f.slice(9)));
        ut.add(normalisera(`och ${f.slice(13)}`));
      }
    }
  }
  return [...ut].map((t) => ({ id: `varde:${t}`, t, talare: V.talare ?? "pennan" }));
}

/** TTS-2: texterna i 'kallor' (i ordning) och mallarna. */
async function samlaKallor() {
  const rader = [];
  const mallar = [];
  for (const k of CFG.kallor?.lista ?? []) {
    if (k.varden) {
      rader.push(...(await varden()));
      continue;
    }
    for (const { p, s } of strangar(k.fil)) {
      if (!traff(k.falt, p) || !/\p{L}/u.test(s)) continue;
      const t = normalisera(s);
      if (!t.includes("{")) {
        rader.push({ id: `${k.fil}:${p}`, t, talare: k.talare });
        continue;
      }
      mallar.push({ m: t, r: k.talare, id: `${k.fil}:${p}` });
      for (const del of t.split(/\{\w+\}/)) {
        const d = mallDel(del);
        if (d) rader.push({ id: `mall:${k.fil}:${p}`, t: d, talare: k.talare });
      }
    }
  }
  return { rader, mallar };
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
      const kostnad = Number(r.headers.get("character-cost") ?? text.length);
      anvant += kostnad;
      if (process.env.ROST_LOGG) fs.appendFileSync(process.env.ROST_LOGG, `${kostnad}\n`);
      return medTid ? r.json() : Buffer.from(await r.arrayBuffer());
    }
    const fel = (await r.text()).slice(0, 300);
    if ((r.status === 429 || r.status >= 500) && forsok < 10) {
      await new Promise((res) => setTimeout(res, 2000 * forsok));
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

// 2) övriga fasta texter (TTS-1 först, sedan TTS-2:s källor i ordning); samma text en gång (första talaren vinner)
const K = await samlaKallor();
const texter = [];
{
  const sedda = new Map();
  for (const r of [...samla(), ...K.rader]) {
    const k = nyckel(r.t);
    if (sedda.has(k)) {
      if (sedda.get(k) !== r.t) throw new Error(`nyckelkollision ${k}: "${sedda.get(k)}" / "${r.t}"`);
      continue;
    }
    sedda.set(k, r.t);
    texter.push(r);
  }
}
const nya = [];
for (const r of texter) {
  const h = hash(r.t, r.talare);
  const f = `/ljud/rost/${h}.mp3`;
  const fil = path.join(UT, `${h}.mp3`);
  const k = nyckel(r.t);
  if (fs.existsSync(fil)) {
    const g = gammal.rader?.[k]?.f === f ? gammal.rader[k] : null;
    rader[k] = { f, ms: g ? g.ms : ms(fil), r: r.talare, id: r.id, t: r.t, ...(g?.n !== undefined ? { n: g.n } : {}) };
    continue;
  }
  if (TORR) {
    behov.tecken += r.t.length;
    behov.rader++;
    continue;
  }
  nya.push({ ...r, f, fil, k });
}
// två anrop åt gången (Starter tillåter tre samtidiga), i prioritetsordning; taket kontrolleras före varje anrop
let nasta = 0;
async function arbetare() {
  while (nasta < nya.length) {
    const r = nya[nasta++];
    if (stopp) continue;
    if (anvant + r.t.length * 0.5 > TAK) {
      stopp = `taket ${TAK} krediter nått (${anvant} använda)`;
      continue;
    }
    const tmp = `${r.fil}.tmp.mp3`;
    koda(await api(r.talare, r.t), tmp);
    fs.renameSync(tmp, r.fil);
    rader[r.k] = { f: r.f, ms: ms(r.fil), r: r.talare, id: r.id, t: r.t };
    if (anrop % 50 === 0) console.error(`… ${anrop} anrop, ${anvant} krediter`);
  }
}
await Promise.all([arbetare(), arbetare()]);

// TTS-2: ljudnivån – alla filer (gamla och nya) normaliseras till NIVA.lufs med ffmpeg loudnorm i två pass, lokalt, utan
// krediter. Ingår inte i filnamnets hash (ingen ny generering); raden får n = målnivån när filen är normaliserad.
const kor = (args) =>
  new Promise((res, rej) => execFile("ffmpeg", args, { maxBuffer: 1 << 24 }, (e, _o, err) => (e ? rej(new Error(String(err).slice(-400))) : res(String(err)))));
async function jamna(fil) {
  const af = `loudnorm=I=${NIVA.lufs}:TP=${NIVA.tp}:LRA=${NIVA.lra}`;
  const ut = await kor(["-hide_banner", "-nostats", "-i", fil, "-af", `${af}:print_format=json`, "-f", "null", "-"]);
  const m = JSON.parse(ut.slice(ut.lastIndexOf("{"), ut.lastIndexOf("}") + 1));
  const tmp = `${fil}.tmp.mp3`;
  const af2 = `${af}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
  await kor(["-v", "error", "-y", "-i", fil, "-af", `${af2},aresample=44100`, "-ac", String(CFG.format.kanaler), "-b:a", `${CFG.format.kbps}k`, "-codec:a", "libmp3lame", tmp]);
  fs.renameSync(tmp, fil);
  return Number(m.input_i);
}
const ojamna = [...Object.values(rader), ...(intro ? [intro] : [])].filter((r) => r.n !== NIVA.lufs);
if (TORR) behov.jamna = ojamna.length;
else if (!process.argv.includes("--utan-jamning")) {
  const fore = [];
  let j = 0;
  const jobb = async () => {
    while (j < ojamna.length) {
      const r = ojamna[j++];
      const fil = path.join(ROT, "public", r.f);
      fore.push({ r: r.r ?? "intro", i: await jamna(fil) });
      r.ms = ms(fil);
      r.n = NIVA.lufs;
      if (j % 200 === 0) console.error(`… ${j}/${ojamna.length} normaliserade`);
    }
  };
  await Promise.all(Array.from({ length: Math.max(2, Math.min(8, os.cpus().length)) }, jobb));
  const snitt = {};
  for (const f of fore) (snitt[f.r] ??= []).push(f.i);
  behov.jamnat = Object.fromEntries(Object.entries(snitt).map(([k, v]) => [k, `${v.length} filer, före ${Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10} LUFS`]));
}

if (TORR) {
  console.log(JSON.stringify({ jamna: behov.jamna, texter: texter.length, mallar: K.mallar.length, saknas: behov.rader, tecken_kvar: behov.tecken }, null, 1));
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
  _om: "GENERERAD av scripts/rost-generera.mjs, ändra inte för hand. Nyckel = FNV-1a 32 av den normaliserade texten som visas (src/spel/rostManifest.ts). f = fil i public/, ms = längd, r = talare (data/rost.json), id = källa, t = texten. mallar = text med {x} (TTS-2): de fasta delarna är egna rader, {x} slås upp bland raderna (värden) och annars är det barnets eget ord.",
  modell: CFG.modell,
  intro,
  mallar: K.mallar,
  rader: sorterad,
};
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + "\n");
// TTS-2: det klienten behöver (bundlas i spelet) – utan texter, talare och källor. Nyckel → [filens hash, ms].
const bas = (f) => path.basename(f, ".mp3");
const klient = {
  _om: "GENERERAD av scripts/rost-generera.mjs ur data/rost-manifest.json och data/rost.json; det enda spelet bundlar. rader: nyckel → [fil i /ljud/rost/ utan .mp3, ms].",
  reserv: CFG.reserv === "tyst" ? "tyst" : "webblasare",
  dynamisk: CFG.dynamisk === "tyst" ? "tyst" : "webblasare",
  intro: intro ? { f: intro.f, ms: intro.ms, fran: intro.fran, langd: intro.langd } : null,
  mallar: K.mallar.map((m) => m.m),
  rader: Object.fromEntries(Object.entries(sorterad).map(([k, r]) => [k, [bas(r.f), r.ms]])),
};
fs.writeFileSync(KLIENT, JSON.stringify(klient) + "\n");
const mb = [...anvanda].reduce((s, f) => s + fs.statSync(path.join(UT, f)).size, 0) / 1e6;
console.log(JSON.stringify({ jamnat: behov.jamnat, klient_kb: Math.round(fs.statSync(KLIENT).size / 1024), anrop, krediter: anvant, mallar: K.mallar.length, filer: anvanda.size, rader: Object.keys(rader).length, saknas: texter.length - Object.keys(rader).length, mb: Math.round(mb * 100) / 100, bort, stopp }, null, 1));
