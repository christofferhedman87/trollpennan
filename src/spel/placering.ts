// P3a: EN placeringsregel för alla platser. Ren logik (ingen three), testas i Node. Data: data/placering.json.
//  - Varje plats har band per roll (mark, vatten, luft, bak), delade i rutor. Rollen kommer ur saken: simmare på vattnet,
//    flygare i luften, stora saker (storlek.json zon "bak") i det bakre bandet, resten på marken.
//  - En ruta är ledig när kroppen ryms hel på skärmen, står på rätt underlag (platsens zoner), inte i en reserverad
//    världsruta, inte går in i en annan kropp, och ingen skyms mer än sin gräns: max_skymd för de nya_antal nyaste och
//    platsens fasta saker, max_skymd_aldre för äldre (de framför och de reserverade skärmrutorna – guiden, Bengtsson,
//    utgångarna – inräknade). Huvudet (övre halvan av rutan) får skymmas högst huvud_skymd.
//  - Den nyaste får den främsta lediga rutan i full storlek; sedan de andra från nyast till äldst. När det är trångt
//    vandrar de mindre (vandra.steg), sedan ritas äldre mindre (ned till krymp_aldre_min). Ingen ledig ruta = stallet.
import placeringJson from "../../data/placering.json" with { type: "json" };
import modellmattJson from "../../data/modellmatt.json" with { type: "json" };
import dekorJson from "../../data/dekor-karta.json" with { type: "json" };
import type { Sparad } from "./brygga.ts";
import { arSak, arSmasak, ENTITETER, flyger, harModell, svavar, FOT_MARGINAL, fotKant, halvBredd, malhojd, simmar, storlekKlass, synSkala, takSkala } from "./entiteter.ts";
import { START_PLATS, type Plats } from "./platser.ts";
import { iVatten, KANT_MARGINAL, tillPlats, torrKropp } from "./platsYta.ts";
import { KAMERA_ANG, KAMERA_PLATS, xSkala, type Kamera, type Ruta } from "./skarm.ts";
import { framfor, sakRuta } from "./skymning.ts";

export type Roll = "mark" | "vatten" | "luft" | "bak";
type Band = { z: [number, number]; y?: [number, number] };
type Fast = { namn: string; x: number; z: number; halv: number; djup: number; hojd: number; plan?: boolean; /** egen gräns (grinden: förbjuden zon) */ max_skymd?: number };
type PlatsRegel = { skala?: number; band: Partial<Record<Roll, Band>>; varld_reserverat: { namn: string; x: [number, number]; z: [number, number] }[]; fasta: Fast[] };
type Data = {
  max_skymd: number;
  bak_lucka?: number;
  matfel_px?: number;
  max_skymd_aldre?: number;
  nya_antal?: number;
  huvud_skymd?: number;
  krymp_aldre_min?: number;
  krymp_steg?: number;
  vandra?: { x: number; z: number; steg: number[] };
  steg: { x: number; z: number; y: number };
  vickning: Record<Roll, number>;
  vrid?: { djur: number };
  krymp_min?: number;
  synlig_golv?: { storst_px: number; minst_px: number; yta_px: number };
  smasak_px?: number;
  reserv_krymp?: number[];
  sakerhet?: number;
  smasak_vaxa?: number[];
  djup: number;
  skarm_reserverat: (Ruta & { namn: string })[];
  platser: Record<string, PlatsRegel>;
};
export const PLACERING = placeringJson as unknown as Data;
const MODELLMATT = (modellmattJson as unknown as { matt: Record<string, number[]> }).matt;
export const SKARM_RESERVERAT: readonly Ruta[] = PLACERING.skarm_reserverat.map(({ x0, y0, x1, y1 }) => ({ x0, y0, x1, y1 }));
const SKARM = { w: 375, h: 812 };
const GOLV = PLACERING.synlig_golv;
const KANT_PX = 8;
/** reserv_krymp bara i spelets storlek (tak 10 per plats): med 30 i prestandaprovet vore det för dyrt */
const RESERV_MAX = 12;
/** P3a-fix (beslut C): en småsak når minst så här många px på den kortaste ledden (minus mätfelet). */
const SMASAK_PX = (PLACERING.smasak_px ?? 0) - (PLACERING.matfel_px ?? 0);

export function regelFor(plats?: Plats): PlatsRegel {
  return PLACERING.platser[plats?.id ?? START_PLATS] ?? PLACERING.platser.standard!;
}

/** En vattenfågel (entiteter.json vattenfagel) utan barnets vingar simmar på en plats med vattenyta – också i ängens damm
 *  (Doodle 18:46: den blå ankan svävade vid trädkanten på ängen). */
export function vidVatten(d: Pick<Sparad, "kropp" | "formagor">, plats?: Plats): boolean {
  return !!plats && !!ENTITETER[d.kropp]?.vattenfagel && !d.formagor.includes("vingar") && plats.zoner.some((z) => z.typ === "vattenyta");
}

export function rollFor(d: Pick<Sparad, "kropp" | "formagor">, plats?: Plats): Roll {
  if (flyger(d.kropp, d.formagor) && !vidVatten(d, plats)) return "luft";
  if (simmar(d.kropp, d.formagor) || vidVatten(d, plats)) return "vatten";
  if (storlekKlass(d.kropp)?.zon === "bak") return "bak";
  return "mark";
}

