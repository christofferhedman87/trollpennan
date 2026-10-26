import { brygga } from "../brygga.ts";
import { fyll } from "../fyll.ts";
import { geHjarta, HUMOR, inbjudanAv, MOSSA, mossaHand } from "../liv.ts";
import { ljud } from "../ljud.ts";
import { useMinne } from "../minne.ts";
import { platsText } from "../platsText.ts";
import * as rostKo from "../rostKo.ts";
import { nyId } from "../ui/hjalp.ts";
import type { Banner } from "../ui/typer.ts";
import { useStallBanner } from "../ui/useStallBanner.ts";
import type { SpelKarna } from "./typer.ts";

export function useBannrar(k: Pick<SpelKarna, "t">) {
  const { bannerTimer, setBanners, varldRef, setBubblor } = k.t;
  /** B6.3 (H): tryck stänger bannern och tystar kön. Tiden stänger bara bannern. */
  function stangBanner(tryckt?: string) {
    if (bannerTimer.current) window.clearTimeout(bannerTimer.current);
    bannerTimer.current = null;
    setBanners([]);
    if (tryckt !== undefined) rostKo.tryck();
  }
  function slackBanner(texten: string) { const t = platsText(texten, varldRef.current); rostKo.stryk(t); setBanners((l) => l.filter((b) => b.text !== t)); }
  useStallBanner(slackBanner);
  function rensaVidHandling() {
    setBubblor([]);
  }
  function visaBanner(texten: string, slag: Banner["slag"], kalla: rostKo.Kalla, ms?: number) {
    if (arNyHandling(kalla)) setBubblor([]);
    rostKo.anmal({ text: platsText(texten, varldRef.current), kalla, banner: { slag, ms } });
  }
  function visaBubbla(rad: string, x: number, y: number, hjarta: boolean, ovan = false, ensam = false, kalla: rostKo.Kalla | null = "tapp") {
    const texten = platsText(rad, varldRef.current); // R9K: {platsen} → platsen barnet är på
    const id = nyId();
    if (kalla) rostKo.anmal({ text: texten, kalla, nyckel: `bubbla:${id}` });
    const kx = Math.min(0.78, Math.max(0.22, x));
    const ky = Math.min(0.76, Math.max(0.18, y));
    setBubblor((prev) => {
      const start = ensam ? [] : prev;
      return [...start, { id, text: texten, x: kx, y: ky, hjarta, ovan }].slice(-1);
    });
    window.setTimeout(() => { setBubblor((b) => b.filter((x) => x.id !== id)); if (kalla === "tryck") rostKo.stryk(texten); }, 4500);
  }
  function visaMossa(h: Parameters<typeof mossaHand>[0]) {
    const r = mossaHand(h);
    for (const t of r.texter) if (t) visaBanner(t, "ovr", "mossa_text");
    if (r.stj > 0) {
      useMinne.getState().geStjarnor(r.stj);
      ljud.stjarna();
      visaBanner(fyll(MOSSA.beloning.text, { n: r.stj }), "ovr", "mossa_beloning");
    }
  }
  function bjud(slag: string, uid?: string) {
    const s = useMinne.getState();
    const djur = [...s.ang, ...s.hemma.map((x) => x.spec)];
    for (const d of djur) {
      if (uid && d.uid !== uid) continue;
      if (inbjudanAv(d.uid) !== slag) continue;
      geHjarta(d.uid);
      const tack = HUMOR.tack_text[Math.floor(Math.random() * HUMOR.tack_text.length)] ?? HUMOR.tack_text[0]!;
      const p = brygga.platser().find((x) => x.uid === d.uid);
      visaBubbla(tack, p?.x ?? 0.5, p?.topp ?? p?.y ?? 0.3, true, true, false, "bjud");
    }
  }
  return { stangBanner, slackBanner, visaBanner, visaBubbla, visaMossa, bjud, rensaVidHandling };
}

/** V6: ny handling (väckt ord eller klart uppdrag) tar bort gamla pratbubblor. */
function arNyHandling(kalla: string) {
  return kalla === "skapad" || kalla === "uppdrag_klart";
}

export type Bannrar = ReturnType<typeof useBannrar>;
