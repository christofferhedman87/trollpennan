// EN placeringsregel. Beräkningens oförändrade delar finns i mindre moduler.
import type { Sparad } from "./brygga.ts";
import { START_PLATS, type Plats } from "./platser.ts";
import { PLACERING, RESERV_MAX, regelFor, rollFor, type Lage } from "./placeringGrund.ts";
import { satMinne } from "./placeringDekor.ts";
import { underMinne, torrMinne, radMinne, rader } from "./placeringStod.ts";
import { placeraNiva } from "./placeringSok.ts";
export { PLACERING, SKARM_RESERVERAT, regelFor, vidVatten, rollFor, kroppMatt, kameraFor, ritSkala } from "./placeringGrund.ts";
export type { Roll, Lage } from "./placeringGrund.ts";
export { dekorSkymd } from "./placeringDekor.ts";
export { huvudFyllnad, siluettAndel, topp } from "./placeringStod.ts";

/**
 * Lägen för alla skapelser på en plats. Nyast först, sedan nyast till äldst. `stall` = fick ingen ledig ruta (minne.ts
 * låter den somna); den ritas ändå på den minst dåliga rutan tills dess.
 * Hur trångt det är avgör hur mycket de vandrar och hur stora de äldre ritas: först prövas det tätaste (nästan stilla,
 * äldre mindre). Ryms inte alla ens då är det fullt och så blir det. Ryms alla, får de det lösaste som alla ryms i:
 * fritt bete om det går, annars mindre vandring, och krympning bara om den behövs.
 */
export function placera(alla: readonly Sparad[], plats?: Plats): Map<string, Lage> {
  const pid = plats?.id ?? START_PLATS;
  if (pid !== senastPlats) {
    senastPlats = pid;
    satMinne.clear();
    underMinne.clear();
    torrMinne.clear();
    radMinne.clear();
  }
  const steg = PLACERING.vandra?.steg ?? [1];
  const minst = steg.at(-1) ?? 1;
  const alltVaket = (l: Map<string, Lage>) => [...l.values()].every((q) => !q.stall);
  const tatast = placeraNiva(alla, plats, minst, true);
  if (!alltVaket(tatast)) {
    // P3a-fix (beslut B): får någon äldre ingen ruta prövas den nya mindre (ned till krymp_min, främst i varje storlek) –
    // den storlek som lämnar flest vakna vinner (sjön: giraffen i full storlek längst fram trängde ut hunden)
    if (alla.length > RESERV_MAX) return tatast;
    const utan = (l: Map<string, Lage>) => [...l.values()].filter((q) => q.stall).length;
    let [basta, n] = [tatast, utan(tatast)];
    for (const k of [0.9, 0.8, 0.7, 0.6].filter((k) => k >= (PLACERING.krymp_min ?? 0.6) - 1e-9)) {
      const l = placeraNiva(alla, plats, minst, true, k);
      const nl = utan(l);
      if (nl < n) [basta, n] = [l, nl];
      if (n === 0) break;
    }
    // Arkitekten 10:31 (a): en ny byggnad står så långt fram i sin zon det går utan att något djur blir utan ruta – längst
    // fram bara om ingen annan försvinner. Den själv ska fortfarande ha en ledig ruta (synas inom gränserna).
    const ny = [...alla].sort((a, b) => b.skapad - a.skapad || (a.uid < b.uid ? 1 : -1))[0];
    if (n > 0 && ny && rollFor(ny, plats) === "bak") {
      const band = regelFor(plats).band.bak;
      const z0 = basta.get(ny.uid)?.z ?? Infinity;
      const zs = band ? [...new Set(rader(band, "bak").map((r) => r.z))].filter((z) => z < z0 - 1e-9).sort((a, b) => b - a) : [];
      for (const zmax of zs) {
        const l = placeraNiva(alla, plats, minst, true, undefined, zmax);
        if (l.get(ny.uid)?.stall) continue;
        const nl = utan(l);
        if (nl < n) [basta, n] = [l, nl];
        if (n === 0) break;
      }
    }
    // Någon saknar ruta: äldre, och sist den nya, ritas i reserv_krymp tills ingen saknar ruta.
    // Taket kan redan ha sövt den enda per ord – då måste noll vara vakna utan ruta.
    if (n > 0) {
      const lock = [PLACERING.krymp_aldre_min ?? 0.4, ...(PLACERING.reserv_krymp ?? [])];
      const nyaK = [undefined, ...lock.filter((k) => k <= (PLACERING.krymp_min ?? 0.6) + 1e-9)];
      for (const cap of lock) {
        for (const k of nyaK) {
          const l = placeraNiva(alla, plats, minst, true, k, undefined, cap);
          if (ny && l.get(ny.uid)?.stall) continue;
          const nl = utan(l);
          if (nl < n) [basta, n] = [l, nl];
          if (n === 0) break;
        }
        if (n === 0) break;
      }
    }
    return basta;
  }
  for (const v of steg) {
    const l = placeraNiva(alla, plats, v, false);
    if (alltVaket(l)) return l;
  }
  return tatast;
}