export type Lage = { x: number; y: number; z: number; roll: Roll; /** skärmrutan som regeln räknade med */ r: Ruta; stall: boolean; /** ritas så här mycket mindre (äldre när det är trångt; den nya bara om den inte ryms i bild alls) */ krymp?: number; /** del av full vandring (djur.tsx), 1 = fritt bete */ vand?: number; /** kroppen själv i vila på sin ruta (r är rutan den rör sig inom) */ kropp?: Ruta; /** regelns räknade skymning i värsta läget (kalibrering mot skärmprovet) */ skymd?: { tackt: number; huvud: number } };

/** Kroppens mått på djupet z: halva bredden, höjden och djupet (barnets storleksord, taket och minsta synliga storlek). */
export function kroppMatt(d: Pick<Sparad, "kropp" | "skala">, z: number, plats?: Plats, roll?: Roll, vandDel = 1): { halv: number; hojd: number; djup: number; f: number; vand: [number, number]; /** lådans botten över foten */ y0: number; /** kroppen själv i varje ögonblick, minsta läget: halva bredden, höjden, halva djupet, botten (P3a torr 4) */ kx: number; kh: number; kd: number; ky0: number } {
  const f = ritSkala(d, z, plats);
  const djur = ENTITETER[d.kropp]?.typ === "djur";
  const ror = djur && roll !== "luft" ? vandDel : djur ? 1 : 0;
  const V = PLACERING.vandra;
  const vand: [number, number] = djur && roll !== "luft" && V ? [V.x * vandDel, V.z * vandDel] : [0, 0];
  // P3a (Arkitekten 20:40): modellens egna mått (data/modellmatt.json, samma Box3 och skala som gltfDjur) och den
  // vridning djur.tsx ger den: ett djur som vandrar vrider sig upp till 0,35·π·vandring, en flygare ±0,14 (och rullar
  // 0,28), en svävare 0,35, en sak inte alls. Rutan är den axelparallella lådan runt den vridna kroppen.
  const mm = MODELLMATT[d.kropp];
  if (mm && (harModell(d.kropp) || mm.length > 3)) {
    const k = takSkala(d.kropp, d.skala || 1) * f;
    const [a, b] = [(mm[0] * k) / 2, (mm[2] * k) / 2];
    const th = arSak(d.kropp) ? 0 : roll === "luft" ? 0.14 : svavar(d.kropp) ? 0.35 : djur ? 0.35 * Math.PI * ror : 0;
    const halv = vriden(a, b, th);
    const djup = vriden(b, a, th);
    const rull = roll === "luft" ? Math.sin(0.28) * halv : 0; // flygaren rullar: lite högre
    const bob = arSak(d.kropp) ? 0 : roll === "luft" ? 0.16 : roll === "vatten" ? 0.08 : 0.04; // djur.tsx: guppar upp och ned
    // P3a-fix torr 4 (Doodle 7): ett djur som hoppar av sig själv (entiteter.json hopp: kaninen) lyfter upp till 0,45 m
    // (djur.tsx lyft) – rutan det rör sig inom räknar med hoppet, annars skymde kaninen grinden mitt i ett hopp (86 %)
    const lyft = !arSak(d.kropp) && ENTITETER[d.kropp]?.hopp ? 0.45 : 0;
    // kärnan: kroppen i ett ögonblick, i sitt smalaste läge (vridningen gör den bara bredare, ändpunkterna är minst)
    const [kx, kd] = [Math.min(a, a * Math.cos(th) + b * Math.sin(th)), Math.min(b, b * Math.cos(th) + a * Math.sin(th))];
    return { halv, hojd: mm[1] * k + rull + 2 * bob + lyft, djup: Math.max(0.05, djup), f, vand, y0: (mm[3] ?? 0) * k - bob, kx, kh: mm[1] * k, kd: Math.max(0.05, kd), ky0: (mm[3] ?? 0) * k };
  }
  // procedurkropp (ingen modell): målhöjden och fotavtrycket, som förut
  const vrid = 1 + ((PLACERING.vrid?.djur ?? 1) - 1) * ror;
  const bas = halvBredd(d.kropp, d.skala || 1) * f;
  const halv = bas * vrid;
  const djup = djur ? bas * PLACERING.djup + (halv - bas * PLACERING.djup) * ror : halv * PLACERING.djup;
  const hojd = malhojd(d.kropp) * takSkala(d.kropp, d.skala || 1) * f;
  return { halv, hojd, djup: Math.max(0.2, djup), f, vand, y0: 0, kx: bas, kh: hojd, kd: Math.max(0.2, djur ? bas * PLACERING.djup : djup), ky0: 0 };
}

/** P3a (Arkitekten 20:40): kameran som platsen ritas med – ängens, eller närmare på samma linje (skarm.ts). */
export function kameraFor(plats?: Plats): Kamera {
  return !plats || plats.id === START_PLATS ? KAMERA_ANG : KAMERA_PLATS;
}

/** Största halva utbredningen a·|cos θ| + b·|sin θ| för en låda med halva måtten a (längs axeln) och b, vriden |θ| ≤ th. */
function vriden(a: number, b: number, th: number): number {
  const topp = Math.atan2(b, a);
  return topp <= th ? Math.hypot(a, b) : a * Math.cos(th) + b * Math.sin(th);
}

/** Hur mycket djur.tsx ritar kroppen större/mindre: platsens skala (data) × minsta synliga storlek på djupet z. */
export function ritSkala(d: Pick<Sparad, "kropp" | "skala">, z: number, plats?: Plats): number {
  const k = regelFor(plats).skala ?? 1;
  return k * synSkala(d.kropp, (d.skala || 1) * k, z);
}

