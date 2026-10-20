#!/usr/bin/env node
// R3C: bulkrutinen för 3D-modeller. Validerar, optimerar och lägger in GLB-filer ur en mapp + manifest (TSV)
// och skriver datarader (entiteter, tillgångar, ord, kategoriord, fästpunkter) samt LICENSES.md och CREDITS.md.
// Ingen kod per modell: reglerna står i data/inlagg.json.
//
//   node scripts/modell-inlagg.mjs kontrollera --mapp <dir> --manifest <tsv> [--urval <fil>] [--tillval <tsv>] [--ut <json>] [--snabb]
//   node scripts/modell-inlagg.mjs lagg       --mapp <dir> --manifest <tsv> --urval <fil> [--tillval <tsv>] [--repo .] [--runda R3D] [--ut <json>]
//   node scripts/modell-inlagg.mjs urval      --fran <kontroll.json> [--alla] [--prio] [--ut <fil>]   (OK och FLAGGA ur en kontrollkörning → urvalsfil; --alla = alla rader; --prio = paketordning ur inlagg.json)
//   --mapp och --manifest kan vara kommaseparerade listor (samma ordning): flera inkorgar i ETT lagg-steg (R3D).
//   node scripts/modell-inlagg.mjs licenser   [--repo .]
//   node scripts/modell-inlagg.mjs matt       [--repo .] [--ut <json>]
//
// Verktyg (gltf-transform, sharp) installeras separat: npm ci --prefix scripts/modell-verktyg
// Node >= 22.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const HAR = path.dirname(fileURLToPath(import.meta.url));
const VERKTYG = path.join(HAR, "modell-verktyg");
const SV = new Intl.Collator("sv");

/* ------------------------------------------------------------------ rena hjälpfunktioner (testas) */

export function normRubrik(s) {
  return s.toLowerCase().replace(/å|ä/g, "a").replace(/ö/g, "o").replace(/[^a-z0-9]/g, "");
}

/** TSV → lista av objekt med normaliserade nycklar (se RUBRIK). */
export function lasTsv(text) {
  const rader = text.replace(/\r/g, "").split("\n").filter((r) => r.trim() !== "");
  const rubrik = rader[0].split("\t").map(normRubrik);
  return rader.slice(1).map((r) => {
    const f = r.split("\t");
    const o = {};
    rubrik.forEach((h, i) => (o[h] = (f[i] ?? "").trim()));
    return o;
  });
}

/** Manifestrad (Modellspanarens kolumner) → intern rad. */
export function normRad(o) {
  const forslag = o.foreslagetsvensktordkategori ?? "";
  const kat = o.batchkategori || (forslag.split(":")[0].split("/")[0] ?? "").trim();
  return {
    paket: o.paket,
    fil: o.filnamn,
    kalla: o.kallaurl ?? "",
    licens: o.licens ?? "",
    licensUrl: o.licensurl ?? "",
    forfattare: o.forfattare ?? "",
    hamtad: o.hamtdatum ?? "",
    tri: Number(o.trianglar) || 0,
    bytes: Number(o.filstorlek) || 0,
    anim: o.animationer ?? "",
    forslag,
    stil: o.stil ?? "",
    framsida: o.tydligframsida ?? "",
    anm: o.anmarkning ?? "",
    kategori: kat,
  };
}

export const slug = (s) =>
  s
    .toLowerCase()
    .replace(/å|ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/é/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** "djur/fisk: clownfisk, nemo [Poly Pizza-titel: X]" → { undertyp, ord (enkelord), flerord }. */
export function ordKandidater(forslag, undvik = []) {
  const i = forslag.indexOf(":");
  const undertyp = (i >= 0 ? forslag.slice(0, i) : "").trim();
  const rest = (i >= 0 ? forslag.slice(i + 1) : forslag).replace(/\[[^\]]*\]/g, "");
  const ord = [];
  const flerord = [];
  for (const del of rest.split(",")) {
    const w = del
      .replace(/\([^)]*\)/g, "")
      .replace(/\s+[A-Z]$/, "")
      .trim()
      .toLocaleLowerCase("sv");
    if (!w) continue;
    if (/^[a-zåäö]{2,}$/.test(w)) {
      if (!ord.includes(w) && !undvik.includes(w)) ord.push(w);
    } else flerord.push(w);
  }
  // "ormen, orm": ta bort ord som bara är grundordet + en kort ändelse
  const rena = ord.filter((w) => !ord.some((v) => v !== w && w.startsWith(v) && w.length - v.length <= 3));
  return { undertyp, ord: rena, flerord };
}

const VOKAL = /[aeiouyåäö]$/;

/** Böjningsformer som gissas ur ändelsen. Alltid gissade: ordet listas i granskningsfilen. */
export function formerFor(ord, genus, cfg = {}) {
  const er = cfg.plural_er ?? [];
  const f = [ord];
  if (genus === "n") {
    f.push(ord + (VOKAL.test(ord) ? "t" : "et"));
    const pl = VOKAL.test(ord) ? ord + "n" : ord;
    if (pl !== ord) f.push(pl);
    f.push(pl + (VOKAL.test(pl) ? "a" : "en"));
    return [...new Set(f)];
  }
  const best = ord.endsWith("e") && !ord.endsWith("ee") ? ord + "n" : VOKAL.test(ord) ? ord + "n" : ord + "en";
  f.push(best);
  let pl = null;
  if (ord.endsWith("a")) pl = ord.slice(0, -1) + "or";
  else if (ord.endsWith("e")) pl = ord.slice(0, -1) + "ar";
  else if (VOKAL.test(ord)) pl = null;
  else pl = ord + (er.includes(ord) ? "er" : "ar");
  if (pl) {
    f.push(pl);
    f.push(pl + "na");
  }
  return [...new Set(f)];
}

/** Rörelse ur undertyp och ord. */
export function rorelseFor(undertyp, ordLista, cfg) {
  // Ordlistorna går före undertypen (en pingvin är en fågel som inte flyger).
  for (const [r, lista] of Object.entries(cfg.rorelse_ord ?? {})) if (ordLista.some((w) => lista.includes(w))) return r;
  if (cfg.undertyp_rorelse?.[undertyp]) return cfg.undertyp_rorelse[undertyp];
  return "land";
}

/** Licenskontroll mot reglerna i data/inlagg.json. Returnerar felmeddelanden. */
export function kontrolleraLicens(rad, sokvag, cfg, { tillatCcBy = false, licensfilText = null } = {}) {
  const fel = [];
  const l = cfg.licens;
  const ok = new Set(l.tillatna);
  if (tillatCcBy) l.ccby_tillatna.forEach((x) => ok.add(x));
  if (!rad.licens) fel.push(`paketet "${rad.paket}" saknar licens i manifestet. Lägg till licens, källa och hämtdatum, eller ta bort filen.`);
  else if (!ok.has(rad.licens)) {
    fel.push(
      l.ccby_tillatna.includes(rad.licens)
        ? `licensen "${rad.licens}" kräver namnangivelse i spelet och är avstängd (endast CC0). Kör med --tillat-cc-by först när kreditvisning finns.`
        : `licensen "${rad.licens}" är inte tillåten (endast CC0${tillatCcBy ? " eller CC BY med kredit" : ""}).`,
    );
  }
  for (const [namn, v] of [["källa-URL", rad.kalla], ["licens-URL", rad.licensUrl], ["författare", rad.forfattare], ["hämtdatum", rad.hamtad]]) {
    if (!v) fel.push(`manifestet saknar ${namn}.`);
  }
  const sp = sokvag.toLowerCase();
  const k = l.karantan_i_sokvag.find((m) => sp.includes(m));
  if (k) fel.push(`filen ligger i en karantänmapp ("${k}") och får inte läggas in, oavsett vad manifestet säger.`);
  if (licensfilText !== null && !new RegExp(l.licensfil_innehaller, "i").test(licensfilText)) {
    fel.push(`paketets licensfil nämner inte CC0 eller public domain. Läs filen och rätta manifestet.`);
  }
  return fel;
}

