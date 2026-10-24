#!/usr/bin/env node
// Bygger data/orddelar.json ur NST-listan sv_nst.txt (hämtas till /tmp, checkas inte in).
// Bara ordlistan. Ingen Go-kod, inget nytt beroende.
// Kör: node scripts/orddelar-bygg.mjs [/tmp/sv_nst.txt]
import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rot = join(dirname(fileURLToPath(import.meta.url)), "..");
const kallaFil = process.argv[2] ?? "/tmp/sv_nst.txt";
const TAK = 100 * 1000;
const KALLA = "NST via stts-se/decomp sv_nst.txt (CC0 data, MIT kod)";
// NST saknar "dov" (dovhjort i facit). "monster" är spelets egna förled (monsterkanin).
const EXTRA = ["dov", "monster"];

const ord = JSON.parse(readFileSync(join(rot, "data/ord.json"), "utf8"));
const suffixen = new Set();
for (const o of ord.ord) {
  if (o.klass !== "djur" && o.klass !== "tillbehor") continue;
  const former = new Set([o.id, o.visa, ...(o.former ?? []), ...(o.sammansattningsled ?? [])]);
  for (const form of former) {
    const f = String(form ?? "").toLocaleLowerCase("sv");
    if (f.length >= 3) suffixen.add(f);
  }
}

const forled = new Set();
const langre = new Set();
const text = readFileSync(kallaFil, "utf8");
for (const line of text.split("\n")) {
  let kind = "";
  let raw = "";
  if (line.startsWith("PREFIX:")) {
    kind = "P";
    raw = line.slice(7);
  } else if (line.startsWith("SUFFIX:")) {
    kind = "S";
    raw = line.slice(7);
  } else continue;
  const w = raw.trim().toLocaleLowerCase("sv");
  if (w.length < 2 || !/^[a-zåäö]+$/.test(w)) continue;
  forled.add(w);
  if (kind === "S") {
    for (let i = 1; i <= w.length - 3; i++) {
      if (suffixen.has(w.slice(i))) {
        langre.add(w);
        break;
      }
    }
  }
}
for (const e of EXTRA) forled.add(e);

const langreLista = [...langre].sort((a, b) => a.localeCompare(b, "sv"));
const maxLangd = Math.max(...[...forled].map((w) => w.length));

function pack(maxLen) {
  const lista = [...forled].filter((w) => w.length <= maxLen || EXTRA.includes(w));
  lista.sort((a, b) => a.localeCompare(b, "sv"));
  const om =
    maxLen >= maxLangd
      ? "forled = PREFIX ∪ SUFFIX, gemener, minst 2 bokstäver. langre_efterled = SUFFIX som slutar på en längre djur- eller tillbehörsform."
      : `forled trimmad till längd ≤ ${maxLen} så att gzip ryms i 100 kB. langre_efterled är otrimmad.`;
  const data = {
    version: 1,
    kalla: KALLA,
    _om: om,
    forled: lista,
    langre_efterled: langreLista,
  };
  const json = JSON.stringify(data, null, 1) + "\n";
  return { json, gzip: gzipSync(json).length, antal: lista.length };
}

let valt = maxLangd;
let ut = pack(valt);
if (ut.gzip > TAK) {
  let lo = 2;
  let hi = maxLangd;
  valt = 2;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const prov = pack(mid);
    if (prov.gzip <= TAK) {
      valt = mid;
      ut = prov;
      lo = mid + 1;
    } else hi = mid - 1;
  }
}

const mal = join(rot, "data/orddelar.json");
writeFileSync(mal, ut.json);
console.log(`orddelar: forled ${ut.antal}, langre ${langreLista.length}, gzip ${ut.gzip}, max längd ${valt}`);
if (ut.gzip > TAK) {
  console.error("gzip över 100 kB");
  process.exit(1);
}