/**
 * P3a-fix (beslut A/D): platsens dekor – träd, buskar, staket, klippor – mätt i den riktiga renderingen
 * (data/dekor-karta.json, rundor/P3a-fix/dekor-karta.mjs). Cellen skymmer en kropp vars framsida står på djupet z när
 * dekorn i cellen står framför den. Andelen räknas på kroppens kärna c, i värsta läget den kan vandra till inom r.
 */
type DekorKarta = { w: number; h: number; z: Int8Array };
const DEKOR = (dekorJson as unknown as { cell: number; platser: Record<string, { w: number; h: number; z: string }> });
const dekorMinne = new Map<string, DekorKarta | null>();
const satMinne = new Map<string, Int32Array>();
function b64(s: string): Int8Array {
  const bin = typeof atob === "function" ? atob(s) : Buffer.from(s, "base64").toString("binary");
  const ut = new Int8Array(bin.length);
  for (let i = 0; i < bin.length; i++) ut[i] = (bin.charCodeAt(i) << 24) >> 24;
  return ut;
}
function dekorFor(plats?: Plats): DekorKarta | null {
  const id = plats?.id ?? START_PLATS;
  let k = dekorMinne.get(id);
  if (k === undefined) {
    const d = DEKOR.platser?.[id];
    dekorMinne.set(id, (k = d ? { w: d.w, h: d.h, z: b64(d.z) } : null));
  }
  return k;
}
/** Summerad tabell över cellerna där dekorn står framför djupet z (z × 4, avrundat uppåt). */
function dekorSat(id: string, k: DekorKarta, z4: number): Int32Array {
  const nyckel = `${id}|${z4}`;
  let t = satMinne.get(nyckel);
  if (t) return t;
  const W = k.w + 1;
  t = new Int32Array(W * (k.h + 1));
  for (let y = 0; y < k.h; y++) {
    let rad = 0;
    for (let x = 0; x < k.w; x++) {
      const v = k.z[y * k.w + x]!;
      if (v !== -128 && v > z4) rad++;
      t[(y + 1) * W + x + 1] = t[y * W + x + 1]! + rad;
    }
  }
  if (satMinne.size > 400) satMinne.clear();
  satMinne.set(nyckel, t);
  return t;
}
// dekor strax bakom kroppens mitt räknas också (−0,15): kroppens yta sitter framför mitten, och cellerna är grova
const DEKOR_MARGINAL = -0.15;
export function dekorSkymd(plats: Plats | undefined, r: Ruta, c: Ruta, zFram: number, huvud: boolean): number {
  const k = dekorFor(plats);
  if (!k) return 0;
  const C = DEKOR.cell;
  // kartan avrundar z × 4 till närmaste heltal (dekor-karta.mjs): cellen v kan stå ända till (v + 0,5) / 4. Den räknas
  // därför om v > 4·(z + marginal) − 0,5 (kalib3: busken på z 0–0,12 framför katten på z 0 räknades inte – huvudet 89 %)
  const t = dekorSat(plats?.id ?? START_PLATS, k, Math.floor((zFram + DEKOR_MARGINAL) * 4 - 0.5));
  const W = k.w + 1;
  const [y0, y1] = [c.y0, huvud ? c.y0 + (c.y1 - c.y0) / 2 : c.y1];
  // P3a-fix torr 4: varje cell kroppen rör räknas (golv/tak, inte närmaste): en liten kropp (hästen 25 × 48 px, fyra
  // celler) tappade annars en hel kantcell, och huvudet syntes 81 % där regeln räknade det fritt
  const cy0 = Math.max(0, Math.floor(y0 / C));
  const cy1 = Math.min(k.h, Math.max(cy0 + 1, Math.ceil(y1 / C)));
  const bw = c.x1 - c.x0;
  let varst = 0;
  // kärnan längst till vänster, i mitten och längst till höger i rutan den rör sig inom
  for (const x0 of [r.x0, c.x0, r.x1 - bw]) {
    const cx0 = Math.max(0, Math.floor(x0 / C));
    const cx1 = Math.min(k.w, Math.max(cx0 + 1, Math.ceil((x0 + bw) / C)));
    const n = (cx1 - cx0) * (cy1 - cy0);
    if (n <= 0) continue;
    const s = t[cy1 * W + cx1]! - t[cy0 * W + cx1]! - t[cy1 * W + cx0]! + t[cy0 * W + cx0]!;
    varst = Math.max(varst, s / n);
  }
  return varst;
}

type Satt = { /** huvudets fyllnad (huvud_fyllnad): skymd yta i huvudrutan delas med den */ fh: number; id: string; x: number; z: number; halv: number; djup: number; r: Ruta; /** kroppen själv (kärnan) i rutan r */ k: Ruta; tackt: number; huvud: number; grans: number; plan?: boolean; roll?: Roll };
/**
 * P3a-fix (Arkitekten 09:16: regeln mäter som skärmen). Skärmprovet räknar huvudet som de synliga pixlarna i övre halvan av
 * kroppens siluett; regeln har bara rutan. Siluetten fyller bara en del av rutan (katten 0,53, bläckfisken 0,31 – mätt i
 * id-passet, data/placering.json huvud_fyllnad), och skymningen kan falla just där pixlarna är. Den skymda ytan i rutan
 * delas därför med fyllnaden: i värsta fall är all skymd yta siluett – samma mått som skärmen, uppåt begränsat.
 */