export function lasUrval(text) {
  return text
    .replace(/\r/g, "")
    .split("\n")
    .map((r) => r.replace(/#.*$/, "").trim())
    .filter(Boolean);
}

/* ------------------------------------------------------------------ formatering av datafiler (bevarar filernas stil) */

const nyckelAr = (k) => JSON.stringify(k);
/** En rad på en rad i entiteter.json/tillgangar.json: { "a": 1, "b": { "c": [1, 2] } }. */
export function enRad(v) {
  if (Array.isArray(v)) return "[" + v.map(enRad).join(", ") + "]";
  if (v && typeof v === "object") return "{ " + Object.entries(v).map(([k, x]) => `${nyckelAr(k)}: ${enRad(x)}`).join(", ") + " }";
  return JSON.stringify(v);
}

/** Flerradsstil med indrag 1 (fastpunkter.json); korta talarrayer på en rad. */
export function flerRad(v, niva = 0) {
  const ind = " ".repeat(niva + 1);
  const slut = " ".repeat(niva);
  if (Array.isArray(v)) {
    if (v.every((x) => typeof x === "number")) return "[" + v.join(", ") + "]";
    return "[\n" + v.map((x) => ind + flerRad(x, niva + 1)).join(",\n") + "\n" + slut + "]";
  }
  if (v && typeof v === "object") {
    return "{\n" + Object.entries(v).map(([k, x]) => `${ind}${nyckelAr(k)}: ${flerRad(x, niva + 1)}`).join(",\n") + "\n" + slut + "}";
  }
  return JSON.stringify(v);
}

/** Lägger till nya rader sist i objektet `avsnitt` (t.ex. "entiteter") utan att röra övrig text. */
export function infogaRader(text, avsnitt, rader, stil) {
  const slut = stil === "en-rad" ? /\n( +)\}\n\}\s*$/ : /\n( +)\}\n\}\s*$/;
  const m = text.match(slut);
  if (!m) throw new Error(`hittar inte slutet på ${avsnitt}`);
  const radInd = m[1] + " ".repeat(stil === "en-rad" ? 2 : 1);
  const nya = Object.entries(rader).map(([k, v]) =>
    stil === "en-rad" ? `${radInd}${nyckelAr(k)}: ${enRad(v)}` : `${radInd}${nyckelAr(k)}: ${flerRad(v, radInd.length)}`,
  );
  if (!nya.length) return text;
  const start = text.slice(0, m.index);
  return start + ",\n" + nya.join(",\n") + "\n" + m[1] + "}\n}\n";
}

/* ------------------------------------------------------------------ verktyg (gltf-transform, sharp) */

let _bib = null;
async function bibliotek() {
  if (_bib) return _bib;
  if (!fs.existsSync(path.join(VERKTYG, "node_modules"))) {
    throw new Error("Verktygen saknas. Kör: npm ci --prefix scripts/modell-verktyg");
  }
  const req = createRequire(path.join(VERKTYG, "package.json"));
  const core = req("@gltf-transform/core");
  const ext = req("@gltf-transform/extensions");
  const fun = req("@gltf-transform/functions");
  const { MeshoptDecoder } = req("meshoptimizer");
  const sharp = req("sharp");
  await MeshoptDecoder.ready;
  const io = new core.NodeIO().registerExtensions(ext.ALL_EXTENSIONS).registerDependencies({ "meshopt.decoder": MeshoptDecoder });
  _bib = { core, ext, fun, io, sharp, cli: path.join(VERKTYG, "node_modules/@gltf-transform/cli/bin/cli.js") };
  return _bib;
}

function kor(cli, args) {
  return new Promise((res) => {
    const p = spawn(process.execPath, [cli, ...args], { stdio: ["ignore", "pipe", "pipe"] });
    let ut = "";
    p.stdout.on("data", (d) => (ut += d));
    p.stderr.on("data", (d) => (ut += d));
    p.on("close", (kod) => res({ kod, ut }));
  });
}

/**
 * Steg 0: material som renderas osynliga i three.js. Quaternius-filer kan ha baseColorFactor med alfa 0 eller alphaMode MASK
 * utan textur; då blir hela modellen genomskinlig. Utan textur finns inget att genomskina: alfa sätts till 1 och läget till OPAQUE.
 */
export async function normaliseraMaterial(ingang, utfil) {
  const { io } = await bibliotek();
  const doc = await io.read(ingang);
  let andrat = 0;
  for (const m of doc.getRoot().listMaterials()) {
    if (m.getBaseColorTexture()) continue;
    const f = m.getBaseColorFactor();
    if (f[3] < 0.99 || m.getAlphaMode() !== "OPAQUE") {
      m.setBaseColorFactor([f[0], f[1], f[2], 1]);
      m.setAlphaMode("OPAQUE");
      andrat++;
    }
  }
  await io.write(utfil, doc);
  return andrat;
}

/** Kedjan i exakt ordning (flaggorna verifierade i gltf-transform 4.5.1). Se RITNING.md avsnitt 4. */
export async function optimera(ingang, utfil, tmp, texturstorlek, cfg) {
  const { cli } = await bibliotek();
  const a = path.join(tmp, "a.glb");
  const b = path.join(tmp, "b.glb");
  const n = path.join(tmp, "n.glb");
  let materialFix = 0;
  try {
    materialFix = await normaliseraMaterial(ingang, n);
    ingang = n;
  } catch (e) {
    return { fel: `materialsteget misslyckades: ${String(e.message).split("\n")[0]}` };
  }
  const steg = [
    [
      "optimize", ingang, a,
      "--flatten", "false", "--join", "false", "--instance", "false", "--palette", "false", "--prune", "false", "--simplify", "false",
      "--compress", "false", "--texture-compress", cfg.kedja.textur, "--texture-size", String(texturstorlek),
    ],
    ["prune", a, b, "--keep-leaves", "true"],
    ["meshopt", b, utfil, "--level", "medium"],
  ];
  for (const s of steg) {
    const r = await kor(cli, s);
    if (r.kod !== 0) return { fel: `gltf-transform ${s[0]} misslyckades: ${r.ut.trim().split("\n").slice(-2).join(" ")}` };
  }
  return { ok: true, mellan: b, materialFix };
}

/* ------------------------------------------------------------------ mätning av en GLB */

const RE_HUVUD = /(^|[^a-z])(head|huvud)([^a-z]|$)|^head|headtop/i;
const RE_KROPP = /(hips|pelvis|root|body|spine|center|torso)/i;

export function axelFranVektor(dx, dz, minRatio = 1.4) {
  const ax = Math.abs(dx);
  const az = Math.abs(dz);
  if (Math.max(ax, az) < 1e-9) return null;
  if (ax >= az * minRatio) return dx > 0 ? "+x" : "-x";
  if (az >= ax * minRatio) return dz > 0 ? "+z" : "-z";
  return null;
}

