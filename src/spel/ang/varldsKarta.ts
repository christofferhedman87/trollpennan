// Världen runt Ängen: var stigarna går, var skyltarna står och var platserna syns i fjärran.
// Ren data utan React/three, så att scenen, kameran och proven läser samma källa.
//
// Ängens kamera (skarm.ts: KAMERA_ANG) ser på en stående telefon bara ±3–8 m i sidled bakom ängen
// (z −4: ±3,2 m, z −15: ±5,6 m). Platserna ligger därför i en solfjäder bakom ängen, så att de syns direkt
// i startvyn: Gården nära till vänster, Skogen längre bort till vänster, Grottan längre bort till höger
// och Sjön nära till höger. Varje plats har en stig från ängens bakkant och en egen skylt.
// Platserna ritas här bara som lätta modeller; själva platsen laddas först när barnet reser dit.
import platserJson from "../../../data/platser.json" with { type: "json" };

export type ResmalId = "skogen" | "sjon" | "grottan" | "garden";
/** x, z på marken. */
export type XZ = readonly [number, number];
export type Stolpe = "vanster" | "hoger";

export type Resmal = {
  id: ResmalId;
  /** Vilken skyltstolpe skylten sitter på, och om den är den övre (längre bort) eller undre (närmare). */
  stolpe: Stolpe;
  ovre: boolean;
  /** Stigens punkter från ängens bakkant till platsen. */
  stig: readonly XZ[];
  /** Platsens mitt i fjärran: klickyta och dit kameran tittar vid resan. */
  mal: XZ;
};

/** Var platsnamnet sitter i flygvyn (x, y, z). Skogen och Grottan flyttas utåt så att namnen inte krockar på avstånd. */
export const DAL_ETIKETT_POS: Record<ResmalId | "ang", readonly [number, number, number]> = {
  skogen: [-4.6, 3.6, -15.0],
  garden: [-3.8, 2.6, -9.0],
  grottan: [4.4, 3.8, -15.0],
  sjon: [3.8, 1.8, -9.8],
  ang: [0, 1.7, 0.4],
};

/** Skyltstolparna står vid stigarnas förgreningar i ängens bakkant, bakom staketet. */
export const STOLPAR: Record<Stolpe, XZ> = {
  vanster: [-1.45, -2.6],
  hoger: [1.45, -2.65],
};

export const RESMAL: readonly Resmal[] = [
  // Skogsstigen går genom grinden i staketet (Skogsstig i byggnader.tsx, tryckGrind leder också till skogen).
  { id: "skogen", stolpe: "vanster", ovre: true, stig: [[-0.7, -2.3], [-0.8, -4.0], [-1.3, -7.0], [-2.0, -10.4], [-2.5, -12.4]], mal: [-2.9, -14.2] },
  // Block 1 (En värld): Gården är ingen egen plats längre – den finns i Hemdalen runt ängen (src/spel/dal/).
  { id: "grottan", stolpe: "hoger", ovre: true, stig: [[0.6, -2.6], [0.75, -4.4], [1.2, -8.0], [1.75, -11.0], [2.1, -12.7]], mal: [2.4, -14.4] },
  { id: "sjon", stolpe: "hoger", ovre: false, stig: [[1.45, -2.9], [1.95, -4.4], [2.2, -6.4], [2.3, -8.4]], mal: [2.6, -9.8] },
];

type VarldskartaRad = { id: string; namn: string; ikon: string; farg: string; kant: string };
const KARTA = platserJson.varldskarta as unknown as VarldskartaRad[];
const PLATSER = platserJson.platser as unknown as { id: string; namn: string }[];

/** Skyltens namn och färger ur data/platser.json. Namnet är platsens korta namn (Skogen, Sjön, Grottan); kartans
 *  längre namn (Glittrande skogen …) får inte plats på en skylt som ska gå att läsa på telefonen. Gården finns bara
 *  på världskartan. Färgerna är världskartans, så skylten och kartkortet ser likadana ut. */
export function skyltFor(id: ResmalId): { namn: string; ikon: string; farg: string; kant: string } {
  const rad = KARTA.find((r) => r.id === id);
  const kort = PLATSER.find((r) => r.id === id)?.namn;
  return { namn: kort ?? rad?.namn ?? id, ikon: rad?.ikon ?? "", farg: rad?.farg ?? "#fff6e5", kant: rad?.kant ?? "#8d6c40" };
}

export function resmalFor(id: ResmalId): Resmal | undefined {
  return RESMAL.find((r) => r.id === id);
}