const FYLL = (PLACERING as unknown as { huvud_fyllnad?: Record<string, number> }).huvud_fyllnad ?? {};
// byggnaderna (zon bak) står still och fyller sin ruta upptill där den skyms: kalib1 visade aldrig mer skymt huvud på skärmen
// än i regeln (slottet 1,6 % räknat, 0 % mätt) – med fyllnaden fick det nya slottet ingen ruta alls (kal2 ängen ord 4)
export const huvudFyllnad = (kropp: string): number => (storlekKlass(kropp)?.zon === "bak" ? 1 : Math.min(1, Math.max(0.2, FYLL[kropp] ?? FYLL._standard ?? 1)));
const ANDEL = (PLACERING as unknown as { siluett_andel?: Record<string, [number, number]> }).siluett_andel ?? {};
/** [bredd, höjd, mätt] – hur stor den ritade siluettens ruta är av kroppens låda (kärnan c) på skärmen. */
export const siluettAndel = (kropp: string): [number, number, boolean] => {
  const a = ANDEL[kropp];
  if (Array.isArray(a)) return [a[0], a[1], true];
  const st = ANDEL._standard;
  return Array.isArray(st) ? [st[0], st[1], false] : [1, 1, false];
};
/** Övre halvan av rutan: där huvudet sitter (modellens huvud går inte att mäta i regeln). */
export const topp = (r: Ruta): Ruta => ({ ...r, y1: r.y0 + (r.y1 - r.y0) / 2 });

/** Raderna i ett band (djup z och höjd y), främst först; varje rad har sina x närmast mitten först. Räknas en gång. */
type Rad = { z: number; y: number; xs: number[] };
const radMinne = new Map<string, Rad[]>();
function rader(b: Band, roll: Roll): Rad[] {
  const nyckel = `${roll}|${b.z}|${b.y ?? ""}`;
  let ut = radMinne.get(nyckel);
  if (ut) return ut;
  const S = PLACERING.steg;
  const xs: number[] = [];
  for (let i = 0; i <= Math.ceil(6 / S.x); i++) xs.push((i % 2 ? 1 : -1) * Math.ceil(i / 2) * S.x);
  const ys = roll === "luft" && b.y ? steg(b.y[0], b.y[1], S.y) : [roll === "vatten" ? 0.16 : 0];
  ut = [];
  for (const z of steg(b.z[0], b.z[1], S.z).reverse()) for (const y of ys) ut.push({ z, y, xs });
  radMinne.set(nyckel, ut);
  return ut;
}
function steg(a: number, b: number, s: number): number[] {
  const ut: number[] = [];
  for (let v = a; v <= b + 1e-9; v += s) ut.push(Math.round(v * 1000) / 1000);
  return ut;
}

/**
 * Lägen för alla skapelser på en plats. Nyast först, sedan nyast till äldst. `stall` = fick ingen ledig ruta (minne.ts
 * låter den somna); den ritas ändå på den minst dåliga rutan tills dess.
 * Hur trångt det är avgör hur mycket de vandrar och hur stora de äldre ritas: först prövas det tätaste (nästan stilla,
 * äldre mindre). Ryms inte alla ens då är det fullt och så blir det. Ryms alla, får de det lösaste som alla ryms i:
 * fritt bete om det går, annars mindre vandring, och krympning bara om den behövs.
 */
export function placera(alla: readonly Sparad[], plats?: Plats): Map<string, Lage> {
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
    return basta;
  }
  for (const v of steg) {
    const l = placeraNiva(alla, plats, v, false);
    if (alltVaket(l)) return l;
  }
  return tatast;
}

/** Underlaget beror bara på kroppen, storleksordet, rollen, platsen och rutan: räknas en gång per ruta och sparas. */
const underMinne = new Map<string, Map<number, boolean>>();