/** Läser en GLB och mäter det som reglerna kräver. */
export async function matt(fil, { palett = false } = {}) {
  const { io, sharp } = await bibliotek();
  const doc = await io.read(fil);
  const root = doc.getRoot();
  const scener = root.listScenes();
  const scen = scener[0];
  const ut = {
    scener: scener.length,
    kameror: root.listNodes().filter((n) => n.getExtras()?.camera || /camera/i.test(n.getName() ?? "")).length,
    ljus: (root.listExtensionsUsed?.() ?? []).some((e) => e.extensionName === "KHR_lights_punctual") ? 1 : 0,
    externa: root.listBuffers().filter((b) => b.getURI()).length + root.listTextures().filter((t) => t.getURI()).length,
    material: root.listMaterials().length,
    texturer: root.listTextures().length,
    maxTextur: Math.max(0, ...root.listTextures().map((t) => Math.max(...(t.getSize() ?? [0])))),
    animationer: root.listAnimations().map((a) => a.getName()),
    skinnad: root.listSkins().length > 0,
    ankare: root.listNodes().map((n) => n.getName()).filter((n) => /^anchor_/i.test(n)),
    tillagg: root.listExtensionsRequired?.().map((e) => e.extensionName) ?? [],
  };
  // trianglar (summa över nodinstanser) + hörn i världsrum
  let tri = 0;
  const hornY = [];
  const hornXZ = [];
  const matTri = new Map();
  let min = [Infinity, Infinity, Infinity];
  let max = [-Infinity, -Infinity, -Infinity];
  scen.traverse((nod) => {
    const mesh = nod.getMesh();
    if (!mesh) return;
    const M = nod.getWorldMatrix();
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute("POSITION");
      if (!pos) continue;
      const ind = prim.getIndices();
      const mode = prim.getMode();
      const n = mode === 4 ? (ind ? ind.getCount() : pos.getCount()) / 3 : 0;
      tri += n;
      const mat = prim.getMaterial();
      if (mat) matTri.set(mat, (matTri.get(mat) ?? 0) + n);
      const v = [0, 0, 0];
      for (let i = 0; i < pos.getCount(); i++) {
        pos.getElement(i, v);
        const x = M[0] * v[0] + M[4] * v[1] + M[8] * v[2] + M[12];
        const y = M[1] * v[0] + M[5] * v[1] + M[9] * v[2] + M[13];
        const z = M[2] * v[0] + M[6] * v[1] + M[10] * v[2] + M[14];
        if (x < min[0]) min[0] = x;
        if (y < min[1]) min[1] = y;
        if (z < min[2]) min[2] = z;
        if (x > max[0]) max[0] = x;
        if (y > max[1]) max[1] = y;
        if (z > max[2]) max[2] = z;
        hornY.push(y);
        hornXZ.push(x, z);
      }
    }
  });
  ut.tri = Math.round(tri);
  ut.min = min;
  ut.max = max;
  ut.bredd = max[0] - min[0];
  ut.hojd = max[1] - min[1];
  ut.djup = max[2] - min[2];
  // framriktning
  ut.fram = gissaFram({ doc, scen, min, max, hornY, hornXZ });
  // färg
  if (palett) ut.farg = await fargAnalys(matTri, sharp);
  return ut;
}

function varldsPos(nod) {
  const m = nod.getWorldMatrix();
  return [m[12], m[13], m[14]];
}

/** a) anchor_face/head  b) huvud-ben mot kropps-ben  c) högsta hörnen i bounding box. */
export function gissaFram({ scen, min, max, hornY, hornXZ }) {
  const mitt = [(min[0] + max[0]) / 2, (min[2] + max[2]) / 2];
  const storlek = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]) || 1;
  const noder = [];
  scen.traverse((n) => noder.push(n));
  const namn = (n) => n.getName() ?? "";
  const anch = noder.find((n) => /^anchor_(face|head)$/i.test(namn(n)));
  if (anch) {
    const p = varldsPos(anch);
    const ax = axelFranVektor(p[0] - mitt[0], p[2] - mitt[1], 1.2);
    if (ax) return { axel: ax, metod: "ankare", saker: true };
  }
  const huvud = noder.find((n) => RE_HUVUD.test(namn(n)) && !/headtop|end$/i.test(namn(n))) ?? noder.find((n) => RE_HUVUD.test(namn(n)));
  const kropp = noder.find((n) => RE_KROPP.test(namn(n)) && n !== huvud);
  if (huvud && kropp) {
    const h = varldsPos(huvud);
    const k = varldsPos(kropp);
    const dx = h[0] - k[0];
    const dz = h[2] - k[2];
    if (Math.hypot(dx, dz) >= 0.04 * storlek) {
      const ax = axelFranVektor(dx, dz, 1.3);
      if (ax) return { axel: ax, metod: "ben", saker: true };
    }
  }
  // c) högsta 15 % av hörnen
  const h = max[1] - min[1];
  const grans = max[1] - h * 0.15;
  let sx = 0;
  let sz = 0;
  let n = 0;
  for (let i = 0; i < hornY.length; i++) {
    if (hornY[i] >= grans) {
      sx += hornXZ[2 * i];
      sz += hornXZ[2 * i + 1];
      n++;
    }
  }
  if (!n) return { axel: null, metod: "ingen", saker: false };
  const dx = sx / n - mitt[0];
  const dz = sz / n - mitt[1];
  const bx = max[0] - min[0];
  const bz = max[2] - min[2];
  const lang = bx >= bz ? "x" : "z";
  const langd = Math.max(bx, bz);
  const kort = Math.min(bx, bz);
  if (langd < kort * 1.15) return { axel: null, metod: "bbox", saker: false, orsak: "nästan lika lång som bred" };
  const d = lang === "x" ? dx : dz;
  if (Math.abs(d) < 0.06 * langd) return { axel: null, metod: "bbox", saker: false, orsak: "högsta punkterna ligger i mitten" };
  const ax = (lang === "x" ? (d > 0 ? "+x" : "-x") : d > 0 ? "+z" : "-z");
  return { axel: ax, metod: "bbox", saker: false, gissning: ax };
}

