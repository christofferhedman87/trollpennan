// Returskylten ("Till Ängen") och pratbubblorna (önskan, tack, djurens repliker) ligger på samma yta på utflykterna.
// Skylten ligger överst (z 35) och täckte bubblans nedre del: texten gick inte att läsa, och ett tryck mitt i bubblan
// skickade barnet hem i stället för att öppna önskan. Här räknas ut hur långt skylten måste flyttas ner för att stå fri.
// Ren logik utan DOM, så att src/spel/vagvisareUndvik.test.ts kan räkna på den. Mätningen sker i VagvisareHud.

export type Ruta = { left: number; top: number; right: number; bottom: number };

/** Bubblans svans (8 px kantlinje) ligger utanför dess rektangel. */
export const BUBBEL_SVANS = 8;
/** Luft mellan bubblans svans och skylten. */
export const LUFT = 10;

const skarVagrat = (a: Ruta, b: Ruta) => a.left < b.right && a.right > b.left;

/**
 * Hur många pixlar skylten behöver flyttas nedåt för att inte täcka någon bubbla. 0 om den redan står fri.
 * `skylt` är skyltens egen ruta utan tidigare undanflyttning. `maxBottom` är det lägsta skyltens underkant får hamna
 * (annars hamnar den över knapparna längst ner): går det inte att få plats flyttas den så långt det går.
 */
export function undvikBubblor(skylt: Ruta, bubblor: readonly Ruta[], maxBottom = Number.POSITIVE_INFINITY, svans = BUBBEL_SVANS, luft = LUFT): number {
  let dy = 0;
  // En bubbla i taget, uppifrån och ner: flyttas skylten under en bubbla kan den hamna på nästa.
  const sorterade = bubblor.filter((b) => b.right > b.left && b.bottom > b.top && skarVagrat(skylt, b)).sort((a, b) => a.top - b.top);
  for (const b of sorterade) {
    const top = skylt.top + dy;
    const bottom = skylt.bottom + dy;
    if (top < b.bottom + svans && bottom > b.top) dy = b.bottom + svans + luft - skylt.top;
  }
  return Math.max(0, Math.round(Math.min(dy, maxBottom - skylt.bottom)));
}
