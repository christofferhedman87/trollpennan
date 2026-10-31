// Den fria delen av världen när Väktaren och Pennans bok delar en liggande telefon.
// Alla koordinater är sidans CSS-pixlar; kameran drar bort canvasens vänster/topp.
export type HoloYta = { left: number; top: number; right: number; bottom: number };
export function bokHoloYta(canvas: DOMRect): HoloYta | null {
  const portratt = canvas.width <= canvas.height;
  if (portratt ? canvas.height > 720 : canvas.height > 600) return null;
  const bubbla = document.querySelector('[data-s4="vaktar-aptitbubbla"]')?.getBoundingClientRect();
  const ark = document.querySelector(".sk-ark")?.getBoundingClientRect();
  const penna = document.querySelector(".sk-penn-ora")?.getBoundingClientRect();
  const stang = document.querySelector(".sk-stang")?.getBoundingClientRect();
  if (!ark || !penna || !stang || !portratt && !bubbla) return null;
  const yta = {
    left: Math.max(canvas.left + 8, (portratt ? stang.right : penna.right) + 8),
    right: Math.min(canvas.right - 8, (portratt ? penna.left : ark.left) - 8),
    top: Math.max(canvas.top + 90, (bubbla?.bottom ?? canvas.top + 82) + 8),
    bottom: Math.min(canvas.bottom - 8, (portratt ? ark.top : stang.top) - 8),
  };
  return yta.right > yta.left && yta.bottom > yta.top ? yta : null;
}

/** Skala kring ringens markpunkt. Perspektivets lilla skillnad får en extra marginal. */
export function passaHolo(r: { x0: number; y0: number; x1: number; y1: number }, x: number, y: number, yta: HoloYta): number {
  const tak = [1];
  if (r.x0 < x) tak.push((x - yta.left) / (x - r.x0));
  if (r.x1 > x) tak.push((yta.right - x) / (r.x1 - x));
  if (r.y0 < y) tak.push((y - yta.top) / (y - r.y0));
  if (r.y1 > y) tak.push((yta.bottom - y) / (r.y1 - y));
  const skala = Math.min(...tak);
  return Math.max(0.1, skala < 1 ? skala * 0.96 : 1);
}