async function fargAnalys(matTri, sharp) {
  let primar = null;
  let bast = -1;
  for (const [m, t] of matTri) {
    if (t > bast) {
      primar = m;
      bast = t;
    }
  }
  if (!primar) return null;
  const faktor = primar.getBaseColorFactor();
  const tex = primar.getBaseColorTexture();
  const res = { materialnamn: primar.getName() ?? "", faktor };
  if (!tex?.getImage()) return res;
  try {
    const { data, info } = await sharp(Buffer.from(tex.getImage())).resize(48, 48, { fit: "inside" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const bin = new Array(36).fill(0);
    const sumL = new Array(36).fill(0);
    let mattade = 0;
    let tot = 0;
    let sumLall = 0;
    for (let i = 0; i < data.length; i += info.channels) {
      const [r, g, b] = [data[i] / 255, data[i + 1] / 255, data[i + 2] / 255];
      const mx = Math.max(r, g, b);
      const mn = Math.min(r, g, b);
      const l = (mx + mn) / 2;
      const s = mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1));
      tot++;
      sumLall += l;
      if (s > 0.25 && l > 0.15 && l < 0.9) {
        let h = 0;
        const d = mx - mn;
        if (mx === r) h = ((g - b) / d) % 6;
        else if (mx === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h = (h * 60 + 360) % 360;
        const k = Math.floor(h / 10) % 36;
        bin[k]++;
        sumL[k] += l;
        mattade++;
      }
    }
    if (mattade / tot < 0.12) res.palett = { from: 0, range: -1, bodyL: Math.round((sumLall / tot) * 100) / 100 };
    else {
      const k = bin.indexOf(Math.max(...bin));
      res.palett = { from: k * 10 + 5, range: 22, bodyL: Math.round((sumL[k] / bin[k]) * 100) / 100 };
    }
  } catch {
    /* ingen färganalys: art får kategorins färg */
  }
  return res;
}

/* ------------------------------------------------------------------ data och kontext */

function lasJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function samlaOrd(x, ut = new Set()) {
  if (typeof x === "string") ut.add(x.toLocaleLowerCase("sv"));
  else if (Array.isArray(x)) x.forEach((y) => samlaOrd(y, ut));
  else if (x && typeof x === "object") Object.values(x).forEach((y) => samlaOrd(y, ut));
  return ut;
}

export function byggKontext(repo) {
  const d = (f) => path.join(repo, "data", f);
  const cfg = lasJson(d("inlagg.json"));
  const ord = lasJson(d("ord.json"));
  const kat = lasJson(d("kategori-ord.json"));
  const bl = lasJson(d("blocklist.json"));
  const ent = lasJson(d("entiteter.json"));
  const till = lasJson(d("tillgangar.json"));
  const upptagna = new Map();
  for (const o of ord.ord) {
    for (const f of [o.id, o.visa, ...o.former]) upptagna.set(f.toLocaleLowerCase("sv"), `ord.json:${o.id}`);
  }
  for (const [k, lista] of Object.entries(ord.funktionsord)) for (const w of samlaOrd(lista)) upptagna.set(w, `funktionsord:${k}`);
  // Ord i kategori-ord.json är inte "tagna": en modell får ta över ordet (djurord flyttas ut ur listan vid inläggning).
  const katOrd = new Map();
  for (const [k, lista] of Object.entries(kat.kategorier)) for (const w of lista) katOrd.set(w, k);
  const sparr = new Set([...bl.ord.map((w) => w.toLocaleLowerCase("sv"))]);
  return {
    repo, cfg, ord, kat, ent, till, upptagna, katOrd,
    sparr, stammar: bl.stammar, entIds: new Set(Object.keys(ent.entiteter)), tillIds: new Set(Object.keys(till.tillgangar)),
  };
}

/** "guldfisk" tolkas redan som guld + fisk (ett djur med en egenskap); en egen modell skulle ändra det utan att någon bett om det. */
function sammansattning(w, ctx) {
  for (const o of ctx.ord.ord) {
    if (o.klass !== "djur") continue;
    for (const f of [o.id, ...o.former]) {
      const d = f.toLocaleLowerCase("sv");
      if (d.length >= 3 && w.length > d.length + 2 && w.endsWith(d)) {
        const fore = w.slice(0, -d.length);
        if (ctx.upptagna.has(fore) && !ctx.upptagna.get(fore).startsWith("denna körning")) return `${fore} + ${d}`;
      }
    }
  }
  return null;
}

function ordSparrat(w, ctx) {
  const n = w.replace(/[^a-zåäö]/g, "");
  return ctx.sparr.has(n) || ctx.stammar.some((s) => s.length >= 4 && n.includes(s));
}

/* ------------------------------------------------------------------ bearbetning av en rad */

function tierFor(cfg, kategori) {
  return cfg.kategorier[kategori] ?? null;
}

const kb = (n) => Math.round(n / 1024);

/** Billiga kontroller i manifestets ordning. Reserverar ord och id (förstkommen får ordet). */
export function planera(rad, ctx, o) {
  const { cfg } = ctx;
  const res = { fil: `${rad.paket}/${rad.fil}`, kategori: rad.kategori, fel: [], flaggor: [], info: [], status: "OK" };
  const mapp = rad.mapp ?? o.mapp;
  const sokvag = path.join(mapp, rad.paket, rad.fil);
  if (!fs.existsSync(sokvag)) {
    res.fel.push(`filen finns inte: ${sokvag}`);
    res.status = "FEL";
    return res;
  }
  const tier = tierFor(cfg, rad.kategori);
  if (!tier) res.fel.push(`kategorin "${rad.kategori}" finns inte i data/inlagg.json (kategorier).`);
  // licens
  let licensfil = null;
  for (const kand of [path.join(mapp, rad.paket, cfg.licens.licensfil), path.join(mapp, "..", rad.paket, cfg.licens.licensfil)]) {
    if (fs.existsSync(kand)) {
      licensfil = fs.readFileSync(kand, "utf8");
      break;
    }
  }
  if (licensfil === null) res.info.push("ingen licensfil i paketet (licensen styrkt av URL per modell)");
  res.fel.push(...kontrolleraLicens(rad, sokvag, cfg, { tillatCcBy: o.tillatCcBy, licensfilText: licensfil }));
  // ord
  const k = ordKandidater(rad.forslag, cfg.ordforandring?.undvik ?? []);
  res.undertyp = k.undertyp;
  if (o.tillval?.get(`${rad.paket}/${rad.fil}`)?.fram) res.framTillval = o.tillval.get(`${rad.paket}/${rad.fil}`).fram;
  const tillv = o.tillval?.get(`${rad.paket}/${rad.fil}`) ?? {};
  let ordLista = tillv.ord ? tillv.ord.split(",").map((s) => s.trim()).filter(Boolean) : k.ord;
  const tagna = [];
  const nya = [];
  for (const w of ordLista) {
    const redan = ctx.upptagna.get(w);
    const sam = sammansattning(w, ctx);
    if (ordSparrat(w, ctx)) res.flaggor.push(`ordet "${w}" är spärrat (blocklist) och används inte`);
    else if (sam) tagna.push(`${w} (tolkas redan som ${sam})`);
    else if (redan) tagna.push(`${w} (${redan})`);
    else nya.push(w);
  }
  res.ord = nya;
  res.ordTagna = tagna;
  res.flyttaKat = nya.filter((w) => ctx.katOrd.has(w));
  if (tier?.typ === "djur" && res.flyttaKat.length) res.info.push(`flyttas ut ur kategori-ord.json (blir ett riktigt djur): ${res.flyttaKat.join(", ")}`);
  if (!nya.length) res.hoppa = k.ord.length || k.flerord.length ? "ordet är redan taget eller spärrat" : "manifestet föreslår inget enkelt ord";
  if (!nya.length && k.flerord.length && !k.ord.length) res.hoppa = `inget enkelt ord (bara flerord: ${k.flerord.join(", ")})`;
  const id = tillv.id ?? (nya[0] ? slug(nya[0]) : slug(path.basename(rad.fil, ".glb")));
  res.id = id;
  if (nya.length && !/^[a-z][a-z0-9-]{1,31}$/.test(id)) res.fel.push(`id "${id}" är ogiltigt. Använd gemener a–z och bindestreck, t.ex. "ko".`);
  if (ctx.entIds.has(id) || ctx.tillIds.has(id)) {
    if (ctx.ent.entiteter[id]?.inlagd) res.hoppa = `redan inlagd i en tidigare körning (${ctx.ent.entiteter[id].inlagd})`;
    else res.hoppa = res.hoppa ?? `id "${id}" finns redan i data/entiteter.json eller tillgangar.json`;
  }
  if (o.ids.has(id) && !res.hoppa) res.hoppa = `variant av "${id}" (samma id som en tidigare rad i körningen; en modell per ord)`;
  if (!/^[a-z0-9-]+\.glb$/i.test(rad.fil.replace(/[^\x20-\x7e]/g, "_")) || /[åäö ]/i.test(rad.fil)) res.fel.push(`filnamnet "${rad.fil}" innehåller å/ä/ö eller mellanslag.`);
  // stil och ursprung (flaggas, blockerar inte)
  if (rad.stil && rad.stil !== "nära") res.flaggor.push(`stil: ${rad.stil} (avvikande från Kenney/Quaternius-stilen)`);
  if (/AI-genererat/i.test(rad.anm)) res.flaggor.push("ursprung: kan vara AI-genererat (Gobkit), CC0 enligt utgivaren");
  if (/Poly Pizza/i.test(rad.anm) && /upphov/i.test(rad.anm)) res.flaggor.push("upphov: kontrollerat bara mot Poly Pizzas angivelse");
  if (tier && rad.tri > tier.tri) res.fel.push(`${rad.tri} trianglar (högst ${tier.tri} för ${rad.kategori}). Förenkla i Blender (Decimate) eller välj en annan modell.`);
  if (res.fel.length || res.hoppa) {
    res.status = res.fel.length ? "FEL" : "HOPPAD";
    return res;
  }
  for (const w of res.ord) ctx.upptagna.set(w, "denna körning");
  o.ids.add(id);
  ctx.entIds.add(id);
  res.tier = tier;
  return res;
}

/** Tunga kontroller: mätning, kedjan, mått efter kedjan. */
export async function tungt(res, rad, ctx, o) {
  const { cfg } = ctx;
  const tier = res.tier;
  const id = res.id;
  const sokvag = path.join(rad.mapp ?? o.mapp, rad.paket, rad.fil);
  delete res.tier;
  if (res.status !== "OK") return res;
  if (o.snabb) return res;
  // mätning av indata
  let m;
  try {
    m = await matt(sokvag, { palett: tier?.typ === "djur" });
  } catch (e) {
    res.fel.push(`filen går inte att läsa som GLB: ${String(e.message).split("\n")[0]}`);
    res.status = "FEL";
    return res;
  }
  res.matt = { tri: m.tri, hojd: +m.hojd.toFixed(3), bredd: +m.bredd.toFixed(3), djup: +m.djup.toFixed(3), material: m.material, texturer: m.texturer, maxTextur: m.maxTextur, skinnad: m.skinnad, animationer: m.animationer.length };
  if (m.scener !== 1) res.fel.push(`filen innehåller ${m.scener} scener (exakt en krävs).`);
  if (m.externa) res.fel.push(`filen har ${m.externa} externa resurser (texturer/buffertar måste vara inbäddade).`);
  if (!(m.hojd > 1e-4) || !Number.isFinite(m.hojd)) res.fel.push("modellen har ingen höjd (tom eller degenererad).");
  if (m.hojd > 0 && Math.max(m.bredd, m.djup) / m.hojd > 25) res.flaggor.push(`mycket platt modell (bredd/höjd = ${(Math.max(m.bredd, m.djup) / m.hojd).toFixed(0)})`);
  if (Math.abs(m.tri - rad.tri) > Math.max(2, rad.tri * 0.02)) res.flaggor.push(`manifestet anger ${rad.tri} trianglar, mätt ${m.tri}`);
  if (tier && m.tri > tier.tri && !res.fel.some((f) => f.includes("trianglar"))) res.fel.push(`${m.tri} trianglar (högst ${tier.tri} för ${rad.kategori}). Förenkla i Blender (Decimate) eller välj en annan modell.`);
  res.ankare = m.ankare;
  res.anim = m.animationer;
  if (tier?.typ === "djur" || rad.kategori === "fordon") {
    let f = m.fram;
    const prior = cfg.fram_per_paket?.[rad.paket];
    if (prior) f = { axel: prior, metod: "paketprior", saker: true };
    else if (rad.kategori === "fordon" && f.metod === "bbox") f = { axel: null, metod: "bbox", orsak: "bounding-boxregeln är opålitlig för fordon (gissade fel på alla Kenney-bilar)" };
    res.fram = f;
    if (rad.framsida !== "nej") {
      if (!f.axel) res.flaggor.push(`framsidan kunde inte mätas (${f.metod}${f.orsak ? ": " + f.orsak : ""}); +z antas. Titta på kontaktarket.`);
      else if (f.axel !== "+z") res.flaggor.push(`framsidan verkar vara ${f.axel} (${f.metod === "bbox" ? "gissad ur bounding box" : "mätt via " + f.metod}), standard är +z. framAxel läggs in på entiteten.`);
    }
  }
  if (res.fel.length) {
    res.status = "FEL";
    return res;
  }
  // kedjan
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "inlagg-"));
  try {
    const slutfil = path.join(tmp, "ut.glb");
    let storlek = cfg.kedja.texturstorlek;
    let r = await optimera(sokvag, slutfil, tmp, storlek, cfg);
    if (r.fel) {
      res.fel.push(r.fel);
      res.status = "FEL";
      return res;
    }
    let bytes = fs.statSync(slutfil).size;
    if (tier && bytes > tier.kb * 1024 && res.matt.texturer) {
      storlek = cfg.kedja.reservstorlek;
      res.info.push(`${kb(bytes)} KB med ${cfg.kedja.texturstorlek} px-texturer, provar ${storlek} px`);
      r = await optimera(sokvag, slutfil, tmp, storlek, cfg);
      if (r.fel) {
        res.fel.push(r.fel);
        res.status = "FEL";
        return res;
      }
      bytes = fs.statSync(slutfil).size;
    }
    res.texturstorlek = storlek;
    if (r.materialFix) res.info.push(`${r.materialFix} material gjordes täckande (alfa 0/MASK utan textur renderas osynligt)`);
    res.bytesFore = fs.statSync(sokvag).size;
    res.bytes = bytes;
    const hard = tier?.kb_max ?? tier?.kb;
    if (tier && bytes > hard * 1024) res.fel.push(`${kb(bytes)} KB (högst ${hard} KB för ${rad.kategori}). Kontrollera texturen (högst ${storlek} px) och animationerna.`);
    else if (tier && bytes > tier.kb * 1024) res.flaggor.push(`${kb(bytes)} KB är över riktvärdet ${tier.kb} KB för ${rad.kategori} (hårt tak ${hard} KB): bra kandidat att hämta först när ordet används.`);
    const e = await matt(slutfil);
    const ovrigt = e.tillagg.filter((t) => !cfg.kedja.tillatna_tillagg.includes(t));
    if (ovrigt.length) res.fel.push(`filen kräver tillägg som spelet inte stöder: ${ovrigt.join(", ")}.`);
    if (e.tri !== m.tri) res.fel.push(`trianglarna ändrades i kedjan (${m.tri} → ${e.tri}); kedjan ska inte förenkla.`);
    if (m.ankare.length && m.ankare.some((a) => !e.ankare.includes(a))) res.fel.push("ankarnoderna försvann i kedjan.");
    res.efter = { tri: e.tri, tillagg: e.tillagg };
    if (!res.fel.length && o.behall) {
      fs.mkdirSync(o.behall, { recursive: true });
      res.optimerad = path.join(o.behall, `${id}.glb`);
      fs.copyFileSync(slutfil, res.optimerad);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  res.farg = m.farg ?? null;
  res.malhojdMatt = m.hojd;
  res.status = res.fel.length ? "FEL" : res.flaggor.length ? "OK_FLAGGAD" : "OK";
  return res;
}

/* ------------------------------------------------------------------ datarader per modell */

export function radFor(res, rad, ctx) {
  const { cfg } = ctx;
  const runda = ctx.runda ?? "R3C";
  const tier = cfg.kategorier[rad.kategori];
  const ordLista = res.ord;
  const hojd = Math.max(...ordLista.map((w) => cfg.malhojd_ord?.[w] ?? 0), 0) || tier.malhojd;
  const rorelse = tier.typ === "djur" ? rorelseFor(res.undertyp, ordLista, cfg) : undefined;
  const ent = { typ: tier.typ, kategori: tier.kat, modell: res.id, malhojd: +hojd.toFixed(2) };
  if (res.farg?.palett) ent.palett = res.farg.palett;
  else if (res.farg?.materialnamn && tier.typ === "djur") ent.material = { [res.farg.materialnamn]: "farg" };
  ent.art = artFarg(res, tier);
  if (rorelse && rorelse !== "land") ent.rorelse = rorelse;
  const f = res.fram;
  if (res.framTillval) ent.framAxel = res.framTillval;
  else if (f?.axel && f.axel !== "+z" && rad.framsida !== "nej") ent.framAxel = f.axel;
  if (!(cfg.forladda_id ?? []).includes(res.id)) ent.forladda = false;
  ent.ord = ordLista;
  ent.inlagd = runda;
  const till = {
    fil: `/models/bulk/${res.id}.glb`,
    licens: rad.licens,
    upphov: `${rad.forfattare}`,
    kalla: rad.kalla,
    paket: rad.paket,
    trianglar: res.efter.tri,
    bytes: res.bytes,
    stil: rad.stil || "nära",
    inlagd: runda,
  };
  const ordRader = [];
  if (tier.typ === "djur") {
    for (const w of ordLista) {
      const genus = cfg.ett_ord.includes(w) ? "n" : "u";
      const r = {
        id: w, klass: "djur", niva: "fritt", visa: w, genus, former: formerFor(w, genus, cfg),
      };
      if (rorelse) r.signatur = cfg.signatur_rorelse?.[rorelse] ?? "studs";
      r.kalla = `${runda} ${rad.paket}`;
      r.del = { kropp: res.id };
      ordRader.push(r);
    }
  }
  let fast = null;
  if (tier.typ === "djur") fast = fastpunktRad(res, ent, ctx);
  return { ent, till, ordRader, fast, kategoriord: tier.typ !== "djur" ? { kat: tier.kategoriord, ord: ordLista } : null };
}

function hsl2hex(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function artFarg(res, tier) {
  const p = res.farg?.palett;
  if (!p) return tier.art;
  if (p.range < 0) return hsl2hex(0, 0, Math.min(0.75, Math.max(0.3, p.bodyL)));
  return hsl2hex(p.from, 0.55, Math.min(0.7, Math.max(0.4, p.bodyL)));
}

const MALLAR = {
  fyrfota: { huvudTopp: [0.5, 0.92, 0.72], ansikte: [0.5, 0.78, 1], ogonL: [0.34, 0.78, 1], ogonR: [0.66, 0.78, 1], mun: [0.5, 0.5, 1], hals: [0.5, 0.62, 0.64], rygg: [0.5, 0.6, 0.38] },
  upprätt: { huvudTopp: [0.5, 1, 0.5], ansikte: [0.5, 0.9, 1], ogonL: [0.4, 0.92, 1], ogonR: [0.6, 0.92, 1], mun: [0.5, 0.84, 1], hals: [0.5, 0.8, 0.5], rygg: [0.5, 0.65, 0.25] },
  fisk: { huvudTopp: [0.5, 0.68, 0.74], ansikte: [0.5, 0.62, 1], ogonL: [0.34, 0.62, 1], ogonR: [0.66, 0.62, 1], mun: [0.5, 0.5, 1], hals: [0.5, 0.5, 0.66], rygg: [0.5, 0.8, 0.42] },
};

/** Modellens framsida är +z i mallarna; andra axlar speglas/byts så att bråkdelarna gäller modellens eget rum. */
export function tillModellRum([fx, fy, fz], axel) {
  switch (axel) {
    case "-z": return [1 - fx, fy, 1 - fz];
    case "+x": return [fz, fy, fx];
    case "-x": return [1 - fz, fy, fx];
    default: return [fx, fy, fz];
  }
}

function fastpunktRad(res, ent, ctx) {
  const m = res.matt;
  const standard = ctx.fastpunkter?.kroppar?.standard;
  const mall = ent.rorelse === "sim" ? "fisk" : m.hojd / Math.max(m.bredd, m.djup) > 1.25 ? "upprätt" : "fyrfota";
  const axel = ent.framAxel ?? "+z";
  const ankare = {};
  for (const [n, v] of Object.entries(MALLAR[mall])) ankare[n] = tillModellRum(v, axel).map((x) => +x.toFixed(3));
  return {
    mesh: standard?.mesh ?? undefined,
    modell: { ref: "bbox", matt: { bredd: { hojd: mall === "upprätt" ? 0.55 : 0.9 } }, ankare },
  };
}

/* ------------------------------------------------------------------ kommandon */

async function pool(lista, n, fn) {
  const ut = new Array(lista.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < lista.length) {
        const k = i++;
        ut[k] = await fn(lista[k], k);
      }
    }),
  );
  return ut;
}

