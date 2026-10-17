import { useEffect } from "react";
import { skapaDialogIsolering } from "./dialogIsolering";
/** Fokus hålls i översta synliga dialogen och återgår till öppningsknappen. */
export function useDialogFokus() {
  useEffect(() => {
    let aktiv: HTMLElement | null = null;
    const isolering = skapaDialogIsolering();
    const ater = new Map<HTMLElement, HTMLElement | null>();
    const synlig = (el: HTMLElement) => el.getClientRects().length > 0 && !el.closest("[inert]");
    const kontroller = (el: HTMLElement) => Array.from(el.querySelectorAll<HTMLElement>(
      'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex="0"]'
    )).filter(synlig);
    const hitta = () => Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"]')).filter(synlig).at(-1) ?? null;
    const synka = () => {
      isolering.aterstall();
      const nasta = hitta();
      isolering.isolera(nasta);
      if (nasta === aktiv) return;
      const fore = aktiv;
      aktiv = nasta;
      if (fore && !fore.isConnected) {
        const mal = ater.get(fore);
        if (mal?.isConnected && synlig(mal) && (!nasta || nasta.contains(mal))) mal.focus({ preventScroll: true });
        ater.delete(fore);
      }
      if (nasta) {
        if (!ater.has(nasta)) ater.set(nasta, document.activeElement instanceof HTMLElement ? document.activeElement : null);
        if (!nasta.contains(document.activeElement)) (kontroller(nasta)[0] ?? nasta).focus({ preventScroll: true });
      } else if (fore) {
        const mal = ater.get(fore);
        if (mal?.isConnected && synlig(mal)) mal.focus({ preventScroll: true });
        ater.delete(fore);
      }
    };
    const ned = (e: KeyboardEvent) => {
      synka();
      if (!aktiv) return;
      if (e.key === "Escape") {
        const stang = aktiv.querySelector<HTMLButtonElement>('[data-dialog-close], [data-testid="stang-bok"], button.stang, button.stang-x');
        if (stang) { e.preventDefault(); e.stopImmediatePropagation(); stang.click(); }
      }
      if (e.key !== "Tab") return;
      const lista = kontroller(aktiv);
      if (!lista.length) { e.preventDefault(); return; }
      const forst = lista[0]!; const sist = lista.at(-1)!;
      if (!aktiv.contains(document.activeElement) || (e.shiftKey && document.activeElement === forst)) {
        e.preventDefault(); (e.shiftKey ? sist : forst).focus();
      } else if (!e.shiftKey && document.activeElement === sist) { e.preventDefault(); forst.focus(); }
    };
    const observer = new MutationObserver(synka);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("keydown", ned, true);
    synka();
    return () => { observer.disconnect(); isolering.aterstall(); document.removeEventListener("keydown", ned, true); };
  }, []);
}