function placeraNiva(alla: readonly Sparad[], plats: Plats | undefined, vandDel: number, krympAldre: boolean, nyStorlek?: number, nyZmax?: number): Map<string, Lage> {
  const regel = regelFor(plats);
  const P = PLACERING;
  // P3a-fix: regeln räknar med en säkerhetsmarginal mot skärmprovet (rutor och 6 px-celler är grövre än pixlarna;
  // torr2: elefantens huvud 10 % räknat, 10,5 % mätt) – gränserna själva är oförändrade
  const sak = P.sakerhet ?? 0;
  const [nyGrans, aldreGrans, nyaAntal, huvudMax] = [P.max_skymd - sak, (P.max_skymd_aldre ?? P.max_skymd) - sak, P.nya_antal ?? 1, (P.huvud_skymd ?? 1) + 0.005 - sak]; // huvudet: ≥ 90 % i hela procent är godkänt, som i skärmprovet (Arkitekten 10:31)
  const vick = P.vickning;
  const bakLucka = P.bak_lucka ?? 0.5;
  const kam = kameraFor(plats);
  const satta: Satt[] = regel.fasta.map((f) => ({ id: `fast:${f.namn}`, x: f.x, z: f.z, halv: f.halv, djup: f.djup, r: sakRuta(f.x, f.z, f.halv, f.hojd, f.djup, 0, kam), k: TOM, tackt: 0, huvud: 0, grans: f.max_skymd ?? nyGrans, plan: f.plan, fh: 1 }));
  for (const s of satta) s.k = s.r; // en fast sak står still
  const plana = satta.filter((s) => s.plan);
  const efterAlder = [...alla].sort((a, b) => b.skapad - a.skapad || (a.uid < b.uid ? 1 : -1));
  // P3a-fix (beslut B, budgetarna): den nya först, sedan byggnaderna (rollen bak), sedan de andra – var och en efter ålder.
  // Bara de egna kan då tränga undan en byggnad: ett nytt djur söver aldrig en byggnad (Doodle: slottet blev kvar utan ruta)
  const arBak = (d: Sparad) => rollFor(d, plats) === "bak";
  const ordning = [...efterAlder.slice(0, 1), ...efterAlder.slice(1).filter(arBak), ...efterAlder.slice(1).filter((d) => !arBak(d))];
  const ut = new Map<string, Lage>();
  const steg = P.krymp_steg ?? 0.1;
  let tak = 1; // äldre ritas aldrig större än en nyare (krympningen följer åldern, som perspektiv)
  ordning.forEach((d0, nr) => {
    // P3a-fix (beslut C): den nya står alltid i bild – finns ingen ruta på vattnet (grottans lilla damm) eller i luften
    // står den på marken (Doodle 21 okt: sälen fick stallplatsen längst bak, z −6,5, utan banner)
    const roll0 = rollFor(d0, plats);
    const roller: Roll[] = nr === 0 && (roll0 === "vatten" || roll0 === "luft") ? [roll0, "mark"] : [roll0];
    let roll = roll0;
    let band = regel.band[roll] ?? regel.band.mark!;
    let rad = rader(band, roll);
    const grans = efterAlder.indexOf(d0) < nyaAntal ? nyGrans : aldreGrans; // gränsen följer åldern, inte ordningen
    // småsaker (storlek.json smasak) står främst och når minst smasak_px på skärmen (beslut C)
    const sma = arSmasak(d0.kropp);
    const fh0 = huvudFyllnad(d0.kropp);
    // kravet gäller den nya, tills den vuxit så mycket den får (en smal sak – spaden 15 px – står då i den största storleken)
    const vaxMax = P.smasak_vaxa?.at(-1) ?? 1;
    // en platt småsak (pucken, tallriken: höjden under halva bredden) mäts på den längsta ledden – annars blir pucken bredare
    // än koppen (beslut C: rimlig mot koppen, verklig storlek ur modellmåtten)
    const mmS = MODELLMATT[d0.kropp];
    const platt = !!mmS && mmS[1]! < 0.5 * Math.max(mmS[0]!, mmS[2]!);
    const smaKrav = (d: Sparad) => sma && nr === 0 && (d.skala || 1) / (d0.skala || 1) < vaxMax - 1e-9;
    const underFor = (d: Sparad) => {
      const uKey = `${plats?.id ?? ""}|${d.kropp}|${d.skala}|${roll}|${band.z}`;
      let under = underMinne.get(uKey);
      if (!under) {
        if (underMinne.size > 400) underMinne.clear();
        underMinne.set(uKey, (under = new Map()));
      }
      return under;
    };
    type Fynd = { lage: Lage; m: ReturnType<typeof kroppMatt>; huvud: number; tackt: number; fel: number; kost: number; k?: Ruta };
    // den nyaste: främsta lediga rutan; äldre: bakersta (de äldsta hamnar längst bak och lämnar framkanten fri)
    // medStall: leta också fram den minst dåliga rutan om ingen är ledig
    // (fel = 0: ingen kropp i vägen men för skymd, 1: utanför bild, 2: i en annan kropp; sedan minst skymning)
    let golvFel = false; // någon ruta var för liten för att synas (saker, synlig_golv) – då kan en större storlek rymmas
    const sok = (d: Sparad, medStall: boolean): { fri: Fynd | null; stall: Fynd | null } => {
      let stall: Fynd | null = null;
      const under = underFor(d);
      const n = rad.length;
      for (let ri = 0; ri < n; ri++) {
        const ri2 = nr === 0 || sma ? ri : n - 1 - ri;
        const { z, y, xs } = rad[ri2]!;
        if (nr === 0 && nyZmax !== undefined && z > nyZmax + 1e-9) continue; // den nya byggnaden längre bak (Arkitekten 10:31 a)
        const m = kroppMatt(d, z, plats, roll, vandDel);
        let m0: ReturnType<typeof kroppMatt> | null = null;
        const bredd = m.halv + m.vand[0] + (vick[roll] ?? 0);
        const djup = m.djup + m.vand[1];
        // skärmens y beror inte på x, och skärmens x är linjär i x på varje djup och höjd: radens ruta räknas en gång
        const r0 = sakRuta(0, z, bredd, m.hojd, djup, y + m.y0, kam);
        // stora saker står bakom alla djur och saker på marken (B6.1 E, bak_lucka): banden överlappar, så en rad som
        // hamnar fel mot de redan satta är aldrig ledig (stallet får fortfarande leta i den)
        // P3a-fix: bara de som står i samma bredd (x) räknas – ett djur bredvid slottet får stå längre bak än det
        // (skymningen räknas ändå); annars trängde en ny byggnad främst i skogen undan alla djur bakom den
        const bakI = (s: Satt, x: number, h: number) => Math.abs(s.x - x) < s.halv + h;
        const bakRad = satta.filter((s) => s.r !== TOM && ((roll === "mark" && s.roll === "bak" && s.z > z - bakLucka) || (roll === "bak" && s.roll === "mark" && s.z < z + bakLucka)));
        if (!medStall && (r0.y0 < 0 || r0.y1 > SKARM.h || r0.x1 - r0.x0 > SKARM.w)) continue;
        const [ya, yb] = [y + m.y0, y + m.y0 + m.hojd];
        const sk = [xSkala(ya, z + djup, kam), xSkala(yb, z + djup, kam), xSkala(ya, z - djup, kam), xSkala(yb, z - djup, kam)];
        const [sMin, sMax] = [Math.min(...sk), Math.max(...sk)];
        // P3a torr 6: bara de satta som når raden på djupet kan krocka (samma villkor som nedan, delat i z och x)
        const iRaden = satta.filter((s) => !s.plan && Math.abs(s.z - z) < s.djup + m.djup);
        for (let xi = 0; xi < xs.length; xi++) {
          const x = xs[xi]!;
          const bakFel = bakRad.some((s) => bakI(s, x, m.halv));
          if (bakFel && !medStall) continue;
          // rätt underlag (i den storlek som ritas men med full vandring, som B6.3: avståndet till vattnet ändras inte när
          // det blir trångt), inte i en reserverad världsruta (grinden), inte i en plan fast sak (dammen) om den inte simmar
          const ck = ri2 * 1000 + xi;
          let ok = under.get(ck);
          if (ok === undefined) under.set(ck, (ok = underlag(roll, plats, x, z, d, (m0 ??= kroppMatt(d, z, plats, roll, 1)))));
          if (!ok) continue;
          if (regel.varld_reserverat.some((v) => x + m.halv > v.x[0] && x - m.halv < v.x[1] && z + m.djup > v.z[0] && z - m.djup < v.z[1])) continue;
          if (roll !== "vatten" && plana.some((s) => Math.abs(s.x - x) < s.halv + m.halv && Math.abs(s.z - z) < s.djup + m.djup)) continue;
          // hel på skärmen (räknas först: billigast, och utanför bild behövs inget mer om den inte ska till stallet)
          const [lo, hi] = [x - bredd, x + bredd];
          const r: Ruta = { x0: 187.5 + Math.min(lo * sMin, lo * sMax), x1: 187.5 + Math.max(hi * sMin, hi * sMax), y0: r0.y0, y1: r0.y1 };
          const ute = r.x0 < KANT_PX || r.x1 > SKARM.w - KANT_PX || r.y0 < 0 || r.y1 > SKARM.h; // P3a-fix: en bit från bildkanten (hästen nådde kanten med 3 px, torr1)
          if (ute && !medStall) continue;
          // en sak eller ett djur som ritas för litet för att synas (b66: försvinner i gräset) står inte där
          // P3a torr 6: gäller också djur (ett äldre som krympts mot 40 % – bladlusen 13 × 15 px) och mäts på kroppen
          // själv (kärnan), minus mätfelet (matfel_px): b66 mätte sax 9 × 22 där regeln räknade 9 × 24
          const c = sakRuta(x, z, m.kx, m.kh, m.kd, y + m.ky0, kam);
          // Arkitekten 10:31: minsta storleken mäts som skärmen – den ritade siluettens ruta, inte modellens låda
          // (siluett_andel, mätt med kalibrera.ts; ej mätta: _standard och mätfelet som förut)
          const [aw, ah, kand] = siluettAndel(d.kropp);
          const [rw, rh] = [(c.x1 - c.x0) * aw - (kand ? 0 : MATFEL), (c.y1 - c.y0) * ah - (kand ? 0 : MATFEL)];
          if (GOLV && (Math.max(rw, rh) < GOLV.storst_px || Math.min(rw, rh) < GOLV.minst_px || rw * rh < GOLV.yta_px || (smaKrav(d) && (platt ? Math.max(rw, rh) : Math.min(rw, rh)) < SMASAK_PX))) {
            golvFel = true;
            if (medStall && (!stall || stall.fel > 1)) stall = { lage: { x, y, z, roll, r, stall: true, vand: vandDel }, m, huvud: 0, tackt: 0, fel: 1, kost: 0 };
            continue;
          }
          // går inte in i en annan kropp
          let krock = false;
          for (const s of iRaden) if (Math.abs(s.x - x) < s.halv + m.halv) { krock = true; break; }
          if (krock) {
            if (medStall && !stall) stall = { lage: { x, y, z, roll, r: TOM, stall: true, vand: vandDel }, m, huvud: 0, tackt: 0, fel: 2, kost: 0 };
            continue;
          }
          if (ute) {
            if (!stall || stall.fel > 1) stall = { lage: { x, y, z, roll, r, stall: true, vand: vandDel }, m, huvud: 0, tackt: 0, fel: 1, kost: 0 };
            continue;
          }
          // skymning: den nya av dem framför och av de reserverade skärmrutorna (hela rutan och huvudet), och var och en
          // bakom av den nya – mot var och ens egen gräns
          // huvudet: övre halvan av rutan (räknas utan nytt objekt)
          // P3a torr 4: andelen räknas på kroppen själv (kärnan c), inte på rutan den rör sig inom (r) – i värsta läget,
          // när den och den framför har vandrat/guppat mot varandra (varst)
          let tackt = 0;
          let huvud = 0;
          for (const q of SKARM_RESERVERAT) {
            tackt += varst(q, q, r, c, false);
            huvud += varst(q, q, r, c, true) / fh0;
          }
          tackt += dekorSkymd(plats, r, c, z, false); // mot kroppens mitt: dekor mellan mitten och framsidan skymmer också
          huvud += dekorSkymd(plats, r, c, z, true) / fh0;
          let kost = Math.max(0, tackt - grans) + Math.max(0, huvud - huvudMax);
          for (const s of satta) {
            if (kost > 0 && !medStall) break;
            if (s.r === TOM) continue;
            // P3a-fix: i samma rad (±0,05) räknas skymningen åt båda hållen – vilken som hamnar framför avgörs av vandringen
            // (skogen: kaninen bredvid hästen i samma rad syntes 83 %, regeln räknade ingen skymning)
            const samma = Math.abs(s.z - z) <= 0.05;
            // en plan fast sak (dammen) ligger på marken och skymmer ingen
            if ((s.z > z + 0.05 || samma) && !s.plan) {
              const a = varst(s.r, s.k, r, c, false);
              const b = varst(s.r, s.k, r, c, true) / fh0;
              kost += Math.max(0, tackt + a - grans) - Math.max(0, tackt - grans) + Math.max(0, huvud + b - huvudMax) - Math.max(0, huvud - huvudMax);
              tackt += a;
              huvud += b;
            }
            if ((z > s.z + 0.05 || samma) && !(s.plan && roll === "vatten")) {
              kost += Math.max(0, s.tackt + varst(r, c, s.r, s.k, false) - s.grans) + (s.plan ? 0 : Math.max(0, s.huvud + varst(r, c, s.r, s.k, true) / s.fh - huvudMax));
            }
          }
          if (bakFel) kost += 1;
          if (kost <= 1e-9) return { fri: { lage: { x, y, z, roll, r, stall: false, vand: vandDel, kropp: c }, m, huvud, tackt, fel: 0, kost, k: c }, stall };
          const lage: Lage = { x, y, z, roll, r, stall: true, vand: vandDel };
          if (medStall && (!stall || stall.fel > 0 || kost < stall.kost - 1e-9)) stall = { lage, m, huvud, tackt, fel: 0, kost };
        }
      }
      return { fri: null, stall };
    };
    const skalad = (k: number): Sparad => (k === 1 ? d0 : { ...d0, skala: (d0.skala || 1) * k });
    // storlekarna att pröva: full (eller som den närmast nyare), sedan i steg ned till krymp_aldre_min
    const storlekar: number[] = [];
    if (nr === 0 && nyStorlek) storlekar.push(nyStorlek);
    else if (nr > 0 && krympAldre) for (let k = arBak(d0) ? 1 : tak; k >= (P.krymp_aldre_min ?? 1) - 1e-9; k -= steg) storlekar.push(Math.round(k * 100) / 100);
    else storlekar.push(1);
    let fynd: Fynd | null = null;
    let krymp = 1;
    let minsta: { fri: Fynd | null; stall: Fynd | null } = { fri: null, stall: null };
    for (const rollNu of roller) {
    if (fynd) break;
    [roll, band] = [rollNu, regel.band[rollNu] ?? regel.band.mark!];
    rad = rader(band, roll);
    golvFel = false;
    // ryms den inte ens i den minsta storleken somnar den direkt (och då behöver inget annat prövas)
    minsta = sok(skalad(storlekar.at(-1)!), true);
    if (minsta.fri) {
      for (const k of storlekar.slice(0, -1)) {
        const f = sok(skalad(k), false).fri;
        if (f) {
          [fynd, krymp] = [f, k];
          break;
        }
      }
      if (!fynd) [fynd, krymp] = [minsta.fri, storlekar.at(-1)!];
    } else if (golvFel) {
      // för liten i den minsta storleken: en större kan få en ruta längre fram
      for (const k of storlekar.slice(0, -1)) {
        const f = sok(skalad(k), false).fri;
        if (f) {
          [fynd, krymp] = [f, k];
          break;
        }
      }
    }
    // den nya får alltid en ruta: ryms den inte i full storlek ritas den mindre, ned till krymp_min – och då i den storlek
    // som ger den främsta rutan (Arkitekten: den nyaste står främst; torrkörning 3: elefanten tog 80 % på z 1,05 och
    // katten och grisen hamnade framför den, med 60 % står den på z 3,45 längst fram)
    // P3a-fix (beslut C): också när den ryms i full storlek får den nya den främsta rutan – en mindre storlek vinner om den
    // står längre fram (Doodle 21 okt: det nya slottet i skogen hamnade längst bak). En småsak får växa (smasak_vaxa) tills
    // den når smasak_px.
    if (nr === 0 && krymp === 1 && !nyStorlek) {
      const prova = [...(sma ? (P.smasak_vaxa ?? []) : []), ...[0.9, 0.8, 0.7, 0.6].filter((k) => k >= (P.krymp_min ?? 0.6) - 1e-9)];
      for (const k2 of prova) {
        const f = sok(skalad(k2), false).fri;
        if (f && (!fynd || f.lage.z > fynd.lage.z + 1e-9)) [fynd, krymp] = [f, k2];
      }
    }
    }
    // P3a-fix (beslut B): ryms den inte ens minst och ingen ur budgeten kan somna, får den äldre bli ännu mindre
    // (reserv_krymp) – golvet (synlig_golv) gäller fortfarande, så den syns
    for (const k of nr > 0 && krympAldre && !fynd && alla.length <= RESERV_MAX ? (P.reserv_krymp ?? []) : []) {
      const f = sok(skalad(k), false).fri;
      if (f) {
        [fynd, krymp] = [f, k];
        break;
      }
    }
    if (!fynd) {
      const st = minsta.stall;
      if (!st) {
        // inget läge alls på rätt underlag (bör inte hända): längst bak i mitten, i stallet
        const z = band.z[0];
        const m = kroppMatt(d0, z, plats, roll, vandDel);
        ut.set(d0.uid, { x: 0, y: band.y?.[0] ?? 0, z, roll, r: sakRuta(0, z, m.halv, m.hojd, m.djup, m.y0, kam), stall: true, vand: vandDel });
        return;
      }
      // i stallet tar den ingen plats på skärmen, men ingen annan ställs ovanpå den
      // den sover i den storlek rutan räknades för (den minsta den fick pröva)
      const kMin = storlekar.at(-1)!;
      ut.set(d0.uid, kMin < 1 ? { ...st.lage, stall: true, krymp: kMin } : { ...st.lage, stall: true });
      // P3a-fix (beslut B): den som inte somnar ritas där – på skärmen räknas den då som skymmande för de äldre
      const syns = st.fel === 0 && st.lage.r !== TOM;
      satta.push({ id: d0.uid, x: st.lage.x, z: st.lage.z, halv: st.m.halv, djup: st.m.djup, r: syns ? st.lage.r : TOM, k: syns ? st.lage.r : TOM, tackt: 0, huvud: 0, grans: 1, fh: fh0 });
      return;
    }
    const lage = krymp !== 1 ? { ...fynd.lage, krymp } : fynd.lage;
    ut.set(d0.uid, lage);
    if (nr > 0 && !arBak(d0)) tak = Math.min(tak, krymp);
    for (const s of satta)
      if (s.r !== TOM && (framfor({ z: lage.z }, s) || Math.abs(lage.z - s.z) <= 0.05) && !(s.plan && roll === "vatten")) {
        s.tackt += varst(lage.r, fynd.k ?? lage.r, s.r, s.k, false);
        s.huvud += varst(lage.r, fynd.k ?? lage.r, s.r, s.k, true) / s.fh;
      }
    satta.push({ id: d0.uid, x: lage.x, z: lage.z, halv: fynd.m.halv, djup: fynd.m.djup, r: lage.r, k: fynd.k ?? lage.r, tackt: fynd.tackt, huvud: fynd.huvud, grans, roll, fh: fh0 });
  });
  // regelns egen räkning per synlig, när alla står (rundor/P3a-fix/kalibrera.ts jämför den med skärmprovets id-pass)
  for (const s of satta) {
    const l = ut.get(s.id);
    if (l && !l.stall) ut.set(s.id, { ...l, skymd: { tackt: s.tackt, huvud: s.huvud } });
  }
  return ut;
}
const TOM: Ruta = { x0: 0, y0: 0, x1: 0, y1: 0 };
/**
 * P3a torr 4: hur stor del av b:s kropp (kärnan kb, som rör sig inom rutan rb) som a (kärnan ka inom ra) skymmer i
 * värsta läget – de två har vandrat så nära varandra det går, i x och y var för sig. huvud: bara b:s övre halva.
 */