function argv() {
  const [kommando, ...rest] = process.argv.slice(2);
  const a = { kommando, flaggor: new Set() };
  for (let i = 0; i < rest.length; i++) {
    if (!rest[i].startsWith("--")) continue;
    const n = rest[i].slice(2);
    if (["snabb", "tillat-cc-by", "torrt", "alla", "prio"].includes(n)) a.flaggor.add(n);
    else a[n] = rest[++i];
  }
  return a;
}

export function sammanfatta(resultat) {
  const rakna = (f) => resultat.filter(f).length;
  const fel = {};
  for (const r of resultat) for (const f of r.fel) {
    const nyckel = f.replace(/\d[\d\s]*/g, "N").slice(0, 60);
    fel[nyckel] = (fel[nyckel] ?? 0) + 1;
  }
  const flagg = {};
  for (const r of resultat) for (const f of r.flaggor) {
    const nyckel = f.split(/[:(]/)[0].replace(/"[^"]*"/g, '"…"').replace(/\d[\d\s]*/g, "N").trim().slice(0, 50);
    flagg[nyckel] = (flagg[nyckel] ?? 0) + 1;
  }
  const n = resultat.length;
  const ok = rakna((r) => r.status === "OK");
  const okF = rakna((r) => r.status === "OK_FLAGGAD");
  const hopp = rakna((r) => r.status === "HOPPAD");
  const felN = rakna((r) => r.status === "FEL");
  const unikaOrd = new Set(resultat.flatMap((r) => (r.status === "OK" || r.status === "OK_FLAGGAD" ? r.ord : []))).size;
  return { rader: n, ok, ok_flaggad: okF, hoppade: hopp, fel: felN, klarar_utan_flagga_procent: +((100 * ok) / n).toFixed(1), klarar_procent: +((100 * (ok + okF)) / n).toFixed(1), unika_nya_ord: unikaOrd, felorsaker: fel, flaggor: flagg };
}

/** "a,b" + "x,y" → [{ mapp: a, manifest: x }, { mapp: b, manifest: y }] (en inkorg per par). */
export function delaKallor(mapp, manifest) {
  const m = String(mapp).split(",").map((x) => x.trim()).filter(Boolean);
  const f = String(manifest).split(",").map((x) => x.trim()).filter(Boolean);
  if (m.length !== f.length) throw new Error(`--mapp (${m.length}) och --manifest (${f.length}) måste vara lika många`);
  return m.map((x, i) => ({ mapp: path.resolve(x), manifest: f[i] }));
}

async function laddaRader(a) {
  const kallor = delaKallor(a.mapp, a.manifest);
  const rader = kallor.flatMap((k) => lasTsv(fs.readFileSync(k.manifest, "utf8")).map(normRad).map((r) => ({ ...r, mapp: k.mapp })));
  let urval = null;
  if (a.urval) urval = lasUrval(fs.readFileSync(a.urval, "utf8"));
  const val = urval ? urval.map((u) => {
    const r = rader.find((x) => `${x.paket}/${x.fil}` === u || x.fil === u);
    if (!r) throw new Error(`urvalet nämner ${u} som inte finns i något manifest`);
    return r;
  }) : rader;
  let tillval = null;
  if (a.tillval) {
    tillval = new Map();
    for (const o of lasTsv(fs.readFileSync(a.tillval, "utf8"))) tillval.set(o.fil, { id: o.id || undefined, ord: o.ord || undefined, fram: o.fram || undefined });
  }
  return { mapp: kallor[0].mapp, val, tillval };
}

function skrivUt(resultat) {
  for (const r of resultat) {
    if (r.status === "OK") console.log(`OK     ${r.fil}${r.id ? "  → " + r.id : ""}  (${(r.ord ?? []).join(", ")})`);
    else if (r.status === "OK_FLAGGAD") console.log(`FLAGGA ${r.fil}  → ${r.id}: ${r.flaggor.join("; ")}`);
    else if (r.status === "HOPPAD") console.log(`HOPPAR ${r.fil}: ${r.hoppa}`);
    else console.log(`FEL    ${r.fil}: ${r.fel.join(" ")}`);
  }
}

async function planeraOchKor(a, behall) {
  const repo = path.resolve(a.repo ?? ".");
  const ctx = byggKontext(repo);
  ctx.runda = a.runda ?? "R3C";
  ctx.fastpunkter = lasJson(path.join(repo, "data", "fastpunkter.json"));
  const { mapp, val, tillval } = await laddaRader(a);
  const o = { mapp, tillval, snabb: a.flaggor.has("snabb"), tillatCcBy: a.flaggor.has("tillat-cc-by"), ids: new Set(), behall };
  const planer = val.map((rad) => ({ rad, res: planera(rad, ctx, o) }));
  const resultat = await pool(planer, Number(a.parallellt ?? 4), ({ rad, res }) => tungt(res, rad, ctx, o));
  return { ctx, o, rader: planer.map((p) => p.rad), resultat };
}

async function cmdKontrollera(a) {
  const { resultat } = await planeraOchKor(a, null);
  skrivUt(resultat);
  const sam = sammanfatta(resultat);
  console.log("\n" + JSON.stringify(sam, null, 2));
  if (a.ut) fs.writeFileSync(a.ut, JSON.stringify({ sammanfattning: sam, rader: resultat }, null, 1) + "\n");
  process.exitCode = sam.fel ? 1 : 0;
}

function skrivFil(p, text) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text);
}

