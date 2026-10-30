// Parallaxlagrens mått och placering (ren logik, utan React och three, så att proven kan läsa den).
// Ritningen finns i Parallax.tsx; bilderna och parallaxLager.json skrivs av scripts/parallax-lager.py.
import MATT from "./parallaxLager.json" with { type: "json" };

export type LagerNamn = "berg" | "kullar" | "tradrad";

/** z = avstånd bakåt (världens z), botten = ytans underkant (y), hojd = bildens höjd i världen, bredd = ytans bredd,
 *  dis = [minst, högst] dis (0–1; däremellan följer det scenens dimma efter avståndet), fot = andel av bildens höjd
 *  nerifrån som tonas ut mot marken, skift = bildens förskjutning i sidled (andel av en bildbredd). Ordningen i
 *  listan är ritordningen: längst bort först. */
export type LagerSpec = { namn: LagerNamn; z: number; botten: number; hojd: number; bredd: number; dis: readonly [number, number]; fot: number; skift: number };

export const LAGER: readonly LagerSpec[] = [
  { namn: "berg", z: -50, botten: -1.2, hojd: 13, bredd: 220, dis: [0.34, 0.42], fot: 0, skift: 0 },
  // Kullarnas väderkvarn flyttas bort från Kvarnbackens riktiga kvarn (x ≈ −4,5), så att de inte står i varandra.
  { namn: "kullar", z: -33, botten: -0.8, hojd: 10, bredd: 170, dis: [0.2, 0.3], fot: 0, skift: 0.45 },
  { namn: "tradrad", z: -22, botten: -0.35, hojd: 5.8, bredd: 135, dis: [0.1, 1], fot: 0.2, skift: 0 },
];

/** Ritordning: före allt annat genomskinligt (moln, glitter), efter himlen. */
export const PARALLAX_ORDNING = -10;
/** Kameran behöver se så långt att bergens hörn inte klipps (PlatsKamera sätter 90 när man varit på en plats). */
export const PARALLAX_FAR = 150;
/** Tomrum mellan bilderna i atlasen, så att mipmappar inte blöder mellan raderna. */
export const ATLAS_LUFT = 24;

export function parallaxUrl(namn: LagerNamn): string {
  return `/parallax/${namn}.webp`;
}

/** Hur många bildbredder ytan rymmer, och var i bilden ytans vänsterkant börjar (i bildbredder; mitten hamnar i x = 0). */
export function upprepning(spec: LagerSpec): { gangar: number; start: number } {
  const m = MATT[spec.namn];
  const gangar = spec.bredd / (spec.hojd * (m.bredd / m.hojd));
  return { gangar, start: 0.5 - gangar / 2 - spec.skift };
}

/** Atlasens rader: bilderna under varandra med luft emellan. y i px uppifrån (canvas); v0/vh i texturkoordinater
 *  (flipY: v = 0 är atlasens nederkant), så att rad i går från v0 till v0 + vh. */
export function atlasRader(): { bredd: number; hojd: number; rader: Record<LagerNamn, { y: number; h: number; v0: number; vh: number }> } {
  const bredd = Math.max(...LAGER.map((l) => MATT[l.namn].bredd));
  let y = 0;
  const px: Record<string, { y: number; h: number }> = {};
  for (const l of LAGER) {
    px[l.namn] = { y, h: MATT[l.namn].hojd };
    y += MATT[l.namn].hojd + ATLAS_LUFT;
  }
  const hojd = y - ATLAS_LUFT;
  const rader = {} as Record<LagerNamn, { y: number; h: number; v0: number; vh: number }>;
  for (const l of LAGER) {
    const r = px[l.namn]!;
    rader[l.namn] = { ...r, v0: 1 - (r.y + r.h) / hojd, vh: r.h / hojd };
  }
  return { bredd, hojd, rader };
}

/** Halva bredden som syns på lagrets avstånd, för en kamera i (x, z) med horisontell bildvinkel hfov (grader). */
export function synligHalvbredd(spec: LagerSpec, kamX: number, kamZ: number, hfovGrader: number): number {
  return Math.abs(kamX) + (kamZ - spec.z) * Math.tan(((hfovGrader / 2) * Math.PI) / 180);
}