let senastPlats = "";

const cache = new Map<string, Map<string, Lage>>();
/** placera med minne: samma skapelser på samma plats ger samma svar utan ny uträkning. */
export function placeraMedMinne(alla: readonly Sparad[], plats?: Plats): Map<string, Lage> {
  const nyckel = `${plats?.id ?? START_PLATS}|${alla.map((d) => `${d.uid}:${d.kropp}:${d.skala}:${d.skapad}:${d.formagor.includes("vingar") ? 1 : 0}`).join(",")}`;
  let k = cache.get(nyckel);
  if (!k) {
    k = placera(alla, plats);
    if (cache.size > 40) cache.clear();
    cache.set(nyckel, k);
  }
  return k;
}

/**
 * P3a-fix (beslut B): högst EN somnar per nytt ord – den äldsta av dem som inte fick någon ledig ruta, och bara ur den nyas
 * egen budget: byggnader (rollen bak) och allt annat räknas var för sig, så ett djur söver aldrig en byggnad och tvärtom.
 * De andra utan ledig ruta står kvar på den minst dåliga synliga rutan (placeraNiva: stallet tar då plats på skärmen).
 */
export function somnaEn(alla: readonly Sparad[], nyaUid: ReadonlySet<string>, plats?: Plats): Sparad | null {
  const ny = alla.filter((d) => nyaUid.has(d.uid));
  if (!ny.length) return null;
  const bak = (d: Sparad) => rollFor(d, plats) === "bak";
  const budget = new Set(ny.map(bak));
  const utan = iStallet(alla, plats).filter((d) => !nyaUid.has(d.uid));
  const kandidater = utan.filter((d) => budget.has(bak(d)));
  // Arkitekten 10:31 (b), undantag från beslut B: står ett djur ändå utan ruta efter ett byggnadsord (byggnaden har redan
  // ställts längre bak, placera) söver byggnadsordet det äldsta djuret utan ruta – högst ett per ord, med egen banner
  const undantag = !kandidater.length && budget.has(true) ? utan.filter((d) => !bak(d)) : [];
  const val = [...kandidater, ...undantag].sort((a, b) => a.skapad - b.skapad)[0] ?? null;
  if (val) return val;
  // 16 vanliga katter stannar (äldre på 0,35). 12 tunga djur trycker alla äldre till reservgolvet: då söver ordet den äldsta.
  if (alla.length > 10) {
    const l = placeraMedMinne(alla, plats);
    const minR = (PLACERING.reserv_krymp?.at(-1) ?? 0.25) + 1e-9;
    const aldre = alla.filter((d) => !nyaUid.has(d.uid) && budget.has(bak(d)));
    if (aldre.length > 0 && aldre.every((d) => (l.get(d.uid)?.krymp ?? 1) <= minR)) {
      return aldre.sort((a, b) => a.skapad - b.skapad)[0] ?? null;
    }
  }
  return null;
}
/** Arkitekten 10:31 (b): ett byggnadsord söver högst ett djur – ingen fler efter den första (minne.ts). */
export function byggnadsord(alla: readonly Sparad[], nyaUid: ReadonlySet<string>, plats?: Plats): boolean {
  const ny = alla.filter((d) => nyaUid.has(d.uid));
  return ny.length > 0 && ny.every((d) => rollFor(d, plats) === "bak");
}

/**
 * P3a-fix: de som redan stod utan ruta före det nya ordet (ett sparat läge från före regeln, eller ett läge som prov lagt
 * in direkt) somnar också – de syns ändå inte, och det är inte det nya ordet som söver dem. I vanligt spel finns inga.
 */
export function redanUtan(alla: readonly Sparad[], nyaUid: ReadonlySet<string>, plats?: Plats): Sparad[] {
  const fore = alla.filter((d) => !nyaUid.has(d.uid));
  if (!fore.length) return [];
  // bara de som står utan ruta både före och med det nya ordet: regeln är inte monoton (ängen frö 11: sjukhuset sist gav
  // kaninen, hästen och elefanten stallrutor, men med kon fick alla en ruta – de tre somnade ändå på ett ord, kalib 09:40)
  const nu = new Set(iStallet(alla, plats).map((d) => d.uid));
  return iStallet(fore, plats).filter((d) => nu.has(d.uid));
}

/** De som inte får en ledig ruta (minne.ts låter dem somna, aldrig den nya). */
export function iStallet(alla: readonly Sparad[], plats?: Plats): Sparad[] {
  const l = placeraMedMinne(alla, plats);
  return alla.filter((d) => l.get(d.uid)?.stall);
}