async function cmdLagg(a) {
  const repo = path.resolve(a.repo ?? ".");
  const behall = fs.mkdtempSync(path.join(os.tmpdir(), "inlagg-ut-"));
  const { ctx, rader, resultat } = await planeraOchKor(a, behall);
  skrivUt(resultat);
  const klara = resultat.map((r, i) => ({ r, rad: rader[i] })).filter(({ r }) => r.status === "OK" || r.status === "OK_FLAGGAD");
  const d = (f) => path.join(repo, "data", f);
  const nyaEnt = {};
  const nyaTill = {};
  const nyaFast = {};
  const nyaOrd = [];
  const nyaKat = {};
  const ututKat = new Set();
  for (const { r, rad } of klara) {
    if (ctx.cfg.kategorier[rad.kategori]?.typ === "djur") for (const w of r.flyttaKat ?? []) ututKat.add(w);
    const x = radFor(r, rad, ctx);
    nyaEnt[r.id] = x.ent;
    nyaTill[r.id] = x.till;
    if (x.fast) nyaFast[r.id] = x.fast;
    nyaOrd.push(...x.ordRader);
    if (x.kategoriord) (nyaKat[x.kategoriord.kat] ??= []).push(...x.kategoriord.ord);
    fs.mkdirSync(path.join(repo, "public/models/bulk"), { recursive: true });
    fs.copyFileSync(r.optimerad, path.join(repo, "public/models/bulk", `${r.id}.glb`));
  }
  const text = (f) => fs.readFileSync(d(f), "utf8");
  if (klara.length) {
    skrivFil(d("entiteter.json"), infogaRader(text("entiteter.json"), "entiteter", nyaEnt, "en-rad"));
    skrivFil(d("tillgangar.json"), infogaRader(text("tillgangar.json"), "tillgangar", nyaTill, "en-rad"));
    if (Object.keys(nyaFast).length) skrivFil(d("fastpunkter.json"), infogaRader(text("fastpunkter.json"), "kroppar", nyaFast, "flerrad"));
    if (nyaOrd.length) {
      const ord = lasJson(d("ord.json"));
      ord.ord.push(...nyaOrd);
      skrivFil(d("ord.json"), JSON.stringify(ord, null, 1) + "\n");
    }
    if (Object.keys(nyaKat).length || ututKat.size) {
      const kat = lasJson(d("kategori-ord.json"));
      const alla = new Set(Object.values(kat.kategorier).flat());
      for (const k of Object.keys(kat.kategorier)) kat.kategorier[k] = kat.kategorier[k].filter((w) => !ututKat.has(w));
      for (const [k, lista] of Object.entries(nyaKat)) {
        const sorterad = kat.kategorier[k].every((w, i, l) => i === 0 || SV.compare(l[i - 1], w) <= 0);
        kat.kategorier[k].push(...lista.filter((w) => !alla.has(w) && !kat.kategorier[k].includes(w)));
        if (sorterad) kat.kategorier[k].sort(SV.compare);
      }
      skrivFil(d("kategori-ord.json"), JSON.stringify(kat, null, 1) + "\n");
    }
    licenser(repo);
  }
  fs.rmSync(behall, { recursive: true, force: true });
  const sam = sammanfatta(resultat);
  const gransk = klara.flatMap(({ r }) => (nyaOrd.filter((o) => o.del.kropp === r.id)).map((o) => `${o.id}\t${o.genus}\t${o.former.join(", ")}\t${r.id}\t${r.fil}`));
  if (a.ut) {
    fs.writeFileSync(a.ut, JSON.stringify({ sammanfattning: sam, inlagda: klara.map(({ r }) => r.id), rader: resultat }, null, 1) + "\n");
    fs.writeFileSync(a.ut.replace(/\.json$/, "") + "-ordgranskning.tsv", ["ord\tgenus\tformer (gissade)\tentitet\tfil", ...gransk].join("\n") + "\n");
  }
  console.log(`\nInlagt: ${klara.length} modeller (${nyaOrd.length} djurord, ${Object.values(nyaKat).flat().length} kategoriord).`);
  console.log(JSON.stringify(sam, null, 2));
}