const MATFEL = PLACERING.matfel_px ?? 0;
function axel(a0: number, a1: number, ea: number, b0: number, b1: number, eb: number): number {
  const ha = (a1 - a0) / 2;
  const hb2 = (b1 - b0) / 2;
  const d = Math.max(0, Math.abs((a0 + a1) / 2 - (b0 + b1) / 2) - ea - eb);
  return Math.max(0, Math.min(ha + hb2 - d, 2 * ha, 2 * hb2));
}
// P3a torr 6: utan mellanobjekt (varst är det mesta av placeringens tid: 43 % i profilen) – samma räkning som förut
function varst(ra: Ruta, ka: Ruta, rb: Ruta, kb: Ruta, huvud: boolean): number {
  const hy1 = huvud ? kb.y0 + (kb.y1 - kb.y0) / 2 : kb.y1;
  const eax = Math.max(0, ka.x0 - ra.x0, ra.x1 - ka.x1) + MATFEL; // den framför kan vara mätfelet större
  const eay = Math.max(0, ka.y0 - ra.y0, ra.y1 - ka.y1) + MATFEL;
  const ebx = Math.max(0, kb.x0 - rb.x0, rb.x1 - kb.x1);
  const eby = Math.max(0, kb.y0 - rb.y0, rb.y1 - kb.y1);
  const yta = Math.max(1e-6, (kb.x1 - kb.x0) * (hy1 - kb.y0));
  return (axel(ka.x0, ka.x1, eax, kb.x0, kb.x1, ebx) * axel(ka.y0, ka.y1, eay, kb.y0, hy1, eby)) / yta;
}


