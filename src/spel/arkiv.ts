// Beständiga lokala kopior. Arkiv tas aldrig bort automatiskt (alltså minst 30 dagar).
import { arData, tom } from "./minneSparning.ts";
import { arDal } from "./dal/markSparning.ts";
import { objekt, sakerJson } from "./lagring.ts";
export type ArkivLagring = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;
export const ARKIV_PREFIX = "trollpennan-arkiv-";
export type VarldsArkiv = { nyckel: string; tid: number; data: Record<string, string> };
export const aktivNyckel = (k: string) => k.startsWith("trollpennan") && !k.startsWith(ARKIV_PREFIX);
export function aktivaNycklar(lokal: ArkivLagring): string[] {
  return Array.from({ length: lokal.length }, (_, i) => lokal.key(i)).filter((k): k is string => !!k && aktivNyckel(k));
}
function lasData(lokal: ArkivLagring): Record<string, string> {
  const data: Record<string, string> = {};
  for (const k of aktivaNycklar(lokal)) {
    const v = lokal.getItem(k);
    if (v === null) throw new Error("Nyckeln försvann under kopieringen");
    data[k] = v;
  }
  return data;
}
function giltigVarld(data: Record<string, string>): boolean {
  const nyckel = ["trollpennan-v2", "trollpennan:v2", "trollpennan-v1", "trollpennan-spel"].find((k) => k in data);
  if (!nyckel) return false;
  try {
    const x: unknown = JSON.parse(data[nyckel]);
    if (!objekt(x) || !sakerJson(x)) return false;
    const aldre = x.version === undefined && (typeof x.introSedd === "boolean" || typeof x.introSett === "boolean");
    if (!aldre && x.version !== 1 && x.version !== 2) return false;
    if (!arData({ ...tom(), ...x, version: aldre ? 2 : x.version })) return false;
    // Lokal legacy-mark får annars migreras vid start när huvudfältet saknas.
    if (x.dal === undefined && data["trollpennan-dal-v1"] && !arDal(JSON.parse(data["trollpennan-dal-v1"]))) return false;
    return true;
  } catch { return false; }
}
export function lasArkiv(lokal: Pick<Storage, "getItem">, nyckel: string): VarldsArkiv | null {
  try {
    if (!nyckel.startsWith(ARKIV_PREFIX)) return null;
    const x: unknown = JSON.parse(lokal.getItem(nyckel) ?? "null");
    if (!objekt(x) || !sakerJson(x) || x.version !== 1 || typeof x.tid !== "number" || !Number.isFinite(x.tid) || x.tid <= 0 || !objekt(x.data)) return null;
    const poster = Object.entries(x.data);
    if (!poster.length || !poster.every(([k, v]) => aktivNyckel(k) && typeof v === "string")) return null;
    if (!giltigVarld(x.data as Record<string, string>)) return null;
    return { nyckel, tid: x.tid, data: x.data as Record<string, string> };
  } catch { return null; }
}
export function listaArkiv(lokal: ArkivLagring): VarldsArkiv[] {
  try {
    return Array.from({ length: lokal.length }, (_, i) => lokal.key(i)).filter((k): k is string => !!k?.startsWith(ARKIV_PREFIX))
      .map((k) => lasArkiv(lokal, k)).filter((x): x is VarldsArkiv => !!x).sort((a, b) => b.tid - a.tid || b.nyckel.localeCompare(a.nyckel));
  } catch { return []; }
}
/** Läs allt först och verifiera arkivskrivningen. Ett fel får aldrig följas av radering. */
export function arkivera(lokal: ArkivLagring, tid = Date.now()): VarldsArkiv | null {
  try {
    const data = lasData(lokal);
    if (!Object.keys(data).length) return null;
    let n = 0;
    let nyckel = `${ARKIV_PREFIX}${tid}-${n}`;
    while (lokal.getItem(nyckel) !== null) nyckel = `${ARKIV_PREFIX}${tid}-${++n}`;
    const raw = JSON.stringify({ version: 1, tid, data });
    lokal.setItem(nyckel, raw);
    if (lokal.getItem(nyckel) !== raw) return null;
    return { nyckel, tid, data };
  } catch { return null; }
}
export function borjaOmArkiverat(lokal: ArkivLagring): boolean {
  const kopia = arkivera(lokal);
  if (!kopia) return false;
  try { for (const k of Object.keys(kopia.data)) lokal.removeItem(k); return true; }
  catch {
    // Arkivet finns kvar även om återställning efter partiellt nekad radering också nekas.
    try { for (const [k, v] of Object.entries(kopia.data)) lokal.setItem(k, v); } catch { /* beständig kopia bevarad */ }
    return false;
  }
}
/** Arkivera även den nuvarande världen innan en gammal återställs. Inga arkiv konsumeras. */
export function aterstallArkiv(lokal: ArkivLagring, nyckel: string): boolean {
  const vald = lasArkiv(lokal, nyckel);
  if (!vald) return false;
  let fore: Record<string, string>;
  try { fore = lasData(lokal); } catch { return false; }
  if (Object.keys(fore).length && !arkivera(lokal)) return false;
  try {
    // Huvudvärlden sist, så ett fel i en sidoinställning inte byter själva världen.
    const poster = Object.entries(vald.data).sort(([a], [b]) => Number(a === "trollpennan-v2") - Number(b === "trollpennan-v2"));
    for (const [k, v] of poster) lokal.setItem(k, v);
    for (const k of Object.keys(fore)) if (!(k in vald.data)) lokal.removeItem(k);
    return true;
  } catch {
    try {
      for (const [k, v] of Object.entries(fore)) lokal.setItem(k, v);
      for (const k of Object.keys(vald.data)) if (!(k in fore)) lokal.removeItem(k);
    } catch { /* båda världarnas arkiv finns kvar */ }
    return false;
  }
}
