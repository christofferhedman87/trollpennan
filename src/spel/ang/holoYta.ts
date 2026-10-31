// Den fria delen av världen när Pennans bok är öppen på en låg skärm.
// Alla koordinater är sidans CSS-pixlar; kameran drar bort canvasens vänster/topp.
export type HoloYta = { left: number; top: number; right: number; bottom: number };
/** Största hela rektangeln i världen som undviker kontrollerna i deras verkliga höjdled. */
export function friHoloYta(bas: HoloYta, hinder: HoloYta[]): HoloYta | null {
  let rutor = [bas];
  for (const h of hinder) {
    rutor = rutor.flatMap((r) => {
      if (h.left >= r.right || h.right <= r.left || h.top >= r.bottom || h.bottom <= r.top) return [r];
      return [
        { ...r, right: Math.min(r.right, h.left - 8) },
        { ...r, left: Math.max(r.left, h.right + 8) },
        { ...r, bottom: Math.min(r.bottom, h.top - 8) },
        { ...r, top: Math.max(r.top, h.bottom + 8) },
      ].filter((q) => q.right > q.left && q.bottom > q.top);
    });
  }
  return rutor.sort((a, b) => (b.right - b.left) * (b.bottom - b.top) - (a.right - a.left) * (a.bottom - a.top))[0] ?? null;
}
export function bokHoloYta(canvas: DOMRect, sammansatt = false): HoloYta | null {
  const portratt = canvas.width <= canvas.height;
  if (!sammansatt && (portratt ? canvas.height > 720 : canvas.height > 600)) return null;
  const bubbla = document.querySelector('[data-s4="vaktar-aptitbubbla"]')?.getBoundingClientRect();
  const ark = document.querySelector(".sk-ark")?.getBoundingClientRect();
  const penna = document.querySelector(".sk-penn-ora")?.getBoundingClientRect();
  const stang = document.querySelector(".sk-stang")?.getBoundingClientRect();
  const gata = document.querySelector(".sk-gata")?.getBoundingClientRect();
  if (!ark || !penna || !stang) return null;
  if (sammansatt) return friHoloYta({
    left: canvas.left + 8, right: (portratt ? canvas.right : ark.left) - 8,
    top: Math.max(canvas.top + 90, (bubbla?.bottom ?? canvas.top + 82) + 8),
    bottom: (portratt ? ark.top : canvas.bottom) - 8,
  }, [penna, stang, gata].filter((r): r is DOMRect => !!r));
  if (!portratt && !bubbla) return null;
  const yta = {
    left: Math.max(canvas.left + 8, (portratt ? Math.max(stang.right, gata?.right ?? 0) : penna.right) + 8),
    right: Math.min(canvas.right - 8, (portratt ? penna.left : ark.left) - 8),
    top: Math.max(canvas.top + 90, (bubbla?.bottom ?? canvas.top + 82) + 8),
    bottom: Math.min(canvas.bottom - 8, (portratt ? ark.top : stang.top) - 8),
  };
  return yta.right > yta.left && yta.bottom > yta.top ? yta : null;
}

type SkarmRuta = { x0: number; y0: number; x1: number; y1: number };
/** Prova den verkliga perspektivprojektionen, kring ringens oförändrade markpunkt. */
export function passaHolo(projicera: (skala: number) => SkarmRuta, yta: HoloYta, minsta = 0): number {
  const r = projicera(1);
  const onskad = Math.max(1, minsta / Math.max(1, r.x1 - r.x0, r.y1 - r.y0));
  const ryms = (s: number) => {
    const q = projicera(s);
    return Object.values(q).every(Number.isFinite) && q.x0 >= yta.left && q.x1 <= yta.right && q.y0 >= yta.top && q.y1 <= yta.bottom;
  };
  if (ryms(onskad)) return onskad;
  let lag = 0, hog = onskad;
  for (let i = 0; i < 10; i++) { const mitt = (lag + hog) / 2; if (ryms(mitt)) lag = mitt; else hog = mitt; }
  return Math.max(0.1, lag * 0.98);
}