function underlag(roll: Roll, plats: Plats | undefined, x: number, z: number, d: Pick<Sparad, "kropp" | "skala">, m: { halv: number; djup: number; f: number }): boolean {
  if (!plats || !plats.zoner.length) return roll !== "vatten";
  if (roll === "luft") return true;
  if (roll === "vatten") {
    const pkt: [number, number][] = [[x, z], [x - m.halv * 0.7, z], [x + m.halv * 0.7, z], [x, z - m.djup * 0.7], [x, z + m.djup * 0.7]];
    return pkt.every(([a, b]) => iVatten(plats, ...tillPlats(a, b)));
  }
  // kroppens kant med vickning och marginal (B6.3: fotKant), i den storlek som ritas
  const kant = Math.max(fotKant(d.kropp, (d.skala || 1) * m.f), Math.max(m.halv, m.djup) + FOT_MARGINAL);
  // kanten avrundas uppåt till 0,05 (lite större marginal, aldrig mindre) så att alla kroppar delar samma uträkning per ruta
  const marg = Math.ceil(Math.max(kant, plats.kant_marginal ?? KANT_MARGINAL) * 20 - 1e-9) / 20;
  const k = `${plats.id}|${x}|${z}|${marg}`;
  let ok = torrMinne.get(k);
  if (ok === undefined) {
    if (torrMinne.size > 200000) torrMinne.clear();
    torrMinne.set(k, (ok = torrKropp(plats, x, z, marg)));
  }
  return ok;
}
const torrMinne = new Map<string, boolean>();

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
  return [...kandidater, ...undantag].sort((a, b) => a.skapad - b.skapad)[0] ?? null;
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