/* ------------------------------------------------------------------ LICENSES.md och CREDITS.md */

const MARK_START = "<!-- R3C:start (genereras av scripts/modell-inlagg.mjs, redigera inte för hand) -->";
const MARK_SLUT = "<!-- R3C:end -->";

export function licenstexter(till) {
  const t = Object.entries(till.tillgangar);
  const lic = till.licenser;
  const antalPerLic = {};
  for (const [, x] of t) antalPerLic[x.licens] = (antalPerLic[x.licens] ?? 0) + 1;
  const grupper = new Map();
  for (const [id, x] of t) {
    const g = x.paket ?? `(för hand) ${x.upphov}`;
    const e = grupper.get(g) ?? { upphov: x.upphov, licens: x.licens, kalla: x.kalla, ids: [] };
    e.ids.push(id);
    grupper.set(g, e);
  }
  let md = "# LICENSES – Trollpennan\n\nGenereras av `node scripts/modell-inlagg.mjs licenser` ur `data/tillgangar.json`. Redigera inte för hand; ändra raden i tillgangar.json.\n\n";
  md += "## Licenser som används\n\n| Licens | Namn | Namnangivelse krävs | Antal tillgångar |\n|---|---|---|---|\n";
  for (const [k, n] of Object.entries(antalPerLic)) md += `| ${k} | ${lic[k]?.namn ?? "?"} | ${lic[k]?.namnangivelse ? "**ja**" : "nej"} | ${n} |\n`;
  md += "\n## Per paket\n\n| Paket | Upphov (författare) | Licens | Källa | Antal |\n|---|---|---|---|---|\n";
  for (const [g, e] of [...grupper].sort((x, y) => SV.compare(x[0], y[0]))) md += `| ${g} | ${e.upphov} | ${e.licens} | ${e.kalla} | ${e.ids.length} |\n`;
  md += "\n## Alla modellfiler\n\n| Nyckel | Fil | Licens | Upphov | Källa |\n|---|---|---|---|---|\n";
  for (const [id, x] of t) md += `| ${id} | ${x.fil ?? x.mapp} | ${x.licens} | ${x.upphov} | ${x.kalla} |\n`;
  return { md, grupper, lic };
}

