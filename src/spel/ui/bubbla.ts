/** R9F: pratbubblan (max-width min(18rem, 78%), centrerad med translate(-50%)) hålls hel innanför skärmkanterna. */
export function bubblaVanster(left: string): string {
  const halv = "min(9rem, 39%) + 6px";
  return `clamp(calc(${halv}), ${left}, calc(100% - (${halv})))`;
}

export type Ruta = { top: number; bottom: number; left: number; right: number };

/** B6.1: hur många px en pratbubbla (t.ex. tackbubblan) ska skjutas nedåt för att inte ligga över en banderoll
 *  ("Guldord! …", "+2 stjärnor!") eller en tidigare bubbla. 0 = ingen krock. */
export function skjutForbi(r: Ruta, hinder: readonly Ruta[], luft = 6): number {
  let dy = 0;
  for (let varv = 0; varv < 12; varv++) {
    const k = hinder.find((h) => h.left < r.right && r.left < h.right && h.top < r.bottom + dy && r.top + dy < h.bottom);
    if (!k) break;
    dy = k.bottom + luft - r.top;
  }
  return dy;
}

/** B6.1: lägger lagrets pratbubblor fritt från banderollerna och från varandra (äldsta bubblan först). */
export function undvikKrock(lager: HTMLElement): void {
  const hinder: Ruta[] = [...lager.querySelectorAll(".banderoller .banner")].map((e) => e.getBoundingClientRect());
  for (const b of lager.querySelectorAll<HTMLElement>(":scope > [data-testid=bubbla]")) {
    b.style.marginTop = "";
    const r = b.getBoundingClientRect();
    const dy = skjutForbi(r, hinder);
    if (dy) b.style.marginTop = `${Math.ceil(dy)}px`;
    hinder.push({ top: r.top + dy, bottom: r.bottom + dy, left: r.left, right: r.right });
  }
}
