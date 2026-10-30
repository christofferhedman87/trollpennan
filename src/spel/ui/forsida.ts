// Försidan (#forsida i index.html) är det enda lagret som syns från första bildrutan: bakgrunden, loggan och
// laddningsbokstäverna. Titeln lägger sina knappar i den (portal) när ängen är redo, och när barnet trycker Börja eller
// Fortsätt tonar hela försidan ut över den levande ängen. Utan titel (prov) går försidan bort så fort ängen är redo.

export const FORSIDA_ID = "forsida";
/** Så länge tonar försidan ut (samma tid som .forsida.lamnar i titel-p2.css). */
export const UTTONING_MS = 450;

export function forsidaEl(): HTMLElement | null {
  return typeof document === "undefined" ? null : document.getElementById(FORSIDA_ID);
}

/** Tonar ut försidan och tar bort den. `klar` körs när den är borta (direkt om det inte finns någon försida). */
export function slappForsida(klar?: () => void): void {
  const el = forsidaEl();
  if (!el) {
    klar?.();
    return;
  }
  if (el.classList.contains("lamnar")) return;
  el.classList.add("lamnar");
  const snabbt = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.setTimeout(
    () => {
      el.remove();
      klar?.();
    },
    snabbt ? 0 : UTTONING_MS,
  );
}

/** Tar bort försidan direkt (felrutan ska synas). */
export function tabortForsida(): void {
  forsidaEl()?.remove();
}