export function kreditBlock(till) {
  const { grupper, lic } = licenstexter(till);
  let b = `${MARK_START}\n\n## Inlagda modellpaket (bulkrutinen)\n\n| Paket | Upphov | Licens | Källa | Antal modeller |\n|---|---|---|---|---|\n`;
  for (const [g, e] of [...grupper].sort((x, y) => SV.compare(x[0], y[0]))) {
    if (g.startsWith("(för hand)")) continue;
    b += `| ${g} | ${e.upphov} | ${e.licens}${lic[e.licens]?.namnangivelse ? " – **namnangivelse krävs**" : ""} | ${e.kalla} | ${e.ids.length} |\n`;
  }
  b += `\nAlla paket ovan är CC0 om inget annat står. Fullständig lista per fil finns i LICENSES.md.\n\n${MARK_SLUT}\n`;
  return b;
}

export function licenser(repo) {
  const till = lasJson(path.join(repo, "data", "tillgangar.json"));
  skrivFil(path.join(repo, "LICENSES.md"), licenstexter(till).md);
  const cp = path.join(repo, "CREDITS.md");
  let c = fs.existsSync(cp) ? fs.readFileSync(cp, "utf8") : "# CREDITS – Trollpennan\n";
  const har = Object.values(till.tillgangar).some((x) => x.paket);
  const i = c.indexOf(MARK_START);
  const j = c.indexOf(MARK_SLUT);
  if (i >= 0 && j > i) c = c.slice(0, i).trimEnd() + "\n\n" + (har ? kreditBlock(till) : "") + c.slice(j + MARK_SLUT.length).replace(/^\n+/, "");
  else if (har) c = c.trimEnd() + "\n\n" + kreditBlock(till);
  skrivFil(cp, c.endsWith("\n") ? c : c + "\n");
  return true;
}

/* ------------------------------------------------------------------ mätning av nedladdning */

function cmdMatt(a) {
  const repo = path.resolve(a.repo ?? ".");
  const cfg = lasJson(path.join(repo, "data", "inlagg.json"));
  const till = lasJson(path.join(repo, "data", "tillgangar.json")).tillgangar;
  const ent = lasJson(path.join(repo, "data", "entiteter.json")).entiteter;
  const pub = path.join(repo, "public");
  const storlek = (f) => (f && fs.existsSync(path.join(pub, f)) ? fs.statSync(path.join(pub, f)).size : 0);
  const rad = [];
  for (const [id, t] of Object.entries(till)) {
    if (t.fil) rad.push({ id, bytes: storlek(t.fil), bulk: !!t.inlagd });
  }
  const summa = (l) => l.reduce((s, x) => s + x.bytes, 0);
  const bulk = rad.filter((x) => x.bulk);
  const gamla = rad.filter((x) => !x.bulk);
  const forladdade = new Set(Object.values(ent).filter((e) => e.forladda && e.modell).map((e) => e.modell));
  const forladdat = rad.filter((x) => forladdade.has(x.id));
  const sorterade = [...bulk].sort((x, y) => x.bytes - y.bytes);
  const pct = (p) => sorterade.length ? sorterade[Math.min(sorterade.length - 1, Math.floor(p * sorterade.length))].bytes : 0;
  const ut = {
    modellerGamla: gamla.length, kbGamla: kb(summa(gamla)),
    modellerBulk: bulk.length, kbBulk: kb(summa(bulk)), medelKbBulk: bulk.length ? kb(summa(bulk) / bulk.length) : 0,
    medianKbBulk: kb(pct(0.5)), p90KbBulk: kb(pct(0.9)), storstaKbBulk: kb(pct(0.9999)),
    forladdat: { modeller: forladdat.length, kb: kb(summa(forladdat)), budgetKb: cfg.budget.forladdat_kb },
    omAllaForladdades: { kb: kb(summa(rad)), mot_budget: cfg.budget.forladdat_kb },
    lazy: { forstaLaddning_kb: kb(summa(forladdat)), perNyttOrd_kb_medel: bulk.length ? kb(summa(bulk) / bulk.length) : 0, perNyttOrd_kb_p90: kb(pct(0.9)) },
  };
  console.log(JSON.stringify(ut, null, 2));
  if (a.ut) fs.writeFileSync(a.ut, JSON.stringify(ut, null, 1) + "\n");
}

/** Stabil sortering: paket vars namn börjar med en tidigare post i `prio` kommer först (förstkommen får ordet). */
export function sorteraPaket(filer, prio = []) {
  const plats = (f) => {
    const i = prio.findIndex((p) => f.startsWith(p));
    return i < 0 ? prio.length : i;
  };
  return filer.map((f, i) => ({ f, i })).sort((x, y) => plats(x.f) - plats(y.f) || x.i - y.i).map((x) => x.f);
}

function cmdUrval(a) {
  const d = JSON.parse(fs.readFileSync(a.fran, "utf8"));
  const cfg = lasJson(path.join(path.resolve(a.repo ?? "."), "data", "inlagg.json"));
  const bara = a.flaggor.has("alla") ? d.rader : d.rader.filter((r) => r.status === "OK" || r.status === "OK_FLAGGAD");
  const lista = sorteraPaket(bara.map((r) => r.fil), a.flaggor.has("prio") ? cfg.paket_prioritet ?? [] : []);
  const text = `# Urval (${lista.length} modeller) ur ${path.basename(a.fran)}${a.flaggor.has("alla") ? ": alla rader" : ": alla OK och FLAGGA"}${a.flaggor.has("prio") ? ", paketprioritet ur data/inlagg.json (paket_prioritet)" : ""}.\n# Format: paket/filnamn. Rader som börjar med # hoppas över.\n${lista.join("\n")}\n`;
  if (a.ut) fs.writeFileSync(a.ut, text);
  else process.stdout.write(text);
  console.error(`${lista.length} rader`);
}

async function main() {
  const a = argv();
  if (a.kommando === "kontrollera") return cmdKontrollera(a);
  if (a.kommando === "lagg") return cmdLagg(a);
  if (a.kommando === "licenser") return void licenser(path.resolve(a.repo ?? "."));
  if (a.kommando === "matt") return cmdMatt(a);
  if (a.kommando === "urval") return cmdUrval(a);
  console.log("Användning: node scripts/modell-inlagg.mjs kontrollera|lagg|licenser|matt  (se filens topp)");
  process.exitCode = 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error("FEL:", e.message);
    process.exitCode = 1;
  });
}
